namespace FYLA.Core.DTOs
{
  public class FollowDto
  {
    public int Id { get; set; }
    public int FollowerUserId { get; set; }
    public int FollowedUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public UserFollowDto? FollowerUser { get; set; }
    public UserFollowDto? FollowedUser { get; set; }
  }

  public class UserFollowDto
  {
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? ProfilePictureUrl { get; set; }
    public string? Bio { get; set; }
    public bool IsServiceProvider { get; set; }
    public bool IsFollowing { get; set; }
    public int FollowersCount { get; set; }
    public int FollowingCount { get; set; }
    public List<string>? Tags { get; set; }
  }

  public class UserSocialStatsDto
  {
    public int UserId { get; set; }
    public int FollowersCount { get; set; }
    public int FollowingCount { get; set; }
    public int PostsCount { get; set; }
    public bool IsPrivate { get; set; }
  }

  public class FollowRequestDto
  {
    public int UserId { get; set; }
  }

  public class FollowToggleResponseDto
  {
    public bool IsFollowing { get; set; }
    public int FollowersCount { get; set; }
    public string Message { get; set; } = string.Empty;
  }
}
