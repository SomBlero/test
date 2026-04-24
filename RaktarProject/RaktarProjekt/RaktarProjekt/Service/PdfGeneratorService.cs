using System.Text.Encodings.Web;
using iText.Html2pdf;

namespace RaktarProjekt.Service
{
    public class BookingEmailTemplateModel
    {
        public string CimzettNev { get; set; } = "Felhasznalo";
        public string FoglalasAzon { get; set; } = "-";
        public string Tarolo { get; set; } = "-";
        public string Statusz { get; set; } = "Fuggo";
        public string MettolMeddig { get; set; } = "-";
        public string Telephely { get; set; } = "-";
        public string Ar { get; set; } = "-";
    }

    public class BookingDocumentResult
    {
        public string HtmlBody { get; set; } = "";
        public byte[] PdfBytes { get; set; } = Array.Empty<byte>();
    }
    public class CancellationEmailTemplateModel
    {
        public string CimzettNev { get; set; } = "Felhasznalo";
        public string FoglalasAzon { get; set; } = "-";
        public string Tarolo { get; set; } = "-";
        public string MettolMeddig { get; set; } = "-";
        public string Telephely { get; set; } = "-";
        public string Ar { get; set; } = "-";
    }
    public class StatusChangeEmailTemplateModel
    {
        public string CimzettNev { get; set; } = "Felhasznalo";
        public string FoglalasAzon { get; set; } = "-";
        public string Tarolo { get; set; } = "-";
        public string MettolMeddig { get; set; } = "-";
        public string Telephely { get; set; } = "-";
        public string Ar { get; set; } = "-";
        public string UjStatusz { get; set; } = "aktiv";
    }
    public class RegistrationEmailTemplateModel
    {
        public string CimzettNev { get; set; } = "Felhasznalo";
        public string RegisztracioDatum { get; set; } = "-";
        public string AktivaloKod { get; set; } = "------";
    }

    public class AdminRegistrationEmailTemplateModel
    {
        public string CimzettNev { get; set; } = "Felhasznalo";
        public string RegisztracioDatum { get; set; } = "-";
        public string AktivacioLink { get; set; } = string.Empty;
    }

    public class PasswordResetEmailTemplateModel
    {
        public string CimzettNev { get; set; } = "Felhasznalo";
        public string VisszaallitoKod { get; set; } = "------";
    }

    public class InvoiceEmailTemplateModel
    {
        public string CimzettNev { get; set; } = "";
        public string CimzettEmail { get; set; } = "";
        public string CimzettTelefon { get; set; } = "";
        public string SzamlazasiCim { get; set; } = "";
        public string SzamlaSzam { get; set; } = "";
        public string KiallitasDatum { get; set; } = "";
        public string FoglalasAzon { get; set; } = "";
        public string Tarolo { get; set; } = "";
        public string Telephely { get; set; } = "";
        public string MettolMeddig { get; set; } = "";
        public string Ar { get; set; } = "";
        public string KartyaUtolso4 { get; set; } = "****";
    }
    public class AccountDeletionEmailTemplateModel
    {
        public string CimzettNev { get; set; } = "Felhasznalo";
        public string TorlesIdopont { get; set; } = "-";
    }

    public class PdfGeneratorService
    {
        private readonly IWebHostEnvironment _environment;
        private readonly IConfiguration _configuration;

        public PdfGeneratorService(IWebHostEnvironment environment, IConfiguration configuration)
        {
            _environment = environment;
            _configuration = configuration;
        }
        public async Task<BookingDocumentResult> BuildBookingConfirmationAsync(BookingEmailTemplateModel model)
        {
            var templatePath = Path.Combine(_environment.ContentRootPath, "Templates", "BookingEmailTemplate.html");
            if (!File.Exists(templatePath))
                throw new FileNotFoundException("A BookingEmailTemplate.html fajl nem talalhato.", templatePath);

            var template = await File.ReadAllTextAsync(templatePath);
            var htmlBody = FillBookingTemplate(template, model);

            using var memoryStream = new MemoryStream();
            HtmlConverter.ConvertToPdf(htmlBody, memoryStream);

            return new BookingDocumentResult
            {
                HtmlBody = htmlBody,
                PdfBytes = memoryStream.ToArray()
            };
        }
        public async Task<string> BuildCancellationEmailAsync(CancellationEmailTemplateModel model)
        {
            var templatePath = Path.Combine(_environment.ContentRootPath, "Templates", "CancellationEmailTemplate.html");
            if (!File.Exists(templatePath))
                throw new FileNotFoundException("A CancellationEmailTemplate.html fajl nem talalhato.", templatePath);

            var template = await File.ReadAllTextAsync(templatePath);
            return template
                .Replace("{{CIMZETT_NEV}}", HtmlEncoder.Default.Encode(model.CimzettNev))
                .Replace("{{FOGLALAS_AZON}}", HtmlEncoder.Default.Encode(model.FoglalasAzon))
                .Replace("{{TAROLO}}", HtmlEncoder.Default.Encode(model.Tarolo))
                .Replace("{{METTOL_MEDDIG}}", HtmlEncoder.Default.Encode(model.MettolMeddig))
                .Replace("{{TELEPHELY}}", HtmlEncoder.Default.Encode(model.Telephely))
                .Replace("{{AR}}", HtmlEncoder.Default.Encode(model.Ar));
        }
        public async Task<string> BuildStatusChangeEmailAsync(StatusChangeEmailTemplateModel model)
        {
            var templatePath = Path.Combine(_environment.ContentRootPath, "Templates", "RentalStatusEmailTemplate.html");
            if (!File.Exists(templatePath))
                throw new FileNotFoundException("A RentalStatusEmailTemplate.html fajl nem talalhato.", templatePath);

            var template = await File.ReadAllTextAsync(templatePath);

            var ujStatusz = (model.UjStatusz ?? string.Empty).Trim().ToLowerInvariant();
            var headerClass = ujStatusz switch
            {
                "aktiv" => "header-aktiv",
                "zarolt" => "header-zarolt",
                "torolt" => "header-zarolt",
                _ => "header-lejart"
            };
            var emailCim = ujStatusz switch
            {
                "aktiv" => "Bérlésed megkezdődött",
                "zarolt" => "Bérlésed zárolva lett",
                "torolt" => "Bérlésed zárolva lett",
                _ => "Bérlésed lejárt"
            };
            var emailUzenet = ujStatusz switch
            {
                "aktiv" => "Örömmel értesítünk, hogy bérlésed ma megkezdődött. Jó tárolást kívánunk!",
                "zarolt" => "Értesítünk, hogy bérlésed adminisztrátori zárolásra került, ezért a tároló a továbbiakban nem használható.",
                "torolt" => "Értesítünk, hogy bérlésed adminisztrátori zárolásra került, ezért a tároló a továbbiakban nem használható.",
                _ => "Értesítünk, hogy bérlési időszakod lezárult. Köszönjük, hogy minket választottál!"
            };
            var statusClass = ujStatusz switch
            {
                "aktiv" => "status-active",
                "zarolt" => "status-locked",
                "torolt" => "status-locked",
                _ => "status-expired"
            };
            var statuszLabel = ujStatusz switch
            {
                "aktiv" => "Aktív",
                "zarolt" => "Zárolt",
                "torolt" => "Zárolt",
                _ => "Lejárt"
            };

            return template
                .Replace("{{CIMZETT_NEV}}", HtmlEncoder.Default.Encode(model.CimzettNev))
                .Replace("{{FOGLALAS_AZON}}", HtmlEncoder.Default.Encode(model.FoglalasAzon))
                .Replace("{{TAROLO}}", HtmlEncoder.Default.Encode(model.Tarolo))
                .Replace("{{METTOL_MEDDIG}}", HtmlEncoder.Default.Encode(model.MettolMeddig))
                .Replace("{{TELEPHELY}}", HtmlEncoder.Default.Encode(model.Telephely))
                .Replace("{{AR}}", HtmlEncoder.Default.Encode(model.Ar))
                .Replace("{{UJ_STATUSZ}}", statuszLabel)
                .Replace("{{STATUS_CLASS}}", statusClass)
                .Replace("{{HEADER_CLASS}}", headerClass)
                .Replace("{{EMAIL_CIM}}", emailCim)
                .Replace("{{EMAIL_UZENET}}", emailUzenet);
        }
        public async Task<string> BuildRegistrationEmailAsync(RegistrationEmailTemplateModel model)
        {
            var templatePath = Path.Combine(_environment.ContentRootPath, "Templates", "RegistrationEmailTemplate.html");
            if (!File.Exists(templatePath))
                throw new FileNotFoundException("A RegistrationEmailTemplate.html fájl nem található.", templatePath);

            var template = await File.ReadAllTextAsync(templatePath);

            return template
                .Replace("{{CIMZETT_NEV}}", HtmlEncoder.Default.Encode(model.CimzettNev))
                .Replace("{{REGISZTRACIO_DATUM}}", HtmlEncoder.Default.Encode(model.RegisztracioDatum))
                .Replace("{{AKTIVALO_KOD}}", HtmlEncoder.Default.Encode(model.AktivaloKod));
        }

        public async Task<string> BuildAdminRegistrationEmailAsync(AdminRegistrationEmailTemplateModel model)
        {
            var templatePath = Path.Combine(_environment.ContentRootPath, "Templates", "AdminRegistrationEmailTemplate.html");
            if (!File.Exists(templatePath))
                throw new FileNotFoundException("A AdminRegistrationEmailTemplate.html fájl nem található.", templatePath);

            var template = await File.ReadAllTextAsync(templatePath);

            return template
                .Replace("{{CIMZETT_NEV}}", HtmlEncoder.Default.Encode(model.CimzettNev))
                .Replace("{{REGISZTRACIO_DATUM}}", HtmlEncoder.Default.Encode(model.RegisztracioDatum))
                .Replace("{{AKTIVACIO_LINK}}", HtmlEncoder.Default.Encode(model.AktivacioLink));
        }

        public async Task<string> BuildPasswordResetEmailAsync(PasswordResetEmailTemplateModel model)
        {
            var templatePath = Path.Combine(_environment.ContentRootPath, "Templates", "PasswordResetEmailTemplate.html");
            if (!File.Exists(templatePath))
                throw new FileNotFoundException("A PasswordResetEmailTemplate.html fajl nem talalhato.", templatePath);

            var template = await File.ReadAllTextAsync(templatePath);

            return template
                .Replace("{{CIMZETT_NEV}}", HtmlEncoder.Default.Encode(model.CimzettNev))
                .Replace("{{VISSZAALLITO_KOD}}", HtmlEncoder.Default.Encode(model.VisszaallitoKod));
        }
        public async Task<BookingDocumentResult> BuildInvoiceEmailAsync(InvoiceEmailTemplateModel model)
        {
            var templatePath = Path.Combine(_environment.ContentRootPath, "Templates", "InvoiceEmailTemplate.html");
            if (!File.Exists(templatePath))
                throw new FileNotFoundException("Az InvoiceEmailTemplate.html fajl nem talalhato.", templatePath);

            var template = await File.ReadAllTextAsync(templatePath);
            var htmlBody = template
                .Replace("{{CIMZETT_NEV}}", HtmlEncoder.Default.Encode(model.CimzettNev))
                .Replace("{{CIMZETT_EMAIL}}", HtmlEncoder.Default.Encode(model.CimzettEmail))
                .Replace("{{CIMZETT_TELEFON}}", HtmlEncoder.Default.Encode(model.CimzettTelefon))
                .Replace("{{SZAMLAZASI_CIM}}", HtmlEncoder.Default.Encode(model.SzamlazasiCim))
                .Replace("{{SZAMLA_SZAM}}", HtmlEncoder.Default.Encode(model.SzamlaSzam))
                .Replace("{{KIALLITAS_DATUM}}", HtmlEncoder.Default.Encode(model.KiallitasDatum))
                .Replace("{{FOGLALAS_AZON}}", HtmlEncoder.Default.Encode(model.FoglalasAzon))
                .Replace("{{TAROLO}}", HtmlEncoder.Default.Encode(model.Tarolo))
                .Replace("{{TELEPHELY}}", HtmlEncoder.Default.Encode(model.Telephely))
                .Replace("{{METTOL_MEDDIG}}", HtmlEncoder.Default.Encode(model.MettolMeddig))
                .Replace("{{AR}}", HtmlEncoder.Default.Encode(model.Ar))
                .Replace("{{KARTYA_UTOLSO4}}", HtmlEncoder.Default.Encode(model.KartyaUtolso4));

            using var memoryStream = new MemoryStream();
            HtmlConverter.ConvertToPdf(htmlBody, memoryStream);

            return new BookingDocumentResult
            {
                HtmlBody = htmlBody,
                PdfBytes = memoryStream.ToArray()
            };
        }
        public async Task<string> BuildAccountDeletionEmailAsync(AccountDeletionEmailTemplateModel model)
        {
            var templatePath = Path.Combine(_environment.ContentRootPath, "Templates", "AccountDeletionEmailTemplate.html");
            if (!File.Exists(templatePath))
                throw new FileNotFoundException("A AccountDeletionEmailTemplate.html fajl nem talalhato.", templatePath);

            var template = await File.ReadAllTextAsync(templatePath);
            return template
                .Replace("{{CIMZETT_NEV}}", HtmlEncoder.Default.Encode(model.CimzettNev))
                .Replace("{{TORLES_IDOPONT}}", HtmlEncoder.Default.Encode(model.TorlesIdopont));
        }

        private static string FillBookingTemplate(string template, BookingEmailTemplateModel model)
        {
            var statusClass = model.Statusz.Trim().ToLowerInvariant() switch
            {
                "aktív" => "status-active",
                "aktiv" => "status-active",
                "függő" => "status-pending",
                "fuggo" => "status-pending",
                "fuggoben" => "status-pending",
                "lejárt" => "status-expired",
                "lejart" => "status-expired",
                _ => "status-pending"
            };

            return template
                .Replace("{{CIMZETT_NEV}}", HtmlEncoder.Default.Encode(model.CimzettNev))
                .Replace("{{FOGLALAS_AZON}}", HtmlEncoder.Default.Encode(model.FoglalasAzon))
                .Replace("{{TAROLO}}", HtmlEncoder.Default.Encode(model.Tarolo))
                .Replace("{{STATUSZ}}", HtmlEncoder.Default.Encode(model.Statusz))
                .Replace("{{STATUS_CLASS}}", statusClass)
                .Replace("{{METTOL_MEDDIG}}", HtmlEncoder.Default.Encode(model.MettolMeddig))
                .Replace("{{TELEPHELY}}", HtmlEncoder.Default.Encode(model.Telephely))
                .Replace("{{AR}}", HtmlEncoder.Default.Encode(model.Ar));
        }
    }
}

