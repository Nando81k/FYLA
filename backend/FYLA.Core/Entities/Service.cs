using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FYLA.Core.Entities;

public class Service
{
  [Key]
  public int Id { get; set; }

  [Required]
  public int ProviderId { get; set; }

  [Required]
  [StringLength(255)]
  public string Name { get; set; } = string.Empty;

  public string? Description { get; set; }

  [Required]
  [Column(TypeName = "decimal(10,2)")]
  public decimal Price { get; set; }

  [Required]
  public int EstimatedDurationMinutes { get; set; }

  public bool IsActive { get; set; } = true;

  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

  // Navigation properties
  [ForeignKey(nameof(ProviderId))]
  public virtual User Provider { get; set; } = null!;

  public virtual ICollection<AppointmentService> AppointmentServices { get; set; } = new List<AppointmentService>();
  public virtual ICollection<BusinessAnalyticsSnapshot> BusinessAnalyticsSnapshots { get; set; } = new List<BusinessAnalyticsSnapshot>();
}
