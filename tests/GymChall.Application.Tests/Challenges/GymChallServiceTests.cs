using GymChall.Application.Abstractions;
using GymChall.Application.Challenges;

namespace GymChall.Application.Tests.Challenges;

public sealed class GymChallServiceTests
{
    [Fact]
    public async Task Register_checkin_uses_active_challenge_and_creates_valid_request()
    {
        var repository = new FakeRepository(Guid.Parse("11111111-1111-1111-1111-111111111111"));
        var service = new GymChallService(repository);
        var participantId = Guid.Parse("22222222-2222-2222-2222-222222222222");

        await service.RegisterCheckInAsync(new RegisterCheckInRequest(participantId, new DateTimeOffset(2026, 6, 15, 5, 5, 0, TimeSpan.FromHours(-4)), CheckInTypeDto.GymMorning, 45, participantId, "5am"));

        Assert.NotNull(repository.LastCheckIn);
        Assert.Equal(new DateOnly(2026, 6, 15), repository.LastCheckIn.ActivityDate);
        Assert.Equal(CheckInTypeDto.GymMorning, repository.LastCheckIn.Type);
    }

    private sealed class FakeRepository(Guid activeChallengeId) : IGymChallRepository
    {
        public CheckInCreateDto? LastCheckIn { get; private set; }
        public Task CreateChallengeAsync(ChallengeCreateDto challenge, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task AddParticipantAsync(ParticipantCreateDto participant, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task AddCoupleAsync(CoupleCreateDto couple, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task AddFullCoverageTokenAsync(FullCoverageTokenCreateDto token, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task<ChallengeSnapshotDto> GetChallengeSnapshotAsync(Guid challengeId, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<Guid?> GetActiveChallengeIdAsync(CancellationToken cancellationToken = default) => Task.FromResult<Guid?>(activeChallengeId);

        public Task AddCheckInAsync(CheckInCreateDto checkIn, CancellationToken cancellationToken = default)
        {
            LastCheckIn = checkIn;
            return Task.CompletedTask;
        }
    }
}
