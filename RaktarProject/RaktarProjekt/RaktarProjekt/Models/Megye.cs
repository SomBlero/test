using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
[Table("megye")]
public class Megye
{
    [Key]
    [Column("megye_azon")]
    public int MegyeAzon { get; set; }

    [Required]
    [Column("nev")]
    [StringLength(100)]
    public string Nev { get; set; } = string.Empty;
    public virtual ICollection<Raktar> Raktarak { get; set; } = new List<Raktar>();
}
