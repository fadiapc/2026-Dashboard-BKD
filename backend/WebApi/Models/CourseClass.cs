using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WebApi.Models
{
    public class CourseClass
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [ForeignKey("CourseType")]
        [Required]
        public int CourseTypeId { get; set; }

        [Required]
        public ClassNumberEnum Number { get; set; }

        public List<Schedule> Schedules { get; set; } = new List<Schedule>();

        public required CourseType CourseType { get; set; }
        public enum ClassNumberEnum
        {
            One = 1,
            Two,
            Three,
            Four,
            Five,
            Six,
            Seven,
            Eight,
            Nine,
            Ten,
            Eleven,
            Twelve,
            Thirteen,
            Fourteen
        }
    }
}