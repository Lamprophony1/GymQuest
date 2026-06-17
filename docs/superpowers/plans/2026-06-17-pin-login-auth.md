# PIN Login Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add production-ready participant PIN login while preserving the current fast identity selector for development.

**Architecture:** Add a small auth layer beside the current challenge service: auth credentials are stored in SQLite, PINs are hashed, cookie auth identifies the current participant, and endpoint handlers validate/override actor IDs from the authenticated user when `Auth:Mode=PinLogin`. The React app chooses between `dev-selector` and `pin-login`, showing a custom PIN keypad in production and a profile menu that lets admin users switch between participant and admin mode after login.

**Tech Stack:** ASP.NET Core minimal APIs, cookie authentication, EF Core SQLite, xUnit, React/Vite/TypeScript, Vitest, React Testing Library.

---

### Task 1: Backend Auth Domain and Persistence

**Files:**
- Create: `src/GymChall.Application/Auth/PinHasher.cs`
- Create: `src/GymChall.Application/Auth/PinAuthService.cs`
- Create: `src/GymChall.Application/Auth/AuthDtos.cs`
- Create: `src/GymChall.Infrastructure/Persistence/Entities/AuthCredentialEntity.cs`
- Modify: `src/GymChall.Application/Abstractions/IGymChallRepository.cs`
- Modify: `src/GymChall.Infrastructure/Persistence/GymChallDbContext.cs`
- Modify: `src/GymChall.Infrastructure/Persistence/GymChallRepository.cs`
- Modify: `src/GymChall.Infrastructure/Persistence/SeedData.cs`
- Test: `tests/GymChall.Application.Tests/Auth/PinAuthServiceTests.cs`
- Test: `tests/GymChall.Infrastructure.Tests/Persistence/GymChallDbContextTests.cs`

- [x] **Step 1: Write failing application tests**

Cover successful login, invalid PIN, hashed PIN persistence DTOs, admin reset permission, and lockout after repeated failures.

- [x] **Step 2: Implement PIN hashing and auth service**

Use PBKDF2 with per-PIN salt. Validate PIN as numeric and 4-6 digits. Record failed attempts and one-minute lockout after five failures.

- [x] **Step 3: Implement auth credential persistence**

Add `AuthCredentials` table and repository methods for getting/upserting/updating credentials. Add a schema helper using `CREATE TABLE IF NOT EXISTS` so existing SQLite databases gain the table without EF migrations.

- [x] **Step 4: Verify application and infrastructure tests**

Run targeted xUnit filters for auth and persistence.

### Task 2: Backend HTTP Auth and Endpoint Protection

**Files:**
- Create: `src/GymChall.Api/Auth/AuthSettings.cs`
- Create: `src/GymChall.Api/Endpoints/AuthEndpoints.cs`
- Create: `src/GymChall.Api/Endpoints/EndpointAuthExtensions.cs`
- Modify: `src/GymChall.Api/Program.cs`
- Modify: `src/GymChall.Api/Endpoints/GymChallEndpoints.cs`
- Test: `tests/GymChall.Api.Tests/GymChallApiTests.cs`

- [x] **Step 1: Write failing API tests in `PinLogin` mode**

Cover public login options, unauthorized protected endpoint, successful login cookie, admin endpoint rejected for non-admin, and admin PIN reset.

- [x] **Step 2: Configure cookie auth**

Add cookie auth, authorization policies, `Auth:Mode`, `Auth:BootstrapAdminPin`, and secure-cookie settings.

- [x] **Step 3: Add auth endpoints**

Implement login options, login, me, logout, and admin reset PIN.

- [x] **Step 4: Protect current endpoints conditionally**

When `PinLogin` is active, require auth for app endpoints and admin role for admin endpoints. Override or validate actor IDs from the authenticated participant.

- [x] **Step 5: Verify API tests**

Run `GymChall.Api.Tests`.

### Task 3: Frontend Auth State, Login Screen, and Mode Switch

**Files:**
- Create: `web/src/auth/authMode.ts`
- Create: `web/src/auth/useAuthSession.ts`
- Create: `web/src/screens/LoginScreen.tsx`
- Modify: `web/src/api/types.ts`
- Modify: `web/src/api/client.ts`
- Modify: `web/src/App.tsx`
- Modify: `web/src/components/AppShell.tsx`
- Modify: `web/src/state/useGymChallData.ts`
- Modify: `web/src/state/useSelectedIdentity.ts`
- Modify: `web/src/styles.css`
- Test: `web/src/test/renderSmoke.test.tsx`
- Test: `web/src/api/client.test.ts`

- [x] **Step 1: Write failing frontend tests**

Cover API credentials, PIN keypad input/delete/submit, login success, dev selector visibility, admin mode switch from profile menu, and logout returning to login.

- [x] **Step 2: Implement auth API client and session hook**

Add login options/login/me/logout calls with `credentials: 'include'`.

- [x] **Step 3: Implement `LoginScreen`**

Build participant select, stable custom keypad, keyboard support, PIN dots, submit/error/loading states.

- [x] **Step 4: Update app flow**

Use dev selector in `dev-selector`, login screen in `pin-login`, and fetch admin lists only when active mode is admin.

- [x] **Step 5: Update `AppShell` profile menu**

User icon opens a menu. Admin users can switch participant/admin mode; all users can logout or change dev identity as appropriate.

- [x] **Step 6: Verify frontend tests**

Run Vitest.

### Task 4: Documentation and Full Verification

**Files:**
- Modify: `README.md`
- Modify: `docs/planning/mvp-current-state.md`

- [x] **Step 1: Update docs**

Document auth modes, env vars, bootstrap admin PIN, and local development behavior.

- [x] **Step 2: Run full backend tests**

Run `& '.\.tools\dotnet\dotnet.exe' test GymChall.sln --no-restore`.

- [x] **Step 3: Run frontend tests and build**

Run Vitest and `npm run build`.

- [ ] **Step 4: Commit implementation after user confirmation**

Create a local commit after verification.

---

## Self-Review

- Spec coverage: covers production PIN login, dev selector, custom keypad, secure session, admin mode switch, backend role enforcement, actor validation, bootstrap PIN, tests, and docs.
- Placeholder scan: no placeholders or unresolved implementation choices remain.
- Type consistency: endpoint names and auth contracts match `docs/superpowers/specs/2026-06-17-pin-login-auth-design.md`.
