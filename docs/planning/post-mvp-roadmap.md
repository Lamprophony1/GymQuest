# Roadmap post-MVP

Actualizado: 2026-06-17.

## Estado de partida

El MVP esta publicado en `https://rm.crg-dev.com` y ya cubre el uso diario del reto:

- login PIN;
- dashboard;
- ranking general y semanal;
- check-in;
- coins;
- admin calendario;
- deploy CI/CD hacia VM + Cloudflare Tunnel.

El plan final cambio respecto al plan inicial: autenticacion, publicacion y calendario admin ya estan implementados. El siguiente bloque de producto deberia enfocarse en funciones nuevas, no en infraestructura basica.

## Prioridad 1 - Operacion segura del MVP

Objetivo: evitar perder datos y poder sostener el uso real.

Alcance recomendado:

- Backup automatico de `/opt/gymquest/data/gymchall.db`.
- Backup de `/opt/gymquest/keys`.
- Runbook de restore.
- Health check externo simple.
- Rotacion de PINs si algun PIN temporal quedo expuesto.
- Mini guia para admin: revisar calendario, invalidar marcas, otorgar coins y resetear PIN.

Resultado esperado: app usable con menor riesgo operativo.

## Prioridad 2 - Side quest

Objetivo: reemplazar el concepto visual pendiente de Lago por `Side quest` real, orientado a cardio opcional.

Decision vigente de UI:

- Texto visible actual: `Side quest`.
- Descripcion visible temporal: `Cardio opcional en desarrollo`.
- Debe evitar limitarlo solo a lago; puede incluir plaza/caminata/cardio.

Alcance tecnico recomendado:

- Entidad persistida para side quest/cardio.
- Participantes asociados a la actividad.
- API para registrar y listar.
- Scoring de side quest.
- UI de registro.
- Vista admin/correccion.
- Tests de dominio, API y frontend.

Pregunta pendiente: si side quest suma puntos competitivos desde el inicio o si primero funciona como actividad visible sin impacto en ranking.

## Prioridad 3 - Achievements e insignias

Objetivo: reforzar el lenguaje de juego sin meter ruido visual.

Primer set sugerido:

- Perfect week.
- Primera semana completa.
- Lunes cumplidos.
- Racha gym.
- Racha perfect.
- Remontada semanal.

Decision pendiente: calcular al vuelo o persistir awards.

## Prioridad 4 - Admin pro

Objetivo: hacer mas facil corregir errores y auditar decisiones.

Alcance recomendado:

- Vista de auditoria visible.
- Motivos de invalidacion mas claros.
- Correccion guiada en vez de solo reject + nueva carga.
- Filtros guardados del calendario.
- Export CSV de check-ins y coins.

## Prioridad 5 - Experiencia social y cierre

Objetivo: preparar la dinamica semanal y final del reto.

Alcance recomendado:

- Resumen semanal para WhatsApp.
- Cierre de semana.
- Progreso hacia septiembre.
- Reglas finales de premio.
- Exportacion final.

## Fuera de alcance inmediato

- Evidencias obligatorias.
- Notificaciones push.
- App nativa.
- Pagos o gestion real de dinero.
- Cambios complejos de parejas durante el reto.

## Orden recomendado

1. Operacion segura del MVP.
2. Side quest.
3. Achievements.
4. Admin pro.
5. Resumen social y cierre.
