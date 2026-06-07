using Microsoft.EntityFrameworkCore;
using WebApi.Config;
using WebApi.Models;

namespace WebApi.Data
{
    public static class Seed
    {
        public static async Task InitializeDatabaseAsync(IServiceProvider serviceProvider)
        {
            using var scope = serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<DataContext>();

            // Seed Admin
            var adminExists = await context.Users.AnyAsync(u => u.IsAdmin && u.IsActive);
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
            }

            // Seed Semesters
            if (!await context.Semesters.AnyAsync())
            {
                context.Semesters.AddRange(
                    new Semester { Name = "Ganjil 2026/2027", Date = new DateTime(2026, 8, 1), EndDate = new DateTime(2027, 1, 31), IsActive = true },
                    new Semester { Name = "Genap 2026/2027", Date = new DateTime(2027, 2, 1), EndDate = new DateTime(2027, 7, 31), IsActive = false }
                );
                await context.SaveChangesAsync();
            }

            // Seed Lecturers (Users)
            if (!await context.Users.AnyAsync(u => !u.IsAdmin))
            {
                context.Users.AddRange(
                    new User { Name = "Budi Santoso", InitialChar = "BDS", IsAdmin = false, Password = BCrypt.Net.BCrypt.HashPassword("password123"), Email = "budi@dashboard.com", IsActive = true },
                    new User { Name = "Siti Aminah", InitialChar = "STA", IsAdmin = false, Password = BCrypt.Net.BCrypt.HashPassword("password123"), Email = "siti@dashboard.com", IsActive = true }
                );
                await context.SaveChangesAsync();
            }

            // Seed Courses
            if (!await context.Courses.AnyAsync())
            {
                var activeSemester = await context.Semesters.FirstOrDefaultAsync(s => s.IsActive);
                if (activeSemester != null)
                {
                    context.Courses.AddRange(
                        new Course { Name = "Pemrograman Web", Code = "IF1234", Semesters = Course.SemesterEnum.Third, SemesterId = activeSemester.Id, Semester = activeSemester },
                        new Course { Name = "Basis Data", Code = "IF1235", Semesters = Course.SemesterEnum.Third, SemesterId = activeSemester.Id, Semester = activeSemester }
                    );
                }
            }

            await context.SaveChangesAsync();
        }
    }
}
