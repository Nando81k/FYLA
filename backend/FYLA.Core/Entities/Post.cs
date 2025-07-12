using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FYLA.Core.Entities
{
  public class Post
  {
    [Key]
    public int Id { get; set; }

    [Required]
    public int ProviderId { get; set; }

    [Required]
    [StringLength(500)]
    public string ImageUrl { get; set; } = string.Empty;

    [Required]
    [StringLength(1000)]
    public string Caption { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey(nameof(ProviderId))]
    public virtual User Provider { get; set; } = null!;
  }
}
