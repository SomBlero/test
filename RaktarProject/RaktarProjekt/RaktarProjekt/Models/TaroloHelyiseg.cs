using RaktarProjekt.Models;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

[Table("tarolo_helyiseg")]
public class TaroloHelyiseg
{
    [Key]
    [Column("tarolo_azon")]
    public int TaroloAzon { get; set; }

    [Column("cim_azon")]
    public int CimAzon { get; set; }

    [Column("ar_kategoria_azon")]
    public int ArKategoriaAzon { get; set; }
    [Required]
    [Column("statusz")]
    public string Statusz { get; set; } = "szabad";
    [ForeignKey("CimAzon")]
    public virtual Raktar Raktar { get; set; } = null!;

    [ForeignKey("ArKategoriaAzon")]
    public virtual ArKategoria ArKategoria { get; set; } = null!;
    public virtual ICollection<Berles> Berlesek { get; set; } = new List<Berles>();
}
