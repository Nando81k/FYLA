using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Concurrent;
using System.Security.Claims;
using FYLA.Application.Interfaces;
using FYLA.Core.DTOs;
using FYLA.Core.Enums;
using FYLA.Infrastructure.Data;
using FYLA.API.Middleware;

namespace FYLA.API.Controllers
{
  [ApiController]
  [Route("api/time-slots")]
  [Authorize]
  public class TimeSlotsController : ControllerBase
  {
    private readonly IAppointmentService _appointmentService;
    private readonly ApplicationDbContext _context;
    private static readonly ConcurrentDictionary<string, TimeSlotReservationData> _temporaryReservations = new();

    public TimeSlotsController(IAppointmentService appointmentService, ApplicationDbContext context)
    {
      _appointmentService = appointmentService;
      _context = context;
    }

    [HttpGet("providers/{providerId}/availability")]
    [AllowAnonymous]
    public async Task<ActionResult<TimeSlotAvailabilityDto>> GetAvailableSlots(
        int providerId,
        [FromQuery] string date,
        [FromQuery] int? serviceId = null,
        [FromQuery] int? duration = null,
        [FromQuery] decimal? minPrice = null,
        [FromQuery] decimal? maxPrice = null,
        [FromQuery] string? timePreference = null)
    {
      try
      {
        // First check if provider exists with correct role
        var provider = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == providerId && u.Role == "ServiceProvider");
        if (provider == null)
        {
          return BadRequest(new { message = "Provider not found" });
        }

        var request = new AvailabilityRequestDto
        {
          ProviderId = providerId,
          Date = date,
          ServiceIds = serviceId.HasValue ? new List<int> { serviceId.Value } : null
        };

        var result = await _appointmentService.GetAvailableTimeSlotsAsync(request);

        if (!result.IsSuccess)
        {
          return BadRequest(result);
        }

        // Convert to the format expected by frontend
        var timeSlotAvailability = new TimeSlotAvailabilityDto
        {
          Date = date,
          ProviderId = providerId,
          Slots = result.Data?.Select(slot => new TimeSlotCustomDto
          {
            Id = $"slot_{slot.StartTime.Replace(":", "")}_{providerId}",
            StartTime = slot.StartTime,
            EndTime = slot.EndTime,
            IsAvailable = slot.IsAvailable,
            Reason = slot.Reason,
            Price = 0, // Default price - would need service info
            Duration = 60 // Default duration
          }).ToList() ?? new List<TimeSlotCustomDto>(),
          BusinessHours = new BusinessHoursDto
          {
            StartTime = "09:00",
            EndTime = "18:00",
            IsOpen = true
          },
          Breaks = new List<BreakDto>
                    {
                        new BreakDto
                        {
                            StartTime = "12:00",
                            EndTime = "13:00",
                            Reason = "Lunch Break"
                        }
                    }
        };

        return Ok(timeSlotAvailability);
      }
      catch (Exception ex)
      {
        Console.WriteLine($"Error getting available time slots: {ex.Message}");
        return StatusCode(500, new { message = "An error occurred while retrieving available time slots" });
      }
    }

    [HttpPost("check-conflicts")]
    [AllowAnonymous]
    public async Task<ActionResult<List<BookingConflictDto>>> CheckBookingConflicts([FromBody] TimeSlotRequestDto request)
    {
      try
      {
        // For now, return empty conflicts - can be expanded later
        return Ok(new List<BookingConflictDto>());
      }
      catch (Exception ex)
      {
        Console.WriteLine($"Error checking booking conflicts: {ex.Message}");
        return StatusCode(500, new { message = "An error occurred while checking booking conflicts" });
      }
    }

    [HttpPost("reserve")]
    [AllowAnonymous]
    public async Task<ActionResult<TimeSlotReservationDto>> ReserveTimeSlot([FromBody] TimeSlotRequestDto request)
    {
      try
      {
        // For testing - use the logged in user ID from frontend (Emma Johnson = 25)
        var userId = 25; // GetCurrentUserId();
        var reservationId = $"reservation_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}";

        // Store temporary reservation data
        var reservationData = new TimeSlotReservationData
        {
          Id = reservationId,
          ClientId = userId,
          ProviderId = request.ProviderId,
          ServiceId = request.ServiceId,
          RequestedStartTime = request.RequestedStartTime,
          Duration = request.Duration,
          CreatedAt = DateTime.UtcNow,
          ExpiresAt = DateTime.UtcNow.AddMinutes(15) // 15 minute expiry
        };

        _temporaryReservations[reservationId] = reservationData;

        var endTime = request.RequestedStartTime.AddMinutes(request.Duration);

        var reservation = new TimeSlotReservationDto
        {
          Id = reservationId,
          TimeSlotId = $"slot_{request.RequestedStartTime:yyyyMMddHHmmss}_{request.ProviderId}",
          ClientId = userId,
          ProviderId = request.ProviderId,
          ServiceId = request.ServiceId,
          StartTime = request.RequestedStartTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
          EndTime = endTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
          Status = "pending",
          ReservedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
          ExpiresAt = reservationData.ExpiresAt.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        };

        return Ok(reservation);
      }
      catch (Exception ex)
      {
        Console.WriteLine($"Error reserving time slot: {ex.Message}");
        return StatusCode(500, new { message = "An error occurred while reserving the time slot" });
      }
    }

    [HttpPost("reservations/{reservationId}/confirm")]
    [AllowAnonymous]
    public async Task<ActionResult<ReservationConfirmationDto>> ConfirmReservation(string reservationId)
    {
      try
      {
        // For testing - use the logged in user ID from frontend (Emma Johnson = 25)
        var userId = 25; // GetCurrentUserId();

        // Check if temporary reservation exists
        if (!_temporaryReservations.TryGetValue(reservationId, out var reservationData))
        {
          return NotFound(new { message = "Reservation not found or expired" });
        }

        // Check if reservation belongs to current user (skip for testing)
        // if (reservationData.ClientId != userId)
        // {
        //   return Forbid("You can only confirm your own reservations");
        // }

        // Check if reservation has expired
        if (DateTime.UtcNow > reservationData.ExpiresAt)
        {
          _temporaryReservations.TryRemove(reservationId, out _);
          return BadRequest(new { message = "Reservation has expired" });
        }

        // Create actual appointment
        var appointmentRequest = new CreateAppointmentRequestDto
        {
          ProviderId = reservationData.ProviderId,
          ServiceIds = new List<int> { reservationData.ServiceId },
          ScheduledStartTime = reservationData.RequestedStartTime,
          Notes = $"Booked via time slot reservation {reservationId}"
        };

        var appointmentResult = await _appointmentService.CreateAppointmentAsync(userId, appointmentRequest);

        if (!appointmentResult.IsSuccess)
        {
          return BadRequest(new { message = appointmentResult.ErrorMessage });
        }

        // Remove temporary reservation
        _temporaryReservations.TryRemove(reservationId, out _);

        var confirmation = new ReservationConfirmationDto
        {
          Success = true,
          BookingId = appointmentResult.Data?.Id.ToString(),
          AppointmentId = appointmentResult.Data?.Id ?? 0,
          Message = "Reservation confirmed successfully"
        };

        return Ok(confirmation);
      }
      catch (Exception ex)
      {
        Console.WriteLine($"Error confirming reservation {reservationId}: {ex.Message}");
        return StatusCode(500, new { message = "An error occurred while confirming the reservation" });
      }
    }

    [HttpDelete("reservations/{reservationId}")]
    public async Task<ActionResult> CancelReservation(string reservationId)
    {
      try
      {
        var userId = GetCurrentUserId();

        if (!_temporaryReservations.TryGetValue(reservationId, out var reservationData))
        {
          return NotFound(new { message = "Reservation not found" });
        }

        if (reservationData.ClientId != userId)
        {
          return Forbid("You can only cancel your own reservations");
        }

        _temporaryReservations.TryRemove(reservationId, out _);
        return NoContent();
      }
      catch (Exception ex)
      {
        Console.WriteLine($"Error cancelling reservation {reservationId}: {ex.Message}");
        return StatusCode(500, new { message = "An error occurred while cancelling the reservation" });
      }
    }

    [HttpGet("stats")]
    public async Task<ActionResult<TimeSlotStatsDto>> GetTimeSlotStats([FromQuery] int? providerId = null)
    {
      try
      {
        // For now, return basic stats - can be expanded later
        var stats = new TimeSlotStatsDto
        {
          TotalReservations = _temporaryReservations.Count,
          ActiveReservations = _temporaryReservations.Values.Count(r => DateTime.UtcNow < r.ExpiresAt),
          ExpiredReservations = _temporaryReservations.Values.Count(r => DateTime.UtcNow >= r.ExpiresAt)
        };

        return Ok(stats);
      }
      catch (Exception ex)
      {
        Console.WriteLine($"Error getting time slot stats: {ex.Message}");
        return StatusCode(500, new { message = "An error occurred while retrieving time slot stats" });
      }
    }

    // Cleanup expired reservations (should be called periodically)
    [HttpPost("cleanup")]
    public async Task<ActionResult> CleanupExpiredReservations()
    {
      try
      {
        var expiredKeys = _temporaryReservations
            .Where(kvp => DateTime.UtcNow > kvp.Value.ExpiresAt)
            .Select(kvp => kvp.Key)
            .ToList();

        foreach (var key in expiredKeys)
        {
          _temporaryReservations.TryRemove(key, out _);
        }

        return Ok(new { message = $"Cleaned up {expiredKeys.Count} expired reservations" });
      }
      catch (Exception ex)
      {
        Console.WriteLine($"Error cleaning up expired reservations: {ex.Message}");
        return StatusCode(500, new { message = "An error occurred during cleanup" });
      }
    }

    private int GetCurrentUserId()
    {
      try
      {
        return User.GetUserId();
      }
      catch (Exception ex)
      {
        Console.WriteLine($"Error getting user ID: {ex.Message}");
        Console.WriteLine($"User identity: {User.Identity?.Name}, IsAuthenticated: {User.Identity?.IsAuthenticated}");
        Console.WriteLine($"Claims: {string.Join(", ", User.Claims.Select(c => $"{c.Type}={c.Value}"))}");
        throw;
      }
    }
  }

  // Supporting DTOs and data classes
  public class TimeSlotReservationData
  {
    public string Id { get; set; } = string.Empty;
    public int ClientId { get; set; }
    public int ProviderId { get; set; }
    public int ServiceId { get; set; }
    public DateTime RequestedStartTime { get; set; }
    public int Duration { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
  }

  public class TimeSlotAvailabilityDto
  {
    public string Date { get; set; } = string.Empty;
    public int ProviderId { get; set; }
    public List<TimeSlotCustomDto> Slots { get; set; } = new();
    public BusinessHoursDto BusinessHours { get; set; } = new();
    public List<BreakDto> Breaks { get; set; } = new();
  }

  public class BusinessHoursDto
  {
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public bool IsOpen { get; set; }
  }

  public class BreakDto
  {
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
  }

  public class BookingConflictDto
  {
    public string Type { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public DateTime ConflictTime { get; set; }
  }

  public class TimeSlotRequestDto
  {
    public int ProviderId { get; set; }
    public int ServiceId { get; set; }
    public DateTime RequestedStartTime { get; set; }
    public int Duration { get; set; }
    public string? Notes { get; set; }
  }

  public class TimeSlotReservationDto
  {
    public string Id { get; set; } = string.Empty;
    public string TimeSlotId { get; set; } = string.Empty;
    public int ClientId { get; set; }
    public int ProviderId { get; set; }
    public int ServiceId { get; set; }
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string ReservedAt { get; set; } = string.Empty;
    public string ExpiresAt { get; set; } = string.Empty;
  }

  public class ReservationConfirmationDto
  {
    public bool Success { get; set; }
    public string? BookingId { get; set; }
    public int AppointmentId { get; set; }
    public string Message { get; set; } = string.Empty;
  }

  public class TimeSlotStatsDto
  {
    public int TotalReservations { get; set; }
    public int ActiveReservations { get; set; }
    public int ExpiredReservations { get; set; }
  }

  public class TimeSlotCustomDto
  {
    public string Id { get; set; } = string.Empty;
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public bool IsAvailable { get; set; }
    public decimal Price { get; set; }
    public int Duration { get; set; }
    public string? Reason { get; set; }
  }
}
