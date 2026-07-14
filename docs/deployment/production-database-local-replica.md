# Sincronizar la base productiva sobre desarrollo

Este runbook explica como reemplazar el `gymchall.db` local con una copia consistente de la base que esta ejecutandose en produccion.

El comando es deliberadamente destructivo para el ambiente de desarrollo: cada sincronizacion exitosa descarta los datos locales anteriores.

Implementacion y validacion real del flujo:

```text
docs/deployment/production-database-local-replica-validation-2026-07-13.md
```

## Resultado

```text
VM: /opt/gymquest/data/gymchall.db
  -> backup online temporal de SQLite
  -> validacion y descarga por SSH/SCP
  -> reemplazo de <repo>/gymchall.db
```

La API productiva no se detiene. El script usa `.backup` de SQLite para incluir un estado consistente aun si la base trabaja con WAL.

## Prerrequisitos en la VM

El usuario SSH debe:

- poder leer `/opt/gymquest/data/gymchall.db`;
- poder crear `/opt/gymquest/data/.gymchall-sync`;
- poder ejecutar `docker inspect gymquest`;
- tener disponibles `sqlite3`, `sha256sum` y `stat`.

Instalacion unica de SQLite CLI en Ubuntu/Debian, ejecutada por un operador autorizado:

```bash
sudo apt-get update
sudo apt-get install -y sqlite3
sqlite3 --version
```

No instalar paquetes automaticamente desde el script de sincronizacion.

## Conexion SSH desde Windows

El script tiene configurado este target predeterminado:

```text
gc@10.4.28.21
```

No se guarda una password en el repositorio. OpenSSH usara una key configurada en Windows o solicitara la password de forma interactiva. No commitear private keys ni passwords.

Comprobar la conexion:

```powershell
ssh gc@10.4.28.21 'printf connected'
```

`-SshTarget` se conserva solamente como override para mantenimiento o cambio futuro de VM.

## Preflight sin modificar la base local

```powershell
.\scripts\sync-production-db.ps1 -PreflightOnly
```

Este modo valida:

- `ssh` y `scp` en Windows;
- conexion a la VM;
- lectura de la base productiva;
- disponibilidad de SQLite y utilidades de checksum;
- acceso al contenedor `gymquest`.

No crea el backup ni reemplaza `gymchall.db`.

## Sincronizar

Primero detener la API local. Luego ejecutar:

```powershell
.\scripts\sync-production-db.ps1
```

El script:

1. Ejecuta el preflight.
2. Crea un backup online temporal en la VM.
3. Ejecuta `PRAGMA quick_check`.
4. Calcula SHA-256 y tamano remoto.
5. Descarga a `.artifacts/production-db/incoming`.
6. Compara tamano y checksum.
7. Comprueba que `gymchall.db`, WAL y SHM locales no esten abiertos.
8. Reemplaza el `gymchall.db` de la raiz.
9. Elimina los WAL/SHM locales anteriores.
10. Guarda `.artifacts/production-db/last-sync.json`.
11. Elimina los temporales.

No hay merge ni seleccion de base: una sincronizacion exitosa siempre reemplaza la base local.

## Arrancar la API

Despues del sync se usan los comandos normales:

```powershell
.\scripts\start-api.ps1
```

O para probar el modo PIN:

```powershell
.\scripts\start-backend-pin.ps1
```

La API ejecuta ajustes de esquema y seed durante el arranque. Por eso el checksum local puede cambiar despues de iniciar la aplicacion. Para volver a obtener el estado productivo, detener la API y ejecutar otra sincronizacion.

## Verificar el origen

El comando muestra el SHA-256 y la imagen productiva. La misma informacion queda en:

```text
.artifacts/production-db/last-sync.json
```

El manifiesto no contiene filas, PINs, hashes, cookies ni llaves.

Comprobar health:

```powershell
Invoke-RestMethod http://127.0.0.1:5020/health
```

## Seguridad

`gymchall.db` contiene datos reales, entre ellos actividad de participantes, datos privados de perfil y hashes de PIN.

- Usar solamente una workstation autorizada con cifrado de disco.
- No adjuntar ni compartir la base.
- No copiar `/opt/gymquest/keys`.
- No subir la base a GitHub, Drive ni artifacts de CI.
- Usar normalmente `Auth__Mode=DevSelector`.
- Eliminar la copia local cuando termine el diagnostico.
- Nunca modificar el script para subir datos a produccion.

Los ignores del repositorio cubren `*.db`, WAL, SHM, parciales y `.artifacts/`, pero esto no sustituye los controles de acceso del equipo.

## Troubleshooting

### `sqlite3 no esta instalado en la VM`

Instalar SQLite CLI con aprobacion operativa y repetir `-PreflightOnly`.

### No se puede leer la base o crear el directorio temporal

Comprobar ownership/permisos de `/opt/gymquest/data`. El usuario operativo actual esperado es `gc`.

### No se encontro el contenedor `gymquest`

Comprobar:

```bash
docker ps -a --filter name=gymquest
```

### La base local esta en uso

Detener `scripts/start-api.ps1`, `dotnet run`, tests o cualquier editor SQLite que tenga abierta la base. El script no mata procesos automaticamente.

### `PRAGMA quick_check` falla

La base local no se modifica. Conservar el mensaje, revisar espacio/disco de la VM y diagnosticar la base productiva antes de reintentar.

### El checksum o tamano no coincide

La descarga parcial se descarta y la base local anterior queda intacta. Revisar la conexion y volver a ejecutar.

### Queda un temporal remoto despues de una desconexion abrupta

Listar solamente el directorio reservado:

```bash
ls -la /opt/gymquest/data/.gymchall-sync
```

Confirmar que no hay una sincronizacion activa antes de eliminar manualmente archivos antiguos de ese directorio. Nunca borrar `/opt/gymquest/data/gymchall.db`.

### El rollback local no pudo completarse

No arrancar la API. El script conserva archivos de recuperacion en:

```text
.artifacts/production-db/incoming
```

Revisar el error y restaurar el archivo `*.previous.db` como `gymchall.db` antes de limpiar los temporales.

### `trap: ... bad trap` o errores con caracteres `\r`

La implementacion actual envia el script remoto mediante `System.Diagnostics.Process` y normaliza stdin a finales `LF`. No volver a cambiar ese transporte por un pipeline directo de PowerShell, porque Windows puede agregar `CRLF` y romper los argumentos de `trap` en `/bin/sh`.

Los traps usan numeros POSIX `0`, `1`, `2` y `15` por compatibilidad con el shell de la VM.

## Flujo de diagnostico recomendado

1. Registrar el error productivo y la hora aproximada.
2. Detener la API local.
3. Sincronizar.
4. Arrancar la API local y reproducir antes de tocar codigo.
5. Implementar el fix.
6. Detener la API y sincronizar nuevamente.
7. Verificar el fix sobre el estado traido de produccion.
8. Crear un regression test con datos sinteticos; nunca usar la base real como fixture.
