using GymChall.Infrastructure.Persistence;
using GymChall.Infrastructure.Persistence.Entities;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace GymChall.Infrastructure.Tests.Persistence;

public sealed class SeedDataTests
{
    [Fact]
    public async Task Seeds_initial_challenge_participants_and_couples_once()
    {
        await using var connection = new SqliteConnection("DataSource=:memory:");
        await connection.OpenAsync();

        var options = new DbContextOptionsBuilder<GymChallDbContext>()
            .UseSqlite(connection)
            .Options;

        await using var db = new GymChallDbContext(options);
        await db.Database.EnsureCreatedAsync();

        await SeedData.EnsureSeededAsync(db);
        await SeedData.EnsureSeededAsync(db);

        Assert.Equal(1, await db.Challenges.CountAsync());
        Assert.Equal(6, await db.Participants.CountAsync());
        Assert.Equal(3, await db.Couples.CountAsync());
        Assert.Equal(6, await db.CoupleMemberships.CountAsync());
        Assert.Equal(1, await db.ChallengeSettings.CountAsync());
    }

    [Fact]
    public async Task Corrects_existing_morning_checkins_that_were_stored_as_recovery()
    {
        await using var connection = new SqliteConnection("DataSource=:memory:");
        await connection.OpenAsync();

        var options = new DbContextOptionsBuilder<GymChallDbContext>()
            .UseSqlite(connection)
            .Options;

        await using var db = new GymChallDbContext(options);
        await db.Database.EnsureCreatedAsync();
        await SeedData.EnsureSeededAsync(db);

        var checkInId = Guid.Parse("99999999-0000-0000-0000-000000000001");
        db.CheckIns.Add(new CheckInEntity
        {
            Id = checkInId,
            ChallengeId = SeedData.ChallengeId,
            ParticipantId = SeedData.ClariId,
            OccurredAt = new DateTimeOffset(2026, 6, 16, 8, 10, 0, TimeSpan.Zero),
            ActivityDate = new DateOnly(2026, 6, 16),
            Type = CheckInType.GymSameDayRecovery,
            DurationMinutes = 0,
            CreatedByParticipantId = SeedData.ClariId,
            Notes = "payload utc"
        });
        await db.SaveChangesAsync();

        await SeedData.EnsureSeededAsync(db);

        var checkIn = await db.CheckIns.SingleAsync(x => x.Id == checkInId);
        Assert.Equal(CheckInType.GymMorning, checkIn.Type);
    }
}
