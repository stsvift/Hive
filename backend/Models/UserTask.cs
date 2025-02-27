namespace backend.Models;

public class UserTask
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime? Deadline { get; set; }
    public int UserId { get; set; }
    public int? FolderId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public virtual Folder? Folder { get; set; }
}