# Modelo de datos recomendado

## Principio

Separar hechos base de resultados derivados.

- Hechos base: registros ingresados por usuarios/admin, como check-ins, fichas, recuperaciones, lago, premios y evidencia opcional.
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
- dailyBonusPolicy: morning_or_valid_token_only
- periodTokenPolicy: calendar_month
- partialWeekPolicy: business_days_within_challenge
- checkInValidationPolicy: trust_auto_valid
- prizeChangePolicy: editable_with_audit
- coupleChangePolicy: add_new_couples_only
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

Aunque no se planean cambios de pareja, usar membresia permite agregar parejas nuevas y conservar historial si el dominio crece.

- id
- coupleId
- participantId
- startsOn
- endsOn nullable
- createdAt
- updatedAt

### CheckIn

Los check-ins son auto-validos por confianza. El admin puede corregirlos despues.

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

### RecoveryLink

- id
- challengeId
- participantId
- missedDate
- recoveryCheckInId
- recoveryType: same_day | weekend
- status: valid | corrected | rejected
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
- assignedDate nullable
- requiresGroupApproval
- approvedByGroup
- assignedByAdminId nullable
- notes nullable
- createdAt
- updatedAt

### LakeActivity

El lago se modela como actividad separada. Para que cuente como pareja, ambos deben pertenecer a la misma LakeActivity.

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

La evidencia es opcional en el MVP.

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
- streakType: morning_5am | gym_attendance
- currentCount
- bestCount
- calculatedAt

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
- LakeActivityParticipant(lakeActivityId, participantId).
- DailyScore(scoreRunId, challengeId, participantId, date).
- CoupleDailyScore(scoreRunId, challengeId, coupleId, date).
- WeeklyScore(scoreRunId, challengeId, coupleId, weekStartDate).
- StreakSnapshot(scoreRunId, challengeId, ownerType, ownerId, streakType).
