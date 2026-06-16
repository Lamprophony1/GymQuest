using GymChall.Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace GymChall.Infrastructure.Persistence;

public static class SeedData
{
    public static readonly Guid ChallengeId = Guid.Parse("10000000-0000-0000-0000-000000000001");
    public static readonly Guid RafaId = Guid.Parse("10000000-0000-0000-0000-000000000101");
    public static readonly Guid ClariId = Guid.Parse("10000000-0000-0000-0000-000000000102");
    public static readonly Guid ObelarId = Guid.Parse("10000000-0000-0000-0000-000000000103");
    public static readonly Guid ChachiId = Guid.Parse("10000000-0000-0000-0000-000000000104");
    public static readonly Guid CieliId = Guid.Parse("10000000-0000-0000-0000-000000000105");
    public static readonly Guid NaldoId = Guid.Parse("10000000-0000-0000-0000-000000000106");

    public static async Task EnsureSeededAsync(GymChallDbContext db, CancellationToken cancellationToken = default)
    {
        if (await db.Challenges.AnyAsync(cancellationToken))
        {
            await EnsureCurrentDefaultsAsync(db, cancellationToken);
            return;
        }

        db.Participants.AddRange(
            Participant(RafaId, "Rafa", "rafa", ParticipantRole.Admin, "male"),
            Participant(ClariId, "Clari", "clari", ParticipantRole.Participant, "female"),
            Participant(ObelarId, "Obelar", "obelar", ParticipantRole.Participant, "male"),
            Participant(ChachiId, "Chachi", "chachi", ParticipantRole.Participant, "female"),
            Participant(CieliId, "Cieli", "cieli", ParticipantRole.Participant, "female"),
            Participant(NaldoId, "Naldo", "naldo", ParticipantRole.Participant, "male"));

        db.Challenges.Add(new ChallengeEntity
        {
            Id = ChallengeId,
            Name = "Reto septiembre 2026",
            StartDate = new DateOnly(2026, 6, 15),
            EndDate = new DateOnly(2026, 9, 15),
            Status = ChallengeStatus.Active,
            AdminParticipantId = RafaId,
            Timezone = "America/Asuncion"
        });

        db.ChallengeSettings.Add(new ChallengeSettingsEntity
        {
            Id = Guid.Parse("10000000-0000-0000-0000-000000000201"),
            ChallengeId = ChallengeId
        });

        AddCouple(db, Guid.Parse("10000000-0000-0000-0000-000000000301"), "Rafa + Clari", RafaId, ClariId);
        AddCouple(db, Guid.Parse("10000000-0000-0000-0000-000000000302"), "Obelar + Chachi", ObelarId, ChachiId);
        AddCouple(db, Guid.Parse("10000000-0000-0000-0000-000000000303"), "Cieli + Naldo", CieliId, NaldoId);

        await db.SaveChangesAsync(cancellationToken);
    }

    private static async Task EnsureCurrentDefaultsAsync(GymChallDbContext db, CancellationToken cancellationToken)
    {
        var challenge = await db.Challenges.SingleOrDefaultAsync(x => x.Id == ChallengeId, cancellationToken);
        if (challenge is not null)
        {
            challenge.Name = "Reto septiembre 2026";
        }

        var settings = await db.ChallengeSettings.SingleOrDefaultAsync(x => x.ChallengeId == ChallengeId, cancellationToken);
        if (settings is not null)
        {
            settings.MorningWindowStart = new TimeOnly(5, 0);
            settings.MorningWindowEnd = new TimeOnly(6, 0);
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    private static ParticipantEntity Participant(Guid id, string displayName, string username, ParticipantRole role, string gender)
    {
        return new ParticipantEntity { Id = id, DisplayName = displayName, Username = username, Role = role, Gender = gender, Active = true };
    }

    private static void AddCouple(GymChallDbContext db, Guid coupleId, string name, Guid firstParticipantId, Guid secondParticipantId)
    {
        db.Couples.Add(new CoupleEntity { Id = coupleId, ChallengeId = ChallengeId, Name = name, Active = true });
        db.CoupleMemberships.Add(new CoupleMembershipEntity { Id = Guid.NewGuid(), CoupleId = coupleId, ParticipantId = firstParticipantId, StartsOn = new DateOnly(2026, 6, 15) });
        db.CoupleMemberships.Add(new CoupleMembershipEntity { Id = Guid.NewGuid(), CoupleId = coupleId, ParticipantId = secondParticipantId, StartsOn = new DateOnly(2026, 6, 15) });
    }
}
