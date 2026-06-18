# Siguiente paso: UI MVP mobile-first

> Estado historico: este documento describia el proximo paso antes de construir la UI. La UI MVP ya existe. Para el estado actual, usar `docs/planning/mvp-current-state.md`.

## Estado actual

Documento historico. La UI MVP ya fue implementada, el login PIN ya existe y el MVP esta publicado en `https://rm.crg-dev.com`.

Para el estado vigente usar:

- `docs/planning/mvp-current-state.md`
- `docs/planning/mvp-phases.md`
- `docs/planning/post-mvp-roadmap.md`

La Fase 1 backend esta cerrada para un MVP usable.

Ya existe:

- Solucion .NET con proyectos `Api`, `Application`, `Domain`, `Infrastructure` y tests.
- Motor de puntajes de dominio con reglas base.
- Persistencia SQLite local con seed inicial del reto.
- Endpoints para challenge, settings, participantes, parejas, check-ins, fichas, invalidacion admin y rankings.
- Ranking general por pareja como ranking principal.
- Ranking semanal como ranking secundario/motivacional.
- Invalidacion administrativa auditada, sin flujo complejo de edicion.

Ultimos commits relevantes:

```text
9bd3396 feat: complete phase 1 backend endpoints
924f3d8 feat: add admin repository operations
b6b8225 feat: add weekly ranking projection
f56f486 docs: agregar plan cierre backend fase 1
e5576f2 docs: agregar spec cierre backend fase 1
```

Verificacion al cierre del backend:

```powershell
dotnet build GymChall.sln
dotnet test GymChall.sln
```

Resultado esperado actual: build sin warnings/errores y 62 tests pasando.

## Proximo bloque recomendado historico

El siguiente bloque de este documento era una **spec de UI MVP mobile-first** antes de implementar frontend.

Ese bloque ya esta cerrado. No usar esta seccion como plan vigente.

Objetivo del bloque: definir la experiencia minima que permita usar el reto desde una app/pagina mobile-first consumiendo la API existente.

## Alcance recomendado para la UI MVP

### Vista participante historica

- Ver ranking general por pareja.
- Ver ranking semanal como motivacion secundaria.
- Registrar check-in 5am o recuperacion del mismo dia.
- Registrar ficha simple de cobertura total, hoy reemplazada visualmente por coins.
- Ver pareja propia y estado basico del reto.

### Vista admin simple historica

- Ver participantes.
- Crear participantes.
- Ver parejas.
- Crear parejas.
- Invalidar check-ins o fichas cargadas por error, con motivo opcional.

### Navegacion inicial historica

Como todavia no habia autenticacion, la UI podia arrancar con un selector simple de participante/admin para operar en modo confianza.

Decision actual: produccion usa login PIN; desarrollo conserva el selector.

## Fuera de alcance para ese bloque historico

- Recuperaciones de fin de semana vinculadas.
- Ficha de mover horario.
- Lago avanzado.
- Evidencias.
- Premios.
- Notificaciones.
- Insignias.
- Graficos complejos.
- Autenticacion real, ya implementada despues.

## Primer paso de la proxima sesion

Iniciar brainstorming/spec de UI:

1. Revisar `docs/planning/mvp-phases.md`.
2. Revisar `docs/planning/domain-rules.md`.
3. Revisar endpoints en `README.md`.
4. Proponer 2 o 3 enfoques de UI.
5. Definir pantallas, flujos y contrato de datos.
6. Guardar spec en `docs/superpowers/specs/YYYY-MM-DD-gymchall-ui-mvp-design.md`.
7. Despues de aprobar la spec, escribir plan de implementacion.

## Decision pendiente inicial historica

La primera decision de producto para la proxima sesion:

```text
¿La UI MVP debe empezar como una SPA web responsive en el mismo repo, o como una app separada?
```

Decision tomada: **SPA web responsive en el mismo repo**.

## Endpoints disponibles para UI

```text
GET  /health
GET  /api/challenge
GET  /api/challenge/settings
GET  /api/participants
POST /api/participants
GET  /api/couples
POST /api/couples
POST /api/check-ins
POST /api/tokens/full-coverage
POST /api/admin/check-ins/{id}/invalidate
POST /api/admin/tokens/{id}/invalidate
GET  /api/rankings/general?throughDate=2026-06-15
GET  /api/rankings/weeks?throughDate=2026-06-26
GET  /api/rankings/weeks/2026-06-15?throughDate=2026-06-26
```

## Comando util para continuar

```powershell
dotnet run --project src/GymChall.Api/GymChall.Api.csproj --urls http://localhost:5020
```

Health check:

```text
http://localhost:5020/health
```
