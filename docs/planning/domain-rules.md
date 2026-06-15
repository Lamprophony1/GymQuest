# Reglas de dominio

## Contexto

GymChall administra el reto "Reto Parejas - Rumbo a Septiembre". Compiten parejas, no individuos. Cada pareja suma puntos individuales de sus integrantes mas bonus de pareja, bonus semanales y puntos de lago.

## Datos iniciales

- Inicio: 2026-06-15.
- Timezone: America/Asuncion.
- Admin inicial: Rafa.
- Participantes iniciales: Rafa, Clari, Obelar, Chachi, Cieli, Naldo.
- Parejas iniciales: Rafa + Clari, Obelar + Chachi, Cieli + Naldo.
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

- Cobertura total: salud, enfermedad, periodo, viaje laboral, viaje obligatorio u otro motivo real aprobado. Cubre el dia completo, otorga puntaje normal del dia, mantiene racha y no penaliza bonus ni desempates.
- Mover horario: permite entrenar en otro horario aprobado. Si se cumple, otorga puntaje normal del dia original. Si no se cumple, no cubre por si sola.

Estados sugeridos:

- pending: espera revision o cumplimiento.
- applied: cobertura total valida.
- fulfilled: mover horario cumplida.
- rejected: no aplica.
- expired: mover horario vencida.

## Bonus diario

Regla base: si ambos integrantes tienen el dia cubierto, la pareja suma +1.

Pendiente de definicion: si una recuperacion tarde/noche o fin de semana debe contar como `dia cubierto` para este bonus. El motor debe soportar esta regla como configuracion para evitar reescrituras.

## Bonus semanal

Un solo bonus por pareja por semana:

- perfect: +12 si ambos tienen 5/5 cubierto por 5am o ficha valida.
- complete: +7 si ambos completan 5/5 con una o mas recuperaciones tarde/noche sin ficha.
- rescued: +4 si para completar 5/5 se uso sabado/domingo sin ficha.
- none: 0 si la pareja no completa 5/5 ambos.

Si hay mezcla de recuperacion tarde y fin de semana, gana la categoria mas baja: rescued.

## Lago

- Maximo puntuable: 2 vueltas por pareja por semana.
- Si va una sola persona: +1 para la pareja.
- Si va la pareja junta: +3 para la pareja.
- Debe estar asociada a entrenamiento/gym valido.
- La tercera vuelta puede dar insignia, pero no suma puntos.

## Desempates finales

1. Mayor cantidad de dias de pareja cubiertos.
2. Mayor cantidad de lunes cubiertos por ambos.
3. Mayor cantidad de semanas perfectas.
4. Menor cantidad de recuperaciones de fin de semana sin ficha.
5. Menor cantidad de recuperaciones tarde/noche sin ficha.
6. Mayor cantidad de vueltas al lago puntuables.
7. Mini reto final definido por el grupo.

Las fichas validas no penalizan desempates.
