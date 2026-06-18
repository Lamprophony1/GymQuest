using GymChall.Application.Challenges;
using GymChall.Application.Scoring;
using GymChall.Domain.Scoring;

namespace GymChall.Application.Tests.Scoring;

public sealed class RankingServiceTests
{
    [Fact]
    public void Ranks_couples_using_morning_checkins_tokens_and_same_day_recovery()
    {
        var challengeId = Guid.NewGuid();
        var rafa = Guid.NewGuid();
        var clari = Guid.NewGuid();
        var obelar = Guid.NewGuid();
        var chachi = Guid.NewGuid();
        var coupleOne = Guid.NewGuid();
        var coupleTwo = Guid.NewGuid();

        var snapshot = new ChallengeSnapshotDto(
            new ChallengeDto(challengeId, "Reto", new DateOnly(2026, 6, 15), new DateOnly(2026, 6, 19), rafa, "America/Asuncion"),
            ChallengeSettings.Default,
            new[]
            {
                new ParticipantDto(rafa, "Rafa", "rafa", ParticipantRoleDto.Admin, "male", true),
                new ParticipantDto(clari, "Clari", "clari", ParticipantRoleDto.Participant, "female", true),
                new ParticipantDto(obelar, "Obelar", "obelar", ParticipantRoleDto.Participant, "male", true),
                new ParticipantDto(chachi, "Chachi", "chachi", ParticipantRoleDto.Participant, "female", true)
            },
            new[]
            {
                new CoupleDto(coupleOne, challengeId, "Rafa + Clari", new[] { rafa, clari }, true),
                new CoupleDto(coupleTwo, challengeId, "Obelar + Chachi", new[] { obelar, chachi }, true)
            },
            new[]
            {
                new CheckInDto(Guid.NewGuid(), challengeId, rafa, new DateOnly(2026, 6, 15), CheckInTypeDto.GymMorning, 45),
                new CheckInDto(Guid.NewGuid(), challengeId, clari, new DateOnly(2026, 6, 15), CheckInTypeDto.GymMorning, 45),
                new CheckInDto(Guid.NewGuid(), challengeId, rafa, new DateOnly(2026, 6, 16), CheckInTypeDto.GymMorning, 45),
                new CheckInDto(Guid.NewGuid(), challengeId, obelar, new DateOnly(2026, 6, 15), CheckInTypeDto.GymMorning, 45),
                new CheckInDto(Guid.NewGuid(), challengeId, chachi, new DateOnly(2026, 6, 15), CheckInTypeDto.GymSameDayRecovery, 45)
            },
            new[]
            {
                new FullCoverageTokenDto(Guid.NewGuid(), challengeId, clari, new DateOnly(2026, 6, 16), ExceptionTokenTypeDto.Health, ExceptionReasonCategoryDto.Health, ExceptionTokenStatusDto.Applied)
            });

        var ranking = RankingService.CalculateGeneralRanking(snapshot, throughDate: new DateOnly(2026, 6, 16));

        Assert.Equal("Rafa + Clari", ranking[0].CoupleName);
        Assert.True(ranking[0].TotalPoints > ranking[1].TotalPoints);
        Assert.Equal(2, ranking[0].MorningStreak);
        Assert.Equal(2, ranking[0].GymStreak);
        Assert.Equal(0, ranking[1].GymStreak);
    }

    [Fact]
    public void Schedule_change_token_converts_recovery_into_morning_coverage()
    {
        var challengeId = Guid.NewGuid();
        var rafa = Guid.NewGuid();
        var clari = Guid.NewGuid();
        var coupleId = Guid.NewGuid();
        var targetDate = new DateOnly(2026, 6, 16);

        var snapshot = new ChallengeSnapshotDto(
            new ChallengeDto(challengeId, "Reto", new DateOnly(2026, 6, 15), new DateOnly(2026, 6, 19), rafa, "America/Asuncion"),
            ChallengeSettings.Default,
            new[]
            {
                new ParticipantDto(rafa, "Rafa", "rafa", ParticipantRoleDto.Admin, "male", true),
                new ParticipantDto(clari, "Clari", "clari", ParticipantRoleDto.Participant, "female", true)
            },
            new[]
            {
                new CoupleDto(coupleId, challengeId, "Rafa + Clari", new[] { rafa, clari }, true)
            },
            new[]
            {
                new CheckInDto(Guid.NewGuid(), challengeId, rafa, targetDate, CheckInTypeDto.GymMorning, 0),
                new CheckInDto(Guid.NewGuid(), challengeId, clari, targetDate, CheckInTypeDto.GymSameDayRecovery, 0)
            },
            new[]
            {
                new FullCoverageTokenDto(Guid.NewGuid(), challengeId, clari, targetDate, ExceptionTokenTypeDto.ScheduleChange, ExceptionReasonCategoryDto.OtherApproved, ExceptionTokenStatusDto.Applied)
            });

        var ranking = RankingService.CalculateGeneralRanking(snapshot, targetDate);

        var row = Assert.Single(ranking);
        Assert.Equal(7m, row.TotalPoints);
        Assert.Equal(1, row.MorningStreak);
        Assert.Equal(1, row.GymStreak);
    }

    [Fact]
    public void Live_ranking_uses_challenge_timezone_instead_of_utc_date_at_night()
    {
        var snapshot = BuildTwoPersonSnapshot(
            startDate: new DateOnly(2026, 6, 15),
            endDate: new DateOnly(2026, 6, 19),
            checkIns: MorningCheckInsThrough(new DateOnly(2026, 6, 17)));
        var asOf = new DateTimeOffset(2026, 6, 18, 2, 0, 0, TimeSpan.Zero);

        var ranking = RankingService.CalculateGeneralRanking(
            snapshot,
            RankingEvaluationDates.FromAsOf(snapshot.Challenge, asOf));

        var row = Assert.Single(ranking);
        Assert.Equal(3, row.MorningStreak);
        Assert.Equal(3, row.GymStreak);
    }

    [Fact]
    public void Live_ranking_keeps_perfect_streak_until_morning_deadline()
    {
        var snapshot = BuildTwoPersonSnapshot(
            startDate: new DateOnly(2026, 6, 15),
            endDate: new DateOnly(2026, 6, 19),
            checkIns: MorningCheckInsThrough(new DateOnly(2026, 6, 17)));
        var asOf = new DateTimeOffset(2026, 6, 18, 9, 29, 0, TimeSpan.Zero);

        var ranking = RankingService.CalculateGeneralRanking(
            snapshot,
            RankingEvaluationDates.FromAsOf(snapshot.Challenge, asOf));

        var row = Assert.Single(ranking);
        Assert.Equal(3, row.MorningStreak);
        Assert.Equal(3, row.GymStreak);
    }

    [Fact]
    public void Live_ranking_drops_perfect_streak_after_morning_deadline_but_keeps_gym_streak()
    {
        var snapshot = BuildTwoPersonSnapshot(
            startDate: new DateOnly(2026, 6, 15),
            endDate: new DateOnly(2026, 6, 19),
            checkIns: MorningCheckInsThrough(new DateOnly(2026, 6, 17)));
        var asOf = new DateTimeOffset(2026, 6, 18, 9, 31, 0, TimeSpan.Zero);

        var ranking = RankingService.CalculateGeneralRanking(
            snapshot,
            RankingEvaluationDates.FromAsOf(snapshot.Challenge, asOf));

        var row = Assert.Single(ranking);
        Assert.Equal(0, row.MorningStreak);
        Assert.Equal(3, row.GymStreak);
    }

    [Fact]
    public void Live_ranking_drops_gym_streak_on_the_following_day()
    {
        var snapshot = BuildTwoPersonSnapshot(
            startDate: new DateOnly(2026, 6, 15),
            endDate: new DateOnly(2026, 6, 19),
            checkIns: MorningCheckInsThrough(new DateOnly(2026, 6, 17)));
        var asOf = new DateTimeOffset(2026, 6, 19, 3, 1, 0, TimeSpan.Zero);

        var ranking = RankingService.CalculateGeneralRanking(
            snapshot,
            RankingEvaluationDates.FromAsOf(snapshot.Challenge, asOf));

        var row = Assert.Single(ranking);
        Assert.Equal(0, row.MorningStreak);
        Assert.Equal(0, row.GymStreak);
    }

    private static ChallengeSnapshotDto BuildTwoPersonSnapshot(
        DateOnly startDate,
        DateOnly endDate,
        IReadOnlyList<CheckInDto> checkIns)
    {
        var challengeId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var coupleId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var rafa = Guid.Parse("33333333-3333-3333-3333-333333333333");
        var clari = Guid.Parse("44444444-4444-4444-4444-444444444444");

        return new ChallengeSnapshotDto(
            new ChallengeDto(challengeId, "Reto", startDate, endDate, rafa, "America/Asuncion"),
            ChallengeSettings.Default,
            new[]
            {
                new ParticipantDto(rafa, "Rafa", "rafa", ParticipantRoleDto.Admin, "male", true),
                new ParticipantDto(clari, "Clari", "clari", ParticipantRoleDto.Participant, "female", true)
            },
            new[]
            {
                new CoupleDto(coupleId, challengeId, "Rafa + Clari", new[] { rafa, clari }, true)
            },
            checkIns,
            Array.Empty<FullCoverageTokenDto>());
    }

    private static IReadOnlyList<CheckInDto> MorningCheckInsThrough(DateOnly throughDate)
    {
        var challengeId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var rafa = Guid.Parse("33333333-3333-3333-3333-333333333333");
        var clari = Guid.Parse("44444444-4444-4444-4444-444444444444");
        var startDate = new DateOnly(2026, 6, 15);

        return Enumerable.Range(0, throughDate.DayNumber - startDate.DayNumber + 1)
            .Select(offset => startDate.AddDays(offset))
            .Where(date => date.DayOfWeek is not DayOfWeek.Saturday and not DayOfWeek.Sunday)
            .SelectMany(date => new[]
            {
                new CheckInDto(Guid.NewGuid(), challengeId, rafa, date, CheckInTypeDto.GymMorning, 45),
                new CheckInDto(Guid.NewGuid(), challengeId, clari, date, CheckInTypeDto.GymMorning, 45)
            })
            .ToArray();
    }
}
