using System.ComponentModel.DataAnnotations;

namespace FYLA.Core.DTOs
{
  public class ConversationDto
  {
    public int Id { get; set; }
    public int User1Id { get; set; }
    public int User2Id { get; set; }
    public UserProfileDto? User1 { get; set; }
    public UserProfileDto? User2 { get; set; }
    public MessageDto? LastMessage { get; set; }
    public int UnreadCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
  }

  public class MessageDto
  {
    public int Id { get; set; }
    public int SenderId { get; set; }
    public int ReceiverId { get; set; }
    public int ConversationId { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    public UserProfileDto? Sender { get; set; }
  }

  public class SendMessageRequestDto
  {
    [Required]
    public int ConversationId { get; set; }

    [Required]
    [StringLength(1000, MinimumLength = 1)]
    public string Content { get; set; } = string.Empty;
  }

  public class CreateConversationRequestDto
  {
    [Required]
    public int OtherUserId { get; set; }

    [StringLength(1000)]
    public string? InitialMessage { get; set; }
  }

  public class MarkMessageReadRequestDto
  {
    [Required]
    public int MessageId { get; set; }
  }

  public class GetMessagesRequestDto
  {
    [Required]
    public int ConversationId { get; set; }

    [Range(1, int.MaxValue)]
    public int Page { get; set; } = 1;

    [Range(1, 100)]
    public int PageSize { get; set; } = 50;
  }
}
