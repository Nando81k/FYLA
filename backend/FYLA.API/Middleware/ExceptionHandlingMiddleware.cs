using System.Net;
using System.Text.Json;
using FYLA.Core.DTOs;

namespace FYLA.API.Middleware;

public class ExceptionHandlingMiddleware
{
  private readonly RequestDelegate _next;
  private readonly ILogger<ExceptionHandlingMiddleware> _logger;

  public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
  {
    _next = next;
    _logger = logger;
  }

  public async Task InvokeAsync(HttpContext context)
  {
    try
    {
      await _next(context);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "An unhandled exception occurred: {Message}", ex.Message);
      await HandleExceptionAsync(context, ex);
    }
  }

  private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
  {
    context.Response.ContentType = "application/json";

    var response = new ServiceResult<object>
    {
      IsSuccess = false,
      Data = null
    };

    switch (exception)
    {
      case ArgumentException argEx:
        context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
        response.ErrorMessage = argEx.Message;
        break;

      case UnauthorizedAccessException:
        context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
        response.ErrorMessage = "Unauthorized access";
        break;

      case KeyNotFoundException:
        context.Response.StatusCode = (int)HttpStatusCode.NotFound;
        response.ErrorMessage = "Resource not found";
        break;

      case InvalidOperationException invOpEx:
        context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
        response.ErrorMessage = invOpEx.Message;
        break;

      default:
        context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
        response.ErrorMessage = "An unexpected error occurred";
        break;
    }

    var jsonResponse = JsonSerializer.Serialize(response, new JsonSerializerOptions
    {
      PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    });

    await context.Response.WriteAsync(jsonResponse);
  }
}
