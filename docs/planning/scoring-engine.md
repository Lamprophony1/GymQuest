# Motor de puntajes

## Objetivo

Calcular puntajes, rankings, rachas, insignias y desempates desde hechos base. El motor debe ser determinista: mismos inputs + mismas reglas = mismos outputs.

## Inputs

- Challenge.
- ChallengeSettings vigente o snapshot de reglas.
- Participantes activos.
- Parejas y membresias vigentes por fecha.
- Check-ins auto-validos salvo correccion administrativa.
- Fichas aplicadas, cumplidas, rechazadas o vencidas.
- Recuperaciones vinculadas.
- Actividades de lago.
- Evidencias opcionales.

## Outputs

- DailyScore por participante y dia.
- CoupleDailyScore por pareja y dia.
- WeeklyScore por pareja y semana.
- Rankings.
- Racha 5am individual y de pareja.
- Racha gym individual y de pareja.
- Insignias.
- Alertas Zona Roja.
- Desempates.

## Algoritmo diario individual

Para cada participante y cada dia habil dentro del reto:

1. Obtener pareja vigente en esa fecha.
2. Buscar ficha valida para la fecha.
3. Si hay ficha de cobertura total aplicada:
   - coverageKind = full_token.
   - puntos = puntaje normal del dia.
   - isCovered = true.
   - countsForDailyCoupleBonus = true.
   - countsForMorningStreak = true.
   - countsForGymStreak = false, porque no hubo entrenamiento efectivo.
   - cuenta para semana perfecta.
4. Si hay ficha de mover horario cumplida:
   - coverageKind = moved_schedule.
   - puntos = puntaje normal del dia original.
   - isCovered = true.
   - countsForDailyCoupleBonus = true.
   - countsForMorningStreak = true.
   - countsForGymStreak = true.
   - cuenta para semana perfecta.
5. Si hay check-in 5am valido dentro de ventana:
   - coverageKind = morning.
   - puntos = 4 si lunes, 3 si martes-viernes.
   - isCovered = true.
   - countsForDailyCoupleBonus = true.
   - countsForMorningStreak = true.
   - countsForGymStreak = true.
   - cuenta para semana perfecta.
6. Si hay recuperacion tarde/noche valida sin ficha:
   - coverageKind = same_day_recovery.
   - puntos = 2.
   - isCovered = true para completar semana.
   - countsForDailyCoupleBonus = false.
   - countsForMorningStreak = false.
   - countsForGymStreak = true.
   - cuenta para semana completa.
7. Si hay recuperacion sabado/domingo valida vinculada a este dia sin ficha:
   - coverageKind = weekend_recovery.
   - puntos = 1.5.
   - isCovered = true para completar semana.
   - countsForDailyCoupleBonus = false.
   - countsForMorningStreak = false.
   - countsForGymStreak = false para el dia perdido.
   - cuenta para semana rescatada.
8. Si no aplica nada:
   - coverageKind = none.
   - puntos = 0.
   - isCovered = false.
   - rompe rachas aplicables.

Regla de prioridad: si existen varios registros para el mismo dia, gana el de mayor prioridad valida y los demas quedan como no puntuables/auditables.

## Recuperacion de fin de semana con ficha

Si existe una ficha de mover horario que permite mover el entrenamiento del dia original al fin de semana y la persona cumple ese horario:

- Se clasifica como moved_schedule, no como weekend_recovery.
- Suma puntaje normal del dia original.
- Puede preservar racha 5am/gym segun la regla de ficha valida.
- Puede activar bonus diario de pareja si la pareja tambien cumple una condicion elegible.

## Validaciones de recuperacion

- El dia perdido debe ser lunes-viernes dentro del reto.
- El recoveryCheckIn debe existir.
- Un missedDate no puede tener mas de una recuperacion puntuable por persona.
- Maximo 2 weekend recoveries por persona por semana.
- Una ficha de cobertura total elimina necesidad de recuperacion para ese dia.
- Una ficha de mover horario cumplida no es recuperacion.

## Algoritmo diario de pareja

Para cada pareja y fecha:

1. Tomar los DailyScore de ambos miembros vigentes.
2. Sumar puntos individuales.
3. Si ambos tienen countsForDailyCoupleBonus = true, sumar dailyCoupleBonus.
4. Sumar lago elegible del dia.
5. Guardar CoupleDailyScore.

La recuperacion sin ficha nunca activa el bonus diario.

## Lago

Para cada pareja y semana:

1. Ordenar actividades de lago validas por fecha/creacion.
2. Filtrar actividades asociadas a gym/entrenamiento valido.
3. Para mode = couple, exigir que ambos miembros esten en la misma LakeActivity.
4. Tomar solo las primeras N puntuables segun settings.
5. Asignar puntos: solo = 1, pareja = 3.
6. Actividades extra pueden generar insignias pero no puntos.

## Bonus semanal

Para cada pareja y semana:

1. Tomar solo dias habiles dentro del rango real del reto.
2. Verificar que ambos integrantes completen todos esos dias requeridos.
3. Si ambos tienen todos los dias por morning/full_token/moved_schedule, weeklyBonusType = perfect.
4. Si completaron todos los dias y hubo same_day_recovery pero no weekend_recovery, weeklyBonusType = complete.
5. Si para completar se uso weekend_recovery, weeklyBonusType = rescued.
6. Si no completaron ambos los dias requeridos, weeklyBonusType = none.

## Admin y recalculo

El admin puede corregir cualquier registro si hubo error. Cada cambio debe generar AuditLog y permitir un nuevo ScoreRun. El ScoreRun recalcula derivados desde hechos base y reglas vigentes/snapshot.

## Rankings

- General: suma WeeklyScore y/o CoupleDailyScore del reto completo.
- Semanal: WeeklyScore por semana.
- Racha 5am: usa countsForMorningStreak.
- Racha gym: usa countsForGymStreak y reglas de continuidad.
- Lunes: lunes cubiertos por ambos con 5am/ficha valida.
- Lago: vueltas puntuables y totales.
- Recuperaciones: cantidad por tipo para estadistica y desempate.

## Tests minimos del motor

1. Lunes 5am suma 4 y activa bonus/racha 5am.
2. Martes 5am suma 3.
3. Ficha de cobertura total suma puntaje normal y activa bonus diario.
4. Ficha de mover horario cumplida suma puntaje normal y activa bonus diario.
5. Ficha de mover horario vencida no suma.
6. Recuperacion tarde suma 2, cuenta para racha gym, no activa bonus diario ni racha 5am.
7. Recuperacion fin de semana suma 1.5, completa semana, no preserva racha del dia perdido.
8. Ficha que mueve entrenamiento al fin de semana clasifica como moved_schedule, no como rescue.
9. No permite recuperar dos veces el mismo dia perdido.
10. No permite mas de 2 recuperaciones de fin de semana por persona/semana.
11. Lago sin gym valido no suma.
12. Lago de pareja exige ambos en la misma actividad.
13. Tercera vuelta de lago no suma puntos.
14. Semana parcial evalua solo dias habiles dentro del reto.
15. Semana perfecta vence a completa si no hay recuperaciones.
16. Mezcla con weekend recovery baja a rescued.
17. Fichas validas no penalizan desempates.
18. Empate aplica criterios en orden.
19. Correccion admin genera auditoria y permite nuevo ScoreRun.
20. Cambio de premios queda auditado y no altera puntajes.
