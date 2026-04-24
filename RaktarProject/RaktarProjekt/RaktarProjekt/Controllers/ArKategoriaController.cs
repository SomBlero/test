using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RaktarProjekt.Database;
using RaktarProjekt.Models;

namespace RaktarProjekt.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ArKategoriaController : ControllerBase
    {
        private readonly RaktarContext _context;

        public ArKategoriaController(RaktarContext context)
        {
            _context = context;
        }
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ArKategoria>>> GetArKategoriak()
        {
            return await _context.ArKategoriak.ToListAsync();
        }
        [HttpGet("{id}")]
        public async Task<ActionResult<ArKategoria>> GetArKategoria(int id)
        {
            var kategoria = await _context.ArKategoriak.FindAsync(id);

            if (kategoria == null)
            {
                return NotFound(new { message = "A keresett kategória nem található." });
            }

            return kategoria;
        }
        [HttpPost]
        public async Task<ActionResult<ArKategoria>> PostArKategoria(ArKategoria ujKategoria)
        {
            _context.ArKategoriak.Add(ujKategoria);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetArKategoria), new { id = ujKategoria.ArKategoriaAzon }, ujKategoria);
        }
        [HttpPut("{id}")]
        public async Task<IActionResult> PutArKategoria(int id, ArKategoria modositottKategoria)
        {
            if (id != modositottKategoria.ArKategoriaAzon)
            {
                return BadRequest(new { message = "Az azonosítók nem egyeznek!" });
            }

            _context.Entry(modositottKategoria).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ArKategoriaExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return Ok(new { message = "Sikeres frissítés!" });
        }
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteArKategoria(int id)
        {
            var kategoria = await _context.ArKategoriak.FindAsync(id);
            if (kategoria == null)
            {
                return NotFound();
            }

            _context.ArKategoriak.Remove(kategoria);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"A(z) {id} azonosítójú kategória törölve." });
        }
        private bool ArKategoriaExists(int id)
        {
            return _context.ArKategoriak.Any(e => e.ArKategoriaAzon == id);
        }
    }
}
