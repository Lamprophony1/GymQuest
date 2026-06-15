using GymChall.Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace GymChall.Infrastructure.Persistence;

public sealed class GymChallDbContext(DbContextOptions<GymChallDbContext> options) : DbContext(options)
{
    public DbSet<ChallengeEntity> Challenges => Set<ChallengeEntity>();
    public DbSet<ChallengeSettingsEntity> ChallengeSettings => Set<ChallengeSettingsEntity>();
    public DbSet<ParticipantEntity> Participants => Set<ParticipantEntity>();
    public DbSet<CoupleEntity> Couples => Set<CoupleEntity>();
    public DbSet<CoupleMembershipEntity> CoupleMemberships => Set<CoupleMembershipEntity>();
    public DbSet<CheckInEntity> CheckIns => Set<CheckInEntity>();
    public DbSet<ExceptionTokenEntity> ExceptionTokens => Set<ExceptionTokenEntity>();
    public DbSet<AuditLogEntity> AuditLogs => Set<AuditLogEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ChallengeEntity>().HasKey(x => x.Id);
        modelBuilder.Entity<ChallengeEntity>().Property(x => x.Name).HasMaxLength(160);
        modelBuilder.Entity<ChallengeEntity>().Property(x => x.Timezone).HasMaxLength(80);

        modelBuilder.Entity<ChallengeSettingsEntity>().HasKey(x => x.Id);
        modelBuilder.Entity<ChallengeSettingsEntity>()
            .HasOne(x => x.Challenge)
            .WithOne(x => x.Settings)
            .HasForeignKey<ChallengeSettingsEntity>(x => x.ChallengeId);

        modelBuilder.Entity<ParticipantEntity>().HasKey(x => x.Id);
        modelBuilder.Entity<ParticipantEntity>().Property(x => x.DisplayName).HasMaxLength(80);
        modelBuilder.Entity<ParticipantEntity>().Property(x => x.Username).HasMaxLength(80);
        modelBuilder.Entity<ParticipantEntity>().HasIndex(x => x.Username).IsUnique();

        modelBuilder.Entity<CoupleEntity>().HasKey(x => x.Id);
        modelBuilder.Entity<CoupleEntity>().Property(x => x.Name).HasMaxLength(120);
        modelBuilder.Entity<CoupleEntity>()
            .HasOne(x => x.Challenge)
            .WithMany()
            .HasForeignKey(x => x.ChallengeId);

        modelBuilder.Entity<CoupleMembershipEntity>().HasKey(x => x.Id);
        modelBuilder.Entity<CoupleMembershipEntity>()
            .HasOne(x => x.Couple)
            .WithMany(x => x.Memberships)
            .HasForeignKey(x => x.CoupleId);
        modelBuilder.Entity<CoupleMembershipEntity>()
            .HasOne(x => x.Participant)
            .WithMany()
            .HasForeignKey(x => x.ParticipantId);
        modelBuilder.Entity<CoupleMembershipEntity>()
            .HasIndex(x => new { x.CoupleId, x.ParticipantId, x.StartsOn })
            .IsUnique();

        modelBuilder.Entity<CheckInEntity>().HasKey(x => x.Id);
        modelBuilder.Entity<CheckInEntity>().HasIndex(x => new { x.ChallengeId, x.ParticipantId, x.ActivityDate, x.Type });

        modelBuilder.Entity<ExceptionTokenEntity>().HasKey(x => x.Id);
        modelBuilder.Entity<ExceptionTokenEntity>().HasIndex(x => new { x.ChallengeId, x.ParticipantId, x.TargetDate, x.Type });

        modelBuilder.Entity<AuditLogEntity>().HasKey(x => x.Id);
        modelBuilder.Entity<AuditLogEntity>().HasIndex(x => new { x.ChallengeId, x.CreatedAt });
    }
}
