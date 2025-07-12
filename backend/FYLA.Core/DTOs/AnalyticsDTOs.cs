namespace FYLA.Core.DTOs;

public class ProviderAnalyticsDto
{
  public decimal TotalRevenue { get; set; }
  public int TotalAppointments { get; set; }
  public int CompletedAppointments { get; set; }
  public int CancelledAppointments { get; set; }
  public double AverageRating { get; set; }
  public double CompletionRate { get; set; }
  public double RevenueGrowth { get; set; }
  public string MostRequestedService { get; set; } = string.Empty;
  public string Period { get; set; } = string.Empty;
}

public class EarningsDto
{
  public decimal TotalEarnings { get; set; }
  public decimal PlatformFee { get; set; }
  public decimal AvailableForPayout { get; set; }
  public decimal PendingPayouts { get; set; }
  public List<PayoutDto> PayoutHistory { get; set; } = new();
  public string Period { get; set; } = string.Empty;
}

public class PayoutDto
{
  public int Id { get; set; }
  public decimal Amount { get; set; }
  public string Status { get; set; } = string.Empty;
  public DateTime CreatedAt { get; set; }
  public DateTime? ProcessedAt { get; set; }
  public string PaymentMethod { get; set; } = string.Empty;
}

public class AppointmentMetricsDto
{
  public int TotalToday { get; set; }
  public int TotalThisWeek { get; set; }
  public int TotalUpcoming { get; set; }
  public decimal UpcomingRevenue { get; set; }
  public double CancellationRate { get; set; }
}

public class ClientInsightDto
{
  public int Id { get; set; }
  public string FullName { get; set; } = string.Empty;
  public string Email { get; set; } = string.Empty;
  public string? ProfilePictureUrl { get; set; }
  public int TotalAppointments { get; set; }
  public decimal TotalSpent { get; set; }
  public DateTime LastAppointment { get; set; }
  public double AverageRating { get; set; }
  public string Status { get; set; } = string.Empty;
  public bool IsNew { get; set; }
}

public class BusinessHoursDto
{
  public int DayOfWeek { get; set; }
  public string DayName { get; set; } = string.Empty;
  public bool IsOpen { get; set; }
  public string OpenTime { get; set; } = string.Empty;
  public string CloseTime { get; set; } = string.Empty;
}

public class ServiceManagementDto
{
  public int Id { get; set; }
  public string Name { get; set; } = string.Empty;
  public string? Description { get; set; }
  public decimal Price { get; set; }
  public int DurationMinutes { get; set; }
  public bool IsActive { get; set; }
  public int BookingCount { get; set; }
  public decimal Revenue { get; set; }
  public DateTime CreatedAt { get; set; }
  public DateTime? UpdatedAt { get; set; }
}
