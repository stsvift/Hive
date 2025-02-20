using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using backend.Services;
using backend.Models;
using System.Security.Claims;
using System;
using System.Threading.Tasks;
using System.Collections.Generic;

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
        public async Task<ActionResult<List<Folder>>> GetFolders()
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
        public async Task<ActionResult<Folder>> GetFolder(int id)
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
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
                var deleted = await _folderService.DeleteFolderAsync(id, userId);
                
                if (!deleted)
                    return NotFound(new { message = "Папка не найдена" });

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при удалении папки");
                return StatusCode(500, new { message = "Внутренняя ошибка сервера" });
            }
        }
    }
}