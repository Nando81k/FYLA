using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FYLA.Core.Entities
{
  public class BreakInterval
  {
    [Key]
    public int Id { get; set; }

    [Required]
    public string ExternalId { get; set; } = string.Empty; // For frontend compatibility

    [Required]
    public int AvailabilityRuleId { get; set; }

    [Required]
    [MaxLength(5)]
    public string StartTime { get; set; } = string.Empty; // HH:mm format

    [Required]
    [MaxLength(5)]
    public string EndTime { get; set; } = string.Empty; // HH:mm format

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty; // e.g., "Lunch Break"

    public bool IsRecurring { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("AvailabilityRuleId")]
    public virtual AvailabilityRule AvailabilityRule { get; set; } = null!;
  }
}
