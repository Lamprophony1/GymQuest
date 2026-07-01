using GymChall.Infrastructure.Persistence;

namespace GymChall.Infrastructure.Persistence.Entities;

public sealed class ExceptionTokenEntity
{
    public Guid Id { get; set; }
    public Guid ChallengeId { get; set; }
    public Guid ParticipantId { get; set; }
    public DateOnly TargetDate { get; set; }
    public ExceptionTokenType Type { get; set; } = ExceptionTokenType.Health;
    public ExceptionReasonCategory ReasonCategory { get; set; }
    public ExceptionTokenStatus Status { get; set; } = ExceptionTokenStatus.Applied;
    public Guid AssignedByAdminId { get; set; }
    public string? Notes { get; set; }
    public string? SpecialCode { get; set; }
    public string? SpecialLabel { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
