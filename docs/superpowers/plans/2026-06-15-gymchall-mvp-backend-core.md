# GymChall MVP Backend Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first usable backend slice for GymChall: persisted challenge setup, participants, couples, simple check-ins, full-coverage fichas, and basic rankings powered by the existing domain scoring engine.

**Architecture:** Keep scoring rules in `GymChall.Domain`; add application services that orchestrate use cases through repository interfaces; implement persistence in `GymChall.Infrastructure` with EF Core SQLite for local MVP. Expose minimal REST endpoints from `GymChall.Api` without duplicating scoring logic.

**Tech Stack:** ASP.NET Core minimal APIs, EF Core SQLite, xUnit, deterministic `DateOnly`/`TimeOnly` domain data, existing scoring calculators from `GymChall.Domain.Scoring`.

---

## Scope

This plan implements the backend part of Fase 1 from `docs/planning/mvp-phases.md`.

Included:

- Local SQLite persistence.
- Challenge, settings, participants, couples, memberships, check-ins, simple full-coverage fichas, and audit logs.
- Default seed for the current challenge and initial 3 couples.
- Application use cases for admin setup and registration.
- Basic score projection and rankings from persisted facts.
- REST endpoints for the usable MVP backend.

Not included in this plan:

- Frontend/UI.
- Authentication.
- Prize distribution endpoints.
- Evidence uploads.
- Moved-schedule fichas.
- Weekend recovery linking and limits.
- Persisted score runs.
- Badges, notifications, WhatsApp summaries, and exports.

## File Structure

Create or modify these files:

```text
src/GymChall.Application/Abstractions/IGymChallRepository.cs
src/GymChall.Application/Challenges/ChallengeDtos.cs
src/GymChall.Application/Challenges/GymChallService.cs
src/GymChall.Application/Scoring/RankingService.cs
src/GymChall.Infrastructure/Persistence/Entities/AuditLogEntity.cs
src/GymChall.Infrastructure/Persistence/Entities/ChallengeEntity.cs
src/GymChall.Infrastructure/Persistence/Entities/ChallengeSettingsEntity.cs
src/GymChall.Infrastructure/Persistence/Entities/CheckInEntity.cs
src/GymChall.Infrastructure/Persistence/Entities/CoupleEntity.cs
src/GymChall.Infrastructure/Persistence/Entities/CoupleMembershipEntity.cs
src/GymChall.Infrastructure/Persistence/Entities/ExceptionTokenEntity.cs
src/GymChall.Infrastructure/Persistence/Entities/ParticipantEntity.cs
src/GymChall.Infrastructure/Persistence/Enums.cs
src/GymChall.Infrastructure/Persistence/GymChallDbContext.cs
src/GymChall.Infrastructure/Persistence/GymChallRepository.cs
src/GymChall.Infrastructure/Persistence/SeedData.cs
src/GymChall.Infrastructure/DependencyInjection.cs
src/GymChall.Api/Endpoints/GymChallEndpoints.cs
src/GymChall.Api/Program.cs
src/GymChall.Api/appsettings.json
tests/GymChall.Application.Tests/GymChall.Application.Tests.csproj
tests/GymChall.Application.Tests/Scoring/RankingServiceTests.cs
tests/GymChall.Infrastructure.Tests/GymChall.Infrastructure.Tests.csproj
tests/GymChall.Infrastructure.Tests/Persistence/GymChallRepositoryTests.cs
tests/GymChall.Api.Tests/GymChall.Api.Tests.csproj
tests/GymChall.Api.Tests/GymChallApiTests.cs
```

## Task 1: Add Backend Test Projects And Packages

**Files:**
- Modify: `GymChall.sln`
- Modify: `src/GymChall.Api/GymChall.Api.csproj`
- Modify: `src/GymChall.Infrastructure/GymChall.Infrastructure.csproj`
- Create: `tests/GymChall.Application.Tests/GymChall.Application.Tests.csproj`
- Create: `tests/GymChall.Infrastructure.Tests/GymChall.Infrastructure.Tests.csproj`
- Create: `tests/GymChall.Api.Tests/GymChall.Api.Tests.csproj`

- [ ] **Step 1: Create test projects**

Run:

```powershell
dotnet new xunit -n GymChall.Application.Tests -o tests/GymChall.Application.Tests
dotnet new xunit -n GymChall.Infrastructure.Tests -o tests/GymChall.Infrastructure.Tests
dotnet new xunit -n GymChall.Api.Tests -o tests/GymChall.Api.Tests
```

Expected: each command exits with code `0`.

- [ ] **Step 2: Add projects to solution**

Run:

```powershell
dotnet sln GymChall.sln add tests/GymChall.Application.Tests/GymChall.Application.Tests.csproj
dotnet sln GymChall.sln add tests/GymChall.Infrastructure.Tests/GymChall.Infrastructure.Tests.csproj
dotnet sln GymChall.sln add tests/GymChall.Api.Tests/GymChall.Api.Tests.csproj
```

Expected: all three test projects are added.

- [ ] **Step 3: Add project references**

Run:

```powershell
dotnet add tests/GymChall.Application.Tests/GymChall.Application.Tests.csproj reference src/GymChall.Application/GymChall.Application.csproj
dotnet add tests/GymChall.Infrastructure.Tests/GymChall.Infrastructure.Tests.csproj reference src/GymChall.Infrastructure/GymChall.Infrastructure.csproj
dotnet add tests/GymChall.Api.Tests/GymChall.Api.Tests.csproj reference src/GymChall.Api/GymChall.Api.csproj
dotnet add src/GymChall.Api/GymChall.Api.csproj reference src/GymChall.Infrastructure/GymChall.Infrastructure.csproj
```

Expected: project references are added.

- [ ] **Step 4: Add EF Core and API testing packages**

Run:

```powershell
dotnet add src/GymChall.Infrastructure/GymChall.Infrastructure.csproj package Microsoft.EntityFrameworkCore.Sqlite
dotnet add tests/GymChall.Infrastructure.Tests/GymChall.Infrastructure.Tests.csproj package Microsoft.EntityFrameworkCore.Sqlite
dotnet add tests/GymChall.Api.Tests/GymChall.Api.Tests.csproj package Microsoft.AspNetCore.Mvc.Testing
```

Expected: package restore succeeds.

- [ ] **Step 5: Remove template test files**

Run:

```powershell
Remove-Item -ErrorAction SilentlyContinue tests/GymChall.Application.Tests/UnitTest1.cs
Remove-Item -ErrorAction SilentlyContinue tests/GymChall.Infrastructure.Tests/UnitTest1.cs
Remove-Item -ErrorAction SilentlyContinue tests/GymChall.Api.Tests/UnitTest1.cs
```

Expected: command exits with code `0`, even if the files were already absent.

- [ ] **Step 6: Build solution**

Run:

```powershell
dotnet build GymChall.sln
```

Expected: build exits with code `0`.

- [ ] **Step 7: Commit**

Run:

```powershell
git add GymChall.sln src tests
git commit -m "build: add backend core test projects"
```

Expected: commit succeeds.

## Task 2: Add Persistence Entities And DbContext

**Files:**
- Create: `src/GymChall.Infrastructure/Persistence/Enums.cs`
- Create: `src/GymChall.Infrastructure/Persistence/Entities/ChallengeEntity.cs`
- Create: `src/GymChall.Infrastructure/Persistence/Entities/ChallengeSettingsEntity.cs`
- Create: `src/GymChall.Infrastructure/Persistence/Entities/ParticipantEntity.cs`
- Create: `src/GymChall.Infrastructure/Persistence/Entities/CoupleEntity.cs`
- Create: `src/GymChall.Infrastructure/Persistence/Entities/CoupleMembershipEntity.cs`
- Create: `src/GymChall.Infrastructure/Persistence/Entities/CheckInEntity.cs`
- Create: `src/GymChall.Infrastructure/Persistence/Entities/ExceptionTokenEntity.cs`
- Create: `src/GymChall.Infrastructure/Persistence/Entities/AuditLogEntity.cs`
- Create: `src/GymChall.Infrastructure/Persistence/GymChallDbContext.cs`
- Create: `tests/GymChall.Infrastructure.Tests/Persistence/GymChallDbContextTests.cs`

- [ ] **Step 1: Write failing DbContext model test**

Create `tests/GymChall.Infrastructure.Tests/Persistence/GymChallDbContextTests.cs`:

```csharp
using GymChall.Infrastructure.Persistence;
using GymChall.Infrastructure.Persistence.Entities;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace GymChall.Infrastructure.Tests.Persistence;

public sealed class GymChallDbContextTests
{
    [Fact]
    public async Task Can_create_schema_and_save_challenge_graph()
    {
        await using var connection = new SqliteConnection("DataSource=:memory:");
        await connection.OpenAsync();

        var options = new DbContextOptionsBuilder<GymChallDbContext>()
            .UseSqlite(connection)
            .Options;

        await using var db = new GymChallDbContext(options);
        await db.Database.EnsureCreatedAsync();

        var challengeId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var participantId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var coupleId = Guid.Parse("33333333-3333-3333-3333-333333333333");

        db.Challenges.Add(new ChallengeEntity
        {
            Id = challengeId,
            Name = "Reto Parejas - Rumbo a Septiembre",
            StartDate = new DateOnly(2026, 6, 15),
            EndDate = new DateOnly(2026, 9, 15),
            Status = ChallengeStatus.Active,
            AdminParticipantId = participantId,
            Timezone = "America/Asuncion"
        });

        db.Participants.Add(new ParticipantEntity
        {
            Id = participantId,
            DisplayName = "Rafa",
            Username = "rafa",
            Role = ParticipantRole.Admin,
            Active = true
        });

        db.Couples.Add(new CoupleEntity
        {
            Id = coupleId,
            ChallengeId = challengeId,
            Name = "Rafa + Clari",
            Active = true
        });

        db.CoupleMemberships.Add(new CoupleMembershipEntity
        {
            Id = Guid.Parse("44444444-4444-4444-4444-444444444444"),
            CoupleId = coupleId,
            ParticipantId = participantId,
            StartsOn = new DateOnly(2026, 6, 15)
        });

        await db.SaveChangesAsync();

        Assert.Equal(1, await db.Challenges.CountAsync());
        Assert.Equal(1, await db.Participants.CountAsync());
        Assert.Equal(1, await db.Couples.CountAsync());
        Assert.Equal(1, await db.CoupleMemberships.CountAsync());
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
dotnet test tests/GymChall.Infrastructure.Tests/GymChall.Infrastructure.Tests.csproj --filter GymChallDbContextTests
```

Expected: FAIL because `GymChallDbContext` and entity types do not exist.

- [ ] **Step 3: Add persistence enums**

Create `src/GymChall.Infrastructure/Persistence/Enums.cs`:

```csharp
namespace GymChall.Infrastructure.Persistence;

public enum ChallengeStatus { Draft = 0, Active = 1, Finished = 2 }
public enum ParticipantRole { Participant = 0, Admin = 1 }
public enum CheckInType { GymMorning = 0, GymSameDayRecovery = 1 }
public enum RecordStatus { Valid = 0, Corrected = 1, Rejected = 2 }
public enum ExceptionTokenType { FullCoverage = 0 }
public enum ExceptionTokenStatus { Applied = 0, Corrected = 1, Rejected = 2 }
public enum ExceptionReasonCategory { Health = 0, Period = 1, WorkTrip = 2, MandatoryTrip = 3, OtherApproved = 4 }
```

- [ ] **Step 4: Add entity classes**

Create `src/GymChall.Infrastructure/Persistence/Entities/ChallengeEntity.cs`:

```csharp
using GymChall.Infrastructure.Persistence;

namespace GymChall.Infrastructure.Persistence.Entities;

public sealed class ChallengeEntity
{
    public Guid Id { get; set; }
    public string Name { get; set; } = "";
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public ChallengeStatus Status { get; set; }
    public Guid AdminParticipantId { get; set; }
    public string Timezone { get; set; } = "America/Asuncion";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public ChallengeSettingsEntity? Settings { get; set; }
}
```

Create `src/GymChall.Infrastructure/Persistence/Entities/ChallengeSettingsEntity.cs`:

```csharp
using GymChall.Domain.Scoring;

namespace GymChall.Infrastructure.Persistence.Entities;

public sealed class ChallengeSettingsEntity
{
    public Guid Id { get; set; }
    public Guid ChallengeId { get; set; }
    public decimal MondayMorningPoints { get; set; } = ChallengeSettings.Default.MondayMorningPoints;
    public decimal WeekdayMorningPoints { get; set; } = ChallengeSettings.Default.WeekdayMorningPoints;
    public decimal SameDayRecoveryPoints { get; set; } = ChallengeSettings.Default.SameDayRecoveryPoints;
    public decimal WeekendRecoveryPoints { get; set; } = ChallengeSettings.Default.WeekendRecoveryPoints;
    public decimal DailyCoupleBonus { get; set; } = ChallengeSettings.Default.DailyCoupleBonus;
    public decimal PerfectWeekBonus { get; set; } = ChallengeSettings.Default.PerfectWeekBonus;
    public decimal CompleteWeekBonus { get; set; } = ChallengeSettings.Default.CompleteWeekBonus;
    public decimal RescuedWeekBonus { get; set; } = ChallengeSettings.Default.RescuedWeekBonus;
    public decimal LakeSoloPoints { get; set; } = ChallengeSettings.Default.LakeSoloPoints;
    public decimal LakeCouplePoints { get; set; } = ChallengeSettings.Default.LakeCouplePoints;
    public int MaxLakeScoringPerCouplePerWeek { get; set; } = ChallengeSettings.Default.MaxLakeScoringPerCouplePerWeek;
    public int MaxWeekendRecoveriesPerPersonPerWeek { get; set; } = ChallengeSettings.Default.MaxWeekendRecoveriesPerPersonPerWeek;
    public int GymMinimumMinutes { get; set; } = 45;
    public TimeOnly MorningWindowStart { get; set; } = new(4, 50);
    public TimeOnly MorningWindowEnd { get; set; } = new(5, 30);
    public ChallengeEntity? Challenge { get; set; }
}
```

Create `src/GymChall.Infrastructure/Persistence/Entities/ParticipantEntity.cs`:

```csharp
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
```

Create `src/GymChall.Infrastructure/Persistence/Entities/CoupleEntity.cs`:

```csharp
namespace GymChall.Infrastructure.Persistence.Entities;

public sealed class CoupleEntity
{
    public Guid Id { get; set; }
    public Guid ChallengeId { get; set; }
    public string Name { get; set; } = "";
    public bool Active { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public ChallengeEntity? Challenge { get; set; }
    public List<CoupleMembershipEntity> Memberships { get; set; } = [];
}
```

Create `src/GymChall.Infrastructure/Persistence/Entities/CoupleMembershipEntity.cs`:

```csharp
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
```

Create `src/GymChall.Infrastructure/Persistence/Entities/CheckInEntity.cs`:

```csharp
using GymChall.Infrastructure.Persistence;

namespace GymChall.Infrastructure.Persistence.Entities;

public sealed class CheckInEntity
{
    public Guid Id { get; set; }
    public Guid ChallengeId { get; set; }
    public Guid ParticipantId { get; set; }
    public DateTimeOffset OccurredAt { get; set; }
    public DateOnly ActivityDate { get; set; }
    public CheckInType Type { get; set; }
    public RecordStatus Status { get; set; } = RecordStatus.Valid;
    public int DurationMinutes { get; set; }
    public string? Notes { get; set; }
    public Guid CreatedByParticipantId { get; set; }
    public Guid? CorrectedByParticipantId { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
```

Create `src/GymChall.Infrastructure/Persistence/Entities/ExceptionTokenEntity.cs`:

```csharp
using GymChall.Infrastructure.Persistence;

namespace GymChall.Infrastructure.Persistence.Entities;

public sealed class ExceptionTokenEntity
{
    public Guid Id { get; set; }
    public Guid ChallengeId { get; set; }
    public Guid ParticipantId { get; set; }
    public DateOnly TargetDate { get; set; }
    public ExceptionTokenType Type { get; set; } = ExceptionTokenType.FullCoverage;
    public ExceptionReasonCategory ReasonCategory { get; set; }
    public ExceptionTokenStatus Status { get; set; } = ExceptionTokenStatus.Applied;
    public Guid AssignedByAdminId { get; set; }
    public string? Notes { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
```

Create `src/GymChall.Infrastructure/Persistence/Entities/AuditLogEntity.cs`:

```csharp
namespace GymChall.Infrastructure.Persistence.Entities;

public sealed class AuditLogEntity
{
    public Guid Id { get; set; }
    public Guid ChallengeId { get; set; }
    public Guid ActorParticipantId { get; set; }
    public string Action { get; set; } = "";
    public string EntityType { get; set; } = "";
    public Guid EntityId { get; set; }
    public string? OldValueJson { get; set; }
    public string? NewValueJson { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
```

- [ ] **Step 5: Add DbContext**

Create `src/GymChall.Infrastructure/Persistence/GymChallDbContext.cs`:

```csharp
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
```

- [ ] **Step 6: Run DbContext test**

Run:

```powershell
dotnet test tests/GymChall.Infrastructure.Tests/GymChall.Infrastructure.Tests.csproj --filter GymChallDbContextTests
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```powershell
git add src/GymChall.Infrastructure tests/GymChall.Infrastructure.Tests
git commit -m "feat: add backend persistence model"
```

Expected: commit succeeds.

## Task 3: Add Repository Contract And EF Repository

**Files:**
- Create: `src/GymChall.Application/Abstractions/IGymChallRepository.cs`
- Create: `src/GymChall.Application/Challenges/ChallengeDtos.cs`
- Create: `src/GymChall.Infrastructure/Persistence/GymChallRepository.cs`
- Create: `tests/GymChall.Infrastructure.Tests/Persistence/GymChallRepositoryTests.cs`

- [ ] **Step 1: Write failing repository test**

Create `tests/GymChall.Infrastructure.Tests/Persistence/GymChallRepositoryTests.cs`:

```csharp
using GymChall.Application.Abstractions;
using GymChall.Application.Challenges;
using GymChall.Infrastructure.Persistence;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace GymChall.Infrastructure.Tests.Persistence;

public sealed class GymChallRepositoryTests
{
    [Fact]
    public async Task Saves_and_loads_participants_couples_checkins_and_tokens()
    {
        await using var connection = new SqliteConnection("DataSource=:memory:");
        await connection.OpenAsync();

        var options = new DbContextOptionsBuilder<GymChallDbContext>()
            .UseSqlite(connection)
            .Options;

        await using var db = new GymChallDbContext(options);
        await db.Database.EnsureCreatedAsync();
        IGymChallRepository repository = new GymChallRepository(db);

        var challengeId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var rafaId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var clariId = Guid.Parse("33333333-3333-3333-3333-333333333333");

        await repository.CreateChallengeAsync(new ChallengeCreateDto(
            challengeId,
            "Reto Parejas - Rumbo a Septiembre",
            new DateOnly(2026, 6, 15),
            new DateOnly(2026, 9, 15),
            rafaId,
            "America/Asuncion"));
        await repository.AddParticipantAsync(new ParticipantCreateDto(rafaId, "Rafa", "rafa", ParticipantRoleDto.Admin, "male"));
        await repository.AddParticipantAsync(new ParticipantCreateDto(clariId, "Clari", "clari", ParticipantRoleDto.Participant, "female"));
        await repository.AddCoupleAsync(new CoupleCreateDto(Guid.Parse("44444444-4444-4444-4444-444444444444"), challengeId, "Rafa + Clari", rafaId, clariId));
        await repository.AddCheckInAsync(new CheckInCreateDto(Guid.Parse("55555555-5555-5555-5555-555555555555"), challengeId, rafaId, new DateTimeOffset(2026, 6, 15, 5, 5, 0, TimeSpan.FromHours(-4)), new DateOnly(2026, 6, 15), CheckInTypeDto.GymMorning, 45, rafaId, "5am"));
        await repository.AddFullCoverageTokenAsync(new FullCoverageTokenCreateDto(Guid.Parse("66666666-6666-6666-6666-666666666666"), challengeId, clariId, new DateOnly(2026, 6, 15), ExceptionReasonCategoryDto.Health, rafaId, "salud"));

        var snapshot = await repository.GetChallengeSnapshotAsync(challengeId);

        Assert.Equal("Reto Parejas - Rumbo a Septiembre", snapshot.Challenge.Name);
        Assert.Equal(2, snapshot.Participants.Count);
        Assert.Single(snapshot.Couples);
        Assert.Single(snapshot.CheckIns);
        Assert.Single(snapshot.FullCoverageTokens);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
dotnet test tests/GymChall.Infrastructure.Tests/GymChall.Infrastructure.Tests.csproj --filter GymChallRepositoryTests
```

Expected: FAIL because repository contract and DTOs do not exist.

- [ ] **Step 3: Add DTOs**

Create `src/GymChall.Application/Challenges/ChallengeDtos.cs`:

```csharp
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
```

- [ ] **Step 4: Add repository interface**

Create `src/GymChall.Application/Abstractions/IGymChallRepository.cs`:

```csharp
using GymChall.Application.Challenges;

namespace GymChall.Application.Abstractions;

public interface IGymChallRepository
{
    Task CreateChallengeAsync(ChallengeCreateDto challenge, CancellationToken cancellationToken = default);
    Task AddParticipantAsync(ParticipantCreateDto participant, CancellationToken cancellationToken = default);
    Task AddCoupleAsync(CoupleCreateDto couple, CancellationToken cancellationToken = default);
    Task AddCheckInAsync(CheckInCreateDto checkIn, CancellationToken cancellationToken = default);
    Task AddFullCoverageTokenAsync(FullCoverageTokenCreateDto token, CancellationToken cancellationToken = default);
    Task<ChallengeSnapshotDto> GetChallengeSnapshotAsync(Guid challengeId, CancellationToken cancellationToken = default);
    Task<Guid?> GetActiveChallengeIdAsync(CancellationToken cancellationToken = default);
}
```

- [ ] **Step 5: Add EF repository**

Create `src/GymChall.Infrastructure/Persistence/GymChallRepository.cs`:

```csharp
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
```

- [ ] **Step 6: Run repository tests**

Run:

```powershell
dotnet test tests/GymChall.Infrastructure.Tests/GymChall.Infrastructure.Tests.csproj --filter GymChallRepositoryTests
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```powershell
git add src/GymChall.Application src/GymChall.Infrastructure tests/GymChall.Infrastructure.Tests
git commit -m "feat: add gymchall repository"
```

Expected: commit succeeds.

## Task 4: Add Default Seed Service

**Files:**
- Create: `src/GymChall.Infrastructure/Persistence/SeedData.cs`
- Create: `tests/GymChall.Infrastructure.Tests/Persistence/SeedDataTests.cs`

- [ ] **Step 1: Write failing seed test**

Create `tests/GymChall.Infrastructure.Tests/Persistence/SeedDataTests.cs`:

```csharp
using GymChall.Infrastructure.Persistence;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace GymChall.Infrastructure.Tests.Persistence;

public sealed class SeedDataTests
{
    [Fact]
    public async Task Seeds_initial_challenge_participants_and_couples_once()
    {
        await using var connection = new SqliteConnection("DataSource=:memory:");
        await connection.OpenAsync();

        var options = new DbContextOptionsBuilder<GymChallDbContext>()
            .UseSqlite(connection)
            .Options;

        await using var db = new GymChallDbContext(options);
        await db.Database.EnsureCreatedAsync();

        await SeedData.EnsureSeededAsync(db);
        await SeedData.EnsureSeededAsync(db);

        Assert.Equal(1, await db.Challenges.CountAsync());
        Assert.Equal(6, await db.Participants.CountAsync());
        Assert.Equal(3, await db.Couples.CountAsync());
        Assert.Equal(6, await db.CoupleMemberships.CountAsync());
        Assert.Equal(1, await db.ChallengeSettings.CountAsync());
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
dotnet test tests/GymChall.Infrastructure.Tests/GymChall.Infrastructure.Tests.csproj --filter SeedDataTests
```

Expected: FAIL because `SeedData` does not exist.

- [ ] **Step 3: Add seed data**

Create `src/GymChall.Infrastructure/Persistence/SeedData.cs`:

```csharp
using GymChall.Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace GymChall.Infrastructure.Persistence;

public static class SeedData
{
    public static readonly Guid ChallengeId = Guid.Parse("10000000-0000-0000-0000-000000000001");
    public static readonly Guid RafaId = Guid.Parse("10000000-0000-0000-0000-000000000101");
    public static readonly Guid ClariId = Guid.Parse("10000000-0000-0000-0000-000000000102");
    public static readonly Guid ObelarId = Guid.Parse("10000000-0000-0000-0000-000000000103");
    public static readonly Guid ChachiId = Guid.Parse("10000000-0000-0000-0000-000000000104");
    public static readonly Guid CieliId = Guid.Parse("10000000-0000-0000-0000-000000000105");
    public static readonly Guid NaldoId = Guid.Parse("10000000-0000-0000-0000-000000000106");

    public static async Task EnsureSeededAsync(GymChallDbContext db, CancellationToken cancellationToken = default)
    {
        if (await db.Challenges.AnyAsync(cancellationToken))
        {
            return;
        }

        db.Participants.AddRange(
            Participant(RafaId, "Rafa", "rafa", ParticipantRole.Admin, "male"),
            Participant(ClariId, "Clari", "clari", ParticipantRole.Participant, "female"),
            Participant(ObelarId, "Obelar", "obelar", ParticipantRole.Participant, "male"),
            Participant(ChachiId, "Chachi", "chachi", ParticipantRole.Participant, "female"),
            Participant(CieliId, "Cieli", "cieli", ParticipantRole.Participant, "female"),
            Participant(NaldoId, "Naldo", "naldo", ParticipantRole.Participant, "male"));

        db.Challenges.Add(new ChallengeEntity
        {
            Id = ChallengeId,
            Name = "Reto Parejas - Rumbo a Septiembre",
            StartDate = new DateOnly(2026, 6, 15),
            EndDate = new DateOnly(2026, 9, 15),
            Status = ChallengeStatus.Active,
            AdminParticipantId = RafaId,
            Timezone = "America/Asuncion"
        });

        db.ChallengeSettings.Add(new ChallengeSettingsEntity
        {
            Id = Guid.Parse("10000000-0000-0000-0000-000000000201"),
            ChallengeId = ChallengeId
        });

        AddCouple(db, Guid.Parse("10000000-0000-0000-0000-000000000301"), "Rafa + Clari", RafaId, ClariId);
        AddCouple(db, Guid.Parse("10000000-0000-0000-0000-000000000302"), "Obelar + Chachi", ObelarId, ChachiId);
        AddCouple(db, Guid.Parse("10000000-0000-0000-0000-000000000303"), "Cieli + Naldo", CieliId, NaldoId);

        await db.SaveChangesAsync(cancellationToken);
    }

    private static ParticipantEntity Participant(Guid id, string displayName, string username, ParticipantRole role, string gender)
    {
        return new ParticipantEntity { Id = id, DisplayName = displayName, Username = username, Role = role, Gender = gender, Active = true };
    }

    private static void AddCouple(GymChallDbContext db, Guid coupleId, string name, Guid firstParticipantId, Guid secondParticipantId)
    {
        db.Couples.Add(new CoupleEntity { Id = coupleId, ChallengeId = ChallengeId, Name = name, Active = true });
        db.CoupleMemberships.Add(new CoupleMembershipEntity { Id = Guid.NewGuid(), CoupleId = coupleId, ParticipantId = firstParticipantId, StartsOn = new DateOnly(2026, 6, 15) });
        db.CoupleMemberships.Add(new CoupleMembershipEntity { Id = Guid.NewGuid(), CoupleId = coupleId, ParticipantId = secondParticipantId, StartsOn = new DateOnly(2026, 6, 15) });
    }
}
```

- [ ] **Step 4: Run seed test**

Run:

```powershell
dotnet test tests/GymChall.Infrastructure.Tests/GymChall.Infrastructure.Tests.csproj --filter SeedDataTests
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```powershell
git add src/GymChall.Infrastructure tests/GymChall.Infrastructure.Tests
git commit -m "feat: seed initial challenge data"
```

Expected: commit succeeds.

## Task 5: Add Ranking Projection Service

**Files:**
- Create: `src/GymChall.Application/Scoring/RankingService.cs`
- Create: `tests/GymChall.Application.Tests/Scoring/RankingServiceTests.cs`

- [ ] **Step 1: Write failing ranking service tests**

Create `tests/GymChall.Application.Tests/Scoring/RankingServiceTests.cs`:

```csharp
using GymChall.Application.Challenges;
using GymChall.Application.Scoring;
using GymChall.Domain.Scoring;

namespace GymChall.Application.Tests.Scoring;

public sealed class RankingServiceTests
{
    [Fact]
    public void Ranks_couples_using_morning_checkins_tokens_and_same_day_recovery()
    {
        var challengeId = Guid.NewGuid();
        var rafa = Guid.NewGuid();
        var clari = Guid.NewGuid();
        var obelar = Guid.NewGuid();
        var chachi = Guid.NewGuid();
        var coupleOne = Guid.NewGuid();
        var coupleTwo = Guid.NewGuid();

        var snapshot = new ChallengeSnapshotDto(
            new ChallengeDto(challengeId, "Reto", new DateOnly(2026, 6, 15), new DateOnly(2026, 6, 19), rafa, "America/Asuncion"),
            ChallengeSettings.Default,
            new[]
            {
                new ParticipantDto(rafa, "Rafa", "rafa", ParticipantRoleDto.Admin, "male", true),
                new ParticipantDto(clari, "Clari", "clari", ParticipantRoleDto.Participant, "female", true),
                new ParticipantDto(obelar, "Obelar", "obelar", ParticipantRoleDto.Participant, "male", true),
                new ParticipantDto(chachi, "Chachi", "chachi", ParticipantRoleDto.Participant, "female", true)
            },
            new[]
            {
                new CoupleDto(coupleOne, challengeId, "Rafa + Clari", new[] { rafa, clari }, true),
                new CoupleDto(coupleTwo, challengeId, "Obelar + Chachi", new[] { obelar, chachi }, true)
            },
            new[]
            {
                new CheckInDto(Guid.NewGuid(), challengeId, rafa, new DateOnly(2026, 6, 15), CheckInTypeDto.GymMorning, 45),
                new CheckInDto(Guid.NewGuid(), challengeId, clari, new DateOnly(2026, 6, 15), CheckInTypeDto.GymMorning, 45),
                new CheckInDto(Guid.NewGuid(), challengeId, rafa, new DateOnly(2026, 6, 16), CheckInTypeDto.GymMorning, 45),
                new CheckInDto(Guid.NewGuid(), challengeId, obelar, new DateOnly(2026, 6, 15), CheckInTypeDto.GymMorning, 45),
                new CheckInDto(Guid.NewGuid(), challengeId, chachi, new DateOnly(2026, 6, 15), CheckInTypeDto.GymSameDayRecovery, 45)
            },
            new[]
            {
                new FullCoverageTokenDto(Guid.NewGuid(), challengeId, clari, new DateOnly(2026, 6, 16), ExceptionReasonCategoryDto.Health)
            });

        var ranking = RankingService.CalculateGeneralRanking(snapshot, throughDate: new DateOnly(2026, 6, 16));

        Assert.Equal("Rafa + Clari", ranking[0].CoupleName);
        Assert.True(ranking[0].TotalPoints > ranking[1].TotalPoints);
        Assert.Equal(2, ranking[0].MorningStreak);
        Assert.Equal(0, ranking[0].GymStreak);
        Assert.Equal(0, ranking[1].GymStreak);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
dotnet test tests/GymChall.Application.Tests/GymChall.Application.Tests.csproj --filter RankingServiceTests
```

Expected: FAIL because `RankingService` does not exist.

- [ ] **Step 3: Add ranking service**

Create `src/GymChall.Application/Scoring/RankingService.cs`:

```csharp
using GymChall.Application.Challenges;
using GymChall.Domain.Scoring;

namespace GymChall.Application.Scoring;

public sealed record CoupleRankingRow(Guid CoupleId, string CoupleName, decimal TotalPoints, int MorningStreak, int GymStreak);

public static class RankingService
{
    public static IReadOnlyList<CoupleRankingRow> CalculateGeneralRanking(ChallengeSnapshotDto snapshot, DateOnly throughDate)
    {
        var dates = BusinessDates(snapshot.Challenge.StartDate, Min(snapshot.Challenge.EndDate, throughDate)).ToArray();

        return snapshot.Couples
            .Where(couple => couple.Active && couple.ParticipantIds.Count == 2)
            .Select(couple => CalculateCouple(snapshot, couple, dates))
            .OrderByDescending(row => row.TotalPoints)
            .ThenBy(row => row.CoupleName)
            .ToArray();
    }

    private static CoupleRankingRow CalculateCouple(ChallengeSnapshotDto snapshot, CoupleDto couple, IReadOnlyList<DateOnly> dates)
    {
        var firstId = couple.ParticipantIds[0];
        var secondId = couple.ParticipantIds[1];
        var total = 0m;
        var morningStreak = 0;
        var gymStreak = 0;

        foreach (var date in dates)
        {
            var first = ScoreParticipant(snapshot, firstId, date);
            var second = ScoreParticipant(snapshot, secondId, date);
            var daily = CoupleDailyScoreCalculator.Calculate(first, second, lakePoints: 0m, snapshot.Settings);
            total += daily.TotalPoints;

            if (first.CountsForMorningStreak && second.CountsForMorningStreak)
            {
                morningStreak++;
            }
            else
            {
                morningStreak = 0;
            }

            if (first.CountsForGymStreak && second.CountsForGymStreak)
            {
                gymStreak++;
            }
            else
            {
                gymStreak = 0;
            }
        }

        return new CoupleRankingRow(couple.Id, couple.Name, total, morningStreak, gymStreak);
    }

    private static DailyScoreResult ScoreParticipant(ChallengeSnapshotDto snapshot, Guid participantId, DateOnly date)
    {
        if (snapshot.FullCoverageTokens.Any(token => token.ParticipantId == participantId && token.TargetDate == date))
        {
            return DailyScoreCalculator.Calculate(new DailyScoreInput(date, CoverageKind.FullToken), snapshot.Settings);
        }

        var checkIn = snapshot.CheckIns
            .Where(x => x.ParticipantId == participantId && x.ActivityDate == date)
            .OrderBy(x => x.Type)
            .FirstOrDefault();

        var coverage = checkIn?.Type switch
        {
            CheckInTypeDto.GymMorning => CoverageKind.Morning,
            CheckInTypeDto.GymSameDayRecovery => CoverageKind.SameDayRecovery,
            _ => CoverageKind.None
        };

        return DailyScoreCalculator.Calculate(new DailyScoreInput(date, coverage), snapshot.Settings);
    }

    private static IEnumerable<DateOnly> BusinessDates(DateOnly start, DateOnly end)
    {
        for (var date = start; date <= end; date = date.AddDays(1))
        {
            if (date.DayOfWeek is not DayOfWeek.Saturday and not DayOfWeek.Sunday)
            {
                yield return date;
            }
        }
    }

    private static DateOnly Min(DateOnly first, DateOnly second)
    {
        return first <= second ? first : second;
    }
}
```

- [ ] **Step 4: Run ranking tests**

Run:

```powershell
dotnet test tests/GymChall.Application.Tests/GymChall.Application.Tests.csproj --filter RankingServiceTests
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```powershell
git add src/GymChall.Application tests/GymChall.Application.Tests
git commit -m "feat: add basic ranking projection"
```

Expected: commit succeeds.

## Task 6: Add Application Service

**Files:**
- Create: `src/GymChall.Application/Challenges/GymChallService.cs`
- Create: `tests/GymChall.Application.Tests/Challenges/GymChallServiceTests.cs`

- [ ] **Step 1: Write failing service test with fake repository**

Create `tests/GymChall.Application.Tests/Challenges/GymChallServiceTests.cs`:

```csharp
using GymChall.Application.Abstractions;
using GymChall.Application.Challenges;

namespace GymChall.Application.Tests.Challenges;

public sealed class GymChallServiceTests
{
    [Fact]
    public async Task Register_checkin_uses_active_challenge_and_creates_valid_request()
    {
        var repository = new FakeRepository(Guid.Parse("11111111-1111-1111-1111-111111111111"));
        var service = new GymChallService(repository);
        var participantId = Guid.Parse("22222222-2222-2222-2222-222222222222");

        await service.RegisterCheckInAsync(new RegisterCheckInRequest(participantId, new DateTimeOffset(2026, 6, 15, 5, 5, 0, TimeSpan.FromHours(-4)), CheckInTypeDto.GymMorning, 45, participantId, "5am"));

        Assert.NotNull(repository.LastCheckIn);
        Assert.Equal(new DateOnly(2026, 6, 15), repository.LastCheckIn.ActivityDate);
        Assert.Equal(CheckInTypeDto.GymMorning, repository.LastCheckIn.Type);
    }

    private sealed class FakeRepository(Guid activeChallengeId) : IGymChallRepository
    {
        public CheckInCreateDto? LastCheckIn { get; private set; }
        public Task CreateChallengeAsync(ChallengeCreateDto challenge, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task AddParticipantAsync(ParticipantCreateDto participant, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task AddCoupleAsync(CoupleCreateDto couple, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task AddFullCoverageTokenAsync(FullCoverageTokenCreateDto token, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task<ChallengeSnapshotDto> GetChallengeSnapshotAsync(Guid challengeId, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<Guid?> GetActiveChallengeIdAsync(CancellationToken cancellationToken = default) => Task.FromResult<Guid?>(activeChallengeId);
        public Task AddCheckInAsync(CheckInCreateDto checkIn, CancellationToken cancellationToken = default)
        {
            LastCheckIn = checkIn;
            return Task.CompletedTask;
        }
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
dotnet test tests/GymChall.Application.Tests/GymChall.Application.Tests.csproj --filter GymChallServiceTests
```

Expected: FAIL because `GymChallService` and `RegisterCheckInRequest` do not exist.

- [ ] **Step 3: Add application service**

Create `src/GymChall.Application/Challenges/GymChallService.cs`:

```csharp
using GymChall.Application.Abstractions;
using GymChall.Application.Scoring;

namespace GymChall.Application.Challenges;

public sealed record RegisterCheckInRequest(Guid ParticipantId, DateTimeOffset OccurredAt, CheckInTypeDto Type, int DurationMinutes, Guid CreatedByParticipantId, string? Notes);
public sealed record CreateFullCoverageTokenRequest(Guid ParticipantId, DateOnly TargetDate, ExceptionReasonCategoryDto ReasonCategory, Guid AssignedByAdminId, string? Notes);

public sealed class GymChallService(IGymChallRepository repository)
{
    public async Task RegisterCheckInAsync(RegisterCheckInRequest request, CancellationToken cancellationToken = default)
    {
        var challengeId = await RequireActiveChallengeId(cancellationToken);
        await repository.AddCheckInAsync(new CheckInCreateDto(Guid.NewGuid(), challengeId, request.ParticipantId, request.OccurredAt, DateOnly.FromDateTime(request.OccurredAt.Date), request.Type, request.DurationMinutes, request.CreatedByParticipantId, request.Notes), cancellationToken);
    }

    public async Task CreateFullCoverageTokenAsync(CreateFullCoverageTokenRequest request, CancellationToken cancellationToken = default)
    {
        var challengeId = await RequireActiveChallengeId(cancellationToken);
        await repository.AddFullCoverageTokenAsync(new FullCoverageTokenCreateDto(Guid.NewGuid(), challengeId, request.ParticipantId, request.TargetDate, request.ReasonCategory, request.AssignedByAdminId, request.Notes), cancellationToken);
    }

    public async Task<IReadOnlyList<CoupleRankingRow>> GetGeneralRankingAsync(DateOnly throughDate, CancellationToken cancellationToken = default)
    {
        var challengeId = await RequireActiveChallengeId(cancellationToken);
        var snapshot = await repository.GetChallengeSnapshotAsync(challengeId, cancellationToken);
        return RankingService.CalculateGeneralRanking(snapshot, throughDate);
    }

    public async Task<ChallengeSnapshotDto> GetActiveChallengeAsync(CancellationToken cancellationToken = default)
    {
        var challengeId = await RequireActiveChallengeId(cancellationToken);
        return await repository.GetChallengeSnapshotAsync(challengeId, cancellationToken);
    }

    private async Task<Guid> RequireActiveChallengeId(CancellationToken cancellationToken)
    {
        var challengeId = await repository.GetActiveChallengeIdAsync(cancellationToken);
        return challengeId ?? throw new InvalidOperationException("No active challenge exists.");
    }
}
```

- [ ] **Step 4: Run service tests**

Run:

```powershell
dotnet test tests/GymChall.Application.Tests/GymChall.Application.Tests.csproj --filter GymChallServiceTests
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```powershell
git add src/GymChall.Application tests/GymChall.Application.Tests
git commit -m "feat: add gymchall application service"
```

Expected: commit succeeds.

## Task 7: Wire API, Persistence, And Endpoints

**Files:**
- Create: `src/GymChall.Infrastructure/DependencyInjection.cs`
- Create: `src/GymChall.Api/Endpoints/GymChallEndpoints.cs`
- Modify: `src/GymChall.Api/Program.cs`
- Modify: `src/GymChall.Api/appsettings.json`
- Create: `tests/GymChall.Api.Tests/GymChallApiTests.cs`

- [ ] **Step 1: Write failing API smoke test**

Create `tests/GymChall.Api.Tests/GymChallApiTests.cs`:

```csharp
using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;
using System.Net.Http.Json;

namespace GymChall.Api.Tests;

public sealed class GymChallApiTests
{
    [Fact]
    public async Task Health_endpoint_returns_ok()
    {
        await using var app = new WebApplicationFactory<Program>();
        using var client = app.CreateClient();

        var response = await client.GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Challenge_endpoint_returns_seeded_challenge()
    {
        await using var app = new WebApplicationFactory<Program>();
        using var client = app.CreateClient();

        var response = await client.GetAsync("/api/challenge");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("Reto Parejas - Rumbo a Septiembre", body);
    }

    [Fact]
    public async Task Ranking_endpoint_returns_seeded_couples()
    {
        await using var app = new WebApplicationFactory<Program>();
        using var client = app.CreateClient();

        var response = await client.GetAsync("/api/rankings/general?throughDate=2026-06-15");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var rows = await response.Content.ReadFromJsonAsync<List<RankingRow>>();
        Assert.NotNull(rows);
        Assert.Equal(3, rows.Count);
    }

    private sealed record RankingRow(Guid CoupleId, string CoupleName, decimal TotalPoints, int MorningStreak, int GymStreak);
}
```

- [ ] **Step 2: Run API tests to verify failure**

Run:

```powershell
dotnet test tests/GymChall.Api.Tests/GymChall.Api.Tests.csproj --filter GymChallApiTests
```

Expected: challenge/ranking tests FAIL because endpoints are not wired.

- [ ] **Step 3: Add infrastructure dependency injection**

Create `src/GymChall.Infrastructure/DependencyInjection.cs`:

```csharp
using GymChall.Application.Abstractions;
using GymChall.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace GymChall.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddGymChallInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("GymChall") ?? "Data Source=gymchall.db";
        services.AddDbContext<GymChallDbContext>(options => options.UseSqlite(connectionString));
        services.AddScoped<IGymChallRepository, GymChallRepository>();
        return services;
    }
}
```

- [ ] **Step 4: Add endpoints**

Create `src/GymChall.Api/Endpoints/GymChallEndpoints.cs`:

```csharp
using GymChall.Application.Challenges;

namespace GymChall.Api.Endpoints;

public static class GymChallEndpoints
{
    public static IEndpointRouteBuilder MapGymChallEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/challenge", async (GymChallService service, CancellationToken cancellationToken) =>
        {
            return Results.Ok(await service.GetActiveChallengeAsync(cancellationToken));
        });

        app.MapPost("/api/check-ins", async (RegisterCheckInRequest request, GymChallService service, CancellationToken cancellationToken) =>
        {
            await service.RegisterCheckInAsync(request, cancellationToken);
            return Results.Created("/api/check-ins", null);
        });

        app.MapPost("/api/tokens/full-coverage", async (CreateFullCoverageTokenRequest request, GymChallService service, CancellationToken cancellationToken) =>
        {
            await service.CreateFullCoverageTokenAsync(request, cancellationToken);
            return Results.Created("/api/tokens/full-coverage", null);
        });

        app.MapGet("/api/rankings/general", async (DateOnly? throughDate, GymChallService service, CancellationToken cancellationToken) =>
        {
            var date = throughDate ?? DateOnly.FromDateTime(DateTime.UtcNow);
            return Results.Ok(await service.GetGeneralRankingAsync(date, cancellationToken));
        });

        return app;
    }
}
```

- [ ] **Step 5: Wire Program and config**

Replace `src/GymChall.Api/Program.cs` with:

```csharp
using GymChall.Api.Endpoints;
using GymChall.Application.Challenges;
using GymChall.Infrastructure;
using GymChall.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddScoped<GymChallService>();
builder.Services.AddGymChallInfrastructure(builder.Configuration);

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<GymChallDbContext>();
    await db.Database.EnsureCreatedAsync();
    await SeedData.EnsureSeededAsync(db);
}

app.MapGet("/health", () => Results.Ok(new
{
    service = "GymChall.Api",
    status = "ok"
}));

app.MapGymChallEndpoints();

app.Run();

public partial class Program
{
}
```

Modify `src/GymChall.Api/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "GymChall": "Data Source=gymchall.db"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

- [ ] **Step 6: Run API tests**

Run:

```powershell
dotnet test tests/GymChall.Api.Tests/GymChall.Api.Tests.csproj --filter GymChallApiTests
```

Expected: PASS.

- [ ] **Step 7: Run full verification**

Run:

```powershell
dotnet build GymChall.sln
dotnet test GymChall.sln
```

Expected: build succeeds and all tests pass.

- [ ] **Step 8: Commit**

Run:

```powershell
git add src/GymChall.Api src/GymChall.Infrastructure tests/GymChall.Api.Tests
git commit -m "feat: expose backend core endpoints"
```

Expected: commit succeeds.

## Task 8: Update README And Verify

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update README backend section**

Append this section to `README.md`:

````markdown
## Backend MVP Core

Endpoints iniciales:

```text
GET  /health
GET  /api/challenge
POST /api/check-ins
POST /api/tokens/full-coverage
GET  /api/rankings/general?throughDate=2026-06-15
```

La API crea la base local `gymchall.db` y carga el reto inicial si no existe.
````

- [ ] **Step 2: Final verification**

Run:

```powershell
dotnet build GymChall.sln
dotnet test GymChall.sln
git status --short
```

Expected:

```text
Compilación correcta.
Correctas! - Con error: 0
```

`git status --short` should show only `README.md` modified.

- [ ] **Step 3: Commit README**

Run:

```powershell
git add README.md
git commit -m "docs: document backend core endpoints"
```

Expected: commit succeeds.

## Self-Review Checklist

- Spec coverage: this plan covers Fase 1 backend persistence, initial setup, simple check-ins, full-coverage fichas, ranking, basic admin/participant API surface, and reuse of the domain scoring engine.
- Known gaps: auth, frontend, evidence, moved-schedule fichas, weekend recovery linking, persisted score runs, badges, notifications, exports, and WhatsApp summaries remain separate plans.
- Placeholder scan: no implementation step uses placeholder markers or references undefined code without a creation step.
- Type consistency: repository DTOs, persistence entities, service methods, and endpoint request types use the same names across tasks.
