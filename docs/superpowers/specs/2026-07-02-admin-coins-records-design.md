# Admin coins y registros: diseno visual y funcional

Fecha: 2026-07-02
Estado: listo para revision

## Problema

La administracion actual de coins y marcaciones exige saltar entre la pantalla de `Coins`, el menu admin y listas de registros. Ver las coins como lista reciente es tedioso porque no responde rapido a la pregunta principal del admin: que coins tiene cada player y que accion necesito tomar sobre esa persona.

Ademas, en `Admin > Registros`, el panel de check-ins empuja el scroll de toda la app. El calendario ya usa un scroller interno y se siente mejor para revisar datos largos sin perder contexto.

## Objetivos

- Convertir la pantalla `Coins` en un tablero de administracion por player.
- Mostrar, por cada player activo, cuantos coins disponibles tiene de cada tipo.
- Permitir asignar coins desde la card del player, usando modal con confirmacion.
- Permitir quitar coins disponibles desde el detalle del player, tambien con confirmacion.
- Mantener el audit trail de `Admin > Registros`, pero hacer que el box de check-ins tenga scroll propio.
- Reutilizar las APIs actuales cuando sea suficiente: `grantToken` para asignar e `invalidateToken` para quitar/rechazar coins disponibles.

## No objetivos

- No cambiar reglas de scoring ni reglas de uso de coins.
- No agregar acciones rapidas `+/-`; se descartan por riesgo de toque accidental.
- No reemplazar el calendario admin.
- No crear un sistema nuevo de permisos.
- No cambiar la semantica del audit trail: registros recientes sigue existiendo para revision historica.

## Enfoque elegido

Opcion A: cards por player.

Cada player se representa como una card con:

- Avatar o identificador visual.
- Nombre.
- Chips con conteo por tipo de coin disponible: Health, Commit, Flex y especiales como Albirroja cuando existan.
- Boton primario `Asignar coin`.
- Seccion de detalle con las coins disponibles reales, agrupadas por tipo o listadas en formato compacto.
- Accion `Quitar` por coin disponible, siempre con confirmacion.

Este enfoque prioriza el flujo mental del admin: "voy a Clari, veo que tiene, le asigno o le quito". Es mas natural que un tablero por tipo de coin y menos frio que una tabla densa.

## Arquitectura de UI

### Pantalla `Coins`

La pantalla actual `TokenScreen` deja de ser solo un formulario de otorgar coin. Pasa a ser una pantalla de administracion con:

1. Resumen superior
   - Total de players activos.
   - Total de coins disponibles.
   - Total de coins especiales disponibles, si aplica.

2. Grid/lista de player cards
   - Mobile: una columna.
   - Desktop/tablet: dos columnas si el espacio lo permite.
   - Cada card mantiene altura flexible, sin truncar informacion clave.

3. Modal `Asignar coin`
   - Se abre desde la card del player.
   - Player queda fijo y visible, no editable.
   - Campos: variante, tipo, motivo, notas.
   - Si la variante es especial (por ejemplo Albirroja), aplica los defaults existentes.
   - Botones: `Cancelar` y `Confirmar asignacion`.
   - En submit exitoso, cierra modal, refresca data y muestra feedback.

4. Modal `Quitar coin`
   - Se abre desde una coin disponible concreta.
   - Muestra player, tipo de coin y notas si existen.
   - Botones: `Cancelar` y `Quitar coin`.
   - La accion usa `invalidateToken` sobre el token disponible. El backend ya convierte un token disponible invalidado en `Rejected`.

### Admin > Registros

La seccion mantiene dos listas: check-ins y coins recientes.

Cambio visual:

- El articulo/lista de `Check-ins` tendra un contenedor interno con `max-height` y `overflow: auto`.
- El scroll interno debe tener `overscroll-behavior: contain`, foco visible y padding suficiente.
- El panel de `Coins` recientes puede mantener la lista actual por ahora, ya que la administracion primaria pasa a la pantalla `Coins`.

## Datos y transformaciones

Fuente de datos principal:

- `challenge.fullCoverageTokens` para inventario por player, porque contiene los tokens no rechazados y permite distinguir `Available` vs `Applied`.
- `participants` para armar cards de players activos.
- `recentTokens` se conserva para audit trail.

Reglas de conteo:

- Contar solo tokens con `status === Available`.
- Agrupar por `participantId`.
- Agrupar visualmente por identidad de coin:
  - `specialCode` si existe.
  - Si no hay especial, usar `type`.
- Mostrar siempre chips de tipos base con conteo 0: Health, Commit y Flex.
- Ocultar especiales con conteo 0.

Quitar coin:

- Solo se puede quitar un token `Available`.
- Tokens `Applied` no se quitan desde el tablero de coins; su administracion queda en calendario/registros porque afecta cobertura de dias.

## Componentes propuestos

- `TokenScreen`
  - Orquesta resumen, cards y modales.
  - Conserva el nombre de componente/ruta actual para evitar cambios de navegacion innecesarios.

- `PlayerCoinCard`
  - Props: player, availableTokens, busyAction, onAssign, onRemove.
  - Renderiza conteos y acciones.

- `AssignCoinDialog`
  - Form modal controlado.
  - Reutiliza labels y defaults del formulario actual.

- `RemoveCoinDialog`
  - Confirmacion destructiva enfocada en un token.

- CSS nuevo en `styles.css`
  - Clases para grid de cards, resumen, lista interna de tokens y modales.
  - Mantener radio visual del sistema actual, sin meter cards dentro de cards.

## Interaccion y estados

Asignar coin:

1. Admin toca `Asignar coin` en un player.
2. Se abre modal con player fijo.
3. Admin elige variante/tipo/motivo/notas.
4. Toca `Confirmar asignacion`.
5. Boton entra en loading y queda deshabilitado.
6. Exito: cerrar modal, refrescar, mostrar `Coin asignada.`
7. Error: mantener modal abierto y mostrar mensaje cerca del formulario.

Quitar coin:

1. Admin toca `Quitar` sobre una coin disponible.
2. Modal confirma player y coin.
3. Admin confirma.
4. Exito: cerrar modal, refrescar, mostrar `Coin quitada.`
5. Error: mantener modal abierto y mostrar mensaje.

Registros:

- El scroller de check-ins permite revisar filas largas sin mover el header ni la seccion completa de admin.

## Accesibilidad

- Usar `button` real para acciones.
- Modal con `role="dialog"`, `aria-modal="true"` y titulo asociado.
- Al abrir modal, foco inicial en el primer campo accionable o en el titulo si es confirmacion.
- Escape y `Cancelar` cierran modal.
- Al cerrar, devolver foco al boton que abrio el modal.
- Acciones destructivas usan texto visible, no solo color.
- Targets tactiles minimos de 44px.
- Estados de loading deshabilitan el boton y mantienen feedback textual.
- Scroll interno con `tabIndex=0` y `:focus-visible`.

## Testing

Frontend:

- Render smoke: pantalla `Coins` muestra cards por player y conteos por tipo.
- Render smoke: `Asignar coin` abre modal con player preseleccionado y envia `GrantTokenRequest` correcto.
- Render smoke: variante especial conserva defaults actuales.
- Render smoke: `Quitar coin` abre confirmacion y llama `onInvalidateToken` con el token correcto.
- Render smoke: tokens aplicados no muestran accion de quitar en el tablero.
- Design/CSS test: check-ins recientes tiene scroller interno y no depende del scroll de la app.

Backend:

- No se esperan endpoints nuevos para el primer corte.
- Si los datos actuales no alcanzan durante implementacion, se evaluara un endpoint agregado en plan separado.

## Riesgos y mitigaciones

- Riesgo: `challenge.fullCoverageTokens` no trae tokens rechazados, pero para inventario eso es correcto.
- Riesgo: la pantalla `Coins` crece mucho si hay muchos players. Mitigacion: grid responsive y cards compactas; busqueda/filtro queda fuera de scope inicial.
- Riesgo: quitar una coin aplicada desde el nuevo tablero podria romper mentalmente la cobertura diaria. Mitigacion: solo quitar disponibles en `Coins`; aplicadas se administran desde calendario/registros.
- Riesgo: modales sin foco correcto en mobile. Mitigacion: test manual con teclado y viewport mobile.

## Criterios de aceptacion

- Admin puede ver en `Coins` una card por player activo con conteos de coins disponibles.
- Admin puede asignar una coin a un player desde su card con popup y confirmacion.
- Admin puede quitar una coin disponible desde el mismo menu con popup y confirmacion.
- El flujo actual de asignacion de Albirroja sigue funcionando.
- `Admin > Registros > Check-ins` scrollea internamente como ventana individual.
- No hay acciones `+/-` instantaneas.
- Tests frontend relevantes pasan.
