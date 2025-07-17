using FYLA.Core.DTOs;

namespace FYLA.Application.Interfaces
{
  public interface ISocialService
  {
    Task<ServiceResult<FollowDto>> FollowUserAsync(int followerId, int followingId);
    Task<ServiceResult<bool>> UnfollowUserAsync(int followerId, int followingId);
    Task<ServiceResult<bool>> IsFollowingAsync(int followerId, int followingId);
    Task<ServiceResult<IEnumerable<UserFollowDto>>> GetFollowersAsync(int userId, int page = 1, int pageSize = 20);
    Task<ServiceResult<IEnumerable<UserFollowDto>>> GetFollowingAsync(int userId, int page = 1, int pageSize = 20);
    Task<ServiceResult<UserSocialStatsDto>> GetUserSocialStatsAsync(int userId);
    Task<ServiceResult<IEnumerable<UserFollowDto>>> GetMutualFollowsAsync(int userId, int otherUserId);
    Task<ServiceResult<IEnumerable<UserFollowDto>>> GetSuggestedUsersAsync(int userId, int limit = 10);
  }
}
