using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using backend.Models;
using backend.Services;

namespace backend.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class TasksController : ControllerBase
    {
        private readonly TaskService _taskService;
        private readonly ILogger<TasksController> _logger;

        public TasksController(TaskService taskService, ILogger<TasksController> logger)
        {
            _taskService = taskService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<List<UserTask>>> GetTasks()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
                var tasks = await _taskService.GetUserTasksAsync(userId);
                return Ok(tasks);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting tasks");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPost]
        public async Task<ActionResult<UserTask>> CreateTask(UserTask task)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
                task.UserId = userId;
                task.CreatedAt = DateTime.UtcNow;
                
                var createdTask = await _taskService.CreateTaskAsync(task);
                _logger.LogInformation($"Created task with ID: {createdTask.Id}");
                
                // Clear cache after creating new task
                await _taskService.InvalidateTasksCacheAsync(userId);
                
                return CreatedAtAction(nameof(GetTasks), new { id = createdTask.Id }, createdTask);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating task");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPatch("{id}/toggle")]
        public async Task<ActionResult<UserTask>> ToggleTaskCompletion(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
                var task = await _taskService.ToggleTaskCompletionAsync(id, userId);
                await _taskService.InvalidateTasksCacheAsync(userId);
                return Ok(task);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling task");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteTask(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
                await _taskService.DeleteTaskAsync(id, userId);
                await _taskService.InvalidateTasksCacheAsync(userId);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting task");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<UserTask>> UpdateTask(int id, UserTask task)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
                task.UserId = userId;
                var updatedTask = await _taskService.UpdateTaskAsync(id, task);
                await _taskService.InvalidateTasksCacheAsync(userId);
                return Ok(updatedTask);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating task");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }
    }
}