using GymChall.Application.Challenges;
using GymChall.Infrastructure.Persistence;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace GymChall.Infrastructure.Tests.Persistence;

public sealed class GymChallRepositoryAdminTests
{
    [Fact]
    public async Task Lists_participants_couples_and_settings_for_ui()
    {
        await using var fixture = await DbFixture.CreateSeededAsync();
        var repository = new GymChallRepository(fixture.Db);

        var participants = await repository.ListParticipantsAsync();
        var couples = await repository.ListCouplesAsync(SeedData.ChallengeId);
        var settings = await repository.GetSettingsAsync(SeedData.ChallengeId);

        Assert.Equal(6, participants.Count);
        Assert.Equal(3, couples.Count);
        Assert.All(couples, couple => Assert.Equal(2, couple.Participants.Count));
        Assert.Equal(45, settings.GymMinimumMinutes);
    }

    [Fact]
    public async Task Add_participant_rejects_duplicate_username()
    {
        await using var fixture = await DbFixture.CreateSeededAsync();
        var repository = new GymChallRepository(fixture.Db);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            repository.AddParticipantAsync(new ParticipantCreateDto(Guid.NewGuid(), "Rafa Dos", "rafa", ParticipantRoleDto.Participant, "male")));

        Assert.Contains("username", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Add_couple_uses_challenge_start_date_and_rejects_same_participant_twice()
    {
        await using var fixture = await DbFixture.CreateSeededAsync();
        var repository = new GymChallRepository(fixture.Db);
        var first = Guid.Parse("20000000-0000-0000-0000-000000000001");
        var second = Guid.Parse("20000000-0000-0000-0000-000000000002");
        var coupleId = Guid.Parse("20000000-0000-0000-0000-000000000003");

        await repository.AddParticipantAsync(new ParticipantCreateDto(first, "Ana", "ana", ParticipantRoleDto.Participant, "female"));
        await repository.AddParticipantAsync(new ParticipantCreateDto(second, "Luis", "luis", ParticipantRoleDto.Participant, "male"));
        await repository.AddCoupleAsync(new CoupleCreateDto(coupleId, SeedData.ChallengeId, "Ana + Luis", first, second));

        var memberships = await fixture.Db.CoupleMemberships
            .Where(x => x.CoupleId == coupleId)
            .ToListAsync();

        Assert.Equal(2, memberships.Count);
        Assert.All(memberships, membership => Assert.Equal(new DateOnly(2026, 6, 15), membership.StartsOn));
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            repository.AddCoupleAsync(new CoupleCreateDto(Guid.NewGuid(), SeedData.ChallengeId, "Ana + Ana", first, first)));
    }

    [Fact]
    public async Task Invalidate_checkin_marks_rejected_and_writes_audit_log()
    {
        await using var fixture = await DbFixture.CreateSeededAsync();
        var repository = new GymChallRepository(fixture.Db);
        var checkInId = Guid.Parse("30000000-0000-0000-0000-000000000001");

        await repository.AddCheckInAsync(new CheckInCreateDto(
            checkInId,
            SeedData.ChallengeId,
            SeedData.RafaId,
            new DateTimeOffset(2026, 6, 15, 5, 5, 0, TimeSpan.FromHours(-4)),
            new DateOnly(2026, 6, 15),
            CheckInTypeDto.GymMorning,
            45,
            SeedData.RafaId,
            "5am"));

        await repository.InvalidateCheckInAsync(checkInId, SeedData.RafaId, "acuerdo del grupo");

        var checkIn = await fixture.Db.CheckIns.SingleAsync(x => x.Id == checkInId);
        var audit = await fixture.Db.AuditLogs.SingleAsync(x => x.EntityId == checkInId);
        Assert.Equal(RecordStatus.Rejected, checkIn.Status);
        Assert.Equal("invalidate_check_in", audit.Action);
        Assert.Contains("acuerdo del grupo", audit.NewValueJson);
    }

    [Fact]
    public async Task Invalidate_token_marks_rejected_and_writes_audit_log()
    {
        await using var fixture = await DbFixture.CreateSeededAsync();
        var repository = new GymChallRepository(fixture.Db);
        var tokenId = Guid.Parse("30000000-0000-0000-0000-000000000002");

        await repository.AddFullCoverageTokenAsync(new FullCoverageTokenCreateDto(
            tokenId,
            SeedData.ChallengeId,
            SeedData.ClariId,
            new DateOnly(2026, 6, 16),
            ExceptionTokenTypeDto.Health,
            ExceptionReasonCategoryDto.Health,
            ExceptionTokenStatusDto.Applied,
            SeedData.RafaId,
            "salud"));

        await repository.InvalidateFullCoverageTokenAsync(tokenId, SeedData.RafaId, "error de carga");

        var token = await fixture.Db.ExceptionTokens.SingleAsync(x => x.Id == tokenId);
        var audit = await fixture.Db.AuditLogs.SingleAsync(x => x.EntityId == tokenId);
        Assert.Equal(ExceptionTokenStatus.Rejected, token.Status);
        Assert.Equal("invalidate_token", audit.Action);
        Assert.Contains("error de carga", audit.NewValueJson);
    }

    [Fact]
    public async Task Lists_recent_checkins_with_participant_names_status_and_limit()
    {
        await using var fixture = await DbFixture.CreateSeededAsync();
        var repository = new GymChallRepository(fixture.Db);
        var firstId = Guid.Parse("40000000-0000-0000-0000-000000000001");
        var secondId = Guid.Parse("40000000-0000-0000-0000-000000000002");

        await repository.AddCheckInAsync(new CheckInCreateDto(
            firstId,
            SeedData.ChallengeId,
            SeedData.RafaId,
            new DateTimeOffset(2026, 6, 15, 5, 5, 0, TimeSpan.FromHours(-4)),
            new DateOnly(2026, 6, 15),
            CheckInTypeDto.GymMorning,
            45,
            SeedData.RafaId,
            "5am"));
        await repository.AddCheckInAsync(new CheckInCreateDto(
            secondId,
            SeedData.ChallengeId,
            SeedData.ClariId,
            new DateTimeOffset(2026, 6, 16, 19, 0, 0, TimeSpan.FromHours(-4)),
            new DateOnly(2026, 6, 16),
            CheckInTypeDto.GymSameDayRecovery,
            45,
            SeedData.ClariId,
            "tarde"));

        var rows = await repository.ListRecentCheckInsAsync(SeedData.ChallengeId, limit: 1);

        var row = Assert.Single(rows);
        Assert.Equal(secondId, row.Id);
        Assert.Equal("Clari", row.ParticipantName);
        Assert.Equal(CheckInTypeDto.GymSameDayRecovery, row.Type);
        Assert.Equal("Valid", row.Status);
        Assert.Equal("tarde", row.Notes);
    }

    [Fact]
    public async Task Lists_recent_tokens_with_participant_names_status_and_limit()
    {
        await using var fixture = await DbFixture.CreateSeededAsync();
        var repository = new GymChallRepository(fixture.Db);
        var firstId = Guid.Parse("40000000-0000-0000-0000-000000000003");
        var secondId = Guid.Parse("40000000-0000-0000-0000-000000000004");

        await repository.AddFullCoverageTokenAsync(new FullCoverageTokenCreateDto(
            firstId,
            SeedData.ChallengeId,
            SeedData.RafaId,
            new DateOnly(2026, 6, 15),
            ExceptionTokenTypeDto.Health,
            ExceptionReasonCategoryDto.Health,
            ExceptionTokenStatusDto.Applied,
            SeedData.RafaId,
            "salud"));
        await repository.AddFullCoverageTokenAsync(new FullCoverageTokenCreateDto(
            secondId,
            SeedData.ChallengeId,
            SeedData.ClariId,
            new DateOnly(2026, 6, 16),
            ExceptionTokenTypeDto.Health,
            ExceptionReasonCategoryDto.Period,
            ExceptionTokenStatusDto.Applied,
            SeedData.RafaId,
            "periodo"));

        var rows = await repository.ListRecentFullCoverageTokensAsync(SeedData.ChallengeId, limit: 1);

        var row = Assert.Single(rows);
        Assert.Equal(secondId, row.Id);
        Assert.Equal("Clari", row.ParticipantName);
        Assert.Equal(ExceptionReasonCategoryDto.Period, row.ReasonCategory);
        Assert.Equal("Applied", row.Status);
        Assert.Equal("periodo", row.Notes);
    }

    private sealed class DbFixture : IAsyncDisposable
    {
        private readonly SqliteConnection connection;

        private DbFixture(SqliteConnection connection, GymChallDbContext db)
        {
            this.connection = connection;
            Db = db;
        }

        public GymChallDbContext Db { get; }

        public static async Task<DbFixture> CreateSeededAsync()
        {
            var connection = new SqliteConnection("DataSource=:memory:");
            await connection.OpenAsync();
            var options = new DbContextOptionsBuilder<GymChallDbContext>()
                .UseSqlite(connection)
                .Options;

            var db = new GymChallDbContext(options);
            await db.Database.EnsureCreatedAsync();
            await SeedData.EnsureSeededAsync(db);

            return new DbFixture(connection, db);
        }

        public async ValueTask DisposeAsync()
        {
            await Db.DisposeAsync();
            await connection.DisposeAsync();
        }
    }
}
