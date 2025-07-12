using Microsoft.EntityFrameworkCore;
using FYLA.Core.Entities;

namespace FYLA.Infrastructure.Data
{
  public class ApplicationDbContext : DbContext
  {
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    // DbSets for all entities
    public DbSet<User> Users { get; set; }
    public DbSet<Service> Services { get; set; }
    public DbSet<Appointment> Appointments { get; set; }
    public DbSet<AppointmentService> AppointmentServices { get; set; }
    public DbSet<Review> Reviews { get; set; }
    public DbSet<Post> Posts { get; set; }
    public DbSet<Story> Stories { get; set; }
    public DbSet<Message> Messages { get; set; }
    public DbSet<Conversation> Conversations { get; set; }
    public DbSet<Favorite> Favorites { get; set; }
    public DbSet<Follower> Followers { get; set; }
    public DbSet<ServiceProviderTag> ServiceProviderTags { get; set; }
    public DbSet<UserServiceProviderTag> UserServiceProviderTags { get; set; }
    public DbSet<BusinessAnalyticsSnapshot> BusinessAnalyticsSnapshots { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
      base.OnModelCreating(modelBuilder);

      // Configure User entity
      modelBuilder.Entity<User>(entity =>
      {
        entity.HasKey(e => e.Id);
        entity.Property(e => e.FullName).IsRequired().HasMaxLength(100);
        entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
        entity.Property(e => e.PhoneNumber).IsRequired().HasMaxLength(20);
        entity.Property(e => e.Role).IsRequired().HasMaxLength(20);
        entity.HasIndex(e => e.Email).IsUnique();
      });

      // Configure Service entity
      modelBuilder.Entity<Service>(entity =>
      {
        entity.HasKey(e => e.Id);
        entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
        entity.Property(e => e.Description).IsRequired().HasMaxLength(500);
        entity.Property(e => e.Price).HasColumnType("decimal(18,2)");

        entity.HasOne(e => e.Provider)
                    .WithMany(e => e.Services)
                    .HasForeignKey(e => e.ProviderId)
                    .OnDelete(DeleteBehavior.Cascade);
      });

      // Configure Appointment entity
      modelBuilder.Entity<Appointment>(entity =>
      {
        entity.HasKey(e => e.Id);
        entity.Property(e => e.TotalPrice).HasColumnType("decimal(18,2)");

        entity.HasOne(e => e.Client)
                    .WithMany(e => e.ClientAppointments)
                    .HasForeignKey(e => e.ClientId)
                    .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.Provider)
                    .WithMany(e => e.ProviderAppointments)
                    .HasForeignKey(e => e.ProviderId)
                    .OnDelete(DeleteBehavior.Restrict);
      });

      // Configure AppointmentService entity
      modelBuilder.Entity<AppointmentService>(entity =>
      {
        entity.HasKey(e => e.Id);
        entity.Property(e => e.PriceAtBooking).HasColumnType("decimal(18,2)");

        entity.HasOne(e => e.Appointment)
                    .WithMany(e => e.Services)
                    .HasForeignKey(e => e.AppointmentId)
                    .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne(e => e.Service)
                    .WithMany(e => e.AppointmentServices)
                    .HasForeignKey(e => e.ServiceId)
                    .OnDelete(DeleteBehavior.Restrict);
      });

      // Configure Review entity
      modelBuilder.Entity<Review>(entity =>
      {
        entity.HasKey(e => e.Id);
        entity.Property(e => e.Rating).IsRequired();
        entity.Property(e => e.Comment).HasMaxLength(1000);

        entity.HasOne(e => e.Appointment)
                    .WithOne(e => e.Review)
                    .HasForeignKey<Review>(e => e.AppointmentId)
                    .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne(e => e.Client)
                    .WithMany(e => e.ClientReviews)
                    .HasForeignKey(e => e.ClientId)
                    .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.Provider)
                    .WithMany(e => e.ProviderReviews)
                    .HasForeignKey(e => e.ProviderId)
                    .OnDelete(DeleteBehavior.Restrict);
      });

      // Configure Message entity
      modelBuilder.Entity<Message>(entity =>
      {
        entity.HasKey(e => e.Id);
        entity.Property(e => e.Content).IsRequired().HasMaxLength(2000);

        entity.HasOne(e => e.Sender)
                    .WithMany(e => e.SentMessages)
                    .HasForeignKey(e => e.SenderId)
                    .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.Receiver)
                    .WithMany(e => e.ReceivedMessages)
                    .HasForeignKey(e => e.ReceiverId)
                    .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.Conversation)
                    .WithMany(e => e.Messages)
                    .HasForeignKey(e => e.ConversationId)
                    .OnDelete(DeleteBehavior.Cascade);
      });

      // Configure Conversation entity
      modelBuilder.Entity<Conversation>(entity =>
      {
        entity.HasKey(e => e.Id);

        entity.HasOne(e => e.User1)
                    .WithMany()
                    .HasForeignKey(e => e.User1Id)
                    .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.User2)
                    .WithMany()
                    .HasForeignKey(e => e.User2Id)
                    .OnDelete(DeleteBehavior.Restrict);
      });

      // Configure Favorite entity
      modelBuilder.Entity<Favorite>(entity =>
      {
        entity.HasKey(e => e.Id);

        entity.HasOne(e => e.Client)
                    .WithMany(e => e.ClientFavorites)
                    .HasForeignKey(e => e.ClientId)
                    .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne(e => e.Provider)
                    .WithMany(e => e.ProviderFavorites)
                    .HasForeignKey(e => e.ProviderId)
                    .OnDelete(DeleteBehavior.Restrict);
      });

      // Configure Follower entity
      modelBuilder.Entity<Follower>(entity =>
      {
        entity.HasKey(e => e.Id);

        entity.HasOne(e => e.FollowerUser)
                    .WithMany(e => e.Following)
                    .HasForeignKey(e => e.FollowerUserId)
                    .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.FollowedUser)
                    .WithMany(e => e.Followers)
                    .HasForeignKey(e => e.FollowedUserId)
                    .OnDelete(DeleteBehavior.Restrict);
      });

      // Configure Post entity
      modelBuilder.Entity<Post>(entity =>
      {
        entity.HasKey(e => e.Id);
        entity.Property(e => e.ImageUrl).IsRequired().HasMaxLength(500);
        entity.Property(e => e.Caption).HasMaxLength(1000);

        entity.HasOne(e => e.Provider)
                    .WithMany(e => e.Posts)
                    .HasForeignKey(e => e.ProviderId)
                    .OnDelete(DeleteBehavior.Cascade);
      });

      // Configure Story entity
      modelBuilder.Entity<Story>(entity =>
      {
        entity.HasKey(e => e.Id);
        entity.Property(e => e.MediaUrl).IsRequired().HasMaxLength(500);

        entity.HasOne(e => e.Provider)
                    .WithMany(e => e.Stories)
                    .HasForeignKey(e => e.ProviderId)
                    .OnDelete(DeleteBehavior.Cascade);
      });

      // Configure UserServiceProviderTag entity
      modelBuilder.Entity<UserServiceProviderTag>(entity =>
      {
        entity.HasKey(e => e.Id);

        entity.HasOne(e => e.User)
                    .WithMany(e => e.UserServiceProviderTags)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne(e => e.ServiceProviderTag)
                    .WithMany(e => e.UserServiceProviderTags)
                    .HasForeignKey(e => e.ServiceProviderTagId)
                    .OnDelete(DeleteBehavior.Restrict);
      });

      // Configure BusinessAnalyticsSnapshot entity
      modelBuilder.Entity<BusinessAnalyticsSnapshot>(entity =>
      {
        entity.HasKey(e => e.Id);
        entity.Property(e => e.TotalRevenue).HasColumnType("decimal(18,2)");
        entity.Property(e => e.Date).IsRequired();

        entity.HasOne(e => e.Provider)
                    .WithMany(e => e.BusinessAnalyticsSnapshots)
                    .HasForeignKey(e => e.ProviderId)
                    .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne(e => e.MostRequestedService)
                    .WithMany(e => e.BusinessAnalyticsSnapshots)
                    .HasForeignKey(e => e.MostRequestedServiceId)
                    .OnDelete(DeleteBehavior.Restrict);
      });
    }
  }
}
