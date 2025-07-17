namespace FYLA.Core.DTOs
{
  public class CreateContentPostDto
  {
    public string Content { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public List<int>? ServiceIds { get; set; }
  }

  public class ContentPostDto
  {
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // Provider information
    public int ProviderId { get; set; }
    public string ProviderName { get; set; } = string.Empty;
    public string? ProviderProfileImageUrl { get; set; }

    // Engagement metrics
    public int LikesCount { get; set; }
    public int CommentsCount { get; set; }
    public bool IsLikedByCurrentUser { get; set; }

    // Associated services
    public List<ServiceDto> Services { get; set; } = new();

    // Recent comments (for preview)
    public List<ContentCommentDto> RecentComments { get; set; } = new();
  }

  public class ContentCommentDto
  {
    public int Id { get; set; }
    public string Comment { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // User information
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? UserProfileImageUrl { get; set; }
  }

  public class CreateContentCommentDto
  {
    public string Comment { get; set; } = string.Empty;
  }

  public class ContentFeedDto
  {
    public List<ContentPostDto> Posts { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public bool HasNextPage { get; set; }
  }
}
