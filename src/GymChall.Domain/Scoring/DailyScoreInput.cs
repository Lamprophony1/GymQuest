namespace GymChall.Domain.Scoring;

public sealed record DailyScoreInput(
    DateOnly Date,
    CoverageKind CoverageKind);
