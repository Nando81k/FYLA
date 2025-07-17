using System.ComponentModel.DataAnnotations;

namespace FYLA.Core.DTOs
{
  public class AvailabilityRuleDto
  {
    public string Id { get; set; } = string.Empty;
    public int ProviderId { get; set; }

    [Range(0, 6)]
    public int DayOfWeek { get; set; } // 0-6, Sunday = 0

    [Required]
    public string StartTime { get; set; } = string.Empty; // HH:mm format

    [Required]
    public string EndTime { get; set; } = string.Empty; // HH:mm format

    public bool IsActive { get; set; } = true;

    [Required]
    public string EffectiveFrom { get; set; } = string.Empty;

    public string? EffectiveTo { get; set; }

    [Required]
    public string Timezone { get; set; } = string.Empty;

    public List<BreakIntervalDto>? BreakIntervals { get; set; }
  }

  public class BreakIntervalDto
  {
    public string Id { get; set; } = string.Empty;

    [Required]
    public string StartTime { get; set; } = string.Empty; // HH:mm format

    [Required]
    public string EndTime { get; set; } = string.Empty; // HH:mm format

    [Required]
    public string Name { get; set; } = string.Empty; // e.g., "Lunch Break"

    public bool IsRecurring { get; set; } = true;
  }

  public class SetAvailabilityRulesRequestDto
  {
    [Required]
    public List<AvailabilityRuleDto> Rules { get; set; } = new();
  }

  public class SetAvailabilityRulesResponseDto
  {
    public List<AvailabilityRuleDto> Rules { get; set; } = new();
    public bool Success { get; set; } = true;
    public string? Message { get; set; }
  }
}
