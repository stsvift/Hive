namespace backend.Models.DTOs;

public class FolderContentsCount
{
    public int NotesCount { get; set; }
    public int TasksCount { get; set; }
    public int SubFoldersCount { get; set; }
}