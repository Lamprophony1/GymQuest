namespace GymChall.Infrastructure.Persistence.Entities;

public sealed class AuditLogEntity
{
    public Guid Id { get; set; }
    public Guid ChallengeId { get; set; }
    public Guid ActorParticipantId { get; set; }
    public string Action { get; set; } = "";
    public string EntityType { get; set; } = "";
    public Guid EntityId { get; set; }
    public string? OldValueJson { get; set; }
    public string? NewValueJson { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
