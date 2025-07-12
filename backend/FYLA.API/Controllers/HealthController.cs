using Microsoft.AspNetCore.Mvc;

namespace FYLA.API.Controllers
{
  [ApiController]
  [Route("api/[controller]")]
  public class HealthController : ControllerBase
  {
    [HttpGet]
    public ActionResult<object> GetHealth()
    {
      return Ok(new
      {
        status = "healthy",
        timestamp = DateTime.UtcNow,
        version = "1.0.0",
        environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development"
      });
    }

    [HttpGet("appointments")]
    public ActionResult<object> GetAppointmentServiceHealth()
    {
      return Ok(new
      {
        service = "appointments",
        status = "healthy",
        timestamp = DateTime.UtcNow
      });
    }

    [HttpGet("auth")]
    public ActionResult<object> GetAuthServiceHealth()
    {
      return Ok(new
      {
        service = "auth",
        status = "healthy",
        timestamp = DateTime.UtcNow
      });
    }
  }
}
