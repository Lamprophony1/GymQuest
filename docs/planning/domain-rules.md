# Reglas de dominio

## Contexto

GymChall administra el reto "Reto Parejas - Rumbo a Septiembre". Compiten parejas, no individuos. Cada pareja suma puntos individuales de sus integrantes mas bonus de pareja, bonus semanales y puntos de lago.

## Datos iniciales

- Inicio: 2026-06-15.
- Timezone: America/Asuncion.
- Admin inicial: Rafa.
- Participantes iniciales: Rafa, Clari, Obelar, Chachi, Cieli, Naldo.
- Parejas iniciales: Rafa + Clari, Obelar + Chachi, Cieli + Naldo.
- Se pueden agregar nuevas parejas en el futuro.
- No se planean cambios de integrantes dentro de parejas ya creadas.
- Apuesta: 250000 Gs por persona.
- Fondo estimado: 1500000 Gs.

## Prioridad competitiva

1. Gym 5am.
2. Recuperacion el mismo dia.
3. Recuperacion sabado/domingo.
4. Lago asociado a entrenamiento valido.

Actividades externas como pilates, futbol, padel, basquet, bici, caminatas, clases aparte o entrenamiento en casa no suman puntos competitivos. Pueden registrarse como nota social/saludable en una fase futura.

## Puntaje base individual

- Lunes 5am: 4 puntos.
- Martes a viernes 5am: 3 puntos.
- Recuperacion tarde/noche sin ficha: 2 puntos.
- Recuperacion sabado/domingo sin ficha: 1.5 puntos.
- Maximo recuperaciones de fin de semana: 2 por persona por semana.
- Un dia perdido solo puede recuperarse una vez.

## Ventana 5am

Propuesta configurable: 04:50 a 05:30. Si el check-in cae fuera de la ventana sin ficha de mover horario, no cuenta como 5am.

## Duracion minima

Propuesta configurable: 45 minutos.

## Fichas

Las fichas son individuales. Una ficha valida no cubre automaticamente a la pareja.

Tipos iniciales:

- Cobertura total: salud, enfermedad, periodo, viaje laboral, viaje obligatorio u otro motivo real aprobado. Cubre el dia completo, otorga puntaje normal del dia, mantiene la racha oficial/5am y no penaliza bonus ni desempates.
- Mover horario: permite entrenar en otro horario aprobado. Si se cumple, otorga puntaje normal del dia original. Si no se cumple, no cubre por si sola.

Estados sugeridos:

- pending: espera revision o cumplimiento.
- applied: cobertura total valida.
- fulfilled: mover horario cumplida.
- rejected: no aplica.
- expired: mover horario vencida.

## Ficha de periodo

- Una ficha por mes calendario por participante elegible.
- No es acumulable.
- No es transferible.
- No requiere detalles sensibles.
- Cuenta como ficha valida de cobertura total.

## Bonus diario

La pareja suma +1 solo si ambos integrantes cumplen una de estas condiciones para el dia original:

- Gym 5am valido.
- Ficha de cobertura total valida.
- Ficha de mover horario cumplida.

La recuperacion sin ficha, tanto tarde/noche como sabado/domingo, suma puntos individuales pero no activa el bonus diario de pareja.

## Bonus semanal

Un solo bonus por pareja por semana. La semana se evalua sobre los dias habiles dentro del reto.

- perfect: +12 si ambos tienen todos los dias habiles cubiertos por 5am o ficha valida.
- complete: +7 si ambos completan los dias habiles con una o mas recuperaciones tarde/noche sin ficha.
- rescued: +4 si para completar los dias habiles se uso sabado/domingo sin ficha.
- none: 0 si la pareja no completa todos los dias habiles requeridos.

Si hay mezcla de recuperacion tarde y fin de semana, gana la categoria mas baja: rescued.

## Rachas

El sistema debe manejar rachas separadas:

- Racha 5am: avanza con gym 5am o ficha valida que cubre el dia original. La recuperacion sin ficha no cuenta.
- Racha de gym: avanza cuando la persona entrena efectivamente ese dia, incluyendo recuperacion tarde/noche. Una recuperacion de fin de semana sin ficha no preserva la racha del dia perdido.
- Racha de pareja 5am: avanza si ambos cumplen condicion valida de racha 5am para el mismo dia.
- Racha de pareja gym: avanza si ambos tienen entrenamiento efectivo valido para ese dia o una ficha que mueve oficialmente el entrenamiento.

Una ficha de mover horario hacia el fin de semana puede preservar la racha del dia original si se cumple en el horario/dia aprobado.

## Lago

- Maximo puntuable: 2 vueltas por pareja por semana.
- Si va una sola persona: +1 para la pareja.
- Si va la pareja junta: +3 para la pareja.
- Para contar como pareja junta, ambos deben estar en la misma actividad.
- Debe estar asociada a entrenamiento/gym valido.
- La tercera vuelta puede dar insignia, pero no suma puntos.

## Evidencia y confianza

El reto funcionara por confianza. Los registros cargados se consideran validos por defecto. No hace falta validacion administrativa normal.

El admin puede corregir registros si hay errores. Toda correccion debe quedar en auditoria y debe permitir recalcular puntajes.

La evidencia queda como dato opcional para fases futuras o para casos donde el grupo quiera adjuntar foto, comentario o captura.

## Premios

La distribucion de premios puede cambiar despues de iniciado el reto. Todo cambio debe quedar auditado. Los premios no afectan el puntaje historico.

## Desempates finales

1. Mayor cantidad de dias de pareja cubiertos por 5am/ficha valida.
2. Mayor cantidad de lunes cubiertos por ambos.
3. Mayor cantidad de semanas perfectas.
4. Menor cantidad de recuperaciones de fin de semana sin ficha.
5. Menor cantidad de recuperaciones tarde/noche sin ficha.
6. Mayor cantidad de vueltas al lago puntuables.
7. Mini reto final definido por el grupo.

Las fichas validas no penalizan desempates.
