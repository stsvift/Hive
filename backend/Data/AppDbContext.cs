using Microsoft.EntityFrameworkCore;
using backend.Models;
using Microsoft.Extensions.Logging;
using System;
using System.Threading;
using System.Threading.Tasks;

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
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Deadline);
            entity.HasIndex(e => e.FolderId);
            entity.HasIndex(e => new { e.UserId, e.IsCompleted });
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
            entity.HasMany(f => f.Notes)
                .WithOne()
                .HasForeignKey(n => f.FolderId);
            entity.HasIndex(e => e.UserId);
            entity.HasOne(f => f.ParentFolder)
                .WithMany(f => f.SubFolders)
                .HasForeignKey(f => f.ParentFolderId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(e => e.ParentFolderId);
        });
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
