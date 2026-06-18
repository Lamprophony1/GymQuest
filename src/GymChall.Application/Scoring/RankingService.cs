using GymChall.Application.Challenges;
using GymChall.Domain.Scoring;

namespace GymChall.Application.Scoring;

public sealed record CoupleRankingRow(Guid CoupleId, string CoupleName, decimal TotalPoints, int MorningStreak, int GymStreak);
public sealed record RankingEvaluationDates(
    DateOnly ScoreThroughDate,
    DateOnly MorningStreakExpiredThroughDate,
    DateOnly GymStreakExpiredThroughDate)
{
    private static readonly TimeSpan MorningStreakDeadline = new(6, 30, 0);

    public static RankingEvaluationDates ForFixedThroughDate(DateOnly throughDate)
    {
        return new RankingEvaluationDates(throughDate, throughDate, throughDate);
    }

    public static RankingEvaluationDates FromAsOf(ChallengeDto challenge, DateTimeOffset asOf)
    {
        var localAsOf = ConvertToTimezone(asOf, challenge.Timezone);
        var localDate = DateOnly.FromDateTime(localAsOf.DateTime);
        var scoreThroughDate = Min(challenge.EndDate, localDate);
        var morningExpiredThroughDate = localAsOf.TimeOfDay > MorningStreakDeadline
            ? localDate
            : localDate.AddDays(-1);
        var gymExpiredThroughDate = localDate.AddDays(-1);

        return new RankingEvaluationDates(
            scoreThroughDate,
            Min(challenge.EndDate, morningExpiredThroughDate),
            Min(challenge.EndDate, gymExpiredThroughDate));
    }

    private static DateTimeOffset ConvertToTimezone(DateTimeOffset dateTime, string timezone)
    {
        var zone = ResolveTimezone(timezone);
        return zone is null ? dateTime : TimeZoneInfo.ConvertTime(dateTime, zone);
    }

    private static TimeZoneInfo? ResolveTimezone(string timezone)
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById(timezone);
        }
        catch (TimeZoneNotFoundException) when (timezone == "America/Asuncion")
        {
            return ResolveWindowsParaguayTimezone();
        }
        catch (TimeZoneNotFoundException)
        {
            return null;
        }
        catch (InvalidTimeZoneException)
        {
            return null;
        }
    }

    private static TimeZoneInfo? ResolveWindowsParaguayTimezone()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById("Paraguay Standard Time");
        }
        catch (TimeZoneNotFoundException)
        {
            return null;
        }
        catch (InvalidTimeZoneException)
        {
            return null;
        }
    }

    private static DateOnly Min(DateOnly first, DateOnly second)
    {
        return first <= second ? first : second;
    }
}

public sealed record WeeklyRankingDto(DateOnly WeekStartDate, DateOnly WeekEndDate, IReadOnlyList<WeeklyRankingRowDto> Rows);
public sealed record WeeklyRankingRowDto(
    Guid CoupleId,
    string CoupleName,
    decimal IndividualPoints,
    decimal DailyBonusPoints,
    decimal WeeklyBonusPoints,
    decimal TotalPoints,
    string WeeklyBonusType,
    string WeeklyBonusCandidateType,
    decimal WeeklyBonusCandidatePoints,
    int RequiredBusinessDays);

public static class RankingService
{
    public static IReadOnlyList<CoupleRankingRow> CalculateGeneralRanking(ChallengeSnapshotDto snapshot, DateOnly throughDate)
    {
        return CalculateGeneralRanking(snapshot, RankingEvaluationDates.ForFixedThroughDate(throughDate));
    }

    public static IReadOnlyList<CoupleRankingRow> CalculateGeneralRanking(ChallengeSnapshotDto snapshot, RankingEvaluationDates evaluation)
    {
        var dates = BusinessDates(snapshot.Challenge.StartDate, Min(snapshot.Challenge.EndDate, evaluation.ScoreThroughDate)).ToArray();

        return snapshot.Couples
            .Where(couple => couple.Active && couple.ParticipantIds.Count == 2)
            .Select(couple => CalculateCouple(snapshot, couple, dates, evaluation))
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

    private static CoupleRankingRow CalculateCouple(
        ChallengeSnapshotDto snapshot,
        CoupleDto couple,
        IReadOnlyList<DateOnly> dates,
        RankingEvaluationDates evaluation)
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
            else if (date <= evaluation.MorningStreakExpiredThroughDate)
            {
                morningStreak = 0;
            }

            if (first.CountsForGymStreak && second.CountsForGymStreak)
            {
                gymStreak++;
            }
            else if (date <= evaluation.GymStreakExpiredThroughDate)
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
        var candidate = CalculateWeeklyBonusCandidate(dailyPairs, snapshot.Settings);

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
            candidate.Type,
            candidate.Points,
            requiredBusinessDays);
    }

    private static (string Type, decimal Points) CalculateWeeklyBonusCandidate(
        IReadOnlyList<(DailyScoreResult First, DailyScoreResult Second)> dailyPairs,
        ChallengeSettings settings)
    {
        if (dailyPairs.Count == 0 || dailyPairs.Any(pair => !pair.First.IsCovered || !pair.Second.IsCovered))
        {
            return (WeeklyBonusType.None.ToString(), 0m);
        }

        if (dailyPairs.Any(pair => pair.First.CountsForRescuedWeek || pair.Second.CountsForRescuedWeek))
        {
            return (WeeklyBonusType.Rescued.ToString(), settings.RescuedWeekBonus);
        }

        if (dailyPairs.Any(pair => pair.First.CountsForCompleteWeek || pair.Second.CountsForCompleteWeek))
        {
            return (WeeklyBonusType.Complete.ToString(), settings.CompleteWeekBonus);
        }

        if (dailyPairs.All(pair => pair.First.CountsForPerfectWeek && pair.Second.CountsForPerfectWeek))
        {
            return (WeeklyBonusType.Perfect.ToString(), settings.PerfectWeekBonus);
        }

        return (WeeklyBonusType.None.ToString(), 0m);
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
