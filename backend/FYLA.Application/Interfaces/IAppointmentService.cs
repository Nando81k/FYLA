using FYLA.Core.DTOs;

namespace FYLA.Application.Interfaces
{
  public interface IAppointmentService
  {
    Task<ServiceResult<AppointmentDto>> CreateAppointmentAsync(int clientId, CreateAppointmentRequestDto request);
    Task<ServiceResult<AppointmentListResponseDto>> GetAppointmentsAsync(int userId, int page = 1, int limit = 20, string? status = null);
    Task<ServiceResult<AppointmentDto>> GetAppointmentByIdAsync(int id, int userId);
    Task<ServiceResult<AppointmentDto>> UpdateAppointmentAsync(int id, int userId, UpdateAppointmentRequestDto request);
    Task<ServiceResult<bool>> CancelAppointmentAsync(int id, int userId);
    Task<ServiceResult<List<TimeSlotDto>>> GetAvailableTimeSlotsAsync(AvailabilityRequestDto request);
  }
}
