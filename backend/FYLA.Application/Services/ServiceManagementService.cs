using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using FYLA.Application.Interfaces;
using FYLA.Core.DTOs;
using FYLA.Core.Entities;
using FYLA.Core.Enums;
using FYLA.Infrastructure.Data;

namespace FYLA.Application.Services
{
  public class ServiceManagementService : IServiceManagementService
  {
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ServiceManagementService> _logger;

    public ServiceManagementService(ApplicationDbContext context, ILogger<ServiceManagementService> logger)
    {
      _context = context;
      _logger = logger;
    }

    #region Service CRUD Operations

    public async Task<ServiceResponse> CreateServiceAsync(int providerId, CreateServiceRequest request)
    {
      try
      {
        _logger.LogInformation("Creating service for provider {ProviderId}: {ServiceName}", providerId, request.Name);

        // Verify provider exists and has correct role
        var provider = await _context.Users
          .FirstOrDefaultAsync(u => u.Id == providerId && u.Role == "ServiceProvider");

        if (provider == null)
        {
          throw new UnauthorizedAccessException("Only service providers can create services");
        }

        var service = new Core.Entities.Service
        {
          ProviderId = providerId,
          Name = request.Name,
          Description = request.Description,
          Price = request.Price,
          EstimatedDurationMinutes = request.EstimatedDurationMinutes,
          IsActive = request.IsActive,
          CreatedAt = DateTime.UtcNow
        };

        _context.Services.Add(service);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Service created successfully with ID {ServiceId}", service.Id);

        return new ServiceResponse
        {
          Id = service.Id,
          ProviderId = service.ProviderId,
          Name = service.Name,
          Description = service.Description,
          Price = service.Price,
          EstimatedDurationMinutes = service.EstimatedDurationMinutes,
          IsActive = service.IsActive,
          CreatedAt = service.CreatedAt,
          ProviderName = provider.FullName
        };
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error creating service for provider {ProviderId}", providerId);
        throw;
      }
    }

    public async Task<ServiceResponse> GetServiceAsync(int serviceId)
    {
      var service = await _context.Services
        .Include(s => s.Provider)
        .FirstOrDefaultAsync(s => s.Id == serviceId);

      if (service == null)
      {
        throw new KeyNotFoundException($"Service with ID {serviceId} not found");
      }

      return new ServiceResponse
      {
        Id = service.Id,
        ProviderId = service.ProviderId,
        Name = service.Name,
        Description = service.Description,
        Price = service.Price,
        EstimatedDurationMinutes = service.EstimatedDurationMinutes,
        IsActive = service.IsActive,
        CreatedAt = service.CreatedAt,
        ProviderName = service.Provider.FullName
      };
    }

    public async Task<ServiceListResponse> GetProviderServicesAsync(int providerId, int page = 1, int pageSize = 20)
    {
      var query = _context.Services
        .Include(s => s.Provider)
        .Where(s => s.ProviderId == providerId);

      var total = await query.CountAsync();
      var services = await query
        .OrderBy(s => s.Name)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .ToListAsync();

      return new ServiceListResponse
      {
        Services = services.Select(s => new ServiceResponse
        {
          Id = s.Id,
          ProviderId = s.ProviderId,
          Name = s.Name,
          Description = s.Description,
          Price = s.Price,
          EstimatedDurationMinutes = s.EstimatedDurationMinutes,
          IsActive = s.IsActive,
          CreatedAt = s.CreatedAt,
          ProviderName = s.Provider.FullName
        }).ToList(),
        Total = total,
        Page = page,
        PageSize = pageSize
      };
    }

    public async Task<ServiceListResponse> GetAllServicesAsync(int page = 1, int pageSize = 20, bool activeOnly = true)
    {
      var query = _context.Services
        .Include(s => s.Provider)
        .AsQueryable();

      if (activeOnly)
      {
        query = query.Where(s => s.IsActive);
      }

      var total = await query.CountAsync();
      var services = await query
        .OrderBy(s => s.Provider.FullName)
        .ThenBy(s => s.Name)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .ToListAsync();

      return new ServiceListResponse
      {
        Services = services.Select(s => new ServiceResponse
        {
          Id = s.Id,
          ProviderId = s.ProviderId,
          Name = s.Name,
          Description = s.Description,
          Price = s.Price,
          EstimatedDurationMinutes = s.EstimatedDurationMinutes,
          IsActive = s.IsActive,
          CreatedAt = s.CreatedAt,
          ProviderName = s.Provider.FullName
        }).ToList(),
        Total = total,
        Page = page,
        PageSize = pageSize
      };
    }

    public async Task<ServiceResponse> UpdateServiceAsync(int serviceId, int providerId, UpdateServiceRequest request)
    {
      try
      {
        var service = await _context.Services
          .Include(s => s.Provider)
          .FirstOrDefaultAsync(s => s.Id == serviceId && s.ProviderId == providerId);

        if (service == null)
        {
          throw new KeyNotFoundException($"Service with ID {serviceId} not found for provider {providerId}");
        }

        // Update only provided fields
        if (!string.IsNullOrEmpty(request.Name))
          service.Name = request.Name;

        if (request.Description != null)
          service.Description = request.Description;

        if (request.Price.HasValue)
          service.Price = request.Price.Value;

        if (request.EstimatedDurationMinutes.HasValue)
          service.EstimatedDurationMinutes = request.EstimatedDurationMinutes.Value;

        if (request.IsActive.HasValue)
          service.IsActive = request.IsActive.Value;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Service {ServiceId} updated successfully", serviceId);

        return new ServiceResponse
        {
          Id = service.Id,
          ProviderId = service.ProviderId,
          Name = service.Name,
          Description = service.Description,
          Price = service.Price,
          EstimatedDurationMinutes = service.EstimatedDurationMinutes,
          IsActive = service.IsActive,
          CreatedAt = service.CreatedAt,
          ProviderName = service.Provider.FullName
        };
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error updating service {ServiceId}", serviceId);
        throw;
      }
    }

    public async Task<bool> DeleteServiceAsync(int serviceId, int providerId)
    {
      try
      {
        var service = await _context.Services
          .FirstOrDefaultAsync(s => s.Id == serviceId && s.ProviderId == providerId);

        if (service == null)
        {
          return false;
        }

        // Check if service has future appointments
        var hasAppointments = await _context.AppointmentServices
          .Include(as_item => as_item.Appointment)
          .AnyAsync(as_item => as_item.ServiceId == serviceId &&
                    as_item.Appointment.ScheduledStartTime > DateTime.UtcNow);

        if (hasAppointments)
        {
          // Soft delete - mark as inactive instead of deleting
          service.IsActive = false;
          await _context.SaveChangesAsync();
          _logger.LogInformation("Service {ServiceId} marked as inactive due to future appointments", serviceId);
        }
        else
        {
          // Hard delete if no future appointments
          _context.Services.Remove(service);
          await _context.SaveChangesAsync();
          _logger.LogInformation("Service {ServiceId} deleted permanently", serviceId);
        }

        return true;
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error deleting service {ServiceId}", serviceId);
        throw;
      }
    }

    #endregion

    #region Time Slot Management

    public async Task<AvailableTimeSlotsResponse> GetAvailableTimeSlotsAsync(TimeSlotRequest request)
    {
      try
      {
        var provider = await _context.Users
          .FirstOrDefaultAsync(u => u.Id == request.ProviderId && u.Role == "ServiceProvider");

        if (provider == null)
        {
          throw new KeyNotFoundException($"Provider with ID {request.ProviderId} not found");
        }

        // Get provider's services
        var providerServices = await _context.Services
          .Where(s => s.ProviderId == request.ProviderId && s.IsActive)
          .ToListAsync();

        // Calculate total duration if services are specified
        int totalDurationMinutes = 0;
        decimal totalPrice = 0;
        List<ServiceResponse> selectedServices = new();

        if (request.ServiceIds?.Any() == true)
        {
          var services = await _context.Services
            .Where(s => request.ServiceIds.Contains(s.Id) && s.ProviderId == request.ProviderId && s.IsActive)
            .ToListAsync();

          totalDurationMinutes = services.Sum(s => s.EstimatedDurationMinutes);
          totalPrice = services.Sum(s => s.Price);

          selectedServices = services.Select(s => new ServiceResponse
          {
            Id = s.Id,
            ProviderId = s.ProviderId,
            Name = s.Name,
            Description = s.Description,
            Price = s.Price,
            EstimatedDurationMinutes = s.EstimatedDurationMinutes,
            IsActive = s.IsActive,
            CreatedAt = s.CreatedAt,
            ProviderName = provider.FullName
          }).ToList();
        }

        // Get existing appointments for the date
        var startOfDay = request.Date.Date;
        var endOfDay = startOfDay.AddDays(1);

        var existingAppointments = await _context.Appointments
          .Where(a => a.ProviderId == request.ProviderId &&
                     a.ScheduledStartTime >= startOfDay &&
                     a.ScheduledStartTime < endOfDay &&
                     (a.Status == AppointmentStatus.Confirmed || a.Status == AppointmentStatus.Pending))
          .ToListAsync();

        // Generate time slots (9 AM to 6 PM, 30-minute intervals)
        var timeSlots = new List<TimeSlot>();
        var workStart = startOfDay.AddHours(9); // 9 AM
        var workEnd = startOfDay.AddHours(18);  // 6 PM

        for (var slotStart = workStart; slotStart < workEnd; slotStart = slotStart.AddMinutes(30))
        {
          var slotEnd = slotStart.AddMinutes(totalDurationMinutes > 0 ? totalDurationMinutes : 30);

          // Check if this slot conflicts with existing appointments
          var isAvailable = !existingAppointments.Any(a =>
            (slotStart >= a.ScheduledStartTime && slotStart < a.ScheduledEndTime) ||
            (slotEnd > a.ScheduledStartTime && slotEnd <= a.ScheduledEndTime) ||
            (slotStart <= a.ScheduledStartTime && slotEnd >= a.ScheduledEndTime));

          // Don't show slots that would extend past work hours
          if (slotEnd > workEnd)
          {
            isAvailable = false;
          }

          // Don't show past time slots
          if (slotStart <= DateTime.UtcNow)
          {
            isAvailable = false;
          }

          timeSlots.Add(new TimeSlot
          {
            StartTime = slotStart,
            EndTime = slotEnd,
            IsAvailable = isAvailable,
            ReasonUnavailable = !isAvailable ? "Already booked or outside business hours" : null,
            TotalPrice = totalPrice > 0 ? totalPrice : null,
            TotalDurationMinutes = totalDurationMinutes > 0 ? totalDurationMinutes : null
          });
        }

        return new AvailableTimeSlotsResponse
        {
          Date = request.Date.Date,
          ProviderId = request.ProviderId,
          ProviderName = provider.FullName,
          TimeSlots = timeSlots,
          Services = selectedServices
        };
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error getting available time slots for provider {ProviderId} on {Date}",
          request.ProviderId, request.Date);
        throw;
      }
    }

    public async Task<bool> IsTimeSlotAvailableAsync(int providerId, DateTime startTime, DateTime endTime)
    {
      var existingAppointment = await _context.Appointments
        .AnyAsync(a => a.ProviderId == providerId &&
                      ((startTime >= a.ScheduledStartTime && startTime < a.ScheduledEndTime) ||
                       (endTime > a.ScheduledStartTime && endTime <= a.ScheduledEndTime) ||
                       (startTime <= a.ScheduledStartTime && endTime >= a.ScheduledEndTime)) &&
                      (a.Status == AppointmentStatus.Confirmed || a.Status == AppointmentStatus.Pending));

      return !existingAppointment;
    }

    public async Task<List<DateTime>> GetBookedTimeSlotsAsync(int providerId, DateTime date)
    {
      var startOfDay = date.Date;
      var endOfDay = startOfDay.AddDays(1);

      var appointments = await _context.Appointments
        .Where(a => a.ProviderId == providerId &&
                   a.ScheduledStartTime >= startOfDay &&
                   a.ScheduledStartTime < endOfDay &&
                   (a.Status == AppointmentStatus.Confirmed || a.Status == AppointmentStatus.Pending))
        .Select(a => a.ScheduledStartTime)
        .ToListAsync();

      return appointments;
    }

    #endregion

    #region Booking Operations

    public async Task<BookingResponse> CreateBookingAsync(int clientId, CreateBookingRequest request)
    {
      using var transaction = await _context.Database.BeginTransactionAsync();
      try
      {
        _logger.LogInformation("Creating booking for client {ClientId} with provider {ProviderId}",
          clientId, request.ProviderId);

        // Validate client and provider
        var client = await _context.Users.FirstOrDefaultAsync(u => u.Id == clientId && u.Role == "Client");
        var provider = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.ProviderId && u.Role == "ServiceProvider");

        if (client == null || provider == null)
        {
          throw new ArgumentException("Invalid client or provider");
        }

        // Validate services belong to the provider
        var services = await _context.Services
          .Where(s => request.ServiceIds.Contains(s.Id) && s.ProviderId == request.ProviderId && s.IsActive)
          .ToListAsync();

        if (services.Count != request.ServiceIds.Count)
        {
          throw new ArgumentException("One or more services are invalid or not available");
        }

        // Calculate total duration and price
        var totalDuration = services.Sum(s => s.EstimatedDurationMinutes);
        var totalPrice = services.Sum(s => s.Price);
        var endTime = request.ScheduledStartTime.AddMinutes(totalDuration);

        // Check time slot availability
        var isAvailable = await IsTimeSlotAvailableAsync(request.ProviderId, request.ScheduledStartTime, endTime);
        if (!isAvailable)
        {
          throw new InvalidOperationException("The selected time slot is not available");
        }

        // Create appointment
        var appointment = new Appointment
        {
          ClientId = clientId,
          ProviderId = request.ProviderId,
          ScheduledStartTime = request.ScheduledStartTime,
          ScheduledEndTime = endTime,
          Status = AppointmentStatus.Pending,
          TotalPrice = totalPrice,
          Notes = request.Notes,
          CreatedAt = DateTime.UtcNow,
          UpdatedAt = DateTime.UtcNow
        };

        _context.Appointments.Add(appointment);
        await _context.SaveChangesAsync();

        // Create appointment services
        foreach (var service in services)
        {
          var appointmentService = new Core.Entities.AppointmentService
          {
            AppointmentId = appointment.Id,
            ServiceId = service.Id,
            PriceAtBooking = service.Price
          };
          _context.AppointmentServices.Add(appointmentService);
        }

        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        _logger.LogInformation("Booking created successfully with ID {AppointmentId}", appointment.Id);

        return new BookingResponse
        {
          Id = appointment.Id,
          ClientId = appointment.ClientId,
          ProviderId = appointment.ProviderId,
          ClientName = client.FullName,
          ProviderName = provider.FullName,
          ScheduledStartTime = appointment.ScheduledStartTime,
          ScheduledEndTime = appointment.ScheduledEndTime,
          Status = appointment.Status.ToString(),
          TotalPrice = appointment.TotalPrice,
          Notes = appointment.Notes,
          Services = services.Select(s => new ServiceResponse
          {
            Id = s.Id,
            ProviderId = s.ProviderId,
            Name = s.Name,
            Description = s.Description,
            Price = s.Price,
            EstimatedDurationMinutes = s.EstimatedDurationMinutes,
            IsActive = s.IsActive,
            CreatedAt = s.CreatedAt,
            ProviderName = provider.FullName
          }).ToList(),
          CreatedAt = appointment.CreatedAt,
          UpdatedAt = appointment.UpdatedAt
        };
      }
      catch (Exception ex)
      {
        await transaction.RollbackAsync();
        _logger.LogError(ex, "Error creating booking for client {ClientId}", clientId);
        throw;
      }
    }

    public async Task<BookingResponse> UpdateBookingStatusAsync(int appointmentId, int userId, string status)
    {
      try
      {
        var appointment = await _context.Appointments
          .Include(a => a.Client)
          .Include(a => a.Provider)
          .Include(a => a.Services)
            .ThenInclude(as_item => as_item.Service)
          .FirstOrDefaultAsync(a => a.Id == appointmentId);

        if (appointment == null)
        {
          throw new KeyNotFoundException($"Appointment with ID {appointmentId} not found");
        }

        // Validate user has permission to update this appointment
        if (appointment.ClientId != userId && appointment.ProviderId != userId)
        {
          throw new UnauthorizedAccessException("You don't have permission to update this appointment");
        }

        // Parse and validate status
        if (!Enum.TryParse<AppointmentStatus>(status, true, out var appointmentStatus))
        {
          throw new ArgumentException($"Invalid status: {status}");
        }

        appointment.Status = appointmentStatus;
        appointment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Appointment {AppointmentId} status updated to {Status}", appointmentId, status);

        return new BookingResponse
        {
          Id = appointment.Id,
          ClientId = appointment.ClientId,
          ProviderId = appointment.ProviderId,
          ClientName = appointment.Client.FullName,
          ProviderName = appointment.Provider.FullName,
          ScheduledStartTime = appointment.ScheduledStartTime,
          ScheduledEndTime = appointment.ScheduledEndTime,
          Status = appointment.Status.ToString(),
          TotalPrice = appointment.TotalPrice,
          Notes = appointment.Notes,
          Services = appointment.Services.Select(as_item => new ServiceResponse
          {
            Id = as_item.Service.Id,
            ProviderId = as_item.Service.ProviderId,
            Name = as_item.Service.Name,
            Description = as_item.Service.Description,
            Price = as_item.PriceAtBooking, // Use price at booking time
            EstimatedDurationMinutes = as_item.Service.EstimatedDurationMinutes,
            IsActive = as_item.Service.IsActive,
            CreatedAt = as_item.Service.CreatedAt,
            ProviderName = appointment.Provider.FullName
          }).ToList(),
          CreatedAt = appointment.CreatedAt,
          UpdatedAt = appointment.UpdatedAt
        };
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error updating appointment {AppointmentId} status", appointmentId);
        throw;
      }
    }

    public async Task<List<BookingResponse>> GetUserBookingsAsync(int userId, bool isProvider = false)
    {
      var query = _context.Appointments
        .Include(a => a.Client)
        .Include(a => a.Provider)
        .Include(a => a.Services)
          .ThenInclude(as_item => as_item.Service)
        .AsQueryable();

      if (isProvider)
      {
        query = query.Where(a => a.ProviderId == userId);
      }
      else
      {
        query = query.Where(a => a.ClientId == userId);
      }

      var appointments = await query
        .OrderByDescending(a => a.ScheduledStartTime)
        .ToListAsync();

      return appointments.Select(a => new BookingResponse
      {
        Id = a.Id,
        ClientId = a.ClientId,
        ProviderId = a.ProviderId,
        ClientName = a.Client.FullName,
        ProviderName = a.Provider.FullName,
        ScheduledStartTime = a.ScheduledStartTime,
        ScheduledEndTime = a.ScheduledEndTime,
        Status = a.Status.ToString(),
        TotalPrice = a.TotalPrice,
        Notes = a.Notes,
        Services = a.Services.Select(as_item => new ServiceResponse
        {
          Id = as_item.Service.Id,
          ProviderId = as_item.Service.ProviderId,
          Name = as_item.Service.Name,
          Description = as_item.Service.Description,
          Price = as_item.PriceAtBooking,
          EstimatedDurationMinutes = as_item.Service.EstimatedDurationMinutes,
          IsActive = as_item.Service.IsActive,
          CreatedAt = as_item.Service.CreatedAt,
          ProviderName = a.Provider.FullName
        }).ToList(),
        CreatedAt = a.CreatedAt,
        UpdatedAt = a.UpdatedAt
      }).ToList();
    }

    public async Task<BookingResponse?> GetBookingAsync(int appointmentId, int userId)
    {
      var appointment = await _context.Appointments
        .Include(a => a.Client)
        .Include(a => a.Provider)
        .Include(a => a.Services)
          .ThenInclude(as_item => as_item.Service)
        .FirstOrDefaultAsync(a => a.Id == appointmentId &&
                            (a.ClientId == userId || a.ProviderId == userId));

      if (appointment == null)
      {
        return null;
      }

      return new BookingResponse
      {
        Id = appointment.Id,
        ClientId = appointment.ClientId,
        ProviderId = appointment.ProviderId,
        ClientName = appointment.Client.FullName,
        ProviderName = appointment.Provider.FullName,
        ScheduledStartTime = appointment.ScheduledStartTime,
        ScheduledEndTime = appointment.ScheduledEndTime,
        Status = appointment.Status.ToString(),
        TotalPrice = appointment.TotalPrice,
        Notes = appointment.Notes,
        Services = appointment.Services.Select(as_item => new ServiceResponse
        {
          Id = as_item.Service.Id,
          ProviderId = as_item.Service.ProviderId,
          Name = as_item.Service.Name,
          Description = as_item.Service.Description,
          Price = as_item.PriceAtBooking,
          EstimatedDurationMinutes = as_item.Service.EstimatedDurationMinutes,
          IsActive = as_item.Service.IsActive,
          CreatedAt = as_item.Service.CreatedAt,
          ProviderName = appointment.Provider.FullName
        }).ToList(),
        CreatedAt = appointment.CreatedAt,
        UpdatedAt = appointment.UpdatedAt
      };
    }

    #endregion

    #region Utility Methods

    public async Task<decimal> CalculateTotalPriceAsync(List<int> serviceIds)
    {
      var services = await _context.Services
        .Where(s => serviceIds.Contains(s.Id) && s.IsActive)
        .ToListAsync();

      return services.Sum(s => s.Price);
    }

    public async Task<int> CalculateTotalDurationAsync(List<int> serviceIds)
    {
      var services = await _context.Services
        .Where(s => serviceIds.Contains(s.Id) && s.IsActive)
        .ToListAsync();

      return services.Sum(s => s.EstimatedDurationMinutes);
    }

    #endregion
  }
}
