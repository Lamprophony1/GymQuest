# Special Coins / Albirroja Coin Design

## Objetivo

Estandarizar coins especiales simbolicas para eventos puntuales del grupo. Una coin especial no introduce una regla de puntaje nueva: usa el efecto funcional de una coin existente, pero se muestra con identidad propia cuando esta asignada.

La primera coin especial es `Albirroja coin`, creada por el feriado acordado por el grupo tras el triunfo de Paraguay.

## Modelo

`ExceptionToken` sigue siendo el hecho base para coins. Se agregan campos opcionales:

- `specialCode`: identificador estable de la variante especial, por ejemplo `albirroja`.
- `specialLabel`: nombre visible opcional, por ejemplo `Albirroja coin`.

La coin conserva su `type` funcional:

- `Health`: cobertura completa por salud.
- `Mandatory`: cobertura completa por compromiso/acuerdo obligatorio.
- `ScheduleChange`: cobertura por cambio de horario con entrenamiento asociado.

Para `Albirroja coin`:

- `type = Mandatory`.
- `reasonCategory = OtherApproved`.
- `specialCode = "albirroja"`.
- `specialLabel = "Albirroja coin"`.

No se agrega restriccion dura de fecha. El grupo decide usarla el dia que corresponde.

## Reglas

Una coin especial aplicada cuenta igual que su tipo funcional:

- cubre el dia;
- cuenta como entrenamiento marcado a las 5AM;
- preserva `Perfect streak`;
- preserva `Gym streak`;
- habilita bonus diario de pareja;
- participa en bonus semanal igual que una coin valida.

La logica de scoring no debe depender del `specialCode`. El `specialCode` es presentacional.

## Admin

El formulario `Otorgar coin` permite elegir una variante:

- `Normal`.
- `Albirroja coin`.

Al elegir `Albirroja coin`, la UI usa por defecto:

- tipo funcional `Commit coin`;
- motivo `Aprobada`.

El admin asigna la coin al jugador. La coin queda `Available` y el jugador la usa manualmente desde el flujo normal de coins.

## Player UI

En dashboard:

- las coins base siguen visibles como inventario recurrente;
- las coins especiales solo se muestran si el jugador tiene al menos una disponible;
- `Albirroja coin` usa el icono adjunto y texto `Albirroja coin xN`.

En check-in:

- la lista de coins disponibles muestra `Albirroja coin`;
- al usarla, se aplica como cobertura completa normal.

En calendario y admin:

- una coin especial aplicada se muestra con su nombre especial;
- si el admin invalida una coin especial aplicada, vuelve a `Available` conservando su identidad especial.

## Fallbacks

Si la UI recibe un `specialCode` desconocido:

- muestra `specialLabel` si existe;
- si no hay label, muestra `Coin especial`;
- si no hay icono registrado, usa el icono del tipo funcional.

## Pruebas

Backend:

- crear/listar una coin especial conserva `specialCode` y `specialLabel`;
- usar una coin especial la aplica sin perder metadata;
- invalidar una coin especial aplicada la devuelve a disponible conservando metadata;
- scoring trata la Albirroja aplicada como cobertura completa.

Frontend:

- dashboard muestra la especial solo cuando esta disponible;
- check-in y calendario usan `Albirroja coin`;
- el selector admin puede otorgar Albirroja con defaults correctos.
