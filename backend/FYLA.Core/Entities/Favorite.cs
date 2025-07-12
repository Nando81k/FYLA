using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FYLA.Core.Entities
{
  public class Favorite
  {
    [Key]
    public int Id { get; set; }

    [Required]
    public int ClientId { get; set; }

    [Required]
    public int ProviderId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey(nameof(ClientId))]
    public virtual User Client { get; set; } = null!;

    [ForeignKey(nameof(ProviderId))]
    public virtual User Provider { get; set; } = null!;
  }
}
