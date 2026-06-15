using GymChall.Application.Abstractions;
using GymChall.Application.Scoring;

namespace GymChall.Application.Challenges;

public sealed record RegisterCheckInRequest(Guid ParticipantId, DateTimeOffset OccurredAt, CheckInTypeDto Type, int DurationMinutes, Guid CreatedByParticipantId, string? Notes);
public sealed record CreateFullCoverageTokenRequest(Guid ParticipantId, DateOnly TargetDate, ExceptionReasonCategoryDto ReasonCategory, Guid AssignedByAdminId, string? Notes);

public sealed class GymChallService(IGymChallRepository repository)
{
    public async Task RegisterCheckInAsync(RegisterCheckInRequest request, CancellationToken cancellationToken = default)
    {
        var challengeId = await RequireActiveChallengeId(cancellationToken);
        await repository.AddCheckInAsync(new CheckInCreateDto(Guid.NewGuid(), challengeId, request.ParticipantId, request.OccurredAt, DateOnly.FromDateTime(request.OccurredAt.Date), request.Type, request.DurationMinutes, request.CreatedByParticipantId, request.Notes), cancellationToken);
    }

    public async Task CreateFullCoverageTokenAsync(CreateFullCoverageTokenRequest request, CancellationToken cancellationToken = default)
    {
        var challengeId = await RequireActiveChallengeId(cancellationToken);
        await repository.AddFullCoverageTokenAsync(new FullCoverageTokenCreateDto(Guid.NewGuid(), challengeId, request.ParticipantId, request.TargetDate, request.ReasonCategory, request.AssignedByAdminId, request.Notes), cancellationToken);
    }

    public async Task<IReadOnlyList<CoupleRankingRow>> GetGeneralRankingAsync(DateOnly throughDate, CancellationToken cancellationToken = default)
    {
        var challengeId = await RequireActiveChallengeId(cancellationToken);
        var snapshot = await repository.GetChallengeSnapshotAsync(challengeId, cancellationToken);
        return RankingService.CalculateGeneralRanking(snapshot, throughDate);
    }

    public async Task<ChallengeSnapshotDto> GetActiveChallengeAsync(CancellationToken cancellationToken = default)
    {
        var challengeId = await RequireActiveChallengeId(cancellationToken);
        return await repository.GetChallengeSnapshotAsync(challengeId, cancellationToken);
    }

    private async Task<Guid> RequireActiveChallengeId(CancellationToken cancellationToken)
    {
        var challengeId = await repository.GetActiveChallengeIdAsync(cancellationToken);
        return challengeId ?? throw new InvalidOperationException("No active challenge exists.");
    }
}
