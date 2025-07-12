using System.Security.Claims;

namespace FYLA.API.Extensions
{
  public static class ClaimsPrincipalExtensions
  {
    public static int GetUserId(this ClaimsPrincipal user)
    {
      var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier);
      if (userIdClaim == null)
      {
        throw new UnauthorizedAccessException("User ID not found in token");
      }

      if (!int.TryParse(userIdClaim.Value, out var userId))
      {
        throw new UnauthorizedAccessException("Invalid user ID format");
      }

      return userId;
    }

    public static string GetUserEmail(this ClaimsPrincipal user)
    {
      var emailClaim = user.FindFirst(ClaimTypes.Email);
      if (emailClaim == null)
      {
        throw new UnauthorizedAccessException("User email not found in token");
      }

      return emailClaim.Value;
    }

    public static string GetUserRole(this ClaimsPrincipal user)
    {
      var roleClaim = user.FindFirst(ClaimTypes.Role);
      if (roleClaim == null)
      {
        throw new UnauthorizedAccessException("User role not found in token");
      }

      return roleClaim.Value;
    }
  }
}
