# ADR 0001 - Stack y arquitectura propuesta

Estado: propuesta.

## Decision recomendada

Construir GymChall como una app web responsive con:

- Backend: ASP.NET Core Web API.
- Dominio: libreria .NET separada para reglas y motor de puntajes.
- Base de datos: PostgreSQL para entorno real; SQLite opcional solo para desarrollo local temprano.
- Frontend: React o Next.js mobile-first.
- API: REST.
- Auth MVP: login simple con roles admin/participant.
- Timezone base: America/Asuncion.

## Motivo

El dominio tiene reglas, recalculos, auditoria y muchos casos borde. Conviene que la logica de puntajes viva en un modulo testeable y no dentro de componentes UI o handlers de API. .NET encaja bien para separar dominio, aplicacion, infraestructura y tests.

## Alternativas consideradas

### Next.js full-stack + Prisma

Ventaja: arranque rapido y menos proyectos.
Riesgo: la logica de negocio puede mezclarse con rutas/pantallas si no se disciplina la arquitectura.

### NestJS + React

Ventaja: buena estructura modular en TypeScript.
Riesgo: para reglas numericas y pruebas de dominio, .NET sigue siendo mas comodo en este contexto si ya se acepta ese stack.

## Consecuencia

La primera implementacion deberia priorizar el motor de puntajes y sus tests. La UI debe consumir resultados calculados, no duplicar reglas.
