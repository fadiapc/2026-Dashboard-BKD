using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApi.Data;
using WebApi.Middleware;
using WebApi.Models;

namespace WebApi.Controllers
{
    public class SemesterRequest
    {
        public DateTime Date { get; set; } // tanggal mulai
        public DateTime EndDate { get; set; }
    }

    [ApiController]
    [Route("/[controller]")]
    [AuthRequired]
    public class SemestersController : ControllerBase
    {
        private readonly DataContext _context;

        public SemestersController(DataContext context)
        {
            _context = context;
        }

        // GET: /Semesters - Mengambil semua daftar semester
        [HttpGet]
        public async Task<ActionResult> Get()
        {
            var semesters = await _context.Semesters.ToListAsync();

            if (semesters == null)
            {
                return NotFound(new { Message = "Not found" });
            }

            return Ok(new
            {
                Message = "Success",
                Data = semesters.Select(s => new
                {
                    id = s.Id,
                    name = s.Name, 
                    date = s.Date.ToString("yyyy-MM-dd"),
                    end_date = s.EndDate.ToString("yyyy-MM-dd"),
                    is_active = s.IsActive
                }) 
            });
        }

        // GET: /Semesters/{id} - Mengambil detail satu semester beserta mata kuliahnya
        [HttpGet]
        [Route("{id}")]
        public async Task<ActionResult<Semester>> Get(int id)
        {
            try
            {
                var semester = await _context.Semesters.FindAsync(id);

                if (semester == null)
                {
                    return NotFound(new { Message = "Semester not found", Data = id });
                }
                
                var courses = await _context.Courses
                    .Where(c => c.SemesterId == id)
                    .Include(c => c.CourseTypes)
                    .ToListAsync();

                var coursesResponse = courses.Select(course => new {
                    id = course.Id,
                    name = course.Name,
                    code = course.Code,
                    course_type = course.CourseTypes?.Select(ct => new {
                        id = ct.Id,
                        type = (int)ct.CourseTypeT,
                        credit = ct.Credit,
                    }).ToList()
                }).ToList();

                return Ok(new {
                    message = "success",
                    data = new {
                        id = semester.Id,
                        name = semester.Name,
                        date = semester.Date.ToString("yyyy-MM-dd"),
                        end_date = semester.EndDate.ToString("yyyy-MM-dd"),
                        is_active = semester.IsActive,
                        courses = coursesResponse
                    }
                });
            }
            catch (Exception e)
            {
                return StatusCode(500, new { Message = "Internal server error", Data = e.Message });
            }
        }

        // POST: /Semesters - Menambah semester baru dengan penamaan otomatis
        [HttpPost]
        [AdminRequired]
        public async Task<ActionResult<Semester>> Add(SemesterRequest request)
        {
            try 
            {
                // validasi durasi input
        
                // 1. Tanggal selesai harus setelah tanggal mulai
                if (request.EndDate <= request.Date)
                {
                    return BadRequest(new { message = "Gagal! Tanggal selesai harus setelah tanggal mulai." });
                }
                
                var duration = request.EndDate - request.Date;

                 // 2. Cek durasi minimal
                if (duration.TotalDays < 150) 
                {
                    return BadRequest(new { 
                        message = $"Gagal! Durasi semester terlalu pendek ({Math.Round(duration.TotalDays / 30, 1)} bulan). Minimal durasi adalah 5 bulan." 
                    });
                }

                // 3. Cek durasi maksimal
                if (duration.TotalDays > 210) 
                {
                    return BadRequest(new { 
                        message = $"Gagal! Durasi semester terlalu lama ({Math.Round(duration.TotalDays / 30, 1)} bulan). Maksimal durasi adalah 7 bulan." 
                    });
                }

                // 4. Penamaan otomatis
                int year = request.Date.Year;
                int month = request.Date.Month;
                string generatedName = "";

                if (month >= 8) 
                {
                    generatedName = $"{year}/{year + 1} Semester Ganjil";
                }
                else // januari-juli genap
                {
                    generatedName = $"{year - 1}/{year} Semester Genap";
                }

                // 5. Cek duplikat
                var existingSemester = await _context.Semesters
                    .FirstOrDefaultAsync(s => s.Name == generatedName);

                if (existingSemester != null)
                {
                    // Jika sudah ada, langsung stop dan kasih tahu user
                    return BadRequest(new { message = $"Gagal! Semester {generatedName} sudah ada di database." });
                }

                var newSemester = new Semester
                {
                    Name = generatedName, // Hasil otomatis: "2026/2027 Semester Ganjil"
                    Date = request.Date,
                    EndDate = request.EndDate,
                    IsActive = false
                };

                _context.Semesters.Add(newSemester);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Success", data = newSemester });
            }
            catch (Exception e)
            {
                return StatusCode(500, new { Message = "Internal server error", Data = e.Message });
            }
        }

        // PUT: /Semesters/{id}/activate - Mengaktifkan satu semester & menonaktifkan yang lain
        [HttpPut]
        [AdminRequired]
        [Route("{id}/activate")]
        public async Task<ActionResult<Semester>> Activate(int id)
        {
            try
            {
                var semester = await _context.Semesters.FindAsync(id);

                if (semester == null)
                {
                    return NotFound(new { Message = "Semester not found", Data = id });
                }

                // Cari semester lain yang sedang aktif, lalu matikan
                var activeSemester = await _context.Semesters.FirstOrDefaultAsync(s => s.IsActive == true);
                if (activeSemester != null)
                {
                    activeSemester.IsActive = false;
                }

                semester.IsActive = true;
                await _context.SaveChangesAsync();

                return Ok(new { Message = "Success", Data = semester });
            }
            catch (Exception e)
            {
                return StatusCode(500, new { Message = "Internal server error", Data = e.Message });
            }
        }

        // DELETE: /Semesters/{id} - Menghapus semester beserta seluruh data terkait (Cascade)
        [HttpDelete]
        [Route("{id}")]
        [AdminRequired]
        public async Task<IActionResult> Delete(int id)
        {
            // Gunakan Transaction agar jika satu gagal, semua batal (aman)
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

                    // Hapus data Courses, CourseTypes, Classes, dan Schedules terkait
                    var courses = await _context.Courses.Where(c => c.SemesterId == id).ToListAsync();
                    foreach (var course in courses)
                    {
                        var courseTypes = await _context.CourseTypes.Where(ct => ct.CourseId == course.Id).ToListAsync();
                        foreach (var courseType in courseTypes)
                        {
                            var courseClasses = await _context.CourseClasses.Where(cc => cc.CourseTypeId == courseType.Id).ToListAsync();
                            _context.CourseClasses.RemoveRange(courseClasses);

                            var schedules = await _context.Schedules.Where(s => s.CourseClassId == courseType.Id).ToListAsync();
                            _context.Schedules.RemoveRange(schedules);
                        }
                        _context.CourseTypes.RemoveRange(courseTypes);
                    }
                    _context.Courses.RemoveRange(courses);

                    // Terakhir, hapus data Semesternya
                    _context.Semesters.Remove(semester);

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return Ok(new { message = "Semester and related data deleted successfully" });
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    return StatusCode(500, new { message = "Delete failed", error = ex.Message });
                }
            }
        }
    }
}