# Estado actual del MVP

## Resumen

`GymChall` es el nombre tecnico del repo. La app visible se muestra como `Proyecto RM` y el reto activo como `Reto septiembre 2026`.

El MVP actual ya es una app usable para registrar check-ins, usar coins, ver rankings por pareja y administrar correcciones basicas. El backend .NET + SQLite calcula el puntaje; el frontend React/Vite solo registra acciones y muestra resultados.

Tambien esta publicado para uso real en `https://rm.crg-dev.com`, servido por una imagen Docker desplegada desde GitHub Actions hacia una VM con Cloudflare Tunnel.

## Producto visible

- Estilo aprobado: Doodle Fit / Clean Gym.
- Sensacion buscada: fitness moderno, competitivo y divertido, con lenguaje de juego pero sin volver al arcade Sega inicial.
- Mobile-first manda sobre desktop.
- Nombres de pareja en UI: `Rafa y Clari`, `Obelar y Chachi`, `Cieli y Naldo`.
- Nombre visible temporal: `Proyecto RM`.

## Funcionalidades implementadas

- Login por participante con PIN corto en produccion.
- Selector de identidad por confianza disponible para desarrollo.
- Cookie HttpOnly para sesion web.
- Rafa entra como participante y puede cambiar entre modo participante y modo admin desde el icono de usuario.
- Perfil privado del participante desde el icono de usuario:
  - peso y altura editables;
  - IMC calculado automaticamente;
  - categoria IMC referencial: bajo peso, peso saludable, sobrepeso u obesidad;
  - cambio de PIN propio con PIN actual.
- Avatares sticker por participante:
  - se muestran en el header y en `Mi perfil`;
  - se sirven desde `web/public/avatars`;
  - si falta un avatar, la UI vuelve a iniciales.
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
- Admin puede crear participantes, crear parejas, otorgar coins, invalidar check-ins, invalidar coins y asignar/resetear PINs.
- Admin tiene calendario semanal de check-ins por participante:
  - semana navegable;
  - filtro inicial `Validos`;
  - filtro por tipo `5am`, `Recup. dia`, `Recup. finde`;
  - columna de jugador fija y compacta al scroll horizontal;
  - encabezado de dias fijo al scroll vertical;
  - anulacion directa de check-ins validos.
- Auditoria basica por invalidaciones administrativas.
- Seed inicial del reto y participantes.
- Publicacion CI/CD:
  - GitHub Actions;
  - GHCR;
  - self-hosted runner `gymquest-dc-vm`;
  - Docker Compose en `/opt/gymquest`;
  - Cloudflare Tunnel `gymquest-dc-pti`;
  - hostname `rm.crg-dev.com`.
- Tests de dominio, aplicacion, infraestructura, API y frontend.

## Cambios recientes incorporados

- Perfil privado y cambio de PIN propio estan publicados.
- Avatares por participante quedaron cargados como assets estaticos.
- El frontend dejo de enviar `throughDate` para rankings normales; el backend calcula rankings live segun `America/Asuncion`.
- Perfect streak y Gym streak tienen ventanas de vencimiento diferenciadas.
- El deploy directo a `main` dispara CI/CD y publica si todas las pruebas pasan.

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

Una vez otorgado, el bonus semanal impacta el ranking semanal y tambien el ranking general/scoreboard. El estado "en juego" solo se muestra como proyeccion y no suma puntos.

### Rachas

- `Perfect streak`: racha de pareja donde ambos sostienen cobertura tipo 5am/perfecta.
- `Gym streak`: racha de pareja donde ambos sostienen dia de gym cubierto.
- Las rachas se evaluan con fecha/hora de `America/Asuncion`.
- Perfect streak cae por el dia actual recien despues de las 06:30.
- Gym streak cae por un dia sin cobertura recien al dia siguiente.
- Health y Commit coins salvan la cobertura del dia.
- Flex coin salva la cobertura y rachas cuando se usa con entrenamiento fuera de horario o recuperacion.
- Recuperacion del mismo dia sin coin cuenta para Gym streak, pero no para Perfect streak.
- Recuperacion de fin de semana sin coin completa semana, pero no salva la racha del dia perdido.

## API actual

```text
GET  /health
GET  /api/auth/login-options
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
POST /api/auth/change-pin
GET  /api/challenge
GET  /api/challenge/settings
GET  /api/participants
GET  /api/profile
PUT  /api/profile
POST /api/participants
GET  /api/couples
POST /api/couples
POST /api/check-ins
POST /api/admin/tokens
POST /api/tokens/{id}/use
POST /api/tokens/full-coverage
POST /api/admin/check-ins/{id}/invalidate
POST /api/admin/tokens/{id}/invalidate
POST /api/admin/participants/{id}/pin
GET  /api/admin/check-ins?limit=50
GET  /api/admin/check-ins/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD
GET  /api/admin/tokens?limit=50
GET  /api/rankings/general
GET  /api/rankings/weeks
GET  /api/rankings/weeks/{weekStartDate}
```

Los rankings aceptan parametros opcionales:

- `throughDate=YYYY-MM-DD`: calcula una fecha historica fija.
- `asOf=YYYY-MM-DDTHH:mm:ssZ`: simula la hora live para pruebas o debug.

Si no se envia ningun parametro, el backend usa la hora actual convertida al timezone del reto.

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

1. Side quest / cardio opcional conectado a persistencia, API, scoring y UI.
2. Insignias / achievements persistidos o calculados.
3. Admin pro: auditoria visible completa, edicion/correccion guiada y mejores acciones de recuperacion.
4. Hardening operativo: backups automaticos, monitoreo, rotacion de PINs y runbook de restore.
5. Evidencias opcionales.
6. Premios y cierre del reto.
7. Exportaciones o resumen para compartir.
8. Mejoras PWA/mobile: icono instalable, manifest, cache control y feedback offline.

## Specs y planes

- Spec visual vigente: `docs/superpowers/specs/2026-06-16-gymchall-doodle-fit-visual-refresh.md`.
- Spec historica de UI Sega: `docs/superpowers/specs/2026-06-16-gymchall-ui-mvp-design.md`.
- Spec historica/intermedia de check-in y fichas: `docs/superpowers/specs/2026-06-16-checkin-fichas-ui-rules.md`.
- Spec de login PIN: `docs/superpowers/specs/2026-06-17-pin-login-auth-design.md`.
- Plan de esta consolidacion: `docs/superpowers/plans/2026-06-16-mvp-consolidation-docs.md`.
- Roadmap post-MVP vigente: `docs/planning/post-mvp-roadmap.md`.
