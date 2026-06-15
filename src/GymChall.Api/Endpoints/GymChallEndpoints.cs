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

        app.MapPost("/api/check-ins", async (RegisterCheckInRequest request, GymChallService service, CancellationToken cancellationToken) =>
        {
            await service.RegisterCheckInAsync(request, cancellationToken);
            return Results.Created("/api/check-ins", null);
        });

        app.MapPost("/api/tokens/full-coverage", async (CreateFullCoverageTokenRequest request, GymChallService service, CancellationToken cancellationToken) =>
        {
            await service.CreateFullCoverageTokenAsync(request, cancellationToken);
            return Results.Created("/api/tokens/full-coverage", null);
        });

        app.MapGet("/api/rankings/general", async (DateOnly? throughDate, GymChallService service, CancellationToken cancellationToken) =>
        {
            var date = throughDate ?? DateOnly.FromDateTime(DateTime.UtcNow);
            return Results.Ok(await service.GetGeneralRankingAsync(date, cancellationToken));
        });

        return app;
    }
}
