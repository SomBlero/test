using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using RaktarProjekt.Models;

[Table("ugyfel")]
public class Ugyfel
{
    [Key]
    [Column("ugyfel_azon")]
    public int UgyfelAzon { get; set; }

    [Required]
    [Column("nev")]
    [StringLength(255)]
    public string Nev { get; set; } = string.Empty;

    [Required]
    [Column("email")]
    [StringLength(255)]
    public string Email { get; set; } = string.Empty;

    [Column("telefonszam")]
    [StringLength(50)]
    public string? Telefonszam { get; set; }

    [Required]
    [Column("jelszo_hash")]
    [StringLength(255)]
    public string JelszoHash { get; set; } = string.Empty;

    [Column("regisztracio_datuma")]
    public DateTime RegisztracioDatuma { get; set; }

    [Column("email_megerositve")]
    public bool EmailMegerositve { get; set; } = true;

    [Column("aktivalo_kod")]
    [StringLength(255)]
    public string? AktivaloKod { get; set; }

    [Column("aktivalo_kod_lejarat")]
    public DateTime? AktivaloKodLejarat { get; set; }

    [Column("aktivalo_kod_probalkozasok")]
    public int AktivaloKodProbalkozasok { get; set; } = 0;

    [Column("aktivalo_kod_zarolva_eddig")]
    public DateTime? AktivaloKodZarolvaEddig { get; set; }

    [Column("jelszo_visszaallito_kod")]
    [StringLength(255)]
    public string? JelszoVisszaallitoKod { get; set; }

    [Column("jelszo_visszaallito_kod_lejarat")]
    public DateTime? JelszoVisszaallitoKodLejarat { get; set; }

    [Column("jelszo_visszaallito_probalkozasok")]
    public int JelszoVisszaallitoProbalkozasok { get; set; } = 0;

    [Column("jelszo_visszaallito_zarolva_eddig")]
    public DateTime? JelszoVisszaallitoZarolvaEddig { get; set; }

    public string Role { get; set; } = "user";

    [Column("email_ertesitesek")]
    public bool EmailErtesitesek { get; set; } = true;
    public virtual ICollection<Berles> Berlesek { get; set; } = new List<Berles>();
}
