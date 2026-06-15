using GymChall.Application.Abstractions;
using GymChall.Application.Challenges;
using GymChall.Domain.Scoring;
using GymChall.Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace GymChall.Infrastructure.Persistence;

public sealed class GymChallRepository(GymChallDbContext db) : IGymChallRepository
{
    public async Task CreateChallengeAsync(ChallengeCreateDto challenge, CancellationToken cancellationToken = default)
    {
        db.Challenges.Add(new ChallengeEntity
        {
            Id = challenge.Id,
            Name = challenge.Name,
            StartDate = challenge.StartDate,
            EndDate = challenge.EndDate,
            Status = ChallengeStatus.Active,
            AdminParticipantId = challenge.AdminParticipantId,
            Timezone = challenge.Timezone
        });

        db.ChallengeSettings.Add(new ChallengeSettingsEntity
        {
            Id = Guid.NewGuid(),
            ChallengeId = challenge.Id
        });

        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task AddParticipantAsync(ParticipantCreateDto participant, CancellationToken cancellationToken = default)
    {
        db.Participants.Add(new ParticipantEntity
        {
            Id = participant.Id,
            DisplayName = participant.DisplayName,
            Username = participant.Username,
            Role = participant.Role == ParticipantRoleDto.Admin ? ParticipantRole.Admin : ParticipantRole.Participant,
            Gender = participant.Gender,
            Active = true
        });

        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task AddCoupleAsync(CoupleCreateDto couple, CancellationToken cancellationToken = default)
    {
        db.Couples.Add(new CoupleEntity
        {
            Id = couple.Id,
            ChallengeId = couple.ChallengeId,
            Name = couple.Name,
            Active = true
        });

        db.CoupleMemberships.AddRange(
            new CoupleMembershipEntity { Id = Guid.NewGuid(), CoupleId = couple.Id, ParticipantId = couple.FirstParticipantId, StartsOn = DateOnly.FromDateTime(DateTime.UtcNow) },
            new CoupleMembershipEntity { Id = Guid.NewGuid(), CoupleId = couple.Id, ParticipantId = couple.SecondParticipantId, StartsOn = DateOnly.FromDateTime(DateTime.UtcNow) });

        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task AddCheckInAsync(CheckInCreateDto checkIn, CancellationToken cancellationToken = default)
    {
        db.CheckIns.Add(new CheckInEntity
        {
            Id = checkIn.Id,
            ChallengeId = checkIn.ChallengeId,
            ParticipantId = checkIn.ParticipantId,
            OccurredAt = checkIn.OccurredAt,
            ActivityDate = checkIn.ActivityDate,
            Type = checkIn.Type == CheckInTypeDto.GymMorning ? CheckInType.GymMorning : CheckInType.GymSameDayRecovery,
            DurationMinutes = checkIn.DurationMinutes,
            CreatedByParticipantId = checkIn.CreatedByParticipantId,
            Notes = checkIn.Notes
        });

        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task AddFullCoverageTokenAsync(FullCoverageTokenCreateDto token, CancellationToken cancellationToken = default)
    {
        db.ExceptionTokens.Add(new ExceptionTokenEntity
        {
            Id = token.Id,
            ChallengeId = token.ChallengeId,
            ParticipantId = token.ParticipantId,
            TargetDate = token.TargetDate,
            Type = ExceptionTokenType.FullCoverage,
            ReasonCategory = (ExceptionReasonCategory)token.ReasonCategory,
            Status = ExceptionTokenStatus.Applied,
            AssignedByAdminId = token.AssignedByAdminId,
            Notes = token.Notes
        });

        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<Guid?> GetActiveChallengeIdAsync(CancellationToken cancellationToken = default)
    {
        return await db.Challenges
            .Where(x => x.Status == ChallengeStatus.Active)
            .OrderBy(x => x.StartDate)
            .Select(x => (Guid?)x.Id)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<ChallengeSnapshotDto> GetChallengeSnapshotAsync(Guid challengeId, CancellationToken cancellationToken = default)
    {
        var challenge = await db.Challenges.SingleAsync(x => x.Id == challengeId, cancellationToken);
        var settings = await db.ChallengeSettings.SingleAsync(x => x.ChallengeId == challengeId, cancellationToken);
        var participants = await db.Participants.OrderBy(x => x.DisplayName).ToListAsync(cancellationToken);
        var couples = await db.Couples.Include(x => x.Memberships).Where(x => x.ChallengeId == challengeId).OrderBy(x => x.Name).ToListAsync(cancellationToken);
        var checkIns = await db.CheckIns.Where(x => x.ChallengeId == challengeId && x.Status == RecordStatus.Valid).ToListAsync(cancellationToken);
        var tokens = await db.ExceptionTokens.Where(x => x.ChallengeId == challengeId && x.Status == ExceptionTokenStatus.Applied).ToListAsync(cancellationToken);

        return new ChallengeSnapshotDto(
            new ChallengeDto(challenge.Id, challenge.Name, challenge.StartDate, challenge.EndDate, challenge.AdminParticipantId, challenge.Timezone),
            new ChallengeSettings(settings.MondayMorningPoints, settings.WeekdayMorningPoints, settings.SameDayRecoveryPoints, settings.WeekendRecoveryPoints, settings.DailyCoupleBonus, settings.PerfectWeekBonus, settings.CompleteWeekBonus, settings.RescuedWeekBonus, settings.LakeSoloPoints, settings.LakeCouplePoints, settings.MaxLakeScoringPerCouplePerWeek, settings.MaxWeekendRecoveriesPerPersonPerWeek),
            participants.Select(x => new ParticipantDto(x.Id, x.DisplayName, x.Username, x.Role == ParticipantRole.Admin ? ParticipantRoleDto.Admin : ParticipantRoleDto.Participant, x.Gender, x.Active)).ToArray(),
            couples.Select(x => new CoupleDto(x.Id, x.ChallengeId, x.Name, x.Memberships.Select(m => m.ParticipantId).ToArray(), x.Active)).ToArray(),
            checkIns.Select(x => new CheckInDto(x.Id, x.ChallengeId, x.ParticipantId, x.ActivityDate, x.Type == CheckInType.GymMorning ? CheckInTypeDto.GymMorning : CheckInTypeDto.GymSameDayRecovery, x.DurationMinutes)).ToArray(),
            tokens.Select(x => new FullCoverageTokenDto(x.Id, x.ChallengeId, x.ParticipantId, x.TargetDate, (ExceptionReasonCategoryDto)x.ReasonCategory)).ToArray());
    }
}
