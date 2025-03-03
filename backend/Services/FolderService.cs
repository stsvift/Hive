using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class FolderService
{
    private readonly AppDbContext _context;

    public FolderService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Folder>> GetUserFoldersAsync(int userId)
    {
        return await _context.Folders
            .Where(f => f.UserId == userId)
            .Include(f => f.Notes)
            .ToListAsync();
    }

    public async Task<Folder?> GetFolderAsync(int id, int userId)
    {
        return await _context.Folders
            .Include(f => f.Notes)
            .FirstOrDefaultAsync(f => f.Id == id && f.UserId == userId);
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

    public async Task<bool> DeleteFolderAsync(int id, int userId)
    {
        var folder = await _context.Folders
            .FirstOrDefaultAsync(f => f.Id == id && f.UserId == userId);

        if (folder == null) return false;

        _context.Folders.Remove(folder);
        await _context.SaveChangesAsync();
        return true;
    }
}