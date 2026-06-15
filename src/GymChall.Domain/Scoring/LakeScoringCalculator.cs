namespace GymChall.Domain.Scoring;

public static class LakeScoringCalculator
{
    public static LakeScoreResult Calculate(
        IEnumerable<LakeActivityInput> activities,
        Guid firstParticipantId,
        Guid secondParticipantId,
        ChallengeSettings settings)
    {
        var validActivities = activities
            .Where(activity => activity.IsAssociatedToValidGym)
            .OrderBy(activity => activity.ActivityDate)
            .ToArray();

        var scoringActivities = validActivities
            .Take(settings.MaxLakeScoringPerCouplePerWeek)
            .ToArray();

        var points = scoringActivities.Sum(activity =>
            IsCoupleActivity(activity, firstParticipantId, secondParticipantId)
                ? settings.LakeCouplePoints
                : settings.LakeSoloPoints);

        return new LakeScoreResult(
            Points: points,
            ScoringActivities: scoringActivities.Length,
            TotalValidActivities: validActivities.Length);
    }

    private static bool IsCoupleActivity(LakeActivityInput activity, Guid firstParticipantId, Guid secondParticipantId)
    {
        return activity.ParticipantIds.Contains(firstParticipantId)
            && activity.ParticipantIds.Contains(secondParticipantId);
    }
}
