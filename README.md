# GymChall

App para administrar el desafio fitness de parejas "Reto Parejas - Rumbo a Septiembre".

Estado actual: planificacion inicial. Todavia no hay implementacion de codigo ni scaffold de app; primero se esta cerrando dominio, reglas, modelo de datos, motor de puntajes, MVP y arquitectura.

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
docs/
  decisions/              Propuestas y decisiones de arquitectura
  planning/               Reglas, modelo, motor y fases
  superpowers/specs/      Specs formales cuando el diseno quede aprobado
```

## Siguiente gate

Antes de crear el backend/frontend, hay que aprobar el diseno funcional y cerrar las ambiguedades criticas en `docs/planning/open-questions.md`.
