using GymChall.Application.Challenges;
using GymChall.Domain.Scoring;

namespace GymChall.Application.Scoring;

public sealed record CoupleRankingRow(Guid CoupleId, string CoupleName, decimal TotalPoints, int MorningStreak, int GymStreak);

public static class RankingService
{
    public static IReadOnlyList<CoupleRankingRow> CalculateGeneralRanking(ChallengeSnapshotDto snapshot, DateOnly throughDate)
    {
        var dates = BusinessDates(snapshot.Challenge.StartDate, Min(snapshot.Challenge.EndDate, throughDate)).ToArray();

        return snapshot.Couples
            .Where(couple => couple.Active && couple.ParticipantIds.Count == 2)
            .Select(couple => CalculateCouple(snapshot, couple, dates))
            .OrderByDescending(row => row.TotalPoints)
            .ThenBy(row => row.CoupleName)
            .ToArray();
    }

    private static CoupleRankingRow CalculateCouple(ChallengeSnapshotDto snapshot, CoupleDto couple, IReadOnlyList<DateOnly> dates)
    {
        var firstId = couple.ParticipantIds[0];
        var secondId = couple.ParticipantIds[1];
        var total = 0m;
        var morningStreak = 0;
        var gymStreak = 0;

        foreach (var date in dates)
        {
            var first = ScoreParticipant(snapshot, firstId, date);
            var second = ScoreParticipant(snapshot, secondId, date);
            var daily = CoupleDailyScoreCalculator.Calculate(first, second, lakePoints: 0m, snapshot.Settings);
            total += daily.TotalPoints;

            if (first.CountsForMorningStreak && second.CountsForMorningStreak)
            {
                morningStreak++;
            }
            else
            {
                morningStreak = 0;
            }

            if (first.CountsForGymStreak && second.CountsForGymStreak)
            {
                gymStreak++;
            }
            else
            {
                gymStreak = 0;
            }
        }

        return new CoupleRankingRow(couple.Id, couple.Name, total, morningStreak, gymStreak);
    }

    private static DailyScoreResult ScoreParticipant(ChallengeSnapshotDto snapshot, Guid participantId, DateOnly date)
    {
        if (snapshot.FullCoverageTokens.Any(token => token.ParticipantId == participantId && token.TargetDate == date))
        {
            return DailyScoreCalculator.Calculate(new DailyScoreInput(date, CoverageKind.FullToken), snapshot.Settings);
        }

        var checkIn = snapshot.CheckIns
            .Where(x => x.ParticipantId == participantId && x.ActivityDate == date)
            .OrderBy(x => x.Type)
            .FirstOrDefault();

        var coverage = checkIn?.Type switch
        {
            CheckInTypeDto.GymMorning => CoverageKind.Morning,
            CheckInTypeDto.GymSameDayRecovery => CoverageKind.SameDayRecovery,
            _ => CoverageKind.None
        };

        return DailyScoreCalculator.Calculate(new DailyScoreInput(date, coverage), snapshot.Settings);
    }

    private static IEnumerable<DateOnly> BusinessDates(DateOnly start, DateOnly end)
    {
        for (var date = start; date <= end; date = date.AddDays(1))
        {
            if (date.DayOfWeek is not DayOfWeek.Saturday and not DayOfWeek.Sunday)
            {
                yield return date;
            }
        }
    }

    private static DateOnly Min(DateOnly first, DateOnly second)
    {
        return first <= second ? first : second;
    }
}
