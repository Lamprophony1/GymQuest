using GymChall.Application.Abstractions;
using GymChall.Application.Challenges;
using GymChall.Infrastructure.Persistence;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace GymChall.Infrastructure.Tests.Persistence;

public sealed class GymChallRepositoryTests
{
    [Fact]
    public async Task Saves_and_loads_participants_couples_checkins_and_tokens()
    {
        await using var connection = new SqliteConnection("DataSource=:memory:");
        await connection.OpenAsync();

        var options = new DbContextOptionsBuilder<GymChallDbContext>()
            .UseSqlite(connection)
            .Options;

        await using var db = new GymChallDbContext(options);
        await db.Database.EnsureCreatedAsync();
        IGymChallRepository repository = new GymChallRepository(db);

        var challengeId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var rafaId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var clariId = Guid.Parse("33333333-3333-3333-3333-333333333333");

        await repository.CreateChallengeAsync(new ChallengeCreateDto(
            challengeId,
            "Reto Parejas - Rumbo a Septiembre",
            new DateOnly(2026, 6, 15),
            new DateOnly(2026, 9, 15),
            rafaId,
            "America/Asuncion"));
        await repository.AddParticipantAsync(new ParticipantCreateDto(rafaId, "Rafa", "rafa", ParticipantRoleDto.Admin, "male"));
        await repository.AddParticipantAsync(new ParticipantCreateDto(clariId, "Clari", "clari", ParticipantRoleDto.Participant, "female"));
        await repository.AddCoupleAsync(new CoupleCreateDto(Guid.Parse("44444444-4444-4444-4444-444444444444"), challengeId, "Rafa + Clari", rafaId, clariId));
        await repository.AddCheckInAsync(new CheckInCreateDto(Guid.Parse("55555555-5555-5555-5555-555555555555"), challengeId, rafaId, new DateTimeOffset(2026, 6, 15, 5, 5, 0, TimeSpan.FromHours(-4)), new DateOnly(2026, 6, 15), CheckInTypeDto.GymMorning, 45, rafaId, "5am"));
        await repository.AddFullCoverageTokenAsync(new FullCoverageTokenCreateDto(Guid.Parse("66666666-6666-6666-6666-666666666666"), challengeId, clariId, new DateOnly(2026, 6, 15), ExceptionReasonCategoryDto.Health, rafaId, "salud"));

        var snapshot = await repository.GetChallengeSnapshotAsync(challengeId);

        Assert.Equal("Reto Parejas - Rumbo a Septiembre", snapshot.Challenge.Name);
        Assert.Equal(2, snapshot.Participants.Count);
        Assert.Single(snapshot.Couples);
        Assert.Single(snapshot.CheckIns);
        Assert.Single(snapshot.FullCoverageTokens);
    }
}
