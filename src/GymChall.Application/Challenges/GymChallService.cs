using GymChall.Application.Abstractions;
using GymChall.Application.Scoring;

namespace GymChall.Application.Challenges;

public sealed record RegisterCheckInRequest(Guid ParticipantId, DateTimeOffset OccurredAt, DateOnly? RecoveryTargetDate, Guid CreatedByParticipantId, string? Notes);
public sealed record CreateFullCoverageTokenRequest(Guid ParticipantId, DateOnly TargetDate, ExceptionReasonCategoryDto ReasonCategory, Guid AssignedByAdminId, string? Notes);
public sealed record GrantTokenRequest(Guid ParticipantId, ExceptionTokenTypeDto Type, ExceptionReasonCategoryDto ReasonCategory, Guid AssignedByAdminId, string? Notes);
public sealed record UseTokenRequest(Guid ParticipantId, DateOnly TargetDate, Guid UsedByParticipantId, DateTimeOffset? OccurredAt, DateOnly? RecoveryTargetDate, string? Notes);

public sealed class GymChallService(IGymChallRepository repository)
{
    private const string MonthlyHealthTokenNote = "Ficha salud mensual automatica";

    public async Task<Guid> RegisterCheckInAsync(RegisterCheckInRequest request, CancellationToken cancellationToken = default)
    {
        var challengeId = await RequireActiveChallengeId(cancellationToken);
        var settings = await repository.GetSettingsAsync(challengeId, cancellationToken);
        var snapshot = await repository.GetChallengeSnapshotAsync(challengeId, cancellationToken);
        var classified = CheckInClassifier.Classify(request.OccurredAt, request.RecoveryTargetDate, settings, snapshot.Challenge.Timezone);
        EnsureNeedsCoverage(snapshot, request.ParticipantId, classified.ActivityDate);

        var checkInId = Guid.NewGuid();
        await repository.AddCheckInAsync(new CheckInCreateDto(checkInId, challengeId, request.ParticipantId, request.OccurredAt, classified.ActivityDate, classified.Type, 0, request.CreatedByParticipantId, request.Notes), cancellationToken);
        return checkInId;
    }

    public async Task<Guid> CreateFullCoverageTokenAsync(CreateFullCoverageTokenRequest request, CancellationToken cancellationToken = default)
    {
        var challengeId = await RequireActiveChallengeId(cancellationToken);
        var tokenId = Guid.NewGuid();
        await repository.AddFullCoverageTokenAsync(new FullCoverageTokenCreateDto(tokenId, challengeId, request.ParticipantId, request.TargetDate, ExceptionTokenTypeDto.Health, request.ReasonCategory, ExceptionTokenStatusDto.Applied, request.AssignedByAdminId, request.Notes), cancellationToken);
        return tokenId;
    }

    public async Task<Guid> GrantTokenAsync(GrantTokenRequest request, CancellationToken cancellationToken = default)
    {
        var challengeId = await RequireActiveChallengeId(cancellationToken);
        var snapshot = await repository.GetChallengeSnapshotAsync(challengeId, cancellationToken);
        EnsureAdmin(snapshot, request.AssignedByAdminId);

        var tokenId = Guid.NewGuid();
        await repository.AddFullCoverageTokenAsync(new FullCoverageTokenCreateDto(
            tokenId,
            challengeId,
            request.ParticipantId,
            DateOnly.MinValue,
            request.Type,
            request.ReasonCategory,
            ExceptionTokenStatusDto.Available,
            request.AssignedByAdminId,
            request.Notes),
            cancellationToken);

        return tokenId;
    }

    public async Task UseTokenAsync(Guid tokenId, UseTokenRequest request, CancellationToken cancellationToken = default)
    {
        var challengeId = await RequireActiveChallengeId(cancellationToken);
        var snapshot = await repository.GetChallengeSnapshotAsync(challengeId, cancellationToken);
        var token = snapshot.FullCoverageTokens.SingleOrDefault(x => x.Id == tokenId)
            ?? throw new InvalidOperationException("Ficha no encontrada.");

        if (token.ParticipantId != request.ParticipantId || token.Status != ExceptionTokenStatusDto.Available)
        {
            throw new InvalidOperationException("La ficha no esta disponible para esta participante.");
        }

        if (request.TargetDate.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday)
        {
            throw new InvalidOperationException("La ficha debe aplicarse a un dia habil.");
        }

        if (token.Notes == MonthlyHealthTokenNote && token.TargetDate != DateOnly.MinValue && !SameMonth(token.TargetDate, request.TargetDate))
        {
            throw new InvalidOperationException("La ficha mensual de salud solo aplica dentro de su mes.");
        }

        switch (token.Type)
        {
            case ExceptionTokenTypeDto.Health:
            case ExceptionTokenTypeDto.Mandatory:
                EnsureNeedsCoverage(snapshot, request.ParticipantId, request.TargetDate);
                await repository.ApplyFullCoverageTokenAsync(tokenId, request.ParticipantId, request.TargetDate, request.UsedByParticipantId, cancellationToken);
                break;

            case ExceptionTokenTypeDto.ScheduleChange:
                if (request.OccurredAt is null)
                {
                    throw new InvalidOperationException("La ficha de cambio de horario necesita fecha y hora de entrenamiento.");
                }

                var settings = await repository.GetSettingsAsync(challengeId, cancellationToken);
                var classified = CheckInClassifier.Classify(request.OccurredAt.Value, request.RecoveryTargetDate, settings, snapshot.Challenge.Timezone);
                if (classified.Type == CheckInTypeDto.GymMorning)
                {
                    throw new InvalidOperationException("No hace falta usar ficha dentro de la ventana 5AM.");
                }

                if (classified.ActivityDate != request.TargetDate)
                {
                    throw new InvalidOperationException("La fecha objetivo debe coincidir con el dia recuperado.");
                }

                EnsureNeedsCoverage(snapshot, request.ParticipantId, request.TargetDate);
                await repository.AddCheckInAsync(new CheckInCreateDto(Guid.NewGuid(), challengeId, request.ParticipantId, request.OccurredAt.Value, classified.ActivityDate, classified.Type, 0, request.UsedByParticipantId, request.Notes), cancellationToken);
                await repository.ApplyFullCoverageTokenAsync(tokenId, request.ParticipantId, request.TargetDate, request.UsedByParticipantId, cancellationToken);
                break;

            default:
                throw new InvalidOperationException("Tipo de ficha no soportado.");
        }
    }

    public async Task<IReadOnlyList<CoupleRankingRow>> GetGeneralRankingAsync(DateOnly throughDate, CancellationToken cancellationToken = default)
    {
        var challengeId = await RequireActiveChallengeId(cancellationToken);
        await EnsureMonthlyHealthTokensAsync(challengeId, cancellationToken);
        var snapshot = await repository.GetChallengeSnapshotAsync(challengeId, cancellationToken);
        return RankingService.CalculateGeneralRanking(snapshot, throughDate);
    }

    public async Task<IReadOnlyList<WeeklyRankingDto>> GetWeeklyRankingsAsync(DateOnly throughDate, CancellationToken cancellationToken = default)
    {
        var challengeId = await RequireActiveChallengeId(cancellationToken);
        await EnsureMonthlyHealthTokensAsync(challengeId, cancellationToken);
        var snapshot = await repository.GetChallengeSnapshotAsync(challengeId, cancellationToken);
        return RankingService.CalculateWeeklyRankings(snapshot, throughDate);
    }

    public async Task<WeeklyRankingDto> GetWeeklyRankingAsync(DateOnly weekStartDate, DateOnly throughDate, CancellationToken cancellationToken = default)
    {
        var challengeId = await RequireActiveChallengeId(cancellationToken);
        await EnsureMonthlyHealthTokensAsync(challengeId, cancellationToken);
        var snapshot = await repository.GetChallengeSnapshotAsync(challengeId, cancellationToken);
        return RankingService.CalculateWeeklyRanking(snapshot, weekStartDate, throughDate);
    }

    public async Task<ChallengeSnapshotDto> GetActiveChallengeAsync(CancellationToken cancellationToken = default)
    {
        var challengeId = await RequireActiveChallengeId(cancellationToken);
        await EnsureMonthlyHealthTokensAsync(challengeId, cancellationToken);
        return await repository.GetChallengeSnapshotAsync(challengeId, cancellationToken);
    }

    public Task<IReadOnlyList<ParticipantSummaryDto>> ListParticipantsAsync(CancellationToken cancellationToken = default)
    {
        return repository.ListParticipantsAsync(cancellationToken);
    }

    public async Task<ParticipantProfileDto> GetParticipantProfileAsync(Guid participantId, CancellationToken cancellationToken = default)
    {
        var profile = await repository.GetParticipantProfileAsync(participantId, cancellationToken) ??
            throw new InvalidOperationException("Perfil no encontrado.");

        if (!profile.Active)
        {
            throw new InvalidOperationException("Perfil no disponible.");
        }

        return profile;
    }

    public async Task<ParticipantProfileDto> UpdateParticipantProfileAsync(Guid participantId, UpdateParticipantProfileRequest request, CancellationToken cancellationToken = default)
    {
        EnsureProfileMetric(request.WeightKg, "peso", 20, 400);
        EnsureProfileMetric(request.HeightCm, "altura", 80, 250);

        await GetParticipantProfileAsync(participantId, cancellationToken);
        await repository.UpdateParticipantProfileAsync(participantId, request.WeightKg, request.HeightCm, cancellationToken);
        return await GetParticipantProfileAsync(participantId, cancellationToken);
    }

    public async Task<Guid> CreateParticipantAsync(CreateParticipantRequest request, CancellationToken cancellationToken = default)
    {
        var participantId = Guid.NewGuid();
        await repository.AddParticipantAsync(new ParticipantCreateDto(participantId, request.DisplayName, request.Username, request.Role, request.Gender), cancellationToken);
        return participantId;
    }

    public async Task<IReadOnlyList<CoupleSummaryDto>> ListCouplesAsync(CancellationToken cancellationToken = default)
    {
        var challengeId = await RequireActiveChallengeId(cancellationToken);
        return await repository.ListCouplesAsync(challengeId, cancellationToken);
    }

    public async Task<Guid> CreateCoupleAsync(CreateCoupleRequest request, CancellationToken cancellationToken = default)
    {
        var challengeId = await RequireActiveChallengeId(cancellationToken);
        var coupleId = Guid.NewGuid();
        await repository.AddCoupleAsync(new CoupleCreateDto(coupleId, challengeId, request.Name, request.FirstParticipantId, request.SecondParticipantId), cancellationToken);
        return coupleId;
    }

    public async Task<ChallengeSettingsDto> GetSettingsAsync(CancellationToken cancellationToken = default)
    {
        var challengeId = await RequireActiveChallengeId(cancellationToken);
        return await repository.GetSettingsAsync(challengeId, cancellationToken);
    }

    public async Task<IReadOnlyList<AdminCheckInSummaryDto>> ListRecentCheckInsAsync(int? limit, CancellationToken cancellationToken = default)
    {
        var challengeId = await RequireActiveChallengeId(cancellationToken);
        return await repository.ListRecentCheckInsAsync(challengeId, NormalizeAdminListLimit(limit), cancellationToken);
    }

    public async Task<IReadOnlyList<AdminCheckInSummaryDto>> ListCalendarCheckInsAsync(DateOnly from, DateOnly to, CancellationToken cancellationToken = default)
    {
        if (to < from)
        {
            throw new InvalidOperationException("El rango de calendario no es valido.");
        }

        var challengeId = await RequireActiveChallengeId(cancellationToken);
        return await repository.ListCalendarCheckInsAsync(challengeId, from, to, cancellationToken);
    }

    public async Task<IReadOnlyList<AdminTokenSummaryDto>> ListRecentFullCoverageTokensAsync(int? limit, CancellationToken cancellationToken = default)
    {
        var challengeId = await RequireActiveChallengeId(cancellationToken);
        return await repository.ListRecentFullCoverageTokensAsync(challengeId, NormalizeAdminListLimit(limit), cancellationToken);
    }

    public Task InvalidateCheckInAsync(Guid checkInId, InvalidateRecordRequest request, CancellationToken cancellationToken = default)
    {
        return repository.InvalidateCheckInAsync(checkInId, request.ActorParticipantId, request.Reason, cancellationToken);
    }

    public Task InvalidateFullCoverageTokenAsync(Guid tokenId, InvalidateRecordRequest request, CancellationToken cancellationToken = default)
    {
        return repository.InvalidateFullCoverageTokenAsync(tokenId, request.ActorParticipantId, request.Reason, cancellationToken);
    }

    private async Task<Guid> RequireActiveChallengeId(CancellationToken cancellationToken)
    {
        var challengeId = await repository.GetActiveChallengeIdAsync(cancellationToken);
        return challengeId ?? throw new InvalidOperationException("No active challenge exists.");
    }

    private static int NormalizeAdminListLimit(int? limit)
    {
        if (limit is null or <= 0)
        {
            return 50;
        }

        return Math.Min(limit.Value, 100);
    }

    private async Task EnsureMonthlyHealthTokensAsync(Guid challengeId, CancellationToken cancellationToken)
    {
        var snapshot = await repository.GetChallengeSnapshotAsync(challengeId, cancellationToken);
        var today = TodayInTimezone(snapshot.Challenge.Timezone);
        var monthStart = new DateOnly(today.Year, today.Month, 1);

        foreach (var participant in snapshot.Participants.Where(x => x.Active && string.Equals(x.Gender, "female", StringComparison.OrdinalIgnoreCase)))
        {
            var alreadyGranted = snapshot.FullCoverageTokens.Any(token =>
                token.ParticipantId == participant.Id &&
                token.Type == ExceptionTokenTypeDto.Health &&
                token.ReasonCategory == ExceptionReasonCategoryDto.Health &&
                token.Notes == MonthlyHealthTokenNote &&
                token.Status != ExceptionTokenStatusDto.Rejected &&
                SameMonth(token.TargetDate, monthStart));

            if (alreadyGranted)
            {
                continue;
            }

            await repository.AddFullCoverageTokenAsync(new FullCoverageTokenCreateDto(
                Guid.NewGuid(),
                challengeId,
                participant.Id,
                monthStart,
                ExceptionTokenTypeDto.Health,
                ExceptionReasonCategoryDto.Health,
                ExceptionTokenStatusDto.Available,
                snapshot.Challenge.AdminParticipantId,
                MonthlyHealthTokenNote),
                cancellationToken);
        }
    }

    private static void EnsureNeedsCoverage(ChallengeSnapshotDto snapshot, Guid participantId, DateOnly date)
    {
        var alreadyCovered = snapshot.CheckIns.Any(checkIn => checkIn.ParticipantId == participantId && checkIn.ActivityDate == date) ||
            snapshot.FullCoverageTokens.Any(token =>
                token.ParticipantId == participantId &&
                token.TargetDate == date &&
                token.Status == ExceptionTokenStatusDto.Applied &&
                token.Type is ExceptionTokenTypeDto.Health or ExceptionTokenTypeDto.Mandatory or ExceptionTokenTypeDto.ScheduleChange);

        if (alreadyCovered)
        {
            throw new InvalidOperationException("Ese dia ya tiene cobertura registrada.");
        }
    }

    private static void EnsureAdmin(ChallengeSnapshotDto snapshot, Guid participantId)
    {
        var participant = snapshot.Participants.SingleOrDefault(x => x.Id == participantId);
        if (participant?.Role != ParticipantRoleDto.Admin)
        {
            throw new InvalidOperationException("Solo admin puede otorgar fichas.");
        }
    }

    private static bool SameMonth(DateOnly first, DateOnly second)
    {
        return first.Year == second.Year && first.Month == second.Month;
    }

    private static void EnsureProfileMetric(double? value, string label, double min, double max)
    {
        if (value is null)
        {
            return;
        }

        if (double.IsNaN(value.Value) || double.IsInfinity(value.Value) || value < min || value > max)
        {
            throw new InvalidOperationException($"El {label} no parece valido.");
        }
    }

    private static DateOnly TodayInTimezone(string timezone)
    {
        try
        {
            var zone = TimeZoneInfo.FindSystemTimeZoneById(timezone);
            return DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(DateTimeOffset.UtcNow, zone).DateTime);
        }
        catch (TimeZoneNotFoundException)
        {
            return DateOnly.FromDateTime(DateTime.UtcNow);
        }
        catch (InvalidTimeZoneException)
        {
            return DateOnly.FromDateTime(DateTime.UtcNow);
        }
    }
}
