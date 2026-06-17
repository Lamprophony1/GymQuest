# GymChall - Diseno funcional draft

> Estado historico: este draft fue la base inicial del dominio. El estado vigente del MVP esta en `docs/planning/mvp-current-state.md`.

Estado: aprobado para planificacion de implementacion. El diseno visual/UX se definira antes de construir el frontend real.
Fecha: 2026-06-15.

## 1. Resumen del dominio

GymChall administra un reto fitness por parejas llamado "Reto Parejas - Rumbo a Septiembre". El ranking principal es por pareja. Cada pareja suma puntos individuales, bonus diarios, bonus semanales y puntos de lago. Las fichas validas cubren motivos reales e incontrolables sin castigar la racha 5am/oficial, bonus semanal ni desempates.

El objetivo del producto no es medir alto rendimiento deportivo, sino sostener disciplina, asistencia 5am y motivacion compartida hasta el viaje de septiembre.

## 2. Reglas principales cerradas

La prioridad competitiva es: 5am, recuperacion del mismo dia, recuperacion de fin de semana, lago.

El bonus diario de pareja solo se activa si ambos fueron a las 5am o estan cubiertos por ficha valida. La recuperacion sin ficha suma puntos individuales, pero no da el +1 de pareja.

El sistema maneja racha 5am y racha de gym por separado. La recuperacion tarde/noche cuenta para racha gym, pero no para racha 5am. La recuperacion de fin de semana sin ficha solo completa el conteo semanal y no preserva la racha del dia perdido.

Las reglas detalladas viven en `docs/planning/domain-rules.md`.

## 3. Decisiones cerradas

Las decisiones respondidas por Rafa viven en `docs/planning/open-questions.md`.

Resumen:

- Ficha de periodo por mes calendario.
- Admin puede corregir cualquier registro con auditoria.
- Semanas parciales se evaluan solo por dias habiles dentro del reto.
- Lago en pareja exige ambos en la misma actividad.
- Registros funcionan por confianza, sin validacion normal.
- Premios pueden cambiar con auditoria.
- No se planean cambios de pareja, pero se pueden agregar parejas nuevas.

## 4. Modelo de datos recomendado

El modelo separa hechos base de derivados. Hechos base: challenge, settings, participantes, parejas, check-ins, fichas, recuperaciones, lago, evidencia opcional, premios y auditoria. Derivados: score runs, daily scores, weekly scores, rankings, rachas e insignias.

El detalle vive en `docs/planning/data-model.md`.

## 5. Motor de puntajes

El motor debe ser determinista y recalculable. Cada ejecucion genera un `ScoreRun` con snapshot de reglas. Los totales guardados son cache regenerable, no fuente de verdad.

El algoritmo vive en `docs/planning/scoring-engine.md`.

## 6. Casos de prueba importantes

Los tests minimos se concentran en:

- Puntaje 5am lunes y martes-viernes.
- Bonus diario solo con 5am/ficha valida.
- Fichas de cobertura total.
- Fichas de mover horario cumplidas/no cumplidas.
- Recuperacion tarde sin bonus diario ni racha 5am.
- Recuperacion fin de semana sin preservar racha del dia perdido.
- Doble conteo de dias perdidos.
- Limite de recuperaciones de fin de semana.
- Lago de pareja en la misma actividad.
- Lago elegible y limite semanal.
- Bonus semanal sobre dias habiles dentro del reto.
- Desempates.
- Correcciones admin auditadas.

## 7. Pantallas necesarias

MVP:

- Login simple.
- Dashboard principal.
- Registro/check-in.
- Ranking general y semanal.
- Vista de pareja.
- Fichas.
- Admin basico.

Fases posteriores:

- Calendario.
- Evidencias opcionales avanzadas.
- Auditoria.
- Insignias.
- Rachas.
- Zona Roja.
- Resumen WhatsApp.
- Exportaciones.

## 8. MVP por fases

Las fases estan en `docs/planning/mvp-phases.md`.

## 9. Stack sugerido

La recomendacion actual esta en `docs/decisions/0001-stack-and-architecture-proposal.md`: ASP.NET Core API, modulo de dominio .NET testeable, PostgreSQL, frontend React/Next.js mobile-first y API REST.

## 10. Riesgos

- Doble conteo entre ficha, check-in y recuperacion.
- Confundir racha 5am con racha gym.
- Correcciones posteriores sin auditoria o sin recalculo.
- Semanas parciales mal evaluadas.
- Lago de pareja cargado como actividades separadas.
- Mezclar reglas de puntaje dentro de la UI.

## 11. Estructura futura del proyecto

Propuesta para cuando pasemos a implementacion:

```text
src/
  GymChall.Api/
  GymChall.Application/
  GymChall.Domain/
  GymChall.Infrastructure/
tests/
  GymChall.Domain.Tests/
  GymChall.Application.Tests/
web/
  gymchall-web/
docs/
```

## 12. Gate de implementacion

El diseno funcional y el stack recomendado quedan aprobados para escribir el plan de implementacion. Antes de construir pantallas finales, se hara una pasada especifica de diseno visual/UX mobile-first.
