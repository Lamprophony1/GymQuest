using GymChall.Domain.Scoring;

namespace GymChall.Domain.Tests.Scoring;

public sealed class LakeScoringCalculatorTests
{
    private static readonly Guid Rafa = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid Clari = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    [Fact]
    public void Solo_lake_activity_scores_one_point_when_associated_to_valid_gym()
    {
        var activities = new[]
        {
            new LakeActivityInput(new DateOnly(2026, 6, 16), new[] { Rafa }, IsAssociatedToValidGym: true)
        };

        var result = LakeScoringCalculator.Calculate(activities, Rafa, Clari, ChallengeSettings.Default);

        Assert.Equal(1m, result.Points);
        Assert.Equal(1, result.ScoringActivities);
        Assert.Equal(1, result.TotalValidActivities);
    }

    [Fact]
    public void Couple_lake_activity_scores_three_only_when_both_are_in_same_activity()
    {
        var activities = new[]
        {
            new LakeActivityInput(new DateOnly(2026, 6, 16), new[] { Rafa, Clari }, IsAssociatedToValidGym: true)
        };

        var result = LakeScoringCalculator.Calculate(activities, Rafa, Clari, ChallengeSettings.Default);

        Assert.Equal(3m, result.Points);
    }

    [Fact]
    public void Separate_solo_activities_do_not_score_as_couple_activity()
    {
        var activities = new[]
        {
            new LakeActivityInput(new DateOnly(2026, 6, 16), new[] { Rafa }, IsAssociatedToValidGym: true),
            new LakeActivityInput(new DateOnly(2026, 6, 16), new[] { Clari }, IsAssociatedToValidGym: true)
        };

        var result = LakeScoringCalculator.Calculate(activities, Rafa, Clari, ChallengeSettings.Default);

        Assert.Equal(2m, result.Points);
    }

    [Fact]
    public void Lake_without_valid_gym_scores_zero()
    {
        var activities = new[]
        {
            new LakeActivityInput(new DateOnly(2026, 6, 16), new[] { Rafa, Clari }, IsAssociatedToValidGym: false)
        };

        var result = LakeScoringCalculator.Calculate(activities, Rafa, Clari, ChallengeSettings.Default);

        Assert.Equal(0m, result.Points);
        Assert.Equal(0, result.ScoringActivities);
    }

    [Fact]
    public void Only_first_two_valid_lake_activities_score()
    {
        var activities = new[]
        {
            new LakeActivityInput(new DateOnly(2026, 6, 16), new[] { Rafa, Clari }, IsAssociatedToValidGym: true),
            new LakeActivityInput(new DateOnly(2026, 6, 17), new[] { Rafa }, IsAssociatedToValidGym: true),
            new LakeActivityInput(new DateOnly(2026, 6, 18), new[] { Rafa, Clari }, IsAssociatedToValidGym: true)
        };

        var result = LakeScoringCalculator.Calculate(activities, Rafa, Clari, ChallengeSettings.Default);

        Assert.Equal(4m, result.Points);
        Assert.Equal(2, result.ScoringActivities);
        Assert.Equal(3, result.TotalValidActivities);
    }
}
