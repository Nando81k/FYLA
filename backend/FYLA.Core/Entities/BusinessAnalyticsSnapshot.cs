using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FYLA.Core.Entities
{
  public class BusinessAnalyticsSnapshot
  {
    [Key]
    public int Id { get; set; }

    [Required]
    public int ProviderId { get; set; }

    [Required]
    public DateTime Date { get; set; }

    [Required]
    [Column(TypeName = "decimal(10,2)")]
    public decimal TotalRevenue { get; set; }

    public int? MostRequestedServiceId { get; set; }

    [Required]
    public int TotalAppointments { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey(nameof(ProviderId))]
    public virtual User Provider { get; set; } = null!;

    [ForeignKey(nameof(MostRequestedServiceId))]
    public virtual Service? MostRequestedService { get; set; }
  }
}
