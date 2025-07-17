using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using FYLA.Application.Interfaces;
using FYLA.Core.DTOs;
using FYLA.API.Middleware;

namespace FYLA.API.Controllers
{
  [ApiController]
  [Route("api/[controller]")]
  [Authorize]
  public class AppointmentsController : ControllerBase
  {
    private readonly IAppointmentService _appointmentService;

    public AppointmentsController(IAppointmentService appointmentService)
    {
      _appointmentService = appointmentService;
    }

    [HttpGet("available-slots")]
    [AllowAnonymous]
    public async Task<ActionResult<List<TimeSlotDto>>> GetAvailableTimeSlots([FromQuery] AvailabilityRequestDto request)
    {
      try
      {
        var result = await _appointmentService.GetAvailableTimeSlotsAsync(request);

        if (!result.IsSuccess)
        {
          return BadRequest(result);
        }

        return Ok(result.Data);
      }
      catch (Exception ex)
      {
        Console.WriteLine($"Error getting available time slots: {ex.Message}");
        return StatusCode(500, new { message = "An error occurred while retrieving available time slots" });
      }
    }

    [HttpGet("time-slots")]
    [AllowAnonymous]
    public async Task<ActionResult<List<TimeSlotDto>>> GetTimeSlots(
        [FromQuery] int providerId,
        [FromQuery] string date,
        [FromQuery] string? serviceIds = null)
    {
      try
      {
        // Parse comma-separated serviceIds if provided
        List<int>? serviceIdsList = null;
        if (!string.IsNullOrEmpty(serviceIds))
        {
          try
          {
            serviceIdsList = serviceIds.Split(',', StringSplitOptions.RemoveEmptyEntries)
                                     .Select(int.Parse)
                                     .ToList();
          }
          catch (FormatException)
          {
            return BadRequest(new { message = "Invalid serviceIds format. Use comma-separated integers." });
          }
        }

        var request = new AvailabilityRequestDto
        {
          ProviderId = providerId,
          Date = date,
          ServiceIds = serviceIdsList
        };

        var result = await _appointmentService.GetAvailableTimeSlotsAsync(request);

        if (!result.IsSuccess)
        {
          return BadRequest(result);
        }

        return Ok(result.Data);
      }
      catch (Exception ex)
      {
        Console.WriteLine($"Error getting time slots: {ex.Message}");
        return StatusCode(500, new { message = "An error occurred while retrieving time slots" });
      }
    }

    [HttpPost]
    public async Task<ActionResult<AppointmentDto>> CreateAppointment([FromBody] CreateAppointmentRequestDto request)
    {
      try
      {
        var userId = GetCurrentUserId();
        var result = await _appointmentService.CreateAppointmentAsync(userId, request);

        if (!result.IsSuccess)
        {
          return BadRequest(result);
        }

        return CreatedAtAction(nameof(GetAppointmentById), new { id = result.Data!.Id }, result.Data);
      }
      catch (Exception ex)
      {
        Console.WriteLine($"Error creating appointment: {ex.Message}");
        return StatusCode(500, new { message = "An error occurred while creating the appointment" });
      }
    }

    [HttpGet]
    public async Task<ActionResult<AppointmentListResponseDto>> GetAppointments([FromQuery] int page = 1, [FromQuery] int limit = 20, [FromQuery] string? status = null)
    {
      try
      {
        var userId = GetCurrentUserId();
        var result = await _appointmentService.GetAppointmentsAsync(userId, page, limit, status);

        if (!result.IsSuccess)
        {
          return BadRequest(result);
        }

        return Ok(result.Data);
      }
      catch (Exception ex)
      {
        Console.WriteLine($"Error getting appointments: {ex.Message}");
        return StatusCode(500, new { message = "An error occurred while retrieving appointments" });
      }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<AppointmentDto>> GetAppointmentById(int id)
    {
      try
      {
        var userId = GetCurrentUserId();
        var result = await _appointmentService.GetAppointmentByIdAsync(id, userId);

        if (!result.IsSuccess)
        {
          if (result.ErrorMessage?.Contains("not found") == true)
          {
            return NotFound(result);
          }
          return BadRequest(result);
        }

        return Ok(result.Data);
      }
      catch (Exception ex)
      {
        Console.WriteLine($"Error getting appointment by id {id}: {ex.Message}");
        return StatusCode(500, new { message = "An error occurred while retrieving the appointment" });
      }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<AppointmentDto>> UpdateAppointment(int id, [FromBody] UpdateAppointmentRequestDto request)
    {
      try
      {
        var userId = GetCurrentUserId();

        Console.WriteLine($"Update appointment request - ID: {id}, UserID: {userId}, Status: {request.Status}, Notes: {request.Notes}");

        var result = await _appointmentService.UpdateAppointmentAsync(id, userId, request);

        if (!result.IsSuccess)
        {
          Console.WriteLine($"Update appointment failed: {result.ErrorMessage}");

          if (result.ErrorMessage?.Contains("not found") == true)
          {
            return NotFound(result);
          }
          return BadRequest(result);
        }

        Console.WriteLine("Update appointment successful");
        return Ok(result.Data);
      }
      catch (Exception ex)
      {
        Console.WriteLine($"Error updating appointment: {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
        return StatusCode(500, new { message = "An error occurred while updating the appointment" });
      }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> CancelAppointment(int id)
    {
      try
      {
        var userId = GetCurrentUserId();
        var result = await _appointmentService.CancelAppointmentAsync(id, userId);

        if (!result.IsSuccess)
        {
          if (result.ErrorMessage?.Contains("not found") == true)
          {
            return NotFound(result);
          }
          return BadRequest(result);
        }

        return NoContent();
      }
      catch (Exception ex)
      {
        Console.WriteLine($"Error cancelling appointment {id}: {ex.Message}");
        return StatusCode(500, new { message = "An error occurred while cancelling the appointment" });
      }
    }

    // Add specific endpoints for appointment status updates
    [HttpPatch("{id}/cancel")]
    public async Task<ActionResult<AppointmentDto>> CancelAppointmentStatus(int id)
    {
      try
      {
        var userId = GetCurrentUserId();
        var updateRequest = new UpdateAppointmentRequestDto { Status = Core.Enums.AppointmentStatus.Cancelled };
        var result = await _appointmentService.UpdateAppointmentAsync(id, userId, updateRequest);

        if (!result.IsSuccess)
        {
          if (result.ErrorMessage?.Contains("not found") == true)
          {
            return NotFound(result);
          }
          return BadRequest(result);
        }

        return Ok(result.Data);
      }
      catch (Exception ex)
      {
        Console.WriteLine($"Error cancelling appointment {id}: {ex.Message}");
        return StatusCode(500, new { message = "An error occurred while cancelling the appointment" });
      }
    }

    [HttpPatch("{id}/confirm")]
    public async Task<ActionResult<AppointmentDto>> ConfirmAppointment(int id)
    {
      try
      {
        var userId = GetCurrentUserId();
        var updateRequest = new UpdateAppointmentRequestDto { Status = Core.Enums.AppointmentStatus.Confirmed };
        var result = await _appointmentService.UpdateAppointmentAsync(id, userId, updateRequest);

        if (!result.IsSuccess)
        {
          if (result.ErrorMessage?.Contains("not found") == true)
          {
            return NotFound(result);
          }
          return BadRequest(result);
        }

        return Ok(result.Data);
      }
      catch (Exception ex)
      {
        Console.WriteLine($"Error confirming appointment {id}: {ex.Message}");
        return StatusCode(500, new { message = "An error occurred while confirming the appointment" });
      }
    }

    [HttpPatch("{id}/complete")]
    public async Task<ActionResult<AppointmentDto>> CompleteAppointment(int id)
    {
      try
      {
        var userId = GetCurrentUserId();
        var updateRequest = new UpdateAppointmentRequestDto { Status = Core.Enums.AppointmentStatus.Completed };
        var result = await _appointmentService.UpdateAppointmentAsync(id, userId, updateRequest);

        if (!result.IsSuccess)
        {
          if (result.ErrorMessage?.Contains("not found") == true)
          {
            return NotFound(result);
          }
          return BadRequest(result);
        }

        return Ok(result.Data);
      }
      catch (Exception ex)
      {
        Console.WriteLine($"Error completing appointment {id}: {ex.Message}");
        return StatusCode(500, new { message = "An error occurred while completing the appointment" });
      }
    }

    [HttpPatch("{id}/no-show")]
    public async Task<ActionResult<AppointmentDto>> MarkAppointmentNoShow(int id)
    {
      try
      {
        var userId = GetCurrentUserId();
        var updateRequest = new UpdateAppointmentRequestDto { Status = Core.Enums.AppointmentStatus.NoShow };
        var result = await _appointmentService.UpdateAppointmentAsync(id, userId, updateRequest);

        if (!result.IsSuccess)
        {
          if (result.ErrorMessage?.Contains("not found") == true)
          {
            return NotFound(result);
          }
          return BadRequest(result);
        }

        return Ok(result.Data);
      }
      catch (Exception ex)
      {
        Console.WriteLine($"Error marking appointment {id} as no-show: {ex.Message}");
        return StatusCode(500, new { message = "An error occurred while updating the appointment" });
      }
    }

    private int GetCurrentUserId()
    {
      return User.GetUserId();
    }
  }
}
