using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FYLA.Core.Entities
{
  public class Message
  {
    [Key]
    public int Id { get; set; }

    [Required]
    public int SenderId { get; set; }

    [Required]
    public int ReceiverId { get; set; }

    [Required]
    public int ConversationId { get; set; }

    [Required]
    [StringLength(1000)]
    public string Content { get; set; } = string.Empty;

    public bool IsRead { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey(nameof(SenderId))]
    public virtual User Sender { get; set; } = null!;

    [ForeignKey(nameof(ReceiverId))]
    public virtual User Receiver { get; set; } = null!;

    [ForeignKey(nameof(ConversationId))]
    public virtual Conversation Conversation { get; set; } = null!;
  }
}
