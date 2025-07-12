using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using FYLA.Application.Interfaces;
using FYLA.Core.DTOs;
using System.Security.Claims;

namespace FYLA.API.Hubs
{
  [Authorize]
  public class ChatHub : Hub
  {
    private readonly IChatService _chatService;
    private readonly ILogger<ChatHub> _logger;

    public ChatHub(IChatService chatService, ILogger<ChatHub> logger)
    {
      _chatService = chatService;
      _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
      var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
      if (userId != null)
      {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"User_{userId}");
        _logger.LogInformation($"User {userId} connected to chat hub");
      }

      await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
      var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
      if (userId != null)
      {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"User_{userId}");
        _logger.LogInformation($"User {userId} disconnected from chat hub");
      }

      await base.OnDisconnectedAsync(exception);
    }

    public async Task JoinConversation(int conversationId)
    {
      var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
      if (userId != null)
      {
        // Verify user is part of the conversation
        var conversation = await _chatService.GetConversationAsync(conversationId, int.Parse(userId));
        if (conversation != null)
        {
          await Groups.AddToGroupAsync(Context.ConnectionId, $"Conversation_{conversationId}");
          _logger.LogInformation($"User {userId} joined conversation {conversationId}");
        }
      }
    }

    public async Task LeaveConversation(int conversationId)
    {
      await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Conversation_{conversationId}");
      var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
      _logger.LogInformation($"User {userId} left conversation {conversationId}");
    }

    public async Task SendMessage(int conversationId, string content)
    {
      var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
      if (userId == null)
      {
        await Clients.Caller.SendAsync("Error", "User not authenticated");
        return;
      }

      try
      {
        var sendMessageRequest = new SendMessageRequestDto
        {
          ConversationId = conversationId,
          Content = content
        };

        var result = await _chatService.SendMessageAsync(sendMessageRequest, int.Parse(userId));

        if (result.IsSuccess && result.Data != null)
        {
          // Send to all users in the conversation
          await Clients.Group($"Conversation_{conversationId}")
              .SendAsync("ReceiveMessage", result.Data);

          _logger.LogInformation($"Message sent by user {userId} in conversation {conversationId}");
        }
        else
        {
          await Clients.Caller.SendAsync("Error", result.ErrorMessage);
        }
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, $"Error sending message for user {userId} in conversation {conversationId}");
        await Clients.Caller.SendAsync("Error", "Failed to send message");
      }
    }

    public async Task MarkMessageAsRead(int messageId)
    {
      var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
      if (userId == null) return;

      try
      {
        await _chatService.MarkMessageAsReadAsync(messageId, int.Parse(userId));

        // Notify the sender that their message was read
        await Clients.Group($"User_{userId}")
            .SendAsync("MessageRead", messageId);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, $"Error marking message {messageId} as read for user {userId}");
      }
    }

    public async Task StartTyping(int conversationId)
    {
      var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
      if (userId == null) return;

      await Clients.GroupExcept($"Conversation_{conversationId}", Context.ConnectionId)
          .SendAsync("UserTyping", new { UserId = userId, ConversationId = conversationId });
    }

    public async Task StopTyping(int conversationId)
    {
      var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
      if (userId == null) return;

      await Clients.GroupExcept($"Conversation_{conversationId}", Context.ConnectionId)
          .SendAsync("UserStoppedTyping", new { UserId = userId, ConversationId = conversationId });
    }
  }
}
