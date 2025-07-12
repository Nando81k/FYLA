using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using FYLA.Application.Interfaces;
using FYLA.Core.DTOs;
using FYLA.Core.Entities;
using FYLA.Infrastructure.Data;

namespace FYLA.Application.Services
{
  public class ChatService : IChatService
  {
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ChatService> _logger;

    public ChatService(ApplicationDbContext context, ILogger<ChatService> logger)
    {
      _context = context;
      _logger = logger;
    }

    public async Task<ServiceResult<ConversationDto>> GetConversationAsync(int conversationId, int userId)
    {
      try
      {
        var conversation = await _context.Conversations
            .Include(c => c.User1)
            .Include(c => c.User2)
            .Include(c => c.Messages.OrderByDescending(m => m.CreatedAt).Take(1))
            .FirstOrDefaultAsync(c => c.Id == conversationId &&
                                   (c.User1Id == userId || c.User2Id == userId));

        if (conversation == null)
        {
          return ServiceResult<ConversationDto>.Failure("Conversation not found or access denied");
        }

        var unreadCount = await _context.Messages
            .CountAsync(m => m.ConversationId == conversationId &&
                       m.ReceiverId == userId && !m.IsRead);

        var conversationDto = MapToConversationDto(conversation, userId, unreadCount);
        return ServiceResult<ConversationDto>.Success(conversationDto);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error getting conversation {ConversationId} for user {UserId}", conversationId, userId);
        return ServiceResult<ConversationDto>.Failure("Error retrieving conversation");
      }
    }

    public async Task<ServiceResult<IEnumerable<ConversationDto>>> GetUserConversationsAsync(int userId)
    {
      try
      {
        var conversations = await _context.Conversations
            .Include(c => c.User1)
            .Include(c => c.User2)
            .Include(c => c.Messages.OrderByDescending(m => m.CreatedAt).Take(1))
            .Where(c => c.User1Id == userId || c.User2Id == userId)
            .OrderByDescending(c => c.UpdatedAt)
            .ToListAsync();

        var conversationDtos = new List<ConversationDto>();

        foreach (var conversation in conversations)
        {
          var unreadCount = await _context.Messages
              .CountAsync(m => m.ConversationId == conversation.Id &&
                         m.ReceiverId == userId && !m.IsRead);

          conversationDtos.Add(MapToConversationDto(conversation, userId, unreadCount));
        }

        return ServiceResult<IEnumerable<ConversationDto>>.Success(conversationDtos);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error getting conversations for user {UserId}", userId);
        return ServiceResult<IEnumerable<ConversationDto>>.Failure("Error retrieving conversations");
      }
    }

    public async Task<ServiceResult<ConversationDto>> CreateConversationAsync(int user1Id, int user2Id)
    {
      try
      {
        // Check if conversation already exists
        var existingConversation = await _context.Conversations
            .FirstOrDefaultAsync(c => (c.User1Id == user1Id && c.User2Id == user2Id) ||
                                    (c.User1Id == user2Id && c.User2Id == user1Id));

        if (existingConversation != null)
        {
          return await GetConversationAsync(existingConversation.Id, user1Id);
        }

        // Verify both users exist
        var usersExist = await _context.Users
            .CountAsync(u => u.Id == user1Id || u.Id == user2Id);

        if (usersExist != 2)
        {
          return ServiceResult<ConversationDto>.Failure("One or both users not found");
        }

        var conversation = new Conversation
        {
          User1Id = user1Id,
          User2Id = user2Id,
          CreatedAt = DateTime.UtcNow,
          UpdatedAt = DateTime.UtcNow
        };

        _context.Conversations.Add(conversation);
        await _context.SaveChangesAsync();

        return await GetConversationAsync(conversation.Id, user1Id);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error creating conversation between users {User1Id} and {User2Id}", user1Id, user2Id);
        return ServiceResult<ConversationDto>.Failure("Error creating conversation");
      }
    }

    public async Task<ServiceResult<MessageDto>> SendMessageAsync(SendMessageRequestDto request, int senderId)
    {
      try
      {
        // Verify conversation exists and user has access
        var conversation = await _context.Conversations
            .Include(c => c.User1)
            .Include(c => c.User2)
            .FirstOrDefaultAsync(c => c.Id == request.ConversationId &&
                                    (c.User1Id == senderId || c.User2Id == senderId));

        if (conversation == null)
        {
          return ServiceResult<MessageDto>.Failure("Conversation not found or access denied");
        }

        var receiverId = conversation.User1Id == senderId ? conversation.User2Id : conversation.User1Id;

        var message = new Message
        {
          SenderId = senderId,
          ReceiverId = receiverId,
          ConversationId = request.ConversationId,
          Content = request.Content.Trim(),
          IsRead = false,
          CreatedAt = DateTime.UtcNow
        };

        _context.Messages.Add(message);

        // Update conversation timestamp
        conversation.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Load the message with sender info
        var messageWithSender = await _context.Messages
            .Include(m => m.Sender)
            .FirstAsync(m => m.Id == message.Id);

        var messageDto = MapToMessageDto(messageWithSender);
        return ServiceResult<MessageDto>.Success(messageDto);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error sending message for sender {SenderId} in conversation {ConversationId}",
                       senderId, request.ConversationId);
        return ServiceResult<MessageDto>.Failure("Error sending message");
      }
    }

    public async Task<ServiceResult<IEnumerable<MessageDto>>> GetConversationMessagesAsync(int conversationId, int userId, int page = 1, int pageSize = 50)
    {
      try
      {
        // Verify user has access to conversation
        var hasAccess = await _context.Conversations
            .AnyAsync(c => c.Id == conversationId && (c.User1Id == userId || c.User2Id == userId));

        if (!hasAccess)
        {
          return ServiceResult<IEnumerable<MessageDto>>.Failure("Conversation not found or access denied");
        }

        var messages = await _context.Messages
            .Include(m => m.Sender)
            .Where(m => m.ConversationId == conversationId)
            .OrderByDescending(m => m.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var messageDtos = messages.Select(MapToMessageDto).Reverse(); // Reverse to show oldest first
        return ServiceResult<IEnumerable<MessageDto>>.Success(messageDtos);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error getting messages for conversation {ConversationId}, user {UserId}", conversationId, userId);
        return ServiceResult<IEnumerable<MessageDto>>.Failure("Error retrieving messages");
      }
    }

    public async Task<ServiceResult<bool>> MarkMessageAsReadAsync(int messageId, int userId)
    {
      try
      {
        var message = await _context.Messages
            .FirstOrDefaultAsync(m => m.Id == messageId && m.ReceiverId == userId);

        if (message == null)
        {
          return ServiceResult<bool>.Failure("Message not found or access denied");
        }

        if (!message.IsRead)
        {
          message.IsRead = true;
          await _context.SaveChangesAsync();
        }

        return ServiceResult<bool>.Success(true);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error marking message {MessageId} as read for user {UserId}", messageId, userId);
        return ServiceResult<bool>.Failure("Error marking message as read");
      }
    }

    public async Task<ServiceResult<bool>> MarkConversationAsReadAsync(int conversationId, int userId)
    {
      try
      {
        var unreadMessages = await _context.Messages
            .Where(m => m.ConversationId == conversationId &&
                      m.ReceiverId == userId && !m.IsRead)
            .ToListAsync();

        foreach (var message in unreadMessages)
        {
          message.IsRead = true;
        }

        if (unreadMessages.Any())
        {
          await _context.SaveChangesAsync();
        }

        return ServiceResult<bool>.Success(true);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error marking conversation {ConversationId} as read for user {UserId}", conversationId, userId);
        return ServiceResult<bool>.Failure("Error marking conversation as read");
      }
    }

    public async Task<ServiceResult<ConversationDto>> GetOrCreateConversationAsync(int user1Id, int user2Id)
    {
      // First try to get existing conversation
      var existingResult = await GetConversationAsync(0, user1Id); // We'll search for it

      var existingConversation = await _context.Conversations
          .FirstOrDefaultAsync(c => (c.User1Id == user1Id && c.User2Id == user2Id) ||
                                  (c.User1Id == user2Id && c.User2Id == user1Id));

      if (existingConversation != null)
      {
        return await GetConversationAsync(existingConversation.Id, user1Id);
      }

      // Create new conversation if it doesn't exist
      return await CreateConversationAsync(user1Id, user2Id);
    }

    private static ConversationDto MapToConversationDto(Conversation conversation, int currentUserId, int unreadCount)
    {
      var otherUser = conversation.User1Id == currentUserId ? conversation.User2 : conversation.User1;

      return new ConversationDto
      {
        Id = conversation.Id,
        User1Id = conversation.User1Id,
        User2Id = conversation.User2Id,
        User1 = MapToUserProfileDto(conversation.User1),
        User2 = MapToUserProfileDto(conversation.User2),
        LastMessage = conversation.Messages?.FirstOrDefault() != null ?
                       MapToMessageDto(conversation.Messages.First()) : null,
        UnreadCount = unreadCount,
        CreatedAt = conversation.CreatedAt,
        UpdatedAt = conversation.UpdatedAt
      };
    }

    private static MessageDto MapToMessageDto(Message message)
    {
      return new MessageDto
      {
        Id = message.Id,
        SenderId = message.SenderId,
        ReceiverId = message.ReceiverId,
        ConversationId = message.ConversationId,
        Content = message.Content,
        IsRead = message.IsRead,
        CreatedAt = message.CreatedAt,
        Sender = message.Sender != null ? MapToUserProfileDto(message.Sender) : null
      };
    }

    private static UserProfileDto MapToUserProfileDto(User user)
    {
      return new UserProfileDto
      {
        Id = user.Id,
        FullName = user.FullName,
        Email = user.Email,
        ProfilePictureUrl = user.ProfilePictureUrl,
        Bio = user.Bio
      };
    }
  }
}
