namespace GymChall.Domain.Scoring;

public sealed record LakeActivityInput(
    DateOnly ActivityDate,
    IReadOnlyCollection<Guid> ParticipantIds,
    bool IsAssociatedToValidGym);
