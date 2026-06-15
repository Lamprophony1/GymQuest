using GymChall.Domain.Scoring;

namespace GymChall.Domain.Tests.Scoring;

public sealed class WeeklyScoreCalculatorTests
{
    [Fact]
    public void Perfect_week_gets_perfect_bonus()
    {
        var scores = BuildWeek(CoverageKind.Morning, CoverageKind.FullToken, CoverageKind.Morning, CoverageKind.MovedSchedule, CoverageKind.Morning);

        var result = WeeklyScoreCalculator.Calculate(new WeeklyScoreInput(scores), ChallengeSettings.Default);

        Assert.Equal(WeeklyBonusType.Perfect, result.WeeklyBonusType);
        Assert.Equal(12m, result.WeeklyBonusPoints);
    }

    [Fact]
    public void Same_day_recovery_makes_week_complete_not_perfect()
    {
        var scores = BuildWeek(CoverageKind.Morning, CoverageKind.SameDayRecovery, CoverageKind.Morning, CoverageKind.Morning, CoverageKind.Morning);

        var result = WeeklyScoreCalculator.Calculate(new WeeklyScoreInput(scores), ChallengeSettings.Default);

        Assert.Equal(WeeklyBonusType.Complete, result.WeeklyBonusType);
        Assert.Equal(7m, result.WeeklyBonusPoints);
    }

    [Fact]
    public void Weekend_recovery_makes_week_rescued()
    {
        var scores = BuildWeek(CoverageKind.Morning, CoverageKind.SameDayRecovery, CoverageKind.WeekendRecovery, CoverageKind.Morning, CoverageKind.Morning);

        var result = WeeklyScoreCalculator.Calculate(new WeeklyScoreInput(scores), ChallengeSettings.Default);

        Assert.Equal(WeeklyBonusType.Rescued, result.WeeklyBonusType);
        Assert.Equal(4m, result.WeeklyBonusPoints);
    }

    [Fact]
    public void Missing_day_gets_no_weekly_bonus()
    {
        var scores = BuildWeek(CoverageKind.Morning, CoverageKind.None, CoverageKind.Morning, CoverageKind.Morning, CoverageKind.Morning);

        var result = WeeklyScoreCalculator.Calculate(new WeeklyScoreInput(scores), ChallengeSettings.Default);

        Assert.Equal(WeeklyBonusType.None, result.WeeklyBonusType);
        Assert.Equal(0m, result.WeeklyBonusPoints);
    }

    [Fact]
    public void Partial_week_uses_only_required_business_days_inside_challenge()
    {
        var date = new DateOnly(2026, 6, 18);
        var scores = new[]
        {
            Pair(date, CoverageKind.Morning, CoverageKind.Morning),
            Pair(date.AddDays(1), CoverageKind.FullToken, CoverageKind.Morning)
        };

        var result = WeeklyScoreCalculator.Calculate(new WeeklyScoreInput(scores), ChallengeSettings.Default);

        Assert.Equal(2, result.RequiredBusinessDays);
        Assert.Equal(WeeklyBonusType.Perfect, result.WeeklyBonusType);
    }

    private static IReadOnlyList<(DailyScoreResult First, DailyScoreResult Second)> BuildWeek(params CoverageKind[] kinds)
    {
        var monday = new DateOnly(2026, 6, 15);
        return kinds.Select((kind, index) => Pair(monday.AddDays(index), kind, CoverageKind.Morning)).ToArray();
    }

    private static (DailyScoreResult First, DailyScoreResult Second) Pair(DateOnly date, CoverageKind firstKind, CoverageKind secondKind)
    {
        return (
            DailyScoreCalculator.Calculate(new DailyScoreInput(date, firstKind), ChallengeSettings.Default),
            DailyScoreCalculator.Calculate(new DailyScoreInput(date, secondKind), ChallengeSettings.Default));
    }
}
