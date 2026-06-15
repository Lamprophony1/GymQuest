# GymChall MVP Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first technical foundation for GymChall: .NET solution, pure domain scoring engine, focused tests, and a minimal API shell.

**Architecture:** Keep scoring rules in `GymChall.Domain` as pure deterministic code with no database or HTTP dependencies. `GymChall.Application` will orchestrate future use cases, `GymChall.Infrastructure` will hold persistence later, and `GymChall.Api` will expose HTTP endpoints without duplicating scoring logic.

**Tech Stack:** ASP.NET Core Web API, .NET test projects with xUnit, decimal scoring, `DateOnly` for challenge dates, PostgreSQL planned for persistence after the domain engine is stable.

---

## Scope

This plan implements the first foundation only:

- Solution and project structure.
- Domain scoring types.
- Daily individual scoring.
- Couple daily bonus scoring.
- Weekly bonus scoring.
- Lake scoring rules.
- Minimal API shell.

This plan does not implement the visual UI. The mobile-first UX/design pass happens before frontend implementation.

## File Structure

Create these files:

```text
GymChall.sln
src/GymChall.Domain/GymChall.Domain.csproj
src/GymChall.Domain/Scoring/ChallengeSettings.cs
src/GymChall.Domain/Scoring/CoverageKind.cs
src/GymChall.Domain/Scoring/DailyScoreCalculator.cs
src/GymChall.Domain/Scoring/DailyScoreInput.cs
src/GymChall.Domain/Scoring/DailyScoreResult.cs
src/GymChall.Domain/Scoring/CoupleDailyScoreCalculator.cs
src/GymChall.Domain/Scoring/CoupleDailyScoreResult.cs
src/GymChall.Domain/Scoring/WeeklyScoreCalculator.cs
src/GymChall.Domain/Scoring/WeeklyScoreInput.cs
src/GymChall.Domain/Scoring/WeeklyScoreResult.cs
src/GymChall.Domain/Scoring/WeeklyBonusType.cs
src/GymChall.Domain/Scoring/LakeScoringCalculator.cs
src/GymChall.Domain/Scoring/LakeActivityInput.cs
src/GymChall.Domain/Scoring/LakeScoreResult.cs
src/GymChall.Application/GymChall.Application.csproj
src/GymChall.Infrastructure/GymChall.Infrastructure.csproj
src/GymChall.Api/GymChall.Api.csproj
src/GymChall.Api/Program.cs
tests/GymChall.Domain.Tests/GymChall.Domain.Tests.csproj
tests/GymChall.Domain.Tests/Scoring/DailyScoreCalculatorTests.cs
tests/GymChall.Domain.Tests/Scoring/CoupleDailyScoreCalculatorTests.cs
tests/GymChall.Domain.Tests/Scoring/WeeklyScoreCalculatorTests.cs
tests/GymChall.Domain.Tests/Scoring/LakeScoringCalculatorTests.cs
```

## Task 1: Scaffold The .NET Solution

**Files:**
- Create: `GymChall.sln`
- Create: `src/GymChall.Domain/GymChall.Domain.csproj`
- Create: `src/GymChall.Application/GymChall.Application.csproj`
- Create: `src/GymChall.Infrastructure/GymChall.Infrastructure.csproj`
- Create: `src/GymChall.Api/GymChall.Api.csproj`
- Create: `tests/GymChall.Domain.Tests/GymChall.Domain.Tests.csproj`

- [ ] **Step 1: Create solution and projects**

Run:

```powershell
dotnet new sln -n GymChall
dotnet new classlib -n GymChall.Domain -o src/GymChall.Domain
dotnet new classlib -n GymChall.Application -o src/GymChall.Application
dotnet new classlib -n GymChall.Infrastructure -o src/GymChall.Infrastructure
dotnet new webapi -n GymChall.Api -o src/GymChall.Api --no-https
dotnet new xunit -n GymChall.Domain.Tests -o tests/GymChall.Domain.Tests
```

Expected: each command exits with code `0`.

- [ ] **Step 2: Add projects to solution**

Run:

```powershell
dotnet sln GymChall.sln add src/GymChall.Domain/GymChall.Domain.csproj
dotnet sln GymChall.sln add src/GymChall.Application/GymChall.Application.csproj
dotnet sln GymChall.sln add src/GymChall.Infrastructure/GymChall.Infrastructure.csproj
dotnet sln GymChall.sln add src/GymChall.Api/GymChall.Api.csproj
dotnet sln GymChall.sln add tests/GymChall.Domain.Tests/GymChall.Domain.Tests.csproj
```

Expected: each project is added to `GymChall.sln`.

- [ ] **Step 3: Add project references**

Run:

```powershell
dotnet add src/GymChall.Application/GymChall.Application.csproj reference src/GymChall.Domain/GymChall.Domain.csproj
dotnet add src/GymChall.Infrastructure/GymChall.Infrastructure.csproj reference src/GymChall.Application/GymChall.Application.csproj
dotnet add src/GymChall.Api/GymChall.Api.csproj reference src/GymChall.Application/GymChall.Application.csproj
dotnet add tests/GymChall.Domain.Tests/GymChall.Domain.Tests.csproj reference src/GymChall.Domain/GymChall.Domain.csproj
```

Expected: each reference is added.

- [ ] **Step 4: Remove template files**

Delete these files if the templates created them:

```text
src/GymChall.Domain/Class1.cs
src/GymChall.Application/Class1.cs
src/GymChall.Infrastructure/Class1.cs
tests/GymChall.Domain.Tests/UnitTest1.cs
```

- [ ] **Step 5: Build the empty solution**

Run:

```powershell
dotnet build GymChall.sln
```

Expected: build exits with code `0`.

- [ ] **Step 6: Commit scaffold**

Run:

```powershell
git add GymChall.sln src tests
git commit -m "build: scaffold dotnet solution"
```

Expected: commit succeeds.

## Task 2: Add Core Scoring Types

**Files:**
- Create: `src/GymChall.Domain/Scoring/ChallengeSettings.cs`
- Create: `src/GymChall.Domain/Scoring/CoverageKind.cs`
- Create: `src/GymChall.Domain/Scoring/DailyScoreInput.cs`
- Create: `src/GymChall.Domain/Scoring/DailyScoreResult.cs`

- [ ] **Step 1: Write a failing settings test**

Create `tests/GymChall.Domain.Tests/Scoring/ChallengeSettingsTests.cs`:

```csharp
using GymChall.Domain.Scoring;

namespace GymChall.Domain.Tests.Scoring;

public sealed class ChallengeSettingsTests
{
    [Fact]
    public void Defaults_match_current_challenge_rules()
    {
        var settings = ChallengeSettings.Default;

        Assert.Equal(4m, settings.MondayMorningPoints);
        Assert.Equal(3m, settings.WeekdayMorningPoints);
        Assert.Equal(2m, settings.SameDayRecoveryPoints);
        Assert.Equal(1.5m, settings.WeekendRecoveryPoints);
        Assert.Equal(1m, settings.DailyCoupleBonus);
        Assert.Equal(12m, settings.PerfectWeekBonus);
        Assert.Equal(7m, settings.CompleteWeekBonus);
        Assert.Equal(4m, settings.RescuedWeekBonus);
        Assert.Equal(1m, settings.LakeSoloPoints);
        Assert.Equal(3m, settings.LakeCouplePoints);
        Assert.Equal(2, settings.MaxLakeScoringPerCouplePerWeek);
        Assert.Equal(2, settings.MaxWeekendRecoveriesPerPersonPerWeek);
    }
}
```

- [ ] **Step 2: Run the failing test**

Run:

```powershell
dotnet test tests/GymChall.Domain.Tests/GymChall.Domain.Tests.csproj --filter ChallengeSettingsTests
```

Expected: FAIL because `ChallengeSettings` does not exist.

- [ ] **Step 3: Add `ChallengeSettings`**

Create `src/GymChall.Domain/Scoring/ChallengeSettings.cs`:

```csharp
namespace GymChall.Domain.Scoring;

public sealed record ChallengeSettings(
    decimal MondayMorningPoints,
    decimal WeekdayMorningPoints,
    decimal SameDayRecoveryPoints,
    decimal WeekendRecoveryPoints,
    decimal DailyCoupleBonus,
    decimal PerfectWeekBonus,
    decimal CompleteWeekBonus,
    decimal RescuedWeekBonus,
    decimal LakeSoloPoints,
    decimal LakeCouplePoints,
    int MaxLakeScoringPerCouplePerWeek,
    int MaxWeekendRecoveriesPerPersonPerWeek)
{
    public static ChallengeSettings Default { get; } = new(
        MondayMorningPoints: 4m,
        WeekdayMorningPoints: 3m,
        SameDayRecoveryPoints: 2m,
        WeekendRecoveryPoints: 1.5m,
        DailyCoupleBonus: 1m,
        PerfectWeekBonus: 12m,
        CompleteWeekBonus: 7m,
        RescuedWeekBonus: 4m,
        LakeSoloPoints: 1m,
        LakeCouplePoints: 3m,
        MaxLakeScoringPerCouplePerWeek: 2,
        MaxWeekendRecoveriesPerPersonPerWeek: 2);
}
```

- [ ] **Step 4: Add coverage and result records**

Create `src/GymChall.Domain/Scoring/CoverageKind.cs`:

```csharp
namespace GymChall.Domain.Scoring;

public enum CoverageKind
{
    None = 0,
    Morning = 1,
    FullToken = 2,
    MovedSchedule = 3,
    SameDayRecovery = 4,
    WeekendRecovery = 5
}
```

Create `src/GymChall.Domain/Scoring/DailyScoreInput.cs`:

```csharp
namespace GymChall.Domain.Scoring;

public sealed record DailyScoreInput(
    DateOnly Date,
    CoverageKind CoverageKind);
```

Create `src/GymChall.Domain/Scoring/DailyScoreResult.cs`:

```csharp
namespace GymChall.Domain.Scoring;

public sealed record DailyScoreResult(
    DateOnly Date,
    CoverageKind CoverageKind,
    decimal Points,
    bool IsCovered,
    bool CountsForDailyCoupleBonus,
    bool CountsForMorningStreak,
    bool CountsForGymStreak,
    bool CountsForPerfectWeek,
    bool CountsForCompleteWeek,
    bool CountsForRescuedWeek);
```

- [ ] **Step 5: Run the settings test**

Run:

```powershell
dotnet test tests/GymChall.Domain.Tests/GymChall.Domain.Tests.csproj --filter ChallengeSettingsTests
```

Expected: PASS.

- [ ] **Step 6: Commit core types**

Run:

```powershell
git add src/GymChall.Domain tests/GymChall.Domain.Tests
git commit -m "feat: add scoring core types"
```

Expected: commit succeeds.

## Task 3: Implement Daily Individual Scoring

**Files:**
- Create: `src/GymChall.Domain/Scoring/DailyScoreCalculator.cs`
- Create: `tests/GymChall.Domain.Tests/Scoring/DailyScoreCalculatorTests.cs`

- [ ] **Step 1: Write failing daily scoring tests**

Create `tests/GymChall.Domain.Tests/Scoring/DailyScoreCalculatorTests.cs`:

```csharp
using GymChall.Domain.Scoring;

namespace GymChall.Domain.Tests.Scoring;

public sealed class DailyScoreCalculatorTests
{
    [Fact]
    public void Monday_morning_scores_four_and_counts_for_bonus_and_both_streaks()
    {
        var result = DailyScoreCalculator.Calculate(
            new DailyScoreInput(new DateOnly(2026, 6, 15), CoverageKind.Morning),
            ChallengeSettings.Default);

        Assert.Equal(4m, result.Points);
        Assert.True(result.IsCovered);
        Assert.True(result.CountsForDailyCoupleBonus);
        Assert.True(result.CountsForMorningStreak);
        Assert.True(result.CountsForGymStreak);
        Assert.True(result.CountsForPerfectWeek);
    }

    [Fact]
    public void Tuesday_morning_scores_three()
    {
        var result = DailyScoreCalculator.Calculate(
            new DailyScoreInput(new DateOnly(2026, 6, 16), CoverageKind.Morning),
            ChallengeSettings.Default);

        Assert.Equal(3m, result.Points);
    }

    [Fact]
    public void Full_token_scores_normal_day_and_counts_for_daily_bonus_and_morning_streak()
    {
        var result = DailyScoreCalculator.Calculate(
            new DailyScoreInput(new DateOnly(2026, 6, 17), CoverageKind.FullToken),
            ChallengeSettings.Default);

        Assert.Equal(3m, result.Points);
        Assert.True(result.IsCovered);
        Assert.True(result.CountsForDailyCoupleBonus);
        Assert.True(result.CountsForMorningStreak);
        Assert.False(result.CountsForGymStreak);
        Assert.True(result.CountsForPerfectWeek);
    }

    [Fact]
    public void Moved_schedule_scores_normal_day_and_counts_for_bonus_and_streaks()
    {
        var result = DailyScoreCalculator.Calculate(
            new DailyScoreInput(new DateOnly(2026, 6, 18), CoverageKind.MovedSchedule),
            ChallengeSettings.Default);

        Assert.Equal(3m, result.Points);
        Assert.True(result.CountsForDailyCoupleBonus);
        Assert.True(result.CountsForMorningStreak);
        Assert.True(result.CountsForGymStreak);
        Assert.True(result.CountsForPerfectWeek);
    }

    [Fact]
    public void Same_day_recovery_scores_two_but_does_not_count_for_daily_bonus_or_morning_streak()
    {
        var result = DailyScoreCalculator.Calculate(
            new DailyScoreInput(new DateOnly(2026, 6, 19), CoverageKind.SameDayRecovery),
            ChallengeSettings.Default);

        Assert.Equal(2m, result.Points);
        Assert.True(result.IsCovered);
        Assert.False(result.CountsForDailyCoupleBonus);
        Assert.False(result.CountsForMorningStreak);
        Assert.True(result.CountsForGymStreak);
        Assert.False(result.CountsForPerfectWeek);
        Assert.True(result.CountsForCompleteWeek);
    }

    [Fact]
    public void Weekend_recovery_scores_one_point_five_and_only_counts_for_rescued_week()
    {
        var result = DailyScoreCalculator.Calculate(
            new DailyScoreInput(new DateOnly(2026, 6, 18), CoverageKind.WeekendRecovery),
            ChallengeSettings.Default);

        Assert.Equal(1.5m, result.Points);
        Assert.True(result.IsCovered);
        Assert.False(result.CountsForDailyCoupleBonus);
        Assert.False(result.CountsForMorningStreak);
        Assert.False(result.CountsForGymStreak);
        Assert.False(result.CountsForPerfectWeek);
        Assert.True(result.CountsForRescuedWeek);
    }

    [Fact]
    public void None_scores_zero_and_breaks_coverage()
    {
        var result = DailyScoreCalculator.Calculate(
            new DailyScoreInput(new DateOnly(2026, 6, 18), CoverageKind.None),
            ChallengeSettings.Default);

        Assert.Equal(0m, result.Points);
        Assert.False(result.IsCovered);
        Assert.False(result.CountsForDailyCoupleBonus);
        Assert.False(result.CountsForMorningStreak);
        Assert.False(result.CountsForGymStreak);
    }
}
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```powershell
dotnet test tests/GymChall.Domain.Tests/GymChall.Domain.Tests.csproj --filter DailyScoreCalculatorTests
```

Expected: FAIL because `DailyScoreCalculator` does not exist.

- [ ] **Step 3: Implement daily scoring**

Create `src/GymChall.Domain/Scoring/DailyScoreCalculator.cs`:

```csharp
namespace GymChall.Domain.Scoring;

public static class DailyScoreCalculator
{
    public static DailyScoreResult Calculate(DailyScoreInput input, ChallengeSettings settings)
    {
        var normalDayPoints = GetNormalDayPoints(input.Date, settings);

        return input.CoverageKind switch
        {
            CoverageKind.Morning => new DailyScoreResult(
                input.Date,
                input.CoverageKind,
                normalDayPoints,
                IsCovered: true,
                CountsForDailyCoupleBonus: true,
                CountsForMorningStreak: true,
                CountsForGymStreak: true,
                CountsForPerfectWeek: true,
                CountsForCompleteWeek: false,
                CountsForRescuedWeek: false),

            CoverageKind.FullToken => new DailyScoreResult(
                input.Date,
                input.CoverageKind,
                normalDayPoints,
                IsCovered: true,
                CountsForDailyCoupleBonus: true,
                CountsForMorningStreak: true,
                CountsForGymStreak: false,
                CountsForPerfectWeek: true,
                CountsForCompleteWeek: false,
                CountsForRescuedWeek: false),

            CoverageKind.MovedSchedule => new DailyScoreResult(
                input.Date,
                input.CoverageKind,
                normalDayPoints,
                IsCovered: true,
                CountsForDailyCoupleBonus: true,
                CountsForMorningStreak: true,
                CountsForGymStreak: true,
                CountsForPerfectWeek: true,
                CountsForCompleteWeek: false,
                CountsForRescuedWeek: false),

            CoverageKind.SameDayRecovery => new DailyScoreResult(
                input.Date,
                input.CoverageKind,
                settings.SameDayRecoveryPoints,
                IsCovered: true,
                CountsForDailyCoupleBonus: false,
                CountsForMorningStreak: false,
                CountsForGymStreak: true,
                CountsForPerfectWeek: false,
                CountsForCompleteWeek: true,
                CountsForRescuedWeek: false),

            CoverageKind.WeekendRecovery => new DailyScoreResult(
                input.Date,
                input.CoverageKind,
                settings.WeekendRecoveryPoints,
                IsCovered: true,
                CountsForDailyCoupleBonus: false,
                CountsForMorningStreak: false,
                CountsForGymStreak: false,
                CountsForPerfectWeek: false,
                CountsForCompleteWeek: false,
                CountsForRescuedWeek: true),

            CoverageKind.None => new DailyScoreResult(
                input.Date,
                input.CoverageKind,
                0m,
                IsCovered: false,
                CountsForDailyCoupleBonus: false,
                CountsForMorningStreak: false,
                CountsForGymStreak: false,
                CountsForPerfectWeek: false,
                CountsForCompleteWeek: false,
                CountsForRescuedWeek: false),

            _ => throw new ArgumentOutOfRangeException(nameof(input), input.CoverageKind, "Unsupported coverage kind.")
        };
    }

    private static decimal GetNormalDayPoints(DateOnly date, ChallengeSettings settings)
    {
        return date.DayOfWeek == DayOfWeek.Monday
            ? settings.MondayMorningPoints
            : settings.WeekdayMorningPoints;
    }
}
```

- [ ] **Step 4: Run daily scoring tests**

Run:

```powershell
dotnet test tests/GymChall.Domain.Tests/GymChall.Domain.Tests.csproj --filter DailyScoreCalculatorTests
```

Expected: PASS.

- [ ] **Step 5: Commit daily scoring**

Run:

```powershell
git add src/GymChall.Domain tests/GymChall.Domain.Tests
git commit -m "feat: add daily scoring rules"
```

Expected: commit succeeds.

## Task 4: Implement Couple Daily Bonus Scoring

**Files:**
- Create: `src/GymChall.Domain/Scoring/CoupleDailyScoreCalculator.cs`
- Create: `src/GymChall.Domain/Scoring/CoupleDailyScoreResult.cs`
- Create: `tests/GymChall.Domain.Tests/Scoring/CoupleDailyScoreCalculatorTests.cs`

- [ ] **Step 1: Write failing couple daily score tests**

Create `tests/GymChall.Domain.Tests/Scoring/CoupleDailyScoreCalculatorTests.cs`:

```csharp
using GymChall.Domain.Scoring;

namespace GymChall.Domain.Tests.Scoring;

public sealed class CoupleDailyScoreCalculatorTests
{
    [Fact]
    public void Adds_daily_bonus_when_both_members_are_eligible()
    {
        var date = new DateOnly(2026, 6, 15);
        var first = DailyScoreCalculator.Calculate(new DailyScoreInput(date, CoverageKind.Morning), ChallengeSettings.Default);
        var second = DailyScoreCalculator.Calculate(new DailyScoreInput(date, CoverageKind.FullToken), ChallengeSettings.Default);

        var result = CoupleDailyScoreCalculator.Calculate(first, second, lakePoints: 0m, ChallengeSettings.Default);

        Assert.Equal(9m, result.TotalPoints);
        Assert.Equal(1m, result.DailyBonusPoints);
        Assert.True(result.BothEligibleForDailyBonus);
    }

    [Fact]
    public void Does_not_add_daily_bonus_when_one_member_only_has_same_day_recovery()
    {
        var date = new DateOnly(2026, 6, 16);
        var first = DailyScoreCalculator.Calculate(new DailyScoreInput(date, CoverageKind.Morning), ChallengeSettings.Default);
        var second = DailyScoreCalculator.Calculate(new DailyScoreInput(date, CoverageKind.SameDayRecovery), ChallengeSettings.Default);

        var result = CoupleDailyScoreCalculator.Calculate(first, second, lakePoints: 0m, ChallengeSettings.Default);

        Assert.Equal(5m, result.TotalPoints);
        Assert.Equal(0m, result.DailyBonusPoints);
        Assert.False(result.BothEligibleForDailyBonus);
    }

    [Fact]
    public void Includes_lake_points_in_total()
    {
        var date = new DateOnly(2026, 6, 16);
        var first = DailyScoreCalculator.Calculate(new DailyScoreInput(date, CoverageKind.Morning), ChallengeSettings.Default);
        var second = DailyScoreCalculator.Calculate(new DailyScoreInput(date, CoverageKind.Morning), ChallengeSettings.Default);

        var result = CoupleDailyScoreCalculator.Calculate(first, second, lakePoints: 3m, ChallengeSettings.Default);

        Assert.Equal(10m, result.TotalPoints);
        Assert.Equal(3m, result.LakePoints);
    }
}
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```powershell
dotnet test tests/GymChall.Domain.Tests/GymChall.Domain.Tests.csproj --filter CoupleDailyScoreCalculatorTests
```

Expected: FAIL because couple scoring types do not exist.

- [ ] **Step 3: Implement couple daily scoring**

Create `src/GymChall.Domain/Scoring/CoupleDailyScoreResult.cs`:

```csharp
namespace GymChall.Domain.Scoring;

public sealed record CoupleDailyScoreResult(
    decimal FirstParticipantPoints,
    decimal SecondParticipantPoints,
    decimal DailyBonusPoints,
    decimal LakePoints,
    decimal TotalPoints,
    bool BothEligibleForDailyBonus,
    bool BothCoveredForWeeklyCount);
```

Create `src/GymChall.Domain/Scoring/CoupleDailyScoreCalculator.cs`:

```csharp
namespace GymChall.Domain.Scoring;

public static class CoupleDailyScoreCalculator
{
    public static CoupleDailyScoreResult Calculate(
        DailyScoreResult first,
        DailyScoreResult second,
        decimal lakePoints,
        ChallengeSettings settings)
    {
        var bothEligibleForDailyBonus = first.CountsForDailyCoupleBonus && second.CountsForDailyCoupleBonus;
        var dailyBonus = bothEligibleForDailyBonus ? settings.DailyCoupleBonus : 0m;
        var total = first.Points + second.Points + dailyBonus + lakePoints;

        return new CoupleDailyScoreResult(
            FirstParticipantPoints: first.Points,
            SecondParticipantPoints: second.Points,
            DailyBonusPoints: dailyBonus,
            LakePoints: lakePoints,
            TotalPoints: total,
            BothEligibleForDailyBonus: bothEligibleForDailyBonus,
            BothCoveredForWeeklyCount: first.IsCovered && second.IsCovered);
    }
}
```

- [ ] **Step 4: Run couple daily score tests**

Run:

```powershell
dotnet test tests/GymChall.Domain.Tests/GymChall.Domain.Tests.csproj --filter CoupleDailyScoreCalculatorTests
```

Expected: PASS.

- [ ] **Step 5: Commit couple daily scoring**

Run:

```powershell
git add src/GymChall.Domain tests/GymChall.Domain.Tests
git commit -m "feat: add couple daily scoring"
```

Expected: commit succeeds.

## Task 5: Implement Weekly Bonus Scoring

**Files:**
- Create: `src/GymChall.Domain/Scoring/WeeklyBonusType.cs`
- Create: `src/GymChall.Domain/Scoring/WeeklyScoreInput.cs`
- Create: `src/GymChall.Domain/Scoring/WeeklyScoreResult.cs`
- Create: `src/GymChall.Domain/Scoring/WeeklyScoreCalculator.cs`
- Create: `tests/GymChall.Domain.Tests/Scoring/WeeklyScoreCalculatorTests.cs`

- [ ] **Step 1: Write failing weekly score tests**

Create `tests/GymChall.Domain.Tests/Scoring/WeeklyScoreCalculatorTests.cs`:

```csharp
using GymChall.Domain.Scoring;

namespace GymChall.Domain.Tests.Scoring;

public sealed class WeeklyScoreCalculatorTests
{
    [Fact]
    public void Perfect_week_gets_perfect_bonus()
    {
        var scores = BuildWeek(CoverageKind.Morning, CoverageKind.FullToken, CoverageKind.Morning, CoverageKind.MovedSchedule, CoverageKind.Morning);

        var result = WeeklyScoreCalculator.Calculate(new WeeklyScoreInput(scores), ChallengeSettings.Default);

        Assert.Equal(WeeklyBonusType.Perfect, result.WeeklyBonusType);
        Assert.Equal(12m, result.WeeklyBonusPoints);
    }

    [Fact]
    public void Same_day_recovery_makes_week_complete_not_perfect()
    {
        var scores = BuildWeek(CoverageKind.Morning, CoverageKind.SameDayRecovery, CoverageKind.Morning, CoverageKind.Morning, CoverageKind.Morning);

        var result = WeeklyScoreCalculator.Calculate(new WeeklyScoreInput(scores), ChallengeSettings.Default);

        Assert.Equal(WeeklyBonusType.Complete, result.WeeklyBonusType);
        Assert.Equal(7m, result.WeeklyBonusPoints);
    }

    [Fact]
    public void Weekend_recovery_makes_week_rescued()
    {
        var scores = BuildWeek(CoverageKind.Morning, CoverageKind.SameDayRecovery, CoverageKind.WeekendRecovery, CoverageKind.Morning, CoverageKind.Morning);

        var result = WeeklyScoreCalculator.Calculate(new WeeklyScoreInput(scores), ChallengeSettings.Default);

        Assert.Equal(WeeklyBonusType.Rescued, result.WeeklyBonusType);
        Assert.Equal(4m, result.WeeklyBonusPoints);
    }

    [Fact]
    public void Missing_day_gets_no_weekly_bonus()
    {
        var scores = BuildWeek(CoverageKind.Morning, CoverageKind.None, CoverageKind.Morning, CoverageKind.Morning, CoverageKind.Morning);

        var result = WeeklyScoreCalculator.Calculate(new WeeklyScoreInput(scores), ChallengeSettings.Default);

        Assert.Equal(WeeklyBonusType.None, result.WeeklyBonusType);
        Assert.Equal(0m, result.WeeklyBonusPoints);
    }

    [Fact]
    public void Partial_week_uses_only_required_business_days_inside_challenge()
    {
        var date = new DateOnly(2026, 6, 18);
        var scores = new[]
        {
            Pair(date, CoverageKind.Morning, CoverageKind.Morning),
            Pair(date.AddDays(1), CoverageKind.FullToken, CoverageKind.Morning)
        };

        var result = WeeklyScoreCalculator.Calculate(new WeeklyScoreInput(scores), ChallengeSettings.Default);

        Assert.Equal(2, result.RequiredBusinessDays);
        Assert.Equal(WeeklyBonusType.Perfect, result.WeeklyBonusType);
    }

    private static IReadOnlyList<(DailyScoreResult First, DailyScoreResult Second)> BuildWeek(params CoverageKind[] kinds)
    {
        var monday = new DateOnly(2026, 6, 15);
        return kinds.Select((kind, index) => Pair(monday.AddDays(index), kind, CoverageKind.Morning)).ToArray();
    }

    private static (DailyScoreResult First, DailyScoreResult Second) Pair(DateOnly date, CoverageKind firstKind, CoverageKind secondKind)
    {
        return (
            DailyScoreCalculator.Calculate(new DailyScoreInput(date, firstKind), ChallengeSettings.Default),
            DailyScoreCalculator.Calculate(new DailyScoreInput(date, secondKind), ChallengeSettings.Default));
    }
}
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```powershell
dotnet test tests/GymChall.Domain.Tests/GymChall.Domain.Tests.csproj --filter WeeklyScoreCalculatorTests
```

Expected: FAIL because weekly scoring types do not exist.

- [ ] **Step 3: Implement weekly scoring**

Create `src/GymChall.Domain/Scoring/WeeklyBonusType.cs`:

```csharp
namespace GymChall.Domain.Scoring;

public enum WeeklyBonusType
{
    None = 0,
    Perfect = 1,
    Complete = 2,
    Rescued = 3
}
```

Create `src/GymChall.Domain/Scoring/WeeklyScoreInput.cs`:

```csharp
namespace GymChall.Domain.Scoring;

public sealed record WeeklyScoreInput(
    IReadOnlyList<(DailyScoreResult First, DailyScoreResult Second)> RequiredBusinessDayScores);
```

Create `src/GymChall.Domain/Scoring/WeeklyScoreResult.cs`:

```csharp
namespace GymChall.Domain.Scoring;

public sealed record WeeklyScoreResult(
    int RequiredBusinessDays,
    WeeklyBonusType WeeklyBonusType,
    decimal WeeklyBonusPoints,
    decimal IndividualPoints);
```

Create `src/GymChall.Domain/Scoring/WeeklyScoreCalculator.cs`:

```csharp
namespace GymChall.Domain.Scoring;

public static class WeeklyScoreCalculator
{
    public static WeeklyScoreResult Calculate(WeeklyScoreInput input, ChallengeSettings settings)
    {
        if (input.RequiredBusinessDayScores.Count == 0)
        {
            return new WeeklyScoreResult(0, WeeklyBonusType.None, 0m, 0m);
        }

        var individualPoints = input.RequiredBusinessDayScores.Sum(pair => pair.First.Points + pair.Second.Points);
        var everyoneCovered = input.RequiredBusinessDayScores.All(pair => pair.First.IsCovered && pair.Second.IsCovered);

        if (!everyoneCovered)
        {
            return new WeeklyScoreResult(input.RequiredBusinessDayScores.Count, WeeklyBonusType.None, 0m, individualPoints);
        }

        var usedWeekendRecovery = input.RequiredBusinessDayScores.Any(pair =>
            pair.First.CountsForRescuedWeek || pair.Second.CountsForRescuedWeek);

        if (usedWeekendRecovery)
        {
            return new WeeklyScoreResult(input.RequiredBusinessDayScores.Count, WeeklyBonusType.Rescued, settings.RescuedWeekBonus, individualPoints);
        }

        var usedSameDayRecovery = input.RequiredBusinessDayScores.Any(pair =>
            pair.First.CountsForCompleteWeek || pair.Second.CountsForCompleteWeek);

        if (usedSameDayRecovery)
        {
            return new WeeklyScoreResult(input.RequiredBusinessDayScores.Count, WeeklyBonusType.Complete, settings.CompleteWeekBonus, individualPoints);
        }

        return new WeeklyScoreResult(input.RequiredBusinessDayScores.Count, WeeklyBonusType.Perfect, settings.PerfectWeekBonus, individualPoints);
    }
}
```

- [ ] **Step 4: Run weekly score tests**

Run:

```powershell
dotnet test tests/GymChall.Domain.Tests/GymChall.Domain.Tests.csproj --filter WeeklyScoreCalculatorTests
```

Expected: PASS.

- [ ] **Step 5: Commit weekly scoring**

Run:

```powershell
git add src/GymChall.Domain tests/GymChall.Domain.Tests
git commit -m "feat: add weekly scoring rules"
```

Expected: commit succeeds.

## Task 6: Implement Lake Scoring

**Files:**
- Create: `src/GymChall.Domain/Scoring/LakeActivityInput.cs`
- Create: `src/GymChall.Domain/Scoring/LakeScoreResult.cs`
- Create: `src/GymChall.Domain/Scoring/LakeScoringCalculator.cs`
- Create: `tests/GymChall.Domain.Tests/Scoring/LakeScoringCalculatorTests.cs`

- [ ] **Step 1: Write failing lake tests**

Create `tests/GymChall.Domain.Tests/Scoring/LakeScoringCalculatorTests.cs`:

```csharp
using GymChall.Domain.Scoring;

namespace GymChall.Domain.Tests.Scoring;

public sealed class LakeScoringCalculatorTests
{
    private static readonly Guid Rafa = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid Clari = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    [Fact]
    public void Solo_lake_activity_scores_one_point_when_associated_to_valid_gym()
    {
        var activities = new[]
        {
            new LakeActivityInput(new DateOnly(2026, 6, 16), new[] { Rafa }, IsAssociatedToValidGym: true)
        };

        var result = LakeScoringCalculator.Calculate(activities, Rafa, Clari, ChallengeSettings.Default);

        Assert.Equal(1m, result.Points);
        Assert.Equal(1, result.ScoringActivities);
        Assert.Equal(1, result.TotalValidActivities);
    }

    [Fact]
    public void Couple_lake_activity_scores_three_only_when_both_are_in_same_activity()
    {
        var activities = new[]
        {
            new LakeActivityInput(new DateOnly(2026, 6, 16), new[] { Rafa, Clari }, IsAssociatedToValidGym: true)
        };

        var result = LakeScoringCalculator.Calculate(activities, Rafa, Clari, ChallengeSettings.Default);

        Assert.Equal(3m, result.Points);
    }

    [Fact]
    public void Separate_solo_activities_do_not_score_as_couple_activity()
    {
        var activities = new[]
        {
            new LakeActivityInput(new DateOnly(2026, 6, 16), new[] { Rafa }, IsAssociatedToValidGym: true),
            new LakeActivityInput(new DateOnly(2026, 6, 16), new[] { Clari }, IsAssociatedToValidGym: true)
        };

        var result = LakeScoringCalculator.Calculate(activities, Rafa, Clari, ChallengeSettings.Default);

        Assert.Equal(2m, result.Points);
    }

    [Fact]
    public void Lake_without_valid_gym_scores_zero()
    {
        var activities = new[]
        {
            new LakeActivityInput(new DateOnly(2026, 6, 16), new[] { Rafa, Clari }, IsAssociatedToValidGym: false)
        };

        var result = LakeScoringCalculator.Calculate(activities, Rafa, Clari, ChallengeSettings.Default);

        Assert.Equal(0m, result.Points);
        Assert.Equal(0, result.ScoringActivities);
    }

    [Fact]
    public void Only_first_two_valid_lake_activities_score()
    {
        var activities = new[]
        {
            new LakeActivityInput(new DateOnly(2026, 6, 16), new[] { Rafa, Clari }, IsAssociatedToValidGym: true),
            new LakeActivityInput(new DateOnly(2026, 6, 17), new[] { Rafa }, IsAssociatedToValidGym: true),
            new LakeActivityInput(new DateOnly(2026, 6, 18), new[] { Rafa, Clari }, IsAssociatedToValidGym: true)
        };

        var result = LakeScoringCalculator.Calculate(activities, Rafa, Clari, ChallengeSettings.Default);

        Assert.Equal(4m, result.Points);
        Assert.Equal(2, result.ScoringActivities);
        Assert.Equal(3, result.TotalValidActivities);
    }
}
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```powershell
dotnet test tests/GymChall.Domain.Tests/GymChall.Domain.Tests.csproj --filter LakeScoringCalculatorTests
```

Expected: FAIL because lake scoring types do not exist.

- [ ] **Step 3: Implement lake scoring**

Create `src/GymChall.Domain/Scoring/LakeActivityInput.cs`:

```csharp
namespace GymChall.Domain.Scoring;

public sealed record LakeActivityInput(
    DateOnly ActivityDate,
    IReadOnlyCollection<Guid> ParticipantIds,
    bool IsAssociatedToValidGym);
```

Create `src/GymChall.Domain/Scoring/LakeScoreResult.cs`:

```csharp
namespace GymChall.Domain.Scoring;

public sealed record LakeScoreResult(
    decimal Points,
    int ScoringActivities,
    int TotalValidActivities);
```

Create `src/GymChall.Domain/Scoring/LakeScoringCalculator.cs`:

```csharp
namespace GymChall.Domain.Scoring;

public static class LakeScoringCalculator
{
    public static LakeScoreResult Calculate(
        IEnumerable<LakeActivityInput> activities,
        Guid firstParticipantId,
        Guid secondParticipantId,
        ChallengeSettings settings)
    {
        var validActivities = activities
            .Where(activity => activity.IsAssociatedToValidGym)
            .OrderBy(activity => activity.ActivityDate)
            .ToArray();

        var scoringActivities = validActivities
            .Take(settings.MaxLakeScoringPerCouplePerWeek)
            .ToArray();

        var points = scoringActivities.Sum(activity =>
            IsCoupleActivity(activity, firstParticipantId, secondParticipantId)
                ? settings.LakeCouplePoints
                : settings.LakeSoloPoints);

        return new LakeScoreResult(
            Points: points,
            ScoringActivities: scoringActivities.Length,
            TotalValidActivities: validActivities.Length);
    }

    private static bool IsCoupleActivity(LakeActivityInput activity, Guid firstParticipantId, Guid secondParticipantId)
    {
        return activity.ParticipantIds.Contains(firstParticipantId)
            && activity.ParticipantIds.Contains(secondParticipantId);
    }
}
```

- [ ] **Step 4: Run lake score tests**

Run:

```powershell
dotnet test tests/GymChall.Domain.Tests/GymChall.Domain.Tests.csproj --filter LakeScoringCalculatorTests
```

Expected: PASS.

- [ ] **Step 5: Commit lake scoring**

Run:

```powershell
git add src/GymChall.Domain tests/GymChall.Domain.Tests
git commit -m "feat: add lake scoring rules"
```

Expected: commit succeeds.

## Task 7: Add Minimal API Shell

**Files:**
- Modify: `src/GymChall.Api/Program.cs`

- [ ] **Step 1: Replace template API with a small health endpoint**

Replace `src/GymChall.Api/Program.cs` with:

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();

app.MapGet("/health", () => Results.Ok(new
{
    service = "GymChall.Api",
    status = "ok"
}));

app.Run();
```

- [ ] **Step 2: Build the solution**

Run:

```powershell
dotnet build GymChall.sln
```

Expected: build exits with code `0`.

- [ ] **Step 3: Run all tests**

Run:

```powershell
dotnet test GymChall.sln
```

Expected: all domain tests pass.

- [ ] **Step 4: Commit API shell**

Run:

```powershell
git add src/GymChall.Api
git commit -m "feat: add minimal api shell"
```

Expected: commit succeeds.

## Task 8: Document Developer Commands

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add local development commands**

Append this section to `README.md`:

````markdown
## Desarrollo local

Comandos base:

```powershell
dotnet restore GymChall.sln
dotnet build GymChall.sln
dotnet test GymChall.sln
dotnet run --project src/GymChall.Api/GymChall.Api.csproj
```

Health check:

```text
GET http://localhost:5000/health
```

La UI se disena y construye en una fase posterior. El primer objetivo tecnico es dejar estable el motor de puntajes con tests.
````

- [ ] **Step 2: Run final verification**

Run:

```powershell
dotnet build GymChall.sln
dotnet test GymChall.sln
git status --short
```

Expected:

```text
Build succeeded.
Failed: 0
```

`git status --short` should show only `README.md` modified.

- [ ] **Step 3: Commit documentation update**

Run:

```powershell
git add README.md
git commit -m "docs: add development commands"
```

Expected: commit succeeds.

## Self-Review Checklist

- Spec coverage: this plan covers the approved foundation, scoring rules, bonus daily rule, separate streak flags, weekly partial business days, lake same-activity rule, and minimal API shell.
- Known gap: persistence, auth, admin CRUD, frontend, notifications, badges, and WhatsApp summaries are separate future plans after this foundation is implemented.
- Placeholder scan: no implementation step uses placeholder markers or references undefined code without a creation step.
- Type consistency: all scoring types live under `GymChall.Domain.Scoring`, and test method calls match the classes created in previous tasks.
