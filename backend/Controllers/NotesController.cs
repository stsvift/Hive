using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class NotesController : ControllerBase
{
    private readonly NoteService _noteService;
    private readonly ILogger<NotesController> _logger;

    public NotesController(NoteService noteService, ILogger<NotesController> logger)
    {
        _noteService = noteService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<Note>>> GetNotes()
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
            var notes = await _noteService.GetNotesAsync(userId);
            return Ok(notes);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при получении заметок");
            return StatusCode(500, new { message = "Внутренняя ошибка сервера" });
        }
    }

    [HttpPost]
    public async Task<ActionResult<Note>> CreateNote(Note note)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
            note.UserId = userId;
            var createdNote = await _noteService.CreateNoteAsync(note);
            return CreatedAtAction(nameof(GetNotes), new { id = createdNote.Id }, createdNote);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при создании заметки");
            return StatusCode(500, new { message = "Внутренняя ошибка сервера" });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Note>> UpdateNote(int id, Note note)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
            note.UserId = userId;
            var updatedNote = await _noteService.UpdateNoteAsync(id, note);
            return Ok(updatedNote);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = "Заметка не найдена" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при обновлении заметки");
            return StatusCode(500, new { message = "Внутренняя ошибка сервера" });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteNote(int id)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
            await _noteService.DeleteNoteAsync(id, userId);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = "Заметка не найдена" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при удалении заметки");
            return StatusCode(500, new { message = "Внутренняя ошибка сервера" });
        }
    }
}
