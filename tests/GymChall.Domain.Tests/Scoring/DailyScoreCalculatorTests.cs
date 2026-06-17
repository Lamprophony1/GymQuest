using GymChall.Domain.Scoring;

namespace GymChall.Domain.Tests.Scoring;

public sealed class DailyScoreCalculatorTests
{
    [Fact]
    public void Monday_morning_scores_four_and_counts_for_bonus_and_both_streaks()
    {
        var date = new DateOnly(2026, 6, 15);

        var result = DailyScoreCalculator.Calculate(
            new DailyScoreInput(date, CoverageKind.Morning),
            ChallengeSettings.Default);

        AssertResult(
            result,
            date,
            CoverageKind.Morning,
            4m,
            isCovered: true,
            countsForDailyCoupleBonus: true,
            countsForMorningStreak: true,
            countsForGymStreak: true,
            countsForPerfectWeek: true,
            countsForCompleteWeek: false,
            countsForRescuedWeek: false);
    }

    [Fact]
    public void Tuesday_morning_scores_three()
    {
        var date = new DateOnly(2026, 6, 16);

        var result = DailyScoreCalculator.Calculate(
            new DailyScoreInput(date, CoverageKind.Morning),
            ChallengeSettings.Default);

        AssertResult(
            result,
            date,
            CoverageKind.Morning,
            3m,
            isCovered: true,
            countsForDailyCoupleBonus: true,
            countsForMorningStreak: true,
            countsForGymStreak: true,
            countsForPerfectWeek: true,
            countsForCompleteWeek: false,
            countsForRescuedWeek: false);
    }

    [Theory]
    [InlineData(2026, 6, 20, CoverageKind.Morning)]
    [InlineData(2026, 6, 21, CoverageKind.Morning)]
    [InlineData(2026, 6, 20, CoverageKind.FullToken)]
    [InlineData(2026, 6, 20, CoverageKind.MovedSchedule)]
    [InlineData(2026, 6, 20, CoverageKind.SameDayRecovery)]
    [InlineData(2026, 6, 20, CoverageKind.WeekendRecovery)]
    [InlineData(2026, 6, 20, CoverageKind.None)]
    public void Weekend_dates_are_rejected_for_every_coverage_kind(
        int year,
        int month,
        int day,
        CoverageKind coverageKind)
    {
        var exception = Assert.Throws<ArgumentOutOfRangeException>(() =>
            DailyScoreCalculator.Calculate(
                new DailyScoreInput(new DateOnly(year, month, day), coverageKind),
                ChallengeSettings.Default));

        Assert.Equal("input", exception.ParamName);
    }

    [Fact]
    public void Full_token_scores_normal_day_and_counts_for_daily_bonus_and_both_streaks()
    {
        var date = new DateOnly(2026, 6, 17);

        var result = DailyScoreCalculator.Calculate(
            new DailyScoreInput(date, CoverageKind.FullToken),
            ChallengeSettings.Default);

        AssertResult(
            result,
            date,
            CoverageKind.FullToken,
            3m,
            isCovered: true,
            countsForDailyCoupleBonus: true,
            countsForMorningStreak: true,
            countsForGymStreak: true,
            countsForPerfectWeek: true,
            countsForCompleteWeek: false,
            countsForRescuedWeek: false);
    }

    [Fact]
    public void Moved_schedule_scores_normal_day_and_counts_for_bonus_and_streaks()
    {
        var date = new DateOnly(2026, 6, 18);

        var result = DailyScoreCalculator.Calculate(
            new DailyScoreInput(date, CoverageKind.MovedSchedule),
            ChallengeSettings.Default);

        AssertResult(
            result,
            date,
            CoverageKind.MovedSchedule,
            3m,
            isCovered: true,
            countsForDailyCoupleBonus: true,
            countsForMorningStreak: true,
            countsForGymStreak: true,
            countsForPerfectWeek: true,
            countsForCompleteWeek: false,
            countsForRescuedWeek: false);
    }

    [Fact]
    public void Same_day_recovery_scores_two_but_does_not_count_for_daily_bonus_or_morning_streak()
    {
        var date = new DateOnly(2026, 6, 19);

        var result = DailyScoreCalculator.Calculate(
            new DailyScoreInput(date, CoverageKind.SameDayRecovery),
            ChallengeSettings.Default);

        AssertResult(
            result,
            date,
            CoverageKind.SameDayRecovery,
            2m,
            isCovered: true,
            countsForDailyCoupleBonus: false,
            countsForMorningStreak: false,
            countsForGymStreak: true,
            countsForPerfectWeek: false,
            countsForCompleteWeek: true,
            countsForRescuedWeek: false);
    }

    [Fact]
    public void Weekend_recovery_scores_one_point_five_and_only_counts_for_rescued_week()
    {
        var date = new DateOnly(2026, 6, 18);

        var result = DailyScoreCalculator.Calculate(
            new DailyScoreInput(date, CoverageKind.WeekendRecovery),
            ChallengeSettings.Default);

        AssertResult(
            result,
            date,
            CoverageKind.WeekendRecovery,
            1.5m,
            isCovered: true,
            countsForDailyCoupleBonus: false,
            countsForMorningStreak: false,
            countsForGymStreak: false,
            countsForPerfectWeek: false,
            countsForCompleteWeek: false,
            countsForRescuedWeek: true);
    }

    [Fact]
    public void None_scores_zero_and_breaks_coverage()
    {
        var date = new DateOnly(2026, 6, 18);

        var result = DailyScoreCalculator.Calculate(
            new DailyScoreInput(date, CoverageKind.None),
            ChallengeSettings.Default);

        AssertResult(
            result,
            date,
            CoverageKind.None,
            0m,
            isCovered: false,
            countsForDailyCoupleBonus: false,
            countsForMorningStreak: false,
            countsForGymStreak: false,
            countsForPerfectWeek: false,
            countsForCompleteWeek: false,
            countsForRescuedWeek: false);
    }

    [Fact]
    public void Custom_settings_are_used_for_daily_points()
    {
        var settings = new ChallengeSettings(
            MondayMorningPoints: 14m,
            WeekdayMorningPoints: 13m,
            SameDayRecoveryPoints: 12m,
            WeekendRecoveryPoints: 11.5m,
            DailyCoupleBonus: 10m,
            PerfectWeekBonus: 120m,
            CompleteWeekBonus: 70m,
            RescuedWeekBonus: 40m,
            LakeSoloPoints: 15m,
            LakeCouplePoints: 35m,
            MaxLakeScoringPerCouplePerWeek: 3,
            MaxWeekendRecoveriesPerPersonPerWeek: 4);

        Assert.Equal(
            14m,
            DailyScoreCalculator.Calculate(
                new DailyScoreInput(new DateOnly(2026, 6, 15), CoverageKind.Morning),
                settings).Points);
        Assert.Equal(
            13m,
            DailyScoreCalculator.Calculate(
                new DailyScoreInput(new DateOnly(2026, 6, 16), CoverageKind.Morning),
                settings).Points);
        Assert.Equal(
            12m,
            DailyScoreCalculator.Calculate(
                new DailyScoreInput(new DateOnly(2026, 6, 17), CoverageKind.SameDayRecovery),
                settings).Points);
        Assert.Equal(
            11.5m,
            DailyScoreCalculator.Calculate(
                new DailyScoreInput(new DateOnly(2026, 6, 18), CoverageKind.WeekendRecovery),
                settings).Points);
    }

    private static void AssertResult(
        DailyScoreResult result,
        DateOnly date,
        CoverageKind coverageKind,
        decimal points,
        bool isCovered,
        bool countsForDailyCoupleBonus,
        bool countsForMorningStreak,
        bool countsForGymStreak,
        bool countsForPerfectWeek,
        bool countsForCompleteWeek,
        bool countsForRescuedWeek)
    {
        Assert.Equal(date, result.Date);
        Assert.Equal(coverageKind, result.CoverageKind);
        Assert.Equal(points, result.Points);
        Assert.Equal(isCovered, result.IsCovered);
        Assert.Equal(countsForDailyCoupleBonus, result.CountsForDailyCoupleBonus);
        Assert.Equal(countsForMorningStreak, result.CountsForMorningStreak);
        Assert.Equal(countsForGymStreak, result.CountsForGymStreak);
        Assert.Equal(countsForPerfectWeek, result.CountsForPerfectWeek);
        Assert.Equal(countsForCompleteWeek, result.CountsForCompleteWeek);
        Assert.Equal(countsForRescuedWeek, result.CountsForRescuedWeek);
    }
}
