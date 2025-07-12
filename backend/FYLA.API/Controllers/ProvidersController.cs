using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FYLA.Infrastructure.Data;
using FYLA.Core.Entities;
using FYLA.Core.DTOs;

namespace FYLA.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProvidersController : ControllerBase
{
  private readonly ApplicationDbContext _context;
  private readonly ILogger<ProvidersController> _logger;

  public ProvidersController(ApplicationDbContext context, ILogger<ProvidersController> logger)
  {
    _context = context;
    _logger = logger;
  }

  [HttpGet("search")]
  public async Task<ActionResult<ProviderSearchResponse>> SearchProviders(
      [FromQuery] string? query,
      [FromQuery] int[]? tags,
      [FromQuery] double? latitude,
      [FromQuery] double? longitude,
      [FromQuery] double? radius,
      [FromQuery] double? minRating,
      [FromQuery] string? sortBy,
      [FromQuery] int page = 1,
      [FromQuery] int limit = 20)
  {
    try
    {
      var providersQuery = _context.Users
          .Where(u => u.Role == "ServiceProvider")
          .AsQueryable();

      // Apply text search filter
      if (!string.IsNullOrEmpty(query))
      {
        providersQuery = providersQuery.Where(u =>
            u.FullName.Contains(query) ||
            (u.Bio != null && u.Bio.Contains(query)));
      }

      // Apply minimum rating filter (placeholder - would need reviews table)
      if (minRating.HasValue)
      {
        // For now, just return all providers since we don't have reviews implemented
        // In a real app, you'd join with reviews table and calculate average
      }

      // Apply location-based filtering (placeholder)
      if (latitude.HasValue && longitude.HasValue && radius.HasValue)
      {
        // For now, just return all providers
        // In a real app, you'd use spatial queries or distance calculations
      }

      // Get total count for pagination
      var totalProviders = await providersQuery.CountAsync();

      // Apply pagination
      var providers = await providersQuery
          .Skip((page - 1) * limit)
          .Take(limit)
          .Select(u => new ProviderProfile
          {
            Id = u.Id,
            FullName = u.FullName,
            Email = u.Email,
            PhoneNumber = u.PhoneNumber ?? string.Empty,
            ProfilePictureUrl = u.ProfilePictureUrl,
            Bio = u.Bio,
            LocationLat = u.LocationLat ?? 0,
            LocationLng = u.LocationLng ?? 0,
            AverageRating = 4.5, // Placeholder - would calculate from reviews
            TotalReviews = 50,   // Placeholder - would count from reviews
            Distance = 2.5,      // Placeholder - would calculate based on user location
            IsOnline = true,     // Placeholder - would check last activity
            Tags = new List<FYLA.Core.DTOs.ServiceProviderTag>(), // Placeholder - would load from tags table
            Services = new List<FYLA.Core.DTOs.Service>(),        // Placeholder - would load from services table
            BusinessHours = new List<FYLA.Core.DTOs.BusinessHour>(), // Placeholder
            CreatedAt = u.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
          })
          .ToListAsync();

      var response = new ProviderSearchResponse
      {
        Providers = providers,
        Total = totalProviders,
        Page = page,
        TotalPages = (int)Math.Ceiling((double)totalProviders / limit)
      };

      return Ok(response);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error searching providers");
      return StatusCode(500, new { message = "Internal server error while searching providers" });
    }
  }

  [HttpGet("{id:int}")]
  public async Task<ActionResult<ProviderProfile>> GetProviderById(int id)
  {
    try
    {
      var provider = await _context.Users
          .Where(u => u.Id == id && u.Role == "ServiceProvider")
          .Select(u => new ProviderProfile
          {
            Id = u.Id,
            FullName = u.FullName,
            Email = u.Email,
            PhoneNumber = u.PhoneNumber ?? string.Empty,
            ProfilePictureUrl = u.ProfilePictureUrl,
            Bio = u.Bio,
            LocationLat = u.LocationLat ?? 0,
            LocationLng = u.LocationLng ?? 0,
            AverageRating = 4.5, // Placeholder - would calculate from reviews
            TotalReviews = 50,   // Placeholder - would count from reviews
            Distance = 2.5,      // Placeholder - would calculate based on user location
            IsOnline = true,     // Placeholder - would check last activity
            Tags = new List<FYLA.Core.DTOs.ServiceProviderTag>(), // Placeholder
            Services = new List<FYLA.Core.DTOs.Service>(),        // Placeholder
            BusinessHours = new List<FYLA.Core.DTOs.BusinessHour>(), // Placeholder
            CreatedAt = u.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
          })
          .FirstOrDefaultAsync();

      if (provider == null)
      {
        return NotFound(new { message = "Provider not found" });
      }

      return Ok(provider);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error getting provider by ID: {ProviderId}", id);
      return StatusCode(500, new { message = "Internal server error while getting provider" });
    }
  }

  [HttpGet("nearby")]
  public async Task<ActionResult<List<ProviderProfile>>> GetNearbyProviders(
      [FromQuery] double latitude,
      [FromQuery] double longitude,
      [FromQuery] double radius = 10)
  {
    try
    {
      // For now, return all providers as we don't have location-based filtering implemented
      var providers = await _context.Users
          .Where(u => u.Role == "ServiceProvider")
          .Take(20) // Limit to 20 providers
          .Select(u => new ProviderProfile
          {
            Id = u.Id,
            FullName = u.FullName,
            Email = u.Email,
            PhoneNumber = u.PhoneNumber ?? string.Empty,
            ProfilePictureUrl = u.ProfilePictureUrl,
            Bio = u.Bio,
            LocationLat = u.LocationLat ?? latitude, // Use requested lat if provider doesn't have one
            LocationLng = u.LocationLng ?? longitude, // Use requested lng if provider doesn't have one
            AverageRating = 4.5, // Placeholder
            TotalReviews = 50,   // Placeholder
            Distance = 2.5,      // Placeholder
            IsOnline = true,     // Placeholder
            Tags = new List<FYLA.Core.DTOs.ServiceProviderTag>(),
            Services = new List<FYLA.Core.DTOs.Service>(),
            BusinessHours = new List<FYLA.Core.DTOs.BusinessHour>(),
            CreatedAt = u.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
          })
          .ToListAsync();

      return Ok(providers);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error getting nearby providers");
      return StatusCode(500, new { message = "Internal server error while getting nearby providers" });
    }
  }
}
