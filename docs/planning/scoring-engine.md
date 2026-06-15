# Motor de puntajes

## Objetivo

Calcular puntajes, rankings, rachas, insignias y desempates desde hechos base. El motor debe ser determinista: mismos inputs + mismas reglas = mismos outputs.

## Inputs

- Challenge.
- ChallengeSettings vigente o snapshot de reglas.
- Participantes activos.
- Parejas y membresias vigentes por fecha.
- Check-ins validos o pendientes segun contexto.
- Fichas validas, cumplidas, rechazadas o vencidas.
- Recuperaciones vinculadas.
- Lago.
- Evidencias y validaciones.

## Outputs

- DailyScore por participante y dia.
- CoupleDailyScore por pareja y dia.
- WeeklyScore por pareja y semana.
- Rankings.
- Rachas.
- Insignias.
- Alertas Zona Roja.
- Desempates.

## Algoritmo diario individual

Para cada participante y cada dia habil del reto:

1. Obtener pareja vigente en esa fecha.
2. Buscar ficha valida para la fecha.
3. Si hay ficha de cobertura total aplicada:
   - coverageKind = full_token.
   - puntos = puntaje normal del dia.
   - isCovered = true.
   - cuenta para semana perfecta.
4. Si hay ficha de mover horario cumplida:
   - coverageKind = moved_schedule.
   - puntos = puntaje normal del dia.
   - isCovered = true.
   - cuenta para semana perfecta.
5. Si hay check-in 5am valido dentro de ventana:
   - coverageKind = morning.
   - puntos = 4 si lunes, 3 si martes-viernes.
   - isCovered = true.
   - cuenta para semana perfecta.
6. Si hay recuperacion tarde/noche valida sin ficha:
   - coverageKind = same_day_recovery.
   - puntos = 2.
   - cuenta para semana completa.
7. Si hay recuperacion sabado/domingo valida vinculada a este dia:
   - coverageKind = weekend_recovery.
   - puntos = 1.5.
   - cuenta para semana rescatada.
8. Si no aplica nada:
   - coverageKind = none.
   - puntos = 0.
   - isCovered = false.

Regla de prioridad: si existen varios registros para el mismo dia, gana el de mayor prioridad valida y los demas quedan como no puntuables/auditables.

## Validaciones de recuperacion

- El dia perdido debe ser lunes-viernes dentro del reto.
- El recoveryCheckIn debe existir y estar valido.
- Un missedDate no puede tener mas de una recuperacion valida por persona.
- Maximo 2 weekend recoveries por persona por semana.
- Una ficha de cobertura total elimina necesidad de recuperacion para ese dia.
- Una ficha de mover horario cumplida no es recuperacion.

## Algoritmo diario de pareja

Para cada pareja y fecha:

1. Tomar los DailyScore de ambos miembros vigentes.
2. Sumar puntos individuales.
3. Si ambos cumplen la politica de bonus diario, sumar dailyCoupleBonus.
4. Sumar lago elegible del dia.
5. Guardar CoupleDailyScore.

La politica de bonus diario queda configurable para soportar la decision final del grupo.

## Lago

Para cada pareja y semana:

1. Ordenar actividades de lago validas por fecha/creacion.
2. Filtrar actividades asociadas a gym/entrenamiento valido.
3. Tomar solo las primeras N puntuables segun settings.
4. Asignar puntos: solo = 1, pareja = 3.
5. Actividades extra pueden generar insignias pero no puntos.

## Bonus semanal

Para cada pareja y semana:

1. Verificar que ambos integrantes tengan 5 dias completados dentro de lunes-viernes.
2. Si ambos tienen todos los dias por morning/full_token/moved_schedule, weeklyBonusType = perfect.
3. Si completaron 5/5 y hubo same_day_recovery pero no weekend_recovery, weeklyBonusType = complete.
4. Si para completar se uso weekend_recovery, weeklyBonusType = rescued.
5. Si no completaron ambos 5/5, weeklyBonusType = none.

## Rankings

- General: suma WeeklyScore y/o CoupleDailyScore del reto completo.
- Semanal: WeeklyScore por semana.
- Racha: dias consecutivos cubiertos segun politica aprobada.
- Lunes: lunes cubiertos por ambos.
- Lago: vueltas puntuables y totales.
- Recuperaciones: cantidad por tipo para estadistica y desempate.

## Tests minimos del motor

1. Lunes 5am suma 4.
2. Martes 5am suma 3.
3. Ficha de cobertura total suma puntaje normal.
4. Ficha de mover horario cumplida suma puntaje normal.
5. Ficha de mover horario vencida no suma.
6. Recuperacion tarde suma 2.
7. Recuperacion fin de semana suma 1.5.
8. No permite recuperar dos veces el mismo dia perdido.
9. No permite mas de 2 recuperaciones de fin de semana por persona/semana.
10. Lago sin gym valido no suma.
11. Tercera vuelta de lago no suma puntos.
12. Semana perfecta vence a completa si no hay recuperaciones.
13. Mezcla con weekend recovery baja a rescued.
14. Fichas validas no penalizan desempates.
15. Empate aplica criterios en orden.
