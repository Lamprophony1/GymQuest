using GymChall.Application.Challenges;

namespace GymChall.Api.Endpoints;

public static class GymChallEndpoints
{
    public static IEndpointRouteBuilder MapGymChallEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/challenge", async (GymChallService service, CancellationToken cancellationToken) =>
        {
            return Results.Ok(await service.GetActiveChallengeAsync(cancellationToken));
        });

        app.MapGet("/api/challenge/settings", async (GymChallService service, CancellationToken cancellationToken) =>
        {
            return Results.Ok(await service.GetSettingsAsync(cancellationToken));
        });

        app.MapGet("/api/participants", async (GymChallService service, CancellationToken cancellationToken) =>
        {
            return Results.Ok(await service.ListParticipantsAsync(cancellationToken));
        });

        app.MapPost("/api/participants", async (CreateParticipantRequest request, GymChallService service, CancellationToken cancellationToken) =>
        {
            var id = await service.CreateParticipantAsync(request, cancellationToken);
            return Results.Created($"/api/participants/{id}", new { id });
        });

        app.MapGet("/api/couples", async (GymChallService service, CancellationToken cancellationToken) =>
        {
            return Results.Ok(await service.ListCouplesAsync(cancellationToken));
        });

        app.MapPost("/api/couples", async (CreateCoupleRequest request, GymChallService service, CancellationToken cancellationToken) =>
        {
            var id = await service.CreateCoupleAsync(request, cancellationToken);
            return Results.Created($"/api/couples/{id}", new { id });
        });

        app.MapPost("/api/check-ins", async (RegisterCheckInRequest request, GymChallService service, CancellationToken cancellationToken) =>
        {
            var id = await service.RegisterCheckInAsync(request, cancellationToken);
            return Results.Created($"/api/check-ins/{id}", new { id });
        });

        app.MapPost("/api/tokens/full-coverage", async (CreateFullCoverageTokenRequest request, GymChallService service, CancellationToken cancellationToken) =>
        {
            var id = await service.CreateFullCoverageTokenAsync(request, cancellationToken);
            return Results.Created($"/api/tokens/full-coverage/{id}", new { id });
        });

        app.MapPost("/api/admin/check-ins/{id:guid}/invalidate", async (Guid id, InvalidateRecordRequest request, GymChallService service, CancellationToken cancellationToken) =>
        {
            await service.InvalidateCheckInAsync(id, request, cancellationToken);
            return Results.NoContent();
        });

        app.MapPost("/api/admin/tokens/{id:guid}/invalidate", async (Guid id, InvalidateRecordRequest request, GymChallService service, CancellationToken cancellationToken) =>
        {
            await service.InvalidateFullCoverageTokenAsync(id, request, cancellationToken);
            return Results.NoContent();
        });

        app.MapGet("/api/admin/check-ins", async (int? limit, GymChallService service, CancellationToken cancellationToken) =>
        {
            return Results.Ok(await service.ListRecentCheckInsAsync(limit, cancellationToken));
        });

        app.MapGet("/api/admin/tokens", async (int? limit, GymChallService service, CancellationToken cancellationToken) =>
        {
            return Results.Ok(await service.ListRecentFullCoverageTokensAsync(limit, cancellationToken));
        });

        app.MapGet("/api/rankings/general", async (DateOnly? throughDate, GymChallService service, CancellationToken cancellationToken) =>
        {
            var date = throughDate ?? DateOnly.FromDateTime(DateTime.UtcNow);
            return Results.Ok(await service.GetGeneralRankingAsync(date, cancellationToken));
        });

        app.MapGet("/api/rankings/weeks", async (DateOnly? throughDate, GymChallService service, CancellationToken cancellationToken) =>
        {
            var date = throughDate ?? DateOnly.FromDateTime(DateTime.UtcNow);
            return Results.Ok(await service.GetWeeklyRankingsAsync(date, cancellationToken));
        });

        app.MapGet("/api/rankings/weeks/{weekStartDate}", async (DateOnly weekStartDate, DateOnly? throughDate, GymChallService service, CancellationToken cancellationToken) =>
        {
            var date = throughDate ?? DateOnly.FromDateTime(DateTime.UtcNow);
            return Results.Ok(await service.GetWeeklyRankingAsync(weekStartDate, date, cancellationToken));
        });

        return app;
    }
}
