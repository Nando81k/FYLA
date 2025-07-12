using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FYLA.Application.Interfaces;
using FYLA.Core.DTOs;
using FYLA.API.Middleware;
using System.ComponentModel.DataAnnotations;

namespace FYLA.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
  private readonly IAuthService _authService;
  private readonly ILogger<AuthController> _logger;

  public AuthController(IAuthService authService, ILogger<AuthController> logger)
  {
    _authService = authService;
    _logger = logger;
  }

  [HttpPost("register")]
  public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterRequestDto request)
  {
    try
    {
      if (!ModelState.IsValid)
        return BadRequest(ModelState);

      var result = await _authService.RegisterAsync(request);

      if (!result.IsSuccess)
        return BadRequest(new { message = result.ErrorMessage });

      return Ok(result.Data);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error during user registration");
      return StatusCode(500, new { message = "An error occurred during registration" });
    }
  }

  [HttpPost("login")]
  public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginRequestDto request)
  {
    try
    {
      if (!ModelState.IsValid)
        return BadRequest(ModelState);

      var result = await _authService.LoginAsync(request);

      if (!result.IsSuccess)
        return Unauthorized(new { message = result.ErrorMessage });

      return Ok(result.Data);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error during user login");
      return StatusCode(500, new { message = "An error occurred during login" });
    }
  }

  [HttpPost("refresh-token")]
  public async Task<ActionResult<AuthResponseDto>> RefreshToken([FromBody] RefreshTokenRequestDto request)
  {
    try
    {
      if (!ModelState.IsValid)
        return BadRequest(ModelState);

      var result = await _authService.RefreshTokenAsync(request.Token);

      if (!result.IsSuccess)
        return Unauthorized(new { message = result.ErrorMessage });

      return Ok(result.Data);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error during token refresh");
      return StatusCode(500, new { message = "An error occurred during token refresh" });
    }
  }

  [HttpPost("logout")]
  [Authorize]
  public async Task<ActionResult> Logout()
  {
    try
    {
      // Get token from header
      var authHeader = HttpContext.Request.Headers["Authorization"].FirstOrDefault();
      if (authHeader != null && authHeader.StartsWith("Bearer "))
      {
        var token = authHeader.Substring("Bearer ".Length).Trim();
        await _authService.LogoutAsync(token);
      }

      return Ok(new { message = "Logout successful" });
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error during logout");
      return StatusCode(500, new { message = "An error occurred during logout" });
    }
  }

  [HttpGet("validate")]
  [Authorize]
  public async Task<ActionResult<UserDto>> ValidateToken()
  {
    try
    {
      var userId = User.GetUserId();
      var result = await _authService.GetUserByIdAsync(userId);

      if (!result.IsSuccess)
        return Unauthorized(new { message = "Invalid token" });

      return Ok(result.Data);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error during token validation");
      return StatusCode(500, new { message = "An error occurred during token validation" });
    }
  }
}
