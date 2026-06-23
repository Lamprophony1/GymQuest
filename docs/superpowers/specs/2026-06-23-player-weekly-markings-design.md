# Player Weekly Markings Design

## Objetivo

Agregar una vista semanal de marcaciones para players con el mismo formato visual del calendario semanal admin, pero en modo solo lectura. La vista debe mostrar todos los players, solo eventos validos, e incluir tanto check-ins validos como coins usadas.

## Decisiones aprobadas

- La nueva vista visible para players se llama `Marcaciones`.
- `Marcaciones` es una tab principal en la navegacion inferior.
- El layout debe ser igual al calendario semanal actual del admin: filas por jugador y columnas por dia de semana.
- Players ven todos los participantes, no solo su pareja.
- Players no pueden invalidar ni modificar registros desde esta vista.
- Players ven solo eventos validos.
- Admins tambien deben ver coins usadas dentro del calendario semanal.
- Las coins usadas deben aparecer dentro del filtro `Validos`.

## Datos

Se agrega un endpoint de calendario semanal readonly:

```text
GET /api/calendar/weekly?from=YYYY-MM-DD&to=YYYY-MM-DD
```

El endpoint es accesible a usuarios autenticados. Devuelve eventos unificados:

- Check-ins validos dentro del rango.
- Coins aplicadas dentro del rango.

No devuelve check-ins rechazados para players. La vista admin puede seguir usando su endpoint admin para registros rechazados cuando el filtro lo pida, pero debe incorporar eventos de coin aplicada dentro del calendario.

## Modelo de evento

El frontend consume eventos semanales con estos campos:

- `id`
- `participantId`
- `participantName`
- `activityDate`
- `occurredAt`
- `kind`: `0` para `CheckIn`, `1` para `Coin`
- `label`
- `status`
- `checkInType`
- `coinType`
- `notes`

Para check-ins, `occurredAt` es la hora real del registro y `label` corresponde al tipo visible (`5AM`, `Recuperacion dia`, `Recuperacion finde`).

Para coins aplicadas, `activityDate` es `targetDate`, `occurredAt` puede ser `null`, `status` es `Applied`, y `label` corresponde al tipo visible (`Health coin`, `Commit coin`, `Flex coin`).

## UI

Se extrae el calendario semanal del admin a un componente compartido:

```text
WeeklyMarkingsCalendar
```

El componente recibe participantes, semana activa, eventos, filtros y callbacks opcionales. Cuando esta en modo readonly no renderiza acciones destructivas.

### Player

- Nueva tab inferior `Marcaciones`.
- Muestra el calendario semanal completo.
- Mantiene los mismos filtros visuales del calendario admin; la data disponible para players sigue siendo solo valida/aplicada.
- Sin botones de invalidacion.
- Incluye chips de coins aplicadas.

### Admin

- Conserva el tab `Calendario`.
- Mantiene filtros de estado y tipo.
- El filtro `Validos` muestra check-ins validos y coins aplicadas.
- El filtro de tipo agrega `Coins`.
- Check-ins validos conservan boton de invalidar.
- Coins aplicadas conservan boton de invalidar en el calendario admin.
- Invalidar una coin aplicada la devuelve a `Available` para que vuelva al player y deja de aparecer en el calendario semanal.

## Estados vacios

Si una celda no tiene eventos visibles, muestra `Sin marca`, igual que el calendario actual.

Si una semana completa no tiene eventos visibles, la grilla sigue mostrando jugadores y dias para mantener consistencia.

## Fuera de alcance

- Mostrar coins disponibles no usadas.
- Mostrar eventos rechazados a players.
- Cambiar reglas de scoring.
- Cambiar permisos admin existentes.

## Verificacion esperada

- Backend: el endpoint semanal readonly devuelve check-ins validos y coins aplicadas.
- Backend/API: players autenticados pueden leer el endpoint readonly.
- Frontend: players ven la tab `Marcaciones`.
- Frontend: players no ven botones de invalidar.
- Frontend: admins ven coins aplicadas dentro del calendario y dentro del filtro `Validos`.
- Frontend/API: admins pueden invalidar una coin aplicada desde el calendario y la coin vuelve al player.
