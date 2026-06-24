# Modelo de datos

## Principio

Separar hechos base de resultados derivados.

- Hechos base actuales: challenge, settings, participantes, parejas, check-ins, coins/tokens y audit logs.
- Hechos base futuros: Side quest/cardio opcional, evidencia, premios y badges.
- Derivados actuales: rankings, bonus semanales y rachas calculadas al consultar.
- Derivados futuros: daily scores, weekly scores, score runs, snapshots de rachas e insignias persistidas.

Los derivados pueden guardarse por performance, pero siempre deben poder regenerarse desde hechos base.

## Entidades base actuales

### Challenge

- id
- name
- startDate
- endDate
- status: draft | active | finished
- adminParticipantId
- timezone
- createdAt
- updatedAt

### ChallengeSettings

- id
- challengeId
- mondayMorningPoints
- weekdayMorningPoints
- sameDayRecoveryPoints
- weekendRecoveryPoints
- dailyCoupleBonus
- perfectWeekBonus
- completeWeekBonus
- rescuedWeekBonus
- lakeSoloPoints
- lakeCouplePoints
- maxLakeScoringPerCouplePerWeek
- maxWeekendRecoveriesPerPersonPerWeek
- gymMinimumMinutes
- morningWindowStart
- morningWindowEnd
- createdAt
- updatedAt

Nota: `gymMinimumMinutes` queda para compatibilidad/fase futura. El check-in MVP no pide duracion.

### Participant

- id
- displayName
- username
- role: admin | participant
- gender nullable
- weightKg nullable, privado del participante
- heightCm nullable, privado del participante
- active
- createdAt
- updatedAt

`bodyMassIndex` no se persiste: se calcula al consultar el perfil privado del participante.

### Avatar assets

Los avatares del MVP no son entidad de base de datos. Son assets estaticos del frontend:

```text
web/public/avatars/{username}.png
```

La UI resuelve el avatar por `username`. Si no existe imagen para un participante, muestra iniciales como fallback.

Esto mantiene simple el MVP; una fase futura podria mover avatares a storage administrado si se permite carga desde la app.

### AuthCredential

Credencial local para login por PIN. El PIN nunca se guarda en texto plano.

- participantId
- pinHash
- failedAttemptCount
- lockedUntil nullable
- pinUpdatedAt nullable
- createdAt
- updatedAt

Reglas:

- PIN numerico de 4 a 6 digitos.
- Hash PBKDF2-SHA256 con sal por credencial.
- 5 intentos fallidos bloquean temporalmente la credencial.
- Solo admin puede asignar o resetear PINs.
- Cada participante puede cambiar su propio PIN desde su perfil si conoce el PIN actual.

### Couple

- id
- challengeId
- name
- active
- createdAt
- updatedAt

La UI debe mostrar nombres de pareja con `y` aunque el seed/backend conserve `+`.

### CoupleMembership

Aunque no se planean cambios de pareja, usar membresia permite agregar parejas nuevas y conservar historial si el dominio crece.

- id
- coupleId
- participantId
- startsOn
- endsOn nullable
- createdAt
- updatedAt

### CheckIn

Los check-ins son auto-validos por confianza. El admin puede invalidarlos despues.

- id
- challengeId
- participantId
- occurredAt
- activityDate
- type: gym_morning | gym_same_day_recovery | gym_weekend_recovery
- status: valid | corrected | rejected
- durationMinutes
- notes nullable
- createdByParticipantId
- correctedByParticipantId nullable
- createdAt
- updatedAt

Notas:

- `type` lo clasifica el backend, no el frontend.
- `durationMinutes` existe en persistencia por compatibilidad y hoy se guarda como 0 desde el flujo nuevo.
- `activityDate` puede ser distinto de la fecha local de `occurredAt` cuando se registra una recuperacion de fin de semana.

### ExceptionToken

Entidad tecnica para las coins visibles.

- id
- challengeId
- participantId
- targetDate
- type: health | mandatory | schedule_change
- reasonCategory: health | period | work_trip | mandatory_trip | other_approved
- status: available | applied | corrected | rejected
- assignedByAdminId
- notes nullable
- createdAt
- updatedAt

Mapeo visible:

- `health` -> Health coin.
- `mandatory` -> Commit coin.
- `schedule_change` -> Flex coin.

Estados visibles:

- `available` -> disponible para usar.
- `applied` -> usada sobre una fecha objetivo.
- `rejected` -> invalidada.
- `corrected` -> reservado para una fase de correccion mas completa.

Regla de invalidacion:

- Invalidar una coin `applied` la devuelve a `available`, porque fue una aplicacion corregida y debe volver al inventario del player.
- Invalidar una coin `available` la marca como `rejected`.

### AuditLog

- id
- challengeId
- actorParticipantId
- action
- entityType
- entityId
- oldValueJson nullable
- newValueJson nullable
- createdAt

Actualmente se usa para invalidaciones administrativas.

## Consultas de calendario implementadas

El MVP no persiste una entidad separada para calendario. Las vistas semanales se construyen desde `CheckIn`, `ExceptionToken` y `Participant`.

Endpoint admin de check-ins:

```text
GET /api/admin/check-ins/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD
```

Devuelve check-ins del rango solicitado, incluyendo validos y rechazados, con:

- participante;
- fecha de actividad;
- fecha/hora original de marcacion;
- tipo clasificado por backend;
- estado;
- notas;
- fecha de creacion.

Endpoint semanal readonly:

```text
GET /api/calendar/weekly?from=YYYY-MM-DD&to=YYYY-MM-DD
```

Devuelve eventos unificados del rango solicitado:

- check-ins validos;
- coins aplicadas.

Cada evento semanal tiene:

- id;
- participantId;
- participantName;
- activityDate;
- occurredAt nullable;
- kind: check-in o coin;
- label;
- status;
- checkInType nullable;
- coinType nullable;
- notes nullable.

La vista `Marcaciones` de players usa solo el endpoint readonly y no permite modificar datos. El calendario admin combina los eventos readonly con el endpoint admin de check-ins para conservar visibilidad de check-ins rechazados cuando el filtro lo pide. El filtro inicial visible es `Validos`, donde aparecen check-ins validos y coins aplicadas.

## Entidades futuras

### LakeActivity / SideQuestActivity

El modelo futuro puede conservar temporalmente nombres tecnicos `LakeActivity` por historia del dominio, pero el producto visible sera `Side quest` o cardio opcional. Para que cuente como pareja, ambos deben pertenecer a la misma actividad.

- id
- challengeId
- coupleId
- activityDate
- mode: solo | couple
- associatedCheckInId nullable
- status: valid | corrected | rejected
- scoringOrder nullable
- notes nullable
- createdAt
- updatedAt

### LakeActivityParticipant

- id
- lakeActivityId
- participantId
- createdAt

Reglas:

- mode = solo exige 1 participante.
- mode = couple exige 2 participantes de la misma pareja.

### Evidence

La evidencia es opcional y no forma parte del MVP cerrado.

- id
- challengeId
- checkInId nullable
- exceptionTokenId nullable
- lakeActivityId nullable
- uploadedByParticipantId
- type: photo | location | route_screenshot | manual_note
- url nullable
- notes nullable
- createdAt

### PrizeDistribution

- id
- challengeId
- place
- amountGs
- label
- active
- createdAt
- updatedAt

Los cambios de premios son permitidos y deben auditarse.

## Entidades derivadas futuras

### ScoreRun

- id
- challengeId
- triggeredByParticipantId nullable
- reason: automatic | manual_recalc | weekly_close | admin_correction
- settingsSnapshotJson
- startedAt
- finishedAt nullable
- status: running | completed | failed
- error nullable

### DailyScore

- id
- scoreRunId
- challengeId
- participantId
- coupleId
- date
- basePoints
- tokenPoints
- recoveryPoints
- totalIndividualPoints
- coverageKind: morning | full_token | moved_schedule | same_day_recovery | weekend_recovery | none
- isCovered
- hasValidToken
- countsForDailyCoupleBonus
- countsForMorningStreak
- countsForGymStreak
- countsForPerfectWeek
- countsForCompleteWeek
- countsForRescuedWeek
- createdAt

### CoupleDailyScore

- id
- scoreRunId
- challengeId
- coupleId
- date
- participantOneScore
- participantTwoScore
- dailyBonusPoints
- lakePoints
- totalPoints
- bothEligibleForDailyBonus
- bothCoveredForWeeklyCount
- createdAt

### WeeklyScore

- id
- scoreRunId
- challengeId
- coupleId
- weekStartDate
- weekEndDate
- requiredBusinessDays
- individualPoints
- dailyBonusPoints
- lakePoints
- weeklyBonusType: perfect | complete | rescued | none
- weeklyBonusPoints
- totalPoints
- createdAt

### StreakSnapshot

- id
- scoreRunId
- challengeId
- ownerType: participant | couple
- ownerId
- streakType: perfect | gym_attendance
- currentCount
- bestCount
- calculatedAt

Nota: las rachas actuales se calculan al consultar rankings. En ranking live, el calculo usa `America/Asuncion` y ventanas de vencimiento:

- Perfect streak: el dia actual vence despues de las 06:30.
- Gym streak: un dia sin cobertura vence al dia siguiente.

### BadgeDefinition / BadgeAward

BadgeDefinition:

- id
- code
- name
- description
- type: permanent | state
- icon nullable

BadgeAward:

- id
- badgeDefinitionId
- challengeId
- participantId nullable
- coupleId nullable
- earnedAt
- lostAt nullable
- active

## Indices importantes

- CheckIn(challengeId, participantId, activityDate).
- ExceptionToken(challengeId, participantId, targetDate).
- CheckIn(challengeId, activityDate).
- LakeActivity(challengeId, coupleId, activityDate).
- LakeActivityParticipant(lakeActivityId, participantId).
- AuditLog(challengeId, entityType, entityId).
- DailyScore(scoreRunId, challengeId, participantId, date).
- CoupleDailyScore(scoreRunId, challengeId, coupleId, date).
- WeeklyScore(scoreRunId, challengeId, coupleId, weekStartDate).
- StreakSnapshot(scoreRunId, challengeId, ownerType, ownerId, streakType).
