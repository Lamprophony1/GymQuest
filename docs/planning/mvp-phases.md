# MVP por fases

## Fase 0 - Planificacion y base tecnica

Estado: completada.

- Repo git inicial.
- Documentacion de dominio, datos y motor de puntajes.
- Decisiones de stack.
- Preguntas criticas cerradas.
- Planes de implementacion iniciales.

## Fase 1 - Backend MVP

Estado: completada.

Incluye:

- Challenge activo con seed inicial.
- Participantes y parejas.
- Settings de puntaje.
- Check-ins persistidos.
- Coins/tokens persistidos.
- Ranking general por pareja.
- Ranking semanal por pareja.
- Invalidaciones administrativas auditadas.
- Tests de dominio, aplicacion, infraestructura y API.

## Fase 2 - App mobile-first MVP

Estado: completada para uso interno.

Incluye:

- SPA React/Vite en `web/`.
- Selector de identidad por confianza.
- Dashboard mobile-first.
- Ranking general y semanal.
- Check-in con clasificacion automatica por horario.
- Recuperacion de fin de semana con dia objetivo.
- Uso de coins desde Check-in.
- Admin para crear participantes, crear parejas, otorgar coins e invalidar registros.
- UI Doodle Fit / Clean Gym.
- Tests smoke de frontend y build Vite.

## Fase 3 - Reglas y UX refinadas

Estado: completada en el MVP actual.

Incluye:

- Health, Commit y Flex coins.
- Health coin mensual automatica para participantes con genero femenino, no acumulable.
- Perfect streak y Gym streak visibles.
- Coins preservan rachas segun su cobertura.
- Bonus semanal sin adelantar puntos futuros.
- Leaderboard con rachas compactas e icon-led.
- Header mobile refinado.
- Lenguaje visible `Coins` en vez de `fichas`.

## Fase 4 - Proximo bloque recomendado

Estado: pendiente.

Opcion recomendada: Lago / Side quest.

Alcance probable:

- Persistir actividades de lago.
- Endpoints de lago.
- Integracion de puntos de lago al ranking.
- UI para registrar actividad de lago.
- Tests de dominio, API y frontend.

## Fase 5 - Gamificacion avanzada

Estado: pendiente.

- Insignias historicas.
- Insignias de estado.
- Zona Roja mas accionable.
- Ranking de lunes.
- Ranking de lago.
- Ranking de recuperaciones para estadisticas/desempates.
- Remontada contra semana anterior.

## Fase 6 - Experiencia social y cierre

Estado: pendiente.

- Resumen semanal para WhatsApp.
- Notificaciones.
- Perfil de pareja.
- Graficos.
- Exportacion CSV/PDF.
- Evidencias opcionales.
- Premios y cierre del reto.
- Autenticacion real si deja de alcanzar el modo confianza.
