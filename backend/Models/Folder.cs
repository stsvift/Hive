using System.Text.Json.Serialization;

namespace backend.Models;

public class Folder
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int UserId { get; set; }
    public int? ParentFolderId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public Folder? ParentFolder { get; set; }
    
    public virtual ICollection<Folder> SubFolders { get; set; } = new List<Folder>();
    public virtual ICollection<Note> Notes { get; set; } = new List<Note>();
    public virtual ICollection<FolderItem> Items { get; set; } = new List<FolderItem>();
}