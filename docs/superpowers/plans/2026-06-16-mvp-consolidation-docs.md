# MVP Consolidation Docs Implementation Plan

> Estado actual: primera consolidacion ejecutada. Este plan queda como registro historico; el estado vigente se reparte entre `README.md`, `docs/planning/mvp-current-state.md` y `docs/planning/post-mvp-roadmap.md`.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the repository documentation and lightweight contract tests in line with the current Proyecto RM MVP.

**Architecture:** This is a consolidation pass, not a new product feature. The README becomes the quick source of truth, `docs/planning` describes the current domain model, historical UI specs are explicitly marked as superseded, and stale API test payloads stop sending fields the current check-in request no longer accepts.

**Tech Stack:** Markdown docs, ASP.NET Core API tests with xUnit, React/Vite metadata and Vitest smoke tests.

---

### Task 1: README and MVP State

**Files:**
- Modify: `README.md`
- Create: `docs/planning/mvp-current-state.md`

- [ ] **Step 1: Replace README with the current project state**

Write a concise README that documents:

- Dev name `GymChall`.
- Visible app name `Proyecto RM`.
- Challenge name `Reto septiembre 2026`.
- Current UI identity: Doodle Fit / Clean Gym through TypeUI fundamentals, not Sega.
- Current feature set: check-in classification, coins, rankings, admin correction, current limitations.
- Local development and verification commands using the repo-local `.tools` binaries as the preferred option.

- [ ] **Step 2: Add an MVP handoff document**

Create `docs/planning/mvp-current-state.md` with:

- Completed MVP capabilities.
- Product language currently approved.
- Rules implemented for check-ins, coins, scoring, streaks, weekly bonus.
- Known gaps that should become the next functional blocks.

- [ ] **Step 3: Review README against handoff**

Check that the README does not claim Lago, achievements, real auth, evidence, notifications, or prize distribution are implemented.

### Task 2: Planning Docs

**Files:**
- Modify: `docs/planning/domain-rules.md`
- Modify: `docs/planning/scoring-engine.md`
- Modify: `docs/planning/data-model.md`
- Modify: `docs/planning/open-questions.md`
- Modify: `docs/planning/mvp-phases.md`

- [ ] **Step 1: Update product naming and pair naming**

Use `Reto septiembre 2026` for the challenge and `Rafa y Clari` style for displayed pair names while noting backend seed names may still use `+`.

- [ ] **Step 2: Replace visible ficha language with coins**

Describe Health coin, Commit coin, and Flex coin. Mention that legacy code names may still use token/ficha internally.

- [ ] **Step 3: Remove obsolete duration requirements from the active MVP docs**

Make clear that current check-in scoring depends on `occurredAt`, activity date, and optional weekend recovery target, not a duration field.

- [ ] **Step 4: Align streak descriptions**

Document that Health/Commit/Flex coins save the relevant streaks when applied, according to their coverage behavior.

### Task 3: Historical Specs

**Files:**
- Modify: `docs/superpowers/specs/2026-06-16-gymchall-ui-mvp-design.md`
- Modify: `docs/superpowers/specs/2026-06-16-checkin-fichas-ui-rules.md`
- Modify: `docs/superpowers/specs/2026-06-16-gymchall-doodle-fit-visual-refresh.md`

- [ ] **Step 1: Add superseded/current status notes**

Add a top note to each relevant spec:

- Sega UI MVP spec is historical and superseded.
- Check-in/fichas spec is superseded in visible language by Coins, but still useful for rule history.
- Doodle Fit visual refresh remains current.

- [ ] **Step 2: Preserve history**

Do not rewrite old plan files wholesale; keep historical implementation context intact while reducing future confusion.

### Task 4: Contract Cleanup

**Files:**
- Modify: `tests/GymChall.Api.Tests/GymChallApiTests.cs`
- Modify: `web/index.html`

- [ ] **Step 1: Remove obsolete check-in request fields from API tests**

In `GymChallApiTests`, update POST `/api/check-ins` payloads to send only:

```csharp
new
{
    participantId = rafa.Id,
    occurredAt = new DateTimeOffset(2026, 6, 15, 5, 5, 0, TimeSpan.FromHours(-4)),
    createdByParticipantId = rafa.Id,
    notes = "5am"
}
```

- [ ] **Step 2: Update browser title**

Change `web/index.html` title from `GymChall` to `Proyecto RM`.

### Task 5: Verification

**Files:**
- No source edits expected.

- [ ] **Step 1: Run backend tests**

Run:

```powershell
& '.\.tools\dotnet\dotnet.exe' test GymChall.sln --no-restore
```

Expected: all xUnit tests pass. NU1900 warnings are acceptable if they come from blocked NuGet vulnerability index access.

- [ ] **Step 2: Run frontend tests**

Run from `web/`:

```powershell
& '..\.tools\node-v24.16.0-win-x64\node.exe' '.\node_modules\vitest\vitest.mjs' run --pool=threads
```

Expected: all Vitest tests pass.

- [ ] **Step 3: Run frontend build**

Run from `web/`:

```powershell
$env:PATH = (Resolve-Path '..\.tools\node-v24.16.0-win-x64').Path + ';' + $env:PATH
& '..\.tools\node-v24.16.0-win-x64\npm.cmd' run build
```

Expected: Vite build exits 0.

---

## Self-Review

- Spec coverage: covers README, current MVP handoff, planning docs, historical spec markers, stale check-in request payloads, and browser title.
- Placeholder scan: no placeholder work remains in the plan.
- Type consistency: the check-in request fields match `RegisterCheckInRequest` in `web/src/api/types.ts` and the current API service contract.
