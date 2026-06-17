# GymChall Doodle Fit Visual Refresh Spec

Fecha: 2026-06-16
Estado: aprobado para ejecucion
Estado actual: visual vigente del MVP. Complementar con `docs/planning/mvp-current-state.md`.

## Decision

GymChall adopta un patron visual general llamado **Doodle Fit**:

- La estructura, ritmo, formas y tono salen de la opcion 1 validada: doodle moderno, organico, competitivo y mobile-first.
- La paleta sale de la opcion 2 validada: verdes fitness, fondo limpio, acentos lima/aqua y alerta coral.
- La app deja de apoyarse en el look Sega/arcade retro fuerte como identidad principal.
- Se conserva el lenguaje de juego competitivo, pero tratado como fitness moderno: scores, streaks, coins, badges, ranking y warning states.

El MCP oficial de TypeUI para obtener la skill `doodle` quedo bloqueado por OAuth durante la exploracion, por lo que este patron se implementa como sistema inspirado en la direccion visual aprobada con TypeUI/fundamentals y los mockups locales validados.

## Intent

La app debe sentirse como un desafio fitness por parejas con energia de juego, no como una consola antigua ni como una app infantil.

Prioridades:

1. Mobile-first.
2. Legible en celular.
3. Fitness vivo y saludable.
4. Competitivo y divertido.
5. Menos retro que Sega, sin perder feedback tipo juego.

## Visual Language

### Mood

- Fresco, saludable, social y competitivo.
- Doodle/sticker controlado, no caricaturesco.
- Mas cercano a una app fitness gamificada actual que a un arcade cabinet.
- Energia concentrada en dashboard, ranking, status, badges y logros.
- Formularios, uso de coins y admin panel usan una version mas limpia del mismo sistema.

### Shape

- Superficies con esquinas organicas y generosas.
- Sombras solidas tipo sticker para elementos de juego: score cards, rankings, botones importantes.
- Bordes oscuros moderados para conservar personalidad y lectura.
- Menos grilla pixelada; mas tarjetas suaves, compactas y tactiles.

### Typography

- Headings y datos fuertes: `Space Grotesk`.
- Body, controles y soporte: `Nunito`.
- No usar `VT323`, pixel-fonts fuertes ni monospace como identidad principal.
- Titulos de app/dashboard contenidos: maximo visual aproximado de 28px en headings de panel, dejando la escala grande para datos de score.
- Numeros de score pueden ser mas grandes porque son datos primarios, no headings decorativos.

## Color System

Tokens base:

- Ink: `#141615`
- Muted text: `#64716a`
- Page background: `#f8fbf5`
- Surface: `#ffffff`
- Soft green surface: `#eff9ef`
- Primary gym green: `#0f6f48`
- Fresh green: `#1aa866`
- Lime accent: `#f4ff5f`
- Aqua accent: `#79e7ff`
- Coral warning/danger: `#ff6f61`

Usage:

- Primary green dirige acciones, estados activos y score principal.
- Fresh green se usa para superficies fitness y estados positivos.
- Lime se reserva para highlights competitivos, posiciones, badges y acciones secundarias destacadas.
- Aqua se usa para coins, side quests e informacion.
- Coral se usa para zona roja, errores e invalidaciones.
- Fondos deben mantenerse claros y respirables. No saturar todas las pantallas.

## Component Direction

### Dashboard

- Debe ser la pantalla mas expresiva.
- Header/hero con fondo verde profundo, tarjetas de score en superficies claras y sombras sticker.
- Score panels grandes, claros y scannables.
- Quick actions con botones tactiles grandes.

### Ranking

- Mantener lectura de leaderboard por parejas.
- Posicion como ficha/badge de ranking.
- Pareja activa resaltada con soft green.
- Badges de combo y gym como achievements compactos.

### Power Board / Status

- Combo streak: energia con lime/warning.
- Zona roja: coral + icono + texto, nunca solo color.
- Lago side quest: aqua.
- Perfect week/flawless bonus: green/achievement.

### Forms

- Version limpia del sistema.
- Inputs visibles sobre superficie clara, con bordes verdes suaves.
- Botones principales siguen el sistema sticker, pero sin recargar el panel.
- Labels legibles y compactos.

### Admin

- Densidad mayor y menos decoracion.
- Mini stats y registros con bordes suaves, sombras mas contenidas.
- Acciones destructivas usan coral y mantienen iconografia clara.

### Navigation

- Bottom nav mobile-first, tactil y estable.
- Estado activo con green/lime o green/white de alto contraste.
- Iconos lucide existentes, sin emojis como sustituto de iconos.

## Accessibility And UX Requirements

- Touch targets de al menos 44px.
- Botones sin wrapping de label.
- Focus visible con outline de alto contraste.
- Estado de color siempre acompanado por texto, icono o forma.
- Evitar dependencia de hover; active/focus deben comunicar feedback.
- Mantener `prefers-reduced-motion` para reducir transformaciones.
- Texto de cuerpo minimo 16px; soporte minimo 14px.
- No usar `letter-spacing` negativo.
- No introducir una paleta de una sola familia: el verde domina, pero lime, aqua, coral, tinta y blanco sostienen contraste y variedad.

## Implementation Scope

Cambiar el patron visual global implementado hasta ahora:

- `web/src/styles.css`
- test de sistema visual para evitar regresar a Sega/VT323/purpura viejo
- documentacion de spec y plan

No cambiar en esta etapa:

- reglas de negocio
- estructura de pantallas React
- API client
- backend
- copy funcional salvo que sea imprescindible para legibilidad

## Acceptance Criteria

- La UI ya no usa `VT323`.
- La UI ya no usa el purpura Sega viejo `#4503ff` como token de marca.
- El CSS define los tokens Doodle Fit / Clean Gym aprobados.
- Dashboard, ranking, status, formularios, admin y bottom nav se ven dentro del mismo sistema.
- Los tests frontend pasan.
- El build frontend pasa.
