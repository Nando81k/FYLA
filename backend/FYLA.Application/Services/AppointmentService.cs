using Microsoft.EntityFrameworkCore;
using FYLA.Application.Interfaces;
using FYLA.Core.DTOs;
using FYLA.Core.Entities;
using FYLA.Core.Enums;
using FYLA.Infrastructure.Data;
using System.Globalization;

namespace FYLA.Application.Services
{
  public class AppointmentService : IAppointmentService
  {
    private readonly ApplicationDbContext _context;

    public AppointmentService(ApplicationDbContext context)
    {
      _context = context;
    }

    public async Task<ServiceResult<AppointmentDto>> CreateAppointmentAsync(int clientId, CreateAppointmentRequestDto request)
    {
      using var transaction = await _context.Database.BeginTransactionAsync();

      try
      {
        Console.WriteLine($"🔍 Creating appointment for client {clientId}:");
        Console.WriteLine($"  Provider: {request.ProviderId}");
        Console.WriteLine($"  Services: [{string.Join(", ", request.ServiceIds)}]");
        Console.WriteLine($"  Start Time: {request.ScheduledStartTime:yyyy-MM-dd HH:mm:ss}");
        Console.WriteLine($"  Notes: {request.Notes}");

        // Validate provider exists
        var provider = await _context.Users
          .FirstOrDefaultAsync(u => u.Id == request.ProviderId && u.Role == "ServiceProvider");
        if (provider == null)
          return ServiceResult<AppointmentDto>.Failure("Provider not found");

        // Validate services exist and belong to the provider
        var services = await _context.Services
          .Where(s => request.ServiceIds.Contains(s.Id) && s.ProviderId == request.ProviderId && s.IsActive)
          .ToListAsync();

        if (services.Count != request.ServiceIds.Count)
          return ServiceResult<AppointmentDto>.Failure("One or more services not found or not active");

        // Calculate total duration and price
        var totalDurationMinutes = services.Sum(s => s.EstimatedDurationMinutes);
        var totalPrice = services.Sum(s => s.Price);
        var endTime = request.ScheduledStartTime.AddMinutes(totalDurationMinutes);

        Console.WriteLine($"  Total Duration: {totalDurationMinutes} minutes");
        Console.WriteLine($"  Total Price: ${totalPrice:F2}");
        Console.WriteLine($"  End Time: {endTime:yyyy-MM-dd HH:mm:ss}");

        // Check for scheduling conflicts
        var hasConflict = await _context.Appointments
          .AnyAsync(a => a.ProviderId == request.ProviderId &&
                        a.Status != AppointmentStatus.Cancelled &&
                        ((request.ScheduledStartTime >= a.ScheduledStartTime && request.ScheduledStartTime < a.ScheduledEndTime) ||
                         (endTime > a.ScheduledStartTime && endTime <= a.ScheduledEndTime) ||
                         (request.ScheduledStartTime <= a.ScheduledStartTime && endTime >= a.ScheduledEndTime)));

        if (hasConflict)
        {
          Console.WriteLine($"❌ Scheduling conflict detected for appointment:");
          Console.WriteLine($"  Requested: {request.ScheduledStartTime:yyyy-MM-dd HH:mm} - {endTime:yyyy-MM-dd HH:mm}");
          Console.WriteLine($"  Duration: {totalDurationMinutes} minutes");
          Console.WriteLine($"  Provider: {request.ProviderId}");

          var conflictingAppointments = await _context.Appointments
            .Where(a => a.ProviderId == request.ProviderId &&
                       a.Status != AppointmentStatus.Cancelled &&
                       ((request.ScheduledStartTime >= a.ScheduledStartTime && request.ScheduledStartTime < a.ScheduledEndTime) ||
                        (endTime > a.ScheduledStartTime && endTime <= a.ScheduledEndTime) ||
                        (request.ScheduledStartTime <= a.ScheduledStartTime && endTime >= a.ScheduledEndTime)))
            .ToListAsync();

          Console.WriteLine($"  Conflicting appointments ({conflictingAppointments.Count}):");
          foreach (var conflict in conflictingAppointments)
          {
            Console.WriteLine($"    - {conflict.ScheduledStartTime:yyyy-MM-dd HH:mm} - {conflict.ScheduledEndTime:yyyy-MM-dd HH:mm} (Status: {conflict.Status})");
          }

          return ServiceResult<AppointmentDto>.Failure($"Time slot is not available. The requested time ({request.ScheduledStartTime:HH:mm} - {endTime:HH:mm}) conflicts with an existing appointment.");
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

        Console.WriteLine($"✅ Appointment created with ID: {appointment.Id}");

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

        Console.WriteLine($"✅ Appointment services created for appointment {appointment.Id}");

        // Load the appointment with related data for response
        var createdAppointment = await _context.Appointments
          .Include(a => a.Client)
          .Include(a => a.Provider)
          .Include(a => a.Services)
            .ThenInclude(as_item => as_item.Service)
          .FirstAsync(a => a.Id == appointment.Id);

        var appointmentDto = MapToDto(createdAppointment);
        return ServiceResult<AppointmentDto>.Success(appointmentDto);
      }
      catch (Exception ex)
      {
        Console.WriteLine($"❌ Error creating appointment: {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
        await transaction.RollbackAsync();
        return ServiceResult<AppointmentDto>.Failure($"An error occurred while creating the appointment: {ex.Message}");
      }
    }

    public async Task<ServiceResult<AppointmentListResponseDto>> GetAppointmentsAsync(int userId, int page = 1, int limit = 20, string? status = null)
    {
      try
      {
        var query = _context.Appointments
          .Include(a => a.Client)
          .Include(a => a.Provider)
          .Include(a => a.Services)
            .ThenInclude(as_item => as_item.Service)
          .Where(a => a.ClientId == userId || a.ProviderId == userId);

        // Filter by status if provided
        if (!string.IsNullOrEmpty(status) && Enum.TryParse<AppointmentStatus>(status, true, out var statusEnum))
        {
          query = query.Where(a => a.Status == statusEnum);
        }

        // Get total count for pagination
        var totalCount = await query.CountAsync();

        // Apply pagination and ordering
        var appointments = await query
          .OrderByDescending(a => a.ScheduledStartTime)
          .Skip((page - 1) * limit)
          .Take(limit)
          .ToListAsync();

        var appointmentDtos = appointments.Select(MapToDto).ToList();

        var response = new AppointmentListResponseDto
        {
          Appointments = appointmentDtos,
          Total = totalCount,
          HasMore = (page * limit) < totalCount
        };

        return ServiceResult<AppointmentListResponseDto>.Success(response);
      }
      catch (Exception ex)
      {
        Console.WriteLine($"Error getting appointments for user {userId}: {ex.Message}");
        return ServiceResult<AppointmentListResponseDto>.Failure("Failed to retrieve appointments");
      }
    }

    public async Task<ServiceResult<AppointmentDto>> GetAppointmentByIdAsync(int id, int userId)
    {
      try
      {
        var appointment = await _context.Appointments
          .Include(a => a.Client)
          .Include(a => a.Provider)
          .Include(a => a.Services)
            .ThenInclude(as_item => as_item.Service)
          .FirstOrDefaultAsync(a => a.Id == id && (a.ClientId == userId || a.ProviderId == userId));

        if (appointment == null)
          return ServiceResult<AppointmentDto>.Failure("Appointment not found");

        var appointmentDto = MapToDto(appointment);
        return ServiceResult<AppointmentDto>.Success(appointmentDto);
      }
      catch (Exception ex)
      {
        Console.WriteLine($"Error getting appointment {id} for user {userId}: {ex.Message}");
        return ServiceResult<AppointmentDto>.Failure("Appointment not found");
      }
    }

    public async Task<ServiceResult<AppointmentDto>> UpdateAppointmentAsync(int id, int userId, UpdateAppointmentRequestDto request)
    {
      try
      {
        var appointment = await _context.Appointments
          .Include(a => a.Services)
            .ThenInclude(as_item => as_item.Service)
          .FirstOrDefaultAsync(a => a.Id == id && (a.ClientId == userId || a.ProviderId == userId));

        if (appointment == null)
          return ServiceResult<AppointmentDto>.Failure("Appointment not found");

        // Update appointment properties
        if (request.Status.HasValue)
          appointment.Status = request.Status.Value;

        if (!string.IsNullOrEmpty(request.Notes))
          appointment.Notes = request.Notes;

        if (request.ScheduledStartTime.HasValue)
        {
          // If rescheduling, check for conflicts
          var totalDurationMinutes = appointment.Services.Sum(s => s.Service.EstimatedDurationMinutes);
          var newEndTime = request.ScheduledStartTime.Value.AddMinutes(totalDurationMinutes);

          var hasConflict = await _context.Appointments
            .AnyAsync(a => a.Id != id &&
                          a.ProviderId == appointment.ProviderId &&
                          a.Status != AppointmentStatus.Cancelled &&
                          ((request.ScheduledStartTime.Value >= a.ScheduledStartTime && request.ScheduledStartTime.Value < a.ScheduledEndTime) ||
                           (newEndTime > a.ScheduledStartTime && newEndTime <= a.ScheduledEndTime) ||
                           (request.ScheduledStartTime.Value <= a.ScheduledStartTime && newEndTime >= a.ScheduledEndTime)));

          if (hasConflict)
            return ServiceResult<AppointmentDto>.Failure("New time slot is not available");

          appointment.ScheduledStartTime = request.ScheduledStartTime.Value;
          appointment.ScheduledEndTime = newEndTime;
        }

        appointment.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        // Reload with full data
        var updatedAppointment = await _context.Appointments
          .Include(a => a.Client)
          .Include(a => a.Provider)
          .Include(a => a.Services)
            .ThenInclude(as_item => as_item.Service)
          .FirstAsync(a => a.Id == id);

        var appointmentDto = MapToDto(updatedAppointment);
        return ServiceResult<AppointmentDto>.Success(appointmentDto);
      }
      catch (Exception ex)
      {
        Console.WriteLine($"Error updating appointment {id} for user {userId}: {ex.Message}");
        return ServiceResult<AppointmentDto>.Failure("Failed to update appointment");
      }
    }

    public async Task<ServiceResult<bool>> CancelAppointmentAsync(int id, int userId)
    {
      try
      {
        var appointment = await _context.Appointments
          .FirstOrDefaultAsync(a => a.Id == id && (a.ClientId == userId || a.ProviderId == userId));

        if (appointment == null)
          return ServiceResult<bool>.Failure("Appointment not found");

        appointment.Status = AppointmentStatus.Cancelled;
        appointment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        Console.WriteLine($"Cancelled appointment {id} for user {userId}");
        return ServiceResult<bool>.Success(true);
      }
      catch (Exception ex)
      {
        Console.WriteLine($"Error cancelling appointment {id} for user {userId}: {ex.Message}");
        return ServiceResult<bool>.Failure("Failed to cancel appointment");
      }
    }

    public async Task<ServiceResult<List<TimeSlotDto>>> GetAvailableTimeSlotsAsync(AvailabilityRequestDto request)
    {
      try
      {
        // Validate provider exists
        var provider = await _context.Users
          .FirstOrDefaultAsync(u => u.Id == request.ProviderId && u.Role == "ServiceProvider");
        if (provider == null)
          return ServiceResult<List<TimeSlotDto>>.Failure("Provider not found");

        // Parse the date string - accept multiple formats
        DateTime requestDate;
        var dateFormats = new[] { "yyyy-MM-dd", "yyyy-M-dd", "yyyy-MM-d", "yyyy-M-d" };
        if (!DateTime.TryParseExact(request.Date, dateFormats, CultureInfo.InvariantCulture, DateTimeStyles.None, out requestDate))
        {
          // Try general parsing as fallback
          if (!DateTime.TryParse(request.Date, out requestDate))
            return ServiceResult<List<TimeSlotDto>>.Failure("Invalid date format. Use YYYY-MM-DD");
        }

        // Get the total duration of requested services (if provided)
        int totalServiceDuration = 60; // Default to 1 hour
        if (request.ServiceIds != null && request.ServiceIds.Any())
        {
          var services = await _context.Services
            .Where(s => request.ServiceIds.Contains(s.Id) && s.ProviderId == request.ProviderId && s.IsActive)
            .ToListAsync();

          if (services.Any())
          {
            totalServiceDuration = services.Sum(s => s.EstimatedDurationMinutes);
          }
        }

        // Get existing appointments for the provider on the requested date
        var existingAppointments = await _context.Appointments
          .Where(a => a.ProviderId == request.ProviderId &&
                     a.Status != AppointmentStatus.Cancelled &&
                     a.ScheduledStartTime.Date == requestDate.Date)
          .ToListAsync();

        var timeSlots = new List<TimeSlotDto>();

        // Generate business hour slots (9 AM to 5 PM) in 30-minute intervals
        for (int hour = 9; hour < 17; hour++)
        {
          if (hour == 12) continue; // Skip lunch hour

          for (int minute = 0; minute < 60; minute += 30)
          {
            var slotStart = new DateTime(requestDate.Year, requestDate.Month, requestDate.Day, hour, minute, 0);
            var slotEnd = slotStart.AddMinutes(totalServiceDuration);

            // Don't show slots that would end after business hours (5 PM)
            if (slotEnd.Hour >= 17)
              continue;

            // Don't show past time slots
            if (slotStart < DateTime.UtcNow)
              continue;

            // Check if this time slot conflicts with existing appointments
            var isAvailable = !existingAppointments.Any(a =>
              (slotStart >= a.ScheduledStartTime && slotStart < a.ScheduledEndTime) ||
              (slotEnd > a.ScheduledStartTime && slotEnd <= a.ScheduledEndTime) ||
              (slotStart <= a.ScheduledStartTime && slotEnd >= a.ScheduledEndTime));

            timeSlots.Add(new TimeSlotDto
            {
              StartTime = slotStart.ToString("HH:mm"),
              EndTime = slotEnd.ToString("HH:mm"),
              IsAvailable = isAvailable,
              Reason = isAvailable ? null : "Already booked"
            });
          }
        }

        Console.WriteLine($"Generated {timeSlots.Count} time slots for provider {request.ProviderId} on {request.Date}");
        Console.WriteLine($"Service duration: {totalServiceDuration} minutes");
        Console.WriteLine($"Available slots: {timeSlots.Count(s => s.IsAvailable)}");

        return ServiceResult<List<TimeSlotDto>>.Success(timeSlots);
      }
      catch (Exception ex)
      {
        Console.WriteLine($"Error getting available time slots: {ex.Message}");
        return ServiceResult<List<TimeSlotDto>>.Failure("Failed to get available time slots");
      }
    }

    // Helper method to map entities to DTOs
    private AppointmentDto MapToDto(Appointment appointment)
    {
      return new AppointmentDto
      {
        Id = appointment.Id,
        ClientId = appointment.ClientId,
        ProviderId = appointment.ProviderId,
        ScheduledStartTime = appointment.ScheduledStartTime,
        ScheduledEndTime = appointment.ScheduledEndTime,
        Status = appointment.Status,
        TotalPrice = appointment.TotalPrice,
        Notes = appointment.Notes,
        CreatedAt = appointment.CreatedAt,
        UpdatedAt = appointment.UpdatedAt,
        Client = appointment.Client != null ? new UserDto
        {
          Id = appointment.Client.Id,
          FullName = appointment.Client.FullName,
          Email = appointment.Client.Email,
          PhoneNumber = appointment.Client.PhoneNumber,
          Role = appointment.Client.Role,
          CreatedAt = appointment.Client.CreatedAt,
          UpdatedAt = appointment.Client.UpdatedAt
        } : null,
        Provider = appointment.Provider != null ? new UserDto
        {
          Id = appointment.Provider.Id,
          FullName = appointment.Provider.FullName,
          Email = appointment.Provider.Email,
          PhoneNumber = appointment.Provider.PhoneNumber,
          Role = appointment.Provider.Role,
          CreatedAt = appointment.Provider.CreatedAt,
          UpdatedAt = appointment.Provider.UpdatedAt
        } : null,
        Services = appointment.Services?.Select(as_item => new AppointmentServiceDto
        {
          Id = as_item.Id,
          AppointmentId = as_item.AppointmentId,
          ServiceId = as_item.ServiceId,
          PriceAtBooking = as_item.PriceAtBooking,
          Service = as_item.Service != null ? new ServiceDto
          {
            Id = as_item.Service.Id,
            ProviderId = as_item.Service.ProviderId,
            Name = as_item.Service.Name,
            Description = as_item.Service.Description ?? string.Empty,
            Price = as_item.Service.Price,
            EstimatedDurationMinutes = as_item.Service.EstimatedDurationMinutes,
            IsActive = as_item.Service.IsActive,
            CreatedAt = as_item.Service.CreatedAt
          } : new ServiceDto()
        }).ToList() ?? new List<AppointmentServiceDto>()
      };
    }
  }
}
