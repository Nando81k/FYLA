using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Security.Claims;

namespace FYLA.API.Middleware;

public class JwtAuthorizationAttribute : Attribute, IAuthorizationFilter
{
  private readonly string[] _roles;

  public JwtAuthorizationAttribute(params string[] roles)
  {
    _roles = roles;
  }

  public void OnAuthorization(AuthorizationFilterContext context)
  {
    // Skip authorization if action has [AllowAnonymous]
    if (context.ActionDescriptor.EndpointMetadata.OfType<AllowAnonymousAttribute>().Any())
    {
      return;
    }

    var user = context.HttpContext.User;

    // Check if user is authenticated
    if (!user.Identity?.IsAuthenticated ?? true)
    {
      context.Result = new UnauthorizedResult();
      return;
    }

    // Check if specific roles are required
    if (_roles?.Any() == true)
    {
      var userRole = user.FindFirst(ClaimTypes.Role)?.Value;
      if (string.IsNullOrEmpty(userRole) || !_roles.Contains(userRole))
      {
        context.Result = new ForbidResult();
        return;
      }
    }
  }
}

public static class ClaimsPrincipalExtensions
{
  public static int GetUserId(this ClaimsPrincipal user)
  {
    var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    return int.TryParse(userIdClaim, out var userId) ? userId : 0;
  }

  public static string GetUserRole(this ClaimsPrincipal user)
  {
    return user.FindFirst(ClaimTypes.Role)?.Value ?? string.Empty;
  }

  public static string GetUserEmail(this ClaimsPrincipal user)
  {
    return user.FindFirst(ClaimTypes.Email)?.Value ?? string.Empty;
  }
}
