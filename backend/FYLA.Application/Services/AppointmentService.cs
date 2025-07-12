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
    public async Task<ServiceResult<AppointmentDto>> CreateAppointmentAsync(int clientId, CreateAppointmentRequestDto request)
    {
      try
      {
        // TODO: Implement database logic
        await Task.Delay(100); // Simulate async operation

        // Mock appointment creation
        var appointment = new AppointmentDto
        {
          Id = new Random().Next(1, 1000),
          ClientId = clientId,
          ProviderId = request.ProviderId,
          ScheduledStartTime = request.ScheduledStartTime,
          ScheduledEndTime = request.ScheduledStartTime.AddHours(1), // Default 1 hour duration
          Status = AppointmentStatus.Confirmed,
          TotalPrice = 50.0m, // Mock price
          Notes = request.Notes,
          CreatedAt = DateTime.UtcNow,
          UpdatedAt = DateTime.UtcNow,
          Services = request.ServiceIds.Select(serviceId => new AppointmentServiceDto
          {
            Id = new Random().Next(1, 1000),
            AppointmentId = 0, // Will be set after appointment creation
            ServiceId = serviceId,
            PriceAtBooking = 50.0m,
            Service = new ServiceDto
            {
              Id = serviceId,
              ProviderId = request.ProviderId,
              Name = $"Service {serviceId}",
              Description = $"Description for service {serviceId}",
              Price = 50.0m,
              EstimatedDurationMinutes = 60,
              IsActive = true,
              CreatedAt = DateTime.UtcNow
            }
          }).ToList()
        };

        Console.WriteLine($"Mock appointment created with ID: {appointment.Id}");
        return ServiceResult<AppointmentDto>.Success(appointment);
      }
      catch (Exception ex)
      {
        Console.WriteLine($"Error creating appointment: {ex.Message}");
        return ServiceResult<AppointmentDto>.Failure("Failed to create appointment");
      }
    }

    public async Task<ServiceResult<AppointmentListResponseDto>> GetAppointmentsAsync(int userId, int page = 1, int limit = 20, string? status = null)
    {
      try
      {
        // TODO: Implement database logic
        await Task.Delay(100); // Simulate async operation

        // Mock appointments
        var mockAppointments = new List<AppointmentDto>
                {
                    new AppointmentDto
                    {
                        Id = 1,
                        ClientId = userId,
                        ProviderId = 2,
                        ScheduledStartTime = DateTime.UtcNow.AddDays(1),
                        ScheduledEndTime = DateTime.UtcNow.AddDays(1).AddHours(1),
                        Status = AppointmentStatus.Confirmed,
                        TotalPrice = 75.0m,
                        Notes = "Regular appointment",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                        Services = new List<AppointmentServiceDto>
                        {
                            new AppointmentServiceDto
                            {
                                Id = 1,
                                AppointmentId = 1,
                                ServiceId = 1,
                                PriceAtBooking = 75.0m,
                                Service = new ServiceDto
                                {
                                    Id = 1,
                                    ProviderId = 2,
                                    Name = "Haircut",
                                    Description = "Professional haircut service",
                                    Price = 75.0m,
                                    EstimatedDurationMinutes = 60,
                                    IsActive = true,
                                    CreatedAt = DateTime.UtcNow
                                }
                            }
                        }
                    }
                };

        // Filter by status if provided
        if (!string.IsNullOrEmpty(status) && Enum.TryParse<AppointmentStatus>(status, true, out var statusEnum))
        {
          mockAppointments = mockAppointments.Where(a => a.Status == statusEnum).ToList();
        }

        // Apply pagination
        var totalCount = mockAppointments.Count;
        var paginatedAppointments = mockAppointments
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToList();

        var response = new AppointmentListResponseDto
        {
          Appointments = paginatedAppointments,
          Total = totalCount,
          HasMore = (page * limit) < totalCount
        };

        Console.WriteLine($"Retrieved {paginatedAppointments.Count} appointments for user {userId}");
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
        // TODO: Implement database logic
        await Task.Delay(100); // Simulate async operation

        // Mock appointment
        var appointment = new AppointmentDto
        {
          Id = id,
          ClientId = userId,
          ProviderId = 2,
          ScheduledStartTime = DateTime.UtcNow.AddDays(1),
          ScheduledEndTime = DateTime.UtcNow.AddDays(1).AddHours(1),
          Status = AppointmentStatus.Confirmed,
          TotalPrice = 75.0m,
          Notes = "Regular appointment",
          CreatedAt = DateTime.UtcNow,
          UpdatedAt = DateTime.UtcNow,
          Services = new List<AppointmentServiceDto>()
        };

        Console.WriteLine($"Retrieved appointment {id} for user {userId}");
        return ServiceResult<AppointmentDto>.Success(appointment);
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
        // TODO: Implement database logic
        await Task.Delay(100); // Simulate async operation

        // Mock updated appointment
        var appointment = new AppointmentDto
        {
          Id = id,
          ClientId = userId,
          ProviderId = 2,
          ScheduledStartTime = request.ScheduledStartTime ?? DateTime.UtcNow.AddDays(1),
          ScheduledEndTime = (request.ScheduledStartTime ?? DateTime.UtcNow.AddDays(1)).AddHours(1),
          Status = request.Status ?? AppointmentStatus.Confirmed,
          TotalPrice = 75.0m,
          Notes = request.Notes ?? "Updated appointment",
          CreatedAt = DateTime.UtcNow,
          UpdatedAt = DateTime.UtcNow,
          Services = new List<AppointmentServiceDto>()
        };

        Console.WriteLine($"Updated appointment {id} for user {userId}");
        return ServiceResult<AppointmentDto>.Success(appointment);
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
        // TODO: Implement database logic
        await Task.Delay(100); // Simulate async operation

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
        // TODO: Implement database logic with business hours and existing appointments
        await Task.Delay(100); // Simulate async operation

        var timeSlots = new List<TimeSlotDto>();

        // Generate mock time slots for business hours (9 AM to 5 PM, excluding lunch at 12 PM)
        for (int hour = 9; hour < 17; hour++)
        {
          if (hour == 12) continue; // Skip lunch hour

          timeSlots.Add(new TimeSlotDto
          {
            StartTime = $"{hour:D2}:00",
            EndTime = $"{(hour + 1):D2}:00",
            IsAvailable = new Random().NextDouble() > 0.3, // 70% availability
            Reason = new Random().NextDouble() > 0.7 ? "Already booked" : null
          });
        }

        Console.WriteLine($"Generated {timeSlots.Count} time slots for provider {request.ProviderId} on {request.Date}");

        return ServiceResult<List<TimeSlotDto>>.Success(timeSlots);
      }
      catch (Exception ex)
      {
        Console.WriteLine($"Error getting available time slots for provider {request.ProviderId} on {request.Date}: {ex.Message}");
        return ServiceResult<List<TimeSlotDto>>.Failure("Failed to retrieve available time slots");
      }
    }
  }
}
