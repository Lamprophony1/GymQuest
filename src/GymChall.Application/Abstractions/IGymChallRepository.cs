using GymChall.Application.Challenges;

namespace GymChall.Application.Abstractions;

public interface IGymChallRepository
{
    Task CreateChallengeAsync(ChallengeCreateDto challenge, CancellationToken cancellationToken = default);
    Task AddParticipantAsync(ParticipantCreateDto participant, CancellationToken cancellationToken = default);
    Task AddCoupleAsync(CoupleCreateDto couple, CancellationToken cancellationToken = default);
    Task AddCheckInAsync(CheckInCreateDto checkIn, CancellationToken cancellationToken = default);
    Task AddFullCoverageTokenAsync(FullCoverageTokenCreateDto token, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ParticipantSummaryDto>> ListParticipantsAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<CoupleSummaryDto>> ListCouplesAsync(Guid challengeId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<AdminCheckInSummaryDto>> ListRecentCheckInsAsync(Guid challengeId, int limit, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<AdminTokenSummaryDto>> ListRecentFullCoverageTokensAsync(Guid challengeId, int limit, CancellationToken cancellationToken = default);
    Task<ChallengeSettingsDto> GetSettingsAsync(Guid challengeId, CancellationToken cancellationToken = default);
    Task<ChallengeSnapshotDto> GetChallengeSnapshotAsync(Guid challengeId, CancellationToken cancellationToken = default);
    Task<Guid?> GetActiveChallengeIdAsync(CancellationToken cancellationToken = default);
    Task InvalidateCheckInAsync(Guid checkInId, Guid actorParticipantId, string? reason, CancellationToken cancellationToken = default);
    Task InvalidateFullCoverageTokenAsync(Guid tokenId, Guid actorParticipantId, string? reason, CancellationToken cancellationToken = default);
}
