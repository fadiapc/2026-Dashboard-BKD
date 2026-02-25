using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WebApi.Models
{
    public class User
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string? Name { get; set; }

        [Required]
        [StringLength(3)]
        public required string InitialChar { get; set; }

        [Required]
        public bool IsAdmin { get; set; } = false;

        [Required]
        [StringLength(200)]
        public required string Password { get; set; }

        [Required]
        public bool IsActive { get; set; } = true;

        [StringLength(100)]
        public string? Email { get; set; }

        public List<Schedule> Schedules { get; set; } = new List<Schedule>();
    }
}

