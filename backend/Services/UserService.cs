using backend.Data;
using backend.Models;
using backend.Models.DTO;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class UserService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<UserService> _logger;

        public UserService(AppDbContext context, ILogger<UserService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<User?> GetUserByIdAsync(int id)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null) return null;

            // Remove sensitive information
            user.PasswordHash = string.Empty;
            
            return user;
        }

        public async Task<User> UpdateUserAsync(User user)
        {
            _context.Users.Update(user);
            await _context.SaveChangesAsync();
            return user;
        }

        public async Task<User> UpdateAvatarAsync(int userId, string avatarUrl)
        {
            // Use raw SQL to only update AvatarUrl
            await _context.Database.ExecuteSqlRawAsync(
                "UPDATE Users SET AvatarUrl = {0} WHERE Id = {1}",
                avatarUrl, userId
            );

            var user = await _context.Users.FindAsync(userId);
            return user!;
        }

        public async Task<object> GetUserProfileAsync(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                throw new Exception("User not found");
            }

            return new
            {
                id = user.Id,
                name = user.Username,
                email = user.Email,
                avatarUrl = user.AvatarUrl
            };
        }

        public async Task<bool> UpdateUserProfileAsync(int userId, UpdateUserProfileDto profileDto)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                throw new Exception("User not found");
            }

            // Обновляем только те поля, которые предоставлены в DTO
            if (!string.IsNullOrEmpty(profileDto.Name))
            {
                user.Username = profileDto.Name; // Обновляем имя пользователя
            }

            // Если бы было больше полей, мы бы обновляли их здесь
            // Важно: мы не трогаем поле PasswordHash

            try
            {
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user profile");
                throw new Exception("Failed to update user profile", ex);
            }
        }
    }
}