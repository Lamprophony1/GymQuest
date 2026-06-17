using System.Security.Claims;
using GymChall.Api.Auth;
using GymChall.Application.Auth;
using GymChall.Application.Challenges;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;

namespace GymChall.Api.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app, AuthSettings settings)
    {
        app.MapGet("/api/auth/login-options", async (PinAuthService service, CancellationToken cancellationToken) =>
        {
            return Results.Ok(await service.ListLoginOptionsAsync(cancellationToken));
        });

        app.MapPost("/api/auth/login", async (LoginRequest request, PinAuthService service, HttpContext context, CancellationToken cancellationToken) =>
        {
            try
            {
                var participant = await service.LoginAsync(request, cancellationToken: cancellationToken);
                var claims = new List<Claim>
                {
                    new(ClaimTypes.NameIdentifier, participant.Id.ToString()),
                    new(ClaimTypes.Name, participant.Username),
                    new(ClaimTypes.Role, participant.Role == ParticipantRoleDto.Admin ? "Admin" : "Participant")
                };

                var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
                await context.SignInAsync(
                    CookieAuthenticationDefaults.AuthenticationScheme,
                    new ClaimsPrincipal(identity));

                return Results.Ok(new { participant });
            }
            catch (InvalidOperationException exception)
            {
                return Results.BadRequest(new { message = exception.Message });
            }
        });

        app.MapGet("/api/auth/me", async (ClaimsPrincipal user, PinAuthService service, CancellationToken cancellationToken) =>
        {
            if (user.Identity?.IsAuthenticated != true)
            {
                return Results.Unauthorized();
            }

            var participant = await service.GetAuthenticatedParticipantAsync(user.RequireParticipantId(), cancellationToken);
            return participant is null ? Results.Unauthorized() : Results.Ok(new { participant });
        });

        app.MapPost("/api/auth/logout", async (HttpContext context) =>
        {
            await context.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return Results.NoContent();
        });

        app.MapPost("/api/admin/participants/{id:guid}/pin", async (
            Guid id,
            SetPinRequest request,
            ClaimsPrincipal user,
            PinAuthService service,
            CancellationToken cancellationToken) =>
        {
            try
            {
                await service.SetPinAsync(id, request.Pin, user.RequireParticipantId(), cancellationToken: cancellationToken);
                return Results.NoContent();
            }
            catch (InvalidOperationException exception)
            {
                return Results.BadRequest(new { message = exception.Message });
            }
        }).RequireAdminIfPin(settings);

        return app;
    }
}
