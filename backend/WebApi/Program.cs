using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models; // <-- Kembali pakai .Models
using WebApi.Config;
using WebApi.Data;
using WebApi.Models;
using WebApi.Services;

var builder = WebApplication.CreateBuilder(args);
var secretPath = Path.GetFullPath(Path.Combine(builder.Environment.ContentRootPath, "..", "secret.json"));
builder.Configuration.AddJsonFile(secretPath, optional: false, reloadOnChange: true);
Secret.Initialize(builder.Configuration);

static void CheckDatabaseConnection(IServiceProvider serviceProvider)
{
    using var scope = serviceProvider.CreateScope();
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<DataContext>();
    try
    {
        context.Database.OpenConnection();
        context.Database.CloseConnection();
        Console.WriteLine("Database connection is successful");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Failed to connect to the database: {ex.Message}");
        Environment.Exit(-1);
    }
}

builder.Services.AddAuthentication(x =>
{
    x.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    x.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    x.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = Secret.JWTSecretKey
    };
    options.MapInboundClaims = false;
});

builder.Services.AddCors(options =>
{
    options.AddPolicy(
        name: "allowall",
        policy  => {
            policy.AllowAnyOrigin(); 
            policy.WithHeaders("Content-Type", "Authorization");
            policy.AllowAnyMethod();
        });
});

builder.Services.AddAuthorization();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddScoped<IEmailService, EmailService>();

// --- SWAGGER VERSI STABIL ---
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Dashboard BKD API", Version = "v1" });
    
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Masukkan token JWT dengan format: Bearer {token}",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});
// ----------------------------

builder.Services.AddDbContext<DataContext>(options => options.UseSqlServer(Secret.ConnectionString));

var app = builder.Build();

CheckDatabaseConnection(app.Services);

await Seed.InitializeDatabaseAsync(app.Services);

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthentication();
app.UseAuthorization();
app.UseCors("allowall");
app.MapControllers();

Console.WriteLine("Starting application...");
app.Run();