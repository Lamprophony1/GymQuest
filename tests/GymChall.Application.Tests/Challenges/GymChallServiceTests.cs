using GymChall.Application.Abstractions;
using GymChall.Application.Auth;
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

        await service.RegisterCheckInAsync(new RegisterCheckInRequest(participantId, new DateTimeOffset(2026, 6, 15, 8, 5, 0, TimeSpan.Zero), null, participantId, "5am"));

        Assert.NotNull(repository.LastCheckIn);
        Assert.Equal(new DateOnly(2026, 6, 15), repository.LastCheckIn.ActivityDate);
        Assert.Equal(CheckInTypeDto.GymMorning, repository.LastCheckIn.Type);
    }

    [Fact]
    public async Task Register_checkin_rejects_duplicate_valid_coverage_for_same_day()
    {
        var challengeId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var participantId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var repository = new FakeRepository(challengeId)
        {
            CheckIns =
            [
                new CheckInDto(Guid.NewGuid(), challengeId, participantId, new DateOnly(2026, 6, 15), CheckInTypeDto.GymMorning, 0)
            ]
        };
        var service = new GymChallService(repository);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.RegisterCheckInAsync(new RegisterCheckInRequest(
                participantId,
                new DateTimeOffset(2026, 6, 15, 5, 30, 0, TimeSpan.FromHours(-4)),
                null,
                participantId,
                null)));

        Assert.Contains("ya tiene cobertura", ex.Message);
        Assert.Null(repository.LastCheckIn);
    }

    private sealed class FakeRepository(Guid activeChallengeId) : IGymChallRepository
    {
        private readonly Guid participantId = Guid.Parse("22222222-2222-2222-2222-222222222222");

        public IReadOnlyList<CheckInDto> CheckIns { get; set; } = Array.Empty<CheckInDto>();
        public IReadOnlyList<FullCoverageTokenDto> Tokens { get; set; } = Array.Empty<FullCoverageTokenDto>();
        public CheckInCreateDto? LastCheckIn { get; private set; }
        public Task CreateChallengeAsync(ChallengeCreateDto challenge, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task AddParticipantAsync(ParticipantCreateDto participant, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task AddCoupleAsync(CoupleCreateDto couple, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task AddFullCoverageTokenAsync(FullCoverageTokenCreateDto token, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task ApplyFullCoverageTokenAsync(Guid tokenId, Guid participantId, DateOnly targetDate, Guid actorParticipantId, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task<AuthCredentialDto?> GetAuthCredentialAsync(Guid participantId, CancellationToken cancellationToken = default) => Task.FromResult<AuthCredentialDto?>(null);
        public Task UpsertAuthCredentialAsync(AuthCredentialDto credential, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task<IReadOnlyList<ParticipantSummaryDto>> ListParticipantsAsync(CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<ParticipantSummaryDto>>(Array.Empty<ParticipantSummaryDto>());
        public Task<IReadOnlyList<CoupleSummaryDto>> ListCouplesAsync(Guid challengeId, CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<CoupleSummaryDto>>(Array.Empty<CoupleSummaryDto>());
        public Task<IReadOnlyList<AdminCheckInSummaryDto>> ListRecentCheckInsAsync(Guid challengeId, int limit, CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<AdminCheckInSummaryDto>>(Array.Empty<AdminCheckInSummaryDto>());
        public Task<IReadOnlyList<AdminCheckInSummaryDto>> ListCalendarCheckInsAsync(Guid challengeId, DateOnly from, DateOnly to, CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<AdminCheckInSummaryDto>>(Array.Empty<AdminCheckInSummaryDto>());
        public Task<IReadOnlyList<AdminTokenSummaryDto>> ListRecentFullCoverageTokensAsync(Guid challengeId, int limit, CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<AdminTokenSummaryDto>>(Array.Empty<AdminTokenSummaryDto>());
        public Task<ChallengeSettingsDto> GetSettingsAsync(Guid challengeId, CancellationToken cancellationToken = default) => Task.FromResult(new ChallengeSettingsDto(4m, 3m, 2m, 1.5m, 1m, 12m, 7m, 4m, 45, new TimeOnly(5, 0), new TimeOnly(6, 0)));
        public Task<ChallengeSnapshotDto> GetChallengeSnapshotAsync(Guid challengeId, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(new ChallengeSnapshotDto(
                new ChallengeDto(challengeId, "Reto", new DateOnly(2026, 6, 15), new DateOnly(2026, 9, 15), participantId, "America/Asuncion"),
                Domain.Scoring.ChallengeSettings.Default,
                new[] { new ParticipantDto(participantId, "Rafa", "rafa", ParticipantRoleDto.Admin, "male", true) },
                Array.Empty<CoupleDto>(),
                CheckIns,
                Tokens));
        }
        public Task<Guid?> GetActiveChallengeIdAsync(CancellationToken cancellationToken = default) => Task.FromResult<Guid?>(activeChallengeId);
        public Task InvalidateCheckInAsync(Guid checkInId, Guid actorParticipantId, string? reason, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task InvalidateFullCoverageTokenAsync(Guid tokenId, Guid actorParticipantId, string? reason, CancellationToken cancellationToken = default) => Task.CompletedTask;

        public Task AddCheckInAsync(CheckInCreateDto checkIn, CancellationToken cancellationToken = default)
        {
            LastCheckIn = checkIn;
            return Task.CompletedTask;
        }
    }
}
