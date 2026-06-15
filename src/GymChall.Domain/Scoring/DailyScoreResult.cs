namespace GymChall.Domain.Scoring;

public sealed record DailyScoreResult(
    DateOnly Date,
    CoverageKind CoverageKind,
    decimal Points,
    bool IsCovered,
    bool CountsForDailyCoupleBonus,
    bool CountsForMorningStreak,
    bool CountsForGymStreak,
    bool CountsForPerfectWeek,
    bool CountsForCompleteWeek,
    bool CountsForRescuedWeek);
