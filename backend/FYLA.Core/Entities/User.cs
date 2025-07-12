using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FYLA.Core.Entities;

public class User
{
  [Key]
  public int Id { get; set; }

  [Required]
  [StringLength(20)]
  public string Role { get; set; } = string.Empty;

  [Required]
  [StringLength(255)]
  public string FullName { get; set; } = string.Empty;

  [Required]
  [StringLength(255)]
  [EmailAddress]
  public string Email { get; set; } = string.Empty;

  [Required]
  public string PasswordHash { get; set; } = string.Empty;

  [StringLength(20)]
  public string? PhoneNumber { get; set; }

  public string? ProfilePictureUrl { get; set; }

  public string? Bio { get; set; }

  [Column(TypeName = "float")]
  public double? LocationLat { get; set; }

  [Column(TypeName = "float")]
  public double? LocationLng { get; set; }

  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

  public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

  // Navigation properties
  public virtual ICollection<Service> Services { get; set; } = new List<Service>();
  public virtual ICollection<Post> Posts { get; set; } = new List<Post>();
  public virtual ICollection<Story> Stories { get; set; } = new List<Story>();
  public virtual ICollection<Appointment> ClientAppointments { get; set; } = new List<Appointment>();
  public virtual ICollection<Appointment> ProviderAppointments { get; set; } = new List<Appointment>();
  public virtual ICollection<Review> ClientReviews { get; set; } = new List<Review>();
  public virtual ICollection<Review> ProviderReviews { get; set; } = new List<Review>();
  public virtual ICollection<Favorite> ClientFavorites { get; set; } = new List<Favorite>();
  public virtual ICollection<Favorite> ProviderFavorites { get; set; } = new List<Favorite>();
  public virtual ICollection<Follower> Followers { get; set; } = new List<Follower>();
  public virtual ICollection<Follower> Following { get; set; } = new List<Follower>();
  public virtual ICollection<Message> SentMessages { get; set; } = new List<Message>();
  public virtual ICollection<Message> ReceivedMessages { get; set; } = new List<Message>();
  public virtual ICollection<UserServiceProviderTag> UserServiceProviderTags { get; set; } = new List<UserServiceProviderTag>();
  public virtual ICollection<BusinessAnalyticsSnapshot> BusinessAnalyticsSnapshots { get; set; } = new List<BusinessAnalyticsSnapshot>();
}
