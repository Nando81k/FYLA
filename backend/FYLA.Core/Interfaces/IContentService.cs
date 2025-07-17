using FYLA.Core.DTOs;
using FYLA.Core.Entities;

namespace FYLA.Core.Interfaces
{
  public interface IContentService
  {
    // Content Posts
    Task<ContentPostDto> CreateContentPostAsync(int providerId, CreateContentPostDto createDto);
    Task<ContentPostDto?> GetContentPostByIdAsync(int postId, int? currentUserId = null);
    Task<ContentPostDto> UpdateContentPostAsync(int postId, int providerId, CreateContentPostDto updateDto);
    Task<bool> DeleteContentPostAsync(int postId, int providerId);

    // Content Feed
    Task<ContentFeedDto> GetContentFeedAsync(int page = 1, int pageSize = 10, int? currentUserId = null);
    Task<ContentFeedDto> GetProviderContentAsync(int providerId, int page = 1, int pageSize = 10, int? currentUserId = null);

    // Likes
    Task<bool> ToggleLikeAsync(int postId, int userId);
    Task<int> GetLikesCountAsync(int postId);
    Task<bool> IsLikedByUserAsync(int postId, int userId);

    // Comments
    Task<ContentCommentDto> AddCommentAsync(int postId, int userId, CreateContentCommentDto commentDto);
    Task<List<ContentCommentDto>> GetCommentsAsync(int postId, int page = 1, int pageSize = 20);
    Task<ContentCommentDto> UpdateCommentAsync(int commentId, int userId, CreateContentCommentDto updateDto);
    Task<bool> DeleteCommentAsync(int commentId, int userId);
  }
}
