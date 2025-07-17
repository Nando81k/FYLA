using System.ComponentModel.DataAnnotations;

namespace FYLA.Core.Entities
{
  public class TemporaryReservation
  {
    [Key]
    public string Id { get; set; } = string.Empty;

    public int ClientId { get; set; }

    public int ProviderId { get; set; }

    public int ServiceId { get; set; }

    public DateTime RequestedStartTime { get; set; }

    public int Duration { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime ExpiresAt { get; set; }

    public bool IsExpired => DateTime.UtcNow > ExpiresAt;

    // Navigation properties
    public User Client { get; set; } = null!;
    public User Provider { get; set; } = null!;
    public Service Service { get; set; } = null!;
  }
}
