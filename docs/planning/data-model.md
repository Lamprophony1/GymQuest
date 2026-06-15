# Modelo de datos recomendado

## Principio

Separar hechos base de resultados derivados.

- Hechos base: registros ingresados por usuarios/admin, como check-ins, fichas, recuperaciones, lago y evidencia.
- Derivados: daily scores, weekly scores, rankings, rachas e insignias calculadas.

Los derivados pueden guardarse por performance, pero siempre deben poder regenerarse.

## Entidades base

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
- dailyBonusPolicy
- createdAt
- updatedAt

### Participant

- id
- displayName
- username
- email nullable
- role: admin | participant
- gender nullable
- active
- createdAt
- updatedAt

### Couple

- id
- challengeId
- name
- active
- createdAt
- updatedAt

### CoupleMembership

Usar membresia en vez de participantAId/participantBId fijo permite cambios historicos.

- id
- coupleId
- participantId
- startsOn
- endsOn nullable
- createdAt
- updatedAt

### CheckIn

- id
- challengeId
- participantId
- occurredAt
- activityDate
- type: gym_morning | gym_same_day_recovery | gym_weekend_recovery | lake
- status: pending | valid | rejected
- durationMinutes
- notes
- createdByParticipantId
- validatedByParticipantId nullable
- createdAt
- updatedAt

### RecoveryLink

- id
- challengeId
- participantId
- missedDate
- recoveryCheckInId
- recoveryType: same_day | weekend
- status: pending | valid | rejected
- createdAt
- updatedAt

### ExceptionToken

- id
- challengeId
- participantId
- targetDate
- type: full_coverage | move_schedule
- reasonCategory: health | period | work_trip | mandatory_trip | other_approved
- status: pending | applied | fulfilled | rejected | expired
- assignedWindowStart nullable
- assignedWindowEnd nullable
- requiresGroupApproval
- approvedByGroup
- assignedByAdminId nullable
- notes nullable
- createdAt
- updatedAt

### LakeActivity

Separar lago de CheckIn evita mezclar el extra con gym base.

- id
- challengeId
- coupleId
- activityDate
- mode: solo | couple
- participantId nullable
- associatedCheckInId nullable
- status: pending | valid | rejected
- scoringOrder nullable
- createdAt
- updatedAt

### Evidence

- id
- challengeId
- checkInId nullable
- exceptionTokenId nullable
- lakeActivityId nullable
- uploadedByParticipantId
- type: photo | location | route_screenshot | manual_note
- url
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

## Entidades derivadas

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
- isMorning
- hasValidToken
- countsForDailyCoupleBonus
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
- bothCovered
- createdAt

### WeeklyScore

- id
- scoreRunId
- challengeId
- coupleId
- weekStartDate
- weekEndDate
- individualPoints
- dailyBonusPoints
- lakePoints
- weeklyBonusType: perfect | complete | rescued | none
- weeklyBonusPoints
- totalPoints
- createdAt

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
- RecoveryLink(challengeId, participantId, missedDate).
- LakeActivity(challengeId, coupleId, activityDate).
- DailyScore(scoreRunId, challengeId, participantId, date).
- CoupleDailyScore(scoreRunId, challengeId, coupleId, date).
- WeeklyScore(scoreRunId, challengeId, coupleId, weekStartDate).
