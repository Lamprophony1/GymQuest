using GymChall.Application.Abstractions;
using GymChall.Application.Auth;
using GymChall.Application.Challenges;
using GymChall.Domain.Scoring;

namespace GymChall.Application.Tests.Auth;

public sealed class PinAuthServiceTests
{
    private static readonly Guid RafaId = Guid.Parse("10000000-0000-0000-0000-000000000101");
    private static readonly Guid ClariId = Guid.Parse("10000000-0000-0000-0000-000000000102");
    private static readonly DateTimeOffset Now = new(2026, 6, 17, 10, 0, 0, TimeSpan.Zero);

    [Fact]
    public async Task Login_with_valid_pin_returns_participant_and_resets_failed_attempts()
    {
        var repository = new FakeRepository();
        var hasher = new PinHasher();
        repository.Credentials[RafaId] = new AuthCredentialDto(RafaId, hasher.Hash("123456"), 2, null, Now.AddDays(-1));
        var service = new PinAuthService(repository, hasher);

        var participant = await service.LoginAsync(new LoginRequest(RafaId, "123456"), Now);

        Assert.Equal("Rafa", participant.DisplayName);
        Assert.Equal(ParticipantRoleDto.Admin, participant.Role);
        Assert.Equal(0, repository.Credentials[RafaId].FailedAttemptCount);
        Assert.Null(repository.Credentials[RafaId].LockedUntil);
    }

    [Fact]
    public async Task Login_with_wrong_pin_increments_failed_attempts()
    {
        var repository = new FakeRepository();
        var hasher = new PinHasher();
        repository.Credentials[RafaId] = new AuthCredentialDto(RafaId, hasher.Hash("123456"), 0, null, Now.AddDays(-1));
        var service = new PinAuthService(repository, hasher);

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.LoginAsync(new LoginRequest(RafaId, "9999"), Now));

        Assert.Equal(1, repository.Credentials[RafaId].FailedAttemptCount);
        Assert.Null(repository.Credentials[RafaId].LockedUntil);
    }

    [Fact]
    public async Task Login_locks_for_one_minute_after_five_failed_attempts()
    {
        var repository = new FakeRepository();
        var hasher = new PinHasher();
        repository.Credentials[RafaId] = new AuthCredentialDto(RafaId, hasher.Hash("123456"), 4, null, Now.AddDays(-1));
        var service = new PinAuthService(repository, hasher);

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.LoginAsync(new LoginRequest(RafaId, "9999"), Now));

        Assert.Equal(5, repository.Credentials[RafaId].FailedAttemptCount);
        Assert.Equal(Now.AddMinutes(1), repository.Credentials[RafaId].LockedUntil);
    }

    [Fact]
    public async Task Set_pin_requires_admin_actor()
    {
        var repository = new FakeRepository();
        var service = new PinAuthService(repository, new PinHasher());

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.SetPinAsync(ClariId, "1234", ClariId, Now));
    }

    [Fact]
    public async Task Set_pin_stores_hash_instead_of_plain_pin()
    {
        var repository = new FakeRepository();
        var hasher = new PinHasher();
        var service = new PinAuthService(repository, hasher);

        await service.SetPinAsync(ClariId, "2468", RafaId, Now);

        var credential = repository.Credentials[ClariId];
        Assert.NotEqual("2468", credential.PinHash);
        Assert.True(hasher.Verify("2468", credential.PinHash));
        Assert.Equal(0, credential.FailedAttemptCount);
        Assert.Null(credential.LockedUntil);
    }

    [Fact]
    public async Task Change_own_pin_requires_current_pin_and_stores_new_hash()
    {
        var repository = new FakeRepository();
        var hasher = new PinHasher();
        repository.Credentials[ClariId] = new AuthCredentialDto(ClariId, hasher.Hash("2468"), 2, null, Now.AddDays(-1));
        var service = new PinAuthService(repository, hasher);

        await service.ChangeOwnPinAsync(ClariId, "2468", "135790", Now);

        var credential = repository.Credentials[ClariId];
        Assert.True(hasher.Verify("135790", credential.PinHash));
        Assert.False(hasher.Verify("2468", credential.PinHash));
        Assert.Equal(0, credential.FailedAttemptCount);
        Assert.Null(credential.LockedUntil);
        Assert.Equal(Now, credential.PinUpdatedAt);
    }

    [Fact]
    public async Task Change_own_pin_with_wrong_current_pin_increments_failed_attempts()
    {
        var repository = new FakeRepository();
        var hasher = new PinHasher();
        repository.Credentials[ClariId] = new AuthCredentialDto(ClariId, hasher.Hash("2468"), 0, null, Now.AddDays(-1));
        var service = new PinAuthService(repository, hasher);

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.ChangeOwnPinAsync(ClariId, "1111", "135790", Now));

        Assert.Equal(1, repository.Credentials[ClariId].FailedAttemptCount);
        Assert.True(hasher.Verify("2468", repository.Credentials[ClariId].PinHash));
    }

    private sealed class FakeRepository : IGymChallRepository
    {
        private readonly List<ParticipantSummaryDto> participants =
        [
            new(RafaId, "Rafa", "rafa", ParticipantRoleDto.Admin, "male", true),
            new(ClariId, "Clari", "clari", ParticipantRoleDto.Participant, "female", true)
        ];

        public Dictionary<Guid, AuthCredentialDto> Credentials { get; } = [];

        public Task<IReadOnlyList<ParticipantSummaryDto>> ListParticipantsAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<ParticipantSummaryDto>>(participants);

        public Task<AuthCredentialDto?> GetAuthCredentialAsync(Guid participantId, CancellationToken cancellationToken = default)
        {
            Credentials.TryGetValue(participantId, out var credential);
            return Task.FromResult(credential);
        }

        public Task UpsertAuthCredentialAsync(AuthCredentialDto credential, CancellationToken cancellationToken = default)
        {
            Credentials[credential.ParticipantId] = credential;
            return Task.CompletedTask;
        }

        public Task<ParticipantProfileDto?> GetParticipantProfileAsync(Guid participantId, CancellationToken cancellationToken = default) =>
            Task.FromResult<ParticipantProfileDto?>(null);

        public Task UpdateParticipantProfileAsync(Guid participantId, double? weightKg, double? heightCm, CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task<Guid?> GetActiveChallengeIdAsync(CancellationToken cancellationToken = default) => Task.FromResult<Guid?>(Guid.NewGuid());
        public Task CreateChallengeAsync(ChallengeCreateDto challenge, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task AddParticipantAsync(ParticipantCreateDto participant, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task AddCoupleAsync(CoupleCreateDto couple, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task AddCheckInAsync(CheckInCreateDto checkIn, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task AddFullCoverageTokenAsync(FullCoverageTokenCreateDto token, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task ApplyFullCoverageTokenAsync(Guid tokenId, Guid participantId, DateOnly targetDate, Guid actorParticipantId, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task<IReadOnlyList<CoupleSummaryDto>> ListCouplesAsync(Guid challengeId, CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<CoupleSummaryDto>>(Array.Empty<CoupleSummaryDto>());
        public Task<IReadOnlyList<AdminCheckInSummaryDto>> ListRecentCheckInsAsync(Guid challengeId, int limit, CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<AdminCheckInSummaryDto>>(Array.Empty<AdminCheckInSummaryDto>());
        public Task<IReadOnlyList<AdminCheckInSummaryDto>> ListCalendarCheckInsAsync(Guid challengeId, DateOnly from, DateOnly to, CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<AdminCheckInSummaryDto>>(Array.Empty<AdminCheckInSummaryDto>());
        public Task<IReadOnlyList<WeeklyCalendarEventDto>> ListWeeklyCalendarEventsAsync(Guid challengeId, DateOnly from, DateOnly to, CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<WeeklyCalendarEventDto>>(Array.Empty<WeeklyCalendarEventDto>());
        public Task<IReadOnlyList<AdminTokenSummaryDto>> ListRecentFullCoverageTokensAsync(Guid challengeId, int limit, CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<AdminTokenSummaryDto>>(Array.Empty<AdminTokenSummaryDto>());
        public Task<ChallengeSettingsDto> GetSettingsAsync(Guid challengeId, CancellationToken cancellationToken = default) => Task.FromResult(new ChallengeSettingsDto(4m, 3m, 2m, 1.5m, 1m, 12m, 7m, 4m, 45, new TimeOnly(5, 0), new TimeOnly(6, 0)));
        public Task<ChallengeSnapshotDto> GetChallengeSnapshotAsync(Guid challengeId, CancellationToken cancellationToken = default) => Task.FromResult(new ChallengeSnapshotDto(new ChallengeDto(challengeId, "Reto", new DateOnly(2026, 6, 15), new DateOnly(2026, 9, 15), RafaId, "America/Asuncion"), ChallengeSettings.Default, Array.Empty<ParticipantDto>(), Array.Empty<CoupleDto>(), Array.Empty<CheckInDto>(), Array.Empty<FullCoverageTokenDto>()));
        public Task InvalidateCheckInAsync(Guid checkInId, Guid actorParticipantId, string? reason, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task InvalidateFullCoverageTokenAsync(Guid tokenId, Guid actorParticipantId, string? reason, CancellationToken cancellationToken = default) => Task.CompletedTask;
    }
}
