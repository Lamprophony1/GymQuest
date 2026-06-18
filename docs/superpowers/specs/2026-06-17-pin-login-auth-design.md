# Proyecto RM PIN Login Auth Design

Fecha: 2026-06-17
Estado: implementado en el MVP publicado

> Estado actual: esta spec fue ejecutada. Produccion usa login por participante con PIN, cookie HttpOnly y switch participante/admin para Rafa. Para el estado completo, usar `docs/planning/mvp-current-state.md`.

## Objetivo

Publicar el MVP para uso real con usuarios del reto, reemplazando el selector de identidad por un login de participante + PIN en produccion, sin perder el selector rapido en desarrollo.

El login debe ser simple para el grupo, mobile-first, coherente con la UI Doodle Fit / Clean Gym, y suficientemente seguro para evitar que una persona registre acciones como otra o acceda a acciones admin sin permiso.

## Decisiones aprobadas

- Produccion entra directo a una pantalla de login.
- Login de produccion:
  - desplegable de participantes activos;
  - PIN corto de 4 a 6 digitos;
  - teclado numerico custom adaptado a la UI;
  - soporte adicional para teclado fisico en desktop.
- Desarrollo conserva el selector actual para moverse rapido entre usuarios.
- Rafa siempre es admin por rol, pero al iniciar sesion entra en modo participante.
- Rafa puede switchear entre modo participante y modo admin desde el icono de usuario/perfil.
- No hay boton separado de "Admin" en la pantalla de login.

## Principios

- Separar identidad, rol y modo activo:
  - Sesion: quien esta logueado.
  - Rol: que permisos tiene.
  - Modo activo: como esta usando la app ahora.
- El frontend no debe ser fuente de verdad de permisos.
- La API no debe confiar en IDs de participante enviados por el cliente para acciones sensibles.
- El flujo debe seguir siendo rapido: login de pocos segundos, sin friccion de email ni recuperacion de password en esta fase.
- No guardar PIN en texto plano.

## Modos por ambiente

### Development

Modo recomendado: `dev-selector`.

- Mantiene el selector actual de participantes.
- Al seleccionar Rafa, entra como participante.
- Si el participante seleccionado tiene rol admin, aparece switch de modo en perfil.
- No requiere PIN.
- La API puede aceptar cabecera/dev identity solo en ambiente Development, o seguir usando el flujo actual durante tests locales.

### Production

Modo recomendado: `pin-login`.

- La app muestra login si no hay sesion.
- Al autenticar, la app obtiene el usuario actual desde backend.
- La UI inicia siempre en modo participante.
- Si el usuario tiene rol admin, habilita switch visual a modo admin.
- Endpoints admin requieren rol admin validado por backend.

## Experiencia de login

Pantalla:

- Marca: `Proyecto RM`.
- Subtexto: `Reto septiembre 2026`.
- Campo select: participante activo.
- PIN visual: puntos grandes, por ejemplo `filled filled empty empty empty empty`.
- Keypad custom:
  - 1 2 3
  - 4 5 6
  - 7 8 9
  - borrar 0 entrar
- El teclado del telefono no debe aparecer por defecto si se usa el keypad custom.
- En desktop, tambien se aceptan teclas `0-9`, `Backspace`, `Enter`.
- El boton Entrar se habilita desde 4 digitos y acepta hasta 6.
- Mensaje de error breve: `PIN incorrecto`.
- Feedback visual de error sin mover demasiado la pantalla.

No se muestran textos largos de instrucciones dentro de la app. La pantalla debe sentirse como parte del sistema Doodle Fit: limpia, competitiva y con detalles game-like sobrios.

## Sesion

Recomendacion: cookie segura `HttpOnly`.

- `POST /api/auth/login` valida participante + PIN y crea sesion.
- `GET /api/auth/me` devuelve el usuario autenticado.
- `POST /api/auth/logout` cierra sesion.
- La cookie no es legible por JavaScript.
- En produccion debe usar `Secure`.
- `SameSite` se define segun despliegue:
  - `Lax` si frontend y API comparten dominio.
  - `None` + `Secure` si frontend y API quedan en dominios distintos.

Si el despliegue final complica cookies cross-site, se puede cambiar a token bearer, pero la preferencia de MVP es cookie `HttpOnly`.

## Datos de autenticacion

Agregar a participante o tabla relacionada:

- PIN hash.
- PIN salt si el algoritmo lo requiere.
- Fecha de actualizacion de PIN.
- Conteo o registro de intentos fallidos recientes.
- Fecha de bloqueo temporal si aplica.

El PIN nunca se guarda ni se devuelve en texto plano.

Hash recomendado:

- ASP.NET `PasswordHasher` aplicado al PIN, o PBKDF2 equivalente.
- Comparacion usando verificador de hash, no comparacion directa.

## Bootstrap de PINs

Para el primer despliegue:

- Rafa debe tener un PIN inicial cargado por variable de entorno o configuracion local segura.
- El seed de produccion no debe dejar PINs reales hardcodeados en el repo.
- El admin puede setear/resetear PINs de participantes desde Admin panel.

Flujo admin inicial:

1. Rafa inicia sesion con su PIN inicial.
2. Entra como participante.
3. Desde icono de usuario cambia a modo admin.
4. En Admin panel setea o resetea PINs de los demas.

## Switch de modo

El icono de usuario/perfil abre un menu compacto.

Para participante normal:

- Ver nombre.
- Abrir `Mi perfil`.
- Cerrar sesion.

Para admin:

- Ver nombre.
- Abrir `Mi perfil`.
- Cambiar a modo admin.
- Cambiar a modo participante.
- Cerrar sesion.

Reglas:

- Tras login, modo activo = participante.
- Tras refresh, se puede conservar modo activo en `localStorage`, pero solo si el usuario sigue teniendo rol admin.
- Si un usuario no admin intenta acceder a tabs admin, vuelve a dashboard.
- El backend valida permisos aunque el frontend o localStorage sean manipulados.

## Endpoints propuestos

Publicos:

```text
GET  /api/auth/login-options
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
POST /api/auth/change-pin
GET  /health
```

Protegidos:

```text
GET  /api/challenge
GET  /api/challenge/settings
GET  /api/participants
GET  /api/couples
POST /api/check-ins
POST /api/tokens/{id}/use
GET  /api/rankings/general
GET  /api/rankings/weeks
GET  /api/rankings/weeks/{weekStartDate}
```

Admin:

```text
POST /api/participants
POST /api/couples
POST /api/admin/tokens
POST /api/admin/check-ins/{id}/invalidate
POST /api/admin/tokens/{id}/invalidate
GET  /api/admin/check-ins
GET  /api/admin/tokens
POST /api/admin/participants/{id}/pin
```

Perfil privado:

```text
GET /api/profile
PUT /api/profile
```

En modo produccion el participante sale de la sesion. En modo desarrollo se puede pasar `participantId` para probar desde el selector local.

`POST /api/tokens/full-coverage` queda como endpoint legacy. En produccion debe quedar protegido o retirarse del flujo visible.

## Contratos

### Login options

Devuelve participantes activos para el desplegable:

```json
[
  {
    "id": "guid",
    "displayName": "Rafa",
    "username": "rafa"
  }
]
```

No necesita devolver rol.

### Login

Request:

```json
{
  "participantId": "guid",
  "pin": "123456"
}
```

Response:

```json
{
  "participant": {
    "id": "guid",
    "displayName": "Rafa",
    "username": "rafa",
    "role": 1,
    "gender": "male",
    "active": true
  }
}
```

### Me

Response igual a login. Si no hay sesion, devuelve `401`.

### Reset PIN

Request admin:

```json
{
  "pin": "123456"
}
```

Reglas:

- Solo admin autenticado.
- PIN de 4 a 6 digitos.
- Solo numeros.

### Cambiar PIN propio

Request participante:

```json
{
  "currentPin": "123456",
  "newPin": "2468"
}
```

Reglas:

- Requiere PIN actual correcto.
- PIN nuevo de 4 a 6 digitos, solo numeros.
- Resetea intentos fallidos al completarse.

## Cambios en requests existentes

En produccion, el backend debe derivar actor desde sesion:

- Check-in:
  - `participantId` debe coincidir con usuario autenticado, o directamente eliminarse del contrato nuevo.
  - `createdByParticipantId` debe salir de la sesion.
- Uso de coin:
  - `participantId` y `usedByParticipantId` deben coincidir con usuario autenticado.
- Otorgar coin:
  - `assignedByAdminId` debe salir de la sesion admin.
- Invalidar:
  - `actorParticipantId` debe salir de la sesion admin.

Para reducir riesgo, el primer plan puede mantener campos antiguos en DTOs pero validarlos contra la sesion y sobrescribir el actor internamente.

## Seguridad MVP

- PIN hasheado.
- Cookie `HttpOnly`.
- Rate limit por participante/IP:
  - despues de 5 fallos, bloqueo suave de 1 minuto;
  - el mensaje no debe revelar si el usuario existe o si el PIN fallo.
- Logout visible desde perfil.
- Endpoints admin con validacion de rol.
- Endpoints de escritura validan que el usuario autenticado sea el actor correcto.
- CORS/credentials configurados si frontend y API se publican separados.

## UI y estados

Estados del login:

- Cargando participantes.
- Sin participantes activos.
- Participante seleccionado sin PIN ingresado.
- Enviando.
- Error de PIN.
- Bloqueo temporal.
- Error de API.

El keypad debe tener dimensiones estables, botones tactiles grandes y no desplazar la pantalla al marcar numeros.

## Testing

Backend:

- Login exitoso con PIN valido.
- Login falla con PIN incorrecto.
- PIN invalido por formato.
- PIN se guarda hasheado.
- `GET /api/auth/me` requiere sesion.
- Check-in usa usuario autenticado.
- Admin endpoints rechazan usuario no admin.
- Admin puede resetear PIN.
- Rate limit/bloqueo suave.

Frontend:

- En modo `pin-login`, muestra login y no selector dev.
- En modo `dev-selector`, mantiene selector.
- Keypad ingresa, borra y envia PIN.
- Teclado fisico funciona.
- Login exitoso muestra dashboard participante.
- Rafa entra como participante y puede cambiar a admin desde perfil.
- Usuario no admin no ve modo admin.
- Logout vuelve a login.

## No objetivos de este bloque

- Recuperacion de PIN por email/WhatsApp.
- Invitaciones automaticas.
- Login con OAuth.
- 2FA.
- Gestion avanzada de usuarios.
- Auditoria completa de sesiones.
- Cambiar el sistema de scoring o las reglas de coins.

## Criterios de aceptacion

- En produccion, nadie puede entrar sin PIN.
- En desarrollo, el selector rapido sigue disponible.
- Rafa entra por login normal, aterriza en modo participante y puede cambiar a admin desde perfil.
- Un usuario no admin no puede ejecutar endpoints admin aunque manipule la UI.
- La API ya no confia en actor IDs enviados por el frontend para permisos.
- Tests backend/frontend cubren login, modo admin y restricciones principales.
