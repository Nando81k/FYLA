using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using FYLA.Core.Enums;

namespace FYLA.Core.Entities
{
  public class Appointment
  {
    [Key]
    public int Id { get; set; }

    [Required]
    public int ClientId { get; set; }

    [Required]
    public int ProviderId { get; set; }

    [Required]
    public DateTime ScheduledStartTime { get; set; }

    [Required]
    public DateTime ScheduledEndTime { get; set; }

    [Required]
    public AppointmentStatus Status { get; set; } = AppointmentStatus.Pending;

    [Column(TypeName = "decimal(10,2)")]
    public decimal? TotalPrice { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey(nameof(ClientId))]
    public virtual User Client { get; set; } = null!;

    [ForeignKey(nameof(ProviderId))]
    public virtual User Provider { get; set; } = null!;

    public virtual ICollection<AppointmentService> Services { get; set; } = new List<AppointmentService>();
    public virtual Review? Review { get; set; }
  }
}
