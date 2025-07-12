using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FYLA.Core.Entities
{
  public class Story
  {
    [Key]
    public int Id { get; set; }

    [Required]
    public int ProviderId { get; set; }

    [Required]
    [StringLength(500)]
    public string MediaUrl { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddHours(24);

    // Navigation properties
    [ForeignKey(nameof(ProviderId))]
    public virtual User Provider { get; set; } = null!;
  }
}
