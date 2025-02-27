using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using backend.Services;
using backend.Models;
using backend.Models.DTOs;
using System.Security.Claims;
using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using backend.Extensions;
using backend.Exceptions;

namespace backend.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class FoldersController : ControllerBase
    {
        private readonly FolderService _folderService;
        private readonly ILogger<FoldersController> _logger;

        public FoldersController(FolderService folderService, ILogger<FoldersController> logger)
        {
            _folderService = folderService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<List<FolderDto>>> GetFolders()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
                var folders = await _folderService.GetUserFoldersAsync(userId);
                return Ok(folders);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении папок");
                return StatusCode(500, new { message = "Внутренняя ошибка сервера" });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<FolderDto>> GetFolder(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
                var folder = await _folderService.GetFolderAsync(id, userId);
                
                if (folder == null)
                    return NotFound(new { message = "Папка не найдена" });

                return Ok(folder);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении папки");
                return StatusCode(500, new { message = "Внутренняя ошибка сервера" });
            }
        }

        [HttpPost]
        public async Task<ActionResult<Folder>> CreateFolder(Folder folder)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
                folder.UserId = userId;
                var createdFolder = await _folderService.CreateFolderAsync(folder);
                return CreatedAtAction(nameof(GetFolder), new { id = createdFolder.Id }, createdFolder);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при создании папки");
                return StatusCode(500, new { message = "Внутренняя ошибка сервера" });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateFolder(int id, Folder folder)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
                folder.UserId = userId;
                folder.Id = id;
                
                var updated = await _folderService.UpdateFolderAsync(folder);
                if (!updated)
                    return NotFound(new { message = "Папка не найдена" });

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при обновлении папки");
                return StatusCode(500, new { message = "Внутренняя ошибка сервера" });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFolder(int id)
        {
            try
            {
                var userId = User.GetUserId();
                await _folderService.DeleteFolderAsync(id, userId);
                return Ok(new { message = "Папка и все её содержимое успешно удалены" });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при удалении папки");
                return StatusCode(500, new { message = "Произошла ошибка при удалении папки" });
            }
        }

        // Добавляем новые методы
        [HttpGet("{id}/breadcrumbs")]
        public async Task<ActionResult<List<FolderDto>>> GetBreadcrumbs(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
                var breadcrumbs = new List<FolderDto>();
                var currentFolder = await _folderService.GetFolderAsync(id, userId);
                
                while (currentFolder != null)
                {
                    breadcrumbs.Insert(0, currentFolder);
                    if (currentFolder.ParentFolderId == null) break;
                    currentFolder = await _folderService.GetFolderAsync(currentFolder.ParentFolderId.Value, userId);
                }
                
                return Ok(breadcrumbs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении пути папки");
                return StatusCode(500, new { message = "Внутренняя ошибка сервера" });
            }
        }

        [HttpGet("{id}/children")]
        public async Task<ActionResult<List<FolderDto>>> GetChildren(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
                var children = await _folderService.GetFolderChildrenAsync(id, userId);
                return Ok(children);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении дочерних папок");
                return StatusCode(500, new { message = "Внутренняя ошибка сервера" });
            }
        }

        [HttpGet("{id}/notes")]
        public async Task<ActionResult<List<Note>>> GetFolderNotes(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
                var notes = await _folderService.GetFolderNotesAsync(id, userId);
                return Ok(notes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении заметок папки");
                return StatusCode(500, new { message = "Внутренняя ошибка сервера" });
            }
        }

        [HttpGet("{id}/tasks")]
        public async Task<ActionResult<List<UserTask>>> GetFolderTasks(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
                var tasks = await _folderService.GetFolderTasksAsync(id, userId);
                return Ok(tasks);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении задач папки");
                return StatusCode(500, new { message = "Внутренняя ошибка сервера" });
            }
        }

        [HttpGet("{id}/contents-count")]
        public async Task<ActionResult<FolderContentsCount>> GetFolderContentsCount(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
                var count = await _folderService.GetFolderContentsCountAsync(id, userId);
                return Ok(count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении количества элементов в папке");
                return StatusCode(500, new { message = "Внутренняя ошибка сервера" });
            }
        }
    }
}