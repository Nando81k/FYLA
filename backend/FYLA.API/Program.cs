using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using FYLA.Application.Interfaces;
using FYLA.Application.Services;
using FYLA.Core.Interfaces;
using FYLA.Infrastructure.Data;
using FYLA.API.Middleware;
using FYLA.API.Hubs;

var builder = WebApplication.CreateBuilder(args);

// Configure URLs to listen on all interfaces for iOS simulator compatibility
builder.WebHost.ConfigureKestrel(options =>
{
  options.ListenAnyIP(5002); // HTTP (changed from 5000 to avoid conflict with macOS Control Center)
  options.ListenAnyIP(5003, listenOptions =>
  {
    listenOptions.UseHttps(); // HTTPS
  });
});

// Add services to the container.
builder.Services.AddControllers();

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
  c.SwaggerDoc("v1", new OpenApiInfo
  {
    Title = "FYLA API",
    Version = "v1",
    Description = "Find Your Local Artist - API for connecting clients with service providers"
  });

  // Add JWT authentication to Swagger
  c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
  {
    Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
    Name = "Authorization",
    In = ParameterLocation.Header,
    Type = SecuritySchemeType.ApiKey,
    Scheme = "Bearer"
  });

  c.AddSecurityRequirement(new OpenApiSecurityRequirement()
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                },
                Scheme = "oauth2",
                Name = "Bearer",
                In = ParameterLocation.Header,
            },
            new List<string>()
        }
    });
});

// Add Database Context (using SQLite for development)
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection") ??
                     "Data Source=fyla.db",
                     b => b.MigrationsAssembly("FYLA.API")));

// Add JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"] ?? "your-very-long-secret-key-here-at-least-32-characters";

builder.Services.AddAuthentication(options =>
{
  options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
  options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
  options.TokenValidationParameters = new TokenValidationParameters
  {
    ValidateIssuer = true,
    ValidateAudience = true,
    ValidateLifetime = true,
    ValidateIssuerSigningKey = true,
    ValidIssuer = jwtSettings["Issuer"] ?? "FYLAApp",
    ValidAudience = jwtSettings["Audience"] ?? "FYLAUsers",
    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
    ClockSkew = TimeSpan.Zero
  };

  // Allow SignalR to use tokens from query string
  options.Events = new JwtBearerEvents
  {
    OnMessageReceived = context =>
    {
      var accessToken = context.Request.Query["access_token"];
      var path = context.HttpContext.Request.Path;

      if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/chathub"))
      {
        context.Token = accessToken;
      }

      return Task.CompletedTask;
    }
  };
});

builder.Services.AddAuthorization();

// Add CORS
builder.Services.AddCors(options =>
{
  options.AddPolicy("AllowReactNative", policy =>
  {
    policy.WithOrigins(
            "http://localhost:8081",
            "http://localhost:19000",
            "http://10.0.12.121:8081",
            "exp://10.0.12.121:8081",
            "exp://192.168.1.100:8081",
            "http://192.168.1.185:8081",
            "exp://192.168.1.185:8081",
            "http://192.168.1.201:8081",
            "exp://192.168.1.201:8081"
          )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials(); // Required for SignalR
  });
});

// Add SignalR
builder.Services.AddSignalR();

// Register application services
builder.Services.AddScoped<IAuthService, FYLA.Application.Services.AuthService>();
builder.Services.AddScoped<IAppointmentService, FYLA.Application.Services.AppointmentService>();
builder.Services.AddScoped<IChatService, FYLA.Application.Services.ChatService>();
builder.Services.AddScoped<ISocialService, FYLA.Application.Services.SocialService>();
builder.Services.AddScoped<IServiceManagementService, FYLA.Application.Services.ServiceManagementService>();
builder.Services.AddScoped<IContentService, FYLA.Application.Services.ContentService>();
builder.Services.AddScoped<IAvailabilityService, FYLA.Application.Services.AvailabilityService>();
// TODO: Add IReviewService registration after fixing interface
builder.Services.AddScoped<FYLA.Infrastructure.Services.DatabaseSeeder>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
  app.UseSwagger();
  app.UseSwaggerUI(c =>
  {
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "FYLA API V1");
    c.RoutePrefix = string.Empty; // Set Swagger UI at the app's root
  });
}

// Add exception handling middleware
app.UseMiddleware<ExceptionHandlingMiddleware>();

// Only redirect to HTTPS in production
if (!app.Environment.IsDevelopment())
{
  app.UseHttpsRedirection();
}

app.UseCors("AllowReactNative");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Map SignalR Hubs
app.MapHub<ChatHub>("/chathub");
app.MapHub<NotificationHub>("/notifications");

// Health check endpoint
app.MapGet("/health", () => new { status = "healthy", timestamp = DateTime.UtcNow });

// Seed database in development
if (app.Environment.IsDevelopment())
{
  using var scope = app.Services.CreateScope();
  var seeder = scope.ServiceProvider.GetRequiredService<FYLA.Infrastructure.Services.DatabaseSeeder>();
  await seeder.SeedAsync();
}

app.Run();
