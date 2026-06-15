namespace GymChall.Infrastructure.Persistence.Entities;

public sealed class CoupleMembershipEntity
{
    public Guid Id { get; set; }
    public Guid CoupleId { get; set; }
    public Guid ParticipantId { get; set; }
    public DateOnly StartsOn { get; set; }
    public DateOnly? EndsOn { get; set; }
    public CoupleEntity? Couple { get; set; }
    public ParticipantEntity? Participant { get; set; }
}
