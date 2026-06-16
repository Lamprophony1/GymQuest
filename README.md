# GymChall

App para administrar el desafio fitness de parejas "Reto Parejas - Rumbo a Septiembre".

Estado actual: MVP tecnico con backend .NET, motor de puntajes, API minima y SPA mobile-first en React/Vite. La UI usa una estetica arcade competitiva inspirada en TypeUI Sega, adaptada a tablero de puntos por parejas.

## Objetivo

Gestionar un reto entre parejas donde el ranking principal es por pareja, los puntos individuales se combinan con bonus compartidos, y las fichas validas cubren motivos reales sin castigar rachas ni desempates.

## Principios del producto

- Prioridad competitiva: 5am > recuperacion mismo dia > recuperacion fin de semana > lago.
- El puntaje debe poder recalcularse desde registros base.
- Los totales precalculados son cache regenerable, no fuente de verdad.
- Cada cambio administrativo importante debe dejar auditoria.
- Las reglas configurables deben estar centralizadas.
- El motor de puntajes debe tener tests unitarios antes de construir UI compleja.

## Estructura inicial

```text
src/
  GymChall.Api/             API HTTP minima
  GymChall.Application/     Casos de uso futuros
  GymChall.Domain/          Reglas puras de dominio y scoring
  GymChall.Infrastructure/  Persistencia futura
tests/
  GymChall.Domain.Tests/    Tests unitarios del dominio
web/
  src/                     SPA React mobile-first
docs/
  decisions/              Propuestas y decisiones de arquitectura
  planning/               Reglas, modelo, motor y fases
  superpowers/specs/      Specs formales cuando el diseno quede aprobado
```

## Desarrollo local

Comandos base:

```powershell
dotnet restore GymChall.sln
dotnet build GymChall.sln
dotnet test GymChall.sln
dotnet run --project src/GymChall.Api/GymChall.Api.csproj --urls http://localhost:5020
```

Health check:

```text
GET http://localhost:5020/health
```

## Frontend local

Instalar dependencias y levantar Vite:

```powershell
cd web
npm install
npm run dev
```

Frontend: `http://127.0.0.1:5173`
Backend API: `http://localhost:5020`

Run both apps in separate terminals:

```powershell
dotnet run --project src/GymChall.Api/GymChall.Api.csproj --urls http://localhost:5020
cd web
npm run dev
```

Verificacion frontend:

```powershell
cd web
npm test
npm run build
```

## Backend MVP Core

Endpoints iniciales:

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
GET  /api/admin/check-ins?limit=50
GET  /api/admin/tokens?limit=50
GET  /api/rankings/general?throughDate=2026-06-15
GET  /api/rankings/weeks?throughDate=2026-06-26
GET  /api/rankings/weeks/2026-06-15?throughDate=2026-06-26
```

La API crea la base local `gymchall.db` y carga el reto inicial si no existe.
