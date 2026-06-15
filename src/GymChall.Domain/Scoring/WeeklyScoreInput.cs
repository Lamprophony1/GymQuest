namespace GymChall.Domain.Scoring;

public sealed record WeeklyScoreInput(
    IReadOnlyList<(DailyScoreResult First, DailyScoreResult Second)> RequiredBusinessDayScores);
