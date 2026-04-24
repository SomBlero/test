using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RaktarProjekt.Database;
using RaktarProjekt.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace RaktarProjekt.Controllers
{
    public class RaktarDto
    {
        public int CimAzon { get; set; }
        public int MegyeAzon { get; set; }
        public string? Megnevezes { get; set; }
        public string RaktarCim { get; set; } = string.Empty; 
        public string? MegyeNev { get; set; }
    }
    [Route("api/[controller]")]
    [ApiController]
    public class RaktarController : ControllerBase
    {
        private readonly RaktarContext _context;

        public RaktarController(RaktarContext context)
        {
            _context = context;
        }
        [HttpGet]
        public async Task<ActionResult<IEnumerable<RaktarDto>>> GetRaktarak()
        {
            return await _context.Raktarak
                .Include(r => r.Megye)
                .Select(r => new RaktarDto
                {
                    CimAzon = r.CimAzon,
                    MegyeAzon = r.MegyeAzon,
                    Megnevezes = r.Megnevezes,
                    RaktarCim = r.RaktarCim,
                    MegyeNev = r.Megye.Nev
                })
                .ToListAsync();
        }
        [HttpGet("{id}")]
        public async Task<ActionResult<RaktarDto>> GetRaktar(int id)
        {
            var raktar = await _context.Raktarak
                .Include(r => r.Megye)
                .FirstOrDefaultAsync(r => r.CimAzon == id);

            if (raktar == null)
            {
                return NotFound();
            }

            return new RaktarDto
            {
                CimAzon = raktar.CimAzon,
                MegyeAzon = raktar.MegyeAzon,
                Megnevezes = raktar.Megnevezes,
                RaktarCim = raktar.RaktarCim,
                MegyeNev = raktar.Megye.Nev
            };
        }
        [HttpPost]
        public async Task<ActionResult<RaktarDto>> PostRaktar(RaktarDto raktarDto)
        {
            var raktar = new Raktar
            {
                MegyeAzon = raktarDto.MegyeAzon,
                Megnevezes = raktarDto.Megnevezes,
                RaktarCim = raktarDto.RaktarCim
            };

            _context.Raktarak.Add(raktar);
            await _context.SaveChangesAsync();

            raktarDto.CimAzon = raktar.CimAzon;
            return CreatedAtAction(nameof(GetRaktar), new { id = raktar.CimAzon }, raktarDto);
        }
        [HttpPut("{id}")]
        public async Task<IActionResult> PutRaktar(int id, RaktarDto raktarDto)
        {
            if (id != raktarDto.CimAzon)
            {
                return BadRequest();
            }

            var raktar = await _context.Raktarak.FindAsync(id);
            if (raktar == null)
            {
                return NotFound();
            }

            raktar.MegyeAzon = raktarDto.MegyeAzon;
            raktar.Megnevezes = raktarDto.Megnevezes;
            raktar.RaktarCim = raktarDto.RaktarCim;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Raktarak.Any(e => e.CimAzon == id)) return NotFound();
                else throw;
            }

            return NoContent();
        }
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRaktar(int id)
        {
            var raktar = await _context.Raktarak.FindAsync(id);
            if (raktar == null)
            {
                return NotFound();
            }

            _context.Raktarak.Remove(raktar);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
