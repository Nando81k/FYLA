using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using FYLA.Application.Interfaces;
using FYLA.Core.DTOs;
using FYLA.Core.Entities;
using FYLA.Infrastructure.Data;

namespace FYLA.Application.Services
{
  public class SocialService : ISocialService
  {
    private readonly ApplicationDbContext _context;
    private readonly ILogger<SocialService> _logger;

    public SocialService(ApplicationDbContext context, ILogger<SocialService> logger)
    {
      _context = context;
      _logger = logger;
    }

    public async Task<ServiceResult<FollowDto>> FollowUserAsync(int followerId, int followingId)
    {
      try
      {
        // Validate users exist
        if (followerId == followingId)
        {
          return ServiceResult<FollowDto>.Failure("Cannot follow yourself");
        }

        var followerUser = await _context.Users.FindAsync(followerId);
        var followingUser = await _context.Users.FindAsync(followingId);

        if (followerUser == null || followingUser == null)
        {
          return ServiceResult<FollowDto>.Failure("One or both users not found");
        }

        // Check if already following
        var existingFollow = await _context.Followers
            .FirstOrDefaultAsync(f => f.FollowerUserId == followerId && f.FollowedUserId == followingId);

        if (existingFollow != null)
        {
          return ServiceResult<FollowDto>.Failure("Already following this user");
        }

        // Create follow relationship
        var follow = new Follower
        {
          FollowerUserId = followerId,
          FollowedUserId = followingId,
          CreatedAt = DateTime.UtcNow
        };

        _context.Followers.Add(follow);
        await _context.SaveChangesAsync();

        // Load with navigation properties
        var followWithUsers = await _context.Followers
            .Include(f => f.FollowerUser)
            .Include(f => f.FollowedUser)
            .FirstAsync(f => f.Id == follow.Id);

        var followDto = MapToFollowDto(followWithUsers);
        return ServiceResult<FollowDto>.Success(followDto);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error following user {FollowerId} -> {FollowingId}", followerId, followingId);
        return ServiceResult<FollowDto>.Failure("Error creating follow relationship");
      }
    }

    public async Task<ServiceResult<bool>> UnfollowUserAsync(int followerId, int followingId)
    {
      try
      {
        var follow = await _context.Followers
            .FirstOrDefaultAsync(f => f.FollowerUserId == followerId && f.FollowedUserId == followingId);

        if (follow == null)
        {
          return ServiceResult<bool>.Failure("Follow relationship not found");
        }

        _context.Followers.Remove(follow);
        await _context.SaveChangesAsync();

        return ServiceResult<bool>.Success(true);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error unfollowing user {FollowerId} -> {FollowingId}", followerId, followingId);
        return ServiceResult<bool>.Failure("Error removing follow relationship");
      }
    }

    public async Task<ServiceResult<bool>> IsFollowingAsync(int followerId, int followingId)
    {
      try
      {
        var isFollowing = await _context.Followers
            .AnyAsync(f => f.FollowerUserId == followerId && f.FollowedUserId == followingId);

        return ServiceResult<bool>.Success(isFollowing);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error checking follow status {FollowerId} -> {FollowingId}", followerId, followingId);
        return ServiceResult<bool>.Failure("Error checking follow status");
      }
    }

    public async Task<ServiceResult<IEnumerable<UserFollowDto>>> GetFollowersAsync(int userId, int page = 1, int pageSize = 20)
    {
      try
      {
        var followers = await _context.Followers
            .Include(f => f.FollowerUser)
            .Where(f => f.FollowedUserId == userId)
            .OrderByDescending(f => f.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var followerDtos = new List<UserFollowDto>();
        foreach (var follow in followers)
        {
          if (follow.FollowerUser != null)
          {
            var followerDto = await MapToUserFollowDto(follow.FollowerUser, userId);
            followerDtos.Add(followerDto);
          }
        }

        return ServiceResult<IEnumerable<UserFollowDto>>.Success(followerDtos);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error getting followers for user {UserId}", userId);
        return ServiceResult<IEnumerable<UserFollowDto>>.Failure("Error retrieving followers");
      }
    }

    public async Task<ServiceResult<IEnumerable<UserFollowDto>>> GetFollowingAsync(int userId, int page = 1, int pageSize = 20)
    {
      try
      {
        var following = await _context.Followers
            .Include(f => f.FollowedUser)
            .Where(f => f.FollowerUserId == userId)
            .OrderByDescending(f => f.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var followingDtos = new List<UserFollowDto>();
        foreach (var follow in following)
        {
          if (follow.FollowedUser != null)
          {
            var followingDto = await MapToUserFollowDto(follow.FollowedUser, userId);
            followingDtos.Add(followingDto);
          }
        }

        return ServiceResult<IEnumerable<UserFollowDto>>.Success(followingDtos);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error getting following for user {UserId}", userId);
        return ServiceResult<IEnumerable<UserFollowDto>>.Failure("Error retrieving following");
      }
    }

    public async Task<ServiceResult<UserSocialStatsDto>> GetUserSocialStatsAsync(int userId)
    {
      try
      {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
          return ServiceResult<UserSocialStatsDto>.Failure("User not found");
        }

        var followersCount = await _context.Followers.CountAsync(f => f.FollowedUserId == userId);
        var followingCount = await _context.Followers.CountAsync(f => f.FollowerUserId == userId);
        var postsCount = await _context.Posts.CountAsync(p => p.ProviderId == userId);

        var stats = new UserSocialStatsDto
        {
          UserId = userId,
          FollowersCount = followersCount,
          FollowingCount = followingCount,
          PostsCount = postsCount,
          IsPrivate = false // TODO: Add privacy settings to User entity
        };

        return ServiceResult<UserSocialStatsDto>.Success(stats);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error getting social stats for user {UserId}", userId);
        return ServiceResult<UserSocialStatsDto>.Failure("Error retrieving social stats");
      }
    }

    public async Task<ServiceResult<IEnumerable<UserFollowDto>>> GetMutualFollowsAsync(int userId, int otherUserId)
    {
      try
      {
        // Get users that both userId and otherUserId are following
        var mutualFollows = await _context.Followers
            .Include(f => f.FollowedUser)
            .Where(f => f.FollowerUserId == userId)
            .Where(f => _context.Followers.Any(f2 => f2.FollowerUserId == otherUserId && f2.FollowedUserId == f.FollowedUserId))
            .Select(f => f.FollowedUser!)
            .Take(10)
            .ToListAsync();

        var mutualFollowDtos = new List<UserFollowDto>();
        foreach (var user in mutualFollows)
        {
          var userDto = await MapToUserFollowDto(user, userId);
          mutualFollowDtos.Add(userDto);
        }

        return ServiceResult<IEnumerable<UserFollowDto>>.Success(mutualFollowDtos);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error getting mutual follows for users {UserId} and {OtherUserId}", userId, otherUserId);
        return ServiceResult<IEnumerable<UserFollowDto>>.Failure("Error retrieving mutual follows");
      }
    }

    public async Task<ServiceResult<IEnumerable<UserFollowDto>>> GetSuggestedUsersAsync(int userId, int limit = 10)
    {
      try
      {
        // Get users that the current user is not following
        var currentlyFollowing = await _context.Followers
            .Where(f => f.FollowerUserId == userId)
            .Select(f => f.FollowedUserId)
            .ToListAsync();

        var suggestedUsers = await _context.Users
            .Where(u => u.Id != userId && !currentlyFollowing.Contains(u.Id))
            .Where(u => u.Role == "ServiceProvider") // Prioritize service providers
            .OrderByDescending(u => u.CreatedAt) // Most recent users first
            .Take(limit)
            .ToListAsync();

        var suggestedUserDtos = new List<UserFollowDto>();
        foreach (var user in suggestedUsers)
        {
          var userDto = await MapToUserFollowDto(user, userId);
          suggestedUserDtos.Add(userDto);
        }

        return ServiceResult<IEnumerable<UserFollowDto>>.Success(suggestedUserDtos);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error getting suggested users for user {UserId}", userId);
        return ServiceResult<IEnumerable<UserFollowDto>>.Failure("Error retrieving suggested users");
      }
    }

    private static FollowDto MapToFollowDto(Follower follow)
    {
      return new FollowDto
      {
        Id = follow.Id,
        FollowerUserId = follow.FollowerUserId,
        FollowedUserId = follow.FollowedUserId,
        CreatedAt = follow.CreatedAt,
        FollowerUser = follow.FollowerUser != null ? new UserFollowDto
        {
          Id = follow.FollowerUser.Id,
          FullName = follow.FollowerUser.FullName,
          Email = follow.FollowerUser.Email,
          ProfilePictureUrl = follow.FollowerUser.ProfilePictureUrl,
          Bio = follow.FollowerUser.Bio,
          IsServiceProvider = follow.FollowerUser.Role == "ServiceProvider"
        } : null,
        FollowedUser = follow.FollowedUser != null ? new UserFollowDto
        {
          Id = follow.FollowedUser.Id,
          FullName = follow.FollowedUser.FullName,
          Email = follow.FollowedUser.Email,
          ProfilePictureUrl = follow.FollowedUser.ProfilePictureUrl,
          Bio = follow.FollowedUser.Bio,
          IsServiceProvider = follow.FollowedUser.Role == "ServiceProvider"
        } : null
      };
    }

    private async Task<UserFollowDto> MapToUserFollowDto(User user, int currentUserId)
    {
      var followersCount = await _context.Followers.CountAsync(f => f.FollowedUserId == user.Id);
      var followingCount = await _context.Followers.CountAsync(f => f.FollowerUserId == user.Id);
      var isFollowing = await _context.Followers.AnyAsync(f => f.FollowerUserId == currentUserId && f.FollowedUserId == user.Id);

      // Get user tags if service provider
      var tags = new List<string>();
      if (user.Role == "ServiceProvider")
      {
        tags = await _context.UserServiceProviderTags
            .Include(ust => ust.ServiceProviderTag)
            .Where(ust => ust.UserId == user.Id)
            .Select(ust => ust.ServiceProviderTag.Name)
            .ToListAsync();
      }

      return new UserFollowDto
      {
        Id = user.Id,
        FullName = user.FullName,
        Email = user.Email,
        ProfilePictureUrl = user.ProfilePictureUrl,
        Bio = user.Bio,
        IsServiceProvider = user.Role == "ServiceProvider",
        IsFollowing = isFollowing,
        FollowersCount = followersCount,
        FollowingCount = followingCount,
        Tags = tags.Any() ? tags : null
      };
    }
  }
}
