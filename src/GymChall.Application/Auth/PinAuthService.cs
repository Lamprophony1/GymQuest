using GymChall.Application.Abstractions;
using GymChall.Application.Challenges;

namespace GymChall.Application.Auth;

public sealed class PinAuthService(IGymChallRepository repository, PinHasher hasher)
{
    private const int MaxFailedAttempts = 5;
    private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(1);

    public async Task<IReadOnlyList<LoginOptionDto>> ListLoginOptionsAsync(CancellationToken cancellationToken = default)
    {
        var participants = await repository.ListParticipantsAsync(cancellationToken);
        return participants
            .Where(participant => participant.Active)
            .OrderBy(participant => participant.DisplayName)
            .Select(participant => new LoginOptionDto(participant.Id, participant.DisplayName, participant.Username))
            .ToArray();
    }

    public async Task<AuthenticatedParticipantDto> LoginAsync(LoginRequest request, DateTimeOffset? now = null, CancellationToken cancellationToken = default)
    {
        var currentTime = now ?? DateTimeOffset.UtcNow;
        EnsureValidPin(request.Pin);

        var participant = await FindActiveParticipant(request.ParticipantId, cancellationToken);
        var credential = await repository.GetAuthCredentialAsync(participant.Id, cancellationToken) ??
            throw new InvalidOperationException("PIN incorrecto.");

        if (credential.LockedUntil is not null && credential.LockedUntil > currentTime)
        {
            throw new InvalidOperationException("PIN bloqueado temporalmente.");
        }

        if (!hasher.Verify(request.Pin, credential.PinHash))
        {
            var failedAttempts = credential.FailedAttemptCount + 1;
            var lockedUntil = failedAttempts >= MaxFailedAttempts ? currentTime.Add(LockoutDuration) : (DateTimeOffset?)null;
            await repository.UpsertAuthCredentialAsync(credential with
            {
                FailedAttemptCount = failedAttempts,
                LockedUntil = lockedUntil
            }, cancellationToken);
            throw new InvalidOperationException("PIN incorrecto.");
        }

        await repository.UpsertAuthCredentialAsync(credential with
        {
            FailedAttemptCount = 0,
            LockedUntil = null
        }, cancellationToken);

        return ToAuthenticated(participant);
    }

    public async Task SetPinAsync(Guid participantId, string pin, Guid actorParticipantId, DateTimeOffset? now = null, CancellationToken cancellationToken = default)
    {
        var currentTime = now ?? DateTimeOffset.UtcNow;
        EnsureValidPin(pin);
        await EnsureAdmin(actorParticipantId, cancellationToken);
        await FindActiveParticipant(participantId, cancellationToken);

        await repository.UpsertAuthCredentialAsync(new AuthCredentialDto(
            participantId,
            hasher.Hash(pin),
            FailedAttemptCount: 0,
            LockedUntil: null,
            PinUpdatedAt: currentTime),
            cancellationToken);
    }

    public async Task ChangeOwnPinAsync(Guid participantId, string currentPin, string newPin, DateTimeOffset? now = null, CancellationToken cancellationToken = default)
    {
        var currentTime = now ?? DateTimeOffset.UtcNow;
        EnsureValidPin(currentPin);
        EnsureValidPin(newPin);
        await FindActiveParticipant(participantId, cancellationToken);

        var credential = await repository.GetAuthCredentialAsync(participantId, cancellationToken) ??
            throw new InvalidOperationException("PIN actual incorrecto.");

        if (credential.LockedUntil is not null && credential.LockedUntil > currentTime)
        {
            throw new InvalidOperationException("PIN bloqueado temporalmente.");
        }

        if (!hasher.Verify(currentPin, credential.PinHash))
        {
            var failedAttempts = credential.FailedAttemptCount + 1;
            var lockedUntil = failedAttempts >= MaxFailedAttempts ? currentTime.Add(LockoutDuration) : (DateTimeOffset?)null;
            await repository.UpsertAuthCredentialAsync(credential with
            {
                FailedAttemptCount = failedAttempts,
                LockedUntil = lockedUntil
            }, cancellationToken);
            throw new InvalidOperationException("PIN actual incorrecto.");
        }

        await repository.UpsertAuthCredentialAsync(credential with
        {
            PinHash = hasher.Hash(newPin),
            FailedAttemptCount = 0,
            LockedUntil = null,
            PinUpdatedAt = currentTime
        }, cancellationToken);
    }

    public async Task EnsureBootstrapPinAsync(Guid participantId, string pin, DateTimeOffset? now = null, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(pin))
        {
            return;
        }

        var existing = await repository.GetAuthCredentialAsync(participantId, cancellationToken);
        if (existing is not null)
        {
            return;
        }

        var currentTime = now ?? DateTimeOffset.UtcNow;
        EnsureValidPin(pin);
        await repository.UpsertAuthCredentialAsync(new AuthCredentialDto(
            participantId,
            hasher.Hash(pin),
            FailedAttemptCount: 0,
            LockedUntil: null,
            PinUpdatedAt: currentTime),
            cancellationToken);
    }

    public async Task<AuthenticatedParticipantDto?> GetAuthenticatedParticipantAsync(Guid participantId, CancellationToken cancellationToken = default)
    {
        var participants = await repository.ListParticipantsAsync(cancellationToken);
        var participant = participants.SingleOrDefault(candidate => candidate.Id == participantId && candidate.Active);
        return participant is null ? null : ToAuthenticated(participant);
    }

    private async Task<ParticipantSummaryDto> FindActiveParticipant(Guid participantId, CancellationToken cancellationToken)
    {
        var participants = await repository.ListParticipantsAsync(cancellationToken);
        return participants.SingleOrDefault(participant => participant.Id == participantId && participant.Active) ??
            throw new InvalidOperationException("PIN incorrecto.");
    }

    private async Task EnsureAdmin(Guid participantId, CancellationToken cancellationToken)
    {
        var participant = await FindActiveParticipant(participantId, cancellationToken);
        if (participant.Role != ParticipantRoleDto.Admin)
        {
            throw new InvalidOperationException("Solo admin puede cambiar PINs.");
        }
    }

    private static AuthenticatedParticipantDto ToAuthenticated(ParticipantSummaryDto participant)
    {
        return new AuthenticatedParticipantDto(participant.Id, participant.DisplayName, participant.Username, participant.Role, participant.Gender, participant.Active);
    }

    private static void EnsureValidPin(string pin)
    {
        if (pin.Length is < 4 or > 6 || pin.Any(character => !char.IsDigit(character)))
        {
            throw new InvalidOperationException("El PIN debe tener 4 a 6 numeros.");
        }
    }
}
