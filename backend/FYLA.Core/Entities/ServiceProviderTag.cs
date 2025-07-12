using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FYLA.Core.Entities
{
  public class UserServiceProviderTag
  {
    [Key]
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required]
    public int ServiceProviderTagId { get; set; }

    // Navigation properties
    [ForeignKey(nameof(UserId))]
    public virtual User User { get; set; } = null!;

    [ForeignKey(nameof(ServiceProviderTagId))]
    public virtual ServiceProviderTag ServiceProviderTag { get; set; } = null!;
  }

  public class ServiceProviderTag
  {
    [Key]
    public int Id { get; set; }

    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    public virtual ICollection<UserServiceProviderTag> UserServiceProviderTags { get; set; } = new List<UserServiceProviderTag>();
  }
}
