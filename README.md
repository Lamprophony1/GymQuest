# GymChall

App para administrar el desafio fitness de parejas "Reto Parejas - Rumbo a Septiembre".

Estado actual: base tecnica inicial implementada. Ya existe una solucion .NET con motor de puntajes de dominio, tests unitarios y API minima con health check. La UI mobile-first se disena y construye en una fase posterior.

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
dotnet run --project src/GymChall.Api/GymChall.Api.csproj
```

Health check:

```text
GET http://localhost:5020/health
```

## Siguiente gate

La base del motor de puntajes ya esta lista. El siguiente bloque funcional deberia cubrir persistencia, casos de uso de aplicacion, endpoints reales y luego una pasada de diseno visual/UX antes del frontend.
