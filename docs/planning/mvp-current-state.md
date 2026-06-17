# Estado actual del MVP

## Resumen

`GymChall` es el nombre tecnico del repo. La app visible se muestra como `Proyecto RM` y el reto activo como `Reto septiembre 2026`.

El MVP actual ya es una app usable para registrar check-ins, usar coins, ver rankings por pareja y administrar correcciones basicas. El backend .NET + SQLite calcula el puntaje; el frontend React/Vite solo registra acciones y muestra resultados.

## Producto visible

- Estilo aprobado: Doodle Fit / Clean Gym.
- Sensacion buscada: fitness moderno, competitivo y divertido, con lenguaje de juego pero sin volver al arcade Sega inicial.
- Mobile-first manda sobre desktop.
- Nombres de pareja en UI: `Rafa y Clari`, `Obelar y Chachi`, `Cieli y Naldo`.
- Nombre visible temporal: `Proyecto RM`.

## Funcionalidades implementadas

- Selector de identidad por confianza, sin login real.
- Dashboard con ranking resumido, pareja propia, puntos, rachas, coins y acciones rapidas.
- Ranking general por pareja.
- Ranking semanal por pareja, separado en base, bonus diario y bonus semanal.
- Check-in con fecha/hora; default visual en 05:00 y fecha actual.
- Clasificacion automatica:
  - 5am si cae dentro de la ventana configurada.
  - Recuperacion del mismo dia si cae fuera de la ventana en dia habil.
  - Recuperacion de fin de semana si se carga sabado/domingo con target de un dia habil faltante de esa semana.
- Coins disponibles:
  - `Health coin`: cobertura completa por salud.
  - `Commit coin`: cobertura completa por compromiso obligatorio.
  - `Flex coin`: valida entrenamiento fuera de horario o recuperacion como cobertura 5am.
- Health coin automatica mensual para participantes con genero femenino, no acumulable.
- Admin puede crear participantes, crear parejas, otorgar coins, invalidar check-ins e invalidar coins.
- Auditoria basica por invalidaciones administrativas.
- Seed inicial del reto y participantes.
- Tests de dominio, aplicacion, infraestructura, API y frontend.

## Scoring implementado

### Puntaje base

- Lunes 5am: 4 puntos.
- Martes a viernes 5am: 3 puntos.
- Recuperacion mismo dia sin coin: 2 puntos.
- Recuperacion fin de semana sin coin: 1.5 puntos.

### Bonus diario

La pareja suma bonus diario si ambos integrantes tienen una cobertura elegible para el dia:

- Check-in 5am.
- Health coin aplicada.
- Commit coin aplicada.
- Flex coin aplicada con entrenamiento/recovery asociado.

La recuperacion sin coin suma puntos individuales, pero no activa bonus diario.

### Bonus semanal

El bonus semanal se calcula solo cuando la semana requerida esta completa dentro del rango evaluado. No se adelanta por dias futuros.

- `Perfect`: ambos cubren todos los dias habiles con 5am o coin valida.
- `Complete`: ambos completan la semana, pero hubo recuperacion del mismo dia sin coin.
- `Rescued`: ambos completan la semana usando al menos una recuperacion de fin de semana sin coin.
- `None`: falta cobertura para completar la semana.

### Rachas

- `Perfect streak`: racha de pareja donde ambos sostienen cobertura tipo 5am/perfecta.
- `Gym streak`: racha de pareja donde ambos sostienen dia de gym cubierto.
- Health y Commit coins salvan la cobertura del dia.
- Flex coin salva la cobertura y rachas cuando se usa con entrenamiento fuera de horario o recuperacion.
- Recuperacion del mismo dia sin coin cuenta para Gym streak, pero no para Perfect streak.
- Recuperacion de fin de semana sin coin completa semana, pero no salva la racha del dia perdido.

## API actual

```text
GET  /health
GET  /api/challenge
GET  /api/challenge/settings
GET  /api/participants
POST /api/participants
GET  /api/couples
POST /api/couples
POST /api/check-ins
POST /api/admin/tokens
POST /api/tokens/{id}/use
POST /api/tokens/full-coverage
POST /api/admin/check-ins/{id}/invalidate
POST /api/admin/tokens/{id}/invalidate
GET  /api/admin/check-ins?limit=50
GET  /api/admin/tokens?limit=50
GET  /api/rankings/general?throughDate=YYYY-MM-DD
GET  /api/rankings/weeks?throughDate=YYYY-MM-DD
GET  /api/rankings/weeks/{weekStartDate}?throughDate=YYYY-MM-DD
```

### Check-in request actual

```json
{
  "participantId": "guid",
  "occurredAt": "2026-06-16T05:00:00-04:00",
  "recoveryTargetDate": "2026-06-15",
  "createdByParticipantId": "guid",
  "notes": "opcional"
}
```

`recoveryTargetDate` solo aplica para recuperacion de fin de semana. El request actual no necesita `type` ni `durationMinutes`; el backend clasifica el tipo segun fecha/hora y reglas.

## Pendientes despues del cierre del MVP

1. Lago / Side quest conectado a persistencia, API, scoring y UI.
2. Insignias / achievements persistidos o calculados.
3. Historial/calendario por participante y pareja.
4. Admin pro: auditoria visible, filtros, edicion/correccion guiada.
5. Autenticacion real si el reto sale del modo confianza.
6. Evidencias opcionales.
7. Premios y cierre del reto.
8. Exportaciones o resumen para compartir.

## Specs y planes

- Spec visual vigente: `docs/superpowers/specs/2026-06-16-gymchall-doodle-fit-visual-refresh.md`.
- Spec historica de UI Sega: `docs/superpowers/specs/2026-06-16-gymchall-ui-mvp-design.md`.
- Spec historica/intermedia de check-in y fichas: `docs/superpowers/specs/2026-06-16-checkin-fichas-ui-rules.md`.
- Plan de esta consolidacion: `docs/superpowers/plans/2026-06-16-mvp-consolidation-docs.md`.
