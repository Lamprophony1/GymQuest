namespace GymChall.Infrastructure.Persistence.Entities;

public sealed class AuthCredentialEntity
{
    public Guid ParticipantId { get; set; }
    public ParticipantEntity? Participant { get; set; }
    public string PinHash { get; set; } = "";
    public int FailedAttemptCount { get; set; }
    public DateTimeOffset? LockedUntil { get; set; }
    public DateTimeOffset? PinUpdatedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
