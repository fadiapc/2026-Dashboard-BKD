using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using WebApi.Config;
using WebApi.Data;
using WebApi.Models;

var builder = WebApplication.CreateBuilder(args);
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
            policy.AllowAnyOrigin(); // TODO: Change this to a specific origin
            policy.WithHeaders("Content-Type", "Authorization");
            policy.AllowAnyMethod();
        });
});

builder.Services.AddAuthorization();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddDbContext<DataContext>(options => options.UseSqlServer(Secret.ConnectionString));

var app = builder.Build();

CheckDatabaseConnection(app.Services);

async Task InitializeDatabaseAsync(IServiceProvider serviceProvider)
{
    using var scope = serviceProvider.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<DataContext>();
    var adminExists = await context.Users.AnyAsync(u => u.IsAdmin && u.IsActive);
    var usersCount = await context.Users.CountAsync();
    if (!adminExists)
    {

        var user = new User
        {
            Name = Secret.AdminName,
            InitialChar = Secret.AdminInitials,
            IsAdmin = true,
            Password = BCrypt.Net.BCrypt.HashPassword(Secret.AdminPassword),
            Email = "",
            IsActive = true
        };

        context.Users.Add(user);
        await context.SaveChangesAsync();
    }
}

await InitializeDatabaseAsync(app.Services);

app.UseAuthentication();
app.UseAuthorization();
app.UseCors("allowall");
app.MapControllers();

Console.WriteLine("Starting application...");
app.Run();