using GymChall.Application.Abstractions;
using GymChall.Application.Challenges;

namespace GymChall.Application.Tests.Challenges;

public sealed class GymChallServiceAdminTests
{
    [Fact]
    public async Task Create_couple_uses_active_challenge()
    {
        var challengeId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var repository = new FakeRepository(challengeId);
        var service = new GymChallService(repository);
        var first = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var second = Guid.Parse("33333333-3333-3333-3333-333333333333");

        await service.CreateCoupleAsync(new CreateCoupleRequest("Rafa + Clari", first, second));

        Assert.NotNull(repository.LastCouple);
        Assert.Equal(challengeId, repository.LastCouple.ChallengeId);
        Assert.Equal(first, repository.LastCouple.FirstParticipantId);
        Assert.Equal(second, repository.LastCouple.SecondParticipantId);
    }

    [Fact]
    public async Task Get_weekly_rankings_uses_active_challenge_snapshot()
    {
        var challengeId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var repository = new FakeRepository(challengeId);
        var service = new GymChallService(repository);

        var rankings = await service.GetWeeklyRankingsAsync(new DateOnly(2026, 6, 15));

        Assert.Single(rankings);
        Assert.Equal(challengeId, repository.LastSnapshotChallengeId);
    }

    [Fact]
    public async Task Admin_recent_lists_use_active_challenge_and_cap_limit()
    {
        var challengeId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var repository = new FakeRepository(challengeId);
        var service = new GymChallService(repository);

        await service.ListRecentCheckInsAsync(500);
        await service.ListRecentFullCoverageTokensAsync(0);

        Assert.Equal(challengeId, repository.LastCheckInListChallengeId);
        Assert.Equal(100, repository.LastCheckInListLimit);
        Assert.Equal(challengeId, repository.LastTokenListChallengeId);
        Assert.Equal(50, repository.LastTokenListLimit);
    }

    private sealed class FakeRepository(Guid activeChallengeId) : IGymChallRepository
    {
        public CoupleCreateDto? LastCouple { get; private set; }
        public Guid? LastSnapshotChallengeId { get; private set; }
        public Guid? LastCheckInListChallengeId { get; private set; }
        public int? LastCheckInListLimit { get; private set; }
        public Guid? LastTokenListChallengeId { get; private set; }
        public int? LastTokenListLimit { get; private set; }

        public Task CreateChallengeAsync(ChallengeCreateDto challenge, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task AddParticipantAsync(ParticipantCreateDto participant, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task AddCheckInAsync(CheckInCreateDto checkIn, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task AddFullCoverageTokenAsync(FullCoverageTokenCreateDto token, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task<IReadOnlyList<ParticipantSummaryDto>> ListParticipantsAsync(CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<ParticipantSummaryDto>>(Array.Empty<ParticipantSummaryDto>());
        public Task<IReadOnlyList<CoupleSummaryDto>> ListCouplesAsync(Guid challengeId, CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<CoupleSummaryDto>>(Array.Empty<CoupleSummaryDto>());
        public Task<IReadOnlyList<AdminCheckInSummaryDto>> ListRecentCheckInsAsync(Guid challengeId, int limit, CancellationToken cancellationToken = default)
        {
            LastCheckInListChallengeId = challengeId;
            LastCheckInListLimit = limit;
            return Task.FromResult<IReadOnlyList<AdminCheckInSummaryDto>>(Array.Empty<AdminCheckInSummaryDto>());
        }
        public Task<IReadOnlyList<AdminTokenSummaryDto>> ListRecentFullCoverageTokensAsync(Guid challengeId, int limit, CancellationToken cancellationToken = default)
        {
            LastTokenListChallengeId = challengeId;
            LastTokenListLimit = limit;
            return Task.FromResult<IReadOnlyList<AdminTokenSummaryDto>>(Array.Empty<AdminTokenSummaryDto>());
        }
        public Task<ChallengeSettingsDto> GetSettingsAsync(Guid challengeId, CancellationToken cancellationToken = default) => Task.FromResult(new ChallengeSettingsDto(4m, 3m, 2m, 1.5m, 1m, 12m, 7m, 4m, 45, new TimeOnly(4, 50), new TimeOnly(5, 30)));
        public Task<Guid?> GetActiveChallengeIdAsync(CancellationToken cancellationToken = default) => Task.FromResult<Guid?>(activeChallengeId);
        public Task InvalidateCheckInAsync(Guid checkInId, Guid actorParticipantId, string? reason, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task InvalidateFullCoverageTokenAsync(Guid tokenId, Guid actorParticipantId, string? reason, CancellationToken cancellationToken = default) => Task.CompletedTask;

        public Task AddCoupleAsync(CoupleCreateDto couple, CancellationToken cancellationToken = default)
        {
            LastCouple = couple;
            return Task.CompletedTask;
        }

        public Task<ChallengeSnapshotDto> GetChallengeSnapshotAsync(Guid challengeId, CancellationToken cancellationToken = default)
        {
            LastSnapshotChallengeId = challengeId;
            var participantOne = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var participantTwo = Guid.Parse("33333333-3333-3333-3333-333333333333");
            var coupleId = Guid.Parse("44444444-4444-4444-4444-444444444444");

            return Task.FromResult(new ChallengeSnapshotDto(
                new ChallengeDto(challengeId, "Reto", new DateOnly(2026, 6, 15), new DateOnly(2026, 6, 19), participantOne, "America/Asuncion"),
                Domain.Scoring.ChallengeSettings.Default,
                new[]
                {
                    new ParticipantDto(participantOne, "Rafa", "rafa", ParticipantRoleDto.Admin, "male", true),
                    new ParticipantDto(participantTwo, "Clari", "clari", ParticipantRoleDto.Participant, "female", true)
                },
                new[]
                {
                    new CoupleDto(coupleId, challengeId, "Rafa + Clari", new[] { participantOne, participantTwo }, true)
                },
                Array.Empty<CheckInDto>(),
                Array.Empty<FullCoverageTokenDto>()));
        }
    }
}
