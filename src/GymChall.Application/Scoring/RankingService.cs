using GymChall.Application.Challenges;
using GymChall.Domain.Scoring;

namespace GymChall.Application.Scoring;

public sealed record CoupleRankingRow(Guid CoupleId, string CoupleName, decimal TotalPoints, int MorningStreak, int GymStreak);
public sealed record WeeklyRankingDto(DateOnly WeekStartDate, DateOnly WeekEndDate, IReadOnlyList<WeeklyRankingRowDto> Rows);
public sealed record WeeklyRankingRowDto(
    Guid CoupleId,
    string CoupleName,
    decimal IndividualPoints,
    decimal DailyBonusPoints,
    decimal WeeklyBonusPoints,
    decimal TotalPoints,
    string WeeklyBonusType,
    int RequiredBusinessDays);

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

    public static IReadOnlyList<WeeklyRankingDto> CalculateWeeklyRankings(ChallengeSnapshotDto snapshot, DateOnly throughDate)
    {
        var cappedThroughDate = Min(snapshot.Challenge.EndDate, throughDate);
        if (cappedThroughDate < snapshot.Challenge.StartDate)
        {
            return Array.Empty<WeeklyRankingDto>();
        }

        var firstWeekStart = StartOfWeek(snapshot.Challenge.StartDate);
        var rankings = new List<WeeklyRankingDto>();

        for (var weekStart = firstWeekStart; weekStart <= cappedThroughDate; weekStart = weekStart.AddDays(7))
        {
            rankings.Add(CalculateWeeklyRanking(snapshot, weekStart, cappedThroughDate));
        }

        return rankings;
    }

    public static WeeklyRankingDto CalculateWeeklyRanking(ChallengeSnapshotDto snapshot, DateOnly weekStartDate, DateOnly throughDate)
    {
        var cappedThroughDate = Min(snapshot.Challenge.EndDate, throughDate);
        var weekEndDate = weekStartDate.AddDays(6);
        var scoredDates = BusinessDates(Max(snapshot.Challenge.StartDate, weekStartDate), Min(weekEndDate, cappedThroughDate)).ToArray();
        var requiredDates = BusinessDates(Max(snapshot.Challenge.StartDate, weekStartDate), Min(weekEndDate, snapshot.Challenge.EndDate)).ToArray();

        var rows = snapshot.Couples
            .Where(couple => couple.Active && couple.ParticipantIds.Count == 2)
            .Select(couple => CalculateWeeklyCouple(snapshot, couple, scoredDates, requiredDates.Length))
            .OrderByDescending(row => row.TotalPoints)
            .ThenBy(row => row.CoupleName)
            .ToArray();

        return new WeeklyRankingDto(weekStartDate, weekEndDate, rows);
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

    private static WeeklyRankingRowDto CalculateWeeklyCouple(
        ChallengeSnapshotDto snapshot,
        CoupleDto couple,
        IReadOnlyList<DateOnly> scoredDates,
        int requiredBusinessDays)
    {
        var firstId = couple.ParticipantIds[0];
        var secondId = couple.ParticipantIds[1];
        var dailyPairs = new List<(DailyScoreResult First, DailyScoreResult Second)>();
        var dailyBonusPoints = 0m;

        foreach (var date in scoredDates)
        {
            var first = ScoreParticipant(snapshot, firstId, date);
            var second = ScoreParticipant(snapshot, secondId, date);
            var daily = CoupleDailyScoreCalculator.Calculate(first, second, lakePoints: 0m, snapshot.Settings);

            dailyPairs.Add((first, second));
            dailyBonusPoints += daily.DailyBonusPoints;
        }

        var individualPoints = dailyPairs.Sum(pair => pair.First.Points + pair.Second.Points);
        var weeklyBonusPoints = 0m;
        var weeklyBonusType = WeeklyBonusType.None.ToString();

        if (requiredBusinessDays > 0 && scoredDates.Count == requiredBusinessDays)
        {
            var weekly = WeeklyScoreCalculator.Calculate(new WeeklyScoreInput(dailyPairs), snapshot.Settings);
            individualPoints = weekly.IndividualPoints;
            weeklyBonusPoints = weekly.WeeklyBonusPoints;
            weeklyBonusType = weekly.WeeklyBonusType.ToString();
        }

        var total = individualPoints + dailyBonusPoints + weeklyBonusPoints;

        return new WeeklyRankingRowDto(
            couple.Id,
            couple.Name,
            individualPoints,
            dailyBonusPoints,
            weeklyBonusPoints,
            total,
            weeklyBonusType,
            requiredBusinessDays);
    }

    private static DailyScoreResult ScoreParticipant(ChallengeSnapshotDto snapshot, Guid participantId, DateOnly date)
    {
        var appliedTokens = snapshot.FullCoverageTokens
            .Where(token =>
                token.ParticipantId == participantId &&
                token.TargetDate == date &&
                token.Status == ExceptionTokenStatusDto.Applied)
            .ToArray();

        if (appliedTokens.Any(token => token.Type is ExceptionTokenTypeDto.Health or ExceptionTokenTypeDto.Mandatory))
        {
            return DailyScoreCalculator.Calculate(new DailyScoreInput(date, CoverageKind.FullToken), snapshot.Settings);
        }

        var checkIn = snapshot.CheckIns
            .Where(x => x.ParticipantId == participantId && x.ActivityDate == date)
            .OrderBy(x => x.Type)
            .FirstOrDefault();

        if (checkIn is not null && appliedTokens.Any(token => token.Type == ExceptionTokenTypeDto.ScheduleChange))
        {
            return DailyScoreCalculator.Calculate(new DailyScoreInput(date, CoverageKind.MovedSchedule), snapshot.Settings);
        }

        var coverage = checkIn?.Type switch
        {
            CheckInTypeDto.GymMorning => CoverageKind.Morning,
            CheckInTypeDto.GymSameDayRecovery => CoverageKind.SameDayRecovery,
            CheckInTypeDto.GymWeekendRecovery => CoverageKind.WeekendRecovery,
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

    private static DateOnly Max(DateOnly first, DateOnly second)
    {
        return first >= second ? first : second;
    }

    private static DateOnly StartOfWeek(DateOnly date)
    {
        var daysSinceMonday = ((int)date.DayOfWeek - (int)DayOfWeek.Monday + 7) % 7;
        return date.AddDays(-daysSinceMonday);
    }
}
