using GymChall.Domain.Scoring;

namespace GymChall.Domain.Tests.Scoring;

public sealed class DailyScoreCalculatorTests
{
    [Fact]
    public void Monday_morning_scores_four_and_counts_for_bonus_and_both_streaks()
    {
        var result = DailyScoreCalculator.Calculate(
            new DailyScoreInput(new DateOnly(2026, 6, 15), CoverageKind.Morning),
            ChallengeSettings.Default);

        Assert.Equal(4m, result.Points);
        Assert.True(result.IsCovered);
        Assert.True(result.CountsForDailyCoupleBonus);
        Assert.True(result.CountsForMorningStreak);
        Assert.True(result.CountsForGymStreak);
        Assert.True(result.CountsForPerfectWeek);
    }

    [Fact]
    public void Tuesday_morning_scores_three()
    {
        var result = DailyScoreCalculator.Calculate(
            new DailyScoreInput(new DateOnly(2026, 6, 16), CoverageKind.Morning),
            ChallengeSettings.Default);

        Assert.Equal(3m, result.Points);
    }

    [Fact]
    public void Full_token_scores_normal_day_and_counts_for_daily_bonus_and_morning_streak()
    {
        var result = DailyScoreCalculator.Calculate(
            new DailyScoreInput(new DateOnly(2026, 6, 17), CoverageKind.FullToken),
            ChallengeSettings.Default);

        Assert.Equal(3m, result.Points);
        Assert.True(result.IsCovered);
        Assert.True(result.CountsForDailyCoupleBonus);
        Assert.True(result.CountsForMorningStreak);
        Assert.False(result.CountsForGymStreak);
        Assert.True(result.CountsForPerfectWeek);
    }

    [Fact]
    public void Moved_schedule_scores_normal_day_and_counts_for_bonus_and_streaks()
    {
        var result = DailyScoreCalculator.Calculate(
            new DailyScoreInput(new DateOnly(2026, 6, 18), CoverageKind.MovedSchedule),
            ChallengeSettings.Default);

        Assert.Equal(3m, result.Points);
        Assert.True(result.CountsForDailyCoupleBonus);
        Assert.True(result.CountsForMorningStreak);
        Assert.True(result.CountsForGymStreak);
        Assert.True(result.CountsForPerfectWeek);
    }

    [Fact]
    public void Same_day_recovery_scores_two_but_does_not_count_for_daily_bonus_or_morning_streak()
    {
        var result = DailyScoreCalculator.Calculate(
            new DailyScoreInput(new DateOnly(2026, 6, 19), CoverageKind.SameDayRecovery),
            ChallengeSettings.Default);

        Assert.Equal(2m, result.Points);
        Assert.True(result.IsCovered);
        Assert.False(result.CountsForDailyCoupleBonus);
        Assert.False(result.CountsForMorningStreak);
        Assert.True(result.CountsForGymStreak);
        Assert.False(result.CountsForPerfectWeek);
        Assert.True(result.CountsForCompleteWeek);
    }

    [Fact]
    public void Weekend_recovery_scores_one_point_five_and_only_counts_for_rescued_week()
    {
        var result = DailyScoreCalculator.Calculate(
            new DailyScoreInput(new DateOnly(2026, 6, 18), CoverageKind.WeekendRecovery),
            ChallengeSettings.Default);

        Assert.Equal(1.5m, result.Points);
        Assert.True(result.IsCovered);
        Assert.False(result.CountsForDailyCoupleBonus);
        Assert.False(result.CountsForMorningStreak);
        Assert.False(result.CountsForGymStreak);
        Assert.False(result.CountsForPerfectWeek);
        Assert.True(result.CountsForRescuedWeek);
    }

    [Fact]
    public void None_scores_zero_and_breaks_coverage()
    {
        var result = DailyScoreCalculator.Calculate(
            new DailyScoreInput(new DateOnly(2026, 6, 18), CoverageKind.None),
            ChallengeSettings.Default);

        Assert.Equal(0m, result.Points);
        Assert.False(result.IsCovered);
        Assert.False(result.CountsForDailyCoupleBonus);
        Assert.False(result.CountsForMorningStreak);
        Assert.False(result.CountsForGymStreak);
    }
}
