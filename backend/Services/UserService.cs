using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class UserService
    {
        private readonly AppDbContext _context;

        public UserService(AppDbContext context)
        {
            _context = context;
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
    }
}