using GymChall.Infrastructure.Persistence;
using GymChall.Infrastructure.Persistence.Entities;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace GymChall.Infrastructure.Tests.Persistence;

public sealed class GymChallDbContextTests
{
    [Fact]
    public async Task Can_create_schema_and_save_challenge_graph()
    {
        await using var connection = new SqliteConnection("DataSource=:memory:");
        await connection.OpenAsync();

        var options = new DbContextOptionsBuilder<GymChallDbContext>()
            .UseSqlite(connection)
            .Options;

        await using var db = new GymChallDbContext(options);
        await db.Database.EnsureCreatedAsync();

        var challengeId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var participantId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var coupleId = Guid.Parse("33333333-3333-3333-3333-333333333333");

        db.Challenges.Add(new ChallengeEntity
        {
            Id = challengeId,
            Name = "Reto Parejas - Rumbo a Septiembre",
            StartDate = new DateOnly(2026, 6, 15),
            EndDate = new DateOnly(2026, 9, 15),
            Status = ChallengeStatus.Active,
            AdminParticipantId = participantId,
            Timezone = "America/Asuncion"
        });

        db.Participants.Add(new ParticipantEntity
        {
            Id = participantId,
            DisplayName = "Rafa",
            Username = "rafa",
            Role = ParticipantRole.Admin,
            Active = true
        });

        db.Couples.Add(new CoupleEntity
        {
            Id = coupleId,
            ChallengeId = challengeId,
            Name = "Rafa + Clari",
            Active = true
        });

        db.CoupleMemberships.Add(new CoupleMembershipEntity
        {
            Id = Guid.Parse("44444444-4444-4444-4444-444444444444"),
            CoupleId = coupleId,
            ParticipantId = participantId,
            StartsOn = new DateOnly(2026, 6, 15)
        });

        await db.SaveChangesAsync();

        Assert.Equal(1, await db.Challenges.CountAsync());
        Assert.Equal(1, await db.Participants.CountAsync());
        Assert.Equal(1, await db.Couples.CountAsync());
        Assert.Equal(1, await db.CoupleMemberships.CountAsync());
    }

    [Fact]
    public async Task Can_create_schema_and_save_auth_credential()
    {
        await using var connection = new SqliteConnection("DataSource=:memory:");
        await connection.OpenAsync();

        var options = new DbContextOptionsBuilder<GymChallDbContext>()
            .UseSqlite(connection)
            .Options;

        await using var db = new GymChallDbContext(options);
        await db.Database.EnsureCreatedAsync();

        var participantId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        db.Participants.Add(new ParticipantEntity
        {
            Id = participantId,
            DisplayName = "Rafa",
            Username = "rafa",
            Role = ParticipantRole.Admin,
            Active = true
        });
        db.AuthCredentials.Add(new AuthCredentialEntity
        {
            ParticipantId = participantId,
            PinHash = "hash",
            FailedAttemptCount = 1,
            LockedUntil = new DateTimeOffset(2026, 6, 17, 10, 1, 0, TimeSpan.Zero),
            PinUpdatedAt = new DateTimeOffset(2026, 6, 17, 10, 0, 0, TimeSpan.Zero)
        });

        await db.SaveChangesAsync();

        var credential = await db.AuthCredentials.SingleAsync();
        Assert.Equal(participantId, credential.ParticipantId);
        Assert.Equal("hash", credential.PinHash);
        Assert.Equal(1, credential.FailedAttemptCount);
    }
}
