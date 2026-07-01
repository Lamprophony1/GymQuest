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
    public async Task Invalidate_available_token_marks_rejected_and_writes_audit_log()
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
            ExceptionTokenStatusDto.Available,
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
    public async Task Invalidate_applied_token_returns_it_to_available_and_removes_calendar_event()
    {
        await using var fixture = await DbFixture.CreateSeededAsync();
        var repository = new GymChallRepository(fixture.Db);
        var tokenId = Guid.Parse("30000000-0000-0000-0000-000000000003");

        await repository.AddFullCoverageTokenAsync(new FullCoverageTokenCreateDto(
            tokenId,
            SeedData.ChallengeId,
            SeedData.ClariId,
            new DateOnly(2026, 6, 16),
            ExceptionTokenTypeDto.Mandatory,
            ExceptionReasonCategoryDto.MandatoryTrip,
            ExceptionTokenStatusDto.Applied,
            SeedData.RafaId,
            "feriado",
            "albirroja",
            "Albirroja coin"));

        await repository.InvalidateFullCoverageTokenAsync(tokenId, SeedData.RafaId, "se devuelve coin");

        var token = await fixture.Db.ExceptionTokens.SingleAsync(x => x.Id == tokenId);
        var audit = await fixture.Db.AuditLogs.SingleAsync(x => x.EntityId == tokenId);
        var calendarRows = await repository.ListWeeklyCalendarEventsAsync(
            SeedData.ChallengeId,
            new DateOnly(2026, 6, 15),
            new DateOnly(2026, 6, 21));

        Assert.Equal(ExceptionTokenStatus.Available, token.Status);
        Assert.Equal("albirroja", token.SpecialCode);
        Assert.Equal("Albirroja coin", token.SpecialLabel);
        Assert.Equal("invalidate_token", audit.Action);
        Assert.Contains("Applied", audit.OldValueJson);
        Assert.Contains("Available", audit.NewValueJson);
        Assert.DoesNotContain(calendarRows, row => row.Id == tokenId);
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
    public async Task Lists_calendar_checkins_by_activity_date_including_rejected_rows()
    {
        await using var fixture = await DbFixture.CreateSeededAsync();
        var repository = new GymChallRepository(fixture.Db);
        var validId = Guid.Parse("40000000-0000-0000-0000-000000000101");
        var rejectedId = Guid.Parse("40000000-0000-0000-0000-000000000102");
        var outsideId = Guid.Parse("40000000-0000-0000-0000-000000000103");

        await repository.AddCheckInAsync(new CheckInCreateDto(
            validId,
            SeedData.ChallengeId,
            SeedData.RafaId,
            new DateTimeOffset(2026, 6, 15, 5, 5, 0, TimeSpan.FromHours(-4)),
            new DateOnly(2026, 6, 15),
            CheckInTypeDto.GymMorning,
            0,
            SeedData.RafaId,
            "5am"));
        await repository.AddCheckInAsync(new CheckInCreateDto(
            rejectedId,
            SeedData.ChallengeId,
            SeedData.ClariId,
            new DateTimeOffset(2026, 6, 16, 19, 0, 0, TimeSpan.FromHours(-4)),
            new DateOnly(2026, 6, 16),
            CheckInTypeDto.GymSameDayRecovery,
            0,
            SeedData.ClariId,
            "tarde"));
        await repository.AddCheckInAsync(new CheckInCreateDto(
            outsideId,
            SeedData.ChallengeId,
            SeedData.ObelarId,
            new DateTimeOffset(2026, 6, 22, 5, 0, 0, TimeSpan.FromHours(-4)),
            new DateOnly(2026, 6, 22),
            CheckInTypeDto.GymMorning,
            0,
            SeedData.ObelarId,
            "otra semana"));
        await repository.InvalidateCheckInAsync(rejectedId, SeedData.RafaId, "test");

        var rows = await repository.ListCalendarCheckInsAsync(
            SeedData.ChallengeId,
            new DateOnly(2026, 6, 15),
            new DateOnly(2026, 6, 21));

        Assert.Equal(new[] { validId, rejectedId }, rows.Select(row => row.Id).ToArray());
        Assert.Contains(rows, row => row.Id == rejectedId && row.Status == "Rejected");
        Assert.DoesNotContain(rows, row => row.Id == outsideId);
    }

    [Fact]
    public async Task Lists_weekly_calendar_events_with_valid_checkins_and_applied_tokens_only()
    {
        await using var fixture = await DbFixture.CreateSeededAsync();
        var repository = new GymChallRepository(fixture.Db);
        var checkInId = Guid.Parse("40000000-0000-0000-0000-000000000201");
        var rejectedCheckInId = Guid.Parse("40000000-0000-0000-0000-000000000202");
        var appliedTokenId = Guid.Parse("40000000-0000-0000-0000-000000000203");
        var availableTokenId = Guid.Parse("40000000-0000-0000-0000-000000000204");

        await repository.AddCheckInAsync(new CheckInCreateDto(
            checkInId,
            SeedData.ChallengeId,
            SeedData.RafaId,
            new DateTimeOffset(2026, 6, 15, 5, 5, 0, TimeSpan.FromHours(-4)),
            new DateOnly(2026, 6, 15),
            CheckInTypeDto.GymMorning,
            0,
            SeedData.RafaId,
            "5am"));
        await repository.AddCheckInAsync(new CheckInCreateDto(
            rejectedCheckInId,
            SeedData.ChallengeId,
            SeedData.ClariId,
            new DateTimeOffset(2026, 6, 16, 19, 0, 0, TimeSpan.FromHours(-4)),
            new DateOnly(2026, 6, 16),
            CheckInTypeDto.GymSameDayRecovery,
            0,
            SeedData.ClariId,
            "anulada"));
        await repository.InvalidateCheckInAsync(rejectedCheckInId, SeedData.RafaId, "test");
        await repository.AddFullCoverageTokenAsync(new FullCoverageTokenCreateDto(
            appliedTokenId,
            SeedData.ChallengeId,
            SeedData.ClariId,
            new DateOnly(2026, 6, 16),
            ExceptionTokenTypeDto.Mandatory,
            ExceptionReasonCategoryDto.MandatoryTrip,
            ExceptionTokenStatusDto.Applied,
            SeedData.RafaId,
            "feriado",
            "albirroja",
            "Albirroja coin"));
        await repository.AddFullCoverageTokenAsync(new FullCoverageTokenCreateDto(
            availableTokenId,
            SeedData.ChallengeId,
            SeedData.CieliId,
            new DateOnly(2026, 6, 17),
            ExceptionTokenTypeDto.Health,
            ExceptionReasonCategoryDto.Health,
            ExceptionTokenStatusDto.Available,
            SeedData.RafaId,
            "disponible"));

        var rows = await repository.ListWeeklyCalendarEventsAsync(
            SeedData.ChallengeId,
            new DateOnly(2026, 6, 15),
            new DateOnly(2026, 6, 21));

        Assert.Equal(new[] { checkInId, appliedTokenId }, rows.Select(row => row.Id).ToArray());
        Assert.Contains(rows, row =>
            row.Id == checkInId &&
            row.Kind == WeeklyCalendarEventKindDto.CheckIn &&
            row.ParticipantName == "Rafa" &&
            row.Status == "Valid" &&
            row.CheckInType == CheckInTypeDto.GymMorning &&
            row.CoinType is null);
        Assert.Contains(rows, row =>
            row.Id == appliedTokenId &&
            row.Kind == WeeklyCalendarEventKindDto.Coin &&
            row.ParticipantName == "Clari" &&
            row.Status == "Applied" &&
            row.ActivityDate == new DateOnly(2026, 6, 16) &&
            row.CheckInType is null &&
            row.CoinType == ExceptionTokenTypeDto.Mandatory &&
            row.SpecialCode == "albirroja" &&
            row.SpecialLabel == "Albirroja coin");
        Assert.DoesNotContain(rows, row => row.Id == rejectedCheckInId);
        Assert.DoesNotContain(rows, row => row.Id == availableTokenId);
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

    [Fact]
    public async Task Lists_recent_tokens_with_special_metadata()
    {
        await using var fixture = await DbFixture.CreateSeededAsync();
        var repository = new GymChallRepository(fixture.Db);
        var tokenId = Guid.Parse("40000000-0000-0000-0000-000000000005");

        await repository.AddFullCoverageTokenAsync(new FullCoverageTokenCreateDto(
            tokenId,
            SeedData.ChallengeId,
            SeedData.RafaId,
            DateOnly.MinValue,
            ExceptionTokenTypeDto.Mandatory,
            ExceptionReasonCategoryDto.OtherApproved,
            ExceptionTokenStatusDto.Available,
            SeedData.RafaId,
            "feriado Paraguay",
            "albirroja",
            "Albirroja coin"));

        var rows = await repository.ListRecentFullCoverageTokensAsync(SeedData.ChallengeId, limit: 1);

        var row = Assert.Single(rows);
        Assert.Equal(tokenId, row.Id);
        Assert.Equal("albirroja", row.SpecialCode);
        Assert.Equal("Albirroja coin", row.SpecialLabel);
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
