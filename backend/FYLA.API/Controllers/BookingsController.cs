using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FYLA.API.Extensions;
using FYLA.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using FYLA.Core.DTOs;
using FYLA.Application.Services;

namespace FYLA.API.Controllers
{
  [ApiController]
  [Route("api/[controller]")]
  [Authorize]
  public class BookingsController : ControllerBase
  {
    private readonly ApplicationDbContext _context;
    private readonly ILogger<BookingsController> _logger;
    private readonly IAvailabilityService _availabilityService;

    public BookingsController(
      ApplicationDbContext context,
      ILogger<BookingsController> logger,
      IAvailabilityService availabilityService)
    {
      _context = context;
      _logger = logger;
      _availabilityService = availabilityService;
    }

    /// <summary>
    /// Get bookings for the current user
    /// </summary>
    [HttpGet]
    public async Task<ActionResult> GetBookings([FromQuery] string? status = null, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
      try
      {
        var userId = User.GetUserId();
        _logger.LogInformation("Getting bookings for user {UserId}", userId);

        // For now, return a simple mock response until we implement proper booking system
        var response = new
        {
          bookings = new object[0], // Empty array for now
          total = 0,
          page = page,
          pageSize = pageSize,
          totalPages = 0,
          hasMore = false
        };

        return Ok(response);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error getting bookings for user");
        return StatusCode(500, new { message = "An error occurred while retrieving bookings." });
      }
    }

    /// <summary>
    /// Create a new booking
    /// </summary>
    [HttpPost("create")]
    public async Task<ActionResult> CreateBooking([FromBody] object bookingRequest)
    {
      try
      {
        var userId = User.GetUserId();
        _logger.LogInformation("Creating booking for user {UserId}", userId);

        // For now, return a simple mock response
        var response = new
        {
          success = true,
          bookingId = Guid.NewGuid().ToString(),
          message = "Booking created successfully (mock)"
        };

        return Ok(response);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error creating booking for user");
        return StatusCode(500, new { message = "An error occurred while creating the booking." });
      }
    }

    /// <summary>
    /// Get a specific booking by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult> GetBooking(string id)
    {
      try
      {
        var userId = User.GetUserId();
        _logger.LogInformation("Getting booking {BookingId} for user {UserId}", id, userId);

        // For now, return a simple mock response
        var response = new
        {
          id = id,
          status = "confirmed",
          message = "Mock booking details"
        };

        return Ok(response);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error getting booking {BookingId}", id);
        return StatusCode(500, new { message = "An error occurred while retrieving the booking." });
      }
    }

    /// <summary>
    /// Validate booking data
    /// </summary>
    [HttpPost("validate")]
    public async Task<ActionResult> ValidateBooking([FromBody] object bookingData)
    {
      try
      {
        var userId = User.GetUserId();
        _logger.LogInformation("Validating booking for user {UserId}", userId);

        // For now, return a simple validation response
        var response = new
        {
          isValid = true,
          errors = new string[0],
          warnings = new string[0]
        };

        return Ok(response);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error validating booking for user");
        return StatusCode(500, new { message = "An error occurred while validating the booking." });
      }
    }

    /// <summary>
    /// Get booking packages for a provider
    /// </summary>
    [HttpGet("packages/{providerId}")]
    [AllowAnonymous] // Temporarily allow anonymous access for testing
    public async Task<ActionResult> GetBookingPackages(int providerId)
    {
      try
      {
        _logger.LogInformation("Getting booking packages for provider {ProviderId}", providerId);

        // Mock response for booking packages
        var response = new
        {
          packages = new[]
          {
            new
            {
              id = 1,
              name = "Standard Package",
              description = "Standard booking package",
              price = 100.00,
              duration = 60,
              services = new[] { "Basic Service" }
            },
            new
            {
              id = 2,
              name = "Premium Package",
              description = "Premium booking package with extras",
              price = 200.00,
              duration = 120,
              services = new[] { "Premium Service", "Extra Service" }
            }
          },
          total = 2
        };

        return Ok(response);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error getting booking packages for provider {ProviderId}", providerId);
        return StatusCode(500, new { message = "An error occurred while retrieving booking packages." });
      }
    }

    /// <summary>
    /// Get availability for bookings
    /// </summary>
    [HttpGet("availability")]
    [AllowAnonymous] // Temporarily allow anonymous access for testing
    public async Task<ActionResult> GetAvailability([FromQuery] int? providerId = null, [FromQuery] string? date = null)
    {
      try
      {
        var userId = User.GetUserId();
        _logger.LogInformation("Getting availability for user {UserId}, provider {ProviderId}, date {Date}", userId, providerId, date);

        // Mock availability response
        var response = new
        {
          available = true,
          timeSlots = new[]
          {
            new
            {
              time = "09:00",
              available = true,
              price = 50.00
            },
            new
            {
              time = "10:00",
              available = true,
              price = 50.00
            },
            new
            {
              time = "11:00",
              available = false,
              price = 50.00
            },
            new
            {
              time = "14:00",
              available = true,
              price = 75.00
            },
            new
            {
              time = "15:00",
              available = true,
              price = 75.00
            }
          },
          date = date ?? DateTime.Now.ToString("yyyy-MM-dd"),
          providerId = providerId
        };

        return Ok(response);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error getting availability");
        return StatusCode(500, new { message = "An error occurred while retrieving availability." });
      }
    }

    /// <summary>
    /// Set provider availability rules
    /// </summary>
    [HttpPost("availability/rules/{providerId}")]
    [Authorize(Roles = "ServiceProvider")]
    public async Task<ActionResult<SetAvailabilityRulesResponseDto>> SetAvailabilityRules(
      int providerId,
      [FromBody] SetAvailabilityRulesRequestDto request)
    {
      try
      {
        var userId = User.GetUserId();
        _logger.LogInformation("Setting availability rules for provider {ProviderId} by user {UserId}", providerId, userId);

        // Ensure the user can only set rules for their own provider account
        if (userId != providerId)
        {
          return Forbid("You can only set availability rules for your own account");
        }

        // Validate the request
        if (!ModelState.IsValid)
        {
          return BadRequest(ModelState);
        }

        // Save the availability rules using the real service
        var savedRules = await _availabilityService.SetAvailabilityRulesAsync(providerId, request.Rules);

        var response = new SetAvailabilityRulesResponseDto
        {
          Rules = savedRules,
          Success = true,
          Message = "Availability rules saved successfully"
        };

        _logger.LogInformation("Successfully saved {Count} availability rules for provider {ProviderId}",
          savedRules.Count, providerId);

        return Ok(response);
      }
      catch (ArgumentException ex)
      {
        _logger.LogWarning(ex, "Invalid request for setting availability rules for provider {ProviderId}", providerId);
        return BadRequest(new { message = ex.Message });
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error setting availability rules for provider {ProviderId}", providerId);
        return StatusCode(500, new { message = "An error occurred while saving availability rules." });
      }
    }

    /// <summary>
    /// Get provider availability rules
    /// </summary>
    [HttpGet("availability/rules/{providerId}")]
    [AllowAnonymous] // Allow anonymous access for clients to view provider availability
    public async Task<ActionResult<List<AvailabilityRuleDto>>> GetAvailabilityRules(int providerId)
    {
      try
      {
        _logger.LogInformation("Getting availability rules for provider {ProviderId}", providerId);

        var rules = await _availabilityService.GetAvailabilityRulesAsync(providerId);

        return Ok(rules);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error getting availability rules for provider {ProviderId}", providerId);
        return StatusCode(500, new { message = "An error occurred while retrieving availability rules." });
      }
    }
  }
}
