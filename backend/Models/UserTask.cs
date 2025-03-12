public class UserTask
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsCompleted { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? Deadline { get; set; }
    public int AssigneeId { get; set; } // Renamed from UserId
    public int? FolderId { get; set; }
    public int Priority { get; set; } = 0; // New field for priority (0=low, 1=medium, 2=high)
    public string Status { get; set; } = "New"; // New field for status (e.g. "New", "In Progress", "Done")
}