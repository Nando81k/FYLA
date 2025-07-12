using FYLA.Core.DTOs;

namespace FYLA.Application.Interfaces;

public interface IAuthService
{
  Task<ServiceResult<AuthResponseDto>> RegisterAsync(RegisterRequestDto request);
  Task<ServiceResult<AuthResponseDto>> LoginAsync(LoginRequestDto request);
  Task<ServiceResult<AuthResponseDto>> RefreshTokenAsync(string refreshToken);
  Task<ServiceResult> LogoutAsync(string token);
  Task<ServiceResult<UserDto>> GetUserByIdAsync(int userId);
  Task<ServiceResult<UserDto>> UpdateProfileAsync(int userId, UpdateProfileRequestDto request);
}
