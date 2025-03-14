using Microsoft.EntityFrameworkCore;
using backend.Models;
using Microsoft.Extensions.Logging;
using System;
using System.Threading;
using System.Threading.Tasks;
using System.Linq;

namespace backend.Data;

public class AppDbContext : DbContext
{
    private readonly ILogger<AppDbContext> _logger;

    public AppDbContext(DbContextOptions<AppDbContext> options, ILogger<AppDbContext> logger) 
        : base(options) 
    {
        _logger = logger;
    }

    public DbSet<User> Users { get; set; } = null!;
    public DbSet<Note> Notes { get; set; } = null!;
    public DbSet<Folder> Folders { get; set; } = null!;
    public DbSet<UserTask> Tasks { get; set; } = null!;
    public DbSet<FolderItem> FolderItems { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User indexes
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.Username);
        });

        // Task indexes
        modelBuilder.Entity<UserTask>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FolderId).IsRequired(false);
            entity.HasIndex(e => e.AssigneeId); // Changed from UserId to AssigneeId
            entity.HasIndex(e => e.Deadline);
            entity.HasIndex(e => e.FolderId);
            entity.HasIndex(e => new { e.AssigneeId, e.IsCompleted }); // Changed from UserId to AssigneeId
            entity.HasIndex(e => e.Priority); // Add index for Priority
            entity.HasIndex(e => e.Status); // Add index for Status
        });

        // Note indexes
        modelBuilder.Entity<Note>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FolderId).IsRequired(false);
            entity.HasOne<Folder>()
                .WithMany(f => f.Notes)
                .HasForeignKey(n => n.FolderId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.FolderId);
            entity.HasIndex(e => e.CreatedAt);
        });

        // Folder indexes
        modelBuilder.Entity<Folder>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired();
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasMany(e => e.Notes)
                .WithOne()
                .HasForeignKey(n => n.FolderId);
                
            entity.HasIndex(e => e.UserId);
            
            entity.HasOne(f => f.ParentFolder)
                .WithMany(f => f.SubFolders)
                .HasForeignKey(f => f.ParentFolderId)
                .OnDelete(DeleteBehavior.Restrict);
                
            entity.HasIndex(e => e.ParentFolderId);
        });

        // FolderItem configuration
        modelBuilder.Entity<FolderItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Folder)
                  .WithMany()
                  .HasForeignKey(e => e.FolderId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }

    public async Task EnsureDatabaseCreatedAsync()
    {
        try
        {
            if (Database.GetPendingMigrations().Any())
            {
                await Database.MigrateAsync();
            }
            else
            {
                await Database.EnsureCreatedAsync();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error ensuring database is created");
            throw;
        }
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            return await base.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving changes");
            throw;
        }
    }
}
