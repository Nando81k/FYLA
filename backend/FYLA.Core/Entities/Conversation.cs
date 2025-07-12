using System.ComponentModel.DataAnnotations;

namespace FYLA.Core.Entities
{
  public class Conversation
  {
    public int Id { get; set; }
    public int User1Id { get; set; }
    public int User2Id { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public User User1 { get; set; } = null!;
    public User User2 { get; set; } = null!;
    public List<Message> Messages { get; set; } = new();
  }
}
