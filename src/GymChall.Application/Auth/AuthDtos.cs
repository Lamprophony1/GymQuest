using GymChall.Application.Challenges;

namespace GymChall.Application.Auth;

public sealed record LoginOptionDto(Guid Id, string DisplayName, string Username);
public sealed record LoginRequest(Guid ParticipantId, string Pin);
public sealed record SetPinRequest(string Pin);

public sealed record AuthenticatedParticipantDto(
    Guid Id,
    string DisplayName,
    string Username,
    ParticipantRoleDto Role,
    string? Gender,
    bool Active);

public sealed record AuthCredentialDto(
    Guid ParticipantId,
    string PinHash,
    int FailedAttemptCount,
    DateTimeOffset? LockedUntil,
    DateTimeOffset? PinUpdatedAt);
