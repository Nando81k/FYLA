using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;
using FYLA.Application.Interfaces;
using FYLA.Core.DTOs;
using FYLA.Core.Entities;
using FYLA.Infrastructure.Data;

namespace FYLA.Application.Services
{
  public class AuthService : IAuthService
  {
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthService> _logger;

    public AuthService(ApplicationDbContext context, IConfiguration configuration, ILogger<AuthService> logger)
    {
      _context = context;
      _configuration = configuration;
      _logger = logger;
    }

    public async Task<ServiceResult<AuthResponseDto>> LoginAsync(LoginRequestDto request)
    {
      try
      {
        // Find user by email
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

        if (user == null)
        {
          return ServiceResult<AuthResponseDto>.Failure("Invalid email or password");
        }

        // Verify password
        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
          return ServiceResult<AuthResponseDto>.Failure("Invalid email or password");
        }

        // Generate tokens
        var (token, refreshToken) = GenerateTokensAsync(user);

        // Update last login
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var response = new AuthResponseDto
        {
          User = MapToUserDto(user),
          Token = token,
          RefreshToken = refreshToken
        };

        return ServiceResult<AuthResponseDto>.Success(response);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error during login for email: {Email}", request.Email);
        return ServiceResult<AuthResponseDto>.Failure("An error occurred during login");
      }
    }

    public async Task<ServiceResult<AuthResponseDto>> RegisterAsync(RegisterRequestDto request)
    {
      try
      {
        // Check if user already exists
        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

        if (existingUser != null)
        {
          return ServiceResult<AuthResponseDto>.Failure("User with this email already exists");
        }

        // Hash password
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        // Create new user
        var user = new User
        {
          FullName = request.FullName,
          Email = request.Email.ToLower(),
          PhoneNumber = request.PhoneNumber,
          Role = request.Role,
          PasswordHash = passwordHash,
          CreatedAt = DateTime.UtcNow,
          UpdatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Generate tokens
        var (token, refreshToken) = GenerateTokensAsync(user);

        var response = new AuthResponseDto
        {
          User = MapToUserDto(user),
          Token = token,
          RefreshToken = refreshToken
        };

        return ServiceResult<AuthResponseDto>.Success(response);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error during registration for email: {Email}", request.Email);
        return ServiceResult<AuthResponseDto>.Failure("An error occurred during registration");
      }
    }

    public async Task<ServiceResult<AuthResponseDto>> RefreshTokenAsync(string refreshToken)
    {
      try
      {
        var principal = GetPrincipalFromExpiredToken(refreshToken);
        if (principal == null)
        {
          return ServiceResult<AuthResponseDto>.Failure("Invalid token");
        }

        var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
        {
          return ServiceResult<AuthResponseDto>.Failure("Invalid token");
        }

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
          return ServiceResult<AuthResponseDto>.Failure("User not found");
        }

        var (newToken, newRefreshToken) = GenerateTokensAsync(user);

        var response = new AuthResponseDto
        {
          User = MapToUserDto(user),
          Token = newToken,
          RefreshToken = newRefreshToken
        };

        return ServiceResult<AuthResponseDto>.Success(response);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error during token refresh");
        return ServiceResult<AuthResponseDto>.Failure("An error occurred during token refresh");
      }
    }

    public async Task<ServiceResult<UserDto>> ValidateTokenAsync(string token)
    {
      try
      {
        var principal = GetPrincipalFromToken(token);
        if (principal == null)
        {
          return ServiceResult<UserDto>.Failure("Invalid token");
        }

        var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
        {
          return ServiceResult<UserDto>.Failure("Invalid token");
        }

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
          return ServiceResult<UserDto>.Failure("User not found");
        }

        return ServiceResult<UserDto>.Success(MapToUserDto(user));
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error during token validation");
        return ServiceResult<UserDto>.Failure("An error occurred during token validation");
      }
    }

    public async Task<ServiceResult> LogoutAsync(string token)
    {
      try
      {
        // In a real implementation, you might want to blacklist the token
        // For now, we'll just return success
        await Task.CompletedTask;
        return ServiceResult.Success();
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error during logout");
        return ServiceResult.Failure("An error occurred during logout");
      }
    }

    private (string token, string refreshToken) GenerateTokensAsync(User user)
    {
      var tokenHandler = new JwtSecurityTokenHandler();
      var key = Encoding.ASCII.GetBytes(_configuration["JwtSettings:SecretKey"] ?? "your-secret-key-here");

      var tokenDescriptor = new SecurityTokenDescriptor
      {
        Subject = new ClaimsIdentity(new[]
          {
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.Email, user.Email),
                    new Claim(ClaimTypes.Name, user.FullName),
                    new Claim("role", user.Role)
                }),
        Expires = DateTime.UtcNow.AddHours(1),
        SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature),
        Issuer = _configuration["JwtSettings:Issuer"],
        Audience = _configuration["JwtSettings:Audience"]
      };

      var token = tokenHandler.CreateToken(tokenDescriptor);
      var tokenString = tokenHandler.WriteToken(token);

      // Generate refresh token (in production, store this in database)
      var refreshToken = Convert.ToBase64String(Guid.NewGuid().ToByteArray());

      return (tokenString, refreshToken);
    }

    private ClaimsPrincipal? GetPrincipalFromToken(string token)
    {
      var tokenHandler = new JwtSecurityTokenHandler();
      var key = Encoding.ASCII.GetBytes(_configuration["JwtSettings:SecretKey"] ?? "your-secret-key-here");

      try
      {
        var principal = tokenHandler.ValidateToken(token, new TokenValidationParameters
        {
          ValidateIssuerSigningKey = true,
          IssuerSigningKey = new SymmetricSecurityKey(key),
          ValidateIssuer = true,
          ValidIssuer = _configuration["JwtSettings:Issuer"],
          ValidateAudience = true,
          ValidAudience = _configuration["JwtSettings:Audience"],
          ValidateLifetime = true,
          ClockSkew = TimeSpan.Zero
        }, out SecurityToken validatedToken);

        return principal;
      }
      catch
      {
        return null;
      }
    }

    private ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
    {
      var tokenHandler = new JwtSecurityTokenHandler();
      var key = Encoding.ASCII.GetBytes(_configuration["JwtSettings:SecretKey"] ?? "your-secret-key-here");

      try
      {
        var principal = tokenHandler.ValidateToken(token, new TokenValidationParameters
        {
          ValidateIssuerSigningKey = true,
          IssuerSigningKey = new SymmetricSecurityKey(key),
          ValidateIssuer = true,
          ValidIssuer = _configuration["JwtSettings:Issuer"],
          ValidateAudience = true,
          ValidAudience = _configuration["JwtSettings:Audience"],
          ValidateLifetime = false, // Don't validate expiry for refresh
          ClockSkew = TimeSpan.Zero
        }, out SecurityToken validatedToken);

        return principal;
      }
      catch
      {
        return null;
      }
    }

    private static UserDto MapToUserDto(User user)
    {
      return new UserDto
      {
        Id = user.Id,
        FullName = user.FullName,
        Email = user.Email,
        PhoneNumber = user.PhoneNumber,
        Role = user.Role,
        ProfilePictureUrl = user.ProfilePictureUrl,
        Bio = user.Bio,
        LocationLat = user.LocationLat,
        LocationLng = user.LocationLng,
        CreatedAt = user.CreatedAt,
        UpdatedAt = user.UpdatedAt
      };
    }

    public async Task<ServiceResult<UserDto>> GetUserByIdAsync(int userId)
    {
      try
      {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
          return ServiceResult<UserDto>.Failure("User not found");
        }

        return ServiceResult<UserDto>.Success(MapToUserDto(user));
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error getting user by ID: {UserId}", userId);
        return ServiceResult<UserDto>.Failure("An error occurred while retrieving user");
      }
    }

    public async Task<ServiceResult<UserDto>> UpdateProfileAsync(int userId, UpdateProfileRequestDto request)
    {
      try
      {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
          return ServiceResult<UserDto>.Failure("User not found");
        }

        // Update fields if provided
        if (!string.IsNullOrEmpty(request.FullName))
        {
          user.FullName = request.FullName;
        }

        if (!string.IsNullOrEmpty(request.PhoneNumber))
        {
          user.PhoneNumber = request.PhoneNumber;
        }

        if (!string.IsNullOrEmpty(request.Bio))
        {
          user.Bio = request.Bio;
        }

        if (!string.IsNullOrEmpty(request.ProfilePictureUrl))
        {
          user.ProfilePictureUrl = request.ProfilePictureUrl;
        }

        if (request.LocationLat.HasValue)
        {
          user.LocationLat = request.LocationLat.Value;
        }

        if (request.LocationLng.HasValue)
        {
          user.LocationLng = request.LocationLng.Value;
        }

        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return ServiceResult<UserDto>.Success(MapToUserDto(user));
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error updating profile for user: {UserId}", userId);
        return ServiceResult<UserDto>.Failure("An error occurred while updating profile");
      }
    }
  }
}
