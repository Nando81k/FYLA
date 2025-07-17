using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FYLA.Core.Entities
{
  public class Review
  {
    [Key]
    public int Id { get; set; }

    [Required]
    public int AppointmentId { get; set; }

    [Required]
    public int ClientId { get; set; }

    [Required]
    public int ProviderId { get; set; }

    [Required]
    [Range(1, 5)]
    public int Rating { get; set; }

    [Required]
    [StringLength(1000)]
    public string Comment { get; set; } = string.Empty;

    public bool WouldRecommend { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    [ForeignKey(nameof(AppointmentId))]
    public virtual Appointment Appointment { get; set; } = null!;

    [ForeignKey(nameof(ClientId))]
    public virtual User Client { get; set; } = null!;

    [ForeignKey(nameof(ProviderId))]
    public virtual User Provider { get; set; } = null!;
  }
}
