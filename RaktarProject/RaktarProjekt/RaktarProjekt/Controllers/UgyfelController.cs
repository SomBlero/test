using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RaktarProjekt.Database;
using RaktarProjekt.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BCrypt.Net;
using RaktarProjekt.Service;
using Microsoft.AspNetCore.Authorization;
using System.Security.Cryptography;
using System.Text.RegularExpressions;

namespace RaktarProjekt.Controllers
{
    public class UgyfelDto
    {
        public int UgyfelAzon { get; set; }
        public string Nev { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Telefonszam { get; set; }
        public DateTime RegisztracioDatuma { get; set; }
        public bool EmailMegerositve { get; set; }
        public string Role { get; set; } = "user";
        public bool EmailErtesitesek { get; set; } = true;
    }

    public class RegisterRequestDto
    {
        public string Nev { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Telefonszam { get; set; }
        public string JelszoHash { get; set; } = string.Empty;
    }
    [Route("api/[controller]")]
    [ApiController]
    public class UgyfelController : ControllerBase
    {
        private const int AktivaloKodLejaratPercek = 15;
        private const int AktivaloKodMaxProbalkozas = 5;
        private const int JelszoVisszaallitoKodLejaratPercek = 15;
        private const int JelszoVisszaallitoKodMaxProbalkozas = 5;
        private readonly RaktarContext _context;
        private readonly EmailService _emailService;
        private readonly PdfGeneratorService _pdfGeneratorService;
        private readonly ILogger<UgyfelController> _logger;
        private readonly IConfiguration _configuration;

        public UgyfelController(RaktarContext context, EmailService emailService, PdfGeneratorService pdfGeneratorService, ILogger<UgyfelController> logger, IConfiguration configuration)
        {
            _context = context;
            _emailService = emailService;
            _pdfGeneratorService = pdfGeneratorService;
            _logger = logger;
            _configuration = configuration;
        }
        [Authorize(Roles = "admin")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<UgyfelDto>>> GetUgyfelek()
        {
            return await _context.Ugyfelek
                .Select(u => new UgyfelDto
                {
                    UgyfelAzon = u.UgyfelAzon,
                    Nev = u.Nev,
                    Email = u.Email,
                    Telefonszam = u.Telefonszam,
                    RegisztracioDatuma = u.RegisztracioDatuma,
                    EmailMegerositve = u.EmailMegerositve,
                    Role = u.Role
                })
                .ToListAsync();
        }
        [Authorize]
        [HttpGet("{id}")]
        public async Task<ActionResult<UgyfelDto>> GetUgyfel(int id)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                               ?? User.FindFirst("nameid")?.Value;

            if (!int.TryParse(userIdClaim, out int userId))
                return Forbid();

            if (userId != id && !User.IsInRole("admin"))
                return Forbid();

            var ugyfel = await _context.Ugyfelek.FindAsync(id);

            if (ugyfel == null)
            {
                return NotFound();
            }

            return new UgyfelDto
            {
                UgyfelAzon = ugyfel.UgyfelAzon,
                Nev = ugyfel.Nev,
                Email = ugyfel.Email,
                Telefonszam = ugyfel.Telefonszam,
                RegisztracioDatuma = ugyfel.RegisztracioDatuma,
                EmailMegerositve = ugyfel.EmailMegerositve,
                Role = ugyfel.Role,
                EmailErtesitesek = ugyfel.EmailErtesitesek
            };
        }
        [HttpPost]
        public async Task<ActionResult<UgyfelDto>> PostUgyfel([FromBody] RegisterRequestDto request)
        {
            var createdByAdmin = User.Identity?.IsAuthenticated == true && User.IsInRole("admin");
            var nev = (request.Nev ?? string.Empty).Trim();
            var email = (request.Email ?? string.Empty).Trim().ToLowerInvariant();
            var jelszo = request.JelszoHash ?? string.Empty;

            if (string.IsNullOrWhiteSpace(nev) || string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(jelszo))
                return BadRequest(new { message = "A név, email és jelszó megadása kötelező." });

            if (!Regex.IsMatch(email, @"^[^\s@]+@[^\s@]+\.[^\s@]+$"))
                return BadRequest(new { message = "Érvénytelen email formátum." });

            if (await _context.Ugyfelek.AnyAsync(u => u.Email == email))
                return Conflict(new { message = "Ez az email cím már foglalt." });

            var ugyfel = new Ugyfel
            {
                Nev = nev,
                Email = email,
                Telefonszam = request.Telefonszam,
                Role = "user"
            };
            ugyfel.JelszoHash = PasswordHandler.HashPassword(jelszo);

            ugyfel.RegisztracioDatuma = DateTime.Now;
            ugyfel.EmailMegerositve = false;
            var aktivaloKod = createdByAdmin ? string.Empty : SetNewActivationCode(ugyfel);
            var aktivacioToken = createdByAdmin ? SetNewActivationLinkToken(ugyfel) : string.Empty;

            _context.Ugyfelek.Add(ugyfel);
            await _context.SaveChangesAsync();
            if (!string.IsNullOrWhiteSpace(ugyfel.Email))
            {
                try
                {
                    var subject = "Üdvözöljük a RaktárBérlésnél! - ABI Inc.";
                    string body;

                    if (createdByAdmin)
                    {
                        var activationLink = BuildActivationLink(ugyfel.Email, aktivacioToken);
                        var adminRegModel = new AdminRegistrationEmailTemplateModel
                        {
                            CimzettNev = ugyfel.Nev,
                            RegisztracioDatum = ugyfel.RegisztracioDatuma.ToString("yyyy.MM.dd HH:mm"),
                            AktivacioLink = activationLink
                        };
                        body = await _pdfGeneratorService.BuildAdminRegistrationEmailAsync(adminRegModel);
                    }
                    else
                    {
                        var regModel = new RegistrationEmailTemplateModel
                        {
                            CimzettNev = ugyfel.Nev,
                            RegisztracioDatum = ugyfel.RegisztracioDatuma.ToString("yyyy.MM.dd HH:mm"),
                            AktivaloKod = aktivaloKod
                        };
                        body = await _pdfGeneratorService.BuildRegistrationEmailAsync(regModel);
                    }

                    subject = createdByAdmin
                        ? "Fiókod aktiválása - RaktárBérlés"
                        : subject;

                    var emailSent = await _emailService.SendAsync(ugyfel.Email, subject, body);
                    if (emailSent)
                        _logger.LogInformation("Regisztracios e-mail sikeresen elkuldve: {Email}", ugyfel.Email);
                    else
                        _logger.LogWarning("Regisztracios e-mail NEM lett elkuldve: {Email}", ugyfel.Email);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Regisztracios e-mail kuldese sikertelen: {Email}", ugyfel.Email);
                }
            }
            else
            {
                _logger.LogWarning("Regisztracios e-mail kihagyva: az ugyfel e-mail cime ures. UgyfelAzon: {UgyfelAzon}", ugyfel.UgyfelAzon);
            }
            var dto = new UgyfelDto
            {
                UgyfelAzon = ugyfel.UgyfelAzon,
                Nev = ugyfel.Nev,
                Email = ugyfel.Email,
                Telefonszam = ugyfel.Telefonszam,
                RegisztracioDatuma = ugyfel.RegisztracioDatuma,
                EmailMegerositve = ugyfel.EmailMegerositve,
                Role = ugyfel.Role
            };

            return CreatedAtAction(nameof(GetUgyfel), new { id = ugyfel.UgyfelAzon }, dto);
        }
        [Authorize(Roles = "admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUgyfel(int id)
        {
            var ugyfel = await _context.Ugyfelek.FindAsync(id);
            if (ugyfel == null)
            {
                return NotFound();
            }

            var toroltNev = ugyfel.Nev;
            var toroltEmail = ugyfel.Email;

            _context.Ugyfelek.Remove(ugyfel);
            await _context.SaveChangesAsync();

            if (!string.IsNullOrWhiteSpace(toroltEmail))
            {
                try
                {
                    var subject = "Fiók törölve - RaktárBérlés ABI Inc.";
                    var model = new AccountDeletionEmailTemplateModel
                    {
                        CimzettNev = toroltNev,
                        TorlesIdopont = DateTime.Now.ToString("yyyy.MM.dd HH:mm")
                    };
                    var body = await _pdfGeneratorService.BuildAccountDeletionEmailAsync(model);
                    var emailSent = await _emailService.SendAsync(toroltEmail, subject, body);
                    if (emailSent)
                        _logger.LogInformation("Admin altal torolt fiok e-mail sikeresen elkuldve: {Email}", toroltEmail);
                    else
                        _logger.LogWarning("Admin altal torolt fiok e-mail NEM lett elkuldve: {Email}", toroltEmail);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Admin altal torolt fiok e-mail kuldese sikertelen: {Email}", toroltEmail);
                }
            }

            return NoContent();
        }
        [Authorize]
        [HttpDelete("{id:int}/torles")]
        public async Task<IActionResult> DeleteOwnAccount(int id, [FromBody] DeleteAccountDto dto)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                               ?? User.FindFirst("nameid")?.Value;

            if (!int.TryParse(userIdClaim, out int userId))
                return Forbid();
            if (userId != id && !User.IsInRole("admin"))
                return Forbid();

            var ugyfel = await _context.Ugyfelek.FindAsync(id);
            if (ugyfel == null)
                return NotFound(new { message = "Felhasználó nem található." });

            if (string.IsNullOrWhiteSpace(dto?.Jelszo) || !BCrypt.Net.BCrypt.Verify(dto.Jelszo, ugyfel.JelszoHash))
                return Unauthorized(new { message = "Helytelen jelszó." });
            var toroltNev = ugyfel.Nev;
            var toroltEmail = ugyfel.Email;
            var kapcsolodoBerlesek = _context.Berlesek.Where(b => b.Ugyfel_Azon == id);
            _context.Berlesek.RemoveRange(kapcsolodoBerlesek);

            _context.Ugyfelek.Remove(ugyfel);
            await _context.SaveChangesAsync();
            if (!string.IsNullOrWhiteSpace(toroltEmail))
            {
                try
                {
                    var subject = "Fiók törölve - RaktárBérlés ABI Inc.";
                    var model = new AccountDeletionEmailTemplateModel
                    {
                        CimzettNev = toroltNev,
                        TorlesIdopont = DateTime.Now.ToString("yyyy.MM.dd HH:mm")
                    };
                    var body = await _pdfGeneratorService.BuildAccountDeletionEmailAsync(model);

                    var emailSent = await _emailService.SendAsync(toroltEmail, subject, body);
                    if (emailSent)
                        _logger.LogInformation("Fioktorlesi e-mail sikeresen elkuldve: {Email}", toroltEmail);
                    else
                        _logger.LogWarning("Fioktorlesi e-mail NEM lett elkuldve: {Email}", toroltEmail);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Fioktorlesi e-mail kuldese sikertelen: {Email}", toroltEmail);
                }
            }

            return NoContent();
        }

        public class DeleteAccountDto
        {
            public string Jelszo { get; set; } = string.Empty;
        }
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request, [FromServices] TokenManager _tokenManager)
        {
            var user = await _context.Ugyfelek
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null)
                return NotFound(new { message = "Email nem található" });

            bool validPassword = BCrypt.Net.BCrypt.Verify(request.Password, user.JelszoHash);

            if (!validPassword)
                return Unauthorized(new { message = "Hibás jelszó" });

            if (!user.EmailMegerositve)
                return Unauthorized(new { message = "A bejelentkezéshez előbb meg kell erősítened az email címedet az aktiváló kóddal." });

            var token = _tokenManager.GenerateToken(user.Nev, user.Role, user.UgyfelAzon);
            return Ok(new
            {
                message = "Sikeres bejelentkezés",
                token = token,
                ugyfelNev = user.Nev,
                ugyfelAzon = user.UgyfelAzon
            });
        }

        [HttpPost("megerosites")]
        public async Task<IActionResult> ConfirmEmail([FromBody] EmailMegerositesDto dto)
        {
            var email = dto.Email?.Trim();
            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(dto.Kod))
                return BadRequest(new { message = "Az email és az aktiváló kód megadása kötelező." });

            var normalizedEmail = email.ToLowerInvariant();
            var ugyfel = await _context.Ugyfelek.FirstOrDefaultAsync(u => u.Email == normalizedEmail);
            if (ugyfel == null)
                return BadRequest(new { message = "Hibás vagy lejárt aktiváló kód." });

            if (ugyfel.EmailMegerositve)
                return Ok(new { message = "Az email cím már megerősített." });

            if (string.IsNullOrWhiteSpace(ugyfel.AktivaloKod) || ugyfel.AktivaloKodLejarat == null)
                return BadRequest(new { message = "Nincs érvényes aktiváló kód. Kérj új kódot." });

            if (ugyfel.AktivaloKodZarolvaEddig.HasValue && ugyfel.AktivaloKodZarolvaEddig > DateTime.Now)
                return BadRequest(new { message = "Túl sok hibás próbálkozás. Kérj új kódot." });

            if (ugyfel.AktivaloKodLejarat <= DateTime.Now)
                return BadRequest(new { message = "Az aktiváló kód lejárt. Kérj új kódot." });

            var kodEgyezik = PasswordHandler.VerifyPassword(dto.Kod.Trim(), ugyfel.AktivaloKod);
            if (!kodEgyezik)
            {
                ugyfel.AktivaloKodProbalkozasok += 1;
                if (ugyfel.AktivaloKodProbalkozasok >= AktivaloKodMaxProbalkozas)
                    ugyfel.AktivaloKodZarolvaEddig = DateTime.Now.AddMinutes(AktivaloKodLejaratPercek);

                await _context.SaveChangesAsync();
                return BadRequest(new { message = "Hibás vagy lejárt aktiváló kód." });
            }

            ugyfel.EmailMegerositve = true;
            ugyfel.AktivaloKod = null;
            ugyfel.AktivaloKodLejarat = null;
            ugyfel.AktivaloKodProbalkozasok = 0;
            ugyfel.AktivaloKodZarolvaEddig = null;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Email cím sikeresen megerősítve." });
        }

        [HttpGet("megerosites/link")]
        public async Task<IActionResult> ConfirmEmailByLink([FromQuery] string email, [FromQuery] string token)
        {
            var normalizedEmail = (email ?? string.Empty).Trim().ToLowerInvariant();
            var plainToken = (token ?? string.Empty).Trim();

            if (string.IsNullOrWhiteSpace(normalizedEmail) || string.IsNullOrWhiteSpace(plainToken))
                return Content(BuildActivationResultHtml(false, "Érvénytelen aktiváló link.", ""), "text/html; charset=utf-8");

            var ugyfel = await _context.Ugyfelek.FirstOrDefaultAsync(u => u.Email == normalizedEmail);
            if (ugyfel == null)
                return Content(BuildActivationResultHtml(false, "Érvénytelen vagy lejárt aktiváló link.", ""), "text/html; charset=utf-8");

            if (ugyfel.EmailMegerositve)
                return Content(BuildActivationResultHtml(true, "A fiók már aktiválva van.", _configuration["Frontend:BaseUrl"] ?? ""), "text/html; charset=utf-8");

            if (string.IsNullOrWhiteSpace(ugyfel.AktivaloKod) || ugyfel.AktivaloKodLejarat == null || ugyfel.AktivaloKodLejarat <= DateTime.Now)
                return Content(BuildActivationResultHtml(false, "Az aktiváló link lejárt. Kérj új aktiválást.", ""), "text/html; charset=utf-8");

            var tokenEgyezik = PasswordHandler.VerifyPassword(plainToken, ugyfel.AktivaloKod);
            if (!tokenEgyezik)
                return Content(BuildActivationResultHtml(false, "Érvénytelen vagy lejárt aktiváló link.", ""), "text/html; charset=utf-8");

            ugyfel.EmailMegerositve = true;
            ugyfel.AktivaloKod = null;
            ugyfel.AktivaloKodLejarat = null;
            ugyfel.AktivaloKodProbalkozasok = 0;
            ugyfel.AktivaloKodZarolvaEddig = null;
            await _context.SaveChangesAsync();

            return Content(BuildActivationResultHtml(true, "A fiók aktiválása sikeres. Most már bejelentkezhetsz.", _configuration["Frontend:BaseUrl"] ?? ""), "text/html; charset=utf-8");
        }

        [HttpPost("megerosites/ujrakuldes")]
        public async Task<IActionResult> ResendActivationCode([FromBody] UjrakuldesDto dto)
        {
            var email = dto.Email?.Trim();
            if (string.IsNullOrWhiteSpace(email))
                return BadRequest(new { message = "Az email megadása kötelező." });

            var normalizedEmail = email.ToLowerInvariant();
            var ugyfel = await _context.Ugyfelek.FirstOrDefaultAsync(u => u.Email == normalizedEmail);
            if (ugyfel == null)
                return Ok(new { message = "Ha az email cím regisztrálva van, az új aktiváló kódot elküldtük." });

            if (ugyfel.EmailMegerositve)
                return Ok(new { message = "Ha az email cím regisztrálva van, az új aktiváló kódot elküldtük." });

            var ujKod = SetNewActivationCode(ugyfel);
            await _context.SaveChangesAsync();

            if (!string.IsNullOrWhiteSpace(ugyfel.Email))
            {
                try
                {
                    var regModel = new RegistrationEmailTemplateModel
                    {
                        CimzettNev = ugyfel.Nev,
                        RegisztracioDatum = ugyfel.RegisztracioDatuma.ToString("yyyy.MM.dd HH:mm"),
                        AktivaloKod = ujKod
                    };

                    var body = await _pdfGeneratorService.BuildRegistrationEmailAsync(regModel);
                    var subject = "Aktiváló kód - RaktárBérlés";
                    await _emailService.SendAsync(ugyfel.Email, subject, body);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Aktivalo kod ujrakuldese sikertelen: {Email}", ugyfel.Email);
                }
            }

            return Ok(new { message = "Ha az email cím regisztrálva van, az új aktiváló kódot elküldtük." });
        }

        [HttpPost("jelszo-visszaallitas/keres")]
        public async Task<IActionResult> RequestPasswordReset([FromBody] PasswordResetRequestDto dto)
        {
            var email = dto.Email?.Trim();
            if (string.IsNullOrWhiteSpace(email))
                return BadRequest(new { message = "Az email megadása kötelező." });

            var normalizedEmail = email.ToLowerInvariant();
            var ugyfel = await _context.Ugyfelek.FirstOrDefaultAsync(u => u.Email == normalizedEmail);
            if (ugyfel == null)
                return Ok(new { message = "Ha az email cím regisztrálva van, a visszaállító kódot elküldtük." });

            var plainCode = SetNewPasswordResetCode(ugyfel);
            await _context.SaveChangesAsync();

            try
            {
                var model = new PasswordResetEmailTemplateModel
                {
                    CimzettNev = ugyfel.Nev,
                    VisszaallitoKod = plainCode
                };

                var body = await _pdfGeneratorService.BuildPasswordResetEmailAsync(model);
                await _emailService.SendAsync(ugyfel.Email, "Jelszó visszaállítás - RaktárBérlés", body);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Jelszo-visszaallito kod kuldese sikertelen: {Email}", ugyfel.Email);
            }

            return Ok(new { message = "Ha az email cím regisztrálva van, a visszaállító kódot elküldtük." });
        }

        [HttpPost("jelszo-visszaallitas/megerosites")]
        public async Task<IActionResult> ConfirmPasswordReset([FromBody] PasswordResetConfirmDto dto)
        {
            var email = dto.Email?.Trim();
            var kod = dto.Kod?.Trim();

            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(kod) || string.IsNullOrWhiteSpace(dto.UjJelszo))
                return BadRequest(new { message = "Az email, a kód és az új jelszó megadása kötelező." });

            if (dto.UjJelszo.Length < 8)
                return BadRequest(new { message = "Az új jelszónak legalább 8 karakter hosszúnak kell lennie." });

            var normalizedEmail = email.ToLowerInvariant();
            var ugyfel = await _context.Ugyfelek.FirstOrDefaultAsync(u => u.Email == normalizedEmail);
            if (ugyfel == null)
                return BadRequest(new { message = "Hibás vagy lejárt visszaállító kód." });

            if (string.IsNullOrWhiteSpace(ugyfel.JelszoVisszaallitoKod) || ugyfel.JelszoVisszaallitoKodLejarat == null)
                return BadRequest(new { message = "Nincs érvényes visszaállító kód. Kérj újat." });

            if (ugyfel.JelszoVisszaallitoZarolvaEddig.HasValue && ugyfel.JelszoVisszaallitoZarolvaEddig > DateTime.Now)
                return BadRequest(new { message = "Túl sok hibás próbálkozás. Kérj új kódot." });

            if (ugyfel.JelszoVisszaallitoKodLejarat <= DateTime.Now)
                return BadRequest(new { message = "A visszaállító kód lejárt. Kérj újat." });

            var kodEgyezik = PasswordHandler.VerifyPassword(kod, ugyfel.JelszoVisszaallitoKod);
            if (!kodEgyezik)
            {
                ugyfel.JelszoVisszaallitoProbalkozasok += 1;
                if (ugyfel.JelszoVisszaallitoProbalkozasok >= JelszoVisszaallitoKodMaxProbalkozas)
                    ugyfel.JelszoVisszaallitoZarolvaEddig = DateTime.Now.AddMinutes(JelszoVisszaallitoKodLejaratPercek);

                await _context.SaveChangesAsync();
                return BadRequest(new { message = "Hibás vagy lejárt visszaállító kód." });
            }

            ugyfel.JelszoHash = PasswordHandler.HashPassword(dto.UjJelszo);
            ugyfel.JelszoVisszaallitoKod = null;
            ugyfel.JelszoVisszaallitoKodLejarat = null;
            ugyfel.JelszoVisszaallitoProbalkozasok = 0;
            ugyfel.JelszoVisszaallitoZarolvaEddig = null;

            await _context.SaveChangesAsync();
            return Ok(new { message = "A jelszó sikeresen megváltozott. Most már bejelentkezhetsz." });
        }

        [Authorize(Roles = "admin")]
        [HttpPut("{id}/role")]
        public async Task<IActionResult> UpdateRole(int id, [FromBody] RoleUpdateDto dto)
        {
            var ugyfel = await _context.Ugyfelek.FindAsync(id);
            if (ugyfel == null)
                return NotFound();

            var normalizedRole = dto.Role?.Trim().ToLower();
            if (normalizedRole != "admin" && normalizedRole != "user")
                return BadRequest(new { message = "A role csak 'admin' vagy 'user' lehet." });

            ugyfel.Role = normalizedRole;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [Authorize(Roles = "admin")]
        [HttpGet("admin-check")]
        public IActionResult AdminCheck()
        {
            return Ok(new { message = "Admin jogosultság rendben." });
        }
        [Authorize]
        [HttpPut("{id}/profil")]
        public async Task<IActionResult> UpdateProfil(int id, [FromBody] ProfilUpdateDto dto)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                           ?? User.FindFirst("nameid")?.Value;
            if (!int.TryParse(userIdClaim, out int userId) || userId != id)
                return Forbid();

            var ugyfel = await _context.Ugyfelek.FindAsync(id);
            if (ugyfel == null)
                return NotFound(new { message = "Felhasználó nem található." });
            if (string.IsNullOrWhiteSpace(dto.Jelszo) || !BCrypt.Net.BCrypt.Verify(dto.Jelszo, ugyfel.JelszoHash))
                return Unauthorized(new { message = "Helytelen jelszó." });
            if (!string.IsNullOrWhiteSpace(dto.Email) && dto.Email != ugyfel.Email)
            {
                bool foglalt = await _context.Ugyfelek
                    .AnyAsync(u => u.Email == dto.Email && u.UgyfelAzon != id);
                if (foglalt)
                    return Conflict(new { message = "Ez az email cím már foglalt." });
                ugyfel.Email = dto.Email;
            }

            if (!string.IsNullOrWhiteSpace(dto.Nev))
                ugyfel.Nev = dto.Nev;
            ugyfel.Telefonszam = dto.Telefonszam;
            if (dto.EmailErtesitesek.HasValue)
                ugyfel.EmailErtesitesek = dto.EmailErtesitesek.Value;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Profil sikeresen frissítve." });
        }
        [Authorize]
        [HttpPut("{id}/ertesitesek")]
        public async Task<IActionResult> UpdateErtesitesek(int id, [FromBody] ErtesitesekDto dto)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                           ?? User.FindFirst("nameid")?.Value;
            if (!int.TryParse(userIdClaim, out int userId) || userId != id)
                return Forbid();

            var ugyfel = await _context.Ugyfelek.FindAsync(id);
            if (ugyfel == null)
                return NotFound(new { message = "Felhasználó nem található." });

            ugyfel.EmailErtesitesek = dto.EmailErtesitesek;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Értesítési beállítás mentve." });
        }
        [Authorize]
        [HttpPut("{id}/jelszo")]
        public async Task<IActionResult> UpdateJelszo(int id, [FromBody] JelszoValtoztatDto dto)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                           ?? User.FindFirst("nameid")?.Value;
            if (!int.TryParse(userIdClaim, out int userId) || userId != id)
                return Forbid();

            var ugyfel = await _context.Ugyfelek.FindAsync(id);
            if (ugyfel == null)
                return NotFound(new { message = "Felhasználó nem található." });

            if (!BCrypt.Net.BCrypt.Verify(dto.RegiJelszo, ugyfel.JelszoHash))
                return Unauthorized(new { message = "A jelenlegi jelszó helytelen." });

            ugyfel.JelszoHash = PasswordHandler.HashPassword(dto.UjJelszo);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Jelszó sikeresen megváltoztatva." });
        }

        public class ProfilUpdateDto
        {
            public string? Nev { get; set; }
            public string? Email { get; set; }
            public string? Telefonszam { get; set; }
            public string? Jelszo { get; set; }
            public bool? EmailErtesitesek { get; set; }
        }

        public class ErtesitesekDto
        {
            public bool EmailErtesitesek { get; set; }
        }

        public class JelszoValtoztatDto
        {
            public string RegiJelszo { get; set; } = string.Empty;
            public string UjJelszo { get; set; } = string.Empty;
        }

        public class RoleUpdateDto
        {
            public string Role { get; set; } = string.Empty;
        }

        public class LoginRequest
        {
            public string Email { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
        }

        public class EmailMegerositesDto
        {
            public string Email { get; set; } = string.Empty;
            public string Kod { get; set; } = string.Empty;
        }

        public class UjrakuldesDto
        {
            public string Email { get; set; } = string.Empty;
        }

        public class PasswordResetRequestDto
        {
            public string Email { get; set; } = string.Empty;
        }

        public class PasswordResetConfirmDto
        {
            public string Email { get; set; } = string.Empty;
            public string Kod { get; set; } = string.Empty;
            public string UjJelszo { get; set; } = string.Empty;
        }

        private static string GeneralAktivaloKod()
        {
            var value = RandomNumberGenerator.GetInt32(0, 1_000_000);
            return value.ToString("D6");
        }

        private static string SetNewActivationCode(Ugyfel ugyfel)
        {
            var plainCode = GeneralAktivaloKod();
            ugyfel.AktivaloKod = PasswordHandler.HashPassword(plainCode);
            ugyfel.AktivaloKodLejarat = DateTime.Now.AddMinutes(AktivaloKodLejaratPercek);
            ugyfel.AktivaloKodProbalkozasok = 0;
            ugyfel.AktivaloKodZarolvaEddig = null;
            return plainCode;
        }

        private static string SetNewActivationLinkToken(Ugyfel ugyfel)
        {
            var plainToken = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");
            ugyfel.AktivaloKod = PasswordHandler.HashPassword(plainToken);
            ugyfel.AktivaloKodLejarat = DateTime.Now.AddDays(7);
            ugyfel.AktivaloKodProbalkozasok = 0;
            ugyfel.AktivaloKodZarolvaEddig = null;
            return plainToken;
        }

        private string BuildActivationLink(string email, string token)
        {
            var baseUrl = $"{Request.Scheme}://{Request.Host}";
            return $"{baseUrl}/api/Ugyfel/megerosites/link?email={Uri.EscapeDataString(email)}&token={Uri.EscapeDataString(token)}";
        }

        private static string BuildActivationResultHtml(bool success, string message, string frontendBaseUrl)
        {
            var safeMessage = System.Net.WebUtility.HtmlEncode(message);
            var title = success ? "Fiók aktiválva" : "Aktiválás sikertelen";
            var color = success ? "#166534" : "#991b1b";
            var badge = success ? "Siker" : "Hiba";
            var loginUrl = string.IsNullOrWhiteSpace(frontendBaseUrl) ? "" : frontendBaseUrl.TrimEnd('/') + "/bejelentkezes";
            var btnHtml = success && !string.IsNullOrWhiteSpace(loginUrl)
                ? $@"<a href=""{loginUrl}"" class=""btn"">Bejelentkezés</a>"
                : "";

            return $@"<!doctype html>
                    <html lang=""hu""><head><meta charset=""utf-8"" /><meta name=""viewport"" content=""width=device-width,initial-scale=1"" />
                    <title>{title}</title>
                    <style>
                        body{{margin:0;padding:24px;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0f172a;color:#e2e8f0;font-family:'Segoe UI',Arial,sans-serif;box-sizing:border-box;}}
                        .card{{width:min(620px,100%);background:#111827;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:24px;box-shadow:0 16px 28px rgba(0,0,0,.28);}}
                        .badge{{display:inline-block;background:{color};color:#fff;padding:6px 12px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:.4px;margin-bottom:12px;}}
                        h1{{margin:0 0 10px;font-size:24px;color:#f8fafc;}}
                        p{{margin:0 0 20px;color:#cbd5e1;line-height:1.6;}}
                        .btn{{display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;padding:10px 24px;border-radius:8px;font-weight:700;font-size:15px;}}
                        .btn:hover{{background:#2563eb;}}
                    </style></head>
                    <body><div class=""card""><span class=""badge"">{badge}</span><h1>{title}</h1><p>{safeMessage}</p>{btnHtml}</div></body></html>";
        }

        private static string SetNewPasswordResetCode(Ugyfel ugyfel)
        {
            var plainCode = GeneralAktivaloKod();
            ugyfel.JelszoVisszaallitoKod = PasswordHandler.HashPassword(plainCode);
            ugyfel.JelszoVisszaallitoKodLejarat = DateTime.Now.AddMinutes(JelszoVisszaallitoKodLejaratPercek);
            ugyfel.JelszoVisszaallitoProbalkozasok = 0;
            ugyfel.JelszoVisszaallitoZarolvaEddig = null;
            return plainCode;
        }

    }
}
