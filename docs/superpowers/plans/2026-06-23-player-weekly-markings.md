# Player Weekly Markings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a player-visible weekly markings calendar matching the admin calendar in readonly mode, including applied coins.

**Architecture:** Add a readonly backend weekly calendar endpoint that returns unified check-in and coin events. Refactor the existing admin calendar rendering into a shared frontend component, then add a `Marcaciones` tab for players and admins.

**Tech Stack:** .NET 10 minimal API, EF Core repository, React/Vite/TypeScript, React Testing Library, Vitest, xUnit/VSTest.

---

### Task 1: Backend Weekly Calendar Events

**Files:**
- Modify: `src/GymChall.Application/Challenges/ChallengeDtos.cs`
- Modify: `src/GymChall.Application/Abstractions/IGymChallRepository.cs`
- Modify: `src/GymChall.Infrastructure/Persistence/GymChallRepository.cs`
- Modify: `src/GymChall.Application/Challenges/GymChallService.cs`
- Modify: `src/GymChall.Api/Endpoints/GymChallEndpoints.cs`
- Test: `tests/GymChall.Infrastructure.Tests/Persistence/GymChallRepositoryAdminTests.cs`
- Test: `tests/GymChall.Api.Tests/GymChallApiTests.cs`

- [x] Write a failing repository/API test proving weekly calendar events include valid check-ins and applied coins.
- [x] Add `WeeklyCalendarEventKindDto` and `WeeklyCalendarEventDto`.
- [x] Add repository method `ListWeeklyCalendarEventsAsync`.
- [x] Add service method `ListWeeklyCalendarEventsAsync`.
- [x] Add `GET /api/calendar/weekly`.
- [x] Verify backend tests pass.

### Task 2: Frontend API Types

**Files:**
- Modify: `web/src/api/types.ts`
- Modify: `web/src/api/client.ts`
- Test: `web/src/api/client.test.ts`

- [x] Write a failing client test for `GET /api/calendar/weekly?from=...&to=...`.
- [x] Add `WeeklyCalendarEvent` and event kind/status types.
- [x] Add `gymChallApi.listWeeklyCalendarEvents`.
- [x] Verify client tests pass.

### Task 3: Shared Calendar Component

**Files:**
- Create: `web/src/components/WeeklyMarkingsCalendar.tsx`
- Modify: `web/src/screens/AdminScreen.tsx`
- Test: `web/src/test/renderSmoke.test.tsx`

- [x] Write failing render tests for readonly player calendar and admin coin chips.
- [x] Move the existing admin calendar table, toolbar, filters, and cell rendering into `WeeklyMarkingsCalendar`.
- [x] Support `readonly` and optional `onInvalidateCheckIn`.
- [x] Add type filter option `Coins`.
- [x] Verify admin calendar still shows invalidation buttons for valid check-ins only.

### Task 4: Player Tab and Data Flow

**Files:**
- Modify: `web/src/components/AppShell.tsx`
- Modify: `web/src/App.tsx`
- Modify: `web/src/state/useGymChallData.ts`
- Create: `web/src/screens/MarkingsScreen.tsx`
- Test: `web/src/test/renderSmoke.test.tsx`

- [x] Write a failing render test that the player nav contains `Marcaciones`.
- [x] Fetch weekly calendar events for all authenticated users.
- [x] Render `MarkingsScreen` through the new tab.
- [x] Ensure player view passes `readonly` and only valid events.
- [x] Verify frontend tests pass.

### Task 5: Final Verification and Local Dev

**Files:**
- No code changes expected.

- [x] Run `npm test`.
- [x] Run `npm run build`.
- [x] Run backend tests with VSTest DLLs or `dotnet test --no-restore` where available.
- [x] Launch backend local dev server.
- [x] Launch frontend no-login dev server.
- [x] Verify `http://127.0.0.1:5174/` serves the app and `/api/calendar/weekly` returns events.

### Task 6: Admin Coin Reversal From Weekly Calendar

**Files:**
- Modify: `src/GymChall.Infrastructure/Persistence/GymChallRepository.cs`
- Modify: `web/src/components/WeeklyMarkingsCalendar.tsx`
- Modify: `web/src/screens/AdminScreen.tsx`
- Test: `tests/GymChall.Infrastructure.Tests/Persistence/GymChallRepositoryAdminTests.cs`
- Test: `tests/GymChall.Api.Tests/GymChallApiTests.cs`
- Test: `web/src/test/renderSmoke.test.tsx`

- [x] Write failing backend tests proving an applied coin invalidation returns it to `Available` and removes it from weekly calendar events.
- [x] Write failing API test proving `/api/admin/tokens/{id}/invalidate` returns an applied coin to the player.
- [x] Write failing render test proving admin calendar shows an invalidation action for applied coins.
- [x] Update token invalidation so `Applied` becomes `Available`, while already available tokens can still become `Rejected`.
- [x] Wire admin calendar coin action to the existing token invalidation endpoint.
- [x] Verify player readonly calendar still renders no invalidation actions.
