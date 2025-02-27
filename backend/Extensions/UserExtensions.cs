using System.Security.Claims;

namespace backend.Extensions;

public static class UserExtensions 
{
    public static int GetUserId(this ClaimsPrincipal user)
    {
        var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier);
        return int.Parse(userIdClaim?.Value ?? throw new UnauthorizedAccessException());
    }
}