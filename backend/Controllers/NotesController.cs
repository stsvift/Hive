using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NotesController : ControllerBase
{
    private readonly NoteService _noteService;

    public NotesController(NoteService noteService)
    {
        _noteService = noteService;
    }

    [HttpGet]
    public async Task<ActionResult<List<Note>>> GetNotes()
    {
        var notes = await _noteService.GetNotesAsync();
        return Ok(notes);
    }

    [HttpPost]
    public async Task<ActionResult<Note>> CreateNote(Note note)
    {
        var createdNote = await _noteService.CreateNoteAsync(note);
        return CreatedAtAction(nameof(GetNotes), new { id = createdNote.Id }, createdNote);
    }
}
