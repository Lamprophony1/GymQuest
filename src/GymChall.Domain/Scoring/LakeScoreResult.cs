namespace GymChall.Domain.Scoring;

public sealed record LakeScoreResult(
    decimal Points,
    int ScoringActivities,
    int TotalValidActivities);
