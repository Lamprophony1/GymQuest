namespace GymChall.Infrastructure.Persistence.Entities;

public sealed class CoupleEntity
{
    public Guid Id { get; set; }
    public Guid ChallengeId { get; set; }
    public string Name { get; set; } = "";
    public bool Active { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public ChallengeEntity? Challenge { get; set; }
    public List<CoupleMembershipEntity> Memberships { get; set; } = [];
}
