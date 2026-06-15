using GymChall.Domain.Scoring;

namespace GymChall.Domain.Tests.Scoring;

public sealed class ChallengeSettingsTests
{
    [Fact]
    public void Defaults_match_current_challenge_rules()
    {
        var settings = ChallengeSettings.Default;

        Assert.Equal(4m, settings.MondayMorningPoints);
        Assert.Equal(3m, settings.WeekdayMorningPoints);
        Assert.Equal(2m, settings.SameDayRecoveryPoints);
        Assert.Equal(1.5m, settings.WeekendRecoveryPoints);
        Assert.Equal(1m, settings.DailyCoupleBonus);
        Assert.Equal(12m, settings.PerfectWeekBonus);
        Assert.Equal(7m, settings.CompleteWeekBonus);
        Assert.Equal(4m, settings.RescuedWeekBonus);
        Assert.Equal(1m, settings.LakeSoloPoints);
        Assert.Equal(3m, settings.LakeCouplePoints);
        Assert.Equal(2, settings.MaxLakeScoringPerCouplePerWeek);
        Assert.Equal(2, settings.MaxWeekendRecoveriesPerPersonPerWeek);
    }
}
