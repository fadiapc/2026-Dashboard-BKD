using System.Net;
using System.Net.Mail;
using WebApi.Config;

namespace WebApi.Services
{
    public interface IEmailService
    {
        Task SendPasswordResetEmailAsync(string toEmail, string resetLink);
    }

    public class EmailService : IEmailService
    {
        public async Task SendPasswordResetEmailAsync(string toEmail, string resetLink)
        {
            try
            {
                var smtpClient = new SmtpClient(Secret.SmtpHost)
                {
                    Port = Secret.SmtpPort,
                    Credentials = new NetworkCredential(Secret.SmtpEmail, Secret.SmtpPassword),
                    EnableSsl = true,
                };

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(Secret.SmtpEmail, "Dashboard BKD Support"),
                    Subject = "Reset Password Anda - Dashboard BKD",
                    Body = $@"
                        <h3>Permintaan Reset Password</h3>
                        <p>Kami menerima permintaan untuk mereset password akun Anda di Dashboard BKD.</p>
                        <p>Klik tautan di bawah ini untuk mereset password Anda:</p>
                        <p><a href='{resetLink}'>{resetLink}</a></p>
                        <br/>
                        <p>Tautan ini akan kedaluwarsa dalam 15 menit.</p>
                        <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
                    ",
                    IsBodyHtml = true,
                };

                mailMessage.To.Add(toEmail);

                await smtpClient.SendMailAsync(mailMessage);
                Console.WriteLine($"[EmailService] Email sent to {toEmail} successfully.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EmailService] Failed to send email: {ex.Message}");
                throw;
            }
        }
    }
}
