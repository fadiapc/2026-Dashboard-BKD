using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace WebApi.Config
{
    public static  class Secret
    {
        public static SymmetricSecurityKey JWTSecretKey { get; private set; } = new SymmetricSecurityKey(new byte[1]);
        public static int JWTExpirationInMinutes { get; private set; }
        public static string AdminName { get; private set; } = string.Empty;
        public static string AdminInitials { get; private set; } = string.Empty;
        public static string AdminPassword { get; private set; } = string.Empty;
        public static string ConnectionString { get; private set; } = string.Empty;

        // SMTP Settings
        public static string SmtpHost { get; private set; } = string.Empty;
        public static int SmtpPort { get; private set; }
        public static string SmtpEmail { get; private set; } = string.Empty;
        public static string SmtpPassword { get; private set; } = string.Empty;
        
        private static string GetRequiredSetting(IConfiguration configuration, string key)
        {
            var setting = configuration[key];
            if (string.IsNullOrEmpty(setting))
            {
                throw new Exception($"{key} is missing in appsettings.json or secret.json");
            }
            return setting;
        }

        public static void Initialize(IConfiguration configuration)
        {
            JWTSecretKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(GetRequiredSetting(configuration, "Secret:JWTSecretKey")));
            JWTExpirationInMinutes = int.Parse(GetRequiredSetting(configuration, "Secret:JWTExpirationInMinutes"));
            AdminName = GetRequiredSetting(configuration, "Secret:AdminName");
            AdminInitials = GetRequiredSetting(configuration, "Secret:AdminInitials");
            AdminPassword = GetRequiredSetting(configuration, "Secret:AdminPassword");
            ConnectionString = GetRequiredSetting(configuration, "Secret:ConnectionString");

            // SMTP Initialization
            SmtpHost = GetRequiredSetting(configuration, "SmtpSettings:Host");
            SmtpPort = int.Parse(GetRequiredSetting(configuration, "SmtpSettings:Port"));
            SmtpEmail = GetRequiredSetting(configuration, "SmtpSettings:Email");
            SmtpPassword = GetRequiredSetting(configuration, "SmtpSettings:Password");
        }
    }
}