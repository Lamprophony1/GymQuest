# Reglas de dominio

## Contexto

`GymChall` administra el reto visible como `Reto septiembre 2026`. Compiten parejas, no individuos. Cada pareja suma puntos individuales de sus integrantes, bonus diarios, bonus semanales y, en una fase futura, puntos de lago.

La app visible se muestra temporalmente como `Proyecto RM`.

## Datos iniciales

- Inicio: 2026-06-15.
- Timezone: America/Asuncion.
- Admin inicial: Rafa.
- Participantes iniciales: Rafa, Clari, Obelar, Chachi, Cieli, Naldo.
- Parejas visibles: Rafa y Clari, Obelar y Chachi, Cieli y Naldo.
- El seed/backend puede conservar nombres con `+`; la UI debe mostrarlos con `y`.
- Se pueden agregar nuevas parejas en el futuro.
- No se planean cambios de integrantes dentro de parejas ya creadas.
- Apuesta inicial: 250000 Gs por persona.
- Fondo estimado: 1500000 Gs.

## Prioridad competitiva

1. Check-in 5am.
2. Coin valida que cubre el dia.
3. Recuperacion el mismo dia.
4. Recuperacion sabado/domingo.
5. Lago asociado a entrenamiento valido, pendiente para fase posterior.

Actividades externas como pilates, futbol, padel, basquet, bici, caminatas, clases aparte o entrenamiento en casa no suman puntos competitivos en el MVP. Pueden registrarse como nota social/saludable en una fase futura.

## Puntaje base individual

- Lunes 5am: 4 puntos.
- Martes a viernes 5am: 3 puntos.
- Recuperacion tarde/noche sin coin: 2 puntos.
- Recuperacion sabado/domingo sin coin: 1.5 puntos.
- Maximo recuperaciones de fin de semana: 2 por persona por semana.
- Un dia perdido solo puede recuperarse una vez.

## Ventana 5am

Ventana vigente: 05:00 a 06:00 en America/Asuncion.

Si el check-in cae fuera de la ventana y no hay Flex coin aplicada, no cuenta como 5am. El backend clasifica automaticamente segun `occurredAt`, fecha local y `recoveryTargetDate` cuando aplica.

## Duracion

El MVP actual no usa duracion de entrenamiento para calcular puntos. La configuracion conserva `gymMinimumMinutes` por compatibilidad y posible uso futuro, pero el formulario de check-in no pide duracion.

## Coins

Las coins son individuales. Una coin valida no cubre automaticamente a la pareja.

Tipos visibles:

- Health coin: cobertura completa por salud. Al usarse, equivale a haber cubierto el dia. Mantiene puntos normales, bonus elegibles y rachas aplicables.
- Commit coin: cobertura completa por compromiso obligatorio. Tiene el mismo efecto de cobertura que Health coin.
- Flex coin: valida un entrenamiento fuera de horario o una recuperacion como si hubiera cubierto el dia 5am. Requiere fecha/hora de entrenamiento asociada.

Nombres internos:

- `Health` -> Health coin.
- `Mandatory` -> Commit coin.
- `ScheduleChange` -> Flex coin.

Estados actuales:

- `Available`: coin otorgada y pendiente de uso.
- `Applied`: coin usada sobre una fecha objetivo.
- `Corrected`: estado reservado para correcciones.
- `Rejected`: coin invalidada.

## Health coin mensual

- Se otorga automaticamente una Health coin por mes calendario a participantes con genero femenino.
- No es acumulable: no debe existir mas de una Health coin mensual automatica pendiente por participante y mes.
- No es transferible.
- No requiere detalles sensibles.
- El admin tambien puede otorgar Health coin manualmente por enfermedad u otra situacion de salud.

## Check-in

El usuario registra fecha y hora. El backend decide el tipo:

- Dia habil dentro de ventana 5am: `GymMorning`.
- Dia habil fuera de ventana: `GymSameDayRecovery`.
- Sabado/domingo con `recoveryTargetDate` valido de la misma semana: `GymWeekendRecovery`.

El formulario no envia `type` ni `durationMinutes`.

La UI evita marcaciones duplicadas para dias habiles ya cubiertos por un check-in valido o una coin aplicada. Si aun asi llegaran datos duplicados por admin/importacion/fase futura, el scoring prioriza la cobertura valida de mayor prioridad.

## Bonus diario

La pareja suma +1 solo si ambos integrantes cumplen una de estas condiciones para el dia original:

- Check-in 5am valido.
- Health coin aplicada.
- Commit coin aplicada.
- Flex coin aplicada y cumplida.

La recuperacion sin coin, tanto tarde/noche como sabado/domingo, suma puntos individuales pero no activa el bonus diario de pareja.

## Bonus semanal

Un solo bonus por pareja por semana. La semana se evalua sobre los dias habiles dentro del reto y hasta el `throughDate` consultado.

- `Perfect`: +12 si ambos tienen todos los dias habiles cubiertos por 5am o coin valida.
- `Complete`: +7 si ambos completan los dias habiles con una o mas recuperaciones tarde/noche sin coin.
- `Rescued`: +4 si para completar los dias habiles se uso sabado/domingo sin coin.
- `None`: 0 si la pareja no completa todos los dias habiles requeridos.

El bonus semanal no se suma por adelantado con dias futuros. Si se cargan dias posteriores a la fecha consultada, no afectan el ranking de `throughDate`.

Si hay mezcla de recuperacion tarde y fin de semana, gana la categoria mas baja: `Rescued`.

## Rachas

El sistema maneja rachas separadas:

- Perfect streak: racha de pareja donde ambos sostienen cobertura tipo 5am/perfecta para el mismo dia.
- Gym streak: racha de pareja donde ambos sostienen dia de gym cubierto.

Reglas:

- La fecha del reto se evalua en `America/Asuncion`.
- Perfect streak recien considera perdido el dia actual despues de las 06:30.
- Gym streak recien considera perdido un dia sin cobertura al dia siguiente.
- Check-in 5am cuenta para ambas rachas.
- Health coin y Commit coin salvan la cobertura del dia y preservan la racha.
- Flex coin preserva ambas rachas cuando se usa con entrenamiento fuera de horario o recuperacion valida.
- Recuperacion del mismo dia sin coin cuenta para Gym streak, pero no para Perfect streak.
- Recuperacion de fin de semana sin coin completa semana, pero no preserva la racha del dia perdido.

## Lago

El motor de dominio tiene base para puntuar lago, pero el MVP no lo conecta todavia a persistencia, API ni UI.

Reglas objetivo para la fase futura:

- Maximo puntuable: 2 vueltas por pareja por semana.
- Si va una sola persona: +1 para la pareja.
- Si va la pareja junta: +3 para la pareja.
- Para contar como pareja junta, ambos deben estar en la misma actividad.
- Debe estar asociada a entrenamiento/gym valido.
- La tercera vuelta puede dar insignia, pero no suma puntos.

## Evidencia y confianza

El reto funciona por confianza. Los registros cargados se consideran validos por defecto. No hace falta validacion administrativa normal.

El admin puede invalidar registros si hay errores. La vista principal de revision es un calendario semanal de check-ins por participante, con filtro de validos/rechazados/tipo. Toda invalidacion queda en auditoria y permite recalcular puntajes desde hechos base.

La evidencia queda como dato opcional para fases futuras o para casos donde el grupo quiera adjuntar foto, comentario o captura.

## Premios

La distribucion de premios puede cambiar despues de iniciado el reto. Todo cambio debe quedar auditado. Los premios no afectan el puntaje historico.

## Desempates finales

1. Mayor cantidad de dias de pareja cubiertos por 5am/coin valida.
2. Mayor cantidad de lunes cubiertos por ambos.
3. Mayor cantidad de semanas perfectas.
4. Menor cantidad de recuperaciones de fin de semana sin coin.
5. Menor cantidad de recuperaciones tarde/noche sin coin.
6. Mayor cantidad de vueltas al lago puntuables.
7. Mini reto final definido por el grupo.

Las coins validas no penalizan desempates.
