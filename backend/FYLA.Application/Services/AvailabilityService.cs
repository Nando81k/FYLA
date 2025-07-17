using Microsoft.EntityFrameworkCore;
using FYLA.Core.DTOs;
using FYLA.Core.Entities;
using FYLA.Infrastructure.Data;
using System.Globalization;

namespace FYLA.Application.Services
{
  public interface IAvailabilityService
  {
    Task<List<AvailabilityRuleDto>> SetAvailabilityRulesAsync(int providerId, List<AvailabilityRuleDto> rules);
    Task<List<AvailabilityRuleDto>> GetAvailabilityRulesAsync(int providerId);
    Task<bool> DeleteAvailabilityRuleAsync(int providerId, string externalId);
  }

  public class AvailabilityService : IAvailabilityService
  {
    private readonly ApplicationDbContext _context;

    public AvailabilityService(ApplicationDbContext context)
    {
      _context = context;
    }

    public async Task<List<AvailabilityRuleDto>> SetAvailabilityRulesAsync(int providerId, List<AvailabilityRuleDto> rules)
    {
      using var transaction = await _context.Database.BeginTransactionAsync();

      try
      {
        // Verify provider exists
        var provider = await _context.Users.FindAsync(providerId);
        if (provider == null)
          throw new ArgumentException($"Provider with ID {providerId} not found");

        // Delete existing rules for this provider
        var existingRules = await _context.AvailabilityRules
          .Where(r => r.ProviderId == providerId)
          .Include(r => r.BreakIntervals)
          .ToListAsync();

        _context.AvailabilityRules.RemoveRange(existingRules);

        // Add new rules
        var newRules = new List<AvailabilityRule>();
        foreach (var ruleDto in rules)
        {
          var rule = new AvailabilityRule
          {
            ExternalId = ruleDto.Id,
            ProviderId = providerId,
            DayOfWeek = ruleDto.DayOfWeek,
            StartTime = ruleDto.StartTime,
            EndTime = ruleDto.EndTime,
            IsActive = ruleDto.IsActive,
            EffectiveFrom = ParseEffectiveDate(ruleDto.EffectiveFrom),
            EffectiveTo = !string.IsNullOrEmpty(ruleDto.EffectiveTo)
              ? ParseEffectiveDate(ruleDto.EffectiveTo)
              : null,
            Timezone = ruleDto.Timezone,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
          };

          // Add break intervals
          if (ruleDto.BreakIntervals != null)
          {
            foreach (var breakDto in ruleDto.BreakIntervals)
            {
              var breakInterval = new BreakInterval
              {
                ExternalId = breakDto.Id,
                StartTime = breakDto.StartTime,
                EndTime = breakDto.EndTime,
                Name = breakDto.Name,
                IsRecurring = breakDto.IsRecurring,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
              };
              rule.BreakIntervals.Add(breakInterval);
            }
          }

          newRules.Add(rule);
        }

        await _context.AvailabilityRules.AddRangeAsync(newRules);
        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        // Return the saved rules
        return await GetAvailabilityRulesAsync(providerId);
      }
      catch
      {
        await transaction.RollbackAsync();
        throw;
      }
    }

    public async Task<List<AvailabilityRuleDto>> GetAvailabilityRulesAsync(int providerId)
    {
      var rules = await _context.AvailabilityRules
        .Where(r => r.ProviderId == providerId)
        .Include(r => r.BreakIntervals)
        .OrderBy(r => r.DayOfWeek)
        .ThenBy(r => r.StartTime)
        .ToListAsync();

      return rules.Select(r => new AvailabilityRuleDto
      {
        Id = r.ExternalId,
        ProviderId = r.ProviderId,
        DayOfWeek = r.DayOfWeek,
        StartTime = r.StartTime,
        EndTime = r.EndTime,
        IsActive = r.IsActive,
        EffectiveFrom = r.EffectiveFrom.ToString("yyyy-MM-dd"),
        EffectiveTo = r.EffectiveTo?.ToString("yyyy-MM-dd"),
        Timezone = r.Timezone,
        BreakIntervals = r.BreakIntervals.Select(b => new BreakIntervalDto
        {
          Id = b.ExternalId,
          StartTime = b.StartTime,
          EndTime = b.EndTime,
          Name = b.Name,
          IsRecurring = b.IsRecurring
        }).ToList()
      }).ToList();
    }

    public async Task<bool> DeleteAvailabilityRuleAsync(int providerId, string externalId)
    {
      var rule = await _context.AvailabilityRules
        .FirstOrDefaultAsync(r => r.ProviderId == providerId && r.ExternalId == externalId);

      if (rule == null)
        return false;

      _context.AvailabilityRules.Remove(rule);
      await _context.SaveChangesAsync();
      return true;
    }

    private static DateTime ParseEffectiveDate(string dateString)
    {
      // Try to parse as ISO date string first (from frontend)
      if (DateTime.TryParse(dateString, out var isoDate))
      {
        return isoDate.Date; // Return just the date part
      }

      // Try to parse as date-only string (yyyy-MM-dd)
      if (DateTime.TryParseExact(dateString, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var dateOnlyResult))
      {
        return dateOnlyResult;
      }

      // If all else fails, throw an exception
      throw new FormatException($"Unable to parse date string: {dateString}");
    }
  }
}
