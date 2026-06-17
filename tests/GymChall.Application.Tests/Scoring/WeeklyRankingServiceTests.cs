using GymChall.Application.Challenges;
using GymChall.Application.Scoring;
using GymChall.Domain.Scoring;

namespace GymChall.Application.Tests.Scoring;

public sealed class WeeklyRankingServiceTests
{
    [Fact]
    public void Calculates_all_challenge_weeks_through_requested_date()
    {
        var snapshot = BuildSnapshot(
            startDate: new DateOnly(2026, 6, 15),
            endDate: new DateOnly(2026, 6, 26),
            checkIns: Array.Empty<CheckInDto>(),
            tokens: Array.Empty<FullCoverageTokenDto>());

        var weeks = RankingService.CalculateWeeklyRankings(snapshot, new DateOnly(2026, 6, 26));

        Assert.Equal(2, weeks.Count);
        Assert.Equal(new DateOnly(2026, 6, 15), weeks[0].WeekStartDate);
        Assert.Equal(new DateOnly(2026, 6, 22), weeks[1].WeekStartDate);
    }

    [Fact]
    public void Full_coverage_token_keeps_week_perfect()
    {
        var ids = TestIds.Default;
        var weekStart = new DateOnly(2026, 6, 15);
        var checkIns = MorningWeek(ids.ChallengeId, ids.RafaId, ids.ClariId, weekStart)
            .Where(x => x.ParticipantId != ids.ClariId || x.ActivityDate != weekStart.AddDays(1))
            .ToArray();
        var tokens = new[]
        {
            new FullCoverageTokenDto(Guid.NewGuid(), ids.ChallengeId, ids.ClariId, weekStart.AddDays(1), ExceptionTokenTypeDto.Health, ExceptionReasonCategoryDto.Health, ExceptionTokenStatusDto.Applied)
        };
        var snapshot = BuildSnapshot(weekStart, weekStart.AddDays(4), checkIns, tokens);

        var ranking = RankingService.CalculateWeeklyRanking(snapshot, weekStart, weekStart.AddDays(4));
        var row = ranking.Rows.Single();

        Assert.Equal("Perfect", row.WeeklyBonusType);
        Assert.Equal("Perfect", row.WeeklyBonusCandidateType);
        Assert.Equal(12m, row.WeeklyBonusCandidatePoints);
        Assert.Equal(12m, row.WeeklyBonusPoints);
        Assert.Equal(32m, row.IndividualPoints);
        Assert.Equal(5m, row.DailyBonusPoints);
        Assert.Equal(49m, row.TotalPoints);
    }

    [Fact]
    public void Same_day_recovery_gives_complete_week_bonus_without_daily_bonus_for_that_day()
    {
        var ids = TestIds.Default;
        var weekStart = new DateOnly(2026, 6, 15);
        var checkIns = MorningWeek(ids.ChallengeId, ids.RafaId, ids.ClariId, weekStart)
            .Where(x => x.ParticipantId != ids.ClariId || x.ActivityDate != weekStart.AddDays(1))
            .Append(new CheckInDto(Guid.NewGuid(), ids.ChallengeId, ids.ClariId, weekStart.AddDays(1), CheckInTypeDto.GymSameDayRecovery, 45))
            .ToArray();
        var snapshot = BuildSnapshot(weekStart, weekStart.AddDays(4), checkIns, Array.Empty<FullCoverageTokenDto>());

        var ranking = RankingService.CalculateWeeklyRanking(snapshot, weekStart, weekStart.AddDays(4));
        var row = ranking.Rows.Single();

        Assert.Equal("Complete", row.WeeklyBonusType);
        Assert.Equal("Complete", row.WeeklyBonusCandidateType);
        Assert.Equal(7m, row.WeeklyBonusCandidatePoints);
        Assert.Equal(7m, row.WeeklyBonusPoints);
        Assert.Equal(31m, row.IndividualPoints);
        Assert.Equal(4m, row.DailyBonusPoints);
        Assert.Equal(42m, row.TotalPoints);
    }

    [Fact]
    public void Current_week_does_not_award_weekly_bonus_before_required_business_days_are_complete()
    {
        var ids = TestIds.Default;
        var weekStart = new DateOnly(2026, 6, 15);
        var throughDate = weekStart.AddDays(1);
        var checkIns = Enumerable.Range(0, 2)
            .SelectMany(offset => new[]
            {
                new CheckInDto(Guid.NewGuid(), ids.ChallengeId, ids.RafaId, weekStart.AddDays(offset), CheckInTypeDto.GymMorning, 0),
                new CheckInDto(Guid.NewGuid(), ids.ChallengeId, ids.ClariId, weekStart.AddDays(offset), CheckInTypeDto.GymMorning, 0)
            })
            .ToArray();
        var snapshot = BuildSnapshot(weekStart, weekStart.AddDays(4), checkIns, Array.Empty<FullCoverageTokenDto>());

        var ranking = RankingService.CalculateWeeklyRanking(snapshot, weekStart, throughDate);
        var row = ranking.Rows.Single();

        Assert.Equal("None", row.WeeklyBonusType);
        Assert.Equal("Perfect", row.WeeklyBonusCandidateType);
        Assert.Equal(12m, row.WeeklyBonusCandidatePoints);
        Assert.Equal(0m, row.WeeklyBonusPoints);
        Assert.Equal(14m, row.IndividualPoints);
        Assert.Equal(2m, row.DailyBonusPoints);
        Assert.Equal(16m, row.TotalPoints);
        Assert.Equal(5, row.RequiredBusinessDays);
    }

    [Fact]
    public void Current_week_candidate_stops_when_a_required_day_is_missing_so_far()
    {
        var ids = TestIds.Default;
        var weekStart = new DateOnly(2026, 6, 15);
        var throughDate = weekStart.AddDays(2);
        var checkIns = new[]
        {
            new CheckInDto(Guid.NewGuid(), ids.ChallengeId, ids.ClariId, weekStart, CheckInTypeDto.GymMorning, 0),
            new CheckInDto(Guid.NewGuid(), ids.ChallengeId, ids.RafaId, weekStart.AddDays(1), CheckInTypeDto.GymMorning, 0),
            new CheckInDto(Guid.NewGuid(), ids.ChallengeId, ids.ClariId, weekStart.AddDays(1), CheckInTypeDto.GymMorning, 0),
            new CheckInDto(Guid.NewGuid(), ids.ChallengeId, ids.RafaId, weekStart.AddDays(2), CheckInTypeDto.GymMorning, 0),
            new CheckInDto(Guid.NewGuid(), ids.ChallengeId, ids.ClariId, weekStart.AddDays(2), CheckInTypeDto.GymMorning, 0)
        };
        var snapshot = BuildSnapshot(weekStart, weekStart.AddDays(4), checkIns, Array.Empty<FullCoverageTokenDto>());

        var ranking = RankingService.CalculateWeeklyRanking(snapshot, weekStart, throughDate);
        var row = ranking.Rows.Single();

        Assert.Equal("None", row.WeeklyBonusType);
        Assert.Equal("None", row.WeeklyBonusCandidateType);
        Assert.Equal(0m, row.WeeklyBonusCandidatePoints);
        Assert.Equal(0m, row.WeeklyBonusPoints);
    }

    [Fact]
    public void Current_week_candidate_downgrades_to_complete_after_same_day_recovery()
    {
        var ids = TestIds.Default;
        var weekStart = new DateOnly(2026, 6, 15);
        var throughDate = weekStart.AddDays(2);
        var checkIns = Enumerable.Range(0, 3)
            .SelectMany(offset => new[]
            {
                new CheckInDto(Guid.NewGuid(), ids.ChallengeId, ids.RafaId, weekStart.AddDays(offset), CheckInTypeDto.GymMorning, 0),
                new CheckInDto(Guid.NewGuid(), ids.ChallengeId, ids.ClariId, weekStart.AddDays(offset), CheckInTypeDto.GymMorning, 0)
            })
            .Where(x => x.ParticipantId != ids.ClariId || x.ActivityDate != weekStart.AddDays(1))
            .Append(new CheckInDto(Guid.NewGuid(), ids.ChallengeId, ids.ClariId, weekStart.AddDays(1), CheckInTypeDto.GymSameDayRecovery, 0))
            .ToArray();
        var snapshot = BuildSnapshot(weekStart, weekStart.AddDays(4), checkIns, Array.Empty<FullCoverageTokenDto>());

        var ranking = RankingService.CalculateWeeklyRanking(snapshot, weekStart, throughDate);
        var row = ranking.Rows.Single();

        Assert.Equal("None", row.WeeklyBonusType);
        Assert.Equal("Complete", row.WeeklyBonusCandidateType);
        Assert.Equal(7m, row.WeeklyBonusCandidatePoints);
        Assert.Equal(0m, row.WeeklyBonusPoints);
    }

    [Fact]
    public void Partial_challenge_week_awards_bonus_after_challenge_end()
    {
        var ids = TestIds.Default;
        var weekStart = new DateOnly(2026, 6, 15);
        var challengeStart = weekStart.AddDays(2);
        var challengeEnd = weekStart.AddDays(4);
        var checkIns = Enumerable.Range(2, 3)
            .SelectMany(offset => new[]
            {
                new CheckInDto(Guid.NewGuid(), ids.ChallengeId, ids.RafaId, weekStart.AddDays(offset), CheckInTypeDto.GymMorning, 0),
                new CheckInDto(Guid.NewGuid(), ids.ChallengeId, ids.ClariId, weekStart.AddDays(offset), CheckInTypeDto.GymMorning, 0)
            })
            .ToArray();
        var snapshot = BuildSnapshot(challengeStart, challengeEnd, checkIns, Array.Empty<FullCoverageTokenDto>());

        var ranking = RankingService.CalculateWeeklyRanking(snapshot, weekStart, challengeEnd);
        var row = ranking.Rows.Single();

        Assert.Equal("Perfect", row.WeeklyBonusType);
        Assert.Equal(12m, row.WeeklyBonusPoints);
        Assert.Equal(18m, row.IndividualPoints);
        Assert.Equal(3m, row.DailyBonusPoints);
        Assert.Equal(33m, row.TotalPoints);
        Assert.Equal(3, row.RequiredBusinessDays);
    }

    private static ChallengeSnapshotDto BuildSnapshot(
        DateOnly startDate,
        DateOnly endDate,
        IReadOnlyList<CheckInDto> checkIns,
        IReadOnlyList<FullCoverageTokenDto> tokens)
    {
        var ids = TestIds.Default;

        return new ChallengeSnapshotDto(
            new ChallengeDto(ids.ChallengeId, "Reto", startDate, endDate, ids.RafaId, "America/Asuncion"),
            ChallengeSettings.Default,
            new[]
            {
                new ParticipantDto(ids.RafaId, "Rafa", "rafa", ParticipantRoleDto.Admin, "male", true),
                new ParticipantDto(ids.ClariId, "Clari", "clari", ParticipantRoleDto.Participant, "female", true)
            },
            new[]
            {
                new CoupleDto(ids.CoupleId, ids.ChallengeId, "Rafa + Clari", new[] { ids.RafaId, ids.ClariId }, true)
            },
            checkIns,
            tokens);
    }

    private static IReadOnlyList<CheckInDto> MorningWeek(Guid challengeId, Guid firstParticipantId, Guid secondParticipantId, DateOnly weekStart)
    {
        return Enumerable.Range(0, 5)
            .SelectMany(offset => new[]
            {
                new CheckInDto(Guid.NewGuid(), challengeId, firstParticipantId, weekStart.AddDays(offset), CheckInTypeDto.GymMorning, 45),
                new CheckInDto(Guid.NewGuid(), challengeId, secondParticipantId, weekStart.AddDays(offset), CheckInTypeDto.GymMorning, 45)
            })
            .ToArray();
    }

    private sealed record TestIds(Guid ChallengeId, Guid CoupleId, Guid RafaId, Guid ClariId)
    {
        public static TestIds Default { get; } = new(
            Guid.Parse("11111111-1111-1111-1111-111111111111"),
            Guid.Parse("22222222-2222-2222-2222-222222222222"),
            Guid.Parse("33333333-3333-3333-3333-333333333333"),
            Guid.Parse("44444444-4444-4444-4444-444444444444"));
    }
}
