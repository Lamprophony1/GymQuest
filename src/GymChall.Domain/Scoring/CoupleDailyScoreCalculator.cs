namespace GymChall.Domain.Scoring;

public static class CoupleDailyScoreCalculator
{
    public static CoupleDailyScoreResult Calculate(
        DailyScoreResult first,
        DailyScoreResult second,
        decimal lakePoints,
        ChallengeSettings settings)
    {
        var bothEligibleForDailyBonus = first.CountsForDailyCoupleBonus && second.CountsForDailyCoupleBonus;
        var dailyBonus = bothEligibleForDailyBonus ? settings.DailyCoupleBonus : 0m;
        var total = first.Points + second.Points + dailyBonus + lakePoints;

        return new CoupleDailyScoreResult(
            FirstParticipantPoints: first.Points,
            SecondParticipantPoints: second.Points,
            DailyBonusPoints: dailyBonus,
            LakePoints: lakePoints,
            TotalPoints: total,
            BothEligibleForDailyBonus: bothEligibleForDailyBonus,
            BothCoveredForWeeklyCount: first.IsCovered && second.IsCovered);
    }
}
