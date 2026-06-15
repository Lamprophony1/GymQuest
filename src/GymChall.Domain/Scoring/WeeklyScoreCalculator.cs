namespace GymChall.Domain.Scoring;

public static class WeeklyScoreCalculator
{
    public static WeeklyScoreResult Calculate(WeeklyScoreInput input, ChallengeSettings settings)
    {
        if (input.RequiredBusinessDayScores.Count == 0)
        {
            return new WeeklyScoreResult(0, WeeklyBonusType.None, 0m, 0m);
        }

        var individualPoints = input.RequiredBusinessDayScores.Sum(pair => pair.First.Points + pair.Second.Points);
        var everyoneCovered = input.RequiredBusinessDayScores.All(pair => pair.First.IsCovered && pair.Second.IsCovered);

        if (!everyoneCovered)
        {
            return new WeeklyScoreResult(input.RequiredBusinessDayScores.Count, WeeklyBonusType.None, 0m, individualPoints);
        }

        var usedWeekendRecovery = input.RequiredBusinessDayScores.Any(pair =>
            pair.First.CountsForRescuedWeek || pair.Second.CountsForRescuedWeek);

        if (usedWeekendRecovery)
        {
            return new WeeklyScoreResult(input.RequiredBusinessDayScores.Count, WeeklyBonusType.Rescued, settings.RescuedWeekBonus, individualPoints);
        }

        var usedSameDayRecovery = input.RequiredBusinessDayScores.Any(pair =>
            pair.First.CountsForCompleteWeek || pair.Second.CountsForCompleteWeek);

        if (usedSameDayRecovery)
        {
            return new WeeklyScoreResult(input.RequiredBusinessDayScores.Count, WeeklyBonusType.Complete, settings.CompleteWeekBonus, individualPoints);
        }

        return new WeeklyScoreResult(input.RequiredBusinessDayScores.Count, WeeklyBonusType.Perfect, settings.PerfectWeekBonus, individualPoints);
    }
}
