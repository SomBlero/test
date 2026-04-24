using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RaktarProjekt.Database;
using RaktarProjekt.Models;
using System.Security.Claims;

namespace RaktarProjekt.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NyitoKodController : ControllerBase
    {
        private readonly RaktarContext _context;

        public NyitoKodController(RaktarContext context)
        {
            _context = context;
        }
        [Authorize]
        [HttpPost("/api/Nyitas/igenyles")]
        public async Task<ActionResult> NyitasIgenyles([FromBody] NyitoKodKerelemDto kerelem)
        {
            return await TarolNyitoKod(kerelem);
        }
        [Authorize]
        [HttpPost]
        public async Task<ActionResult> PostNyitoKod([FromBody] NyitoKodKerelemDto kerelem)
        {
            return await TarolNyitoKod(kerelem);
        }

        private async Task<ActionResult> TarolNyitoKod(NyitoKodKerelemDto kerelem)
        {
            var ugyfelAzonClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(ugyfelAzonClaim, out var tokenUgyfelAzon))
                return Unauthorized("A token nem tartalmaz érvényes ügyfél azonosítót.");

            if (kerelem.Berles_Azon <= 0)
                return BadRequest("A bérlés azonosító megadása kötelező.");
            if (string.IsNullOrWhiteSpace(kerelem.Kod) || kerelem.Kod.Length != 6)
                return BadRequest("A kódnak pontosan 6 karakter hosszúnak kell lennie.");
            var most = DateTime.Now;
            var maiNap = DateTime.Today;

            var berles = await _context.Berlesek.FirstOrDefaultAsync(b =>
                b.BerlesAzon == kerelem.Berles_Azon &&
                b.Ugyfel_Azon == tokenUgyfelAzon &&
                b.Tarolo_Azon == kerelem.Tarolo_Azon);

            if (berles == null)
                return StatusCode(403, "Ehhez a bérléshez nincs jogosultságod.");

            var berlesAktivMa = berles.KezdoDatum.Date <= maiNap && berles.VegDatum.Date >= maiNap;
            if (!berlesAktivMa)
                return StatusCode(403, "A nyitás csak az aktív bérlési időszakban engedélyezett.");
            var regiKod = await _context.NyitoKodok.FirstOrDefaultAsync(n =>
                n.Ugyfel_Azon == tokenUgyfelAzon &&
                n.Tarolo_Azon == kerelem.Tarolo_Azon);

            if (regiKod != null)
                _context.NyitoKodok.Remove(regiKod);
            var ujKod = new NyitoKod
            {
                Tarolo_Azon = kerelem.Tarolo_Azon,
                Ugyfel_Azon = tokenUgyfelAzon,
                Kod = kerelem.Kod,
                Lejarat = most.AddMinutes(10)
            };

            _context.NyitoKodok.Add(ujKod);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Nyitókód sikeresen elmentve.",
                lejarat = ujKod.Lejarat
            });
        }
        [HttpGet("/api/Nyitas/ellenorzes")]
        public async Task<ActionResult> EllenorzesQuery(
            [FromQuery(Name = "tarolo")] int taroloAzon,
            [FromQuery(Name = "kod")] string kod)
        {
            if (taroloAzon <= 0 || string.IsNullOrWhiteSpace(kod))
                return StatusCode(403, "Érvénytelen vagy lejárt kód.");

            var talalt = await _context.NyitoKodok.FirstOrDefaultAsync(n =>
                n.Tarolo_Azon == taroloAzon &&
                n.Kod == kod);

            if (talalt == null)
                return StatusCode(403, "Érvénytelen vagy lejárt kód.");

            if (talalt.Lejarat <= DateTime.Now)
            {
                _context.NyitoKodok.Remove(talalt);
                await _context.SaveChangesAsync();
                return StatusCode(403, "Érvénytelen vagy lejárt kód.");
            }

            return Ok(new { message = "A kód érvényes." });
        }
        [Authorize]
        [HttpGet("aktiv")]
        public async Task<ActionResult<IEnumerable<object>>> GetAktivNyitoKodok()
        {
            var ugyfelAzonClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(ugyfelAzonClaim, out var tokenUgyfelAzon))
                return Unauthorized("A token nem tartalmaz érvényes ügyfél azonosítót.");

            var most = DateTime.Now;
            var maiNap = DateTime.Today;
            var kodok = await _context.NyitoKodok
                .Where(n => n.Ugyfel_Azon == tokenUgyfelAzon && n.Lejarat > most)
                .Select(n => new
                {
                    n.Tarolo_Azon,
                    n.Kod,
                    n.Lejarat,
                    Berles_Azon = _context.Berlesek
                        .Where(b => b.Ugyfel_Azon == tokenUgyfelAzon
                            && b.Tarolo_Azon == n.Tarolo_Azon
                            && b.KezdoDatum.Date <= maiNap
                            && b.VegDatum.Date >= maiNap)
                        .Select(b => (int?)b.BerlesAzon)
                        .FirstOrDefault()
                })
                .ToListAsync();

            return Ok(kodok);
        }
        [Authorize]
        [HttpDelete("{taroloId}")]
        public async Task<ActionResult> DeleteNyitoKod(int taroloId)
        {
            var ugyfelAzonClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(ugyfelAzonClaim, out var tokenUgyfelAzon))
                return Unauthorized("A token nem tartalmaz érvényes ügyfél azonosítót.");

            var kod = await _context.NyitoKodok.FirstOrDefaultAsync(n =>
                n.Ugyfel_Azon == tokenUgyfelAzon &&
                n.Tarolo_Azon == taroloId);

            if (kod == null)
                return NotFound("Nincs aktív nyitó kód ehhez a tárolóhoz.");

            _context.NyitoKodok.Remove(kod);
            await _context.SaveChangesAsync();

            return Ok(new { message = "A tározó sikeresen bezárva." });
        }
        [NonAction]
        public async Task<ActionResult> EllenorzeNyitoKod([FromBody] NyitoKodKerelemDto kerelem)
        {
            var talalt = await _context.NyitoKodok.FirstOrDefaultAsync(n =>
                n.Tarolo_Azon == kerelem.Tarolo_Azon &&
                n.Kod == kerelem.Kod);

            if (talalt == null)
                return NotFound("Érvénytelen kód.");
            if (talalt.Lejarat < DateTime.Now)
            {
                _context.NyitoKodok.Remove(talalt);
                await _context.SaveChangesAsync();
                return BadRequest("A kód lejárt.");
            }
            _context.NyitoKodok.Remove(talalt);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Érvényes kód. A tároló kinyitható." });
        }
    }
    public class NyitoKodKerelemDto
    {
        public int Tarolo_Azon { get; set; }
        public int Berles_Azon { get; set; }
        public string Kod { get; set; } = string.Empty;
    }
}

