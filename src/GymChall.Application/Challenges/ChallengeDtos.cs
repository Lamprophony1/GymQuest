using GymChall.Domain.Scoring;

namespace GymChall.Application.Challenges;

public enum ParticipantRoleDto { Participant = 0, Admin = 1 }
public enum CheckInTypeDto { GymMorning = 0, GymSameDayRecovery = 1 }
public enum ExceptionReasonCategoryDto { Health = 0, Period = 1, WorkTrip = 2, MandatoryTrip = 3, OtherApproved = 4 }

public sealed record ChallengeCreateDto(Guid Id, string Name, DateOnly StartDate, DateOnly EndDate, Guid AdminParticipantId, string Timezone);
public sealed record ParticipantCreateDto(Guid Id, string DisplayName, string Username, ParticipantRoleDto Role, string? Gender);
public sealed record CoupleCreateDto(Guid Id, Guid ChallengeId, string Name, Guid FirstParticipantId, Guid SecondParticipantId);
public sealed record CheckInCreateDto(Guid Id, Guid ChallengeId, Guid ParticipantId, DateTimeOffset OccurredAt, DateOnly ActivityDate, CheckInTypeDto Type, int DurationMinutes, Guid CreatedByParticipantId, string? Notes);
public sealed record FullCoverageTokenCreateDto(Guid Id, Guid ChallengeId, Guid ParticipantId, DateOnly TargetDate, ExceptionReasonCategoryDto ReasonCategory, Guid AssignedByAdminId, string? Notes);

public sealed record ChallengeDto(Guid Id, string Name, DateOnly StartDate, DateOnly EndDate, Guid AdminParticipantId, string Timezone);
public sealed record ParticipantDto(Guid Id, string DisplayName, string Username, ParticipantRoleDto Role, string? Gender, bool Active);
public sealed record CoupleDto(Guid Id, Guid ChallengeId, string Name, IReadOnlyList<Guid> ParticipantIds, bool Active);
public sealed record CheckInDto(Guid Id, Guid ChallengeId, Guid ParticipantId, DateOnly ActivityDate, CheckInTypeDto Type, int DurationMinutes);
public sealed record FullCoverageTokenDto(Guid Id, Guid ChallengeId, Guid ParticipantId, DateOnly TargetDate, ExceptionReasonCategoryDto ReasonCategory);
public sealed record ChallengeSnapshotDto(ChallengeDto Challenge, ChallengeSettings Settings, IReadOnlyList<ParticipantDto> Participants, IReadOnlyList<CoupleDto> Couples, IReadOnlyList<CheckInDto> CheckIns, IReadOnlyList<FullCoverageTokenDto> FullCoverageTokens);
