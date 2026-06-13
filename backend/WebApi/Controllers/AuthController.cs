using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using WebApi.Config;
using WebApi.Data;
using WebApi.Middleware;
using WebApi.Models;
using WebApi.Services;

namespace WebApi.Controllers
{
    [ApiController]
    [Route("/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly DataContext _context;
        private readonly IEmailService _emailService;

        public AuthController(DataContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.InitialChar == request.initial);

            if (user == null)
            {
                return Unauthorized(new { Message = "invalid username" });
            }

            if (!BCrypt.Net.BCrypt.Verify(request.password, user.Password))
            {
                return Unauthorized(new { Message = "invalid password" });
            }

            if (user.IsActive == false)
            {
                return Unauthorized(new { Message = "Your account is inactive." });
            }

            var token = GenerateJwtToken(user);

            return Ok(new
            {
                Message = "Success",
                Data = new
                {
                    id = user.Id,
                    Token = token,
                    name = user.Name,
                    initials = user.InitialChar,
                    is_admin = user.IsAdmin,
                    is_active = user.IsActive,
                }
            });
        }

        [AuthRequired]
        [HttpPut("password")]
        public async Task<IActionResult> UpdatePassword([FromBody] ChangePasswordRequest request)
        {
            try
            {
                var identity = HttpContext.User.Identity as ClaimsIdentity;
                if (identity == null)
                {
                    return BadRequest(new { Message = "Invalid token." });
                }

                var userInitial = HttpContext.User.FindFirstValue("initial");
                var user = await _context.Users.FirstOrDefaultAsync(u => u.InitialChar == userInitial);

                if (user == null)
                {
                    return NotFound(new { Message = "User not found." });
                }

                if (!BCrypt.Net.BCrypt.Verify(request.old_password, user.Password))
                {
                    return Conflict(new { Message = "Old password is incorrect." });
                }

                if (BCrypt.Net.BCrypt.Verify(request.new_password, user.Password))
                {
                    return BadRequest(new { Message = "Password baru tidak boleh sama dengan password lama Anda!" });
                }

                if (request.new_password != request.confirm_new_password)
                {
                    return BadRequest(new { Message = "New passwords do not match." });
                }

                user.Password = BCrypt.Net.BCrypt.HashPassword(request.new_password);
                _context.Users.Update(user);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    Message = "Success",
                    Data = new
                    {
                        id = user.Id,
                        name = user.Name,
                        initials = user.InitialChar,
                        is_admin = user.IsAdmin,
                        is_active = user.IsActive,
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception: {ex.Message}");
                return StatusCode(500, new { Message = "Internal Server Error", Data = ex.Message });
            }
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            // Email is not unique in DB yet, but let's find the first active user with this email
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.email && u.IsActive);
            if (user == null)
            {
                // Return generic success to prevent email enumeration
                return Ok(new { Message = "Jika email terdaftar, tautan reset telah dikirim." });
            }

            // Generate stateless JWT for reset
            var credentials = new SigningCredentials(Secret.JWTSecretKey, SecurityAlgorithms.HmacSha256);
            var claims = new[]
            {
                new Claim("id", user.Id.ToString()),
                new Claim("type", "password_reset"),
                new Claim("hash", user.Password) // include current hash to invalidate token on change
            };

            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(15), // 15 mins expiry
                signingCredentials: credentials);

            var resetToken = new JwtSecurityTokenHandler().WriteToken(token);
            
            // Dummy Frontend URL, change as needed
            var resetLink = $"https://dashboard-bkd.vercel.app/reset-password?token={resetToken}";
            
            await _emailService.SendPasswordResetEmailAsync(user.Email!, resetLink);

            return Ok(new { Message = "Jika email terdaftar, tautan reset telah dikirim." });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            if (request.new_password != request.confirm_new_password)
            {
                return BadRequest(new { Message = "Passwords do not match." });
            }

            var handler = new JwtSecurityTokenHandler();
            try
            {
                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = Secret.JWTSecretKey,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                };

                var principal = handler.ValidateToken(request.token, validationParameters, out var validatedToken);
                
                var typeClaim = principal.FindFirst("type")?.Value;
                if (typeClaim != "password_reset") return BadRequest(new { Message = "Invalid token type." });

                var userIdStr = principal.FindFirst("id")?.Value;
                var tokenHash = principal.FindFirst("hash")?.Value;

                if (userIdStr == null || tokenHash == null) return BadRequest(new { Message = "Invalid token." });

                var userId = int.Parse(userIdStr);
                var user = await _context.Users.FindAsync(userId);

                if (user == null || !user.IsActive) return BadRequest(new { Message = "User not found or inactive." });

                // Check if password has been changed since token was generated
                if (user.Password != tokenHash)
                {
                    return BadRequest(new { Message = "Token has expired or already been used." });
                }

                // Prevent reusing the exact same password
                if (BCrypt.Net.BCrypt.Verify(request.new_password, user.Password))
                {
                    return BadRequest(new { Message = "Password baru tidak boleh sama dengan password lama Anda!" });
                }

                user.Password = BCrypt.Net.BCrypt.HashPassword(request.new_password);
                _context.Users.Update(user);
                await _context.SaveChangesAsync();

                return Ok(new { Message = "Password has been successfully reset." });
            }
            catch (SecurityTokenExpiredException)
            {
                return BadRequest(new { Message = "Token has expired." });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Token validation error: {ex.Message}");
                return BadRequest(new { Message = "Invalid token." });
            }
        }

        private string GenerateJwtToken(User user)
        {
            var credentials = new SigningCredentials(Secret.JWTSecretKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim("id", user.Id.ToString()),
                new Claim("initial", user.InitialChar),
                new Claim("role", user.IsAdmin ? "admin" : "user")
            };

            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(Convert.ToDouble(Secret.JWTExpirationInMinutes)),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }

    public class LoginRequest
    {
        public required string initial { get; set; }
        public required string password { get; set; }
    }
    public class ChangePasswordRequest
    {
        public required string old_password { get; set; }
        public required string new_password { get; set; }
        public required string confirm_new_password { get; set;}
    }

    public class ForgotPasswordRequest
    {
        public required string email { get; set; }
    }

    public class ResetPasswordRequest
    {
        public required string token { get; set; }
        public required string new_password { get; set; }
        public required string confirm_new_password { get; set; }
    }
}
