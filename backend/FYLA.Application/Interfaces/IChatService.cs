using FYLA.Core.DTOs;

namespace FYLA.Application.Interfaces
{
  public interface IChatService
  {
    Task<ServiceResult<ConversationDto>> GetConversationAsync(int conversationId, int userId);
    Task<ServiceResult<IEnumerable<ConversationDto>>> GetUserConversationsAsync(int userId);
    Task<ServiceResult<ConversationDto>> CreateConversationAsync(int user1Id, int user2Id);
    Task<ServiceResult<MessageDto>> SendMessageAsync(SendMessageRequestDto request, int senderId);
    Task<ServiceResult<IEnumerable<MessageDto>>> GetConversationMessagesAsync(int conversationId, int userId, int page = 1, int pageSize = 50);
    Task<ServiceResult<bool>> MarkMessageAsReadAsync(int messageId, int userId);
    Task<ServiceResult<bool>> MarkConversationAsReadAsync(int conversationId, int userId);
    Task<ServiceResult<ConversationDto>> GetOrCreateConversationAsync(int user1Id, int user2Id);
  }
}
