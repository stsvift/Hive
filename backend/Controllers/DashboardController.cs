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

    [HttpGet("upcoming-tasks")]
    public async Task<IActionResult> GetUpcomingTasks()
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
            var tasks = await _taskService.GetUpcomingTasksAsync(userId);
            return Ok(tasks);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при получении задач");
            return StatusCode(500, new { message = "Внутренняя ошибка сервера" });
        }
    }
}