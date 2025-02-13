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

    public async Task<List<Note>> GetNotesAsync()
    {
        return await _context.Notes.ToListAsync();
    }

    public async Task<Note> CreateNoteAsync(Note note)
    {
        _context.Notes.Add(note);
        await _context.SaveChangesAsync();
        return note;
    }
}
