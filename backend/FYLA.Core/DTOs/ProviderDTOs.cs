namespace FYLA.Core.DTOs;

public class ProviderProfile
{
  public int Id { get; set; }
  public string FullName { get; set; } = string.Empty;
  public string Email { get; set; } = string.Empty;
  public string PhoneNumber { get; set; } = string.Empty;
  public string? ProfilePictureUrl { get; set; }
  public string? Bio { get; set; }
  public double LocationLat { get; set; }
  public double LocationLng { get; set; }
  public double AverageRating { get; set; }
  public int TotalReviews { get; set; }
  public double Distance { get; set; }
  public bool IsOnline { get; set; }
  public List<ServiceProviderTag> Tags { get; set; } = new();
  public List<Service> Services { get; set; } = new();
  public List<BusinessHour> BusinessHours { get; set; } = new();
  public string CreatedAt { get; set; } = string.Empty;
}

public class ServiceProviderTag
{
  public int Id { get; set; }
  public string Name { get; set; } = string.Empty;
}

public class Service
{
  public int Id { get; set; }
  public int ProviderId { get; set; }
  public string Name { get; set; } = string.Empty;
  public string Description { get; set; } = string.Empty;
  public decimal Price { get; set; }
  public int EstimatedDurationMinutes { get; set; }
  public bool IsActive { get; set; }
  public string CreatedAt { get; set; } = string.Empty;
}

public class BusinessHour
{
  public int Id { get; set; }
  public int ProviderId { get; set; }
  public int DayOfWeek { get; set; }
  public string StartTime { get; set; } = string.Empty;
  public string EndTime { get; set; } = string.Empty;
  public bool IsOpen { get; set; }
}

public class ProviderSearchRequest
{
  public string? Query { get; set; }
  public List<int>? Tags { get; set; }
  public double? Latitude { get; set; }
  public double? Longitude { get; set; }
  public double? Radius { get; set; }
  public double? MinRating { get; set; }
  public string? SortBy { get; set; }
  public int Page { get; set; } = 1;
  public int Limit { get; set; } = 20;
}

public class ProviderSearchResponse
{
  public List<ProviderProfile> Providers { get; set; } = new();
  public int Total { get; set; }
  public int Page { get; set; }
  public int TotalPages { get; set; }
}
