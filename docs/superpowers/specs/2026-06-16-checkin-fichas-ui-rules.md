# Spec: Check-in, fichas y ajustes visuales RM

Fecha: 2026-06-16

## Objetivo

Ajustar la app mobile-first para que el panel sea mas legible, el nombre visual sea temporalmente `Proyecto RM`, el check-in sea simple y automatico, y las fichas funcionen como creditos disponibles otorgados por admin o por reglas del sistema.

## Cambios de UI

- Reemplazar cualquier marca visible `Gym Chall` / `GymChall` por `Proyecto RM`.
- Mantener el proyecto/dev name internamente si hace falta, pero no mostrarlo en la interfaz.
- Header mobile-first:
  - En la parte superior muestra `Proyecto RM` y el contexto del reto.
  - Al scrollear, el header queda sticky pero mas compacto.
  - Al volver arriba, recupera el tamano normal.
- En `Panel`, los titulos/eyebrows de cada tarjeta deben usar un color legible sobre fondos vivos.
- Cambiar el texto del reto a `Reto septiembre 2026`.
- Scoreboard:
  - `Lead` debe mostrar la pareja lider actual.
  - Si dos o tres parejas empatan en el primer puesto, debe indicar el empate claramente.

## Check-in

El menu se llama `Check-in`.

El formulario queda reducido a los datos necesarios:

- Fecha.
- Hora.
- Sin duracion.
- Sin selector manual de tipo.

Defaults:

- Fecha: hoy.
- Hora: `05:00`.

Clasificacion automatica:

- Si el horario cae dentro de la ventana de manana configurada, el check-in cuenta como entrenamiento 5AM.
- Si es dia habil y fuera de la ventana, cuenta como recuperacion del mismo dia.
- Si es sabado o domingo, se habilita un selector de dia a recuperar.
- En recuperacion de fin de semana, el selector muestra solo dias habiles de la misma semana que no tengan cobertura registrada para esa participante.

## Fichas

Las fichas son creditos disponibles. No generan puntos al otorgarse; solo afectan el score cuando la participante las usa.

Vista de players:

- No necesitan una pantalla completa de fichas.
- En `Check-in`, si tienen fichas disponibles, ven la accion para usar una ficha.

Vista admin:

- Admin puede otorgar fichas a participantes.
- La vista actual de fichas se mantiene solo como flujo admin, ajustada para otorgar creditos.

Tipos fijos:

1. `Salud`
   - Exonera entrenamiento.
   - Al usarse cubre el dia como si se hubiera entrenado.
   - Mantiene racha, bonus y puntos normales.
   - Admin puede otorgarla en cualquier momento.
   - El sistema otorga automaticamente una por mes a participantes con genero femenino.
   - La ficha mensual automatica no es acumulable: una participante no debe tener mas de una ficha mensual de salud pendiente para el mes.

2. `Compromiso obligatorio`
   - Exonera entrenamiento.
   - Al usarse cubre el dia como si se hubiera entrenado.
   - Mantiene racha, bonus y puntos normales.
   - Admin puede otorgarla.

3. `Cambio de horario`
   - No exonera por si sola.
   - Sirve para que un entrenamiento fuera de horario o una recuperacion de fin de semana cuente como entrenamiento 5AM.
   - Al usarse mantiene racha, bonus y puntos normales como si se hubiera entrenado en la ventana 5AM.

## Criterios de aceptacion

- `Panel` no tiene titulos blancos ilegibles sobre fondos claros o vivos.
- No aparece `Gym Chall` como nombre visible.
- El header se compacta al scrollear.
- El reto dice `Reto septiembre 2026`.
- `Lead` muestra lider o empate entre lideres.
- `Check-in` no pide duracion ni tipo manual.
- El backend clasifica el check-in por fecha/hora.
- Finde muestra solo dias de la misma semana sin cobertura para recuperar.
- Players usan fichas desde `Check-in`.
- Admin otorga fichas.
- Salud mensual automatica se otorga a participantes femeninas sin acumulacion mensual.
