# GymChall Phase 1 Backend Completion Design

## Context

The current backend has the MVP core: SQLite persistence, seeded challenge data, simple check-ins, full-coverage tokens, basic general ranking, and API smoke tests. This block finishes the remaining backend pieces needed before building the mobile-first UI.

The product still treats trust as the default: records are valid when created. Admin work should stay light and only remove invalid records when the group agrees that something was entered by mistake.

## Goals

- Keep the general couple ranking as the primary competitive ranking.
- Add weekly rankings as a secondary motivation view.
- Add admin endpoints for listing and creating participants and couples.
- Add admin invalidation for check-ins and full-coverage tokens with audit logs.
- Return UI-friendly API shapes so the frontend does not need to reconstruct names and summaries from raw snapshots.

## Non-Goals

- Authentication or authorization.
- Complex correction workflows.
- Weekend recovery linking.
- Move-schedule tokens.
- Lake scoring endpoints.
- Evidence uploads.
- Prize distribution management.
- Persisted score runs or cached ranking tables.

## Ranking Design

General ranking remains the main ranking. It calculates through a requested date and ignores invalidated records.

Weekly ranking is secondary and calculated on demand from the same snapshot:

- `GET /api/rankings/weeks?throughDate=YYYY-MM-DD` returns all challenge weeks up to the requested date.
- `GET /api/rankings/weeks/{weekStartDate}` returns one week.
- Weeks start on Monday.
- Only business days inside the challenge window are required.
- Weekly bonus uses the existing domain `WeeklyScoreCalculator`.
- Fase 1 only has morning check-ins, same-day recovery, and full-coverage tokens. Weekend recovery and moved-schedule behavior remain outside this block.

## Admin Data Design

Admin endpoints should be small and practical:

- `GET /api/participants`
- `POST /api/participants`
- `GET /api/couples`
- `POST /api/couples`
- `GET /api/challenge/settings`

Creating a participant creates an active participant. Creating a couple creates an active couple with two memberships starting on the challenge start date. The backend should prevent duplicate usernames and couples with the same participant twice.

## Invalidation Design

Records enter as valid by default. Admin invalidation is the only correction flow in this block:

- `POST /api/admin/check-ins/{id}/invalidate`
- `POST /api/admin/tokens/{id}/invalidate`

The request includes `actorParticipantId` and optional `reason`. The repository updates the record status to `Rejected` and writes an `AuditLogEntity`.

Audit log entries should include:

- `action`: `invalidate_check_in` or `invalidate_token`
- `entityType`: `CheckIn` or `ExceptionToken`
- `entityId`: invalidated record id
- `actorParticipantId`
- `oldValueJson` with the previous status
- `newValueJson` with the rejected status and reason

Ranking queries continue to include only valid check-ins and applied tokens, so invalidated records disappear from rankings automatically.

## API Contract Design

The UI should not need to join participants to couples manually for normal screens. Add summary DTOs:

- `ParticipantSummaryDto`
- `CoupleSummaryDto` with participant summaries
- `ChallengeSettingsDto`
- `WeeklyRankingDto`
- `WeeklyRankingRowDto`

The existing raw `GET /api/challenge` can remain for debugging and development. New list/ranking endpoints should return UI-oriented DTOs.

## Testing

Use TDD for each new behavior:

- Application tests for weekly ranking calculation.
- Infrastructure tests for create/list participants and couples.
- Infrastructure tests for invalidation and audit log writes.
- API tests for admin/list endpoints and weekly ranking endpoints.
- Full `dotnet build GymChall.sln` and `dotnet test GymChall.sln` at the end.

## Acceptance Criteria

- General ranking still passes existing tests.
- Weekly rankings return all weeks and one specific week.
- Invalidated check-ins and tokens are ignored by rankings.
- Invalidating check-ins/tokens writes audit logs.
- Participants and couples can be listed and created through API endpoints.
- Repository status is clean after commits.
