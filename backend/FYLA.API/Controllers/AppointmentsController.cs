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
        var result = await _appointmentService.UpdateAppointmentAsync(id, userId, request);

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
        Console.WriteLine($"Error updating appointment {id}: {ex.Message}");
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

    private int GetCurrentUserId()
    {
      return User.GetUserId();
    }
  }
}
