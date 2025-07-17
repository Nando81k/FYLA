using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using FYLA.Core.DTOs;
using FYLA.Core.Interfaces;
using FYLA.API.Extensions;

namespace FYLA.API.Controllers
{
  [ApiController]
  [Route("api/[controller]")]
  [Authorize]
  public class ContentController : ControllerBase
  {
    private readonly IContentService _contentService;

    public ContentController(IContentService contentService)
    {
      _contentService = contentService;
    }

    [HttpPost]
    public async Task<ActionResult<ContentPostDto>> CreateContentPost([FromBody] CreateContentPostDto createDto)
    {
      try
      {
        var userId = User.GetUserId();
        var userRole = User.GetUserRole();

        // Allow both service providers and clients to create content
        if (userRole != "ServiceProvider" && userRole != "Client")
          return BadRequest("Only authenticated users can create content posts");

        var contentPost = await _contentService.CreateContentPostAsync(userId, createDto);
        return Ok(contentPost);
      }
      catch (ArgumentException ex)
      {
        return BadRequest(ex.Message);
      }
      catch (Exception ex)
      {
        return StatusCode(500, "An error occurred while creating the content post");
      }
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<ContentPostDto>> GetContentPost(int id)
    {
      try
      {
        var currentUserId = User.Identity?.IsAuthenticated == true ? User.GetUserId() : (int?)null;
        var contentPost = await _contentService.GetContentPostByIdAsync(id, currentUserId);

        if (contentPost == null)
          return NotFound("Content post not found");

        return Ok(contentPost);
      }
      catch (Exception ex)
      {
        return StatusCode(500, "An error occurred while retrieving the content post");
      }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ContentPostDto>> UpdateContentPost(int id, [FromBody] CreateContentPostDto updateDto)
    {
      try
      {
        var userId = User.GetUserId();
        var userRole = User.GetUserRole();

        // Allow both service providers and clients to update their own content
        if (userRole != "ServiceProvider" && userRole != "Client")
          return BadRequest("Only authenticated users can update content posts");

        var contentPost = await _contentService.UpdateContentPostAsync(id, userId, updateDto);
        return Ok(contentPost);
      }
      catch (ArgumentException ex)
      {
        return BadRequest(ex.Message);
      }
      catch (Exception ex)
      {
        return StatusCode(500, "An error occurred while updating the content post");
      }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteContentPost(int id)
    {
      try
      {
        var userId = User.GetUserId();
        var userRole = User.GetUserRole();

        // Allow both service providers and clients to delete their own content
        if (userRole != "ServiceProvider" && userRole != "Client")
          return BadRequest("Only authenticated users can delete content posts");

        var success = await _contentService.DeleteContentPostAsync(id, userId);

        if (!success)
          return NotFound("Content post not found or access denied");

        return NoContent();
      }
      catch (Exception ex)
      {
        return StatusCode(500, "An error occurred while deleting the content post");
      }
    }

    [HttpGet("feed")]
    [AllowAnonymous]
    public async Task<ActionResult<ContentFeedDto>> GetContentFeed([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
      try
      {
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 50) pageSize = 10;

        var currentUserId = User.Identity?.IsAuthenticated == true ? User.GetUserId() : (int?)null;
        var feed = await _contentService.GetContentFeedAsync(page, pageSize, currentUserId);

        return Ok(feed);
      }
      catch (Exception ex)
      {
        return StatusCode(500, "An error occurred while retrieving the content feed");
      }
    }

    [HttpGet("provider/{providerId}")]
    [AllowAnonymous]
    public async Task<ActionResult<ContentFeedDto>> GetProviderContent(int providerId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
      try
      {
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 50) pageSize = 10;

        var currentUserId = User.Identity?.IsAuthenticated == true ? User.GetUserId() : (int?)null;
        var feed = await _contentService.GetProviderContentAsync(providerId, page, pageSize, currentUserId);

        return Ok(feed);
      }
      catch (Exception ex)
      {
        return StatusCode(500, "An error occurred while retrieving the provider content");
      }
    }

    [HttpPost("{id}/like")]
    public async Task<ActionResult> ToggleLike(int id)
    {
      try
      {
        var userId = User.GetUserId();
        var isLiked = await _contentService.ToggleLikeAsync(id, userId);

        return Ok(new { isLiked });
      }
      catch (Exception ex)
      {
        return StatusCode(500, "An error occurred while toggling the like");
      }
    }

    [HttpGet("{id}/likes/count")]
    [AllowAnonymous]
    public async Task<ActionResult<int>> GetLikesCount(int id)
    {
      try
      {
        var count = await _contentService.GetLikesCountAsync(id);
        return Ok(count);
      }
      catch (Exception ex)
      {
        return StatusCode(500, "An error occurred while retrieving likes count");
      }
    }

    [HttpPost("{id}/comments")]
    public async Task<ActionResult<ContentCommentDto>> AddComment(int id, [FromBody] CreateContentCommentDto commentDto)
    {
      try
      {
        var userId = User.GetUserId();
        var comment = await _contentService.AddCommentAsync(id, userId, commentDto);

        return Ok(comment);
      }
      catch (Exception ex)
      {
        return StatusCode(500, "An error occurred while adding the comment");
      }
    }

    [HttpGet("{id}/comments")]
    [AllowAnonymous]
    public async Task<ActionResult<List<ContentCommentDto>>> GetComments(int id, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
      try
      {
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 50) pageSize = 20;

        var comments = await _contentService.GetCommentsAsync(id, page, pageSize);
        return Ok(comments);
      }
      catch (Exception ex)
      {
        return StatusCode(500, "An error occurred while retrieving comments");
      }
    }

    [HttpPut("comments/{commentId}")]
    public async Task<ActionResult<ContentCommentDto>> UpdateComment(int commentId, [FromBody] CreateContentCommentDto updateDto)
    {
      try
      {
        var userId = User.GetUserId();
        var comment = await _contentService.UpdateCommentAsync(commentId, userId, updateDto);

        return Ok(comment);
      }
      catch (ArgumentException ex)
      {
        return BadRequest(ex.Message);
      }
      catch (Exception ex)
      {
        return StatusCode(500, "An error occurred while updating the comment");
      }
    }

    [HttpDelete("comments/{commentId}")]
    public async Task<ActionResult> DeleteComment(int commentId)
    {
      try
      {
        var userId = User.GetUserId();
        var success = await _contentService.DeleteCommentAsync(commentId, userId);

        if (!success)
          return NotFound("Comment not found or access denied");

        return NoContent();
      }
      catch (Exception ex)
      {
        return StatusCode(500, "An error occurred while deleting the comment");
      }
    }
  }
}
