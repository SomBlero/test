using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RaktarProjekt.Database;
using RaktarProjekt.Models;
using RaktarProjekt.Service;
using System.Security.Claims;

namespace RaktarProjekt.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BerlesController : ControllerBase
    {
        private readonly RaktarContext _context;
        private readonly EmailService _emailService;
        private readonly PdfGeneratorService _pdfGeneratorService;
        private readonly ILogger<BerlesController> _logger;

        public BerlesController(
            RaktarContext context,
            EmailService emailService,
            PdfGeneratorService pdfGeneratorService,
            ILogger<BerlesController> logger)
        {
            _context = context;
            _emailService = emailService;
            _pdfGeneratorService = pdfGeneratorService;
            _logger = logger;
        }
        private static string SzamoltBerlesStatusz(DateTime kezdo, DateTime veg, DateTime ma)
        {
            if (veg.Date < ma.Date) return "lejart";
            if (kezdo.Date > ma.Date) return "fuggoben";
            return "aktiv";
        }

        private async Task SyncBerlesStatuszokAsync()
        {
            var ma = DateTime.Today;

            var berlesek = await _context.Berlesek.ToListAsync();

            var valtozott = false;
            foreach (var berles in berlesek)
            {
                if (string.Equals(berles.BerlesStatusz, "torolt", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(berles.BerlesStatusz, "zarolt", StringComparison.OrdinalIgnoreCase))
                    continue;

                var ujStatusz = SzamoltBerlesStatusz(berles.KezdoDatum, berles.VegDatum, ma);
                if (!string.Equals(berles.BerlesStatusz, ujStatusz, StringComparison.OrdinalIgnoreCase))
                {
                    berles.BerlesStatusz = ujStatusz;
                    valtozott = true;
                }
            }

            if (valtozott)
            {
                await _context.SaveChangesAsync();
            }
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetBerlesek()
        {
            try
            {
                var adatok = await _context.Berlesek
                    .Include(b => b.Ugyfel)
                    .Include(b => b.TaroloHelyiseg)
                        .ThenInclude(t => t!.Raktar)
                    .Include(b => b.TaroloHelyiseg)
                        .ThenInclude(t => t!.ArKategoria)
                    .ToListAsync();

                var lista = adatok.Select(b => new
                {
                    berlesAzon = b.BerlesAzon,
                    ugyfelNev = b.Ugyfel?.Nev ?? "Ismeretlen",
                    raktarNev = b.TaroloHelyiseg?.Raktar?.Megnevezes ?? "Ismeretlen",
                    kategoriaNev = b.TaroloHelyiseg?.ArKategoria?.KategoriaNeve ?? "Ismeretlen",
                    kezdoDatum = b.KezdoDatum,
                    vegDatum = b.VegDatum,
                    osszeg = b.Osszeg,
                    berlesStatusz = b.BerlesStatusz
                });

                return Ok(lista);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }
        [HttpGet("idointervallumok")]
        public async Task<ActionResult<IEnumerable<object>>> GetBerlesIdointervallumok()
        {
            try
            {
                var idointervallumok = await _context.Berlesek
                    .Select(b => new
                    {
                        tarolo_azon = b.Tarolo_Azon,
                        kezdo_datum = b.KezdoDatum,
                        veg_datum = b.VegDatum
                    })
                    .ToListAsync();

                return Ok(idointervallumok);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }
        [HttpGet("elerhetoseg")]
        public async Task<ActionResult<object>> GetTaroloElerhetoseg(
            [FromQuery(Name = "kezdo_datum")] DateTime kezdoDatum,
            [FromQuery(Name = "veg_datum")] DateTime vegDatum)
        {
            if (kezdoDatum == DateTime.MinValue || vegDatum == DateTime.MinValue)
            {
                return BadRequest("A 'kezdo_datum' és 'veg_datum' query paraméterek kötelezőek.");
            }

            if (kezdoDatum > vegDatum)
            {
                return BadRequest("A kezdő dátum nem lehet nagyobb a vég dátumnál.");
            }

            var foglaltTaroloAzonok = await _context.Berlesek
                .Where(b => b.KezdoDatum <= vegDatum && b.VegDatum >= kezdoDatum)
                .Select(b => b.Tarolo_Azon)
                .Distinct()
                .ToListAsync();

            var osszesTaroloAzon = await _context.TaroloHelyisegek
                .Select(t => t.TaroloAzon)
                .ToListAsync();

            var szabadTaroloAzonok = osszesTaroloAzon
                .Except(foglaltTaroloAzonok)
                .ToList();

            return Ok(new
            {
                kezdo_datum = kezdoDatum,
                veg_datum = vegDatum,
                foglalt_tarolo_azonok = foglaltTaroloAzonok,
                szabad_tarolo_azonok = szabadTaroloAzonok
            });
        }

        [Authorize(Roles = "admin")]
        [HttpPut("{id}/lezaras")]
        public async Task<IActionResult> LezarBerles(int id)
        {
            var berles = await _context.Berlesek
                .Include(b => b.Ugyfel)
                .Include(b => b.TaroloHelyiseg)
                    .ThenInclude(t => t!.Raktar)
                .FirstOrDefaultAsync(b => b.BerlesAzon == id);
            if (berles == null) return NotFound();
            var tarolo = await _context.TaroloHelyisegek.FindAsync(berles.Tarolo_Azon);
            if (tarolo != null)
            {
                tarolo.Statusz = "szabad";
            }
            berles.BerlesStatusz = "zarolt";

            await _context.SaveChangesAsync();
            try
            {
                var ugyfelEmail = berles.Ugyfel?.Email;
                if (!string.IsNullOrWhiteSpace(ugyfelEmail))
                {
                    var model = new StatusChangeEmailTemplateModel
                    {
                        CimzettNev = berles.Ugyfel?.Nev ?? "Felhasznalo",
                        FoglalasAzon = berles.BerlesAzon.ToString(),
                        Tarolo = $"#{berles.Tarolo_Azon}",
                        MettolMeddig = $"{berles.KezdoDatum:yyyy.MM.dd} - {berles.VegDatum:yyyy.MM.dd}",
                        Telephely = berles.TaroloHelyiseg?.Raktar?.Megnevezes ?? "Ismeretlen telephely",
                        Ar = $"{berles.Osszeg:N0} Ft",
                        UjStatusz = "zarolt"
                    };

                    var htmlBody = await _pdfGeneratorService.BuildStatusChangeEmailAsync(model);
                    await _emailService.SendAsync(
                        ugyfelEmail,
                        $"Foglalás zárolva #{berles.BerlesAzon} - RaktárBérlés ABI Inc.",
                        htmlBody);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Zárolási email küldése sikertelen. BerlesAzon: {BerlesAzon}", berles.BerlesAzon);
            }

            return Ok();
        }
        [Authorize]
        [HttpGet("sajat")]
        public async Task<ActionResult<IEnumerable<object>>> GetSajatBerlesek()
        {
            var ugyfelAzonClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(ugyfelAzonClaim, out var tokenUgyfelAzon))
                return Unauthorized("A token nem tartalmaz érvényes ügyfél azonosítót.");
            var adatok = await _context.Berlesek
                .Where(b => b.Ugyfel_Azon == tokenUgyfelAzon)
                .Include(b => b.TaroloHelyiseg)
                    .ThenInclude(t => t!.Raktar)
                .Include(b => b.TaroloHelyiseg)
                    .ThenInclude(t => t!.ArKategoria)
                .ToListAsync();
            var lista = adatok.Select(b => new
            {
                statusz = (b.BerlesStatusz ?? "").ToLowerInvariant(),
                berlesId = b.BerlesAzon,
                tarolo_Azon = b.Tarolo_Azon,
                raktarNev = b.TaroloHelyiseg?.Raktar?.Megnevezes ?? "Ismeretlen",
                kategoriaNev = b.TaroloHelyiseg?.ArKategoria?.KategoriaNeve ?? "Ismeretlen",
                kezdoDatum = b.KezdoDatum,
                vegDatum = b.VegDatum,
                osszeg = b.Osszeg,
                berlesStatusz = b.BerlesStatusz,
                allapot = (b.BerlesStatusz ?? "").ToLowerInvariant() switch
                {
                    "aktiv" => "Aktív",
                    "fuggoben" => "Lefoglalva",
                    "lejart" => "Lejárt",
                    "zarolt" => "Zárolt",
                    "torolt" => "Zárolt",
                    _ => b.VegDatum < DateTime.Now ? "Lejárt" : "Aktív"
                }
            });

            return Ok(lista);
        }

        [Authorize]
        [HttpPost]
        public async Task<ActionResult> PostBerles([FromBody] Berles berles)
        {
            var ugyfelAzonClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(ugyfelAzonClaim, out var tokenUgyfelAzon))
                return Unauthorized("A token nem tartalmaz érvényes ügyfél azonosítót.");

            berles.Ugyfel_Azon = tokenUgyfelAzon;
            {
                if (berles.KezdoDatum > berles.VegDatum)
                    return BadRequest("A kezdő dátum nem lehet nagyobb a vég dátumnál.");

                var vanUtkozes = await _context.Berlesek
                    .AnyAsync(b =>
                        b.Tarolo_Azon == berles.Tarolo_Azon &&
                        b.KezdoDatum <= berles.VegDatum &&
                        b.VegDatum >= berles.KezdoDatum);

                if (vanUtkozes)
                    return BadRequest("Ez a tároló már foglalt ebben az időszakban.");

                var tarolo = await _context.TaroloHelyisegek
                    .Include(t => t.ArKategoria)
                    .Include(t => t.Raktar)
                    .FirstOrDefaultAsync(t => t.TaroloAzon == berles.Tarolo_Azon);
                if (tarolo == null)
                    return BadRequest("A megadott tároló nem létezik.");

                if (tarolo.ArKategoria == null)
                    return BadRequest("A tároló árkategóriája hiányzik.");

                if (string.Equals(tarolo.Statusz, "karbantartas", StringComparison.OrdinalIgnoreCase))
                    return BadRequest("Ez a tároló jelenleg karbantartás alatt áll, nem foglalható.");
                int napokKulonbseg = (berles.VegDatum.Date - berles.KezdoDatum.Date).Days;
                int napokSzama = napokKulonbseg + 1; 
                if (napokSzama < 1) napokSzama = 1;
                berles.Osszeg = tarolo.ArKategoria.AlapArNaponta * napokSzama;

                berles.BerlesStatusz = SzamoltBerlesStatusz(berles.KezdoDatum, berles.VegDatum, DateTime.Today);

                _context.Berlesek.Add(berles);
                await _context.SaveChangesAsync();
                try
                {
                    Console.WriteLine($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] [BOOKING-EMAIL] [INFO] Foglalasi email folyamat indult. BerlesAzon: {berles.BerlesAzon}, UgyfelAzon: {tokenUgyfelAzon}");

                    var ugyfel = await _context.Ugyfelek
                        .FirstOrDefaultAsync(u => u.UgyfelAzon == tokenUgyfelAzon);

                    if (ugyfel != null && !string.IsNullOrWhiteSpace(ugyfel.Email))
                    {
                        Console.WriteLine($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] [BOOKING-EMAIL] [INFO] Cimzett megtalalva: {ugyfel.Email}");

                        var statuszLabel = berles.BerlesStatusz?.ToLowerInvariant() switch
                        {
                            "aktiv" => "Aktív",
                            "fuggoben" => "Függő",
                            "lejart" => "Lejárt",
                            _ => "Függő"
                        };

                        var templateModel = new BookingEmailTemplateModel
                        {
                            CimzettNev = ugyfel.Nev,
                            FoglalasAzon = berles.BerlesAzon.ToString(),
                            Tarolo = $"#{berles.Tarolo_Azon}",
                            Statusz = statuszLabel,
                            MettolMeddig = $"{berles.KezdoDatum:yyyy.MM.dd} - {berles.VegDatum:yyyy.MM.dd}",
                            Telephely = tarolo.Raktar?.Megnevezes ?? "Ismeretlen telephely",
                            Ar = $"{berles.Osszeg:N0} Ft"
                        };

                        Console.WriteLine($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] [BOOKING-EMAIL] [INFO] HTML/PDF generalas indul. BerlesAzon: {berles.BerlesAzon}");
                        var document = await _pdfGeneratorService.BuildBookingConfirmationAsync(templateModel);
                        var subject = $"Foglalási visszaigazolás #{berles.BerlesAzon} - RaktarBerles ABI Inc.";
                        Console.WriteLine($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] [BOOKING-EMAIL] [INFO] PDF generalva. Meret: {document.PdfBytes.Length} byte");

                        var emailSent = await _emailService.SendAsync(
                            ugyfel.Email,
                            subject,
                            document.HtmlBody,
                            new[]
                            {
                                new EmailAttachment
                                {
                                    FileName = $"foglalas-{berles.BerlesAzon}.pdf",
                                    ContentType = "application/pdf",
                                    Content = document.PdfBytes
                                }
                            });

                        if (emailSent)
                        {
                            _logger.LogInformation("Foglalasi e-mail sikeresen elkuldve. BerlesAzon: {BerlesAzon}, Cimzett: {Email}", berles.BerlesAzon, ugyfel.Email);
                            Console.WriteLine($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] [BOOKING-EMAIL] [OK] Foglalasi email elkuldve. BerlesAzon: {berles.BerlesAzon}, Cimzett: {ugyfel.Email}");
                        }
                        else
                        {
                            _logger.LogWarning("Foglalasi e-mail NEM lett elkuldve. BerlesAzon: {BerlesAzon}, Cimzett: {Email}", berles.BerlesAzon, ugyfel.Email);
                            Console.WriteLine($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] [BOOKING-EMAIL] [WARN] Foglalasi email NEM lett elkuldve. BerlesAzon: {berles.BerlesAzon}, Cimzett: {ugyfel.Email}");
                        }
                    }
                    else
                    {
                        _logger.LogWarning("Foglalasi e-mail kihagyva: ugyfel vagy e-mail hianyzik. BerlesAzon: {BerlesAzon}, UgyfelAzon: {UgyfelAzon}", berles.BerlesAzon, tokenUgyfelAzon);
                        Console.WriteLine($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] [BOOKING-EMAIL] [WARN] Foglalasi email kihagyva: ugyfel vagy e-mail hianyzik. BerlesAzon: {berles.BerlesAzon}, UgyfelAzon: {tokenUgyfelAzon}");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Foglalasi e-mail kuldese sikertelen. BerlesAzon: {BerlesAzon}", berles.BerlesAzon);
                    Console.WriteLine($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] [BOOKING-EMAIL] [ERROR] Foglalasi email folyamat hiba. BerlesAzon: {berles.BerlesAzon}, Hiba: {ex.Message}");
                }

                return Ok(berles);
            }
        }
        [Authorize]
        [HttpPost("fizetes")]
        public async Task<ActionResult> PostFizetes([FromBody] FizetesRequestDto dto)
        {
            var ugyfelAzonClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(ugyfelAzonClaim, out var tokenUgyfelAzon))
                return Unauthorized("A token nem tartalmaz érvényes ügyfél azonosítót.");
            if (string.IsNullOrWhiteSpace(dto.Lejarat) || !System.Text.RegularExpressions.Regex.IsMatch(dto.Lejarat, @"^\d{2}/\d{2}$"))
                return BadRequest("A lejárati dátum formátuma: HH/ÉÉ (pl. 08/28).");

            var lejParts = dto.Lejarat.Split('/');
            if (!int.TryParse(lejParts[0], out var lejHo) || !int.TryParse(lejParts[1], out var lejEv)
                || lejHo < 1 || lejHo > 12)
                return BadRequest("Érvénytelen lejárati hónap.");

            var lejarat2000 = 2000 + lejEv;
            var now = DateTime.Now;
            if (lejarat2000 < now.Year || (lejarat2000 == now.Year && lejHo < now.Month))
                return BadRequest("A bankkártya lejárt.");

            if (string.IsNullOrWhiteSpace(dto.SzamlazasiCim))
                return BadRequest("A számlázási cím megadása kötelező.");

            var kartyaSzamTiszta = (dto.KartyaSzam ?? "").Replace(" ", "");
            if (dto.KezdoDatum > dto.VegDatum)
                return BadRequest("A kezdő dátum nem lehet nagyobb a vég dátumnál.");

            var vanUtkozes = await _context.Berlesek
                .AnyAsync(b =>
                    b.Tarolo_Azon == dto.Tarolo_Azon &&
                    b.KezdoDatum <= dto.VegDatum &&
                    b.VegDatum >= dto.KezdoDatum);

            if (vanUtkozes)
                return BadRequest("Ez a tároló már foglalt ebben az időszakban.");

            var tarolo = await _context.TaroloHelyisegek
                .Include(t => t.ArKategoria)
                .Include(t => t.Raktar)
                .FirstOrDefaultAsync(t => t.TaroloAzon == dto.Tarolo_Azon);
            if (tarolo == null)
                return BadRequest("A megadott tároló nem létezik.");

            if (tarolo.ArKategoria == null)
                return BadRequest("A tároló árkategóriája hiányzik.");

            if (string.Equals(tarolo.Statusz, "karbantartas", StringComparison.OrdinalIgnoreCase))
                return BadRequest("Ez a tároló jelenleg karbantartás alatt áll, nem foglalható.");

            int napokKulonbseg = (dto.VegDatum.Date - dto.KezdoDatum.Date).Days;
            int napokSzama = napokKulonbseg + 1;
            if (napokSzama < 1) napokSzama = 1;

            var berles = new Berles
            {
                Ugyfel_Azon = tokenUgyfelAzon,
                Tarolo_Azon = dto.Tarolo_Azon,
                KezdoDatum = dto.KezdoDatum,
                VegDatum = dto.VegDatum,
                Osszeg = tarolo.ArKategoria.AlapArNaponta * napokSzama,
                BerlesStatusz = SzamoltBerlesStatusz(dto.KezdoDatum, dto.VegDatum, DateTime.Today)
            };

            _context.Berlesek.Add(berles);
            await _context.SaveChangesAsync();
            try
            {
                var ugyfel = await _context.Ugyfelek.FirstOrDefaultAsync(u => u.UgyfelAzon == tokenUgyfelAzon);
                if (ugyfel != null && !string.IsNullOrWhiteSpace(ugyfel.Email))
                {
                    var kartyaUtolso4 = kartyaSzamTiszta.Length >= 4
                        ? "**** **** **** " + kartyaSzamTiszta[^4..]
                        : "****";

                    var invoiceModel = new InvoiceEmailTemplateModel
                    {
                        CimzettNev = ugyfel.Nev,
                        CimzettEmail = ugyfel.Email,
                        CimzettTelefon = ugyfel.Telefonszam ?? "-",
                        SzamlazasiCim = dto.SzamlazasiCim,
                        SzamlaSzam = $"SZAMLA-{DateTime.Now.Year}-{berles.BerlesAzon}",
                        KiallitasDatum = DateTime.Now.ToString("yyyy.MM.dd HH:mm"),
                        FoglalasAzon = berles.BerlesAzon.ToString(),
                        Tarolo = $"#{berles.Tarolo_Azon}",
                        Telephely = tarolo.Raktar?.Megnevezes ?? "Ismeretlen telephely",
                        MettolMeddig = $"{berles.KezdoDatum:yyyy.MM.dd} - {berles.VegDatum:yyyy.MM.dd}",
                        Ar = $"{berles.Osszeg:N0} Ft",
                        KartyaUtolso4 = kartyaUtolso4
                    };

                    var document = await _pdfGeneratorService.BuildInvoiceEmailAsync(invoiceModel);
                    var subject = $"Számla #{berles.BerlesAzon} - RaktarBerles ABI Inc.";

                    await _emailService.SendAsync(
                        ugyfel.Email,
                        subject,
                        document.HtmlBody,
                        new[]
                        {
                            new EmailAttachment
                            {
                                FileName = $"szamla-{berles.BerlesAzon}.pdf",
                                ContentType = "application/pdf",
                                Content = document.PdfBytes
                            }
                        });

                    Console.WriteLine($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] [INVOICE-EMAIL] [OK] Szamla elkuldve. BerlesAzon: {berles.BerlesAzon}, Cimzett: {ugyfel.Email}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Szamla email kuldese sikertelen. BerlesAzon: {BerlesAzon}", berles.BerlesAzon);
                Console.WriteLine($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] [INVOICE-EMAIL] [ERROR] BerlesAzon: {berles.BerlesAzon}, Hiba: {ex.Message}");
            }

            return Ok(berles);
        }
        [Authorize(Roles = "admin")]
        [HttpPost("admin")]
        public async Task<ActionResult> AdminPostBerles([FromBody] Berles berles)
        {
            if (berles.Ugyfel_Azon <= 0)
                return BadRequest("Az ügyfél azonosító (Ugyfel_Azon) megadása kötelező.");
            var ugyfelLetezik = await _context.Ugyfelek.AnyAsync(u => u.UgyfelAzon == berles.Ugyfel_Azon);
            if (!ugyfelLetezik)
                return BadRequest("A megadott ügyfél nem létezik.");

            if (berles.KezdoDatum > berles.VegDatum)
                return BadRequest("A kezdő dátum nem lehet nagyobb a vég dátumnál.");

            var vanUtkozes = await _context.Berlesek
                .AnyAsync(b =>
                    b.Tarolo_Azon == berles.Tarolo_Azon &&
                    b.KezdoDatum <= berles.VegDatum &&
                    b.VegDatum >= berles.KezdoDatum);

            if (vanUtkozes)
                return BadRequest("Ez a tároló már foglalt ebben az időszakban.");

            var tarolo = await _context.TaroloHelyisegek
                .Include(t => t.ArKategoria)
                .FirstOrDefaultAsync(t => t.TaroloAzon == berles.Tarolo_Azon);
            if (tarolo == null)
                return BadRequest("A megadott tároló nem létezik.");

            if (tarolo.ArKategoria == null)
                return BadRequest("A tároló árkategóriája hiányzik.");
            int napokKulonbseg = (berles.VegDatum.Date - berles.KezdoDatum.Date).Days;
            int napokSzama = napokKulonbseg + 1; 
            if (napokSzama < 1) napokSzama = 1; 
            berles.Osszeg = tarolo.ArKategoria.AlapArNaponta * napokSzama;

            berles.BerlesStatusz = SzamoltBerlesStatusz(berles.KezdoDatum, berles.VegDatum, DateTime.Today);

            _context.Berlesek.Add(berles);
            await _context.SaveChangesAsync();

            return Ok(berles);
        }
        [Authorize(Roles = "admin")]
        [HttpDelete("admin/{id}")]
        public async Task<IActionResult> AdminDeleteBerles(int id)
        {
            var berles = await _context.Berlesek.FindAsync(id);
            if (berles == null)
                return NotFound("A megadott bérlés nem létezik.");

            _context.Berlesek.Remove(berles);
            await _context.SaveChangesAsync();

            return Ok("A bérlés sikeresen törölve.");
        }
        [Authorize]
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteBerles(int id)
        {
            var ugyfelAzonClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(ugyfelAzonClaim, out var tokenUgyfelAzon))
                return Unauthorized("A token nem tartalmaz érvényes ügyfél azonosítót.");
            var berles = await _context.Berlesek
                .Include(b => b.TaroloHelyiseg)
                    .ThenInclude(t => t!.Raktar)
                .FirstOrDefaultAsync(b => b.BerlesAzon == id);
            if (berles == null)
                return NotFound("A megadott bérlés nem létezik.");
            if (berles.Ugyfel_Azon != tokenUgyfelAzon)
                return StatusCode(403, "Nincs jogosultságod törölni ezt a bérlést.");
            var ugyfel = await _context.Ugyfelek.FirstOrDefaultAsync(u => u.UgyfelAzon == tokenUgyfelAzon);
            var mentettBerlesAzon  = berles.BerlesAzon;
            var mentettTaroloAzon  = berles.Tarolo_Azon;
            var mentettKezdoDatum  = berles.KezdoDatum;
            var mentettVegDatum    = berles.VegDatum;
            var mentettOsszeg      = berles.Osszeg;
            var mentettTelephely   = berles.TaroloHelyiseg?.Raktar?.Megnevezes ?? "Ismeretlen telephely";
            _context.Berlesek.Remove(berles);
            await _context.SaveChangesAsync();
            try
            {
                if (ugyfel != null && !string.IsNullOrWhiteSpace(ugyfel.Email))
                {
                    var model = new CancellationEmailTemplateModel
                    {
                        CimzettNev    = ugyfel.Nev,
                        FoglalasAzon  = mentettBerlesAzon.ToString(),
                        Tarolo        = $"#{mentettTaroloAzon}",
                        MettolMeddig  = $"{mentettKezdoDatum:yyyy.MM.dd} – {mentettVegDatum:yyyy.MM.dd}",
                        Telephely     = mentettTelephely,
                        Ar            = $"{mentettOsszeg:N0} Ft"
                    };

                    var htmlBody = await _pdfGeneratorService.BuildCancellationEmailAsync(model);
                    await _emailService.SendAsync(
                        ugyfel.Email,
                        $"Foglalás lemondva #{mentettBerlesAzon} - RaktárBérlés ABI Inc.",
                        htmlBody);

                    Console.WriteLine($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] [CANCEL-EMAIL] [OK] Lemondasi email elkuldve. BerlesAzon: {mentettBerlesAzon}, Cimzett: {ugyfel.Email}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Lemondasi email kuldese sikertelen. BerlesAzon: {BerlesAzon}", mentettBerlesAzon);
                Console.WriteLine($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] [CANCEL-EMAIL] [ERROR] Lemondasi email hiba. BerlesAzon: {mentettBerlesAzon}, Hiba: {ex.Message}");
            }

            return Ok("A bérlés sikeresen lemondva.");
        }
    }

    public class FizetesRequestDto
    {
        public int Tarolo_Azon { get; set; }
        public DateTime KezdoDatum { get; set; }
        public DateTime VegDatum { get; set; }
        public string SzamlazasiCim { get; set; } = "";
        public string KartyaSzam { get; set; } = "";
        public string KartyaNev { get; set; } = "";
        public string Lejarat { get; set; } = "";
        public string Cvc { get; set; } = "";
    }
}
