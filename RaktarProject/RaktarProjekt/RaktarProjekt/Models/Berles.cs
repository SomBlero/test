using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RaktarProjekt.Models
{
    [Table("berles")]
    public class Berles
    {
        [Key]
        [Column("berles_azon")]
        public int BerlesAzon { get; set; }

        [Column("ugyfel_azon")]
        public int Ugyfel_Azon { get; set; }

        [Column("tarolo_azon")]
        public int Tarolo_Azon { get; set; }

        [Column("kezdo_datum")]
        public DateTime KezdoDatum { get; set; }

        [Column("veg_datum")]
        public DateTime VegDatum { get; set; }

        [Column("berles_statusz")]
        public string? BerlesStatusz { get; set; }

        [Column("osszeg")]
        public decimal Osszeg { get; set; }
        [ForeignKey("Ugyfel_Azon")]
        public virtual Ugyfel? Ugyfel { get; set; }

        [ForeignKey("Tarolo_Azon")]
        public virtual TaroloHelyiseg? TaroloHelyiseg { get; set; }
    }
}
