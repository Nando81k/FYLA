using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FYLA.Application.Interfaces;
using FYLA.Core.DTOs;
using FYLA.API.Extensions;

namespace FYLA.API.Controllers
{
  [ApiController]
  [Route("api/[controller]")]
  [Authorize]
  public class SocialController : ControllerBase
  {
    private readonly ISocialService _socialService;
    private readonly ILogger<SocialController> _logger;

    public SocialController(ISocialService socialService, ILogger<SocialController> logger)
    {
      _socialService = socialService;
      _logger = logger;
    }

    /// <summary>
    /// Toggle follow/unfollow a user
    /// </summary>
    [HttpPost("follow")]
    public async Task<IActionResult> ToggleFollow([FromBody] FollowRequestDto request)
    {
      if (!ModelState.IsValid)
      {
        return BadRequest(ModelState);
      }

      var currentUserId = User.GetUserId();

      // Check if already following
      var isFollowingResult = await _socialService.IsFollowingAsync(currentUserId, request.UserId);
      if (!isFollowingResult.IsSuccess)
      {
        return BadRequest(new { message = isFollowingResult.ErrorMessage });
      }

      bool isNowFollowing;
      if (isFollowingResult.Data)
      {
        // Unfollow
        var unfollowResult = await _socialService.UnfollowUserAsync(currentUserId, request.UserId);
        if (!unfollowResult.IsSuccess)
        {
          return BadRequest(new { message = unfollowResult.ErrorMessage });
        }
        isNowFollowing = false;
      }
      else
      {
        // Follow
        var followResult = await _socialService.FollowUserAsync(currentUserId, request.UserId);
        if (!followResult.IsSuccess)
        {
          return BadRequest(new { message = followResult.ErrorMessage });
        }
        isNowFollowing = true;
      }

      // Get updated follower count
      var statsResult = await _socialService.GetUserSocialStatsAsync(request.UserId);
      var followersCount = statsResult.IsSuccess ? statsResult.Data!.FollowersCount : 0;

      var response = new FollowToggleResponseDto
      {
        IsFollowing = isNowFollowing,
        FollowersCount = followersCount,
        Message = isNowFollowing ? "Following user" : "Unfollowed user"
      };

      return Ok(response);
    }

    /// <summary>
    /// Get user's followers
    /// </summary>
    [HttpGet("users/{userId}/followers")]
    public async Task<IActionResult> GetFollowers(int userId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
      var result = await _socialService.GetFollowersAsync(userId, page, pageSize);

      if (result.IsSuccess)
      {
        return Ok(result.Data);
      }

      return BadRequest(new { message = result.ErrorMessage });
    }

    /// <summary>
    /// Get users that a user is following
    /// </summary>
    [HttpGet("users/{userId}/following")]
    public async Task<IActionResult> GetFollowing(int userId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
      var result = await _socialService.GetFollowingAsync(userId, page, pageSize);

      if (result.IsSuccess)
      {
        return Ok(result.Data);
      }

      return BadRequest(new { message = result.ErrorMessage });
    }

    /// <summary>
    /// Get user's social statistics
    /// </summary>
    [HttpGet("users/{userId}/stats")]
    public async Task<IActionResult> GetUserSocialStats(int userId)
    {
      var result = await _socialService.GetUserSocialStatsAsync(userId);

      if (result.IsSuccess)
      {
        return Ok(result.Data);
      }

      return BadRequest(new { message = result.ErrorMessage });
    }

    /// <summary>
    /// Check if current user is following another user
    /// </summary>
    [HttpGet("users/{userId}/is-following")]
    public async Task<IActionResult> IsFollowing(int userId)
    {
      var currentUserId = User.GetUserId();
      var result = await _socialService.IsFollowingAsync(currentUserId, userId);

      if (result.IsSuccess)
      {
        return Ok(new { isFollowing = result.Data });
      }

      return BadRequest(new { message = result.ErrorMessage });
    }

    /// <summary>
    /// Get mutual follows between current user and another user
    /// </summary>
    [HttpGet("users/{userId}/mutual-follows")]
    public async Task<IActionResult> GetMutualFollows(int userId)
    {
      var currentUserId = User.GetUserId();
      var result = await _socialService.GetMutualFollowsAsync(currentUserId, userId);

      if (result.IsSuccess)
      {
        return Ok(result.Data);
      }

      return BadRequest(new { message = result.ErrorMessage });
    }

    /// <summary>
    /// Get suggested users to follow
    /// </summary>
    [HttpGet("suggested-users")]
    public async Task<IActionResult> GetSuggestedUsers([FromQuery] int limit = 10)
    {
      var currentUserId = User.GetUserId();
      var result = await _socialService.GetSuggestedUsersAsync(currentUserId, limit);

      if (result.IsSuccess)
      {
        return Ok(result.Data);
      }

      return BadRequest(new { message = result.ErrorMessage });
    }

    /// <summary>
    /// Get current user's social feed (users they follow)
    /// </summary>
    [HttpGet("my-following")]
    public async Task<IActionResult> GetMyFollowing([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
      var currentUserId = User.GetUserId();
      var result = await _socialService.GetFollowingAsync(currentUserId, page, pageSize);

      if (result.IsSuccess)
      {
        return Ok(result.Data);
      }

      return BadRequest(new { message = result.ErrorMessage });
    }

    /// <summary>
    /// Get current user's followers
    /// </summary>
    [HttpGet("my-followers")]
    public async Task<IActionResult> GetMyFollowers([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
      var currentUserId = User.GetUserId();
      var result = await _socialService.GetFollowersAsync(currentUserId, page, pageSize);

      if (result.IsSuccess)
      {
        return Ok(result.Data);
      }

      return BadRequest(new { message = result.ErrorMessage });
    }
  }
}
