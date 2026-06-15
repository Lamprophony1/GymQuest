# GymChall - Diseno funcional draft

Estado: draft, no aprobado para implementacion.
Fecha: 2026-06-15.

## 1. Resumen del dominio

GymChall administra un reto fitness por parejas llamado "Reto Parejas - Rumbo a Septiembre". El ranking principal es por pareja. Cada pareja suma puntos individuales, bonus diarios, bonus semanales y puntos de lago. Las fichas validas cubren motivos reales e incontrolables sin castigar racha, bonus semanal ni desempates.

El objetivo del producto no es medir alto rendimiento deportivo, sino sostener disciplina, asistencia 5am y motivacion compartida hasta el viaje de septiembre.

## 2. Reglas principales

La prioridad competitiva es: 5am, recuperacion del mismo dia, recuperacion de fin de semana, lago. Las actividades externas saludables no suman puntos competitivos.

Las reglas detalladas viven en `docs/planning/domain-rules.md`.

## 3. Ambiguedades a cerrar

Las preguntas criticas viven en `docs/planning/open-questions.md`. La mas importante es definir si una recuperacion cuenta como dia cubierto para bonus diario y/o racha, o si solo suma puntos individuales y ayuda al bonus semanal.

## 4. Modelo de datos recomendado

El modelo separa hechos base de derivados. Hechos base: challenge, settings, participantes, parejas, check-ins, fichas, recuperaciones, lago, evidencia y auditoria. Derivados: score runs, daily scores, weekly scores, rankings, rachas e insignias.

El detalle vive en `docs/planning/data-model.md`.

## 5. Motor de puntajes

El motor debe ser determinista y recalculable. Cada ejecucion genera un `ScoreRun` con snapshot de reglas. Los totales guardados son cache regenerable, no fuente de verdad.

El algoritmo vive en `docs/planning/scoring-engine.md`.

## 6. Casos de prueba importantes

Los tests minimos se concentran en:

- Puntaje 5am lunes y martes-viernes.
- Fichas de cobertura total.
- Fichas de mover horario cumplidas/no cumplidas.
- Recuperaciones tarde y fin de semana.
- Doble conteo de dias perdidos.
- Limite de recuperaciones de fin de semana.
- Lago elegible y limite semanal.
- Bonus semanal.
- Desempates.
- Fichas validas sin penalizacion.

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
- Evidencias avanzadas.
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
- Reglas ambiguas de cobertura/racha/bonus diario.
- Cambios historicos de parejas.
- Correcciones posteriores al cierre semanal.
- Evidencia y validacion manual demasiado pesada.
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

## 12. Gate de aprobacion

Antes de crear backend/frontend, aprobar:

1. Politica de bonus diario.
2. Politica de rachas con recuperaciones.
3. Period token por mes calendario o rolling.
4. Manejo de semanas parciales.
5. Stack recomendado.
