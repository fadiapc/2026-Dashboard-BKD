using Microsoft.EntityFrameworkCore;
using WebApi.Models;

namespace WebApi.Data
{
    public partial class DataContext : DbContext
    {
        public DataContext(DbContextOptions<DataContext> options) : base(options)
        {

        }
        public DbSet<Course> Courses { get; set; }
        public DbSet<CourseType> CourseTypes { get; set; }
        public DbSet<CourseClass> CourseClasses { get; set; }
        public DbSet<Semester> Semesters { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Schedule> Schedules { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>()
                .HasIndex(u => u.InitialChar)
                .IsUnique();

            modelBuilder.Entity<User>()
                .HasKey(u => u.Id);

            modelBuilder.Entity<Course>()
                .HasMany(c => c.CourseTypes)
                .WithOne(ct => ct.Course)
                .HasForeignKey(ct => ct.CourseId);

            modelBuilder.Entity<CourseType>()
                .HasOne(ct => ct.Course)
                .WithMany(c => c.CourseTypes)
                .HasForeignKey(ct => ct.CourseId);

            modelBuilder.Entity<CourseType>()
                .HasMany(ct => ct.CourseClasses)
                .WithOne(cc => cc.CourseType)
                .HasForeignKey(cc => cc.CourseTypeId);

            modelBuilder.Entity<Semester>()
                .HasKey(x => x.Id);

            modelBuilder.Entity<Schedule>()
                .HasOne(s => s.CourseClass)
                .WithMany(cc => cc.Schedules)
                .HasForeignKey(s => s.CourseClassId);

            modelBuilder.Entity<Schedule>()
                .HasOne(s => s.User)
                .WithMany(u => u.Schedules)
                .HasForeignKey(s => s.UserId)
                .IsRequired(false);

            base.OnModelCreating(modelBuilder);
        }
    }
}