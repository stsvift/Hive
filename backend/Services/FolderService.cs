using backend.Data;
using backend.Models;
using backend.Models.DTOs;
using backend.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class FolderService
{
    private readonly AppDbContext _context;

    public FolderService(AppDbContext context)
    {
        _context = context;
    }

    private FolderDto MapToDto(Folder folder)
    {
        return new FolderDto
        {
            Id = folder.Id,
            Name = folder.Name,
            Description = folder.Description,
            ParentFolderId = folder.ParentFolderId,
            CreatedAt = folder.CreatedAt
        };
    }

    public async Task<List<FolderDto>> GetUserFoldersAsync(int userId)
    {
        var folders = await _context.Folders
            .Where(f => f.UserId == userId && f.ParentFolderId == null) // Только корневые папки
            .ToListAsync();
        return folders.Select(MapToDto).ToList();
    }

    public async Task<FolderDto?> GetFolderAsync(int id, int userId)
    {
        var folder = await _context.Folders
            .FirstOrDefaultAsync(f => f.Id == id && f.UserId == userId);
        return folder != null ? MapToDto(folder) : null;
    }

    public async Task<Folder> CreateFolderAsync(Folder folder)
    {
        _context.Folders.Add(folder);
        await _context.SaveChangesAsync();
        return folder;
    }

    public async Task<bool> UpdateFolderAsync(Folder folder)
    {
        var existingFolder = await _context.Folders
            .FirstOrDefaultAsync(f => f.Id == folder.Id && f.UserId == folder.UserId);

        if (existingFolder == null) return false;

        existingFolder.Name = folder.Name;
        existingFolder.Description = folder.Description;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<FolderContentsCount> GetFolderContentsCountAsync(int folderId, int userId)
    {
        var folder = await _context.Folders
            .Include(f => f.Notes)
            .Include(f => f.Tasks)
            .Include(f => f.ChildFolders)
            .FirstOrDefaultAsync(f => f.Id == folderId && f.UserId == userId);

        if (folder == null) return new FolderContentsCount();

        return new FolderContentsCount
        {
            NotesCount = folder.Notes.Count,
            TasksCount = folder.Tasks.Count,
            SubFoldersCount = folder.ChildFolders.Count
        };
    }

    public async Task DeleteFolderAsync(int id, int userId)
    {
        var strategy = _context.Database.CreateExecutionStrategy();
        
        await strategy.ExecuteAsync(async () =>
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var folder = await _context.Folders
                    .FirstOrDefaultAsync(f => f.Id == id && f.UserId == userId);

                if (folder == null)
                    throw new NotFoundException($"Folder with id {id} not found");

                _context.Folders.Remove(folder);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        });
    }

    public async Task<List<FolderDto>> GetFolderChildrenAsync(int folderId, int userId)
    {
        var children = await _context.Folders
            .Where(f => f.ParentFolderId == folderId && f.UserId == userId)
            .ToListAsync();
        return children.Select(MapToDto).ToList();
    }

    public async Task<List<Note>> GetFolderNotesAsync(int folderId, int userId)
    {
        return await _context.Notes
            .Where(n => n.FolderId == folderId && n.UserId == userId) // Только заметки этой папки
            .ToListAsync();
    }

    public async Task<List<UserTask>> GetFolderTasksAsync(int folderId, int userId)
    {
        return await _context.Tasks
            .Where(t => t.FolderId == folderId && t.UserId == userId) // Только задачи этой папки
            .ToListAsync();
    }
}