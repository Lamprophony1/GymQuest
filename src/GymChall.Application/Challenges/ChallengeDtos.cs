using GymChall.Domain.Scoring;

namespace GymChall.Application.Challenges;

public enum ParticipantRoleDto { Participant = 0, Admin = 1 }
public enum CheckInTypeDto { GymMorning = 0, GymSameDayRecovery = 1, GymWeekendRecovery = 2 }
public enum ExceptionTokenTypeDto { Health = 0, Mandatory = 1, ScheduleChange = 2 }
public enum ExceptionTokenStatusDto { Applied = 0, Available = 1, Corrected = 2, Rejected = 3 }
public enum ExceptionReasonCategoryDto { Health = 0, Period = 1, WorkTrip = 2, MandatoryTrip = 3, OtherApproved = 4 }
public enum WeeklyCalendarEventKindDto { CheckIn = 0, Coin = 1 }

public sealed record ChallengeCreateDto(Guid Id, string Name, DateOnly StartDate, DateOnly EndDate, Guid AdminParticipantId, string Timezone);
public sealed record ParticipantCreateDto(Guid Id, string DisplayName, string Username, ParticipantRoleDto Role, string? Gender);
public sealed record CoupleCreateDto(Guid Id, Guid ChallengeId, string Name, Guid FirstParticipantId, Guid SecondParticipantId);
public sealed record CheckInCreateDto(Guid Id, Guid ChallengeId, Guid ParticipantId, DateTimeOffset OccurredAt, DateOnly ActivityDate, CheckInTypeDto Type, int DurationMinutes, Guid CreatedByParticipantId, string? Notes);
public sealed record FullCoverageTokenCreateDto(Guid Id, Guid ChallengeId, Guid ParticipantId, DateOnly TargetDate, ExceptionTokenTypeDto Type, ExceptionReasonCategoryDto ReasonCategory, ExceptionTokenStatusDto Status, Guid AssignedByAdminId, string? Notes);
public sealed record CreateParticipantRequest(string DisplayName, string Username, ParticipantRoleDto Role, string? Gender);
public sealed record CreateCoupleRequest(string Name, Guid FirstParticipantId, Guid SecondParticipantId);
public sealed record InvalidateRecordRequest(Guid ActorParticipantId, string? Reason);
public sealed record UpdateParticipantProfileRequest(Guid? ParticipantId, double? WeightKg, double? HeightCm);

public sealed record ChallengeDto(Guid Id, string Name, DateOnly StartDate, DateOnly EndDate, Guid AdminParticipantId, string Timezone);
public sealed record ParticipantDto(Guid Id, string DisplayName, string Username, ParticipantRoleDto Role, string? Gender, bool Active);
public sealed record CoupleDto(Guid Id, Guid ChallengeId, string Name, IReadOnlyList<Guid> ParticipantIds, bool Active);
public sealed record CheckInDto(Guid Id, Guid ChallengeId, Guid ParticipantId, DateOnly ActivityDate, CheckInTypeDto Type, int DurationMinutes);
public sealed record FullCoverageTokenDto(Guid Id, Guid ChallengeId, Guid ParticipantId, DateOnly TargetDate, ExceptionTokenTypeDto Type, ExceptionReasonCategoryDto ReasonCategory, ExceptionTokenStatusDto Status, string? Notes = null);
public sealed record ChallengeSnapshotDto(ChallengeDto Challenge, ChallengeSettings Settings, IReadOnlyList<ParticipantDto> Participants, IReadOnlyList<CoupleDto> Couples, IReadOnlyList<CheckInDto> CheckIns, IReadOnlyList<FullCoverageTokenDto> FullCoverageTokens);
public sealed record ParticipantSummaryDto(Guid Id, string DisplayName, string Username, ParticipantRoleDto Role, string? Gender, bool Active);
public sealed record ParticipantProfileDto(Guid Id, string DisplayName, string Username, ParticipantRoleDto Role, string? Gender, bool Active, double? WeightKg, double? HeightCm, double? BodyMassIndex);
public sealed record CoupleSummaryDto(Guid Id, string Name, IReadOnlyList<ParticipantSummaryDto> Participants, bool Active);
public sealed record AdminCheckInSummaryDto(
    Guid Id,
    Guid ParticipantId,
    string ParticipantName,
    DateOnly ActivityDate,
    DateTimeOffset OccurredAt,
    CheckInTypeDto Type,
    string Status,
    int DurationMinutes,
    string? Notes,
    DateTimeOffset CreatedAt);
public sealed record AdminTokenSummaryDto(
    Guid Id,
    Guid ParticipantId,
    string ParticipantName,
    DateOnly TargetDate,
    ExceptionTokenTypeDto Type,
    ExceptionReasonCategoryDto ReasonCategory,
    string Status,
    string? Notes,
    DateTimeOffset CreatedAt);
public sealed record WeeklyCalendarEventDto(
    Guid Id,
    Guid ParticipantId,
    string ParticipantName,
    DateOnly ActivityDate,
    DateTimeOffset? OccurredAt,
    WeeklyCalendarEventKindDto Kind,
    string Label,
    string Status,
    CheckInTypeDto? CheckInType,
    ExceptionTokenTypeDto? CoinType,
    string? Notes);
public sealed record ChallengeSettingsDto(
    decimal MondayMorningPoints,
    decimal WeekdayMorningPoints,
    decimal SameDayRecoveryPoints,
    decimal WeekendRecoveryPoints,
    decimal DailyCoupleBonus,
    decimal PerfectWeekBonus,
    decimal CompleteWeekBonus,
    decimal RescuedWeekBonus,
    int GymMinimumMinutes,
    TimeOnly MorningWindowStart,
    TimeOnly MorningWindowEnd);
