using GymChall.Application.Challenges;

namespace GymChall.Application.Abstractions;

public interface IGymChallRepository
{
    Task CreateChallengeAsync(ChallengeCreateDto challenge, CancellationToken cancellationToken = default);
    Task AddParticipantAsync(ParticipantCreateDto participant, CancellationToken cancellationToken = default);
    Task AddCoupleAsync(CoupleCreateDto couple, CancellationToken cancellationToken = default);
    Task AddCheckInAsync(CheckInCreateDto checkIn, CancellationToken cancellationToken = default);
    Task AddFullCoverageTokenAsync(FullCoverageTokenCreateDto token, CancellationToken cancellationToken = default);
    Task<ChallengeSnapshotDto> GetChallengeSnapshotAsync(Guid challengeId, CancellationToken cancellationToken = default);
    Task<Guid?> GetActiveChallengeIdAsync(CancellationToken cancellationToken = default);
}
