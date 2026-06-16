using GymChall.Application.Abstractions;
using GymChall.Application.Challenges;
using GymChall.Domain.Scoring;
using GymChall.Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

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
        var usernameExists = await db.Participants.AnyAsync(x => x.Username == participant.Username, cancellationToken);
        if (usernameExists)
        {
            throw new InvalidOperationException($"Participant username already exists: {participant.Username}");
        }

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
        if (couple.FirstParticipantId == couple.SecondParticipantId)
        {
            throw new InvalidOperationException("A couple must have two different participants.");
        }

        var challenge = await db.Challenges.SingleAsync(x => x.Id == couple.ChallengeId, cancellationToken);

        db.Couples.Add(new CoupleEntity
        {
            Id = couple.Id,
            ChallengeId = couple.ChallengeId,
            Name = couple.Name,
            Active = true
        });

        db.CoupleMemberships.AddRange(
            new CoupleMembershipEntity { Id = Guid.NewGuid(), CoupleId = couple.Id, ParticipantId = couple.FirstParticipantId, StartsOn = challenge.StartDate },
            new CoupleMembershipEntity { Id = Guid.NewGuid(), CoupleId = couple.Id, ParticipantId = couple.SecondParticipantId, StartsOn = challenge.StartDate });

        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<ParticipantSummaryDto>> ListParticipantsAsync(CancellationToken cancellationToken = default)
    {
        return await db.Participants
            .OrderBy(x => x.DisplayName)
            .Select(x => new ParticipantSummaryDto(x.Id, x.DisplayName, x.Username, x.Role == ParticipantRole.Admin ? ParticipantRoleDto.Admin : ParticipantRoleDto.Participant, x.Gender, x.Active))
            .ToArrayAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<CoupleSummaryDto>> ListCouplesAsync(Guid challengeId, CancellationToken cancellationToken = default)
    {
        var couples = await db.Couples
            .Include(x => x.Memberships)
            .Where(x => x.ChallengeId == challengeId)
            .OrderBy(x => x.Name)
            .ToListAsync(cancellationToken);
        var participantIds = couples.SelectMany(x => x.Memberships.Select(m => m.ParticipantId)).Distinct().ToArray();
        var participants = await db.Participants
            .Where(x => participantIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, cancellationToken);

        return couples
            .Select(couple => new CoupleSummaryDto(
                couple.Id,
                couple.Name,
                couple.Memberships
                    .OrderBy(m => m.StartsOn)
                    .Select(m => participants[m.ParticipantId])
                    .Select(x => new ParticipantSummaryDto(x.Id, x.DisplayName, x.Username, x.Role == ParticipantRole.Admin ? ParticipantRoleDto.Admin : ParticipantRoleDto.Participant, x.Gender, x.Active))
                    .ToArray(),
                couple.Active))
            .ToArray();
    }

    public async Task<ChallengeSettingsDto> GetSettingsAsync(Guid challengeId, CancellationToken cancellationToken = default)
    {
        var settings = await db.ChallengeSettings.SingleAsync(x => x.ChallengeId == challengeId, cancellationToken);

        return new ChallengeSettingsDto(
            settings.MondayMorningPoints,
            settings.WeekdayMorningPoints,
            settings.SameDayRecoveryPoints,
            settings.WeekendRecoveryPoints,
            settings.DailyCoupleBonus,
            settings.PerfectWeekBonus,
            settings.CompleteWeekBonus,
            settings.RescuedWeekBonus,
            settings.GymMinimumMinutes,
            settings.MorningWindowStart,
            settings.MorningWindowEnd);
    }

    public async Task<IReadOnlyList<AdminCheckInSummaryDto>> ListRecentCheckInsAsync(Guid challengeId, int limit, CancellationToken cancellationToken = default)
    {
        var cappedLimit = Math.Clamp(limit, 1, 100);
        var rows = await db.CheckIns
            .Where(x => x.ChallengeId == challengeId)
            .Join(
                db.Participants,
                checkIn => checkIn.ParticipantId,
                participant => participant.Id,
                (checkIn, participant) => new { CheckIn = checkIn, Participant = participant })
            .Select(x => new
            {
                x.CheckIn.Id,
                x.CheckIn.ParticipantId,
                ParticipantName = x.Participant.DisplayName,
                x.CheckIn.ActivityDate,
                x.CheckIn.OccurredAt,
                x.CheckIn.Type,
                x.CheckIn.Status,
                x.CheckIn.DurationMinutes,
                x.CheckIn.Notes,
                x.CheckIn.CreatedAt
            })
            .ToArrayAsync(cancellationToken);

        return rows
            .OrderByDescending(x => x.CreatedAt)
            .ThenByDescending(x => x.OccurredAt)
            .Take(cappedLimit)
            .Select(x => new AdminCheckInSummaryDto(
                x.Id,
                x.ParticipantId,
                x.ParticipantName,
                x.ActivityDate,
                x.OccurredAt,
                x.Type == CheckInType.GymMorning ? CheckInTypeDto.GymMorning : CheckInTypeDto.GymSameDayRecovery,
                x.Status.ToString(),
                x.DurationMinutes,
                x.Notes,
                x.CreatedAt))
            .ToArray();
    }

    public async Task<IReadOnlyList<AdminTokenSummaryDto>> ListRecentFullCoverageTokensAsync(Guid challengeId, int limit, CancellationToken cancellationToken = default)
    {
        var cappedLimit = Math.Clamp(limit, 1, 100);
        var rows = await db.ExceptionTokens
            .Where(x => x.ChallengeId == challengeId && x.Type == ExceptionTokenType.FullCoverage)
            .Join(
                db.Participants,
                token => token.ParticipantId,
                participant => participant.Id,
                (token, participant) => new { Token = token, Participant = participant })
            .Select(x => new
            {
                x.Token.Id,
                x.Token.ParticipantId,
                ParticipantName = x.Participant.DisplayName,
                x.Token.TargetDate,
                x.Token.ReasonCategory,
                x.Token.Status,
                x.Token.Notes,
                x.Token.CreatedAt
            })
            .ToArrayAsync(cancellationToken);

        return rows
            .OrderByDescending(x => x.CreatedAt)
            .ThenByDescending(x => x.TargetDate)
            .Take(cappedLimit)
            .Select(x => new AdminTokenSummaryDto(
                x.Id,
                x.ParticipantId,
                x.ParticipantName,
                x.TargetDate,
                (ExceptionReasonCategoryDto)x.ReasonCategory,
                x.Status.ToString(),
                x.Notes,
                x.CreatedAt))
            .ToArray();
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

    public async Task InvalidateCheckInAsync(Guid checkInId, Guid actorParticipantId, string? reason, CancellationToken cancellationToken = default)
    {
        var checkIn = await db.CheckIns.SingleAsync(x => x.Id == checkInId, cancellationToken);
        var oldStatus = checkIn.Status;
        checkIn.Status = RecordStatus.Rejected;
        checkIn.CorrectedByParticipantId = actorParticipantId;
        checkIn.UpdatedAt = DateTimeOffset.UtcNow;

        db.AuditLogs.Add(new AuditLogEntity
        {
            Id = Guid.NewGuid(),
            ChallengeId = checkIn.ChallengeId,
            ActorParticipantId = actorParticipantId,
            Action = "invalidate_check_in",
            EntityType = "CheckIn",
            EntityId = checkIn.Id,
            OldValueJson = JsonSerializer.Serialize(new { Status = oldStatus.ToString() }),
            NewValueJson = JsonSerializer.Serialize(new { Status = checkIn.Status.ToString(), Reason = reason })
        });

        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task InvalidateFullCoverageTokenAsync(Guid tokenId, Guid actorParticipantId, string? reason, CancellationToken cancellationToken = default)
    {
        var token = await db.ExceptionTokens.SingleAsync(x => x.Id == tokenId, cancellationToken);
        var oldStatus = token.Status;
        token.Status = ExceptionTokenStatus.Rejected;
        token.UpdatedAt = DateTimeOffset.UtcNow;

        db.AuditLogs.Add(new AuditLogEntity
        {
            Id = Guid.NewGuid(),
            ChallengeId = token.ChallengeId,
            ActorParticipantId = actorParticipantId,
            Action = "invalidate_token",
            EntityType = "ExceptionToken",
            EntityId = token.Id,
            OldValueJson = JsonSerializer.Serialize(new { Status = oldStatus.ToString() }),
            NewValueJson = JsonSerializer.Serialize(new { Status = token.Status.ToString(), Reason = reason })
        });

        await db.SaveChangesAsync(cancellationToken);
    }
}
