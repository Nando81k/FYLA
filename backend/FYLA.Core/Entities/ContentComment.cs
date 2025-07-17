using System.ComponentModel.DataAnnotations;

namespace FYLA.Core.Entities
{
  public class ContentComment
  {
    public int Id { get; set; }

    [Required]
    public int ContentPostId { get; set; }
    public ContentPost ContentPost { get; set; } = null!;

    [Required]
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    [Required]
    [StringLength(500)]
    public string Comment { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
  }
}
