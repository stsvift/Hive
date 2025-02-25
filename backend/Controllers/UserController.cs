using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.Services;
using backend.Models;
using System.Security.Claims;

namespace backend.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/users")]
    public class UsersController : ControllerBase
    {
        private readonly UserService _userService;
        private readonly ILogger<UsersController> _logger;

        public UsersController(UserService userService, ILogger<UsersController> logger)
        {
            _userService = userService;
            _logger = logger;
        }

        [HttpGet("me")]
        public async Task<ActionResult<User>> GetCurrentUser()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { message = "Пользователь не авторизован" });
                }

                var user = await _userService.GetUserByIdAsync(int.Parse(userId));
                if (user == null)
                {
                    return NotFound(new { message = "Пользователь не найден" });
                }

                return Ok(new { name = user.Username });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении данных текущего пользователя");
                return StatusCode(500, new { message = "Внутренняя ошибка сервера" });
            }
        }

        [HttpGet("profile")]
        public async Task<ActionResult<object>> GetProfile()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
                var user = await _userService.GetUserByIdAsync(userId);
                
                if (user == null)
                    return NotFound(new { message = "User not found" });

                return Ok(new { 
                    name = user.Username,
                    avatarUrl = user.AvatarUrl
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user profile");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPost("avatar")]
        public async Task<IActionResult> UploadAvatar(IFormFile file)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
                if (file == null || file.Length == 0)
                    return BadRequest(new { message = "No file uploaded" });

                var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "../frontend/public/uploads/avatars");
                Directory.CreateDirectory(uploadPath);

                var fileName = $"{userId}_{DateTime.Now.Ticks}{Path.GetExtension(file.FileName)}";
                var filePath = Path.Combine(uploadPath, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                var avatarUrl = $"/uploads/avatars/{fileName}";
                await _userService.UpdateAvatarAsync(userId, avatarUrl);

                return Ok(new { avatarUrl });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading avatar");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }
    }
}