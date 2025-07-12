using System.ComponentModel.DataAnnotations;

namespace FYLA.Core.DTOs;

public class RegisterRequestDto
{
  [Required]
  [StringLength(100)]
  public string FullName { get; set; } = string.Empty;

  [Required]
  [EmailAddress]
  public string Email { get; set; } = string.Empty;

  [Required]
  [StringLength(100, MinimumLength = 6)]
  public string Password { get; set; } = string.Empty;

  [Required]
  [Compare("Password")]
  public string ConfirmPassword { get; set; } = string.Empty;

  [Required]
  [Phone]
  public string PhoneNumber { get; set; } = string.Empty;

  [Required]
  public string Role { get; set; } = string.Empty;
}

public class LoginRequestDto
{
  [Required]
  [EmailAddress]
  public string Email { get; set; } = string.Empty;

  [Required]
  public string Password { get; set; } = string.Empty;
}

public class RefreshTokenRequestDto
{
  [Required]
  public string Token { get; set; } = string.Empty;
}

public class AuthResponseDto
{
  public UserDto User { get; set; } = new();
  public string Token { get; set; } = string.Empty;
  public string RefreshToken { get; set; } = string.Empty;
}

public class UserDto
{
  public int Id { get; set; }
  public string Role { get; set; } = string.Empty;
  public string FullName { get; set; } = string.Empty;
  public string Email { get; set; } = string.Empty;
  public string? PhoneNumber { get; set; }
  public string? ProfilePictureUrl { get; set; }
  public string? Bio { get; set; }
  public double? LocationLat { get; set; }
  public double? LocationLng { get; set; }
  public DateTime CreatedAt { get; set; }
  public DateTime UpdatedAt { get; set; }
}

public class UpdateProfileRequestDto
{
  [StringLength(100)]
  public string? FullName { get; set; }

  [Phone]
  public string? PhoneNumber { get; set; }

  [StringLength(500)]
  public string? Bio { get; set; }

  public string? ProfilePictureUrl { get; set; }

  public double? LocationLat { get; set; }

  public double? LocationLng { get; set; }
}
