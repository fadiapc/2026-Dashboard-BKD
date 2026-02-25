using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WebApi.Models
{
    public class Course
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [ForeignKey("Semester")]
        public int SemesterId { get; set; }

        [Required]
        [StringLength(50)]
        public required string Name { get; set; }

        [Required]
        [StringLength(7)]
        public required string Code { get; set; }

        [Required]
        [Range(1, 14, ErrorMessage = "Semester must be between 1 and 14.")]
        public SemesterEnum Semesters { get; set; }
        public List<CourseType> CourseTypes { get; set; } = new List<CourseType>();

        public required Semester Semester { get; set; }

        public enum SemesterEnum
        {
            First = 1,
            Second = 2,
            Third = 3,
            Fourth = 4,
            Fifth = 5,
            Sixth = 6,
            Seventh = 7,
            Eighth = 8,
            Ninth = 9,
            Tenth = 10,
            Eleventh = 11,
            Twelfth = 12,
            Thirteenth = 13,
            Fourteenth = 14
        }
    }
}
