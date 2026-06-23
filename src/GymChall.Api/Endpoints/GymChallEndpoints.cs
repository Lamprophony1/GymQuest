using System.Security.Claims;
using GymChall.Api.Auth;
using GymChall.Application.Challenges;

namespace GymChall.Api.Endpoints;

public static class GymChallEndpoints
{
    public static IEndpointRouteBuilder MapGymChallEndpoints(this IEndpointRouteBuilder app, AuthSettings authSettings)
    {
        app.MapGet("/api/challenge", async (GymChallService service, CancellationToken cancellationToken) =>
        {
            return Results.Ok(await service.GetActiveChallengeAsync(cancellationToken));
        }).RequireAuthIfPin(authSettings);

        app.MapGet("/api/challenge/settings", async (GymChallService service, CancellationToken cancellationToken) =>
        {
            return Results.Ok(await service.GetSettingsAsync(cancellationToken));
        }).RequireAuthIfPin(authSettings);

        app.MapGet("/api/participants", async (GymChallService service, CancellationToken cancellationToken) =>
        {
            return Results.Ok(await service.ListParticipantsAsync(cancellationToken));
        }).RequireAuthIfPin(authSettings);

        app.MapGet("/api/profile", async (Guid? participantId, ClaimsPrincipal user, GymChallService service, CancellationToken cancellationToken) =>
        {
            try
            {
                var resolvedParticipantId = CurrentParticipantIdOr(participantId, user, authSettings);
                if (resolvedParticipantId is null)
                {
                    return Results.BadRequest(new { message = "Participante requerido." });
                }

                return Results.Ok(await service.GetParticipantProfileAsync(resolvedParticipantId.Value, cancellationToken));
            }
            catch (InvalidOperationException exception)
            {
                return Results.BadRequest(new { message = exception.Message });
            }
        }).RequireAuthIfPin(authSettings);

        app.MapPut("/api/profile", async (UpdateParticipantProfileRequest request, ClaimsPrincipal user, GymChallService service, CancellationToken cancellationToken) =>
        {
            try
            {
                var resolvedParticipantId = CurrentParticipantIdOr(request.ParticipantId, user, authSettings);
                if (resolvedParticipantId is null)
                {
                    return Results.BadRequest(new { message = "Participante requerido." });
                }

                return Results.Ok(await service.UpdateParticipantProfileAsync(resolvedParticipantId.Value, request, cancellationToken));
            }
            catch (InvalidOperationException exception)
            {
                return Results.BadRequest(new { message = exception.Message });
            }
        }).RequireAuthIfPin(authSettings);

        app.MapPost("/api/participants", async (CreateParticipantRequest request, GymChallService service, CancellationToken cancellationToken) =>
        {
            var id = await service.CreateParticipantAsync(request, cancellationToken);
            return Results.Created($"/api/participants/{id}", new { id });
        }).RequireAdminIfPin(authSettings);

        app.MapGet("/api/couples", async (GymChallService service, CancellationToken cancellationToken) =>
        {
            return Results.Ok(await service.ListCouplesAsync(cancellationToken));
        }).RequireAuthIfPin(authSettings);

        app.MapPost("/api/couples", async (CreateCoupleRequest request, GymChallService service, CancellationToken cancellationToken) =>
        {
            var id = await service.CreateCoupleAsync(request, cancellationToken);
            return Results.Created($"/api/couples/{id}", new { id });
        }).RequireAdminIfPin(authSettings);

        app.MapPost("/api/check-ins", async (RegisterCheckInRequest request, ClaimsPrincipal user, GymChallService service, CancellationToken cancellationToken) =>
        {
            var actorParticipantId = CurrentParticipantIdOr(request.CreatedByParticipantId, user, authSettings);
            request = request with
            {
                ParticipantId = CurrentParticipantIdOr(request.ParticipantId, user, authSettings),
                CreatedByParticipantId = actorParticipantId
            };
            var id = await service.RegisterCheckInAsync(request, cancellationToken);
            return Results.Created($"/api/check-ins/{id}", new { id });
        }).RequireAuthIfPin(authSettings);

        app.MapPost("/api/tokens/full-coverage", async (CreateFullCoverageTokenRequest request, ClaimsPrincipal user, GymChallService service, CancellationToken cancellationToken) =>
        {
            request = request with
            {
                AssignedByAdminId = CurrentParticipantIdOr(request.AssignedByAdminId, user, authSettings)
            };
            var id = await service.CreateFullCoverageTokenAsync(request, cancellationToken);
            return Results.Created($"/api/tokens/full-coverage/{id}", new { id });
        }).RequireAdminIfPin(authSettings);

        app.MapPost("/api/admin/tokens", async (GrantTokenRequest request, ClaimsPrincipal user, GymChallService service, CancellationToken cancellationToken) =>
        {
            request = request with
            {
                AssignedByAdminId = CurrentParticipantIdOr(request.AssignedByAdminId, user, authSettings)
            };
            var id = await service.GrantTokenAsync(request, cancellationToken);
            return Results.Created($"/api/tokens/{id}", new { id });
        }).RequireAdminIfPin(authSettings);

        app.MapPost("/api/tokens/{id:guid}/use", async (Guid id, UseTokenRequest request, ClaimsPrincipal user, GymChallService service, CancellationToken cancellationToken) =>
        {
            var actorParticipantId = CurrentParticipantIdOr(request.UsedByParticipantId, user, authSettings);
            request = request with
            {
                ParticipantId = CurrentParticipantIdOr(request.ParticipantId, user, authSettings),
                UsedByParticipantId = actorParticipantId
            };
            await service.UseTokenAsync(id, request, cancellationToken);
            return Results.NoContent();
        }).RequireAuthIfPin(authSettings);

        app.MapPost("/api/admin/check-ins/{id:guid}/invalidate", async (Guid id, InvalidateRecordRequest request, ClaimsPrincipal user, GymChallService service, CancellationToken cancellationToken) =>
        {
            request = request with
            {
                ActorParticipantId = CurrentParticipantIdOr(request.ActorParticipantId, user, authSettings)
            };
            await service.InvalidateCheckInAsync(id, request, cancellationToken);
            return Results.NoContent();
        }).RequireAdminIfPin(authSettings);

        app.MapPost("/api/admin/tokens/{id:guid}/invalidate", async (Guid id, InvalidateRecordRequest request, ClaimsPrincipal user, GymChallService service, CancellationToken cancellationToken) =>
        {
            request = request with
            {
                ActorParticipantId = CurrentParticipantIdOr(request.ActorParticipantId, user, authSettings)
            };
            await service.InvalidateFullCoverageTokenAsync(id, request, cancellationToken);
            return Results.NoContent();
        }).RequireAdminIfPin(authSettings);

        app.MapGet("/api/admin/check-ins", async (int? limit, GymChallService service, CancellationToken cancellationToken) =>
        {
            return Results.Ok(await service.ListRecentCheckInsAsync(limit, cancellationToken));
        }).RequireAdminIfPin(authSettings);

        app.MapGet("/api/admin/check-ins/calendar", async (DateOnly from, DateOnly to, GymChallService service, CancellationToken cancellationToken) =>
        {
            return Results.Ok(await service.ListCalendarCheckInsAsync(from, to, cancellationToken));
        }).RequireAdminIfPin(authSettings);

        app.MapGet("/api/calendar/weekly", async (DateOnly from, DateOnly to, GymChallService service, CancellationToken cancellationToken) =>
        {
            return Results.Ok(await service.ListWeeklyCalendarEventsAsync(from, to, cancellationToken));
        }).RequireAuthIfPin(authSettings);

        app.MapGet("/api/admin/tokens", async (int? limit, GymChallService service, CancellationToken cancellationToken) =>
        {
            return Results.Ok(await service.ListRecentFullCoverageTokensAsync(limit, cancellationToken));
        }).RequireAdminIfPin(authSettings);

        app.MapGet("/api/rankings/general", async (DateOnly? throughDate, DateTimeOffset? asOf, GymChallService service, CancellationToken cancellationToken) =>
        {
            return throughDate is { } date
                ? Results.Ok(await service.GetGeneralRankingAsync(date, cancellationToken))
                : Results.Ok(await service.GetLiveGeneralRankingAsync(asOf, cancellationToken));
        }).RequireAuthIfPin(authSettings);

        app.MapGet("/api/rankings/weeks", async (DateOnly? throughDate, DateTimeOffset? asOf, GymChallService service, CancellationToken cancellationToken) =>
        {
            return throughDate is { } date
                ? Results.Ok(await service.GetWeeklyRankingsAsync(date, cancellationToken))
                : Results.Ok(await service.GetLiveWeeklyRankingsAsync(asOf, cancellationToken));
        }).RequireAuthIfPin(authSettings);

        app.MapGet("/api/rankings/weeks/{weekStartDate}", async (DateOnly weekStartDate, DateOnly? throughDate, DateTimeOffset? asOf, GymChallService service, CancellationToken cancellationToken) =>
        {
            return throughDate is { } date
                ? Results.Ok(await service.GetWeeklyRankingAsync(weekStartDate, date, cancellationToken))
                : Results.Ok(await service.GetLiveWeeklyRankingAsync(weekStartDate, asOf, cancellationToken));
        }).RequireAuthIfPin(authSettings);

        return app;
    }

    private static Guid CurrentParticipantIdOr(Guid fallback, ClaimsPrincipal user, AuthSettings authSettings)
    {
        return CurrentParticipantIdOr((Guid?)fallback, user, authSettings) ?? fallback;
    }

    private static Guid? CurrentParticipantIdOr(Guid? fallback, ClaimsPrincipal user, AuthSettings authSettings)
    {
        return authSettings.IsPinLogin ? user.RequireParticipantId() : fallback;
    }
}
