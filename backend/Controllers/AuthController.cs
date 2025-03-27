using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization; // Add this
using backend.Models;
using backend.Models.DTO; // Add this
using backend.Data;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text;
using backend.Services;

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(AuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            var result = await _authService.Login(request);
            if (!result.Success)
            {
                return Unauthorized(new { message = result.Message });
            }
            return Ok(new { token = result.Token, username = result.Username });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при попытке входа");
            return StatusCode(500, new { message = "Внутренняя ошибка сервера" });
        }
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var result = await _authService.Register(request);
            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }
            return Ok(new { message = "Регистрация успешна" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при регистрации");
            return StatusCode(500, new { message = "Внутренняя ошибка сервера" });
        }
    }

    [Authorize]
    [HttpPost("change-password")]
    [Route("change-password")] // Add explicit route
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto model)
    {
        try
        {
            // Get current user ID from claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized();
            }

            var result = await _authService.ChangePasswordAsync(userId, model.CurrentPassword, model.NewPassword);
            return Ok(new { success = true, message = "Пароль успешно изменен" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при смене пароля");
            return BadRequest(new { success = false, message = ex.Message });
        }
    }
}
