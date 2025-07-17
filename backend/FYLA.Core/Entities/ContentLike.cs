using System.ComponentModel.DataAnnotations;

namespace FYLA.Core.Entities
{
  public class ContentLike
  {
    public int Id { get; set; }

    [Required]
    public int ContentPostId { get; set; }
    public ContentPost ContentPost { get; set; } = null!;

    [Required]
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
  }
}
