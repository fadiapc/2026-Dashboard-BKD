using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WebApi.Models
{
    public class Schedule
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [ForeignKey("User")]
        public int? UserId { get; set; }

        [ForeignKey("CourseClass")]
        [Required]
        public int CourseClassId { get; set; }

        [Required]
        public int MeetNumber { get; set; }

        public required CourseClass CourseClass { get; set; }
        public User? User { get; set; }
    }
}