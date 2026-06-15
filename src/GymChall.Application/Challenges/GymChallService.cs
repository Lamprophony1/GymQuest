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

    public async Task<IReadOnlyList<WeeklyRankingDto>> GetWeeklyRankingsAsync(DateOnly throughDate, CancellationToken cancellationToken = default)
    {
        var challengeId = await RequireActiveChallengeId(cancellationToken);
        var snapshot = await repository.GetChallengeSnapshotAsync(challengeId, cancellationToken);
        return RankingService.CalculateWeeklyRankings(snapshot, throughDate);
    }

    public async Task<WeeklyRankingDto> GetWeeklyRankingAsync(DateOnly weekStartDate, DateOnly throughDate, CancellationToken cancellationToken = default)
    {
        var challengeId = await RequireActiveChallengeId(cancellationToken);
        var snapshot = await repository.GetChallengeSnapshotAsync(challengeId, cancellationToken);
        return RankingService.CalculateWeeklyRanking(snapshot, weekStartDate, throughDate);
    }

    public async Task<ChallengeSnapshotDto> GetActiveChallengeAsync(CancellationToken cancellationToken = default)
    {
        var challengeId = await RequireActiveChallengeId(cancellationToken);
        return await repository.GetChallengeSnapshotAsync(challengeId, cancellationToken);
    }

    public Task<IReadOnlyList<ParticipantSummaryDto>> ListParticipantsAsync(CancellationToken cancellationToken = default)
    {
        return repository.ListParticipantsAsync(cancellationToken);
    }

    public Task CreateParticipantAsync(CreateParticipantRequest request, CancellationToken cancellationToken = default)
    {
        return repository.AddParticipantAsync(new ParticipantCreateDto(Guid.NewGuid(), request.DisplayName, request.Username, request.Role, request.Gender), cancellationToken);
    }

    public async Task<IReadOnlyList<CoupleSummaryDto>> ListCouplesAsync(CancellationToken cancellationToken = default)
    {
        var challengeId = await RequireActiveChallengeId(cancellationToken);
        return await repository.ListCouplesAsync(challengeId, cancellationToken);
    }

    public async Task CreateCoupleAsync(CreateCoupleRequest request, CancellationToken cancellationToken = default)
    {
        var challengeId = await RequireActiveChallengeId(cancellationToken);
        await repository.AddCoupleAsync(new CoupleCreateDto(Guid.NewGuid(), challengeId, request.Name, request.FirstParticipantId, request.SecondParticipantId), cancellationToken);
    }

    public async Task<ChallengeSettingsDto> GetSettingsAsync(CancellationToken cancellationToken = default)
    {
        var challengeId = await RequireActiveChallengeId(cancellationToken);
        return await repository.GetSettingsAsync(challengeId, cancellationToken);
    }

    public Task InvalidateCheckInAsync(Guid checkInId, InvalidateRecordRequest request, CancellationToken cancellationToken = default)
    {
        return repository.InvalidateCheckInAsync(checkInId, request.ActorParticipantId, request.Reason, cancellationToken);
    }

    public Task InvalidateFullCoverageTokenAsync(Guid tokenId, InvalidateRecordRequest request, CancellationToken cancellationToken = default)
    {
        return repository.InvalidateFullCoverageTokenAsync(tokenId, request.ActorParticipantId, request.Reason, cancellationToken);
    }

    private async Task<Guid> RequireActiveChallengeId(CancellationToken cancellationToken)
    {
        var challengeId = await repository.GetActiveChallengeIdAsync(cancellationToken);
        return challengeId ?? throw new InvalidOperationException("No active challenge exists.");
    }
}
