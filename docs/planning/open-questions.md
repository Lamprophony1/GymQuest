# Decisiones cerradas y preguntas abiertas

Actualizado: 2026-06-24.

Las preguntas criticas iniciales fueron respondidas durante el MVP. Este archivo queda como registro de decisiones y lista de pendientes futuros.

## Decisiones cerradas

1. El ranking principal es por pareja.
2. El reto visible es `Reto septiembre 2026`.
3. La app visible usa `Proyecto RM` como nombre temporal.
4. La UI actual usa Doodle Fit / Clean Gym, no la estetica Sega inicial.
5. El check-in no pide tipo ni duracion; el backend clasifica segun fecha/hora.
6. La ventana 5am vigente es 05:00 a 06:00.
7. Bonus diario de pareja: solo se activa si ambos integrantes tienen check-in 5am o coin valida. Recuperacion sin coin no da bonus diario.
8. Rachas visibles separadas:
   - Perfect streak: cobertura tipo 5am/perfecta de ambos.
   - Gym streak: dia de gym cubierto de ambos.
9. Recuperacion de fin de semana sin coin completa semana, pero no salva la racha del dia perdido.
10. Flex coin permite que un entrenamiento fuera de horario o recuperacion cuente como cobertura perfecta.
11. Health coin mensual: se otorga automaticamente a participantes con genero femenino, por mes calendario, no acumulable.
12. Admin puede otorgar Health, Commit y Flex coins manualmente.
13. Correcciones administrativas: el admin puede invalidar registros; todo cambio debe quedar auditado.
14. Semanas parciales: se evaluan solo los dias habiles dentro del reto y hasta la fecha evaluada (`throughDate` historico o fecha live).
15. El bonus semanal no se suma por dias futuros cargados antes de tiempo.
16. El reto funciona por confianza; no hace falta validacion administrativa normal.
17. Las parejas no se planean cambiar durante el reto, pero el modelo permite agregar parejas nuevas.
18. Produccion usa login por participante con PIN corto y cookie HttpOnly.
19. Rafa conserva rol admin, pero entra en modo participante y cambia a modo admin desde el icono de usuario.
20. El calendario admin semanal es la vista principal para revisar marcas.
21. La app publicada vive en `rm.crg-dev.com` mediante Cloudflare Tunnel y no toca el tunnel DoorLock.
22. Perfect streak se evalua en `America/Asuncion` y el dia actual vence despues de las 06:30.
23. Gym streak se evalua en `America/Asuncion` y un dia sin cobertura vence al dia siguiente.
24. Los rankings normales se consultan live sin `throughDate`; `throughDate` queda para historico/debug.
25. El perfil privado incluye peso, altura, IMC calculado y cambio de PIN propio.
26. Los avatares actuales son assets estaticos por `username`, no datos persistidos.
27. Todo push a `main` debe pasar CI/CD antes de publicar en la VM.
28. Players tienen una vista `Marcaciones` semanal, readonly, con todos los participantes, check-ins validos y coins aplicadas.
29. El calendario admin muestra check-ins validos, check-ins rechazados cuando se filtra por rechazados, y coins aplicadas dentro de `Validos`.
30. Invalidar una coin aplicada desde admin la devuelve a `Available` para que vuelva al player; invalidar una coin disponible la marca `Rejected`.
31. La familia visual de iconos vigente para logo, coins, rachas, Side quest y Lead es `Quest Sticker Totems`, servida como assets estaticos del frontend.

## Pendientes para decidir

- Nombre final visible de la app, si `Proyecto RM` deja de ser temporal.
- Fecha exacta y reglas de cierre en septiembre.
- Distribucion final de premios.
- Si la evidencia sera opcional siempre o requerida para casos puntuales.
- Como se vera y puntuara Side quest/cardio opcional en la UI.
- Si el nuevo Side quest suma puntos competitivos desde la primera version o si inicia como registro visible sin impacto en ranking.
- Cuales seran las primeras insignias/achievements.
- Formato del resumen semanal para WhatsApp.
- Politica operativa de backups y restore de la VM.
- Si conviene convertir la web en PWA instalable para los usuarios.
