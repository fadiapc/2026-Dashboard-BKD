using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WebApi.Models
{
    public class CourseType
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [ForeignKey("Course")]
        public int CourseId { get; set; }

        public enum CourseTypeEnum
        {
            Kuliah,
            Praktikum,
            Responsi
        }

        [Required]
        public CourseTypeEnum CourseTypeT { get; set; }

        [Required]
        [Range(0, int.MaxValue, ErrorMessage = "Credit must be a non-negative value.")]
        public int Credit { get; set; }

        [Required]
        public required Course Course { get; set; }

        [Required]
        public List<CourseClass> CourseClasses { get; set; } = new List<CourseClass>();
    }
}