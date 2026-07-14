# GymQuest CI/CD en VM + Cloudflare Tunnel

Este documento describe el despliegue recomendado para publicar el MVP en `rm.crg-dev.com` usando GitHub Actions, GHCR, Docker Compose y Cloudflare Tunnel.

Estado actual: implementado y en uso para el MVP publicado.

## Arquitectura

```text
GitHub main
  -> GitHub Actions
  -> tests backend/frontend
  -> build Docker image
  -> GHCR
  -> self-hosted runner en VM
  -> docker compose pull/up
  -> http://127.0.0.1:5020
  -> Cloudflare Tunnel
  -> https://rm.crg-dev.com
```

La app se sirve como single-origin:

```text
/        -> React SPA
/api/*   -> API .NET
/health  -> health API
```

Esto evita CORS y mantiene simples las cookies HttpOnly del login PIN.

## Separacion con DoorLock

No tocar estos recursos existentes:

- `gate.crg-dev.com`
- tunnel actual del DoorLock
- Access app `gate-doorlock`
- service token `doorlock-script`

GymQuest debe usar recursos nuevos:

- hostname: `rm.crg-dev.com`
- tunnel: `gymquest-dc-pti`
- servicio local: `http://127.0.0.1:5020`
- runner GitHub: `gymquest-dc-vm`

## Archivos del repo

- `Dockerfile`: compila frontend y backend en una imagen unica.
- `deploy/docker-compose.yml`: levanta el contenedor en la VM.
- `deploy/gymquest.env.example`: ejemplo de variables sensibles para `/opt/gymquest/gymquest.env`.
- `deploy/cloudflared-gymquest.example.yml`: ejemplo si se usa tunnel administrado por config local.
- `.github/workflows/ci-cd.yml`: CI/CD para test, publish a GHCR y deploy con self-hosted runner.

## Preparar la VM

Crear directorios persistentes:

```bash
sudo mkdir -p /opt/gymquest/data /opt/gymquest/keys /opt/gymquest/deploy
sudo chown -R gc:gc /opt/gymquest
```

La imagen corre con UID/GID `1001:1001`, que en esta VM corresponde al usuario `gc`.

Crear el archivo de entorno real:

```bash
nano /opt/gymquest/gymquest.env
```

Contenido inicial:

```env
Auth__BootstrapAdminPin=123456
```

Usar un PIN real de 4 a 6 digitos. Ese PIN solo se aplica a Rafa si todavia no existe PIN guardado en la base.

## Docker

Instalar Docker Engine y el plugin Compose siguiendo la guia oficial de Docker para la distro de la VM.

Despues, permitir que el usuario del runner use Docker:

```bash
sudo usermod -aG docker gc
```

Cerrar sesion SSH y volver a entrar para que el grupo aplique.

Validar:

```bash
docker --version
docker compose version
```

## GitHub Runner

En GitHub:

```text
Repo -> Settings -> Actions -> Runners -> New self-hosted runner
```

Instalar el runner en la VM como usuario `gc`, no como `root`.

Agregar el label:

```text
gymquest
```

El workflow despliega solo en runners con:

```yaml
runs-on:
  - self-hosted
  - gymquest
```

Instalarlo como servicio para que arranque solo:

```bash
sudo ./svc.sh install gc
sudo ./svc.sh start
```

## Cloudflare Tunnel

Crear un tunnel nuevo para GymQuest:

```text
gymquest-dc-pti
```

Public hostname:

```text
rm.crg-dev.com -> http://127.0.0.1:5020
```

Si se usa el flujo de dashboard/remotely-managed tunnel, copiar y ejecutar en la VM el comando `cloudflared service install ...` que entrega Cloudflare.

Si se usa config local, `deploy/cloudflared-gymquest.example.yml` muestra la forma esperada:

```yaml
ingress:
  - hostname: rm.crg-dev.com
    service: http://127.0.0.1:5020
  - service: http_status:404
```

## Primer deploy

Con el runner conectado y Docker funcionando, hacer push a `main`.

El workflow:

1. Ejecuta tests .NET.
2. Ejecuta tests frontend.
3. Compila frontend.
4. Construye y publica imagen en GHCR.
5. En la VM copia `deploy/docker-compose.yml`.
6. Ejecuta `docker compose up -d --pull always`.
7. Verifica `http://127.0.0.1:5020/health`.

## Flujo actual de publicacion

Para publicar cambios:

```powershell
git push origin main
```

Ese push dispara `.github/workflows/ci-cd.yml`. El job `deploy` corre en el self-hosted runner con label `gymquest`.

Politica vigente del MVP:

- antes de pushear, correr pruebas relevantes localmente cuando el cambio toca codigo;
- si CI/CD queda en `success`, el cambio queda publicado automaticamente;
- verificar produccion con `GET https://rm.crg-dev.com/health`.

La imagen queda publicada como:

```text
ghcr.io/lamprophony1/gymquest:<sha>
ghcr.io/lamprophony1/gymquest:latest
```

El contenedor productivo se llama `gymquest` y expone solo loopback en la VM:

```text
127.0.0.1:5020 -> container:8080
```

Cloudflare Tunnel publica ese servicio en HTTPS.

## Verificaciones

En la VM:

```bash
docker ps
docker logs gymquest --tail 100
curl -fsS http://127.0.0.1:5020/health
```

Desde fuera:

```bash
curl -I https://rm.crg-dev.com
curl -fsS https://rm.crg-dev.com/health
```

En navegador:

```text
https://rm.crg-dev.com
```

Debe abrir la pantalla de login PIN.

Nota: usar `GET /health` para health externo. Algunos clientes pueden recibir respuesta distinta con `HEAD /health`.

## Backups

La base vive en:

```text
/opt/gymquest/data/gymchall.db
```

Las llaves de cookie viven en:

```text
/opt/gymquest/keys
```

Respaldar ambos directorios. Sin las llaves, los usuarios pueden tener que volver a iniciar sesion despues de restaurar.

La copia de produccion para reproducir errores en desarrollo es un flujo separado y no sustituye estos backups. El runbook esta en:

```text
docs/deployment/production-database-local-replica.md
```

Ese flujo crea un backup SQLite online temporal, lo valida y reemplaza deliberadamente el `gymchall.db` local; nunca restaura datos hacia la VM.

La primera validacion completa del flujo esta documentada en:

```text
docs/deployment/production-database-local-replica-validation-2026-07-13.md
```

## Pendientes operativos

- Automatizar backup de `/opt/gymquest/data/gymchall.db`.
- Automatizar backup de `/opt/gymquest/keys`.
- Definir retencion y ubicacion del backup fuera de la VM.
- Documentar restore probado.
- Agregar monitoreo simple del health check.
- Rotar el PIN bootstrap inicial si aun sigue siendo un valor temporal.
