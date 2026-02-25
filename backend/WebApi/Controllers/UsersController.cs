using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApi.Data;
using WebApi.Middleware;
using WebApi.Models;

namespace WebApi.Controllers
{
    [ApiController]
    [Route("/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly DataContext _context;

        public UsersController(DataContext context)
        {
            _context = context;
        }

        [HttpGet]
        [AdminRequired]
        public async Task<ActionResult<IEnumerable<User>>> GetUsers()
        {
            var users =  await _context.Users.ToListAsync();
            var userBkd = new List<float>();
            foreach (var user in users)
            {
                var courses = await _context.Courses
                .Include(c => c.CourseTypes)
                    .ThenInclude(ct => ct.CourseClasses)
                        .ThenInclude(cc => cc.Schedules)
                .Include(c => c.Semester)
                .Where(c => c.Semester.IsActive && c.CourseTypes.Any(ct => ct.CourseClasses.Any(cc => cc.Schedules.Any(s => s.UserId == user.Id))))
                .ToListAsync();
                var credits = courses.SelectMany(c => c.CourseTypes.Select(ct => ct.Credit * ct.CourseClasses.Select(cc => cc.Schedules.Count(s => s.UserId == user.Id)).Sum())).Sum();
                var bkd = (float)credits/14;
                userBkd.Add(bkd);
            }
            return Ok(new
            {
                Message = "Success",
                Data = users.Select(u => new {
                    id = u.Id,
                    name = u.Name,
                    initials = u.InitialChar,
                    is_admin = u.IsAdmin,
                    is_active = u.IsActive,
                    bkd = userBkd[users.IndexOf(u)]
                })
            });
        }

        [HttpGet("semesters/{id:int}")]
        [AuthRequired]
        public async Task<ActionResult<IEnumerable<User>>> GetUsersBySemester(int id)
        {
            var users =  await _context.Users.ToListAsync();
            var userBkd = new List<float>();
            foreach (var user in users)
            {
                var courses = await _context.Courses
                .Include(c => c.CourseTypes)
                    .ThenInclude(ct => ct.CourseClasses)
                        .ThenInclude(cc => cc.Schedules)
                .Include(c => c.Semester)
                .Where(c => c.Semester.Id == id && c.CourseTypes.Any(ct => ct.CourseClasses.Any(cc => cc.Schedules.Any(s => s.UserId == user.Id))))
                .ToListAsync();
                var credits = courses.SelectMany(c => c.CourseTypes.Select(ct => ct.Credit * ct.CourseClasses.Select(cc => cc.Schedules.Count(s => s.UserId == user.Id)).Sum())).Sum();
                var bkd = (float)credits/14;
                userBkd.Add(bkd);
            }
            return Ok(new
            {
                Message = "Success",
                Data = users.Select(u => new {
                    id = u.Id,
                    name = u.Name,
                    initials = u.InitialChar,
                    is_admin = u.IsAdmin,
                    is_active = u.IsActive,
                    bkd = userBkd[users.IndexOf(u)]
                })
            });
        }

        [HttpGet("me")]
        [AuthRequired]
        public async Task<ActionResult<User>> GetUser()
        {
            var id = HttpContext.User.FindFirstValue("id");
            if (id == null)
            {
                return NotFound(new { Message = "user not found" } ) ;
            }
            var intId = int.Parse(id);
            var user = await _context.Users.FindAsync(intId);

            if (user == null)
            {
                return NotFound(new { Message = "user not found" } ) ;
            }


            var courses = await _context.Courses
                .Include(c => c.CourseTypes)
                    .ThenInclude(ct => ct.CourseClasses)
                        .ThenInclude(cc => cc.Schedules)
                .Include(c => c.Semester)
                .Where(c => c.Semester.IsActive && c.CourseTypes.Any(ct => ct.CourseClasses.Any(cc => cc.Schedules.Any(s => s.UserId == intId))))
                .ToListAsync();
            

            var credits = courses.SelectMany(c => c.CourseTypes.Select(ct => ct.Credit * ct.CourseClasses.Select(cc => cc.Schedules.Count(s => s.UserId == intId)).Sum())).Sum();
            var bkd = (float)credits/14;
            return Ok(new
            {
                Message = "Success",
                Data = new {
                    id = user.Id,
                    name = user.Name,
                    initials = user.InitialChar,
                    is_admin = user.IsAdmin,
                    is_active = user.IsActive,
                    bkd = bkd,
                    courses = courses.Select(c => new {
                        id = c.Id,
                        name = c.Name,
                        code = c.Code,
                        course_type = c.CourseTypes.Select(ct => new {
                            id = ct.Id,
                            type = (int)ct.CourseTypeT,
                            credit = ct.Credit,
                            course_classes = ct.CourseClasses.Select(cc => new {
                                id = cc.Id,
                                number = (int)cc.Number,
                                schedules = cc.Schedules.Where(s => s.UserId == intId).Select(s => new {
                                    id = s.Id,
                                    meet_number = s.MeetNumber
                                }).ToList()
                            }).ToList()
                        }).ToList()
                    }).ToList()
                }
            });
        }

        [HttpGet("{id:int}")]
        [ResourceOwnerRequired]
        public async Task<ActionResult<User>> GetUser(int id)
        {
            var user = await _context.Users.FindAsync(id);

            if (user == null)
            {
                return NotFound(new { Message = "user not found" } ) ;
            }


            var courses = await _context.Courses
                .Include(c => c.CourseTypes)
                    .ThenInclude(ct => ct.CourseClasses)
                        .ThenInclude(cc => cc.Schedules)
                .Include(c => c.Semester)
                .Where(c => c.Semester.IsActive && c.CourseTypes.Any(ct => ct.CourseClasses.Any(cc => cc.Schedules.Any(s => s.UserId == id))))
                .ToListAsync();
            

            var credits = courses.SelectMany(c => c.CourseTypes.Select(ct => ct.Credit * ct.CourseClasses.Select(cc => cc.Schedules.Count(s => s.UserId == id)).Sum())).Sum();
            var bkd = (float)credits/14;
            return Ok(new
            {
                Message = "Success",
                Data = new {
                    id = user.Id,
                    name = user.Name,
                    initials = user.InitialChar,
                    is_admin = user.IsAdmin,
                    is_active = user.IsActive,
                    bkd = bkd,
                    courses = courses.Select(c => new {
                        id = c.Id,
                        name = c.Name,
                        code = c.Code,
                        course_type = c.CourseTypes.Select(ct => new {
                            id = ct.Id,
                            type = (int)ct.CourseTypeT,
                            credit = ct.Credit,
                            course_classes = ct.CourseClasses.Select(cc => new {
                                id = cc.Id,
                                number = (int)cc.Number,
                                schedules = cc.Schedules.Where(s => s.UserId == id).Select(s => new {
                                    id = s.Id,
                                    meet_number = s.MeetNumber
                                }).ToList()
                            }).ToList()
                        }).ToList()
                    }).ToList()
                }
            });
        }

        [HttpGet("{id:int}/semesters")]
        [ResourceOwnerRequired]
        public async Task<ActionResult<User>> GetUserSemesters(int id)
        {
            var user = await _context.Users.FindAsync(id);

            if (user == null)
            {
                return NotFound(new { Message = "user not found" } ) ;
            }

            var semesters = await _context.Semesters
                .Where(s => s.Courses.Any(c => c.CourseTypes.Any(ct => ct.CourseClasses.Any(cc => cc.Schedules.Any(sch => sch.UserId == id)))))
                .Select(s => new {
                    Id = s.Id,
                    Date = s.Date,
                    IsActive = s.IsActive,
                    Courses = s.Courses.Select(c => new {
                        Id = c.Id,
                        Name = c.Name,
                        Code = c.Code,
                        CourseTypes = c.CourseTypes.Select(ct => new {
                            Id = ct.Id,
                            Type = ct.CourseTypeT,
                            Credit = ct.Credit,
                            CourseClasses = ct.CourseClasses.Select(cc => new {
                                Id = cc.Id,
                                Number = cc.Number,
                                Schedules = cc.Schedules.Where(sch => sch.UserId == id).Select(sch => new {
                                    Id = sch.Id,
                                    MeetNumber = sch.MeetNumber,
                                    UserId = sch.UserId
                                })
                            })
                        })
                    })
                }).ToListAsync();
            
            
            
            var bkd = new List<float>();
            for (int i = 0; i < semesters.Count; i++)
            {
                var credits = semesters[i].Courses.SelectMany(c => c.CourseTypes.Select(ct => ct.Credit * ct.CourseClasses.Select(cc => cc.Schedules.Count(s => s.UserId == id)).Sum())).Sum();
                bkd.Add((float)credits/14);
            }
            return Ok(new
            {
                Message = "Success",
                Data = new {
                    id = user.Id,
                    name = user.Name,
                    initials = user.InitialChar,
                    is_admin = user.IsAdmin,
                    is_active = user.IsActive,
                    semesters = semesters.Select((s, i) => new {
                        id = s.Id,
                        date = s.Date,
                        is_active = s.IsActive,
                        bkd = bkd[i],
                        courses = s.Courses.Select(c => new {
                            id = c.Id,
                            name = c.Name,
                            code = c.Code,
                            course_type = c.CourseTypes.Select(ct => new {
                                id = ct.Id,
                                type = (int)ct.Type,
                                credit = ct.Credit,
                                course_classes = ct.CourseClasses.Select(cc => new {
                                    id = cc.Id,
                                    number = (int)cc.Number,
                                    schedules = cc.Schedules.Where(s => s.UserId == id).Select(s => new {
                                        id = s.Id,
                                        meet_number = s.MeetNumber
                                    }).ToList()
                                }).ToList()
                            }).ToList()
                        }).ToList()
                    }).ToList()
                }
            });
        }

        [HttpPost]
        [AdminRequired]
        public ActionResult<User> CreateUser([FromBody] UserRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }
                if (_context.Users.Any(u => u.InitialChar == request.initials))
                {
                    return Conflict(new { Message = "User with the same initial already exist" });
                }

                var newUser = new User
                {
                    Name = request.name,
                    InitialChar = request.initials,
                    IsAdmin = request.is_admin,
                    IsActive = request.is_active,
                    Password = BCrypt.Net.BCrypt.HashPassword(request.password),
                    Email = request.email,
                };
                
                _context.Users.Add(newUser);
                _context.SaveChanges();

                return CreatedAtAction(
                        nameof(GetUser), 
                        new { id = newUser.Id }, 
                        new { Message = "Success", 
                                Data = new {
                                    id = newUser.Id,
                                    name = newUser.Name,
                                    initials = newUser.InitialChar,
                                    is_admin = newUser.IsAdmin,
                                    is_active = newUser.IsActive,
                                }
                        });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception: {ex.Message}");

                return StatusCode(500, new { Message = "Internal Server Error", Data = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [AdminRequired]
        public async Task<IActionResult> UpdateUser(int id, UserUpdateRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var user = await _context.Users.FindAsync(id);

                if (user == null)
                {
                    return NotFound(new { Message = "user not found" });
                }

                if (user.InitialChar == "ADM")
                {
                    return Unauthorized(new { Message = "Cannot change superadmin" });
                }

                if (_context.Users.Any(u => u.InitialChar == request.initials) && user.InitialChar != request.initials)
                {
                    return Conflict(new { Message = "User with the same initial already exist" });
                }
                user.Name = request.name ?? user.Name;
                user.InitialChar = request.initials ?? user.InitialChar;
                user.IsAdmin = request.is_admin;
                user.IsActive = request.is_active;
                user.Email = request.email ?? user.Email;
                if (request.password != null) user.Password = BCrypt.Net.BCrypt.HashPassword(request.password);

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

        [HttpDelete("{id}")]
        [AdminRequired]
        public async Task<IActionResult> DeleteUser(int id)
        {
            using (var transaction = await _context.Database.BeginTransactionAsync())
            {
                try
                {
                    var user = await _context.Users.FindAsync(id);
                    if (user == null)
                    {
                        return NotFound(new { Message = "User not found" });
                    }

                    if (user.InitialChar == "ADM")
                    {
                        return Unauthorized(new { Message = "Cannot delete superadmin" });
                    }

                    var schedules = await _context.Schedules.Where(s => s.UserId == id).ToListAsync();
                    if (schedules.Any())
                    {
                        foreach (var schedule in schedules)
                        {
                            schedule.UserId = null;
                        }
                        _context.Schedules.UpdateRange(schedules);
                        await _context.SaveChangesAsync();
                    }

                    _context.Users.Remove(user);
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return Ok(new { Message = "User deleted successfully" });
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    Console.WriteLine($"Exception: {ex.Message}");
                    return StatusCode(500, new { Message = "Internal Server Error", Data = ex.Message });
                }
            }
        }
        private bool UserExists(int id)
        {
            return _context.Users.Any(e => e.Id == id);
        }
    }
}

public class UserRequest
{
    public required string name { get; set; }
    public required string initials { get; set; }
    public required bool is_admin { get; set; }
    public required string password { get; set; }
    public required bool is_active { get; set; }
    public string? email { get; set; }
}

public class UserUpdateRequest
{
    public string? name { get; set; }
    public string? initials { get; set; }
    public required bool is_admin { get; set; }
    public string? password { get; set; }
    public required bool is_active { get; set; }
    public string? email { get; set; }
}
