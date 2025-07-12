using System.ComponentModel.DataAnnotations;

namespace FYLA.Core.DTOs
{
  // Request DTOs
  public class CreateServiceRequest
  {
    [Required]
    [StringLength(255)]
    public string Name { get; set; } = string.Empty;

    [StringLength(1000)]
    public string? Description { get; set; }

    [Required]
    [Range(0.01, 10000.00)]
    public decimal Price { get; set; }

    [Required]
    [Range(15, 480)] // 15 minutes to 8 hours
    public int EstimatedDurationMinutes { get; set; }

    public bool IsActive { get; set; } = true;
  }

  public class UpdateServiceRequest
  {
    [StringLength(255)]
    public string? Name { get; set; }

    [StringLength(1000)]
    public string? Description { get; set; }

    [Range(0.01, 10000.00)]
    public decimal? Price { get; set; }

    [Range(15, 480)] // 15 minutes to 8 hours
    public int? EstimatedDurationMinutes { get; set; }

    public bool? IsActive { get; set; }
  }

  // Response DTOs
  public class ServiceResponse
  {
    public int Id { get; set; }
    public int ProviderId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public int EstimatedDurationMinutes { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public string ProviderName { get; set; } = string.Empty;
  }

  public class ServiceListResponse
  {
    public List<ServiceResponse> Services { get; set; } = new();
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
  }

  // Time slot management DTOs
  public class TimeSlotRequest
  {
    [Required]
    public DateTime Date { get; set; }

    [Required]
    public int ProviderId { get; set; }

    public List<int>? ServiceIds { get; set; }
  }

  public class TimeSlot
  {
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public bool IsAvailable { get; set; }
    public string? ReasonUnavailable { get; set; }
    public decimal? TotalPrice { get; set; }
    public int? TotalDurationMinutes { get; set; }
  }

  public class AvailableTimeSlotsResponse
  {
    public DateTime Date { get; set; }
    public int ProviderId { get; set; }
    public string ProviderName { get; set; } = string.Empty;
    public List<TimeSlot> TimeSlots { get; set; } = new();
    public List<ServiceResponse> Services { get; set; } = new();
  }

  // Booking DTOs
  public class CreateBookingRequest
  {
    [Required]
    public int ProviderId { get; set; }

    [Required]
    public DateTime ScheduledStartTime { get; set; }

    [Required]
    public List<int> ServiceIds { get; set; } = new();

    [StringLength(500)]
    public string? Notes { get; set; }
  }

  public class BookingResponse
  {
    public int Id { get; set; }
    public int ClientId { get; set; }
    public int ProviderId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public string ProviderName { get; set; } = string.Empty;
    public DateTime ScheduledStartTime { get; set; }
    public DateTime ScheduledEndTime { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal? TotalPrice { get; set; }
    public string? Notes { get; set; }
    public List<ServiceResponse> Services { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
  }
}
