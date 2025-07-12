using FYLA.Core.DTOs;
using FYLA.Core.Entities;

namespace FYLA.Application.Interfaces
{
  public interface IServiceManagementService
  {
    // Service CRUD operations
    Task<ServiceResponse> CreateServiceAsync(int providerId, CreateServiceRequest request);
    Task<ServiceResponse> GetServiceAsync(int serviceId);
    Task<ServiceListResponse> GetProviderServicesAsync(int providerId, int page = 1, int pageSize = 20);
    Task<ServiceListResponse> GetAllServicesAsync(int page = 1, int pageSize = 20, bool activeOnly = true);
    Task<ServiceResponse> UpdateServiceAsync(int serviceId, int providerId, UpdateServiceRequest request);
    Task<bool> DeleteServiceAsync(int serviceId, int providerId);

    // Time slot management
    Task<AvailableTimeSlotsResponse> GetAvailableTimeSlotsAsync(TimeSlotRequest request);
    Task<bool> IsTimeSlotAvailableAsync(int providerId, DateTime startTime, DateTime endTime);
    Task<List<DateTime>> GetBookedTimeSlotsAsync(int providerId, DateTime date);

    // Booking operations
    Task<BookingResponse> CreateBookingAsync(int clientId, CreateBookingRequest request);
    Task<BookingResponse> UpdateBookingStatusAsync(int appointmentId, int userId, string status);
    Task<List<BookingResponse>> GetUserBookingsAsync(int userId, bool isProvider = false);
    Task<BookingResponse?> GetBookingAsync(int appointmentId, int userId);

    // Utility methods
    Task<decimal> CalculateTotalPriceAsync(List<int> serviceIds);
    Task<int> CalculateTotalDurationAsync(List<int> serviceIds);
  }
}
