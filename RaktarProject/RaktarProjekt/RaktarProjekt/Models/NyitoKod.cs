using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RaktarProjekt.Models
{
    [Table("nyito_kod")]
    public class NyitoKod
    {
        [Key]
        [Column("nyito_kod_id")]
        public int NyitoKodId { get; set; }

        [Column("tarolo_azon")]
        public int Tarolo_Azon { get; set; }

        [Column("ugyfel_azon")]
        public int Ugyfel_Azon { get; set; }
        [Required]
        [MaxLength(6)]
        [Column("kod")]
        public string Kod { get; set; } = string.Empty;
        [Column("lejarat")]
        public DateTime Lejarat { get; set; }
        [ForeignKey("Tarolo_Azon")]
        public virtual TaroloHelyiseg? TaroloHelyiseg { get; set; }

        [ForeignKey("Ugyfel_Azon")]
        public virtual Ugyfel? Ugyfel { get; set; }
    }
}

