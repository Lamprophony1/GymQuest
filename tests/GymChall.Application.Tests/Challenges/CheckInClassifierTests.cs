using GymChall.Application.Challenges;

namespace GymChall.Application.Tests.Challenges;

public sealed class CheckInClassifierTests
{
    private static readonly ChallengeSettingsDto Settings = new(
        4m,
        3m,
        2m,
        1.5m,
        1m,
        12m,
        7m,
        4m,
        45,
        new TimeOnly(5, 0),
        new TimeOnly(6, 0));

    [Fact]
    public void Classifies_morning_checkin_inside_configured_window()
    {
        var result = CheckInClassifier.Classify(
            new DateTimeOffset(2026, 6, 15, 5, 20, 0, TimeSpan.FromHours(-4)),
            recoveryTargetDate: null,
            Settings);

        Assert.Equal(new DateOnly(2026, 6, 15), result.ActivityDate);
        Assert.Equal(CheckInTypeDto.GymMorning, result.Type);
    }

    [Fact]
    public void Classifies_weekday_outside_window_as_same_day_recovery()
    {
        var result = CheckInClassifier.Classify(
            new DateTimeOffset(2026, 6, 16, 19, 30, 0, TimeSpan.FromHours(-4)),
            recoveryTargetDate: null,
            Settings);

        Assert.Equal(new DateOnly(2026, 6, 16), result.ActivityDate);
        Assert.Equal(CheckInTypeDto.GymSameDayRecovery, result.Type);
    }

    [Fact]
    public void Classifies_weekend_checkin_against_same_week_business_target()
    {
        var result = CheckInClassifier.Classify(
            new DateTimeOffset(2026, 6, 20, 9, 0, 0, TimeSpan.FromHours(-4)),
            new DateOnly(2026, 6, 18),
            Settings);

        Assert.Equal(new DateOnly(2026, 6, 18), result.ActivityDate);
        Assert.Equal(CheckInTypeDto.GymWeekendRecovery, result.Type);
    }
}
