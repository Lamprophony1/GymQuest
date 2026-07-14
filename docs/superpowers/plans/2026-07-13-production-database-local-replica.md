# Plan de implementacion: sincronizar produccion sobre gymchall.db local

Estado: implementado y validado de extremo a extremo contra la VM

Informe de validacion: `docs/deployment/production-database-local-replica-validation-2026-07-13.md`

Progreso al 2026-07-13:

- Implementacion completada: tareas 1 a 8.
- Verificacion completada: parser PowerShell, validaciones defensivas, `git diff --check`, reglas de ignore, sincronizacion real, checksum, cleanup remoto y API local.
- API validada sobre la base sincronizada: `/health`, `/api/challenge` y `/api/participants` respondieron HTTP 200 en modo `DevSelector`.

Las casillas de las secciones siguientes conservan el checklist original de planificacion. El resultado ejecutado y la evidencia final estan registrados en el informe de validacion enlazado arriba.

**Objetivo:** Crear un comando que capture una base SQLite consistente desde produccion, la verifique y sobrescriba siempre el `gymchall.db` normal de desarrollo.

**Arquitectura:** Un script PowerShell orquesta un backup online temporal en la VM, lo descarga por SSH/SCP a staging, valida integridad y checksum, y reemplaza de forma controlada `<repo>/gymchall.db`. No se crean bases alternativas para ejecutar la app y no se agregan endpoints.

**Tecnologias:** PowerShell, OpenSSH, SQLite CLI remoto, ASP.NET Core, Docker Compose.

**Diseno de referencia:** `docs/superpowers/specs/2026-07-13-production-database-local-replica-design.md`

---

## Estructura de archivos

- Crear `scripts/sync-production-db.ps1`
  - Preflight local/remoto.
  - Backup SQLite online.
  - Quick check, metadata y checksum.
  - Descarga atomica a staging.
  - Reemplazo obligatorio de `gymchall.db`.
  - Cleanup de temporales y WAL/SHM locales anteriores.

- Crear `docs/deployment/production-database-local-replica.md`
  - Prerrequisitos de VM/SSH.
  - Operacion, advertencia de perdida local y troubleshooting.

- Modificar `README.md`
  - Agregar el comando de sincronizacion y enlazar el runbook.

- Modificar `.gitignore`
  - Agregar reglas explicitas para staging/metadata, aunque `.artifacts/` y `*.db` ya cubren los datos.

No se creara `start-api-with-production-db.ps1`: la API seguira usando el `gymchall.db` de raiz mediante los scripts actuales.

---

## Tarea 1: Definir el contrato destructivo y el preflight

- [ ] Crear `scripts/sync-production-db.ps1` con parametros:
  - `SshTarget`, default hardcodeado `gc@10.4.28.21` y disponible como override.
  - `RemoteDatabasePath`, default `/opt/gymquest/data/gymchall.db`.
  - `BusyTimeoutSeconds`, con default acotado.
  - `PreflightOnly`, unico modo que no sobrescribe.
- [ ] Mantener el destino local fijo en `<repo>/gymchall.db`, sin parametro para redirigirlo accidentalmente.
- [ ] Activar `$ErrorActionPreference = 'Stop'`.
- [ ] Resolver todos los paths desde la raiz del repositorio.
- [ ] Validar target y paths antes de construir comandos remotos.
- [ ] Encapsular invocaciones externas y exigir exit code cero.
- [ ] No aceptar comandos remotos arbitrarios como parametros.
- [ ] Mostrar antes del sync: `La sincronizacion reemplazara <repo>/gymchall.db y descartara sus datos locales.`
- [ ] No pedir una confirmacion interactiva; el contrato del comando normal siempre sobrescribe.

Verificacion:

```powershell
.\scripts\sync-production-db.ps1 -PreflightOnly
```

Esperado: valida `ssh`, `scp`, `sqlite3`, archivo origen y contenedor; no modifica archivos locales ni deja temporales remotos.

## Tarea 2: Crear el backup consistente en la VM

- [ ] Generar un ID UTC y nombre remoto controlado por el script.
- [ ] Crear el temporal en un subdirectorio dedicado de `/opt/gymquest/data` con permisos del usuario operativo.
- [ ] Ejecutar `sqlite3` con `.timeout` y `.backup` sobre la base viva.
- [ ] Ejecutar `PRAGMA quick_check` sobre el backup y exigir salida `ok`.
- [ ] Obtener `sha256sum` y tamano.
- [ ] Obtener tag e image ID con `docker inspect gymquest`.
- [ ] Guardar el path temporal para cleanup garantizado.
- [ ] No detener, reiniciar ni pausar el contenedor.
- [ ] Nunca usar como fallback una copia directa del archivo vivo.

Verificacion:

- Health productivo responde antes, durante y despues.
- El backup temporal devuelve `quick_check = ok`.
- El backup no requiere copiar WAL/SHM productivos.

## Tarea 3: Descargar y validar antes de sobrescribir

- [ ] Crear `.artifacts/production-db/incoming`.
- [ ] Descargar a `<id>.db.partial`.
- [ ] Calcular SHA-256 local con `Get-FileHash`.
- [ ] Comparar el valor normalizado con el checksum remoto.
- [ ] Comprobar que el tamano local coincide con el remoto.
- [ ] Ante cualquier diferencia, eliminar el parcial y conservar `gymchall.db` intacto.
- [ ] No mostrar contenido de tablas ni secretos.
- [ ] Mantener el temporal remoto hasta terminar la verificacion local.

Verificacion:

- Interrumpir una descarga controlada y confirmar que `gymchall.db` conserva su checksum anterior.
- Simular un checksum incorrecto y confirmar fallo cerrado.

## Tarea 4: Reemplazar siempre gymchall.db

- [ ] Resolver y verificar que el destino exacto sea `<repo>/gymchall.db`.
- [ ] Comprobar que la API local no tenga abierta la base; no cerrar procesos automaticamente.
- [ ] Si esta bloqueada, fallar antes de eliminar o mover archivos.
- [ ] Validar que `gymchall.db-wal` y `gymchall.db-shm` resuelvan dentro de la raiz.
- [ ] Preparar un backup transitorio del `gymchall.db` anterior solo para rollback de la operacion.
- [ ] Eliminar WAL/SHM locales anteriores.
- [ ] Reemplazar `gymchall.db` con el archivo ya validado.
- [ ] Calcular nuevamente SHA-256 sobre el archivo ubicado en la raiz.
- [ ] Exigir que coincida con el checksum remoto.
- [ ] Eliminar el backup transitorio al concluir exitosamente.
- [ ] Si falla el reemplazo, restaurar el backup transitorio y devolver exit code no cero.
- [ ] No conservar snapshots historicos ni una copia de trabajo alternativa.

Verificacion:

- Crear una marca sintetica en la base local, ejecutar sync y confirmar que desaparece.
- Confirmar que datos representativos de produccion aparecen en `gymchall.db`.
- Confirmar que WAL/SHM anteriores no sobreviven.
- Ejecutar una segunda sincronizacion y confirmar nuevamente el reemplazo completo.

## Tarea 5: Guardar metadata y limpiar temporales

- [ ] Crear `.artifacts/production-db/last-sync.json`.
- [ ] Incluir version, timestamps UTC, target, ruta origen, tamano, checksum, quick check, imagen productiva y commit/branch local.
- [ ] No incluir variables de entorno, PINs, hashes, cookies, keys ni filas.
- [ ] Eliminar el parcial local en `finally`.
- [ ] Eliminar el backup remoto temporal en `finally`.
- [ ] Limpiar un backup transitorio local solo despues de confirmar exito o rollback.
- [ ] Mostrar al final el checksum y la imagen productiva sincronizados.

## Tarea 6: Verificar que los scripts actuales usan la base reemplazada

- [ ] Ejecutar la sincronizacion con la API local detenida.
- [ ] Guardar el checksum inmediato de `gymchall.db`.
- [ ] Arrancar con `scripts/start-api.ps1`.
- [ ] Confirmar `GET /health`.
- [ ] Consultar endpoints representativos y confirmar datos productivos.
- [ ] Confirmar que cualquier cambio de checksum posterior proviene del arranque/escrituras locales.
- [ ] Detener la API y volver a sincronizar para descartar esas modificaciones.
- [ ] Repetir con `scripts/start-backend-pin.ps1` solo si se necesita diagnosticar autenticacion.

Comandos esperados:

```powershell
.\scripts\sync-production-db.ps1
.\scripts\start-api.ps1
```

## Tarea 7: Documentar operacion y seguridad

- [ ] Crear `docs/deployment/production-database-local-replica.md`.
- [ ] Documentar instalacion unica de `sqlite3` en la VM con aprobacion operativa.
- [ ] Documentar el target SSH fijo, autenticacion por key o prompt y host verification.
- [ ] Explicar claramente que cada sync borra el estado de desarrollo.
- [ ] Indicar que la API local debe detenerse antes.
- [ ] Explicar por que no copiar el archivo vivo, WAL/SHM o llaves.
- [ ] Documentar que `gymchall.db` contiene datos sensibles y requiere disco cifrado.
- [ ] Incluir troubleshooting para busy timeout, permisos, host key, checksum, bloqueo y falta de `sqlite3`.
- [ ] Incluir el flujo reproducir -> corregir -> volver a sincronizar -> verificar.
- [ ] Enlazar el runbook desde `README.md` y el documento general de deployment.

## Tarea 8: Defensa en profundidad y preflight final

- [ ] Agregar ignores explicitos para `.artifacts/production-db/` y `*.partial`.
- [ ] Ejecutar `git check-ignore` sobre base, WAL, SHM, parcial y metadata.
- [ ] Ejecutar una sincronizacion real autorizada.
- [ ] Confirmar que la API local abre y consulta correctamente la copia productiva sin exponer filas en consola.
- [ ] Ejecutar `git status --short` y confirmar que ningun dato aparece.
- [ ] Revisar consola y `last-sync.json` para descartar informacion sensible.

Comandos:

```powershell
git check-ignore gymchall.db
git check-ignore gymchall.db-wal
git check-ignore gymchall.db-shm
git check-ignore .artifacts/production-db/incoming/example.db.partial
git check-ignore .artifacts/production-db/last-sync.json
git status --short
```

## Rollback de la implementacion

El flujo no cambia la base productiva ni el contenedor. Para retirarlo:

1. Eliminar el script y sus enlaces de documentacion.
2. Borrar de forma segura `.artifacts/production-db`.
3. Limpiar temporales del subdirectorio reservado en la VM.
4. Conservar intactos `/opt/gymquest/data/gymchall.db` y `/opt/gymquest/keys`.

El `gymchall.db` local ya sincronizado puede eliminarse para que el siguiente arranque vuelva a generar una base de desarrollo desde seed.

## Criterio de cierre

- Un comando captura y valida produccion.
- El comando reemplaza siempre el `gymchall.db` normal de desarrollo.
- El estado local anterior y sus WAL/SHM quedan descartados.
- Una falla previa o durante el reemplazo conserva/restaura la base anterior.
- Los scripts actuales arrancan contra los datos sincronizados.
- Produccion no sufre downtime ni escrituras desde el flujo.
- Ningun dato productivo aparece en Git o servicios compartidos.
- El runbook fue comprobado con al menos una ejecucion completa.
