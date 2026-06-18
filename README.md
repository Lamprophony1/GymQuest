# GymChall

Repositorio del MVP tecnico de la app de desafio fitness por parejas.

- Nombre de desarrollo: `GymChall`.
- Nombre visible temporal en la app: `Proyecto RM`.
- Reto activo: `Reto septiembre 2026`.
- UI actual: mobile-first, Doodle Fit / Clean Gym, con energia de juego competitivo pero mas moderno y saludable que el arcade Sega inicial.

## Estado Actual

El MVP ya permite usar el reto desde una SPA React conectada a una API .NET con SQLite local. Tambien esta publicado para uso real en:

```text
https://rm.crg-dev.com
```

El deploy actual corre en una VM Ubuntu del datacenter mediante Docker, GitHub Actions self-hosted runner, GHCR y Cloudflare Tunnel.

Incluye:

- Dashboard mobile-first con ranking, puntos, rachas y coins disponibles.
- Ranking general y ranking semanal por pareja.
- Check-in automatico por fecha/hora, con deteccion de 5am, recuperacion del mismo dia y recuperacion de fin de semana.
- Coins disponibles y aplicables desde Check-in:
  - `Health coin`: cobertura completa por salud.
  - `Commit coin`: cobertura completa por compromiso obligatorio.
  - `Flex coin`: valida entrenamiento fuera de horario o recuperacion como si fuera 5am.
- Health coin mensual automatica para participantes con genero femenino, no acumulable.
- Admin para crear participantes, crear parejas, otorgar coins e invalidar check-ins o coins.
- Admin con calendario semanal de check-ins por participante, filtros por estado/tipo, columna de jugador fija y anulacion directa de marcas validas.
- Login por participante con PIN corto en modo produccion, cookie HttpOnly y switch participante/admin para Rafa.
- Perfil privado desde el icono de usuario, con peso, altura, IMC calculado y cambio de PIN propio.
- En desarrollo se puede conservar el selector de usuario con `VITE_AUTH_MODE=dev-selector`.
- Motor de scoring con puntos base, bonus diario, bonus semanal, Perfect streak y Gym streak.
- Persistencia SQLite local y seed inicial.
- Header, bottom nav e inputs ajustados para mobile Safari.

No incluye todavia:

- Lago / side quest conectado a API y UI.
- Motor persistido de insignias o achievements.
- Evidencias/fotos.
- Notificaciones.
- Premios y distribucion auditada.
- Exportaciones o resumen WhatsApp.

## Reglas Principales

El ranking principal es por pareja. Cada pareja suma puntos individuales de sus integrantes, bonus diarios y bonus semanales.

Prioridad competitiva:

1. Check-in dentro de ventana 5am.
2. Coin valida que cubre el dia.
3. Recuperacion del mismo dia.
4. Recuperacion de fin de semana.
5. Lago, pendiente para una fase posterior.

La API sigue siendo la fuente de verdad para puntajes y rankings. El frontend solo registra acciones y muestra los resultados calculados.

## Estructura

```text
src/
  GymChall.Api/             API HTTP minima
  GymChall.Application/     Casos de uso, scoring y reglas de app
  GymChall.Domain/          Reglas puras de dominio y scoring
  GymChall.Infrastructure/  EF Core, SQLite y seed local
tests/
  GymChall.Api.Tests/
  GymChall.Application.Tests/
  GymChall.Domain.Tests/
  GymChall.Infrastructure.Tests/
web/
  src/                      SPA React mobile-first
docs/
  planning/                 Estado, reglas y modelo actual
  superpowers/specs/        Specs historicas y specs vigentes
  superpowers/plans/        Planes de implementacion
```

## Desarrollo Local

Backend:

```powershell
& '.\.tools\dotnet\dotnet.exe' restore GymChall.sln
& '.\.tools\dotnet\dotnet.exe' build GymChall.sln
& '.\.tools\dotnet\dotnet.exe' test GymChall.sln
& '.\.tools\dotnet\dotnet.exe' run --project src/GymChall.Api/GymChall.Api.csproj --urls http://127.0.0.1:5020
```

Auth backend:

- Desarrollo: `Auth:Mode=DevSelector` mantiene endpoints abiertos para el selector local.
- Produccion: `Auth:Mode=PinLogin` exige cookie de sesion.
- Bootstrap inicial de Rafa: configurar `Auth:BootstrapAdminPin` con un PIN de 4 a 6 digitos.
- Opcional: `Auth:DataProtectionKeysPath` define donde guardar llaves de cookie; por defecto usa `.data-protection-keys/`.

Frontend:

```powershell
cd web
$env:PATH = (Resolve-Path '..\.tools\node-v24.16.0-win-x64').Path + ';' + $env:PATH
& '..\.tools\node-v24.16.0-win-x64\npm.cmd' install
& '..\.tools\node-v24.16.0-win-x64\npm.cmd' run dev
```

Auth frontend:

- Desarrollo por defecto: selector local.
- Produccion por defecto: pantalla de login PIN.
- Override: `VITE_AUTH_MODE=dev-selector` o `VITE_AUTH_MODE=pin-login`.

URLs locales:

- Frontend: `http://127.0.0.1:5173`
- Backend API: `http://127.0.0.1:5020`
- Health check: `GET http://127.0.0.1:5020/health`

## Verificacion

Backend:

```powershell
& '.\.tools\dotnet\dotnet.exe' test GymChall.sln --no-restore
```

Frontend tests:

```powershell
cd web
& '..\.tools\node-v24.16.0-win-x64\node.exe' '.\node_modules\vitest\vitest.mjs' run --pool=threads
```

Frontend build:

```powershell
cd web
$env:PATH = (Resolve-Path '..\.tools\node-v24.16.0-win-x64').Path + ';' + $env:PATH
& '..\.tools\node-v24.16.0-win-x64\npm.cmd' run build
```

## API MVP

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
GET  /api/rankings/general?throughDate=YYYY-MM-DD
GET  /api/rankings/weeks?throughDate=YYYY-MM-DD
GET  /api/rankings/weeks/{weekStartDate}?throughDate=YYYY-MM-DD
```

`POST /api/tokens/full-coverage` se mantiene por compatibilidad con el primer MVP. El flujo actual preferido es otorgar coins con admin y aplicarlas con `POST /api/tokens/{id}/use`.

## Docs Relevantes

- Estado actual del MVP: `docs/planning/mvp-current-state.md`
- Roadmap post-MVP: `docs/planning/post-mvp-roadmap.md`
- Reglas de dominio: `docs/planning/domain-rules.md`
- Motor de puntajes: `docs/planning/scoring-engine.md`
- Modelo de datos: `docs/planning/data-model.md`
- Despliegue CI/CD en VM + Cloudflare: `docs/deployment/github-cloudflare-vm.md`
- Visual vigente: `docs/superpowers/specs/2026-06-16-gymchall-doodle-fit-visual-refresh.md`
- Check-in y coins: `docs/superpowers/specs/2026-06-16-checkin-fichas-ui-rules.md`
- Login PIN: `docs/superpowers/specs/2026-06-17-pin-login-auth-design.md`
