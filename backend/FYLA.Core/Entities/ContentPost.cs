using System.ComponentModel.DataAnnotations;
using FYLA.Core.Enums;

namespace FYLA.Core.Entities
{
  public class ContentPost
  {
    public int Id { get; set; }

    [Required]
    public int ProviderId { get; set; }
    public User Provider { get; set; } = null!;

    [Required]
    [StringLength(1000)]
    public string Content { get; set; } = string.Empty;

    [StringLength(500)]
    public string? ImageUrl { get; set; }

    public ContentPostType Type { get; set; } = ContentPostType.Update;

    public bool IsActive { get; set; } = true;
    public bool IsFeatured { get; set; } = false;

    // Promotion-specific fields
    public string? PromotionTitle { get; set; }
    public decimal? DiscountPercentage { get; set; }
    public decimal? DiscountAmount { get; set; }
    public DateTime? PromotionStartDate { get; set; }
    public DateTime? PromotionEndDate { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public virtual ICollection<Service> Services { get; set; } = new List<Service>();
    public virtual ICollection<ContentLike> Likes { get; set; } = new List<ContentLike>();
    public virtual ICollection<ContentComment> Comments { get; set; } = new List<ContentComment>();
  }
}
