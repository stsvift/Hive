using System.Text.Json.Serialization;

namespace backend.Models;

public class FolderItem
{
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string ReferenceId { get; set; } = string.Empty;
    public int FolderId { get; set; }
    
    [JsonIgnore]
    public Folder? Folder { get; set; }
}
