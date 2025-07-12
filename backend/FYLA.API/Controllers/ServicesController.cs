using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using FYLA.Application.Interfaces;
using FYLA.Core.DTOs;

namespace FYLA.API.Controllers
{
  [ApiController]
  [Route("api/[controller]")]
  [Authorize]
  public class ServicesController : ControllerBase
  {
    private readonly IServiceManagementService _serviceManagementService;
    private readonly ILogger<ServicesController> _logger;

    public ServicesController(IServiceManagementService serviceManagementService, ILogger<ServicesController> logger)
    {
      _serviceManagementService = serviceManagementService;
      _logger = logger;
    }

    #region Service CRUD Endpoints

    /// <summary>
    /// Create a new service (Service Providers only)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "ServiceProvider")]
    public async Task<ActionResult<ServiceResponse>> CreateService([FromBody] CreateServiceRequest request)
    {
      try
      {
        var userId = GetUserId();
        var service = await _serviceManagementService.CreateServiceAsync(userId, request);
        return CreatedAtAction(nameof(GetService), new { id = service.Id }, service);
      }
      catch (UnauthorizedAccessException ex)
      {
        return Forbid(ex.Message);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error creating service");
        return StatusCode(500, "An error occurred while creating the service");
      }
    }

    /// <summary>
    /// Get a specific service by ID
    /// </summary>
    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<ServiceResponse>> GetService(int id)
    {
      try
      {
        var service = await _serviceManagementService.GetServiceAsync(id);
        return Ok(service);
      }
      catch (KeyNotFoundException ex)
      {
        return NotFound(ex.Message);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error getting service {ServiceId}", id);
        return StatusCode(500, "An error occurred while retrieving the service");
      }
    }

    /// <summary>
    /// Get all services for a specific provider
    /// </summary>
    [HttpGet("provider/{providerId}")]
    [AllowAnonymous]
    public async Task<ActionResult<ServiceListResponse>> GetProviderServices(
      int providerId,
      [FromQuery] int page = 1,
      [FromQuery] int pageSize = 20)
    {
      try
      {
        var services = await _serviceManagementService.GetProviderServicesAsync(providerId, page, pageSize);
        return Ok(services);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error getting services for provider {ProviderId}", providerId);
        return StatusCode(500, "An error occurred while retrieving services");
      }
    }

    /// <summary>
    /// Get services for the current provider
    /// </summary>
    [HttpGet("my-services")]
    [Authorize(Roles = "ServiceProvider")]
    public async Task<ActionResult<ServiceListResponse>> GetMyServices(
      [FromQuery] int page = 1,
      [FromQuery] int pageSize = 20)
    {
      try
      {
        var userId = GetUserId();
        var services = await _serviceManagementService.GetProviderServicesAsync(userId, page, pageSize);
        return Ok(services);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error getting services for current provider");
        return StatusCode(500, "An error occurred while retrieving services");
      }
    }

    /// <summary>
    /// Get all services (with pagination and filtering)
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ServiceListResponse>> GetAllServices(
      [FromQuery] int page = 1,
      [FromQuery] int pageSize = 20,
      [FromQuery] bool activeOnly = true)
    {
      try
      {
        var services = await _serviceManagementService.GetAllServicesAsync(page, pageSize, activeOnly);
        return Ok(services);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error getting all services");
        return StatusCode(500, "An error occurred while retrieving services");
      }
    }

    /// <summary>
    /// Update a service (Service Provider only, own services)
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "ServiceProvider")]
    public async Task<ActionResult<ServiceResponse>> UpdateService(int id, [FromBody] UpdateServiceRequest request)
    {
      try
      {
        var userId = GetUserId();
        var service = await _serviceManagementService.UpdateServiceAsync(id, userId, request);
        return Ok(service);
      }
      catch (KeyNotFoundException ex)
      {
        return NotFound(ex.Message);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error updating service {ServiceId}", id);
        return StatusCode(500, "An error occurred while updating the service");
      }
    }

    /// <summary>
    /// Delete a service (Service Provider only, own services)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "ServiceProvider")]
    public async Task<ActionResult> DeleteService(int id)
    {
      try
      {
        var userId = GetUserId();
        var deleted = await _serviceManagementService.DeleteServiceAsync(id, userId);

        if (!deleted)
        {
          return NotFound("Service not found");
        }

        return NoContent();
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error deleting service {ServiceId}", id);
        return StatusCode(500, "An error occurred while deleting the service");
      }
    }

    #endregion

    #region Time Slot Endpoints

    /// <summary>
    /// Get available time slots for a provider on a specific date
    /// </summary>
    [HttpPost("time-slots")]
    [AllowAnonymous]
    public async Task<ActionResult<AvailableTimeSlotsResponse>> GetAvailableTimeSlots([FromBody] TimeSlotRequest request)
    {
      try
      {
        var timeSlots = await _serviceManagementService.GetAvailableTimeSlotsAsync(request);
        return Ok(timeSlots);
      }
      catch (KeyNotFoundException ex)
      {
        return NotFound(ex.Message);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error getting available time slots");
        return StatusCode(500, "An error occurred while retrieving time slots");
      }
    }

    /// <summary>
    /// Check if a specific time slot is available
    /// </summary>
    [HttpGet("time-slots/check")]
    [AllowAnonymous]
    public async Task<ActionResult<bool>> CheckTimeSlotAvailability(
      [FromQuery] int providerId,
      [FromQuery] DateTime startTime,
      [FromQuery] DateTime endTime)
    {
      try
      {
        var isAvailable = await _serviceManagementService.IsTimeSlotAvailableAsync(providerId, startTime, endTime);
        return Ok(new { isAvailable });
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error checking time slot availability");
        return StatusCode(500, "An error occurred while checking availability");
      }
    }

    #endregion

    #region Booking Endpoints

    /// <summary>
    /// Create a new booking (Clients only)
    /// </summary>
    [HttpPost("bookings")]
    [Authorize(Roles = "Client")]
    public async Task<ActionResult<BookingResponse>> CreateBooking([FromBody] CreateBookingRequest request)
    {
      try
      {
        var userId = GetUserId();
        var booking = await _serviceManagementService.CreateBookingAsync(userId, request);
        return CreatedAtAction(nameof(GetBooking), new { id = booking.Id }, booking);
      }
      catch (ArgumentException ex)
      {
        return BadRequest(ex.Message);
      }
      catch (InvalidOperationException ex)
      {
        return Conflict(ex.Message);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error creating booking");
        return StatusCode(500, "An error occurred while creating the booking");
      }
    }

    /// <summary>
    /// Get a specific booking by ID
    /// </summary>
    [HttpGet("bookings/{id}")]
    public async Task<ActionResult<BookingResponse>> GetBooking(int id)
    {
      try
      {
        var userId = GetUserId();
        var booking = await _serviceManagementService.GetBookingAsync(id, userId);

        if (booking == null)
        {
          return NotFound("Booking not found");
        }

        return Ok(booking);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error getting booking {BookingId}", id);
        return StatusCode(500, "An error occurred while retrieving the booking");
      }
    }

    /// <summary>
    /// Get bookings for the current user
    /// </summary>
    [HttpGet("bookings")]
    public async Task<ActionResult<List<BookingResponse>>> GetMyBookings()
    {
      try
      {
        var userId = GetUserId();
        var userRole = GetUserRole();
        var isProvider = userRole == "ServiceProvider";

        var bookings = await _serviceManagementService.GetUserBookingsAsync(userId, isProvider);
        return Ok(bookings);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error getting user bookings");
        return StatusCode(500, "An error occurred while retrieving bookings");
      }
    }

    /// <summary>
    /// Update booking status (both clients and providers can update status)
    /// </summary>
    [HttpPatch("bookings/{id}/status")]
    public async Task<ActionResult<BookingResponse>> UpdateBookingStatus(int id, [FromBody] UpdateBookingStatusRequest request)
    {
      try
      {
        var userId = GetUserId();
        var booking = await _serviceManagementService.UpdateBookingStatusAsync(id, userId, request.Status);
        return Ok(booking);
      }
      catch (KeyNotFoundException ex)
      {
        return NotFound(ex.Message);
      }
      catch (UnauthorizedAccessException ex)
      {
        return Forbid(ex.Message);
      }
      catch (ArgumentException ex)
      {
        return BadRequest(ex.Message);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error updating booking status");
        return StatusCode(500, "An error occurred while updating the booking");
      }
    }

    #endregion

    #region Utility Endpoints

    /// <summary>
    /// Calculate total price for selected services
    /// </summary>
    [HttpPost("calculate-price")]
    [AllowAnonymous]
    public async Task<ActionResult<decimal>> CalculatePrice([FromBody] List<int> serviceIds)
    {
      try
      {
        var totalPrice = await _serviceManagementService.CalculateTotalPriceAsync(serviceIds);
        return Ok(new { totalPrice });
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error calculating price");
        return StatusCode(500, "An error occurred while calculating price");
      }
    }

    /// <summary>
    /// Calculate total duration for selected services
    /// </summary>
    [HttpPost("calculate-duration")]
    [AllowAnonymous]
    public async Task<ActionResult<int>> CalculateDuration([FromBody] List<int> serviceIds)
    {
      try
      {
        var totalDuration = await _serviceManagementService.CalculateTotalDurationAsync(serviceIds);
        return Ok(new { totalDurationMinutes = totalDuration });
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error calculating duration");
        return StatusCode(500, "An error occurred while calculating duration");
      }
    }

    #endregion

    #region Helper Methods

    private int GetUserId()
    {
      var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
      if (int.TryParse(userIdClaim, out var userId))
      {
        return userId;
      }
      throw new UnauthorizedAccessException("Invalid user ID in token");
    }

    private string GetUserRole()
    {
      return User.FindFirst(ClaimTypes.Role)?.Value ?? throw new UnauthorizedAccessException("No role found in token");
    }

    #endregion
  }

  // Additional DTOs for controller
  public class UpdateBookingStatusRequest
  {
    public string Status { get; set; } = string.Empty;
  }
}
