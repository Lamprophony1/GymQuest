using GymChall.Infrastructure.Persistence;

namespace GymChall.Infrastructure.Persistence.Entities;

public sealed class ChallengeEntity
{
    public Guid Id { get; set; }
    public string Name { get; set; } = "";
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public ChallengeStatus Status { get; set; }
    public Guid AdminParticipantId { get; set; }
    public string Timezone { get; set; } = "America/Asuncion";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public ChallengeSettingsEntity? Settings { get; set; }
}
