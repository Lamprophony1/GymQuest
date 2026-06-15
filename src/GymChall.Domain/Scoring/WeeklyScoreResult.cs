namespace GymChall.Domain.Scoring;

public sealed record WeeklyScoreResult(
    int RequiredBusinessDays,
    WeeklyBonusType WeeklyBonusType,
    decimal WeeklyBonusPoints,
    decimal IndividualPoints);
