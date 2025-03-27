using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class UserTask
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public string Title { get; set; } = string.Empty;
        
        public string? Description { get; set; }
        
        public bool IsCompleted { get; set; }
        
        [Column(TypeName = "date")]
        public DateTime? TaskDate { get; set; }
        
        public TimeSpan? StartTime { get; set; }
        
        public TimeSpan? EndTime { get; set; }
        
        [Required]
        public int AssigneeId { get; set; }
        
        [Required]
        public string Priority { get; set; } = "Medium";
        
        [Required]
        public string Status { get; set; } = "Todo";
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public int? FolderId { get; set; }
        
        // Новые поля
        public string? Category { get; set; }
        
        public string? Tags { get; set; }
        
        public int? EstimatedHours { get; set; }
        
        public int? ActualHours { get; set; }
        
        // Навигационные свойства
        [ForeignKey("AssigneeId")]
        public virtual User? Assignee { get; set; }
        
        [ForeignKey("FolderId")]
        public virtual Folder? Folder { get; set; }
        
        // Получение списка тегов в виде массива
        [NotMapped]
        public string[] TagsArray 
        {
            get => Tags?.Split(',').Select(t => t.Trim()).Where(t => !string.IsNullOrEmpty(t)).ToArray() ?? Array.Empty<string>();
        }
    }
}