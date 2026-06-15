using GymChall.Infrastructure.Persistence;

namespace GymChall.Infrastructure.Persistence.Entities;

public sealed class ParticipantEntity
{
    public Guid Id { get; set; }
    public string DisplayName { get; set; } = "";
    public string Username { get; set; } = "";
    public string? Email { get; set; }
    public ParticipantRole Role { get; set; }
    public string? Gender { get; set; }
    public bool Active { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
