using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using backend.Services;

namespace backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly TaskService _taskService;
    private readonly ILogger<DashboardController> _logger;

    public DashboardController(TaskService taskService, ILogger<DashboardController> logger)
    {
        _taskService = taskService;
        _logger = logger;
    }

    [HttpGet("today-tasks")]
    public async Task<IActionResult> GetTodayTasks()
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
            var today = DateTime.Today;
            _logger.LogInformation($"Fetching tasks for user {userId} for date {today}"); 
            var tasks = await _taskService.GetTasksByDateAsync(userId, today);
            _logger.LogInformation($"Found {tasks.Count} tasks");  
            return Ok(tasks);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при получении задач на сегодня");
            return StatusCode(500, new { message = "Внутренняя ошибка сервера" });
        }
    }

    [HttpGet("task-stats")]
    public async Task<IActionResult> GetTaskStats()
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
            _logger.LogInformation($"Getting task stats for user {userId}");
            
            var tasks = await _taskService.GetAllTasksAsync(userId);
            var completedTasks = tasks.Count(t => t.IsCompleted);
            var activeTasks = tasks.Count - completedTasks;
            
            _logger.LogInformation($"Stats - Total: {tasks.Count}, Completed: {completedTasks}, Active: {activeTasks}");
            
            return Ok(new
            {
                activeTasks,
                completedTasks,
                totalTasks = tasks.Count
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при получении статистики задач");
            return StatusCode(500, new { message = "Внутренняя ошибка сервера" });
        }
    }
}