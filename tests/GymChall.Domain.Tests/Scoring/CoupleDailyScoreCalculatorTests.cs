using GymChall.Domain.Scoring;

namespace GymChall.Domain.Tests.Scoring;

public sealed class CoupleDailyScoreCalculatorTests
{
    [Fact]
    public void Adds_daily_bonus_when_both_members_are_eligible()
    {
        var date = new DateOnly(2026, 6, 15);
        var first = DailyScoreCalculator.Calculate(new DailyScoreInput(date, CoverageKind.Morning), ChallengeSettings.Default);
        var second = DailyScoreCalculator.Calculate(new DailyScoreInput(date, CoverageKind.FullToken), ChallengeSettings.Default);

        var result = CoupleDailyScoreCalculator.Calculate(first, second, lakePoints: 0m, ChallengeSettings.Default);

        Assert.Equal(9m, result.TotalPoints);
        Assert.Equal(1m, result.DailyBonusPoints);
        Assert.True(result.BothEligibleForDailyBonus);
    }

    [Fact]
    public void Does_not_add_daily_bonus_when_one_member_only_has_same_day_recovery()
    {
        var date = new DateOnly(2026, 6, 16);
        var first = DailyScoreCalculator.Calculate(new DailyScoreInput(date, CoverageKind.Morning), ChallengeSettings.Default);
        var second = DailyScoreCalculator.Calculate(new DailyScoreInput(date, CoverageKind.SameDayRecovery), ChallengeSettings.Default);

        var result = CoupleDailyScoreCalculator.Calculate(first, second, lakePoints: 0m, ChallengeSettings.Default);

        Assert.Equal(5m, result.TotalPoints);
        Assert.Equal(0m, result.DailyBonusPoints);
        Assert.False(result.BothEligibleForDailyBonus);
    }

    [Fact]
    public void Includes_lake_points_in_total()
    {
        var date = new DateOnly(2026, 6, 16);
        var first = DailyScoreCalculator.Calculate(new DailyScoreInput(date, CoverageKind.Morning), ChallengeSettings.Default);
        var second = DailyScoreCalculator.Calculate(new DailyScoreInput(date, CoverageKind.Morning), ChallengeSettings.Default);

        var result = CoupleDailyScoreCalculator.Calculate(first, second, lakePoints: 3m, ChallengeSettings.Default);

        Assert.Equal(10m, result.TotalPoints);
        Assert.Equal(3m, result.LakePoints);
    }
}
