namespace GymChall.Domain.Scoring;

public static class LakeScoringCalculator
{
    public static LakeScoreResult Calculate(
        IEnumerable<LakeActivityInput> activities,
        Guid firstParticipantId,
        Guid secondParticipantId,
        ChallengeSettings settings)
    {
        if (firstParticipantId == secondParticipantId)
        {
            throw new ArgumentException("Lake scoring requires two distinct couple participants.", nameof(secondParticipantId));
        }

        var validActivities = activities
            .Select((activity, originalOrder) => new
            {
                Activity = activity,
                OriginalOrder = originalOrder,
                Classification = Classify(activity, firstParticipantId, secondParticipantId)
            })
            .Where(activity => activity.Activity.IsAssociatedToValidGym
                && activity.Classification != LakeActivityClassification.Invalid)
            .OrderBy(activity => activity.Activity.ActivityDate)
            .ThenBy(activity => activity.OriginalOrder)
            .ToArray();

        var scoringActivities = validActivities
            .Take(settings.MaxLakeScoringPerCouplePerWeek)
            .ToArray();

        var points = scoringActivities.Sum(activity =>
            activity.Classification == LakeActivityClassification.Couple
                ? settings.LakeCouplePoints
                : settings.LakeSoloPoints);

        return new LakeScoreResult(
            Points: points,
            ScoringActivities: scoringActivities.Length,
            TotalValidActivities: validActivities.Length);
    }

    private static LakeActivityClassification Classify(
        LakeActivityInput activity,
        Guid firstParticipantId,
        Guid secondParticipantId)
    {
        var participantIds = activity.ParticipantIds.ToArray();

        if (participantIds.Length == 1)
        {
            return participantIds[0] == firstParticipantId || participantIds[0] == secondParticipantId
                ? LakeActivityClassification.Solo
                : LakeActivityClassification.Invalid;
        }

        if (participantIds.Length == 2
            && participantIds[0] != participantIds[1]
            && participantIds.Contains(firstParticipantId)
            && participantIds.Contains(secondParticipantId))
        {
            return LakeActivityClassification.Couple;
        }

        return LakeActivityClassification.Invalid;
    }

    private enum LakeActivityClassification
    {
        Invalid,
        Solo,
        Couple
    }
}
