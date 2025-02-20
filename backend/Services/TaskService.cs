using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace backend.Services;

public class TaskService
{
    private readonly AppDbContext _context;
    private readonly ILogger<TaskService> _logger;

    public TaskService(AppDbContext context, ILogger<TaskService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<UserTask>> GetUserTasksAsync(int userId)
    {
        try
        {
            return await _context.Tasks
                .Where(t => t.UserId == userId)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting tasks for user {UserId}", userId);
            throw;
        }
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

    public async Task DeleteTaskAsync(int id)
    {
        try
        {
            var task = await _context.Tasks.FindAsync(id);
            if (task != null)
            {
                _context.Tasks.Remove(task);
                await _context.SaveChangesAsync();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting task {TaskId}", id);
            throw;
        }
    }

    public async Task<UserTask> ToggleTaskCompletionAsync(int id, int userId)
    {
        try
        {
            var task = await _context.Tasks
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
                
            if (task == null)
                throw new KeyNotFoundException($"Task with id {id} not found");

            task.IsCompleted = !task.IsCompleted;
            await _context.SaveChangesAsync();
            
            return task;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error toggling task completion");
            throw;
        }
    }
}