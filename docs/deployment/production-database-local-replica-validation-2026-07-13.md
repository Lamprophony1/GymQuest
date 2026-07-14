# Validacion de replica local de produccion

Fecha: 2026-07-13
Estado: implementado y validado de extremo a extremo

## Alcance

Esta validacion cubrio la implementacion del flujo que copia de forma consistente la base SQLite productiva y reemplaza el `gymchall.db` normal de desarrollo.

Se verificaron:

- conectividad SSH;
- prerrequisitos de la VM;
- consistencia del backup SQLite;
- transferencia SSH/SCP;
- comparacion de checksum y tamano;
- reemplazo y rollback local;
- limpieza de temporales;
- arranque de la API sobre la copia sincronizada;
- lectura de endpoints sin imprimir datos sensibles;
- compatibilidad de los scripts de arranque con el SDK instalado en la workstation.

## Configuracion validada

Target SSH predeterminado:

```text
gc@10.4.28.21
```

Base productiva:

```text
/opt/gymquest/data/gymchall.db
```

Base local reemplazada:

```text
<repo>/gymchall.db
```

Contenedor productivo:

```text
gymquest
```

El target queda hardcodeado para simplificar el uso. La autenticacion se realiza con OpenSSH y key local. Ninguna password ni private key se guarda en el repositorio.

## Archivos implementados

### Sincronizacion

- `scripts/sync-production-db.ps1`
  - Target SSH predeterminado y override opcional.
  - Modo `-PreflightOnly`.
  - Backup online con `.backup` de SQLite.
  - `PRAGMA quick_check` sobre el backup temporal.
  - SHA-256 y tamano remoto/local.
  - Descarga a staging bajo `.artifacts/production-db/incoming`.
  - Reemplazo de `gymchall.db`.
  - Backup transitorio para rollback local.
  - Eliminacion de WAL/SHM anteriores.
  - Cleanup remoto/local en `finally`.
  - Manifiesto `.artifacts/production-db/last-sync.json`.

### Arranque local

- `scripts/start-api.ps1`
  - Usa `.tools/dotnet` cuando existe.
  - Usa `dotnet.exe` del `PATH` como fallback.
  - Falla con mensaje accionable si no existe el DLL compilado.
  - Configura `Auth__Mode=DevSelector` y cookie no segura para desarrollo.

- `scripts/start-api.cmd`
  - Aplica el mismo fallback de `dotnet`.
  - Configura `DevSelector`.

- `scripts/start-backend-pin.ps1`
  - Aplica el mismo fallback de `dotnet`.
  - Conserva el flujo `PinLogin`.

### Documentacion y proteccion de datos

- `docs/deployment/production-database-local-replica.md`.
- `docs/superpowers/specs/2026-07-13-production-database-local-replica-design.md`.
- `docs/superpowers/plans/2026-07-13-production-database-local-replica.md`.
- Referencias agregadas a `README.md` y `docs/deployment/github-cloudflare-vm.md`.
- Reglas explicitas de ignore para `.artifacts/production-db` y `*.partial`.
- Las reglas existentes `*.db`, `*.db-wal` y `*.db-shm` protegen la base y sus sidecars.

## Preflight real

Comando ejecutado:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass `
  -File .\scripts\sync-production-db.ps1 `
  -PreflightOnly
```

Resultado:

```text
Preflight correcto para 'gc@10.4.28.21'.
Base remota: /opt/gymquest/data/gymchall.db
```

Esto confirmo:

- autenticacion SSH por key;
- `sqlite3` instalado en la VM;
- disponibilidad de `sha256sum` y `stat`;
- lectura de la base productiva;
- acceso a `docker inspect gymquest`.

## Problemas encontrados y correcciones

### Traps incompatibles con el shell remoto

El primer corte usaba nombres simbolicos:

```text
EXIT HUP INT TERM
```

El `/bin/sh` de la VM no acepto esos nombres al limpiar los traps. Se cambiaron por numeros POSIX:

```text
0 1 2 15
```

La validacion aislada en la VM devolvio:

```text
TRAP_OK
```

### Finales de linea CRLF enviados por PowerShell

El pipeline nativo de Windows PowerShell agregaba `CRLF` al script enviado por stdin. El shell interpretaba el ultimo argumento como `15\r` y devolvia `bad trap`.

La solucion final fue dejar de enviar el script con un pipeline de PowerShell. `Invoke-SshScript` ahora usa `System.Diagnostics.Process` con stdin/stdout/stderr redirigidos y escribe un payload normalizado a `LF`.

La validacion del transporte exacto devolvio:

```text
STREAM_TRAP_OK
```

### Manejo prematuro de stderr nativo

Con `$ErrorActionPreference = 'Stop'`, un mensaje de `ssh.exe` enviado a stderr podia interrumpir PowerShell antes de evaluar el exit code.

El proceso SSH ahora captura stdout, stderr y exit code de forma explicita. SCP tambien conserva su exit code antes de restaurar la preferencia de errores.

### Temporales de intentos fallidos

Los intentos previos a la correccion CRLF dejaron backups dentro de:

```text
/opt/gymquest/data/.gymchall-sync
```

Se listaron y eliminaron solamente los archivos temporales generados por este flujo. Despues de la sincronizacion exitosa se verifico:

```text
REMOTE_TEMP_CLEAN
```

La base productiva original no fue eliminada ni reemplazada.

### SDK local no encontrado en `.tools`

La workstation no tenia:

```text
.tools/dotnet/dotnet.exe
```

Si tenia `dotnet.exe` global:

```text
10.0.301
```

Los scripts de arranque fueron actualizados para usar primero `.tools` y luego el SDK global.

### Autenticacion durante la prueba de API

Al ejecutar el DLL directamente sin variables, la API uso autenticacion PIN y los endpoints protegidos respondieron 401.

La prueba local se repitio con:

```text
Auth__Mode=DevSelector
Auth__CookieSecure=false
```

`scripts/start-api.ps1` y `scripts/start-api.cmd` ahora establecen esos valores automaticamente. El flujo PIN sigue separado en `scripts/start-backend-pin.ps1`.

## Sincronizacion real

Comando ejecutado desde la workstation autorizada:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass `
  -File .\scripts\sync-production-db.ps1
```

Resultado:

```text
Sincronizacion completada.
Base local: <repo>/gymchall.db
SHA-256: e6a8509aaa026f406c73623192cd64d9e17901c10b76684e0c5a4a49a43ddb5b
Imagen productiva: ghcr.io/lamprophony1/gymquest:696fde8511aade7b4315d88936370dde524abff4
```

Datos tecnicos de esa captura:

- tamano: `212992` bytes;
- `PRAGMA quick_check`: `ok`;
- checksum descargado: coincidente con el remoto;
- checksum despues del reemplazo: coincidente con el manifiesto;
- imagen productiva asociada al commit `696fde8511aade7b4315d88936370dde524abff4`.

El checksum identifica esta captura concreta. Una sincronizacion futura generara otro valor si produccion cambio.

## Validacion de API

La API se arranco temporalmente contra el `gymchall.db` sincronizado, en modo `DevSelector`.

Resultados:

```text
GET /health           -> 200
GET /api/challenge    -> 200
GET /api/participants -> 200
```

La prueba verifico que la respuesta de participantes tenia registros, pero no imprimio nombres, perfiles, credenciales ni otros datos personales.

Despues de la prueba:

- el proceso local fue detenido;
- el puerto `127.0.0.1:5020` quedo libre;
- el checksum del archivo principal continuo coincidiendo con el manifiesto;
- el WAL quedo en `0` bytes;
- el SHM quedo en `32768` bytes, estado normal despues de abrir SQLite;
- no se borraron manualmente sidecars potencialmente activos;
- el backup temporal remoto quedo eliminado.

## Validaciones locales adicionales

- Parser PowerShell correcto para:
  - `scripts/sync-production-db.ps1`;
  - `scripts/start-api.ps1`;
  - `scripts/start-backend-pin.ps1`.
- `git diff --check` sin errores.
- `git check-ignore` confirmado para:
  - `gymchall.db`;
  - `gymchall.db-wal`;
  - `gymchall.db-shm`;
  - `.artifacts/production-db/incoming/*.partial`;
  - `.artifacts/production-db/last-sync.json`.
- Ningun archivo de base ni manifiesto aparece en `git status`.

## Operacion final

Preflight:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass `
  -File .\scripts\sync-production-db.ps1 `
  -PreflightOnly
```

Sincronizacion destructiva para desarrollo:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass `
  -File .\scripts\sync-production-db.ps1
```

Arranque normal en modo desarrollo:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass `
  -File .\scripts\start-api.ps1
```

Arranque en modo PIN:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass `
  -File .\scripts\start-backend-pin.ps1
```

## Resultado final

El flujo quedo implementado y probado de extremo a extremo:

1. Produccion permanece online durante la captura.
2. SQLite genera un backup consistente.
3. La transferencia se valida antes de tocar desarrollo.
4. `gymchall.db` local se reemplaza completamente.
5. Un fallo previo al commit conserva la base anterior.
6. Los scripts locales arrancan contra la base sincronizada.
7. Los temporales se limpian.
8. La base y sus artifacts permanecen fuera de Git.
