# GymChall Phase 1 Backend Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish Phase 1 backend by adding weekly motivation rankings, admin list/create endpoints, and audited invalidation for trusted-by-default records.

**Architecture:** Keep ranking calculations in `GymChall.Application` using existing domain calculators. Extend `IGymChallRepository` with small persistence operations and keep EF-specific audit/status changes in `GymChall.Infrastructure`. Expose UI-friendly minimal API endpoints from `GymChall.Api`.

**Tech Stack:** ASP.NET Core minimal APIs, EF Core SQLite, xUnit, existing `GymChall.Domain.Scoring` calculators.

---

## Scope

Included:

- Weekly ranking service and DTOs.
- Endpoints for all weeks and one specific week.
- Participant and couple list/create endpoints.
- Challenge settings endpoint.
- Check-in and full-coverage token invalidation with audit log.
- Tests for application, infrastructure, and API behavior.

Excluded:

- Authentication.
- Complex correction/edit flows.
- Weekend recovery links.
- Move-schedule tokens.
- Lake scoring endpoints.
- Evidence and prize management.

## Task 1: Weekly Ranking Projection

**Files:**
- Modify: `src/GymChall.Application/Scoring/RankingService.cs`
- Test: `tests/GymChall.Application.Tests/Scoring/WeeklyRankingServiceTests.cs`

- [ ] **Step 1: Write failing weekly ranking tests**

Create `WeeklyRankingServiceTests` covering:
- `CalculateWeeklyRankings` returns all Monday-starting weeks through a date.
- Full-coverage token preserves perfect weekly bonus.
- Same-day recovery gives complete weekly bonus.

Run:

```powershell
dotnet test tests/GymChall.Application.Tests/GymChall.Application.Tests.csproj --filter WeeklyRankingServiceTests
```

Expected: FAIL because weekly ranking types/methods do not exist.

- [ ] **Step 2: Implement weekly ranking**

Add records:
- `WeeklyRankingDto(DateOnly WeekStartDate, DateOnly WeekEndDate, IReadOnlyList<WeeklyRankingRowDto> Rows)`
- `WeeklyRankingRowDto(Guid CoupleId, string CoupleName, decimal IndividualPoints, decimal WeeklyBonusPoints, decimal TotalPoints, string WeeklyBonusType, int RequiredBusinessDays)`

Add methods:
- `CalculateWeeklyRankings(ChallengeSnapshotDto snapshot, DateOnly throughDate)`
- `CalculateWeeklyRanking(ChallengeSnapshotDto snapshot, DateOnly weekStartDate, DateOnly throughDate)`

Use `WeeklyScoreCalculator.Calculate` with business days inside the challenge window.

- [ ] **Step 3: Verify and commit**

Run:

```powershell
dotnet test tests/GymChall.Application.Tests/GymChall.Application.Tests.csproj --filter WeeklyRankingServiceTests
git add src/GymChall.Application tests/GymChall.Application.Tests
git commit -m "feat: add weekly ranking projection"
```

Expected: tests pass and commit succeeds.

## Task 2: Admin Repository Operations And Invalidation

**Files:**
- Modify: `src/GymChall.Application/Abstractions/IGymChallRepository.cs`
- Modify: `src/GymChall.Application/Challenges/ChallengeDtos.cs`
- Modify: `src/GymChall.Application/Challenges/GymChallService.cs`
- Modify: `src/GymChall.Infrastructure/Persistence/GymChallRepository.cs`
- Test: `tests/GymChall.Infrastructure.Tests/Persistence/GymChallRepositoryAdminTests.cs`
- Test: `tests/GymChall.Application.Tests/Challenges/GymChallServiceAdminTests.cs`

- [ ] **Step 1: Write failing repository admin tests**

Create tests covering:
- List participants returns active participants.
- Add participant rejects duplicate username.
- Add couple rejects same participant twice and stores memberships using challenge start date.
- Invalidate check-in changes status to `Rejected` and writes audit log.
- Invalidate token changes status to `Rejected` and writes audit log.

Run:

```powershell
dotnet test tests/GymChall.Infrastructure.Tests/GymChall.Infrastructure.Tests.csproj --filter GymChallRepositoryAdminTests
```

Expected: FAIL because repository methods do not exist.

- [ ] **Step 2: Add application DTOs and repository methods**

Add DTOs:
- `ParticipantSummaryDto`
- `CoupleSummaryDto`
- `ChallengeSettingsDto`
- `CreateParticipantRequest`
- `CreateCoupleRequest`
- `InvalidateRecordRequest`

Add repository methods:
- `ListParticipantsAsync`
- `ListCouplesAsync`
- `GetSettingsAsync`
- `InvalidateCheckInAsync`
- `InvalidateFullCoverageTokenAsync`

- [ ] **Step 3: Implement service orchestration**

Add service methods:
- `ListParticipantsAsync`
- `CreateParticipantAsync`
- `ListCouplesAsync`
- `CreateCoupleAsync`
- `GetSettingsAsync`
- `InvalidateCheckInAsync`
- `InvalidateFullCoverageTokenAsync`
- `GetWeeklyRankingsAsync`
- `GetWeeklyRankingAsync`

- [ ] **Step 4: Verify and commit**

Run:

```powershell
dotnet test tests/GymChall.Infrastructure.Tests/GymChall.Infrastructure.Tests.csproj --filter GymChallRepositoryAdminTests
dotnet test tests/GymChall.Application.Tests/GymChall.Application.Tests.csproj --filter GymChallServiceAdminTests
git add src/GymChall.Application src/GymChall.Infrastructure tests/GymChall.Application.Tests tests/GymChall.Infrastructure.Tests
git commit -m "feat: add admin repository operations"
```

Expected: tests pass and commit succeeds.

## Task 3: API Endpoints And Documentation

**Files:**
- Modify: `src/GymChall.Api/Endpoints/GymChallEndpoints.cs`
- Modify: `tests/GymChall.Api.Tests/GymChallApiTests.cs`
- Modify: `README.md`

- [ ] **Step 1: Write failing API tests**

Add API tests covering:
- `GET /api/participants`
- `POST /api/participants`
- `GET /api/couples`
- `POST /api/couples`
- `GET /api/challenge/settings`
- `GET /api/rankings/weeks`
- `GET /api/rankings/weeks/{weekStartDate}`
- `POST /api/admin/check-ins/{id}/invalidate`

Run:

```powershell
dotnet test tests/GymChall.Api.Tests/GymChall.Api.Tests.csproj --filter GymChallApiTests
```

Expected: FAIL because new endpoints do not exist.

- [ ] **Step 2: Implement endpoints**

Map endpoints in `GymChallEndpoints` and delegate to `GymChallService`. Return `201 Created` for create endpoints and `204 NoContent` for invalidation endpoints.

- [ ] **Step 3: Update README and verify**

Run:

```powershell
dotnet build GymChall.sln
dotnet test GymChall.sln
git status --short
```

Expected: build succeeds, all tests pass, and only intended files are modified.

- [ ] **Step 4: Commit**

Run:

```powershell
git add src/GymChall.Api tests/GymChall.Api.Tests README.md
git commit -m "feat: complete phase 1 backend endpoints"
```

Expected: commit succeeds.

## Self-Review Checklist

- Spec coverage: weekly rankings, admin list/create, settings, audited invalidation, and UI-friendly DTOs are covered.
- Placeholder scan: no placeholder terms are used as implementation instructions.
- Type consistency: DTO, service, repository, and endpoint names are aligned across tasks.
