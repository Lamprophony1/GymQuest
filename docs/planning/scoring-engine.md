# Motor de puntajes

## Objetivo

Calcular puntajes, rankings, rachas, bonus semanales y futuros desempates desde hechos base. El motor debe ser determinista: mismos inputs + mismas reglas = mismos outputs.

## Inputs actuales

- Challenge.
- ChallengeSettings vigente.
- Timezone del reto.
- Participantes activos.
- Parejas activas.
- Check-ins validos o rechazados por admin.
- Coins/tokens disponibles, aplicados o rechazados.

Inputs futuros:

- Actividades de Side quest/cardio opcional.
- Evidencias opcionales.
- Premios y auditoria de cierre.
- Insignias persistidas.

## Outputs actuales

- Ranking general por pareja.
- Ranking semanal por pareja.
- Puntos individuales base.
- Bonus diario de pareja.
- Bonus semanal.
- Perfect streak de pareja.
- Gym streak de pareja.
- Estado de coins disponibles/aplicadas.
- Zona roja en UI, derivada de estado semanal.

Outputs futuros:

- DailyScore persistido.
- WeeklyScore persistido.
- ScoreRun.
- Insignias.
- Ranking de Side quest.
- Desempates finales persistidos.

## Clasificacion de check-ins

El request actual de check-in envia:

- `participantId`
- `occurredAt`
- `recoveryTargetDate` opcional
- `createdByParticipantId`
- `notes` opcional

El frontend no envia `type` ni `durationMinutes`.

El backend clasifica asi:

1. Convertir `occurredAt` al timezone del reto.
2. Si es dia habil y cae dentro de ventana 05:00-06:00:
   - `type = GymMorning`
   - `activityDate = fecha local`
3. Si es dia habil y cae fuera de ventana:
   - `type = GymSameDayRecovery`
   - `activityDate = fecha local`
4. Si es sabado/domingo:
   - Exige `recoveryTargetDate`.
   - `recoveryTargetDate` debe ser dia habil de la misma semana.
   - `type = GymWeekendRecovery`
   - `activityDate = recoveryTargetDate`

## Algoritmo diario individual

Para cada participante y cada dia habil dentro del reto:

1. Buscar coins aplicadas para esa fecha.
2. Si hay Health coin o Commit coin aplicada:
   - coverageKind = `full_token`.
   - puntos = puntaje normal del dia.
   - isCovered = true.
   - countsForDailyCoupleBonus = true.
   - countsForMorningStreak = true.
   - countsForGymStreak = true.
   - cuenta para semana perfecta.
3. Buscar check-in valido para esa fecha.
4. Si hay check-in y Flex coin aplicada:
   - coverageKind = `moved_schedule`.
   - puntos = puntaje normal del dia original.
   - isCovered = true.
   - countsForDailyCoupleBonus = true.
   - countsForMorningStreak = true.
   - countsForGymStreak = true.
   - cuenta para semana perfecta.
5. Si hay check-in 5am valido:
   - coverageKind = `morning`.
   - puntos = 4 si lunes, 3 si martes-viernes.
   - isCovered = true.
   - countsForDailyCoupleBonus = true.
   - countsForMorningStreak = true.
   - countsForGymStreak = true.
   - cuenta para semana perfecta.
6. Si hay recuperacion tarde/noche valida sin coin:
   - coverageKind = `same_day_recovery`.
   - puntos = 2.
   - isCovered = true para completar semana.
   - countsForDailyCoupleBonus = false.
   - countsForMorningStreak = false.
   - countsForGymStreak = true.
   - cuenta para semana completa.
7. Si hay recuperacion sabado/domingo valida vinculada a este dia sin coin:
   - coverageKind = `weekend_recovery`.
   - puntos = 1.5.
   - isCovered = true para completar semana.
   - countsForDailyCoupleBonus = false.
   - countsForMorningStreak = false.
   - countsForGymStreak = false para el dia perdido.
   - cuenta para semana rescatada.
8. Si no aplica nada:
   - coverageKind = `none`.
   - puntos = 0.
   - isCovered = false.
   - rompe rachas aplicables.

Regla de prioridad: si existen varios registros para el mismo dia, gana la cobertura valida de mayor prioridad y los demas quedan como no puntuables/auditables.

## Uso de coins

### Health coin

- Puede ser otorgada por admin.
- Tambien se crea automaticamente una vez por mes para participantes con genero femenino.
- Al usarse cubre un dia habil.
- No requiere check-in asociado.

### Commit coin

- Puede ser otorgada por admin.
- Al usarse cubre un dia habil.
- No requiere check-in asociado.

### Flex coin

- Puede ser otorgada por admin.
- Al usarse requiere fecha/hora de entrenamiento.
- No se permite usarla si el entrenamiento ya cae dentro de ventana 5am.
- Si se usa para fin de semana, requiere `recoveryTargetDate` igual al dia objetivo.
- Clasifica como moved schedule para scoring, no como recovery normal.

## Algoritmo diario de pareja

Para cada pareja y fecha:

1. Tomar los scores diarios de ambos miembros.
2. Sumar puntos individuales.
3. Si ambos tienen `countsForDailyCoupleBonus = true`, sumar dailyCoupleBonus.
4. Sumar Side quest elegible del dia cuando esa fase exista.
5. Guardar o proyectar CoupleDailyScore.

La recuperacion sin coin nunca activa el bonus diario.

## Bonus semanal

Para cada pareja y semana:

1. Tomar solo dias habiles dentro del rango real del reto.
2. Tomar solo dias hasta la fecha evaluada.
3. Verificar que ambos integrantes completen todos los dias requeridos.
4. Si no estan todos los dias requeridos, `weeklyBonusType = None`.
5. Si ambos tienen todos los dias por morning/full_token/moved_schedule, `weeklyBonusType = Perfect`.
6. Si completaron todos los dias y hubo same_day_recovery pero no weekend_recovery, `weeklyBonusType = Complete`.
7. Si para completar se uso weekend_recovery, `weeklyBonusType = Rescued`.

La fecha evaluada puede venir de dos modos:

- `throughDate`: consulta historica fija.
- live: hora actual convertida al timezone del reto.

El bonus semanal no se otorga por dias futuros cargados antes de tiempo si la fecha evaluada todavia no llego a esos dias.

## Rachas

- Perfect streak usa `countsForMorningStreak`.
- Gym streak usa `countsForGymStreak`.
- En el MVP, las rachas visibles son de pareja: avanzan si ambos miembros cumplen la condicion para el mismo dia.
- Las coins validas preservan rachas segun su cobertura.
- En ranking live, la fecha se calcula en `America/Asuncion`.
- Perfect streak no considera perdido el dia actual hasta despues de las 06:30.
- Gym streak no considera perdido un dia sin cobertura hasta el dia siguiente.
- En ranking historico con `throughDate`, las rachas se calculan cerradas hasta esa fecha.

## Side quest / cardio opcional

El dominio tiene un calculador inicial de lago, pero el modulo visible futuro debe ser Side quest/cardio opcional. Todavia no hay API/UI/persistencia para esta fase.

Regla objetivo para la fase futura:

1. Ordenar actividades validas por fecha/creacion.
2. Filtrar actividades asociadas a gym/entrenamiento valido.
3. Para mode = couple, exigir que ambos miembros esten en la misma actividad.
4. Tomar solo las primeras N puntuables segun settings.
5. Asignar puntos: solo = 1, pareja = 3.
6. Actividades extra pueden generar insignias pero no puntos.

## Admin y recalculo

El admin puede invalidar check-ins y coins. Cada invalidacion genera AuditLog. Los rankings se proyectan desde hechos base, por lo que reflejan los cambios al volver a consultar.

La vista admin de calendario no guarda datos derivados. Consulta check-ins por rango semanal y permite invalidar marcas validas. Al invalidar, el registro queda fuera del snapshot de scoring y los rankings se actualizan en el siguiente refresh.

ScoreRun persistido queda como fase futura.

## Tests minimos del motor

1. Lunes 5am suma 4 y activa bonus/rachas.
2. Martes 5am suma 3.
3. Health coin suma puntaje normal y activa bonus diario.
4. Commit coin suma puntaje normal y activa bonus diario.
5. Flex coin usada con entrenamiento fuera de horario suma puntaje normal y activa bonus diario.
6. Recuperacion tarde suma 2, cuenta para Gym streak, no activa bonus diario ni Perfect streak.
7. Recuperacion fin de semana suma 1.5, completa semana, no preserva racha del dia perdido.
8. Flex coin que mueve entrenamiento al fin de semana clasifica como moved_schedule, no como rescue.
9. No permite recuperar dos veces el mismo dia perdido.
10. No permite usar Flex coin para un check-in dentro de ventana 5am.
11. Semana parcial evalua solo dias habiles dentro del reto y hasta la fecha evaluada.
12. Semana perfecta vence a complete si no hay recuperaciones.
13. Mezcla con weekend recovery baja a rescued.
14. Coins validas no penalizan desempates.
15. Correccion admin invalida registros y el ranking cambia al recalcular.
16. Ranking live nocturno usa fecha de `America/Asuncion`, no UTC.
17. Perfect streak cae despues de 06:30 si falta el dia actual.
18. Gym streak cae al dia siguiente si falta cobertura.
