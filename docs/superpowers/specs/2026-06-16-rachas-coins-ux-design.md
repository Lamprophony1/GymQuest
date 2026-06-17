# Rachas y Coins UX Design

## Objetivo

Actualizar el lenguaje visual y textual del dashboard para que las rachas y los comodines sean entendibles sin conocer las reglas internas. El patron mantiene la direccion Doodle Fit / Clean Gym actual: mobile-first, alto contraste, botones y tarjetas con sombra dura, colores saludables, y feedback de juego sin volver al arcade retro pesado.

## Cambios aprobados

- Mostrar nombres de pareja como `Rafa y Clari` en la UI, aunque el backend conserve `Rafa + Clari`.
- Reemplazar el tag interno `combo` por `Perfect streak`.
- Reemplazar el tag suelto `gym` por `Gym streak`.
- Separar ambas rachas en el scoreboard y en Power board.
- Cambiar el concepto visible de `fichas` a `Coins`.
- Mostrar inventario por tipo de coin: `Health coin`, `Commit coin`, `Flex coin`.
- Mostrar el bonus semanal como estado potencial cuando aun no fue otorgado: `+12 pts si finalizan la semana`.

## UX

El scoreboard prioriza puntos, rachas e inventario. La tarjeta de puntos usa la pareja como contexto directo. La tarjeta de rachas muestra dos mini paneles lado a lado, cada uno con icono y contador, para que no parezca un tag tecnico.

Power board queda como estado explicativo: una tarjeta para Perfect streak, una para Gym streak, una para zona roja, una para Lago side quest/coins y una para bonus semanal.

El ranking conserva badges compactos de alta lectura visual: solo icono + contador. El significado queda en `aria-label` para accesibilidad y para no competir con futuras insignias. `Perfect streak` usa el icono simple de fuego para sostener lectura inmediata sin sumar ruido visual.

## Coins

Las coins siguen usando los datos actuales de `fullCoverageTokens`.

- `Health coin`: medallon verde con icono de salud, exonera entrenamiento.
- `Commit coin`: medallon dorado con escudo/check, usando dorado real y no amarillo limon; exonera compromiso obligatorio.
- `Flex coin`: medallon aqua/azul con reloj, permite validar otro horario o recuperacion como 5am.

## TypeUI

El MCP de TypeUI quedo agregado y el login CLI finalizo correctamente, pero el transporte MCP vivo de esta sesion siguio devolviendo OAuth requerido. El ajuste se implementa con TypeUI fundamentals: iconos reconocibles, medallones limpios, jerarquia clara y textos auxiliares mas discretos.
