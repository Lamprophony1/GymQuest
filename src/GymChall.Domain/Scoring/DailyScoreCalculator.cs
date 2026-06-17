namespace GymChall.Domain.Scoring;

public static class DailyScoreCalculator
{
    public static DailyScoreResult Calculate(DailyScoreInput input, ChallengeSettings settings)
    {
        if (IsWeekend(input.Date))
        {
            throw new ArgumentOutOfRangeException(
                nameof(input),
                input.Date,
                "Daily scoring only supports business days.");
        }

        var normalDayPoints = GetNormalDayPoints(input.Date, settings);

        return input.CoverageKind switch
        {
            CoverageKind.Morning => new DailyScoreResult(
                input.Date,
                input.CoverageKind,
                normalDayPoints,
                IsCovered: true,
                CountsForDailyCoupleBonus: true,
                CountsForMorningStreak: true,
                CountsForGymStreak: true,
                CountsForPerfectWeek: true,
                CountsForCompleteWeek: false,
                CountsForRescuedWeek: false),

            CoverageKind.FullToken => new DailyScoreResult(
                input.Date,
                input.CoverageKind,
                normalDayPoints,
                IsCovered: true,
                CountsForDailyCoupleBonus: true,
                CountsForMorningStreak: true,
                CountsForGymStreak: true,
                CountsForPerfectWeek: true,
                CountsForCompleteWeek: false,
                CountsForRescuedWeek: false),

            CoverageKind.MovedSchedule => new DailyScoreResult(
                input.Date,
                input.CoverageKind,
                normalDayPoints,
                IsCovered: true,
                CountsForDailyCoupleBonus: true,
                CountsForMorningStreak: true,
                CountsForGymStreak: true,
                CountsForPerfectWeek: true,
                CountsForCompleteWeek: false,
                CountsForRescuedWeek: false),

            CoverageKind.SameDayRecovery => new DailyScoreResult(
                input.Date,
                input.CoverageKind,
                settings.SameDayRecoveryPoints,
                IsCovered: true,
                CountsForDailyCoupleBonus: false,
                CountsForMorningStreak: false,
                CountsForGymStreak: true,
                CountsForPerfectWeek: false,
                CountsForCompleteWeek: true,
                CountsForRescuedWeek: false),

            CoverageKind.WeekendRecovery => new DailyScoreResult(
                input.Date,
                input.CoverageKind,
                settings.WeekendRecoveryPoints,
                IsCovered: true,
                CountsForDailyCoupleBonus: false,
                CountsForMorningStreak: false,
                CountsForGymStreak: false,
                CountsForPerfectWeek: false,
                CountsForCompleteWeek: false,
                CountsForRescuedWeek: true),

            CoverageKind.None => new DailyScoreResult(
                input.Date,
                input.CoverageKind,
                0m,
                IsCovered: false,
                CountsForDailyCoupleBonus: false,
                CountsForMorningStreak: false,
                CountsForGymStreak: false,
                CountsForPerfectWeek: false,
                CountsForCompleteWeek: false,
                CountsForRescuedWeek: false),

            _ => throw new ArgumentOutOfRangeException(nameof(input), input.CoverageKind, "Unsupported coverage kind.")
        };
    }

    private static decimal GetNormalDayPoints(DateOnly date, ChallengeSettings settings)
    {
        return date.DayOfWeek == DayOfWeek.Monday
            ? settings.MondayMorningPoints
            : settings.WeekdayMorningPoints;
    }

    private static bool IsWeekend(DateOnly date)
    {
        return date.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday;
    }
}
