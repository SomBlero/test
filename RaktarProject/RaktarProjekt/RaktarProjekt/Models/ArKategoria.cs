using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RaktarProjekt.Models
{
    [Table("ar_kategoria")]
    public class ArKategoria
    {
        [Key]
        [Column("ar_kategoria_azon")]
        public int ArKategoriaAzon { get; set; }

        [Required]
        [Column("kategoria_neve")]
        [StringLength(100)]
        public string? KategoriaNeve { get; set; }

        [Column("alap_ar_naponta")]
        public decimal AlapArNaponta { get; set; }

        [Column("meret_m2")]
        public decimal MeretM2 { get; set; }

        [Column("megjegyzes")]
        public string? Megjegyzes { get; set; }
        public virtual ICollection<TaroloHelyiseg> Tarolok { get; set; } = new List<TaroloHelyiseg>();
    }
}
