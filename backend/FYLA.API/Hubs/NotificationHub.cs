using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using FYLA.API.Extensions;

namespace FYLA.API.Hubs
{
  [Authorize]
  public class NotificationHub : Hub
  {
    private readonly ILogger<NotificationHub> _logger;

    public NotificationHub(ILogger<NotificationHub> logger)
    {
      _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
      var userId = Context.User?.GetUserId();
      if (userId.HasValue)
      {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"User_{userId.Value}");
        _logger.LogInformation("User {UserId} connected to notifications with connection {ConnectionId}", userId.Value, Context.ConnectionId);
      }
      await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
      var userId = Context.User?.GetUserId();
      if (userId.HasValue)
      {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"User_{userId.Value}");
        _logger.LogInformation("User {UserId} disconnected from notifications", userId.Value);
      }
      await base.OnDisconnectedAsync(exception);
    }

    public async Task JoinUserGroup(int userId)
    {
      await Groups.AddToGroupAsync(Context.ConnectionId, $"User_{userId}");
    }

    public async Task LeaveUserGroup(int userId)
    {
      await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"User_{userId}");
    }
  }
}
