# Preguntas abiertas

Estas preguntas no bloquean la base documental, pero si deberian cerrarse antes de implementar el motor de puntajes.

## Criticas

1. Bonus diario de pareja: debe activarse si ambos tienen el dia cubierto por cualquier entrenamiento valido, incluyendo recuperacion, o solo con 5am, ficha valida y mover horario cumplido?
2. Recuperacion mismo dia: cuenta como `dia cubierto` para racha diaria, o solo ayuda a completar la semana?
3. Recuperacion de fin de semana: mantiene racha del dia original, o solo completa conteo semanal?
4. Ficha mensual de periodo: se limita por mes calendario en America/Asuncion, o por ventana rolling de 30 dias?
5. Cierre semanal: el admin puede editar registros de una semana cerrada sin reabrirla formalmente?
6. Semanas parciales al inicio/cierre del reto: se prorratean, se excluyen de bonus semanal, o se evalua solo dias habiles dentro del reto?

## Importantes

7. Lago en pareja: debe ocurrir con ambos integrantes juntos en la misma actividad/evidencia, o alcanza con que ambos hagan lago el mismo dia?
8. Evidencia: el admin valida manualmente todo, o algunos check-ins 5am grupales quedan auto-validos?
9. Premios: la distribucion puede cambiar despues de iniciado el reto, o queda bloqueada al activar el challenge?
10. Participantes y parejas: si cambia una pareja a mitad del reto, se conserva historial anterior separado o se recalcula todo con la nueva pareja?

## Propuesta provisional para avanzar

- Semana: lunes a domingo, timezone America/Asuncion.
- Fichas validas no penalizan rachas, bonus semanal ni desempates.
- Totales pueden recalcularse siempre desde hechos base.
- Cambios despues de cierre semanal requieren auditoria y nuevo score run.
