using GymChall.Infrastructure.Persistence;

namespace GymChall.Infrastructure.Persistence.Entities;

public sealed class CheckInEntity
{
    public Guid Id { get; set; }
    public Guid ChallengeId { get; set; }
    public Guid ParticipantId { get; set; }
    public DateTimeOffset OccurredAt { get; set; }
    public DateOnly ActivityDate { get; set; }
    public CheckInType Type { get; set; }
    public RecordStatus Status { get; set; } = RecordStatus.Valid;
    public int DurationMinutes { get; set; }
    public string? Notes { get; set; }
    public Guid CreatedByParticipantId { get; set; }
    public Guid? CorrectedByParticipantId { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
