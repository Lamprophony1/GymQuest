# GymChall UI MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the mobile-first GymChall SPA and the minimal backend admin list endpoints needed to operate it.

**Architecture:** Extend the existing .NET layered backend with read-only admin list DTOs and endpoints. Add a separate `web/` React + Vite + TypeScript SPA that consumes the API, stores selected identity in `localStorage`, and uses a TypeUI Sega-inspired Scoreboard Arcade Moderno visual layer.

**Tech Stack:** ASP.NET Core minimal APIs, EF Core SQLite, xUnit, React, Vite, TypeScript, Vitest, React Testing Library, TypeUI `Sega`.

---

## Scope

Included:

- Backend admin list endpoints for recent check-ins and full-coverage tokens.
- Backend tests for repository, service, and API behavior.
- Frontend SPA scaffold in `web/`.
- Frontend API client, state hooks, screens, forms, admin lists, and styling.
- Frontend tests for API client helpers and smoke rendering.
- README update with frontend commands.

Excluded:

- Real authentication.
- Weekend recovery links.
- Move-schedule tokens.
- Lake endpoints and scoring integration.
- Evidence uploads.
- Persisted achievements.
- Prize management.

## File Structure

Backend files:

- Modify `src/GymChall.Application/Challenges/ChallengeDtos.cs`
  - Add `AdminCheckInSummaryDto` and `AdminTokenSummaryDto`.
- Modify `src/GymChall.Application/Abstractions/IGymChallRepository.cs`
  - Add methods to list recent check-ins and tokens.
- Modify `src/GymChall.Application/Challenges/GymChallService.cs`
  - Add service methods for admin list endpoints.
- Modify `src/GymChall.Infrastructure/Persistence/GymChallRepository.cs`
  - Implement EF queries and participant-name joins.
- Modify `src/GymChall.Api/Endpoints/GymChallEndpoints.cs`
  - Map two new admin GET endpoints.
- Modify `tests/GymChall.Infrastructure.Tests/Persistence/GymChallRepositoryAdminTests.cs`
  - Add repository tests.
- Modify `tests/GymChall.Application.Tests/Challenges/GymChallServiceAdminTests.cs`
  - Add service tests and fake repository methods.
- Modify `tests/GymChall.Api.Tests/GymChallApiTests.cs`
  - Add API tests.

Frontend files:

- Create `web/package.json`
- Create `web/index.html`
- Create `web/tsconfig.json`
- Create `web/tsconfig.node.json`
- Create `web/vite.config.ts`
- Create `web/vitest.setup.ts`
- Create `web/src/main.tsx`
- Create `web/src/App.tsx`
- Create `web/src/styles.css`
- Create `web/src/api/client.ts`
- Create `web/src/api/types.ts`
- Create `web/src/state/useGymChallData.ts`
- Create `web/src/state/useSelectedIdentity.ts`
- Create `web/src/components/AppShell.tsx`
- Create `web/src/components/IdentitySelector.tsx`
- Create `web/src/components/ScorePanel.tsx`
- Create `web/src/components/RankingList.tsx`
- Create `web/src/components/StatusPanel.tsx`
- Create `web/src/screens/DashboardScreen.tsx`
- Create `web/src/screens/RankingScreen.tsx`
- Create `web/src/screens/CheckInScreen.tsx`
- Create `web/src/screens/TokenScreen.tsx`
- Create `web/src/screens/AdminScreen.tsx`
- Create `web/src/test/renderSmoke.test.tsx`
- Create `web/src/api/client.test.ts`

Docs:

- Modify `README.md`
  - Add frontend commands and local run notes.

## Task 0: Toolchain Check And TypeUI Setup

**Files:**
- No repo file changes required unless local TypeUI skill folders are generated.

- [ ] **Step 1: Check local toolchain**

Run:

```powershell
dotnet --list-sdks
dotnet --list-runtimes
where.exe node
where.exe npm
where.exe npx
```

Expected:

- `dotnet --list-sdks` must show a .NET 10 SDK.
- `node`, `npm`, and `npx` must resolve before frontend install.

- [ ] **Step 2: If .NET SDK is missing, install or expose .NET 10 SDK**

Use a machine-level install or a project-local SDK already approved by the user. After installation, rerun:

```powershell
dotnet --list-sdks
```

Expected: output includes a `10.0.x` SDK.

- [ ] **Step 3: If Node is missing, install or expose Node LTS**

After installation, rerun:

```powershell
node --version
npm --version
npx --version
```

Expected: each command prints a version.

- [ ] **Step 4: Install TypeUI fundamentals locally**

Run from repo root:

```powershell
npx skills add https://github.com/bergside/typeui --skill typeui-fundamentals
```

Expected: project-local TypeUI fundamentals are installed under `.agents/skills` and/or `.claude/skills`.

- [ ] **Step 5: Install exactly one TypeUI design system**

Use TypeUI MCP `typeui_install_design_system` for slug `sega`, then extract the returned ZIP into:

```text
.agents/skills/typeui-design-system
.claude/skills/typeui-design-system
```

Write the returned `.typeui-design-system.json` metadata in each design-system skill folder.

Expected: exactly one TypeUI design-system skill exists in project scope and its metadata slug is `sega`.

## Task 1: Backend Repository Admin List Queries

**Files:**
- Modify `src/GymChall.Application/Challenges/ChallengeDtos.cs`
- Modify `src/GymChall.Application/Abstractions/IGymChallRepository.cs`
- Modify `src/GymChall.Infrastructure/Persistence/GymChallRepository.cs`
- Test `tests/GymChall.Infrastructure.Tests/Persistence/GymChallRepositoryAdminTests.cs`

- [ ] **Step 1: Write failing repository tests**

Append these tests to `GymChallRepositoryAdminTests`:

```csharp
[Fact]
public async Task Lists_recent_checkins_with_participant_names_status_and_limit()
{
    await using var fixture = await DbFixture.CreateSeededAsync();
    var repository = new GymChallRepository(fixture.Db);
    var firstId = Guid.Parse("40000000-0000-0000-0000-000000000001");
    var secondId = Guid.Parse("40000000-0000-0000-0000-000000000002");

    await repository.AddCheckInAsync(new CheckInCreateDto(
        firstId,
        SeedData.ChallengeId,
        SeedData.RafaId,
        new DateTimeOffset(2026, 6, 15, 5, 5, 0, TimeSpan.FromHours(-4)),
        new DateOnly(2026, 6, 15),
        CheckInTypeDto.GymMorning,
        45,
        SeedData.RafaId,
        "5am"));
    await repository.AddCheckInAsync(new CheckInCreateDto(
        secondId,
        SeedData.ChallengeId,
        SeedData.ClariId,
        new DateTimeOffset(2026, 6, 16, 19, 0, 0, TimeSpan.FromHours(-4)),
        new DateOnly(2026, 6, 16),
        CheckInTypeDto.GymSameDayRecovery,
        45,
        SeedData.ClariId,
        "tarde"));

    var rows = await repository.ListRecentCheckInsAsync(SeedData.ChallengeId, limit: 1);

    var row = Assert.Single(rows);
    Assert.Equal(secondId, row.Id);
    Assert.Equal("Clari", row.ParticipantName);
    Assert.Equal(CheckInTypeDto.GymSameDayRecovery, row.Type);
    Assert.Equal("Valid", row.Status);
    Assert.Equal("tarde", row.Notes);
}

[Fact]
public async Task Lists_recent_tokens_with_participant_names_status_and_limit()
{
    await using var fixture = await DbFixture.CreateSeededAsync();
    var repository = new GymChallRepository(fixture.Db);
    var firstId = Guid.Parse("40000000-0000-0000-0000-000000000003");
    var secondId = Guid.Parse("40000000-0000-0000-0000-000000000004");

    await repository.AddFullCoverageTokenAsync(new FullCoverageTokenCreateDto(
        firstId,
        SeedData.ChallengeId,
        SeedData.RafaId,
        new DateOnly(2026, 6, 15),
        ExceptionReasonCategoryDto.Health,
        SeedData.RafaId,
        "salud"));
    await repository.AddFullCoverageTokenAsync(new FullCoverageTokenCreateDto(
        secondId,
        SeedData.ChallengeId,
        SeedData.ClariId,
        new DateOnly(2026, 6, 16),
        ExceptionReasonCategoryDto.Period,
        SeedData.RafaId,
        "periodo"));

    var rows = await repository.ListRecentFullCoverageTokensAsync(SeedData.ChallengeId, limit: 1);

    var row = Assert.Single(rows);
    Assert.Equal(secondId, row.Id);
    Assert.Equal("Clari", row.ParticipantName);
    Assert.Equal(ExceptionReasonCategoryDto.Period, row.ReasonCategory);
    Assert.Equal("Applied", row.Status);
    Assert.Equal("periodo", row.Notes);
}
```

- [ ] **Step 2: Run repository tests to verify failure**

Run:

```powershell
dotnet test tests/GymChall.Infrastructure.Tests/GymChall.Infrastructure.Tests.csproj --filter GymChallRepositoryAdminTests
```

Expected: FAIL because DTOs and repository methods do not exist.

- [ ] **Step 3: Add admin summary DTOs**

Add to `ChallengeDtos.cs`:

```csharp
public sealed record AdminCheckInSummaryDto(
    Guid Id,
    Guid ParticipantId,
    string ParticipantName,
    DateOnly ActivityDate,
    DateTimeOffset OccurredAt,
    CheckInTypeDto Type,
    string Status,
    int DurationMinutes,
    string? Notes,
    DateTimeOffset CreatedAt);

public sealed record AdminTokenSummaryDto(
    Guid Id,
    Guid ParticipantId,
    string ParticipantName,
    DateOnly TargetDate,
    ExceptionReasonCategoryDto ReasonCategory,
    string Status,
    string? Notes,
    DateTimeOffset CreatedAt);
```

- [ ] **Step 4: Add repository interface methods**

Add to `IGymChallRepository`:

```csharp
Task<IReadOnlyList<AdminCheckInSummaryDto>> ListRecentCheckInsAsync(Guid challengeId, int limit, CancellationToken cancellationToken = default);
Task<IReadOnlyList<AdminTokenSummaryDto>> ListRecentFullCoverageTokensAsync(Guid challengeId, int limit, CancellationToken cancellationToken = default);
```

- [ ] **Step 5: Implement EF repository methods**

Add to `GymChallRepository`:

```csharp
public async Task<IReadOnlyList<AdminCheckInSummaryDto>> ListRecentCheckInsAsync(Guid challengeId, int limit, CancellationToken cancellationToken = default)
{
    var cappedLimit = Math.Clamp(limit, 1, 100);

    return await db.CheckIns
        .Where(x => x.ChallengeId == challengeId)
        .Join(
            db.Participants,
            checkIn => checkIn.ParticipantId,
            participant => participant.Id,
            (checkIn, participant) => new { CheckIn = checkIn, Participant = participant })
        .OrderByDescending(x => x.CheckIn.CreatedAt)
        .Take(cappedLimit)
        .Select(x => new AdminCheckInSummaryDto(
            x.CheckIn.Id,
            x.CheckIn.ParticipantId,
            x.Participant.DisplayName,
            x.CheckIn.ActivityDate,
            x.CheckIn.OccurredAt,
            x.CheckIn.Type == CheckInType.GymMorning ? CheckInTypeDto.GymMorning : CheckInTypeDto.GymSameDayRecovery,
            x.CheckIn.Status.ToString(),
            x.CheckIn.DurationMinutes,
            x.CheckIn.Notes,
            x.CheckIn.CreatedAt))
        .ToArrayAsync(cancellationToken);
}

public async Task<IReadOnlyList<AdminTokenSummaryDto>> ListRecentFullCoverageTokensAsync(Guid challengeId, int limit, CancellationToken cancellationToken = default)
{
    var cappedLimit = Math.Clamp(limit, 1, 100);

    return await db.ExceptionTokens
        .Where(x => x.ChallengeId == challengeId && x.Type == ExceptionTokenType.FullCoverage)
        .Join(
            db.Participants,
            token => token.ParticipantId,
            participant => participant.Id,
            (token, participant) => new { Token = token, Participant = participant })
        .OrderByDescending(x => x.Token.CreatedAt)
        .Take(cappedLimit)
        .Select(x => new AdminTokenSummaryDto(
            x.Token.Id,
            x.Token.ParticipantId,
            x.Participant.DisplayName,
            x.Token.TargetDate,
            (ExceptionReasonCategoryDto)x.Token.ReasonCategory,
            x.Token.Status.ToString(),
            x.Token.Notes,
            x.Token.CreatedAt))
        .ToArrayAsync(cancellationToken);
}
```

- [ ] **Step 6: Run repository tests**

Run:

```powershell
dotnet test tests/GymChall.Infrastructure.Tests/GymChall.Infrastructure.Tests.csproj --filter GymChallRepositoryAdminTests
```

Expected: PASS.

- [ ] **Step 7: Commit backend repository work**

Run:

```powershell
git add src/GymChall.Application src/GymChall.Infrastructure tests/GymChall.Infrastructure.Tests
git commit -m "feat: add admin recent record queries"
```

## Task 2: Backend Service And API Endpoints

**Files:**
- Modify `src/GymChall.Application/Challenges/GymChallService.cs`
- Modify `tests/GymChall.Application.Tests/Challenges/GymChallServiceAdminTests.cs`
- Modify `src/GymChall.Api/Endpoints/GymChallEndpoints.cs`
- Modify `tests/GymChall.Api.Tests/GymChallApiTests.cs`

- [ ] **Step 1: Write failing service test**

Append to `GymChallServiceAdminTests`:

```csharp
[Fact]
public async Task Admin_recent_lists_use_active_challenge_and_cap_limit()
{
    var challengeId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    var repository = new FakeRepository(challengeId);
    var service = new GymChallService(repository);

    await service.ListRecentCheckInsAsync(500);
    await service.ListRecentFullCoverageTokensAsync(0);

    Assert.Equal(challengeId, repository.LastCheckInListChallengeId);
    Assert.Equal(100, repository.LastCheckInListLimit);
    Assert.Equal(challengeId, repository.LastTokenListChallengeId);
    Assert.Equal(50, repository.LastTokenListLimit);
}
```

Update the fake repository with:

```csharp
public Guid? LastCheckInListChallengeId { get; private set; }
public int? LastCheckInListLimit { get; private set; }
public Guid? LastTokenListChallengeId { get; private set; }
public int? LastTokenListLimit { get; private set; }

public Task<IReadOnlyList<AdminCheckInSummaryDto>> ListRecentCheckInsAsync(Guid challengeId, int limit, CancellationToken cancellationToken = default)
{
    LastCheckInListChallengeId = challengeId;
    LastCheckInListLimit = limit;
    return Task.FromResult<IReadOnlyList<AdminCheckInSummaryDto>>(Array.Empty<AdminCheckInSummaryDto>());
}

public Task<IReadOnlyList<AdminTokenSummaryDto>> ListRecentFullCoverageTokensAsync(Guid challengeId, int limit, CancellationToken cancellationToken = default)
{
    LastTokenListChallengeId = challengeId;
    LastTokenListLimit = limit;
    return Task.FromResult<IReadOnlyList<AdminTokenSummaryDto>>(Array.Empty<AdminTokenSummaryDto>());
}
```

- [ ] **Step 2: Run service test to verify failure**

Run:

```powershell
dotnet test tests/GymChall.Application.Tests/GymChall.Application.Tests.csproj --filter GymChallServiceAdminTests
```

Expected: FAIL because service methods do not exist.

- [ ] **Step 3: Implement service methods**

Add to `GymChallService`:

```csharp
public async Task<IReadOnlyList<AdminCheckInSummaryDto>> ListRecentCheckInsAsync(int? limit, CancellationToken cancellationToken = default)
{
    var challengeId = await RequireActiveChallengeId(cancellationToken);
    return await repository.ListRecentCheckInsAsync(challengeId, NormalizeAdminListLimit(limit), cancellationToken);
}

public async Task<IReadOnlyList<AdminTokenSummaryDto>> ListRecentFullCoverageTokensAsync(int? limit, CancellationToken cancellationToken = default)
{
    var challengeId = await RequireActiveChallengeId(cancellationToken);
    return await repository.ListRecentFullCoverageTokensAsync(challengeId, NormalizeAdminListLimit(limit), cancellationToken);
}

private static int NormalizeAdminListLimit(int? limit)
{
    return Math.Clamp(limit ?? 50, 1, 100);
}
```

- [ ] **Step 4: Run service tests**

Run:

```powershell
dotnet test tests/GymChall.Application.Tests/GymChall.Application.Tests.csproj --filter GymChallServiceAdminTests
```

Expected: PASS.

- [ ] **Step 5: Write failing API tests**

Append to `GymChallApiTests`:

```csharp
[Fact]
public async Task Admin_recent_checkins_endpoint_returns_recent_rows()
{
    await using var app = CreateApp();
    using var client = app.CreateClient();
    var participants = await client.GetFromJsonAsync<List<ParticipantRow>>("/api/participants");
    Assert.NotNull(participants);
    var rafa = Assert.Single(participants, x => x.Username == "rafa");

    await client.PostAsJsonAsync("/api/check-ins", new
    {
        participantId = rafa.Id,
        occurredAt = new DateTimeOffset(2026, 6, 15, 5, 5, 0, TimeSpan.FromHours(-4)),
        type = 0,
        durationMinutes = 45,
        createdByParticipantId = rafa.Id,
        notes = "5am"
    });

    var rows = await client.GetFromJsonAsync<List<AdminCheckInRow>>("/api/admin/check-ins?limit=10");

    Assert.NotNull(rows);
    var row = Assert.Single(rows);
    Assert.Equal("Rafa", row.ParticipantName);
    Assert.Equal("Valid", row.Status);
}

[Fact]
public async Task Admin_recent_tokens_endpoint_returns_recent_rows()
{
    await using var app = CreateApp();
    using var client = app.CreateClient();
    var participants = await client.GetFromJsonAsync<List<ParticipantRow>>("/api/participants");
    Assert.NotNull(participants);
    var rafa = Assert.Single(participants, x => x.Username == "rafa");

    await client.PostAsJsonAsync("/api/tokens/full-coverage", new
    {
        participantId = rafa.Id,
        targetDate = new DateOnly(2026, 6, 16),
        reasonCategory = 0,
        assignedByAdminId = rafa.Id,
        notes = "salud"
    });

    var rows = await client.GetFromJsonAsync<List<AdminTokenRow>>("/api/admin/tokens?limit=10");

    Assert.NotNull(rows);
    var row = Assert.Single(rows);
    Assert.Equal("Rafa", row.ParticipantName);
    Assert.Equal("Applied", row.Status);
}
```

Add local record types inside `GymChallApiTests`:

```csharp
private sealed record AdminCheckInRow(Guid Id, Guid ParticipantId, string ParticipantName, DateOnly ActivityDate, string Status);
private sealed record AdminTokenRow(Guid Id, Guid ParticipantId, string ParticipantName, DateOnly TargetDate, string Status);
```

- [ ] **Step 6: Run API tests to verify failure**

Run:

```powershell
dotnet test tests/GymChall.Api.Tests/GymChall.Api.Tests.csproj --filter GymChallApiTests
```

Expected: FAIL because endpoints do not exist.

- [ ] **Step 7: Implement API endpoints**

Add to `GymChallEndpoints.MapGymChallEndpoints` before the ranking endpoints:

```csharp
app.MapGet("/api/admin/check-ins", async (int? limit, GymChallService service, CancellationToken cancellationToken) =>
{
    return Results.Ok(await service.ListRecentCheckInsAsync(limit, cancellationToken));
});

app.MapGet("/api/admin/tokens", async (int? limit, GymChallService service, CancellationToken cancellationToken) =>
{
    return Results.Ok(await service.ListRecentFullCoverageTokensAsync(limit, cancellationToken));
});
```

- [ ] **Step 8: Run API tests**

Run:

```powershell
dotnet test tests/GymChall.Api.Tests/GymChall.Api.Tests.csproj --filter GymChallApiTests
```

Expected: PASS.

- [ ] **Step 9: Commit service and API work**

Run:

```powershell
git add src/GymChall.Application src/GymChall.Api tests/GymChall.Application.Tests tests/GymChall.Api.Tests
git commit -m "feat: expose admin recent record endpoints"
```

## Task 3: Frontend Scaffold

**Files:**
- Create all `web/` scaffold files listed in File Structure.

- [ ] **Step 1: Create frontend package metadata**

Create `web/package.json`:

```json
{
  "scripts": {
    "dev": "vite --host 127.0.0.1 --port 5173",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "preview": "vite preview --host 127.0.0.1 --port 4173"
  },
  "dependencies": {
    "@vitejs/plugin-react": "latest",
    "vite": "latest",
    "typescript": "latest",
    "react": "latest",
    "react-dom": "latest",
    "lucide-react": "latest"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "latest",
    "@testing-library/react": "latest",
    "@testing-library/user-event": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "jsdom": "latest",
    "vitest": "latest"
  }
}
```

- [ ] **Step 2: Create Vite and TypeScript config**

Create `web/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Create `web/tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

Create `web/vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5020',
      '/health': 'http://localhost:5020'
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    globals: true
  }
});
```

Create `web/vitest.setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 3: Create initial HTML and app mount**

Create `web/index.html`:

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>GymChall</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `web/src/main.tsx`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 4: Create minimal App and smoke test**

Create `web/src/App.tsx`:

```tsx
export function App() {
  return <main>GymChall</main>;
}
```

Create `web/src/test/renderSmoke.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { App } from '../App';

test('renders GymChall shell', () => {
  render(<App />);
  expect(screen.getByText('GymChall')).toBeInTheDocument();
});
```

- [ ] **Step 5: Install frontend dependencies**

Run:

```powershell
Set-Location web
npm install
```

Expected: `package-lock.json` is created and dependencies install successfully.

- [ ] **Step 6: Run frontend smoke test**

Run:

```powershell
Set-Location web
npm test
```

Expected: PASS.

- [ ] **Step 7: Commit scaffold**

Run:

```powershell
git add web
git commit -m "feat: scaffold gymchall web app"
```

## Task 4: Frontend API Client And State

**Files:**
- Create `web/src/api/types.ts`
- Create `web/src/api/client.ts`
- Create `web/src/api/client.test.ts`
- Create `web/src/state/useSelectedIdentity.ts`
- Create `web/src/state/useGymChallData.ts`

- [ ] **Step 1: Add API types**

Create `web/src/api/types.ts` with interfaces for challenge, participants, couples, rankings, admin records, and create requests.

- [ ] **Step 2: Add API client**

Create `web/src/api/client.ts` with:

```ts
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers
    },
    ...init
  });

  if (!response.ok) {
    throw new Error(`API ${response.status}: ${response.statusText}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
```

Export typed functions for every endpoint used by the UI.

- [ ] **Step 3: Add API client tests**

Create `web/src/api/client.test.ts` covering:

- success JSON response
- 204 response
- non-OK response throws
- `throughDate` is formatted as `YYYY-MM-DD`

- [ ] **Step 4: Add identity hook**

Create `useSelectedIdentity.ts` to load/save selected identity in `localStorage` under key `gymchall.identity.v1`.

- [ ] **Step 5: Add data hook**

Create `useGymChallData.ts` to load challenge, participants, couples, rankings, weekly rankings, and admin recent records on demand.

- [ ] **Step 6: Run frontend tests**

Run:

```powershell
Set-Location web
npm test
```

Expected: PASS.

- [ ] **Step 7: Commit API and state**

Run:

```powershell
git add web/src/api web/src/state
git commit -m "feat: add gymchall web api client"
```

## Task 5: Frontend Screens And Components

**Files:**
- Modify `web/src/App.tsx`
- Create component and screen files listed in File Structure.
- Modify `web/src/test/renderSmoke.test.tsx`

- [ ] **Step 1: Build shell and selector**

Implement:

- `IdentitySelector`
- `AppShell`
- bottom mobile nav tabs: dashboard, ranking, check-in, ficha, admin

- [ ] **Step 2: Build dashboard and ranking components**

Implement:

- `ScorePanel`
- `RankingList`
- `StatusPanel`
- `DashboardScreen`
- `RankingScreen`

- [ ] **Step 3: Build participant forms**

Implement:

- `CheckInScreen`
- `TokenScreen`

Both screens must submit through API client, show success/error, and refresh data.

- [ ] **Step 4: Build admin screen**

Implement `AdminScreen` with:

- participant list and create form
- couple list and create form
- recent check-ins list and invalidate action
- recent tokens list and invalidate action

- [ ] **Step 5: Replace smoke test with app behavior smoke tests**

Update `renderSmoke.test.tsx` to verify:

- selector renders when no identity exists
- dashboard shell can render with mocked data
- admin screen can render recent record sections

- [ ] **Step 6: Run frontend tests**

Run:

```powershell
Set-Location web
npm test
```

Expected: PASS.

- [ ] **Step 7: Commit screens**

Run:

```powershell
git add web/src
git commit -m "feat: build gymchall mobile ui screens"
```

## Task 6: Scoreboard Arcade Styling

**Files:**
- Modify `web/src/styles.css`
- Modify frontend components only if class names need refinement.

- [ ] **Step 1: Add design tokens**

Add CSS variables for:

- background
- panel surfaces
- text colors
- score yellow
- success green
- warning red
- info cyan
- shadow offset values

- [ ] **Step 2: Add layout styles**

Style:

- full app shell
- mobile bottom nav
- desktop responsive layout
- form spacing
- admin list spacing

- [ ] **Step 3: Add arcade component styles**

Style:

- score panels
- ranking rows
- badges
- power-up token buttons
- warning states
- chunky buttons

Keep forms and admin quieter than dashboard/ranking.

- [ ] **Step 4: Run frontend build**

Run:

```powershell
Set-Location web
npm run build
```

Expected: build succeeds.

- [ ] **Step 5: Commit styling**

Run:

```powershell
git add web/src
git commit -m "style: apply arcade scoreboard ui"
```

## Task 7: README And Full Verification

**Files:**
- Modify `README.md`

- [ ] **Step 1: Update README**

Add:

```markdown
## Frontend local

```powershell
cd web
npm install
npm run dev
```

Frontend: `http://127.0.0.1:5173`
Backend API: `http://localhost:5020`

Run both apps in separate terminals:

```powershell
dotnet run --project src/GymChall.Api/GymChall.Api.csproj --urls http://localhost:5020
cd web
npm run dev
```
```

- [ ] **Step 2: Run backend verification**

Run:

```powershell
dotnet build GymChall.sln
dotnet test GymChall.sln
```

Expected: build succeeds and all tests pass.

- [ ] **Step 3: Run frontend verification**

Run:

```powershell
Set-Location web
npm test
npm run build
```

Expected: tests and build pass.

- [ ] **Step 4: Start backend**

Run:

```powershell
dotnet run --project src/GymChall.Api/GymChall.Api.csproj --urls http://localhost:5020
```

Expected: API listens on `http://localhost:5020`.

- [ ] **Step 5: Start frontend**

Run in a second process:

```powershell
Set-Location web
npm run dev
```

Expected: Vite listens on `http://127.0.0.1:5173`.

- [ ] **Step 6: Manual smoke checks**

Open `http://127.0.0.1:5173` and verify:

- selector loads seeded participants
- dashboard renders ranking
- check-in form posts successfully
- token form posts successfully
- admin recent lists show new records
- invalidation removes a record from ranking after refresh
- mobile width remains readable

- [ ] **Step 7: Commit README and final fixes**

Run:

```powershell
git add README.md web src tests
git commit -m "docs: document gymchall web app"
```

## Self-Review Checklist

- Spec coverage: backend admin lists, SPA, selector, dashboard, rankings, check-in form, token form, admin create/list/invalidate, TypeUI Sega visual style, mobile accessibility, and tests are covered.
- Red-flag scan: no task uses incomplete-marker language as implementation instructions.
- Type consistency: DTO names are `AdminCheckInSummaryDto` and `AdminTokenSummaryDto`; repository/service methods use `ListRecentCheckInsAsync` and `ListRecentFullCoverageTokensAsync`; API paths are `/api/admin/check-ins` and `/api/admin/tokens`.
- Scope check: this plan is one cohesive MVP UI slice plus the minimal backend support required by that UI.
