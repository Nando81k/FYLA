using Microsoft.EntityFrameworkCore;
using FYLA.Core.DTOs;
using FYLA.Core.Entities;
using FYLA.Core.Interfaces;
using FYLA.Infrastructure.Data;

namespace FYLA.Application.Services
{
  public class ContentService : IContentService
  {
    private readonly ApplicationDbContext _context;

    public ContentService(ApplicationDbContext context)
    {
      _context = context;
    }

    public async Task<ContentPostDto> CreateContentPostAsync(int providerId, CreateContentPostDto createDto)
    {
      var provider = await _context.Users.FindAsync(providerId);
      if (provider == null || provider.Role != "ServiceProvider")
        throw new ArgumentException("Provider not found");

      var contentPost = new ContentPost
      {
        ProviderId = providerId,
        Content = createDto.Content,
        ImageUrl = createDto.ImageUrl,
        CreatedAt = DateTime.UtcNow
      };

      _context.ContentPosts.Add(contentPost);
      await _context.SaveChangesAsync();

      // Associate services if provided
      if (createDto.ServiceIds?.Any() == true)
      {
        var services = await _context.Services
            .Where(s => createDto.ServiceIds.Contains(s.Id) && s.ProviderId == providerId)
            .ToListAsync();

        contentPost.Services = services;
        await _context.SaveChangesAsync();
      }

      return await GetContentPostByIdAsync(contentPost.Id) ?? throw new InvalidOperationException("Failed to create content post");
    }

    public async Task<ContentPostDto?> GetContentPostByIdAsync(int postId, int? currentUserId = null)
    {
      var post = await _context.ContentPosts
          .Include(p => p.Provider)
          .Include(p => p.Services)
          .Include(p => p.Likes)
          .Include(p => p.Comments)
              .ThenInclude(c => c.User)
          .FirstOrDefaultAsync(p => p.Id == postId);

      if (post == null)
        return null;

      var isLikedByCurrentUser = currentUserId.HasValue &&
          post.Likes.Any(l => l.UserId == currentUserId.Value);

      return new ContentPostDto
      {
        Id = post.Id,
        Content = post.Content,
        ImageUrl = post.ImageUrl,
        CreatedAt = post.CreatedAt,
        UpdatedAt = post.UpdatedAt,
        ProviderId = post.ProviderId,
        ProviderName = post.Provider.FullName,
        ProviderProfileImageUrl = post.Provider.ProfilePictureUrl,
        LikesCount = post.Likes.Count,
        CommentsCount = post.Comments.Count,
        IsLikedByCurrentUser = isLikedByCurrentUser,
        Services = post.Services.Select(s => new ServiceDto
        {
          Id = s.Id,
          Name = s.Name,
          Description = s.Description,
          Price = s.Price,
          EstimatedDurationMinutes = s.EstimatedDurationMinutes
        }).ToList(),
        RecentComments = post.Comments
              .OrderByDescending(c => c.CreatedAt)
              .Take(3)
              .Select(c => new ContentCommentDto
              {
                Id = c.Id,
                Comment = c.Comment,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt,
                UserId = c.UserId,
                UserName = c.User.FullName,
                UserProfileImageUrl = c.User.ProfilePictureUrl
              }).ToList()
      };
    }

    public async Task<ContentPostDto> UpdateContentPostAsync(int postId, int providerId, CreateContentPostDto updateDto)
    {
      var post = await _context.ContentPosts
          .Include(p => p.Services)
          .FirstOrDefaultAsync(p => p.Id == postId && p.ProviderId == providerId);

      if (post == null)
        throw new ArgumentException("Content post not found or access denied");

      post.Content = updateDto.Content;
      post.ImageUrl = updateDto.ImageUrl;
      post.UpdatedAt = DateTime.UtcNow;

      // Update associated services
      if (updateDto.ServiceIds?.Any() == true)
      {
        var services = await _context.Services
            .Where(s => updateDto.ServiceIds.Contains(s.Id) && s.ProviderId == providerId)
            .ToListAsync();

        post.Services.Clear();
        post.Services = services;
      }
      else
      {
        post.Services.Clear();
      }

      await _context.SaveChangesAsync();

      return await GetContentPostByIdAsync(post.Id) ?? throw new InvalidOperationException("Failed to update content post");
    }

    public async Task<bool> DeleteContentPostAsync(int postId, int providerId)
    {
      var post = await _context.ContentPosts
          .FirstOrDefaultAsync(p => p.Id == postId && p.ProviderId == providerId);

      if (post == null)
        return false;

      _context.ContentPosts.Remove(post);
      await _context.SaveChangesAsync();
      return true;
    }

    public async Task<ContentFeedDto> GetContentFeedAsync(int page = 1, int pageSize = 10, int? currentUserId = null)
    {
      var query = _context.ContentPosts
          .Include(p => p.Provider)
          .Include(p => p.Services)
          .Include(p => p.Likes)
          .Include(p => p.Comments)
              .ThenInclude(c => c.User)
          .OrderByDescending(p => p.CreatedAt);

      var totalCount = await query.CountAsync();
      var posts = await query
          .Skip((page - 1) * pageSize)
          .Take(pageSize)
          .ToListAsync();

      var postDtos = posts.Select(post =>
      {
        var isLikedByCurrentUser = currentUserId.HasValue &&
                  post.Likes.Any(l => l.UserId == currentUserId.Value);

        return new ContentPostDto
        {
          Id = post.Id,
          Content = post.Content,
          ImageUrl = post.ImageUrl,
          CreatedAt = post.CreatedAt,
          UpdatedAt = post.UpdatedAt,
          ProviderId = post.ProviderId,
          ProviderName = post.Provider.FullName,
          ProviderProfileImageUrl = post.Provider.ProfilePictureUrl,
          LikesCount = post.Likes.Count,
          CommentsCount = post.Comments.Count,
          IsLikedByCurrentUser = isLikedByCurrentUser,
          Services = post.Services.Select(s => new ServiceDto
          {
            Id = s.Id,
            Name = s.Name,
            Description = s.Description,
            Price = s.Price,
            EstimatedDurationMinutes = s.EstimatedDurationMinutes
          }).ToList(),
          RecentComments = post.Comments
                      .OrderByDescending(c => c.CreatedAt)
                      .Take(3)
                      .Select(c => new ContentCommentDto
                  {
                    Id = c.Id,
                    Comment = c.Comment,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt,
                    UserId = c.UserId,
                    UserName = c.User.FullName,
                    UserProfileImageUrl = c.User.ProfilePictureUrl
                  }).ToList()
        };
      }).ToList();

      return new ContentFeedDto
      {
        Posts = postDtos,
        TotalCount = totalCount,
        Page = page,
        PageSize = pageSize,
        HasNextPage = totalCount > page * pageSize
      };
    }

    public async Task<ContentFeedDto> GetProviderContentAsync(int providerId, int page = 1, int pageSize = 10, int? currentUserId = null)
    {
      var query = _context.ContentPosts
          .Where(p => p.ProviderId == providerId)
          .Include(p => p.Provider)
          .Include(p => p.Services)
          .Include(p => p.Likes)
          .Include(p => p.Comments)
              .ThenInclude(c => c.User)
          .OrderByDescending(p => p.CreatedAt);

      var totalCount = await query.CountAsync();
      var posts = await query
          .Skip((page - 1) * pageSize)
          .Take(pageSize)
          .ToListAsync();

      var postDtos = posts.Select(post =>
      {
        var isLikedByCurrentUser = currentUserId.HasValue &&
                  post.Likes.Any(l => l.UserId == currentUserId.Value);

        return new ContentPostDto
        {
          Id = post.Id,
          Content = post.Content,
          ImageUrl = post.ImageUrl,
          CreatedAt = post.CreatedAt,
          UpdatedAt = post.UpdatedAt,
          ProviderId = post.ProviderId,
          ProviderName = post.Provider.FullName,
          ProviderProfileImageUrl = post.Provider.ProfilePictureUrl,
          LikesCount = post.Likes.Count,
          CommentsCount = post.Comments.Count,
          IsLikedByCurrentUser = isLikedByCurrentUser,
          Services = post.Services.Select(s => new ServiceDto
          {
            Id = s.Id,
            Name = s.Name,
            Description = s.Description,
            Price = s.Price,
            EstimatedDurationMinutes = s.EstimatedDurationMinutes
          }).ToList(),
          RecentComments = post.Comments
                      .OrderByDescending(c => c.CreatedAt)
                      .Take(3)
                      .Select(c => new ContentCommentDto
                  {
                    Id = c.Id,
                    Comment = c.Comment,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt,
                    UserId = c.UserId,
                    UserName = c.User.FullName,
                    UserProfileImageUrl = c.User.ProfilePictureUrl
                  }).ToList()
        };
      }).ToList();

      return new ContentFeedDto
      {
        Posts = postDtos,
        TotalCount = totalCount,
        Page = page,
        PageSize = pageSize,
        HasNextPage = totalCount > page * pageSize
      };
    }

    public async Task<bool> ToggleLikeAsync(int postId, int userId)
    {
      var existingLike = await _context.ContentLikes
          .FirstOrDefaultAsync(l => l.ContentPostId == postId && l.UserId == userId);

      if (existingLike != null)
      {
        _context.ContentLikes.Remove(existingLike);
        await _context.SaveChangesAsync();
        return false; // Unlike
      }
      else
      {
        var like = new ContentLike
        {
          ContentPostId = postId,
          UserId = userId,
          CreatedAt = DateTime.UtcNow
        };

        _context.ContentLikes.Add(like);
        await _context.SaveChangesAsync();
        return true; // Like
      }
    }

    public async Task<int> GetLikesCountAsync(int postId)
    {
      return await _context.ContentLikes.CountAsync(l => l.ContentPostId == postId);
    }

    public async Task<bool> IsLikedByUserAsync(int postId, int userId)
    {
      return await _context.ContentLikes
          .AnyAsync(l => l.ContentPostId == postId && l.UserId == userId);
    }

    public async Task<ContentCommentDto> AddCommentAsync(int postId, int userId, CreateContentCommentDto commentDto)
    {
      var comment = new ContentComment
      {
        ContentPostId = postId,
        UserId = userId,
        Comment = commentDto.Comment,
        CreatedAt = DateTime.UtcNow
      };

      _context.ContentComments.Add(comment);
      await _context.SaveChangesAsync();

      var user = await _context.Users.FindAsync(userId);

      return new ContentCommentDto
      {
        Id = comment.Id,
        Comment = comment.Comment,
        CreatedAt = comment.CreatedAt,
        UpdatedAt = comment.UpdatedAt,
        UserId = comment.UserId,
        UserName = user?.FullName ?? "Unknown User",
        UserProfileImageUrl = user?.ProfilePictureUrl
      };
    }

    public async Task<List<ContentCommentDto>> GetCommentsAsync(int postId, int page = 1, int pageSize = 20)
    {
      var comments = await _context.ContentComments
          .Where(c => c.ContentPostId == postId)
          .Include(c => c.User)
          .OrderBy(c => c.CreatedAt)
          .Skip((page - 1) * pageSize)
          .Take(pageSize)
          .ToListAsync();

      return comments.Select(c => new ContentCommentDto
      {
        Id = c.Id,
        Comment = c.Comment,
        CreatedAt = c.CreatedAt,
        UpdatedAt = c.UpdatedAt,
        UserId = c.UserId,
        UserName = c.User.FullName,
        UserProfileImageUrl = c.User.ProfilePictureUrl
      }).ToList();
    }

    public async Task<ContentCommentDto> UpdateCommentAsync(int commentId, int userId, CreateContentCommentDto updateDto)
    {
      var comment = await _context.ContentComments
          .Include(c => c.User)
          .FirstOrDefaultAsync(c => c.Id == commentId && c.UserId == userId);

      if (comment == null)
        throw new ArgumentException("Comment not found or access denied");

      comment.Comment = updateDto.Comment;
      comment.UpdatedAt = DateTime.UtcNow;

      await _context.SaveChangesAsync();

      return new ContentCommentDto
      {
        Id = comment.Id,
        Comment = comment.Comment,
        CreatedAt = comment.CreatedAt,
        UpdatedAt = comment.UpdatedAt,
        UserId = comment.UserId,
        UserName = comment.User.FullName,
        UserProfileImageUrl = comment.User.ProfilePictureUrl
      };
    }

    public async Task<bool> DeleteCommentAsync(int commentId, int userId)
    {
      var comment = await _context.ContentComments
          .FirstOrDefaultAsync(c => c.Id == commentId && c.UserId == userId);

      if (comment == null)
        return false;

      _context.ContentComments.Remove(comment);
      await _context.SaveChangesAsync();
      return true;
    }
  }
}
