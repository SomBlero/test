using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

[Table("raktar")]
public class Raktar
{
    [Key]
    [Column("cim_azon")]
    public int CimAzon { get; set; }

    [Column("megye_azon")]
    public int MegyeAzon { get; set; }

    [Column("megnevezes")]
    [StringLength(255)]
    public string? Megnevezes { get; set; }
    [Required]
    [Column("raktar_cim")]
    public string RaktarCim { get; set; } = string.Empty;
    [ForeignKey("MegyeAzon")]
    public virtual Megye Megye { get; set; } = null!;
    public virtual ICollection<TaroloHelyiseg> TaroloHelyisegek { get; set; } = new List<TaroloHelyiseg>();
}
