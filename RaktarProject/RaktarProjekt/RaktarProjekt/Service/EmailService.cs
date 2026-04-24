using System.Net;
using System.Net.Mail;

namespace RaktarProjekt.Service
{
    public class EmailAttachment
    {
        public string FileName { get; set; } = "attachment.bin";
        public string ContentType { get; set; } = "application/octet-stream";
        public byte[] Content { get; set; } = Array.Empty<byte>();
    }

    public class SmtpOptions
    {
        public bool Enabled { get; set; }
        public string Host { get; set; } = "";
        public int Port { get; set; } = 587;
        public bool UseSsl { get; set; } = true;
        public string User { get; set; } = "";
        public string Password { get; set; } = "";
        public string FromEmail { get; set; } = "";
        public string FromName { get; set; } = "RaktarBerles";
    }

    public class EmailService
    {
        private readonly SmtpOptions _options;
        private readonly ILogger<EmailService> _logger;

        private static void WriteConsole(string level, string message)
        {
            Console.WriteLine($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] [EMAIL] [{level}] {message}");
        }

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _logger = logger;
            _options = configuration.GetSection("Smtp").Get<SmtpOptions>() ?? new SmtpOptions();
        }

        public bool IsEnabled => _options.Enabled;

        public async Task<bool> SendAsync(
            string toEmail,
            string subject,
            string htmlBody,
            IEnumerable<EmailAttachment>? attachments = null)
        {
            if (!IsEnabled)
            {
                _logger.LogInformation("SMTP kuldes kihagyva: Smtp:Enabled=false");
                WriteConsole("INFO", "SMTP kuldes kihagyva: Smtp:Enabled=false");
                return false;
            }

            if (string.IsNullOrWhiteSpace(toEmail))
            {
                _logger.LogWarning("SMTP kuldes kihagyva: cimzett e-mail ures");
                WriteConsole("WARN", "SMTP kuldes kihagyva: cimzett e-mail ures");
                return false;
            }

            if (string.IsNullOrWhiteSpace(_options.Host) || string.IsNullOrWhiteSpace(_options.FromEmail))
            {
                _logger.LogWarning("SMTP kuldes kihagyva: hianyos SMTP konfiguracio");
                WriteConsole("WARN", "SMTP kuldes kihagyva: hianyos SMTP konfiguracio");
                return false;
            }

            try
            {
                using var client = new SmtpClient(_options.Host, _options.Port)
                {
                    EnableSsl = _options.UseSsl,
                    DeliveryMethod = SmtpDeliveryMethod.Network,
                    Credentials = string.IsNullOrWhiteSpace(_options.User)
                        ? CredentialCache.DefaultNetworkCredentials
                        : new NetworkCredential(_options.User, _options.Password)
                };

                using var message = new MailMessage
                {
                    From = new MailAddress(_options.FromEmail, _options.FromName),
                    Subject = subject,
                    Body = htmlBody,
                    IsBodyHtml = true
                };

                message.To.Add(toEmail);
                var attachedCount = 0;

                if (attachments != null)
                {
                    foreach (var item in attachments)
                    {
                        if (item.Content.Length == 0)
                            continue;

                        var stream = new MemoryStream(item.Content);
                        var attachment = new Attachment(stream, item.FileName, item.ContentType);
                        message.Attachments.Add(attachment);
                        attachedCount++;
                    }
                }

                await client.SendMailAsync(message);
                _logger.LogInformation("SMTP kuldes sikeres: {ToEmail}, Targy: {Subject}, Csatolmanyok: {AttachmentCount}", toEmail, subject, attachedCount);
                WriteConsole("OK", $"SMTP kuldes sikeres: {toEmail}, targy: {subject}, csatolmanyok: {attachedCount}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "SMTP kuldes sikertelen: {ToEmail}", toEmail);
                WriteConsole("ERROR", $"SMTP kuldes sikertelen: {toEmail}, hiba: {ex.Message}");
                return false;
            }
        }
    }
}
