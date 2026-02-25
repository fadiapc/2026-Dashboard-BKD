using Microsoft.AspNetCore.Mvc;
using WebApi.Data;
using WebApi.Middleware;
using WebApi.Models;

namespace WebApi.Controllers
{
    [ApiController]
    public class HomeController : ControllerBase
    {
        private readonly DataContext _context;
        public HomeController(DataContext context)
        {
            _context = context;
        }
        // Endpoint GET /ping
        [HttpGet("/ping")]
        public IActionResult Ping()
        {
            return Ok(new { message = "Server is Running" });
        }

        [HttpPost("/seed")]
        [AdminRequired]
        public async Task<ActionResult> Seed()
        {
            Random random = new();
            var semester = new Semester
            {
                Date = DateTime.Parse("2023-08-01"),
                IsActive = true
            };
            var semester1 = new Semester
            {
                Date = DateTime.Parse("2022-08-01")
            };
            await _context.Semesters.AddAsync(semester);
            await _context.Semesters.AddAsync(semester1);

            var usersIntial = new List<string> { "ABC", "DEF", "GHI", "JKL", "MNO", "PQR", "STU", "VWX", "YZA", "BCD", "EFG", "HIJ", "KLM", "NOP", "QRS", "TUV", "WXY", "ZAB", "CDE", "FGH", "IJK", "LMN", "OPQ", "RST", "UVW", "XYZ" };
            foreach (var initial in usersIntial)
            {
                var user = new User
                {
                    Name = "User " + initial,
                    InitialChar = initial,
                    IsActive = true,
                    IsAdmin = false,
                    Password = BCrypt.Net.BCrypt.HashPassword("password"),
                };
                await _context.Users.AddAsync(user);
            }

            var courseCodes = new List<string> { "CSE101", "CSE102", "CSE103", "CSE104", "CSE105", "CSE106", "CSE107", "CSE108", "CSE109", "CSE110", "CSE111", "CSE112", "CSE113", "CSE114", "CSE115" };
            foreach (var code in courseCodes)
            {
                var course = new Course
                {
                    Name = "Course " + code,
                    Code = code,
                    SemesterId = 1,
                    Semester = semester,
                    Semesters = Course.SemesterEnum.First
                };

                var list = new List<CourseType.CourseTypeEnum> {
                    CourseType.CourseTypeEnum.Kuliah,
                    CourseType.CourseTypeEnum.Praktikum,
                    CourseType.CourseTypeEnum.Responsi 
                };
                int numberOfTypesToAdd = random.Next(1, list.Count + 1);
                for (int i = 0; i < numberOfTypesToAdd; i++)
                {
                    int index = random.Next(list.Count);
                    var courseType = new CourseType
                    {
                        CourseTypeT = list[index],
                        Credit = random.Next(1, 4),
                        Course = course
                    };
                    list.RemoveAt(index);
                    course.CourseTypes.Add(courseType);
                }

                foreach (var courseType in course.CourseTypes)
                {
                    var courseClassCount = random.Next(1, 5);
                    for (int i = 1; i <= courseClassCount; i++)
                    {
                        var courseClass = new CourseClass
                        {
                            CourseType = courseType,
                            Number = (CourseClass.ClassNumberEnum)i
                        };

                        for (int k = 1; k <= 14; k++) {
                            var isFilled = random.Next(100) < 80;
                            var schedule = new Schedule
                            {
                                MeetNumber = k,
                                CourseClass = courseClass,
                                UserId = isFilled ? random.Next(usersIntial.Count) + 2 : null
                            };
                            courseClass.Schedules.Add(schedule);
                        }
                        courseType.CourseClasses.Add(courseClass);
                    }
                }

                await _context.Courses.AddAsync(course);

            }
            foreach (var code in courseCodes)
            {
                var course = new Course
                {
                    Name = "Course " + code,
                    Code = code,
                    SemesterId = 2,
                    Semester = semester1,
                    Semesters = Course.SemesterEnum.First
                };

                var list = new List<CourseType.CourseTypeEnum> {
                    CourseType.CourseTypeEnum.Kuliah,
                    CourseType.CourseTypeEnum.Praktikum,
                    CourseType.CourseTypeEnum.Responsi 
                };
                int numberOfTypesToAdd = random.Next(1, list.Count + 1);
                for (int i = 0; i < numberOfTypesToAdd; i++)
                {
                    int index = random.Next(list.Count);
                    var courseType = new CourseType
                    {
                        CourseTypeT = list[index],
                        Credit = random.Next(1, 4),
                        Course = course
                    };
                    list.RemoveAt(index);
                    course.CourseTypes.Add(courseType);
                }

                foreach (var courseType in course.CourseTypes)
                {
                    var courseClassCount = random.Next(1, 5);
                    for (int i = 1; i <= courseClassCount; i++)
                    {
                        var courseClass = new CourseClass
                        {
                            CourseType = courseType,
                            Number = (CourseClass.ClassNumberEnum)i
                        };

                        for (int k = 1; k <= 14; k++) {
                            var isFilled = random.Next(100) < 80;
                            var schedule = new Schedule
                            {
                                MeetNumber = k,
                                CourseClass = courseClass,
                                UserId = isFilled ? random.Next(usersIntial.Count) + 2 : null
                            };
                            courseClass.Schedules.Add(schedule);
                        }
                        courseType.CourseClasses.Add(courseClass);
                    }
                }

                await _context.Courses.AddAsync(course);

            }
            
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Success" });
        }
    }
}