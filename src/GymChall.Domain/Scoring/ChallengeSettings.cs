namespace GymChall.Domain.Scoring;

public sealed record ChallengeSettings(
    decimal MondayMorningPoints,
    decimal WeekdayMorningPoints,
    decimal SameDayRecoveryPoints,
    decimal WeekendRecoveryPoints,
    decimal DailyCoupleBonus,
    decimal PerfectWeekBonus,
    decimal CompleteWeekBonus,
    decimal RescuedWeekBonus,
    decimal LakeSoloPoints,
    decimal LakeCouplePoints,
    int MaxLakeScoringPerCouplePerWeek,
    int MaxWeekendRecoveriesPerPersonPerWeek)
{
    public static ChallengeSettings Default { get; } = new(
        MondayMorningPoints: 4m,
        WeekdayMorningPoints: 3m,
        SameDayRecoveryPoints: 2m,
        WeekendRecoveryPoints: 1.5m,
        DailyCoupleBonus: 1m,
        PerfectWeekBonus: 12m,
        CompleteWeekBonus: 7m,
        RescuedWeekBonus: 4m,
        LakeSoloPoints: 1m,
        LakeCouplePoints: 3m,
        MaxLakeScoringPerCouplePerWeek: 2,
        MaxWeekendRecoveriesPerPersonPerWeek: 2);
}
