using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RaktarProjekt.Database;
using RaktarProjekt.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace RaktarProjekt.Controllers
{
    public class MegyeDto
    {
        public int MegyeAzon { get; set; }
        public string Nev { get; set; } = string.Empty;
    }
    [Route("api/[controller]")]
    [ApiController]
    public class MegyeController : ControllerBase
    {
        private readonly RaktarContext _context;

        public MegyeController(RaktarContext context)
        {
            _context = context;
        }
        [HttpGet]
        public async Task<ActionResult<IEnumerable<MegyeDto>>> GetMegyek()
        {
            return await _context.Megyek
                .Select(m => new MegyeDto
                {
                    MegyeAzon = m.MegyeAzon,
                    Nev = m.Nev
                })
                .ToListAsync();
        }
        [HttpGet("{id}")]
        public async Task<ActionResult<MegyeDto>> GetMegye(int id)
        {
            var megye = await _context.Megyek.FindAsync(id);

            if (megye == null)
            {
                return NotFound();
            }

            return new MegyeDto
            {
                MegyeAzon = megye.MegyeAzon,
                Nev = megye.Nev
            };
        }
        [HttpPost]
        public async Task<ActionResult<MegyeDto>> PostMegye(MegyeDto megyeDto)
        {
            var megye = new Megye
            {
                Nev = megyeDto.Nev
            };

            _context.Megyek.Add(megye);
            await _context.SaveChangesAsync();

            megyeDto.MegyeAzon = megye.MegyeAzon;
            return CreatedAtAction(nameof(GetMegye), new { id = megye.MegyeAzon }, megyeDto);
        }
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMegye(int id)
        {
            var megye = await _context.Megyek.FindAsync(id);
            if (megye == null)
            {
                return NotFound();
            }
            _context.Megyek.Remove(megye);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
