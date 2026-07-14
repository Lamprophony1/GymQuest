# Sincronizacion de la base de produccion sobre la base local: diseno operativo

Fecha: 2026-07-13
Estado: implementado y validado de extremo a extremo contra la VM

Informe de validacion: `docs/deployment/production-database-local-replica-validation-2026-07-13.md`

## Problema

La API usa SQLite. En produccion, la base vive en:

```text
/opt/gymquest/data/gymchall.db
```

En desarrollo, la API usa el archivo de la raiz del repositorio:

```text
gymchall.db
```

Hoy ambos archivos contienen datos distintos. Esto dificulta reproducir errores que dependen del estado real del reto y comprobar cambios locales sobre los mismos registros que existen en el servidor.

La necesidad concreta es que un comando traiga todo lo que esta en produccion y reemplace siempre `gymchall.db` local. No se quiere mantener una base paralela ni elegir manualmente cual usar.

Copiar directamente el archivo productivo mientras la API escribe no es seguro. SQLite puede mantener cambios confirmados en archivos WAL/SHM, por lo que una copia aislada del archivo vivo puede quedar incompleta o inconsistente.

## Objetivos

- Obtener una copia consistente de la base productiva sin detener la API del servidor.
- Descargarla directamente desde la VM al equipo autorizado de desarrollo.
- Verificar integridad SQLite y checksum antes de usarla.
- Reemplazar siempre el `gymchall.db` de la raiz del repositorio.
- Eliminar los archivos WAL/SHM locales anteriores para evitar mezclar estados.
- Permitir arrancar los scripts locales existentes sin configurar otra connection string.
- Poder volver a sincronizar en cualquier momento para descartar cambios locales y recuperar el estado actual de produccion.
- Registrar fecha, checksum e imagen productiva de la ultima sincronizacion.

## No objetivos

- No conservar los datos locales anteriores despues de una sincronizacion exitosa.
- No mantener snapshots locales historicos como parte del flujo normal.
- No sincronizar cambios locales hacia produccion.
- No restaurar bases sobre el servidor.
- No copiar `/opt/gymquest/keys`; las sesiones productivas no deben funcionar en local.
- No subir la base a GitHub Actions, releases, Drive ni otro storage compartido.
- No reemplazar la estrategia de backups y recuperacion ante desastre.
- No automatizar todavia una agenda de backups productivos.

## Consecuencia aceptada

Cada ejecucion exitosa destruye el estado de desarrollo almacenado en `gymchall.db` y lo reemplaza por el estado capturado desde produccion. Tambien elimina `gymchall.db-wal` y `gymchall.db-shm` locales.

Si hay datos locales que se quieran conservar, deben exportarse de forma manual antes de ejecutar el comando. El script no preguntara si debe conservarlos porque su contrato es sincronizar y sobrescribir siempre.

## Estado tecnico relevante

- Produccion monta `/opt/gymquest/data` en `/var/lib/gymquest/data` dentro del contenedor.
- La conexion productiva es `Data Source=/var/lib/gymquest/data/gymchall.db`.
- El contenedor productivo se llama `gymquest`.
- El despliegue usa una imagen etiquetada con el SHA del commit.
- El repositorio ya ignora `.artifacts/`, `*.db`, `*.db-wal` y `*.db-shm`.
- `scripts/start-api.ps1` cambia el directorio actual a la raiz antes de arrancar la API.
- La API modifica la base al arrancar: ejecuta `EnsureCreatedAsync`, agrega columnas faltantes y aplica ajustes de seed. Esas modificaciones ocurriran sobre el nuevo `gymchall.db` local y son parte del comportamiento a probar.
- El equipo Windows dispone de OpenSSH `ssh` y `scp`.
- La VM debera tener disponible el CLI `sqlite3` para crear y comprobar el backup online.

## Enfoque elegido

Se implementara un script y un runbook:

```text
scripts/sync-production-db.ps1
docs/deployment/production-database-local-replica.md
```

El script crea un backup online temporal en la VM mediante `.backup` de SQLite, ejecuta `PRAGMA quick_check`, calcula SHA-256 y lo descarga por SCP a un archivo parcial dentro de `.artifacts/production-db`.

Solo despues de verificar que el checksum local coincide con el remoto, el script reemplaza el `gymchall.db` de la raiz. El temporal descargado evita que una interrupcion de red deje una base local parcial.

No se necesita un script especial para arrancar la API: despues de la sincronizacion se siguen usando `scripts/start-api.ps1`, `scripts/start-backend-pin.ps1` o el comando normal de `dotnet run`.

## Arquitectura del flujo

```text
/opt/gymquest/data/gymchall.db
  -> sqlite3 .backup en la VM
  -> backup remoto temporal y consistente
  -> PRAGMA quick_check = ok
  -> SHA-256 remoto
  -> SCP a .artifacts/production-db/incoming/*.partial
  -> SHA-256 local coincidente
  -> comprobar que la API local esta detenida
  -> eliminar WAL/SHM locales anteriores
  -> reemplazar <repo>/gymchall.db
  -> guardar metadata de la ultima sincronizacion
  -> eliminar temporales local y remoto
```

La API productiva no se detiene. `.backup` usa la API de backup de SQLite y obtiene una vista consistente aun cuando la base use WAL. Si la base permanece ocupada, el script esperara con un timeout acotado y fallara sin tocar el archivo local.

## Layout local

```text
gymchall.db
.artifacts/
  production-db/
    incoming/
      <id>.db.partial
    last-sync.json
```

Reglas:

- `gymchall.db` es siempre la base activa de desarrollo.
- `incoming/` se usa solamente durante la transferencia y validacion.
- No se conservan copias historicas de la base por defecto.
- `last-sync.json` contiene metadata, nunca filas ni secretos.
- Una transferencia fallida deja intacto el `gymchall.db` anterior.
- Una sincronizacion exitosa reemplaza el `gymchall.db` anterior.

## Metadatos de la ultima sincronizacion

`last-sync.json` registrara:

- version del formato;
- fecha/hora UTC de captura y de reemplazo local;
- target SSH utilizado, sin password ni key;
- ruta remota de origen;
- tamano en bytes;
- SHA-256 remoto y local;
- resultado de `PRAGMA quick_check`;
- tag e image ID del contenedor `gymquest`;
- commit y branch locales al momento de sincronizar.

El checksum describe la base inmediatamente despues del reemplazo. Puede cambiar cuando la API local arranca y aplica ajustes de esquema, seed o acciones manuales.

## Interfaz propuesta

### Validar prerrequisitos sin sobrescribir

```powershell
.\scripts\sync-production-db.ps1 -PreflightOnly
```

Este modo comprueba `ssh`, `scp`, conectividad, `sqlite3`, archivo origen y contenedor. No crea un backup ni modifica `gymchall.db`.

### Sincronizar y sobrescribir la base local

```powershell
.\scripts\sync-production-db.ps1
```

El target predeterminado queda fijado en `gc@10.4.28.21`. El script no guarda password ni private key en el repositorio. OpenSSH usa una key local o solicita autenticacion interactivamente. `-SshTarget` queda disponible como override operativo.

Comportamiento obligatorio:

1. Comprobar `ssh` y `scp` locales.
2. Comprobar conectividad, base origen y `sqlite3` remoto.
3. Crear un nombre temporal unico dentro de un directorio controlado de `/opt/gymquest/data`.
4. Ejecutar `.backup` con busy timeout.
5. Ejecutar `PRAGMA quick_check` sobre el backup, no sobre el archivo vivo.
6. Obtener checksum, tamano e identificador de imagen.
7. Descargar como `*.partial` bajo `.artifacts/production-db/incoming`.
8. Comparar checksum remoto y local.
9. Comprobar que ningun proceso local tenga abierta la base; si esta bloqueada, fallar sin cerrar procesos automaticamente.
10. Quitar el atributo readonly del `gymchall.db` anterior si fuera necesario.
11. Eliminar `gymchall.db-wal` y `gymchall.db-shm` locales, despues de validar sus paths absolutos.
12. Reemplazar `gymchall.db` mediante una operacion local controlada.
13. Volver a calcular el checksum del archivo ya ubicado en la raiz.
14. Escribir `last-sync.json`.
15. Eliminar los temporales local y remoto en un bloque `finally`.

Ante un error previo al reemplazo, el `gymchall.db` existente permanece intacto. Si el reemplazo local falla a mitad de la operacion, el script debe restaurar el archivo anterior desde un backup transitorio y terminar con exit code no cero. Ese backup transitorio se elimina al concluir exitosamente; no funciona como historial.

## Uso para reproducir un error

```powershell
.\scripts\sync-production-db.ps1
.\scripts\start-api.ps1
```

Flujo recomendado:

1. Detener la API local.
2. Registrar sintomas, usuario, endpoint/pantalla y hora aproximada del error.
3. Ejecutar la sincronizacion.
4. Guardar en el registro del incidente el checksum y la imagen productiva mostrados.
5. Arrancar el codigo local sobre el nuevo `gymchall.db`.
6. Confirmar la reproduccion antes de modificar codigo.
7. Implementar el fix y probarlo.
8. Detener la API y volver a sincronizar para probar otra vez desde el estado actual de produccion.
9. Convertir la reproduccion minima en un test automatizado con datos sinteticos.
10. Nunca commitear `gymchall.db` como fixture.

## Seguridad y privacidad

La base productiva contiene datos personales, registros de actividad, peso/altura cuando fueron cargados y hashes de PIN. Aunque los PIN no estan en texto plano, su espacio de 4 a 6 digitos es pequeno. El `gymchall.db` local debe tratarse como informacion sensible.

Controles obligatorios:

- acceso por SSH key y host key verification activa;
- copia directa VM -> workstation autorizada;
- equipo con cifrado de disco y sesion protegida;
- no adjuntar, sincronizar ni compartir `gymchall.db`;
- no imprimir filas, hashes de PIN ni contenido sensible en logs;
- no copiar llaves productivas de Data Protection;
- usar `Auth__Mode=DevSelector` normalmente para no depender de PINs reales;
- borrar la base local cuando ya no sea necesaria;
- nunca agregar una operacion de subida/restauracion a este script.

El primer corte prioriza fidelidad para reproducir el error. Una fase futura puede agregar un modo sanitizado, pero no sera el comportamiento por defecto porque cambiaria el estado que se quiere diagnosticar.

## Consistencia y manejo de errores

- No se usara `scp /opt/gymquest/data/gymchall.db` directamente.
- No se copiaran manualmente los WAL/SHM productivos.
- El archivo local se reemplaza solo despues de `quick_check` y checksum coincidente.
- La API local debe estar detenida; el script no mata procesos.
- Los paths locales se resuelven y verifican dentro de la raiz del repositorio antes de eliminar o mover archivos.
- El nombre remoto sera generado por el script y no aceptara fragmentos de shell.
- Una ejecucion fallida no publicara un archivo `.partial` como `gymchall.db`.
- No habra opcion de merge: la semantica siempre es reemplazo completo.

## Alternativas descartadas

### Copiar el archivo vivo con SCP

Se descarta porque puede omitir transacciones presentes en WAL o capturar un estado incoherente.

### Mantener snapshot y copia de trabajo separados

Se descarta para este flujo porque agrega seleccion y administracion innecesarias. El requisito es que la base normal de desarrollo sea reemplazada siempre por produccion.

### Detener el contenedor productivo

Seria consistente, pero introduce downtime para una tarea que SQLite puede resolver online.

### Artifact de GitHub Actions

Se descarta porque aumenta la superficie de exposicion y deja la base sensible en infraestructura compartida.

### Endpoint HTTP de exportacion

Se descarta porque expone una capacidad de alto riesgo en la aplicacion publica.

## Verificacion

- La captura funciona con la API productiva en ejecucion.
- `PRAGMA quick_check` devuelve exactamente `ok`.
- El checksum descargado coincide con el remoto.
- Una descarga interrumpida no modifica `gymchall.db`.
- Si la API local esta ejecutandose, el script falla sin sobrescribir ni cerrar procesos.
- Una sincronizacion exitosa reemplaza el contenido anterior de `gymchall.db`.
- Los WAL/SHM locales anteriores no sobreviven al reemplazo.
- El checksum de `gymchall.db` coincide con el remoto inmediatamente despues del sync.
- La API local responde `GET /health` usando el `gymchall.db` reemplazado.
- Una segunda sincronizacion descarta todas las escrituras locales y vuelve a traer produccion.
- Los temporales se eliminan en exito y error controlado.
- `git status --short` no muestra la base, WAL/SHM ni archivos parciales.

## Criterios de aceptacion

- Un desarrollador autorizado actualiza su base local desde produccion con un comando.
- El comando sobrescribe siempre `<repo>/gymchall.db`; no crea una base alternativa para ejecutar la app.
- Los datos locales anteriores se descartan tras una sincronizacion exitosa.
- Produccion permanece disponible durante la captura.
- La transferencia se valida antes de tocar la base local.
- Un fallo de red, integridad o bloqueo local conserva la base anterior.
- Los scripts habituales arrancan inmediatamente contra los datos sincronizados.
- Ningun secreto, llave o archivo de datos aparece en Git o servicios compartidos.

## Riesgos y mitigaciones

- Riesgo: perdida de datos locales. Mitigacion: comportamiento explicito y mensaje visible antes de reemplazar; el contrato del comando es destructivo para desarrollo.
- Riesgo: fuga de datos productivos. Mitigacion: SSH directo, Git ignore, disco cifrado y acceso minimo.
- Riesgo: fuerza bruta offline sobre PIN hashes. Mitigacion: acceso restringido, limpieza temprana y ausencia de llaves/sesiones productivas.
- Riesgo: el arranque local transforma la copia sincronizada. Mitigacion: comportamiento esperado; volver a ejecutar sync restaura el estado productivo actual.
- Riesgo: base local bloqueada. Mitigacion: preflight y fallo limpio, sin matar la API.
- Riesgo: `sqlite3` no instalado en la VM. Mitigacion: prerrequisito documentado y error accionable.
- Riesgo: diferencia entre codigo local y productivo. Mitigacion: guardar tag/image ID de produccion y commit/branch local.

## Pregunta abierta no bloqueante

- Confirmar la instalacion de `sqlite3` en la VM.
