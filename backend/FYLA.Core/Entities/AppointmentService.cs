using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FYLA.Core.Entities
{
  public class AppointmentService
  {
    [Key]
    public int Id { get; set; }

    [Required]
    public int AppointmentId { get; set; }

    [Required]
    public int ServiceId { get; set; }

    [Required]
    [Column(TypeName = "decimal(10,2)")]
    public decimal PriceAtBooking { get; set; }

    // Navigation properties
    [ForeignKey(nameof(AppointmentId))]
    public virtual Appointment Appointment { get; set; } = null!;

    [ForeignKey(nameof(ServiceId))]
    public virtual Service Service { get; set; } = null!;
  }
}
