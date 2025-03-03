using backend.Data; 
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class NoteService
{
    private readonly AppDbContext _context;

    public NoteService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Note>> GetNotesAsync(int userId)
    {
        return await _context.Notes
            .Where(n => n.UserId == userId)
            .ToListAsync();
    }

    public async Task<Note> CreateNoteAsync(Note note)
    {
        note.CreatedAt = DateTime.UtcNow;
        note.UpdatedAt = DateTime.UtcNow;
        _context.Notes.Add(note);
        await _context.SaveChangesAsync();
        return note;
    }

    public async Task<Note> UpdateNoteAsync(int id, Note note)
    {
        var existingNote = await _context.Notes
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == note.UserId);
            
        if (existingNote == null)
            throw new KeyNotFoundException($"Note with id {id} not found");

        existingNote.Title = note.Title;
        existingNote.Content = note.Content;
        existingNote.UpdatedAt = DateTime.UtcNow;
        existingNote.FolderId = note.FolderId;

        await _context.SaveChangesAsync();
        return existingNote;
    }

    public async Task DeleteNoteAsync(int id, int userId)
    {
        var note = await _context.Notes
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);
            
        if (note == null)
            throw new KeyNotFoundException($"Note with id {id} not found");

        _context.Notes.Remove(note);
        await _context.SaveChangesAsync();
    }
}
