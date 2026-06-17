# GymChall UI MVP Mobile-First Design

> Estado historico: esta spec documenta la primera direccion Sega / Scoreboard Arcade. Quedo supersedida por `docs/superpowers/specs/2026-06-16-gymchall-doodle-fit-visual-refresh.md` y por el estado actual en `docs/planning/mvp-current-state.md`.

## Contexto

GymChall ya tiene backend Fase 1 para un MVP usable: API minima, persistencia SQLite local, seed inicial, endpoints de participantes/parejas/check-ins/fichas/rankings e invalidacion auditada. La UI todavia no existe.

La UI MVP debe permitir usar el reto desde celular sin duplicar reglas de puntaje en frontend. El backend sigue siendo la fuente de verdad para rankings y datos del reto.

## Decisiones aprobadas

- La UI sera una SPA web responsive dentro del mismo repo.
- No habra autenticacion real en este bloque.
- La app usara un selector de identidad participante/admin en modo confianza.
- El enfoque visual aprobado es **Scoreboard Arcade Moderno**.
- TypeUI `Sega` sera la base visual.
- El admin MVP incluira listados recientes de check-ins y fichas para poder invalidar registros por ID desde la UI.

## Objetivos

- Crear una experiencia mobile-first clara para registrar actividad diaria.
- Mostrar el ranking general por pareja como pantalla principal.
- Mostrar ranking semanal como motivacion secundaria.
- Dar acceso rapido a check-in 5am, recuperacion mismo dia y ficha de cobertura total.
- Dar una pantalla admin simple para crear participantes, crear parejas e invalidar registros recientes.
- Mantener una estetica gaming retro/arcade competitiva, legible y no infantil.

## No objetivos

- Login real, passwords, sesiones o permisos fuertes.
- Recuperaciones de fin de semana vinculadas.
- Ficha de mover horario.
- Lago conectado a endpoints y rankings.
- Evidencias/fotos.
- Premios.
- Notificaciones.
- Insignias persistidas o motor completo de achievements.
- Graficos complejos.
- Edicion administrativa completa de registros.

## Lenguaje visual

La UI usara TypeUI `Sega` como base, adaptada a una app diaria y mobile-first. La inspiracion visual es arcade retro general, sin copiar marcas, logos, personajes, layouts registrados ni referencias directas a Sega, Pac-Man, Tetris u otras IP.

Principios visuales:

- Pixel typography solo para titulos cortos, labels de score, badges y estados.
- Tipografia sans legible para cuerpos de texto, formularios y admin.
- Bordes duros, esquinas 0px o muy bajas, sombras offset y botones chunky.
- Paneles tipo scoreboard para rankings, puntos y rachas.
- Colores fuertes usados por significado, no como decoracion constante.
- Dashboard y ranking pueden ser mas expresivos.
- Formularios, ficha y admin deben ser mas limpios y tranquilos.

Mapeo de conceptos:

- Puntos: score grande.
- Ranking: arcade leaderboard.
- Rachas: combo streaks.
- Fichas: power-ups.
- Semana perfecta: perfect week / flawless bonus.
- Zona roja: warning state.
- Lago futuro: side quest.
- Insignias futuras: achievements.

## Paleta y densidad

La base debe ser de alto contraste, con fondo oscuro controlado y paneles alternados claros/oscuros. Los acentos se reservan para estados:

- Amarillo: bonus, semana perfecta, logro.
- Verde: check-in valido, accion exitosa.
- Rojo: zona roja, warning, invalidacion.
- Cyan/azul: ranking, side quest, estados informativos.
- Gris/negro/blanco: estructura, formularios y admin.

La UI no debe verse como carnaval visual. En mobile, cada pantalla debe tener un punto focal claro y no mas de uno o dos acentos fuertes simultaneos.

## Arquitectura frontend

La app sera una SPA en el mismo repo, ubicada en `web/`. Esta carpeta queda separada de los proyectos .NET y consume la API por HTTP.

Stack recomendado:

- React + Vite + TypeScript.
- CSS modular o stylesheet global organizado por tokens/componentes.
- Fetch API o cliente liviano propio para la API.
- Local state con hooks; no hace falta estado global complejo.
- `localStorage` para recordar la identidad seleccionada.

La API local esperada en desarrollo es `http://localhost:5020`.

## Setup TypeUI

TypeUI MCP esta activo y encontro el design system `Sega`.

Antes de generar UI con TypeUI en la implementacion, el proyecto debe instalar skills locales:

1. Instalar fundamentos desde la raiz del proyecto:

```powershell
npx skills add https://github.com/bergside/typeui --skill typeui-fundamentals
```

2. Instalar exactamente un design system activo: `typeui-design-system` con slug `sega`.

Restricciones:

- Instalar solo en scope del proyecto.
- No usar `--global` ni `-g`.
- No extraer ni instalar en directorios globales de usuario.
- Mantener exactamente un design system TypeUI activo.
- Evitar otras skills de generacion visual que puedan contradecir TypeUI.

Nota de entorno: al momento de esta spec, `npx` y `skills` no estaban disponibles en `PATH` de esta maquina. El plan de implementacion debe contemplar instalar/configurar Node y la CLI necesaria si siguen ausentes.

## Navegacion

### Inicio / Selector

Primera pantalla. Permite elegir participante o entrar como admin.

Debe mostrar:

- Nombre del reto.
- Estado activo.
- Lista de participantes.
- Boton de entrada admin.

La identidad elegida se guarda en `localStorage` y se puede cambiar desde la app.

### App Shell Mobile

La navegacion principal en mobile sera por tabs inferiores o barra inferior:

- Dashboard.
- Ranking.
- Check-in.
- Ficha.
- Admin, visible o destacada cuando la identidad es admin.

En desktop/tablet, la misma navegacion puede convertirse en sidebar o top nav simple, pero mobile manda.

## Pantallas

### Dashboard Participante

Pantalla principal del participante.

Contenido:

- Header compacto con nombre del reto y participante activo.
- Ranking general resumido con podio o top 3.
- Pareja propia destacada, si existe.
- Score grande de la pareja.
- Indicadores de racha/estado semanal.
- Acciones rapidas: `5AM`, `Recuperacion`, `Ficha`.
- Bloque breve de ranking semanal.

Tratamiento visual: el mas arcade de toda la app. Puede usar paneles de score, hard shadows, labels pixel y feedback de combo.

### Ranking

Muestra ranking general y ranking semanal.

Contenido:

- Toggle o tabs: General / Semana.
- Lista de parejas ordenadas.
- Puntos grandes y posicion.
- Streaks disponibles: morning streak y gym streak.
- Estado vacio cuando todavia no hay puntos.

El ranking general es la vista competitiva principal. El semanal se presenta como motivacional.

### Cargar Check-In

Formulario simple para participante.

Campos:

- Participante activo, precargado.
- Tipo: `5AM` o `Recuperacion mismo dia`.
- Fecha/hora sugerida con posibilidad de ajustar.
- Duracion en minutos, default 45.
- Notas opcionales.

Al guardar:

- POST `/api/check-ins`.
- Mostrar feedback de exito.
- Refrescar rankings.

El formulario debe ser claro y sobrio. El arcade aparece en botones y microcopy corto, no en exceso visual.

### Cargar Ficha

Formulario para ficha de cobertura total.

Campos:

- Participante activo.
- Fecha cubierta.
- Motivo: salud, periodo, viaje laboral, viaje obligatorio, otro aprobado.
- Notas opcionales.
- Admin asignador: si la identidad actual es admin, usar esa persona; si no, usar `challenge.adminParticipantId`.

Al guardar:

- POST `/api/tokens/full-coverage`.
- Mostrar feedback de power-up aplicado.
- Refrescar rankings.

### Admin

Pantalla simple con secciones o tabs:

- Participantes.
- Parejas.
- Registros recientes.

Participantes:

- Listar participantes.
- Crear participante.

Parejas:

- Listar parejas con integrantes.
- Crear pareja con dos participantes distintos.

Registros recientes:

- Listar check-ins recientes.
- Listar fichas recientes.
- Invalidar check-in o ficha con motivo opcional.

El admin debe ser mas utilitario y menos intenso. Usar botones claros, tablas/listas legibles y estados de peligro para invalidar.

## Backend adicional requerido

El backend actual permite invalidar por ID, pero no tiene endpoints dedicados para listar registros recientes. Para que el admin sea usable, este bloque agrega:

```text
GET /api/admin/check-ins?limit=50
GET /api/admin/tokens?limit=50
```

### `GET /api/admin/check-ins`

Devuelve registros recientes de check-ins.

Campos recomendados por item:

- `id`
- `participantId`
- `participantName`
- `activityDate`
- `occurredAt`
- `type`
- `status`
- `durationMinutes`
- `notes`
- `createdAt`

Debe ordenar por `createdAt` descendente. `limit` default 50, maximo 100.

### `GET /api/admin/tokens`

Devuelve fichas recientes.

Campos recomendados por item:

- `id`
- `participantId`
- `participantName`
- `targetDate`
- `reasonCategory`
- `status`
- `notes`
- `createdAt`

Debe ordenar por `createdAt` descendente. `limit` default 50, maximo 100.

## Endpoints existentes usados por UI

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
GET  /api/rankings/general?throughDate=YYYY-MM-DD
GET  /api/rankings/weeks?throughDate=YYYY-MM-DD
GET  /api/rankings/weeks/{weekStartDate}?throughDate=YYYY-MM-DD
```

## Data flow

Inicio:

- Cargar `challenge`, `participants`, `couples`.
- Si hay identidad guardada en `localStorage`, usarla.
- Si no hay identidad, mostrar selector.

Dashboard:

- Consultar ranking general con `throughDate` de hoy.
- Consultar ranking semanal con `throughDate` de hoy.
- Identificar pareja propia usando `couples`.

Check-in/ficha:

- Enviar POST.
- Mostrar feedback.
- Refrescar ranking general y semanal.

Admin:

- Cargar participantes y parejas.
- Cargar check-ins/fichas recientes.
- Invalidar por ID.
- Refrescar registros y rankings.

## Estados y errores

Cada pantalla debe contemplar:

- Loading skeleton o panel de carga.
- Estado vacio.
- Error de API con mensaje claro.
- Exito con feedback breve.
- Validacion de campos requerida antes del POST.

Los mensajes deben ser utiles y cortos. Ejemplo: `Check-in cargado`, `Ficha aplicada`, `Registro invalidado`.

## Accesibilidad y mobile

- Mobile-first desde 360px de ancho.
- Botones tactiles grandes.
- Texto legible; no usar pixel font para parrafos.
- Contraste suficiente en todos los estados.
- No depender solo del color para warning/success.
- Evitar texto apretado dentro de botones.
- Navegacion usable con teclado en desktop.
- Formularios con labels visibles.

## Testing

Backend:

- Tests de repositorio para listar check-ins y fichas recientes.
- Tests de servicio para exponer listados admin.
- Tests de API para los dos nuevos endpoints.
- Verificar que invalidacion sigue removiendo registros del ranking.

Frontend:

- Tests unitarios con Vitest para cliente API y transformaciones simples.
- Smoke tests de render para pantallas principales con React Testing Library.
- Validacion manual mobile/desktop con backend local.

Verificacion esperada:

```powershell
dotnet build GymChall.sln
dotnet test GymChall.sln
```

Mas comandos frontend segun el stack definido en el plan.

## Criterios de aceptacion

- La app permite elegir participante/admin sin login real.
- El dashboard mobile muestra ranking general, pareja propia y acciones rapidas.
- El ranking general y semanal consumen la API existente.
- Un participante puede cargar check-in 5am o recuperacion mismo dia.
- Un participante/admin puede cargar ficha de cobertura total.
- El admin puede crear participantes y parejas.
- El admin puede ver check-ins/fichas recientes e invalidarlos.
- La UI usa TypeUI `Sega` adaptado a Scoreboard Arcade Moderno.
- Formularios y admin son legibles y no saturados.
- No se copian marcas, logos, personajes ni IP de juegos reales.
- El repo queda con spec y plan claros antes de implementar.
