namespace backend.Models;

public class Folder
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int UserId { get; set; }
    public int? ParentFolderId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public virtual ICollection<Note> Notes { get; set; } = new List<Note>();
    public virtual ICollection<UserTask> Tasks { get; set; } = new List<UserTask>();
    public virtual Folder? ParentFolder { get; set; }
    public virtual ICollection<Folder> ChildFolders { get; set; } = new List<Folder>();
}