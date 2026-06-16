# Plan: Check-in, fichas y ajustes visuales RM

## Contexto

Spec: `docs/superpowers/specs/2026-06-16-checkin-fichas-ui-rules.md`

## Pasos

1. Pruebas de dominio/API
   - Agregar cobertura para clasificacion automatica de check-ins por fecha/hora.
   - Agregar cobertura para fichas de salud/compromiso como cobertura completa.
   - Agregar cobertura para ficha de cambio de horario como entrenamiento valido cuando existe check-in recuperado.

2. Backend
   - Expandir tipos de check-in para recuperacion de fin de semana.
   - Expandir tipos/estados de fichas para inventario disponible/aplicado.
   - Simplificar request de check-in: fecha/hora y target opcional de recuperacion.
   - Clasificar check-ins automaticamente en el servicio.
   - Agregar otorgamiento de fichas admin.
   - Agregar uso de fichas por participante.
   - Otorgar ficha mensual de salud no acumulable a participantes femeninas.
   - Actualizar scoring para distinguir cobertura por entrenamiento, recuperacion, ficha total y cambio de horario.

3. Frontend
   - Reemplazar nombre visible por `Proyecto RM`.
   - Compactar header sticky al scrollear.
   - Corregir color de titulos en tarjetas del panel.
   - Cambiar reto a `Reto septiembre 2026`.
   - Mostrar lider o empate en scoreboard.
   - Renombrar menu a `Check-in`.
   - Simplificar formulario de check-in.
   - Mostrar selector de recuperacion en fin de semana.
   - Mostrar uso de fichas disponibles dentro de Check-in.
   - Limitar pantalla de fichas a admin y convertirla en otorgamiento.

4. Verificacion
   - Ejecutar tests backend.
   - Ejecutar tests frontend.
   - Revisar build/render basico si aplica.
   - Commit final con cambios implementados.
