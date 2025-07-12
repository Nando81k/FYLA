using FYLA.Core.Entities;
using FYLA.Core.Enums;
using FYLA.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using BCrypt.Net;

namespace FYLA.Infrastructure.Services;

public class DatabaseSeeder
{
  private readonly ApplicationDbContext _context;
  private readonly ILogger<DatabaseSeeder> _logger;

  public DatabaseSeeder(ApplicationDbContext context, ILogger<DatabaseSeeder> logger)
  {
    _context = context;
    _logger = logger;
  }

  public async Task SeedAsync()
  {
    try
    {
      _logger.LogInformation("Starting database seeding...");

      // Apply pending migrations
      var pendingMigrations = await _context.Database.GetPendingMigrationsAsync();
      if (pendingMigrations.Any())
      {
        _logger.LogInformation($"Applying {pendingMigrations.Count()} pending migrations...");
        await _context.Database.MigrateAsync();
        _logger.LogInformation("Database migrations applied successfully.");
      }
      else
      {
        _logger.LogInformation("No pending migrations found.");
      }

      // Check if database is already seeded
      var usersExist = false;
      try
      {
        usersExist = await _context.Users.AnyAsync();
      }
      catch (Exception ex)
      {
        _logger.LogWarning(ex, "Could not check if users exist, proceeding with seeding...");
      }

      if (usersExist)
      {
        _logger.LogInformation("Database already contains data. Skipping seeding.");
        return;
      }

      await SeedServiceProviderTagsAsync();
      await _context.SaveChangesAsync(); // Save tags first

      await SeedUsersAsync();
      await _context.SaveChangesAsync(); // Save users so they get IDs

      await SeedServicesAsync();
      await _context.SaveChangesAsync(); // Save services so they get IDs

      await SeedAppointmentsAsync();
      await SeedReviewsAsync();
      await _context.SaveChangesAsync(); // Save appointments and reviews

      _logger.LogInformation("Database seeding completed successfully.");
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "An error occurred while seeding the database.");
      throw;
    }
  }

  private Task SeedServiceProviderTagsAsync()
  {
    var tags = new[]
    {
            "Hair Stylist",
            "Makeup Artist",
            "Nail Technician",
            "Barber",
            "Esthetician",
            "Massage Therapist",
            "Personal Trainer",
            "Photographer",
            "Event Planner",
            "Tutor",
            "Music Teacher",
            "Art Teacher",
            "Dance Instructor",
            "Life Coach",
            "Nutritionist"
        };

    foreach (var tagName in tags)
    {
      _context.ServiceProviderTags.Add(new ServiceProviderTag
      {
        Name = tagName
      });
    }

    _logger.LogInformation("Seeded {Count} service provider tags", tags.Length);
    return Task.CompletedTask;
  }

  private Task SeedUsersAsync()
  {
    var users = new[]
    {
            // Test user for Developer Settings (matches DeveloperSettingsScreen expectations)
            new User
            {
                Role = "Client",
                FullName = "John Doe",
                Email = "john.doe@example.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!"),
                PhoneNumber = "+1234567890",
                Bio = "Test user for development and API testing",
                LocationLat = 37.7749,
                LocationLng = -122.4194,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            
            // Additional Clients with proper registration data
            new User
            {
                Role = "Client",
                FullName = "Sarah Johnson",
                Email = "sarah.johnson@example.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("ClientPass123!"),
                PhoneNumber = "+1555-0101",
                Bio = "Love trying new beauty treatments and discovering local artists",
                LocationLat = 37.7849,
                LocationLng = -122.4094,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new User
            {
                Role = "Client",
                FullName = "Michael Chen",
                Email = "michael.chen@example.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("ClientPass123!"),
                PhoneNumber = "+1555-0102",
                Bio = "Always looking for the best grooming services in the city",
                LocationLat = 37.7949,
                LocationLng = -122.3994,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new User
            {
                Role = "Client",
                FullName = "Emily Rodriguez",
                Email = "emily.rodriguez@example.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("ClientPass123!"),
                PhoneNumber = "+1555-0103",
                Bio = "Beauty enthusiast and frequent spa visitor",
                LocationLat = 37.8049,
                LocationLng = -122.3894,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            
            // Service Providers with comprehensive profiles
            new User
            {
                Role = "ServiceProvider",
                FullName = "Maria Garcia",
                Email = "maria.garcia@example.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("ProviderPass123!"),
                PhoneNumber = "+1555-0201",
                Bio = "Professional hair stylist with 10+ years of experience. Specializing in color, cuts, and styling for all hair types. Licensed cosmetologist.",
                LocationLat = 37.7649,
                LocationLng = -122.4294,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new User
            {
                Role = "ServiceProvider",
                FullName = "Alex Thompson",
                Email = "alex.thompson@example.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("ProviderPass123!"),
                PhoneNumber = "+1555-0202",
                Bio = "Certified makeup artist specializing in bridal, special events, and photoshoots. Available for on-location services.",
                LocationLat = 37.7549,
                LocationLng = -122.4394,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new User
            {
                Role = "ServiceProvider",
                FullName = "Lisa Rodriguez",
                Email = "lisa.rodriguez@example.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("ProviderPass123!"),
                PhoneNumber = "+1555-0203",
                Bio = "Licensed nail technician offering manicures, pedicures, gel nails, and creative nail art. Hygiene and quality are my priorities.",
                LocationLat = 37.7449,
                LocationLng = -122.4494,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new User
            {
                Role = "ServiceProvider",
                FullName = "David Kim",
                Email = "david.kim@example.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("ProviderPass123!"),
                PhoneNumber = "+1555-0204",
                Bio = "Professional barber specializing in classic cuts, beard trimming, and men's grooming. Walk-ins welcome.",
                LocationLat = 37.7349,
                LocationLng = -122.4594,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new User
            {
                Role = "ServiceProvider",
                FullName = "Jessica Taylor",
                Email = "jessica.taylor@example.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("ProviderPass123!"),
                PhoneNumber = "+1555-0205",
                Bio = "Licensed esthetician offering facials, chemical peels, and skincare consultations. Helping you achieve your best skin.",
                LocationLat = 37.7249,
                LocationLng = -122.4694,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };

    _context.Users.AddRange(users);
    _logger.LogInformation("Seeded {Count} users", users.Length);
    return Task.CompletedTask;
  }

  private async Task SeedServicesAsync()
  {
    // Get service providers (users with Role = "ServiceProvider")
    var providers = await _context.Users
        .Where(u => u.Role == "ServiceProvider")
        .ToListAsync();

    if (!providers.Any())
    {
      _logger.LogWarning("No service providers found for seeding services");
      return;
    }

    var services = new List<Service>();

    // Maria Garcia (Hair Stylist) services
    var maria = providers.FirstOrDefault(p => p.FullName == "Maria Garcia");
    if (maria != null)
    {
      services.AddRange(new[]
      {
                new Service
                {
                    ProviderId = maria.Id,
                    Name = "Women's Haircut & Style",
                    Description = "Professional haircut and styling for women. Includes wash, cut, and blow dry.",
                    Price = 75.00m,
                    EstimatedDurationMinutes = 90,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Service
                {
                    ProviderId = maria.Id,
                    Name = "Hair Color & Highlights",
                    Description = "Full color service or highlights. Includes consultation, application, and styling.",
                    Price = 150.00m,
                    EstimatedDurationMinutes = 180,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Service
                {
                    ProviderId = maria.Id,
                    Name = "Men's Haircut",
                    Description = "Classic men's haircut with wash and style.",
                    Price = 45.00m,
                    EstimatedDurationMinutes = 45,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                }
            });
    }

    // Alex Chen (Makeup Artist) services
    var alex = providers.FirstOrDefault(p => p.FullName == "Alex Chen");
    if (alex != null)
    {
      services.AddRange(new[]
      {
                new Service
                {
                    ProviderId = alex.Id,
                    Name = "Bridal Makeup",
                    Description = "Complete bridal makeup service including trial session and wedding day application.",
                    Price = 200.00m,
                    EstimatedDurationMinutes = 120,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Service
                {
                    ProviderId = alex.Id,
                    Name = "Special Event Makeup",
                    Description = "Professional makeup for special events, photoshoots, or parties.",
                    Price = 80.00m,
                    EstimatedDurationMinutes = 60,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Service
                {
                    ProviderId = alex.Id,
                    Name = "Makeup Lesson",
                    Description = "Personal makeup lesson to learn techniques and product recommendations.",
                    Price = 120.00m,
                    EstimatedDurationMinutes = 90,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                }
            });
    }

    // Lisa Rodriguez (Nail Technician) services
    var lisa = providers.FirstOrDefault(p => p.FullName == "Lisa Rodriguez");
    if (lisa != null)
    {
      services.AddRange(new[]
      {
                new Service
                {
                    ProviderId = lisa.Id,
                    Name = "Classic Manicure",
                    Description = "Traditional manicure with nail shaping, cuticle care, and polish application.",
                    Price = 35.00m,
                    EstimatedDurationMinutes = 45,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Service
                {
                    ProviderId = lisa.Id,
                    Name = "Gel Manicure",
                    Description = "Long-lasting gel manicure with UV curing for extended wear.",
                    Price = 50.00m,
                    EstimatedDurationMinutes = 60,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Service
                {
                    ProviderId = lisa.Id,
                    Name = "Pedicure",
                    Description = "Relaxing pedicure with foot soak, exfoliation, and polish application.",
                    Price = 45.00m,
                    EstimatedDurationMinutes = 60,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                }
            });
    }

    _context.Services.AddRange(services);
    _logger.LogInformation("Seeded {Count} services", services.Count);
  }

  private async Task SeedAppointmentsAsync()
  {
    var clients = await _context.Users
        .Where(u => u.Role == "Client")
        .ToListAsync();

    var services = await _context.Services
        .Include(s => s.Provider)
        .ToListAsync();

    if (!clients.Any() || !services.Any())
    {
      _logger.LogWarning("No clients or services found for seeding appointments");
      return;
    }

    var appointments = new List<Appointment>();
    var random = new Random();

    // Create some sample appointments
    foreach (var client in clients.Take(2))
    {
      foreach (var service in services.Take(3))
      {
        var startTime = DateTime.UtcNow.AddDays(random.Next(1, 30)).AddHours(random.Next(9, 17));
        var endTime = startTime.AddMinutes(service.EstimatedDurationMinutes);

        var appointment = new Appointment
        {
          ClientId = client.Id,
          ProviderId = service.ProviderId,
          ScheduledStartTime = startTime,
          ScheduledEndTime = endTime,
          Status = (AppointmentStatus)random.Next(0, 4), // Random status
          TotalPrice = service.Price,
          Notes = $"Appointment for {service.Name}",
          CreatedAt = DateTime.UtcNow,
          UpdatedAt = DateTime.UtcNow
        };

        appointments.Add(appointment);
      }
    }

    _context.Appointments.AddRange(appointments);
    _logger.LogInformation("Seeded {Count} appointments", appointments.Count);
  }

  private async Task SeedReviewsAsync()
  {
    var completedAppointments = await _context.Appointments
        .Where(a => a.Status == AppointmentStatus.Completed)
        .Include(a => a.Client)
        .Include(a => a.Provider)
        .ToListAsync();

    if (!completedAppointments.Any())
    {
      _logger.LogWarning("No completed appointments found for seeding reviews");
      return;
    }

    var reviews = new List<Review>();
    var random = new Random();
    var comments = new[]
    {
            "Excellent service! Very professional and skilled.",
            "Great experience, will definitely book again.",
            "Amazing results, exceeded my expectations!",
            "Professional and friendly service.",
            "Good quality work, reasonable prices.",
            "Very satisfied with the service provided.",
            "Outstanding attention to detail.",
            "Highly recommend this service provider!"
        };

    foreach (var appointment in completedAppointments.Take(5))
    {
      var review = new Review
      {
        AppointmentId = appointment.Id,
        ClientId = appointment.ClientId,
        ProviderId = appointment.ProviderId,
        Rating = random.Next(4, 6), // Ratings between 4-5 stars
        Comment = comments[random.Next(comments.Length)],
        CreatedAt = appointment.ScheduledEndTime.AddDays(random.Next(1, 7))
      };

      reviews.Add(review);
    }

    _context.Reviews.AddRange(reviews);
    _logger.LogInformation("Seeded {Count} reviews", reviews.Count);
  }
}
