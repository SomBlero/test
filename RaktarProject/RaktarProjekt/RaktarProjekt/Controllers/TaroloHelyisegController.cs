using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RaktarProjekt.Database;
using RaktarProjekt.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace RaktarProjekt.Controllers
{
    public class TaroloHelyisegDto
    {
        public int TaroloAzon { get; set; }
        public int CimAzon { get; set; }
        public int ArKategoriaAzon { get; set; }
        public string? RaktarMegnevezes { get; set; }
        public string? KategoriaNeve { get; set; }
        public decimal? NapiAr { get; set; }
    }
    [Route("api/[controller]")]
    [ApiController]
    public class TaroloHelyisegController : ControllerBase
    {
        private readonly RaktarContext _context;

        public TaroloHelyisegController(RaktarContext context)
        {
            _context = context;
        }
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetTarolok()
        {
            return await _context.TaroloHelyisegek
                .Include(t => t.Raktar)
                .Include(t => t.ArKategoria)
                .Select(t => new
                {
                    TaroloAzon = t.TaroloAzon,
                    CimAzon = t.CimAzon,
                    ArKategoriaAzon = t.ArKategoriaAzon,
                    RaktarMegnevezes = t.Raktar.Megnevezes,
                    KategoriaNeve = t.ArKategoria.KategoriaNeve,
                    Statusz = t.Statusz,
                    NapiAr = t.ArKategoria.AlapArNaponta
                })
                .ToListAsync();
        }
        [HttpGet("{id}")]
        public async Task<ActionResult<TaroloHelyisegDto>> GetTarolo(int id)
        {
            var tarolo = await _context.TaroloHelyisegek
                .Include(t => t.Raktar)
                .Include(t => t.ArKategoria)
                .FirstOrDefaultAsync(t => t.TaroloAzon == id);

            if (tarolo == null)
            {
                return NotFound();
            }

            return new TaroloHelyisegDto
            {
                TaroloAzon = tarolo.TaroloAzon,
                CimAzon = tarolo.CimAzon,
                ArKategoriaAzon = tarolo.ArKategoriaAzon,
                RaktarMegnevezes = tarolo.Raktar.Megnevezes,
                KategoriaNeve = tarolo.ArKategoria.KategoriaNeve,
                NapiAr = tarolo.ArKategoria.AlapArNaponta
            };
        }
        [HttpPost]
        public async Task<ActionResult<TaroloHelyisegDto>> PostTarolo(TaroloHelyisegDto dto)
        {
            var tarolo = new TaroloHelyiseg
            {
                CimAzon = dto.CimAzon,
                ArKategoriaAzon = dto.ArKategoriaAzon
            };

            _context.TaroloHelyisegek.Add(tarolo);
            await _context.SaveChangesAsync();

            dto.TaroloAzon = tarolo.TaroloAzon;
            return CreatedAtAction(nameof(GetTarolo), new { id = tarolo.TaroloAzon }, dto);
        }
        [HttpPut("{id}")]
        public async Task<IActionResult> PutTarolo(int id, TaroloHelyisegDto dto)
        {
            if (id != dto.TaroloAzon) return BadRequest();

            var tarolo = await _context.TaroloHelyisegek.FindAsync(id);
            if (tarolo == null) return NotFound();

            tarolo.CimAzon = dto.CimAzon;
            tarolo.ArKategoriaAzon = dto.ArKategoriaAzon;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.TaroloHelyisegek.Any(e => e.TaroloAzon == id)) return NotFound();
                else throw;
            }

            return NoContent();
        }
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTarolo(int id)
        {
            var tarolo = await _context.TaroloHelyisegek.FindAsync(id);
            if (tarolo == null) return NotFound();

            _context.TaroloHelyisegek.Remove(tarolo);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        [HttpGet("admin/reszletes")]
        public async Task<ActionResult<IEnumerable<object>>> GetTarolokReszletes()
        {
            var mai = DateTime.Today;

            var tarolok = await _context.TaroloHelyisegek
                .Include(t => t.Raktar)
                .Include(t => t.ArKategoria)
                .ToListAsync();

            var berlesek = await _context.Berlesek
                .Include(b => b.Ugyfel)
                .ToListAsync();

            var eredmeny = tarolok.Select(t =>
            {
                var aktualisBerles = berlesek
                    .Where(b => b.Tarolo_Azon == t.TaroloAzon &&
                                b.KezdoDatum <= mai &&
                                b.VegDatum >= mai)
                    .FirstOrDefault();
                var kovetkezoBerles = berlesek
                    .Where(b => b.Tarolo_Azon == t.TaroloAzon &&
                                b.KezdoDatum > mai)
                    .OrderBy(b => b.KezdoDatum)
                    .FirstOrDefault();
                string tenylegesStatusz;
                if (t.Statusz == "karbantartas")
                {
                    tenylegesStatusz = "karbantartas";
                }
                else if (aktualisBerles != null)
                {
                    tenylegesStatusz = "foglalt";
                }
                else
                {
                    tenylegesStatusz = "szabad";
                }

                return new
                {
                    TaroloAzon = t.TaroloAzon,
                    CimAzon = t.CimAzon,
                    ArKategoriaAzon = t.ArKategoriaAzon,
                    RaktarMegnevezes = t.Raktar?.Megnevezes ?? "Ismeretlen",
                    KategoriaNeve = t.ArKategoria?.KategoriaNeve ?? "Ismeretlen",
                    NapiAr = t.ArKategoria?.AlapArNaponta ?? 0,
                    DbStatusz = t.Statusz,  
                    TenylegesStatusz = tenylegesStatusz, 
                    AktualisBerlesId = aktualisBerles?.BerlesAzon,
                    AktualisBerloNev = aktualisBerles?.Ugyfel?.Nev,
                    AktualisBerlesKezdet = aktualisBerles?.KezdoDatum,
                    AktualisBerlesVeg = aktualisBerles?.VegDatum,
                    KovetkezoBerlesId = kovetkezoBerles?.BerlesAzon,
                    KovetkezoBerloNev = kovetkezoBerles?.Ugyfel?.Nev,
                    KovetkezoBerlesKezdet = kovetkezoBerles?.KezdoDatum,
                    KovetkezoBerlesVeg = kovetkezoBerles?.VegDatum
                };
            })
            .OrderBy(t => t.RaktarMegnevezes)
            .ThenBy(t => t.TaroloAzon)
            .ToList();

            return Ok(eredmeny);
        }
        [HttpPut("{id}/karbantartas")]
        public async Task<IActionResult> SetKarbantartas(int id, [FromBody] KarbantartasDto dto)
        {
            var tarolo = await _context.TaroloHelyisegek.FindAsync(id);
            if (tarolo == null)
                return NotFound("A tároló nem található.");

            if (dto.Karbantartas)
            {
                tarolo.Statusz = "karbantartas";
            }
            else
            {
                tarolo.Statusz = "szabad";
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = dto.Karbantartas ? "Karbantartás bekapcsolva." : "Karbantartás kikapcsolva.", statusz = tarolo.Statusz });
        }
    }

    public class KarbantartasDto
    {
        public bool Karbantartas { get; set; }
    }
}
