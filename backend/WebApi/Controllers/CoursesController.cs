using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApi.Data;
using WebApi.Middleware;
using WebApi.Models;

namespace WebApi.Controllers
{
    [ApiController]
    [AuthRequired]
    [Route("/[controller]")]
    public class CoursesController : ControllerBase
    {
        private readonly DataContext _context;

        public CoursesController(DataContext context)
        {
            _context = context;
        }

        [HttpPost]
        [AdminRequired]
        public async Task<ActionResult<Course>> CreateCourse([FromBody] CourseRequestModel request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }
                if (_context.Courses.Any(c => c.Code == request.code) && _context.Courses.Any(c => c.SemesterId == request.semester_id))
                {
                    return Conflict(new { Message = "Course with the same code already exists in the semester", Data = request.code });
                }

                var semester = await _context.Semesters.FindAsync(request.semester_id);
                if (semester == null)
                {
                    return NotFound(new { Message = "Semester not found", Data = request.semester_id });
                }

                var newCourse = new Course
                {
                    SemesterId = request.semester_id,
                    Name = request.name,
                    Code = request.code,
                    Semesters = (Course.SemesterEnum)request.semesters,
                    CourseTypes = new List<CourseType>(),
                    Semester = semester
                };

                foreach (var ct in request.course_type)
                {
                    var newCourseType = new CourseType
                    {
                        CourseTypeT = (CourseType.CourseTypeEnum)ct.type,
                        Credit = ct.credit,
                        Course = newCourse
                    };

                    newCourse.CourseTypes.Add(newCourseType);
                }

                for (int i = 0; i < newCourse.CourseTypes.Count; i++)
                {
                    var ct = request.course_type[i];
                    var newCourseType = newCourse.CourseTypes.ElementAt(i);

                    newCourseType.CourseClasses = new List<CourseClass>();

                    for (int j = 1; j <= ct.class_count; j++)
                    {
                        var newCourseClass = new CourseClass
                        {
                            Number = (CourseClass.ClassNumberEnum)j,
                            CourseType = newCourseType
                        };

                        for (int k = 1; k <= 14; k++)
                        {
                            var newSchedule = new Schedule
                            {
                                MeetNumber = k,
                                CourseClass = newCourseClass
                            };
                            newCourseClass.Schedules.Add(newSchedule);
                        }

                        newCourseType.CourseClasses.Add(newCourseClass);
                    }
                }

                await _context.Courses.AddAsync(newCourse);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetCourse), new { id = newCourse.Id }, new { Message = "success", Data = MapToResponseModel(newCourse, semester.Date) });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception: {ex.Message}");

                return StatusCode(500, new { Message = "Internal Server Error", Data = ex.Message });
            }
        }

        [HttpGet]
        public async Task<ActionResult<Course>> GetCourse()
        {
            try
            {
                // get courses that its semester object is active
                var courses = await _context.Courses
                    .Where(c => c.Semester.IsActive)
                    .ToListAsync();

                if (courses == null)
                {
                    return NotFound(new { Message = "Courses not found" });
                }

                return Ok(new { Message = "success", Data = courses });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception: {ex.Message}");

                return StatusCode(500, new { Message = "Internal Server Error", Data = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Course>> GetCourse(int id)
        {
            try
            {
                var course = await _context.Courses
                    .Include(c => c.CourseTypes)
                        .ThenInclude(ct => ct.CourseClasses)
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (course == null)
                {
                    return NotFound(new { Message = "Course not found", Data = id });
                }
                var semester = await _context.Semesters.FindAsync(course.SemesterId);
                if (semester == null)
                {
                    return NotFound(new { Message = "Semester not found", Data = course.SemesterId });
                }

                return Ok(new { Message = "success", Data = MapToResponseModel(course, semester.Date) });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception: {ex.Message}");

                return StatusCode(500, new { Message = "Internal Server Error", Data = ex.Message });
            }
        }

        [HttpDelete]
        [Route("{id}")]
        [AdminRequired]
        /* public async Task<IActionResult> Delete(int id)
        {
            using (var transaction = await _context.Database.BeginTransactionAsync())
            {
                try
                {
                    var semester = await _context.Semesters.FindAsync(id);
                    if (semester == null)
                    {
                        return NotFound(new { message = "Semester not found" });
                    }

                    if (semester.IsActive)
                    {
                        return BadRequest(new { message = "Cannot delete an active semester" });
                    }

                    // Retrieve and delete related Courses
                    var courses = await _context.Courses.Where(c => c.SemesterId == id).ToListAsync();
                    foreach (var course in courses)
                    {
                        // Retrieve and delete related CourseTypes
                        var courseTypes = await _context.CourseTypes.Where(ct => ct.CourseId == course.Id).ToListAsync();
                        foreach (var courseType in courseTypes)
                        {
                            // Retrieve and delete related CourseClasses
                            var courseClasses = await _context.CourseClasses.Where(cc => cc.CourseTypeId == courseType.Id).ToListAsync();
                            _context.CourseClasses.RemoveRange(courseClasses);

                            // Retrieve and delete related Schedules
                            var schedules = await _context.Schedules.Where(s => s.CourseClassId == courseType.Id).ToListAsync();
                            _context.Schedules.RemoveRange(schedules);
                        }
                        _context.CourseTypes.RemoveRange(courseTypes);
                    }
                    _context.Courses.RemoveRange(courses);

                    // Finally, delete the Semester
                    _context.Semesters.Remove(semester);

                    // Save changes and commit the transaction
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return Ok(new { message = "Semester and related data deleted successfully" });
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    return StatusCode(500, new { message = "An error occurred while deleting the semester", error = ex.Message });
                }
            }
        } */
        public async Task<ActionResult<Course>> DeleteCourse(int id)
        {
            try
            {
                var course = await _context.Courses
                    .Include(c => c.CourseTypes)
                        .ThenInclude(ct => ct.CourseClasses)
                            .ThenInclude(cc => cc.Schedules)
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (course == null)
                {
                    return NotFound(new { Message = "Course not found", Data = id });
                }

                using (var transaction = await _context.Database.BeginTransactionAsync())
                {
                    try
                    {
                        foreach (var courseType in course.CourseTypes)
                        {
                            foreach (var courseClass in courseType.CourseClasses)
                            {
                                _context.Schedules.RemoveRange(courseClass.Schedules);
                            }
                            _context.CourseClasses.RemoveRange(courseType.CourseClasses);
                        }
                        _context.CourseTypes.RemoveRange(course.CourseTypes);
                        _context.Courses.Remove(course);

                        await _context.SaveChangesAsync();
                        await transaction.CommitAsync();

                        return Ok(new { Message = "Course deleted successfully", Data = id });
                    }
                    catch (Exception ex)
                    {
                        await transaction.RollbackAsync();
                        return StatusCode(500, new { Message = "An error occurred while deleting the course", Data = ex.Message });
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception: {ex.Message}");

                return StatusCode(500, new { Message = "Internal Server Error", Data = ex.Message });
            }
        }

        [HttpGet("class/{id}")]
        public async Task<ActionResult<CourseClass>> GetCourseClass(int id)
        {
            try
            {
                var courseClass = await _context.CourseClasses
                    .Include(cc => cc.CourseType)
                        .ThenInclude(ct => ct.Course)
                    .Include(cc => cc.Schedules)
                        .ThenInclude(s => s.User)
                    .FirstOrDefaultAsync(cc => cc.Id == id);

                if (courseClass == null)
                {
                    return NotFound(new { Message = "Course Class not found", Data = id });
                }

                return Ok(new { Message = "success", Data = MapToResponseModelCourseClass(courseClass) });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception: {ex.Message}");

                return StatusCode(500, new { Message = "Internal Server Error", Data = ex.Message });
            }
        }

        private object MapToResponseModelCourseClass(CourseClass courseClass)
        {
            return new
            {
                id = courseClass.Id,
                number = (int)courseClass.Number,
                course_id = courseClass.CourseType.CourseId,
                course_name = courseClass.CourseType.Course.Name,
                course_code = courseClass.CourseType.Course.Code,
                course_type = courseClass.CourseTypeId,
                course_credit = courseClass.CourseType.Credit,
                schedules = courseClass.Schedules?.Select(s => new
                {
                    id = s.Id,
                    meet_number = s.MeetNumber,
                    teacher_id = s.UserId,
                    teacher_initial = s.User?.InitialChar,
                }).ToList()
            };
        }

        private object MapToResponseModel(Course course, DateTime semesterStart)
        {
            return new
            {
                id = course.Id,
                name = course.Name,
                code = course.Code,
                semesters = course.Semesters,
                semester_start = semesterStart,
                course_type = course.CourseTypes.Select(ct => new
                {
                    id = ct.Id,
                    type = (int)ct.CourseTypeT,
                    credit = ct.Credit,
                    course_class = ct.CourseClasses.Select(cc => new
                    {
                        id = cc.Id,
                        number = (int)cc.Number
                    }).ToList()
                }).ToList()
            };
        }
    }

    public class CourseRequestModel
    {
        public required int semester_id { get; set; }
        public required string name { get; set; }
        public required string code { get; set; }
        public required int semesters { get; set; }
        public required CourseTypeRequestModel[] course_type { get; set; }
    }

    public class CourseTypeRequestModel
    {
        public required int type { get; set; }
        public required int credit { get; set; }
        public required int class_count { get; set; }
    }
}
