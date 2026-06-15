using GymChall.Infrastructure.Persistence;
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
}
