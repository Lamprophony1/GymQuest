using System.Security.Claims;
using GymChall.Api.Auth;

namespace GymChall.Api.Endpoints;

public static class EndpointAuthExtensions
{
    public const string AdminPolicy = "AdminOnly";

    public static RouteHandlerBuilder RequireAuthIfPin(this RouteHandlerBuilder builder, AuthSettings settings)
    {
        if (settings.IsPinLogin)
        {
            builder.RequireAuthorization();
        }

        return builder;
    }

    public static RouteHandlerBuilder RequireAdminIfPin(this RouteHandlerBuilder builder, AuthSettings settings)
    {
        if (settings.IsPinLogin)
        {
            builder.RequireAuthorization(AdminPolicy);
        }

        return builder;
    }

    public static Guid RequireParticipantId(this ClaimsPrincipal user)
    {
        var value = user.FindFirstValue(ClaimTypes.NameIdentifier);
        if (Guid.TryParse(value, out var participantId))
        {
            return participantId;
        }

        throw new InvalidOperationException("Sesion invalida.");
    }
}
