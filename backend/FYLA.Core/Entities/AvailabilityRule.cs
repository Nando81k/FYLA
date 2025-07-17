using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FYLA.Core.Entities
{
  public class AvailabilityRule
  {
    [Key]
    public int Id { get; set; }

    [Required]
    public string ExternalId { get; set; } = string.Empty; // For frontend compatibility

    [Required]
    public int ProviderId { get; set; }

    [Range(0, 6)]
    public int DayOfWeek { get; set; } // 0-6, Sunday = 0

    [Required]
    [MaxLength(5)]
    public string StartTime { get; set; } = string.Empty; // HH:mm format

    [Required]
    [MaxLength(5)]
    public string EndTime { get; set; } = string.Empty; // HH:mm format

    public bool IsActive { get; set; } = true;

    [Required]
    public DateTime EffectiveFrom { get; set; }

    public DateTime? EffectiveTo { get; set; }

    [Required]
    [MaxLength(50)]
    public string Timezone { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("ProviderId")]
    public virtual User Provider { get; set; } = null!;

    public virtual ICollection<BreakInterval> BreakIntervals { get; set; } = new List<BreakInterval>();
  }
}
