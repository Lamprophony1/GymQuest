# Special Coins / Albirroja Coin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add symbolic special coins, starting with Albirroja coin, while preserving existing coin scoring behavior.

**Architecture:** Keep scoring tied to the existing token `type`; add optional special metadata for presentation. Persist and expose `specialCode`/`specialLabel` through DTOs, then let frontend helpers resolve labels/icons/fallbacks.

**Tech Stack:** ASP.NET Core minimal API, EF Core SQLite, xUnit, React, Vite, Vitest.

---

## File Structure

- Modify: `src/GymChall.Application/Challenges/ChallengeDtos.cs`
- Modify: `src/GymChall.Application/Challenges/GymChallService.cs`
- Modify: `src/GymChall.Infrastructure/Persistence/Entities/ExceptionTokenEntity.cs`
- Modify: `src/GymChall.Infrastructure/Persistence/GymChallDbContext.cs`
- Modify: `src/GymChall.Infrastructure/Persistence/GymChallRepository.cs`
- Modify: `src/GymChall.Infrastructure/Persistence/DatabaseSchema.cs`
- Modify: `tests/GymChall.Application.Tests/Challenges/GymChallServiceTests.cs`
- Modify: `tests/GymChall.Application.Tests/Challenges/GymChallServiceAdminTests.cs`
- Modify: `tests/GymChall.Infrastructure.Tests/Persistence/GymChallRepositoryTests.cs`
- Modify: `tests/GymChall.Infrastructure.Tests/Persistence/GymChallRepositoryAdminTests.cs`
- Modify: `web/src/api/types.ts`
- Modify: `web/src/components/format.ts`
- Modify: `web/src/components/QuestIcon.tsx`
- Modify: `web/src/screens/DashboardScreen.tsx`
- Modify: `web/src/screens/CheckInScreen.tsx`
- Modify: `web/src/screens/TokenScreen.tsx`
- Modify: `web/src/components/WeeklyMarkingsCalendar.tsx`
- Add: `web/src/assets/quest-icons/coin-albirroja.png`
- Add/modify frontend tests under `web/src`

## Tasks

- [ ] Write failing backend tests for special token metadata across grant/use/invalidate/snapshot.
- [ ] Add optional `specialCode` and `specialLabel` to DTOs, entity, schema, repository mappings, and requests.
- [ ] Add service defaults for `albirroja`: functional type `Mandatory`, reason `OtherApproved`, label `Albirroja coin`.
- [ ] Verify scoring keeps using functional token type and does not branch on special metadata.
- [ ] Copy the attached Albirroja icon into frontend assets.
- [ ] Write failing frontend tests for special labels, dashboard visibility, and admin request payload.
- [ ] Add frontend helpers for coin labels, tones, icons, and special fallbacks.
- [ ] Update dashboard, check-in, calendar, admin list, and token grant form to render special coins.
- [ ] Update domain/data-model docs.
- [ ] Run backend tests, frontend tests, frontend build, and solution build.
- [ ] Start local API and frontend with PIN login disabled.
