using System.Collections.Generic;
using System.Reflection.Emit;
using Microsoft.EntityFrameworkCore;
using RaktarProjekt.Database;
using RaktarProjekt.Models;

namespace RaktarProjekt.Database
{
    public class RaktarContext : DbContext
    {
        public RaktarContext(DbContextOptions<RaktarContext> options) : base(options)
        {
        }
        public DbSet<ArKategoria> ArKategoriak { get; set; }
        public DbSet<Megye> Megyek { get; set; }
        public DbSet<Raktar> Raktarak { get; set; }
        public DbSet<TaroloHelyiseg> TaroloHelyisegek { get; set; }
        public DbSet<Ugyfel> Ugyfelek { get; set; }
        public DbSet<Berles> Berlesek { get; set; }
        public DbSet<NyitoKod> NyitoKodok { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.Entity<ArKategoria>()
                .Property(a => a.AlapArNaponta)
                .HasPrecision(10, 2);
            modelBuilder.Entity<ArKategoria>()
                .Property(a => a.MeretM2)
                .HasPrecision(5, 2);
            modelBuilder.Entity<Berles>()
                .Property(b => b.Osszeg)
                .HasPrecision(10, 2);
        }
    }
}
