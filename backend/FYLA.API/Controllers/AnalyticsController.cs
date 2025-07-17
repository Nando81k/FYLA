using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FYLA.Infrastructure.Data;
using FYLA.Core.Entities;
using FYLA.Core.DTOs;
using FYLA.Core.Enums;
using System.Security.Claims;

namespace FYLA.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AnalyticsController : ControllerBase
{
  private readonly ApplicationDbContext _context;
  private readonly ILogger<AnalyticsController> _logger;

  public AnalyticsController(ApplicationDbContext context, ILogger<AnalyticsController> logger)
  {
    _context = context;
    _logger = logger;
  }

  [HttpGet("provider")]
  public async Task<ActionResult<ProviderAnalyticsDto>> GetProviderAnalytics(
      [FromQuery] string period = "month")
  {
    try
    {
      var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
      if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
      {
        return Unauthorized(new { message = "Invalid user token" });
      }

      // Verify user is a service provider
      var user = await _context.Users.FindAsync(userId);
      if (user == null || user.Role != "ServiceProvider")
      {
        return Forbid("Only service providers can access analytics");
      }

      // Calculate date range based on period
      DateTime startDate = period.ToLower() switch
      {
        "week" => DateTime.UtcNow.AddDays(-7),
        "month" => DateTime.UtcNow.AddMonths(-1),
        "quarter" => DateTime.UtcNow.AddMonths(-3),
        "year" => DateTime.UtcNow.AddYears(-1),
        _ => DateTime.UtcNow.AddMonths(-1) // Default to month
      };

      // Get appointments in the date range
      var appointments = await _context.Appointments
          .Include(a => a.Services)
          .ThenInclude(s => s.Service)
          .Where(a => a.ProviderId == userId && a.ScheduledStartTime >= startDate)
          .ToListAsync();

      // Calculate analytics
      var totalAppointments = appointments.Count;
      var completedAppointments = appointments.Count(a => a.Status == AppointmentStatus.Completed);
      var cancelledAppointments = appointments.Count(a => a.Status == AppointmentStatus.Cancelled);
      var totalRevenue = appointments.Where(a => a.Status == AppointmentStatus.Completed).Sum(a => a.TotalPrice ?? 0);

      // Calculate previous period for comparison
      var previousPeriodStart = period.ToLower() switch
      {
        "week" => DateTime.UtcNow.AddDays(-14),
        "month" => DateTime.UtcNow.AddMonths(-2),
        "quarter" => DateTime.UtcNow.AddMonths(-6),
        "year" => DateTime.UtcNow.AddYears(-2),
        _ => DateTime.UtcNow.AddMonths(-2)
      };

      var previousAppointments = await _context.Appointments
          .Include(a => a.Services)
          .ThenInclude(s => s.Service)
          .Where(a => a.ProviderId == userId && a.ScheduledStartTime >= previousPeriodStart && a.ScheduledStartTime < startDate)
          .ToListAsync();

      var previousRevenue = previousAppointments.Where(a => a.Status == AppointmentStatus.Completed).Sum(a => a.TotalPrice ?? 0);
      var revenueGrowth = previousRevenue > 0 ? (double)((totalRevenue - previousRevenue) / previousRevenue * 100) : 0;

      // Get most requested service
      var mostRequestedService = appointments
          .Where(a => a.Services.Any())
          .SelectMany(a => a.Services)
          .GroupBy(s => s.Service.Name)
          .OrderByDescending(g => g.Count())
          .FirstOrDefault();

      // Calculate ratings (placeholder - would need reviews table)
      var averageRating = 4.5; // Placeholder
      var completionRate = totalAppointments > 0 ? (double)completedAppointments / totalAppointments * 100 : 0;

      var analytics = new ProviderAnalyticsDto
      {
        TotalRevenue = totalRevenue,
        TotalAppointments = totalAppointments,
        CompletedAppointments = completedAppointments,
        CancelledAppointments = cancelledAppointments,
        AverageRating = averageRating,
        CompletionRate = completionRate,
        RevenueGrowth = revenueGrowth,
        MostRequestedService = mostRequestedService?.Key ?? "N/A",
        Period = period
      };

      return Ok(analytics);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error getting provider analytics for user {UserId}", User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
      return StatusCode(500, new { message = "Internal server error while getting analytics" });
    }
  }

  [HttpGet("earnings")]
  public async Task<ActionResult<EarningsDto>> GetEarningsData([FromQuery] string period = "month")
  {
    try
    {
      var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
      if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
      {
        return Unauthorized(new { message = "Invalid user token" });
      }

      // Calculate date range based on period
      DateTime startDate = period.ToLower() switch
      {
        "week" => DateTime.UtcNow.AddDays(-7),
        "month" => DateTime.UtcNow.AddMonths(-1),
        "quarter" => DateTime.UtcNow.AddMonths(-3),
        "year" => DateTime.UtcNow.AddYears(-1),
        _ => DateTime.UtcNow.AddMonths(-1)
      };

      // Get completed appointments for earnings calculation
      var completedAppointments = await _context.Appointments
          .Include(a => a.Services)
          .ThenInclude(s => s.Service)
          .Where(a => a.ProviderId == userId && a.Status == AppointmentStatus.Completed && a.ScheduledStartTime >= startDate)
          .ToListAsync();

      var totalEarnings = completedAppointments.Sum(a => a.TotalPrice ?? 0);
      var platformFee = totalEarnings * 0.1m; // 10% platform fee
      var availableForPayout = totalEarnings - platformFee;

      // Get pending earnings (appointments that are completed but not yet paid out)
      var pendingEarnings = completedAppointments
          .Where(a => a.ScheduledStartTime >= DateTime.UtcNow.AddDays(-30)) // Last 30 days
          .Sum(a => a.TotalPrice ?? 0) - (completedAppointments
          .Where(a => a.ScheduledStartTime >= DateTime.UtcNow.AddDays(-30))
          .Sum(a => a.TotalPrice ?? 0) * 0.1m);

      var earnings = new EarningsDto
      {
        TotalEarnings = totalEarnings,
        PlatformFee = platformFee,
        AvailableForPayout = availableForPayout,
        PendingPayouts = pendingEarnings,
        PayoutHistory = new List<PayoutDto>(), // Placeholder for payout history
        Period = period
      };

      return Ok(earnings);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error getting earnings data for user {UserId}", User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
      return StatusCode(500, new { message = "Internal server error while getting earnings" });
    }
  }

  [HttpGet("appointments")]
  public async Task<ActionResult<AppointmentMetricsDto>> GetAppointmentMetrics()
  {
    try
    {
      var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
      if (userIdClaim == null)
      {
        return Unauthorized(new { message = "User not authenticated" });
      }

      if (!int.TryParse(userIdClaim.Value, out int userId))
      {
        return BadRequest(new { message = "Invalid user ID" });
      }

      var now = DateTime.UtcNow;
      var todayStart = now.Date;
      var weekStart = now.Date.AddDays(-(int)now.DayOfWeek);

      // Get all appointments for the provider
      var allAppointments = await _context.Appointments
          .Where(a => a.ProviderId == userId)
          .ToListAsync();

      // Calculate metrics
      var totalToday = allAppointments.Count(a => a.ScheduledStartTime.Date == todayStart);
      var totalThisWeek = allAppointments.Count(a => a.ScheduledStartTime.Date >= weekStart);
      var totalUpcoming = allAppointments.Count(a => a.ScheduledStartTime > now && a.Status != AppointmentStatus.Cancelled);
      var upcomingRevenue = allAppointments
          .Where(a => a.ScheduledStartTime > now && a.Status != AppointmentStatus.Cancelled)
          .Sum(a => a.TotalPrice ?? 0);

      var totalAppointments = allAppointments.Count;
      var cancelledCount = allAppointments.Count(a => a.Status == AppointmentStatus.Cancelled);
      var cancellationRate = totalAppointments > 0 ? (double)cancelledCount / totalAppointments * 100 : 0;

      var metrics = new AppointmentMetricsDto
      {
        TotalToday = totalToday,
        TotalThisWeek = totalThisWeek,
        TotalUpcoming = totalUpcoming,
        UpcomingRevenue = upcomingRevenue,
        CancellationRate = cancellationRate
      };

      return Ok(metrics);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error getting appointment metrics for user {UserId}", User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
      return StatusCode(500, new { message = "Internal server error while getting appointment metrics" });
    }
  }

  [HttpGet("clients")]
  public async Task<ActionResult<List<ClientInsightDto>>> GetClientInsights([FromQuery] int limit = 50)
  {
    try
    {
      var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
      if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
      {
        return Unauthorized(new { message = "Invalid user token" });
      }

      // Get client insights based on appointments
      var clientInsights = await _context.Appointments
          .Include(a => a.Client)
          .Include(a => a.Services)
          .ThenInclude(s => s.Service)
          .Where(a => a.ProviderId == userId)
          .GroupBy(a => a.Client)
          .Select(g => new ClientInsightDto
          {
            Id = g.Key.Id,
            FullName = g.Key.FullName,
            Email = g.Key.Email,
            ProfilePictureUrl = g.Key.ProfilePictureUrl,
            TotalAppointments = g.Count(),
            TotalSpent = g.Where(a => a.Status == AppointmentStatus.Completed).Sum(a => a.TotalPrice ?? 0),
            LastAppointment = g.Max(a => a.ScheduledStartTime),
            AverageRating = 4.5, // Placeholder - would calculate from reviews
            Status = g.Any(a => a.ScheduledStartTime > DateTime.UtcNow) ? "Active" : "Inactive",
            IsNew = g.Key.CreatedAt >= DateTime.UtcNow.AddDays(-30)
          })
          .OrderByDescending(c => c.TotalSpent)
          .Take(limit)
          .ToListAsync();

      return Ok(clientInsights);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error getting client insights for user {UserId}", User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
      return StatusCode(500, new { message = "Internal server error while getting client insights" });
    }
  }
}
