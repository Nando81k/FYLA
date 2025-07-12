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
  public class ChatController : ControllerBase
  {
    private readonly IChatService _chatService;
    private readonly ILogger<ChatController> _logger;

    public ChatController(IChatService chatService, ILogger<ChatController> logger)
    {
      _chatService = chatService;
      _logger = logger;
    }

    /// <summary>
    /// Get all conversations for the current user
    /// </summary>
    [HttpGet("conversations")]
    public async Task<IActionResult> GetConversations()
    {
      var userId = User.GetUserId();
      var result = await _chatService.GetUserConversationsAsync(userId);

      if (result.IsSuccess)
      {
        return Ok(result.Data);
      }

      return BadRequest(new { message = result.ErrorMessage });
    }

    /// <summary>
    /// Get a specific conversation
    /// </summary>
    [HttpGet("conversations/{conversationId}")]
    public async Task<IActionResult> GetConversation(int conversationId)
    {
      var userId = User.GetUserId();
      var result = await _chatService.GetConversationAsync(conversationId, userId);

      if (result.IsSuccess)
      {
        return Ok(result.Data);
      }

      return BadRequest(new { message = result.ErrorMessage });
    }

    /// <summary>
    /// Create a new conversation with another user
    /// </summary>
    [HttpPost("conversations")]
    public async Task<IActionResult> CreateConversation([FromBody] CreateConversationRequestDto request)
    {
      if (!ModelState.IsValid)
      {
        return BadRequest(ModelState);
      }

      var userId = User.GetUserId();
      var result = await _chatService.GetOrCreateConversationAsync(userId, request.OtherUserId);

      if (result.IsSuccess)
      {
        return Ok(result.Data);
      }

      return BadRequest(new { message = result.ErrorMessage });
    }

    /// <summary>
    /// Get messages for a conversation
    /// </summary>
    [HttpGet("conversations/{conversationId}/messages")]
    public async Task<IActionResult> GetMessages(int conversationId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
      var userId = User.GetUserId();
      var result = await _chatService.GetConversationMessagesAsync(conversationId, userId, page, pageSize);

      if (result.IsSuccess)
      {
        return Ok(result.Data);
      }

      return BadRequest(new { message = result.ErrorMessage });
    }

    /// <summary>
    /// Send a message in a conversation
    /// </summary>
    [HttpPost("messages")]
    public async Task<IActionResult> SendMessage([FromBody] SendMessageRequestDto request)
    {
      if (!ModelState.IsValid)
      {
        return BadRequest(ModelState);
      }

      var userId = User.GetUserId();
      var result = await _chatService.SendMessageAsync(request, userId);

      if (result.IsSuccess)
      {
        return Ok(result.Data);
      }

      return BadRequest(new { message = result.ErrorMessage });
    }

    /// <summary>
    /// Mark a message as read
    /// </summary>
    [HttpPut("messages/{messageId}/read")]
    public async Task<IActionResult> MarkMessageAsRead(int messageId)
    {
      var userId = User.GetUserId();
      var result = await _chatService.MarkMessageAsReadAsync(messageId, userId);

      if (result.IsSuccess)
      {
        return Ok(new { success = true });
      }

      return BadRequest(new { message = result.ErrorMessage });
    }

    /// <summary>
    /// Mark all messages in a conversation as read
    /// </summary>
    [HttpPut("conversations/{conversationId}/read")]
    public async Task<IActionResult> MarkConversationAsRead(int conversationId)
    {
      var userId = User.GetUserId();
      var result = await _chatService.MarkConversationAsReadAsync(conversationId, userId);

      if (result.IsSuccess)
      {
        return Ok(new { success = true });
      }

      return BadRequest(new { message = result.ErrorMessage });
    }
  }
}
