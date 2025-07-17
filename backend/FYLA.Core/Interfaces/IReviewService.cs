// Temporarily commented out due to build issues - will fix later
/*
using FYLA.Core.DTOs;

namespace FYLA.Core.Interfaces
{
  public interface IReviewService
  {
    Task<ServiceResult<ReviewDto>> CreateReviewAsync(int clientId, CreateReviewDto createReviewDto);
    Task<ServiceResult<ReviewListResponseDto>> GetProviderReviewsAsync(int providerId, int page = 1, int pageSize = 20);
    Task<ServiceResult<ReviewDto?>> GetAppointmentReviewAsync(int appointmentId);
    Task<ServiceResult<ReviewDto>> GetReviewByIdAsync(int reviewId);
    Task<ServiceResult<ReviewDto>> UpdateReviewAsync(int reviewId, int clientId, UpdateReviewDto updateReviewDto);
    Task<ServiceResult<bool>> DeleteReviewAsync(int reviewId, int clientId);
    Task<ServiceResult<ProviderRatingStatsDto>> GetProviderRatingStatsAsync(int providerId);
    Task<ServiceResult<ReviewListResponseDto>> GetClientReviewsAsync(int clientId, int page = 1, int pageSize = 20);
    Task<ServiceResult<bool>> CanClientReviewAppointmentAsync(int clientId, int appointmentId);
    Task<ServiceResult<List<ReviewDto>>> GetRecentReviewsAsync(int limit = 10);
  }
}
*/
