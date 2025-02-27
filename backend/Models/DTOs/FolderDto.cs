namespace backend.Models.DTOs;

public class FolderDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? ParentFolderId { get; set; }
    public DateTime CreatedAt { get; set; }
}
