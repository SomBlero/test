using Microsoft.EntityFrameworkCore;
using RaktarProjekt.Database;

namespace RaktarProjekt.Service
{
    public class NyitoKodCleanupService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<NyitoKodCleanupService> _logger;

        public NyitoKodCleanupService(
            IServiceScopeFactory scopeFactory,
            ILogger<NyitoKodCleanupService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        private static string SzamoltBerlesStatusz(DateTime kezdo, DateTime veg, DateTime ma)
        {
            if (veg.Date < ma.Date) return "lejart";
            if (kezdo.Date > ma.Date) return "fuggoben";
            return "aktiv";
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var context = scope.ServiceProvider.GetRequiredService<RaktarContext>();

                    var most = DateTime.Now;
                    var ma = DateTime.Today;
                    var toroltDb = await context.NyitoKodok
                        .Where(n => n.Lejarat <= most)
                        .ExecuteDeleteAsync(stoppingToken);

                    if (toroltDb > 0)
                        _logger.LogInformation("Nyitókód cleanup: {Count} lejárt rekord törölve.", toroltDb);
                    var berlesek = await context.Berlesek
                        .Include(b => b.Ugyfel)
                        .Include(b => b.TaroloHelyiseg)
                            .ThenInclude(t => t!.Raktar)
                        .ToListAsync(stoppingToken);

                    var statusValtozasok = new List<(Models.Berles berles, string ujStatusz)>();
                    var frissitettDb = 0;

                    foreach (var berles in berlesek)
                    {
                        if (string.Equals(berles.BerlesStatusz, "torolt", StringComparison.OrdinalIgnoreCase)
                            || string.Equals(berles.BerlesStatusz, "zarolt", StringComparison.OrdinalIgnoreCase))
                            continue;

                        var ujStatusz = SzamoltBerlesStatusz(berles.KezdoDatum, berles.VegDatum, ma);
                        if (!string.Equals(berles.BerlesStatusz, ujStatusz, StringComparison.OrdinalIgnoreCase))
                        {
                            statusValtozasok.Add((berles, ujStatusz));
                            berles.BerlesStatusz = ujStatusz;
                            frissitettDb++;
                        }
                    }

                    if (frissitettDb > 0)
                    {
                        await context.SaveChangesAsync(stoppingToken);
                        _logger.LogInformation("Bérlés cleanup: {Count} rekord státusza dátum alapján szinkronizálva.", frissitettDb);
                        var emailService = scope.ServiceProvider.GetRequiredService<EmailService>();
                        var pdfService   = scope.ServiceProvider.GetRequiredService<PdfGeneratorService>();

                        foreach (var (berles, ujStatusz) in statusValtozasok)
                        {
                            if (ujStatusz != "aktiv" && ujStatusz != "lejart") continue;

                            var ugyfelEmail = berles.Ugyfel?.Email;
                            if (string.IsNullOrWhiteSpace(ugyfelEmail)) continue;

                            try
                            {
                                var model = new StatusChangeEmailTemplateModel
                                {
                                    CimzettNev   = berles.Ugyfel?.Nev ?? "Felhasznalo",
                                    FoglalasAzon = berles.BerlesAzon.ToString(),
                                    Tarolo       = $"#{berles.Tarolo_Azon}",
                                    MettolMeddig = $"{berles.KezdoDatum:yyyy.MM.dd} – {berles.VegDatum:yyyy.MM.dd}",
                                    Telephely    = berles.TaroloHelyiseg?.Raktar?.Megnevezes ?? "Ismeretlen telephely",
                                    Ar           = $"{berles.Osszeg:N0} Ft",
                                    UjStatusz    = ujStatusz
                                };

                                var htmlBody = await pdfService.BuildStatusChangeEmailAsync(model);
                                var subject  = ujStatusz == "aktiv"
                                    ? $"Bérlésed megkezdődött #{berles.BerlesAzon} - RaktarBerles ABI Inc."
                                    : $"Bérlésed lejárt #{berles.BerlesAzon} - RaktarBerles ABI Inc.";

                                await emailService.SendAsync(ugyfelEmail, subject, htmlBody);
                                _logger.LogInformation("Státuszváltás email elküldve. BerlesAzon: {BerlesAzon}, UjStatusz: {Statusz}", berles.BerlesAzon, ujStatusz);
                                Console.WriteLine($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] [STATUS-EMAIL] [OK] BerlesAzon: {berles.BerlesAzon}, UjStatusz: {ujStatusz}, Cimzett: {ugyfelEmail}");
                            }
                            catch (Exception ex)
                            {
                                _logger.LogWarning(ex, "Státuszváltás email küldése sikertelen. BerlesAzon: {BerlesAzon}", berles.BerlesAzon);
                                Console.WriteLine($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] [STATUS-EMAIL] [ERROR] BerlesAzon: {berles.BerlesAzon}, Hiba: {ex.Message}");
                            }
                        }
                    }
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    _logger.LogInformation("Nyitókód cleanup leállítása folyamatban.");
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Hiba történt a nyitókód cleanup futása közben.");
                }

                try
                {
                    await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    _logger.LogInformation("Nyitókód cleanup időzítő leállítva.");
                    break;
                }
            }
        }
    }
}

