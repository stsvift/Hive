using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Caching.Memory;
using System.Threading.Tasks;

namespace backend.Services;

public class TaskService
{
    private readonly AppDbContext _context;
    private readonly ILogger<TaskService> _logger;
    private readonly IMemoryCache _cache;

    public TaskService(AppDbContext context, ILogger<TaskService> logger, IMemoryCache cache)
    {
        _context = context;
        _logger = logger;
        _cache = cache;
    }

    public async Task<List<UserTask>> GetUserTasksAsync(int assigneeId)
    {
        string cacheKey = $"tasks-{assigneeId}";
        
        if (!_cache.TryGetValue(cacheKey, out List<UserTask>? tasks))
        {
            tasks = await _context.Tasks
                .AsNoTracking()
                .Where(t => t.AssigneeId == assigneeId)
                .ToListAsync() ?? new List<UserTask>();
        }

        return tasks;
    }

    public async Task<List<UserTask>> GetUpcomingTasksAsync(int assigneeId)
    {
        return await _context.Tasks
            .Where(t => t.AssigneeId == assigneeId && 
                       !t.IsCompleted && 
                       t.TaskDate.HasValue &&
                       t.TaskDate.Value >= DateTime.Today)
            .OrderBy(t => t.TaskDate)
            .ThenBy(t => t.StartTime)
            .Take(5)
            .ToListAsync();
    }

    public async Task<UserTask> CreateTaskAsync(UserTask task)
    {
        try
        {
            _context.Tasks.Add(task);
            await _context.SaveChangesAsync();
            return task;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating task for user {AssigneeId}", task.AssigneeId);
            throw;
        }
    }

    public async Task<UserTask> UpdateTaskAsync(int id, UserTask task)
    {
        try
        {
            var existingTask = await _context.Tasks.FindAsync(id);
            if (existingTask == null)
            {
                throw new KeyNotFoundException($"Task with id {id} not found");
            }

            existingTask.Title = task.Title;
            existingTask.Description = task.Description;
            existingTask.IsCompleted = task.IsCompleted;
            existingTask.TaskDate = task.TaskDate;
            existingTask.StartTime = task.StartTime;
            existingTask.EndTime = task.EndTime;
            existingTask.Priority = task.Priority;
            existingTask.Status = task.Status;

            await _context.SaveChangesAsync();
            return existingTask;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating task {TaskId}", id);
            throw;
        }
    }

    public async Task DeleteTaskAsync(int id, int assigneeId)
    {
        var task = await _context.Tasks
            .FirstOrDefaultAsync(t => t.Id == id && t.AssigneeId == assigneeId);
            
        if (task == null)
            throw new KeyNotFoundException($"Task with id {id} not found");

        _context.Tasks.Remove(task);
        await _context.SaveChangesAsync();
        await InvalidateTasksCacheAsync(assigneeId);
    }

    public async Task<UserTask> ToggleTaskCompletionAsync(int id, int assigneeId)
    {
        var task = await _context.Tasks
            .FirstOrDefaultAsync(t => t.Id == id && t.AssigneeId == assigneeId);
            
        if (task == null)
            throw new KeyNotFoundException($"Task with id {id} not found");

        task.IsCompleted = !task.IsCompleted;
        if (task.IsCompleted)
            task.Status = "Done";
        else if (task.Status == "Done")
            task.Status = "In Progress";
            
        await _context.SaveChangesAsync();
        await InvalidateTasksCacheAsync(assigneeId);
        
        return task;
    }

    public async Task<List<UserTask>> GetTasksByDateAsync(int assigneeId, DateTime date)
    {
        try
        {
            _logger.LogInformation($"Looking for tasks with date {date.Date}");
            var tasks = await _context.Tasks
                .Where(t => t.AssigneeId == assigneeId && 
                           t.TaskDate.HasValue && 
                           t.TaskDate.Value.Date == date.Date)
                .OrderBy(t => t.StartTime)
                .ToListAsync();
            
            return tasks;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting tasks for date {Date} and user {AssigneeId}", date, assigneeId);
            throw;
        }
    }

    public async Task<List<UserTask>> GetAllTasksAsync(int assigneeId)
    {
        _logger.LogInformation($"Getting all tasks for user {assigneeId}");
        return await _context.Tasks
            .Where(t => t.AssigneeId == assigneeId)
            .OrderBy(t => t.TaskDate)
            .ThenBy(t => t.StartTime)
            .ToListAsync();
    }

    public async Task InvalidateTasksCacheAsync(int assigneeId)
    {
        string cacheKey = $"tasks-{assigneeId}";
        _cache.Remove(cacheKey);
        await Task.CompletedTask;
    }
}