using System.ComponentModel.DataAnnotations;

namespace FYLA.Core.DTOs
{
  public class ServiceDto
  {
    public int Id { get; set; }
    public int ProviderId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int EstimatedDurationMinutes { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
  }

  public class CreateServiceRequestDto
  {
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [StringLength(500)]
    public string Description { get; set; } = string.Empty;

    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Price must be greater than 0")]
    public decimal Price { get; set; }

    [Required]
    [Range(1, 480, ErrorMessage = "Duration must be between 1 and 480 minutes")]
    public int EstimatedDurationMinutes { get; set; }

    public bool IsActive { get; set; } = true;
  }

  public class UpdateServiceRequestDto
  {
    [StringLength(100)]
    public string? Name { get; set; }

    [StringLength(500)]
    public string? Description { get; set; }

    [Range(0.01, double.MaxValue, ErrorMessage = "Price must be greater than 0")]
    public decimal? Price { get; set; }

    [Range(1, 480, ErrorMessage = "Duration must be between 1 and 480 minutes")]
    public int? EstimatedDurationMinutes { get; set; }

    public bool? IsActive { get; set; }
  }

  public class UserProfileDto
  {
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? ProfilePictureUrl { get; set; }
    public string? Bio { get; set; }
  }
}
