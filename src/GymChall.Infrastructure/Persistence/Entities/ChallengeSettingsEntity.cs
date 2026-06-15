using GymChall.Domain.Scoring;

namespace GymChall.Infrastructure.Persistence.Entities;

public sealed class ChallengeSettingsEntity
{
    public Guid Id { get; set; }
    public Guid ChallengeId { get; set; }
    public decimal MondayMorningPoints { get; set; } = ChallengeSettings.Default.MondayMorningPoints;
    public decimal WeekdayMorningPoints { get; set; } = ChallengeSettings.Default.WeekdayMorningPoints;
    public decimal SameDayRecoveryPoints { get; set; } = ChallengeSettings.Default.SameDayRecoveryPoints;
    public decimal WeekendRecoveryPoints { get; set; } = ChallengeSettings.Default.WeekendRecoveryPoints;
    public decimal DailyCoupleBonus { get; set; } = ChallengeSettings.Default.DailyCoupleBonus;
    public decimal PerfectWeekBonus { get; set; } = ChallengeSettings.Default.PerfectWeekBonus;
    public decimal CompleteWeekBonus { get; set; } = ChallengeSettings.Default.CompleteWeekBonus;
    public decimal RescuedWeekBonus { get; set; } = ChallengeSettings.Default.RescuedWeekBonus;
    public decimal LakeSoloPoints { get; set; } = ChallengeSettings.Default.LakeSoloPoints;
    public decimal LakeCouplePoints { get; set; } = ChallengeSettings.Default.LakeCouplePoints;
    public int MaxLakeScoringPerCouplePerWeek { get; set; } = ChallengeSettings.Default.MaxLakeScoringPerCouplePerWeek;
    public int MaxWeekendRecoveriesPerPersonPerWeek { get; set; } = ChallengeSettings.Default.MaxWeekendRecoveriesPerPersonPerWeek;
    public int GymMinimumMinutes { get; set; } = 45;
    public TimeOnly MorningWindowStart { get; set; } = new(4, 50);
    public TimeOnly MorningWindowEnd { get; set; } = new(5, 30);
    public ChallengeEntity? Challenge { get; set; }
}
