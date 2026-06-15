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

        Assert.Equal(4m, result.FirstParticipantPoints);
        Assert.Equal(4m, result.SecondParticipantPoints);
        Assert.Equal(1m, result.DailyBonusPoints);
        Assert.Equal(0m, result.LakePoints);
        Assert.Equal(9m, result.TotalPoints);
        Assert.True(result.BothEligibleForDailyBonus);
        Assert.True(result.BothCoveredForWeeklyCount);
    }

    [Fact]
    public void Does_not_add_daily_bonus_when_one_member_only_has_same_day_recovery()
    {
        var date = new DateOnly(2026, 6, 16);
        var first = DailyScoreCalculator.Calculate(new DailyScoreInput(date, CoverageKind.Morning), ChallengeSettings.Default);
        var second = DailyScoreCalculator.Calculate(new DailyScoreInput(date, CoverageKind.SameDayRecovery), ChallengeSettings.Default);

        var result = CoupleDailyScoreCalculator.Calculate(first, second, lakePoints: 0m, ChallengeSettings.Default);

        Assert.Equal(3m, result.FirstParticipantPoints);
        Assert.Equal(2m, result.SecondParticipantPoints);
        Assert.Equal(0m, result.DailyBonusPoints);
        Assert.Equal(5m, result.TotalPoints);
        Assert.False(result.BothEligibleForDailyBonus);
        Assert.True(result.BothCoveredForWeeklyCount);
    }

    [Fact]
    public void Does_not_count_for_weekly_count_when_one_member_has_no_coverage()
    {
        var date = new DateOnly(2026, 6, 16);
        var first = DailyScoreCalculator.Calculate(new DailyScoreInput(date, CoverageKind.Morning), ChallengeSettings.Default);
        var second = DailyScoreCalculator.Calculate(new DailyScoreInput(date, CoverageKind.None), ChallengeSettings.Default);

        var result = CoupleDailyScoreCalculator.Calculate(first, second, lakePoints: 0m, ChallengeSettings.Default);

        Assert.Equal(3m, result.FirstParticipantPoints);
        Assert.Equal(0m, result.SecondParticipantPoints);
        Assert.Equal(0m, result.DailyBonusPoints);
        Assert.Equal(3m, result.TotalPoints);
        Assert.False(result.BothEligibleForDailyBonus);
        Assert.False(result.BothCoveredForWeeklyCount);
    }

    [Fact]
    public void Includes_lake_points_in_total()
    {
        var date = new DateOnly(2026, 6, 16);
        var first = DailyScoreCalculator.Calculate(new DailyScoreInput(date, CoverageKind.Morning), ChallengeSettings.Default);
        var second = DailyScoreCalculator.Calculate(new DailyScoreInput(date, CoverageKind.Morning), ChallengeSettings.Default);

        var result = CoupleDailyScoreCalculator.Calculate(first, second, lakePoints: 3m, ChallengeSettings.Default);

        Assert.Equal(3m, result.FirstParticipantPoints);
        Assert.Equal(3m, result.SecondParticipantPoints);
        Assert.Equal(1m, result.DailyBonusPoints);
        Assert.Equal(3m, result.LakePoints);
        Assert.Equal(10m, result.TotalPoints);
        Assert.True(result.BothEligibleForDailyBonus);
        Assert.True(result.BothCoveredForWeeklyCount);
    }
}
