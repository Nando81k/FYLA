using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FYLA.Core.Entities
{
  public class Follower
  {
    [Key]
    public int Id { get; set; }

    [Required]
    public int FollowerUserId { get; set; }

    [Required]
    public int FollowedUserId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey(nameof(FollowerUserId))]
    public virtual User FollowerUser { get; set; } = null!;

    [ForeignKey(nameof(FollowedUserId))]
    public virtual User FollowedUser { get; set; } = null!;
  }
}
