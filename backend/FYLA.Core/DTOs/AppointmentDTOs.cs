using System.ComponentModel.DataAnnotations;
using FYLA.Core.Enums;

namespace FYLA.Core.DTOs
{
  public class CreateAppointmentRequestDto
  {
    [Required]
    public int ProviderId { get; set; }

    [Required]
    public List<int> ServiceIds { get; set; } = new();

    [Required]
    public DateTime ScheduledStartTime { get; set; }

    public string? Notes { get; set; }
  }

  public class UpdateAppointmentRequestDto
  {
    public AppointmentStatus? Status { get; set; }
    public string? Notes { get; set; }
    public DateTime? ScheduledStartTime { get; set; }
  }

  public class AppointmentDto
  {
    public int Id { get; set; }
    public int ClientId { get; set; }
    public int ProviderId { get; set; }
    public DateTime ScheduledStartTime { get; set; }
    public DateTime ScheduledEndTime { get; set; }
    public AppointmentStatus Status { get; set; }
    public decimal? TotalPrice { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public UserDto? Client { get; set; }
    public UserDto? Provider { get; set; }
    public List<AppointmentServiceDto> Services { get; set; } = new();
    // public ReviewDto? Review { get; set; } // Temporarily commented out
  }

  public class AppointmentServiceDto
  {
    public int Id { get; set; }
    public int AppointmentId { get; set; }
    public int ServiceId { get; set; }
    public decimal PriceAtBooking { get; set; }
    public ServiceDto Service { get; set; } = null!;
  }

  public class TimeSlotDto
  {
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public bool IsAvailable { get; set; }
    public string? Reason { get; set; }
  }

  public class AvailabilityRequestDto
  {
    [Required]
    public int ProviderId { get; set; }

    [Required]
    public string Date { get; set; } = string.Empty; // Format: YYYY-MM-DD

    public List<int>? ServiceIds { get; set; }
  }

  public class AppointmentListResponseDto
  {
    public List<AppointmentDto> Appointments { get; set; } = new();
    public int Total { get; set; }
    public bool HasMore { get; set; }
  }
}
