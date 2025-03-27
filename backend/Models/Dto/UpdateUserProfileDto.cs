namespace backend.Models.DTO;

public class UpdateUserProfileDto
{
    public string? Name { get; set; }
    public string? Username { get; set; }
    // Другие поля профиля, которые можно обновить, но не включаем сюда пароль
}
