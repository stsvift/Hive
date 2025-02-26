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

    public async Task<List<UserTask>> GetUserTasksAsync(int userId)
    {
        string cacheKey = $"tasks-{userId}";
        
        if (!_cache.TryGetValue(cacheKey, out List<UserTask> tasks))
        {
            tasks = await _context.Tasks
                .AsNoTracking()
                .Where(t => t.UserId == userId)
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => new UserTask 
                {
                    Id = t.Id,
                    Title = t.Title,
                    Description = t.Description,
                    IsCompleted = t.IsCompleted,
                    Deadline = t.Deadline,
                    CreatedAt = t.CreatedAt,
                    UserId = t.UserId,
                    FolderId = t.FolderId
                })
                .ToListAsync();

            var cacheOptions = new MemoryCacheEntryOptions()
                .SetSlidingExpiration(TimeSpan.FromMinutes(5));

            _cache.Set(cacheKey, tasks, cacheOptions);
        }

        return tasks;
    }

    public async Task<List<UserTask>> GetUpcomingTasksAsync(int userId)
    {
        return await _context.Tasks
            .Where(t => t.UserId == userId && !t.IsCompleted && t.Deadline.HasValue)
            .OrderBy(t => t.Deadline)
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
            _logger.LogError(ex, "Error creating task for user {UserId}", task.UserId);
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
            existingTask.Deadline = task.Deadline;

            await _context.SaveChangesAsync();
            return existingTask;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating task {TaskId}", id);
            throw;
        }
    }

    public async Task DeleteTaskAsync(int id, int userId)
    {
        var task = await _context.Tasks
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
            
        if (task == null)
            throw new KeyNotFoundException($"Task with id {id} not found");

        _context.Tasks.Remove(task);
        await _context.SaveChangesAsync();
        await InvalidateTasksCacheAsync(userId);
    }

    public async Task<UserTask> ToggleTaskCompletionAsync(int id, int userId)
    {
        var task = await _context.Tasks
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
            
        if (task == null)
            throw new KeyNotFoundException($"Task with id {id} not found");

        task.IsCompleted = !task.IsCompleted;
        await _context.SaveChangesAsync();
        await InvalidateTasksCacheAsync(userId);
        
        return task;
    }

    public async Task<List<UserTask>> GetTasksByDateAsync(int userId, DateTime date)
    {
        try
        {
            _logger.LogInformation($"Looking for tasks with date {date.Date}"); // добавляем логирование
            var tasks = await _context.Tasks
                .Where(t => t.UserId == userId && 
                           t.Deadline.HasValue && 
                           t.Deadline.Value.Date == date.Date)
                .OrderBy(t => t.Deadline)
                .ToListAsync();
            
            _logger.LogInformation($"SQL Query: {_context.Tasks.Where(t => t.UserId == userId && t.Deadline.HasValue && t.Deadline.Value.Date == date.Date).ToQueryString()}"); 
            
            return tasks;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting tasks for date {Date} and user {UserId}", date, userId);
            throw;
        }
    }

    public async Task<List<UserTask>> GetAllTasksAsync(int userId)
    {
        _logger.LogInformation($"Getting all tasks for user {userId}");
        return await _context.Tasks
            .Where(t => t.UserId == userId)
            .OrderBy(t => t.Deadline)
            .ToListAsync();
    }

    public async Task InvalidateTasksCacheAsync(int userId)
    {
        string cacheKey = $"tasks-{userId}";
        _cache.Remove(cacheKey);
    }
}