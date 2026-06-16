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
        Assert.Equal(0, ranking[0].GymStreak);
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
}
