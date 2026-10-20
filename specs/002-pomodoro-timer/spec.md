# Spec 002 — Pantalla principal del cronómetro Pomodoro

Estado: borrador

## Contexto y objetivo

El proyecto ya tiene sus bases (spec 001) pero ninguna funcionalidad de usuario. Esta spec define la primera pantalla que ve el usuario al acceder: un cronómetro Pomodoro que alterna concentración y descanso, muestra el tiempo restante con un círculo que se vacía y avisa cuando termina cada fase.

**Objetivo**: que el usuario pueda concentrarse con un solo vistazo a la pantalla: iniciar, pausar, reiniciar, ajustar los tiempos y ser avisado al cambiar de fase.

## Usuarios

- **Usuario final**: persona que usa la app para concentrarse; único usuario de esta pantalla.

## Historias de usuario

- **HU-1**: Como usuario, quiero ver cuánto tiempo me queda de forma visual e inmediata, para concentrarme sin mirar números.
- **HU-2**: Como usuario, quiero iniciar, pausar y reiniciar el tiempo con un botón, para controlar mi sesión sin esfuerzo.
- **HU-3**: Como usuario, quiero que la aplicación pase sola de concentración a descanso y viceversa y me avise, para no tener que vigilar el tiempo.
- **HU-4**: Como usuario, quiero ajustar la duración de concentración y descanso, para adaptar el método a mi ritmo.
- **HU-5**: Como usuario, quiero que mis tiempos se recuerden al volver a la aplicación, para no reconfigurarlos cada vez.
- **HU-6**: Como usuario, quiero una pantalla simple, agradable y calmada, para que usarla sea cómodo y no me distraiga.

## Requisitos funcionales

**RF-1 — Círculo y tiempo restante**
El sistema deberá mostrar un círculo que representa el tiempo de la fase actual y el tiempo restante en formato minutos:segundos.

- CA-1.1: Cuando el usuario acceda a la aplicación, el sistema deberá mostrar el círculo completo y el tiempo restante de la fase actual.
- CA-1.2: Mientras el cronómetro esté en curso, el círculo deberá vaciarse de forma continua y proporcional al tiempo transcurrido de la fase.
- CA-1.3: Mientras el cronómetro esté en curso, el tiempo restante mostrado deberá actualizarse cada segundo.
- CA-1.4: Cuando se complete una fase, el círculo deberá volver a mostrarse lleno con el tiempo completo de la nueva fase.

**RF-2 — Iniciar y pausar**
El sistema deberá permitir iniciar y pausar el cronómetro con un único botón que alterna entre PLAY y PAUSE.

- CA-2.1: Cuando el usuario pulse PLAY, el sistema deberá iniciar la cuenta atrás de la fase actual y el botón deberá pasar a PAUSE.
- CA-2.2: Cuando el usuario pulse PAUSE, el sistema deberá detener la cuenta conservando el tiempo restante y mostrar el botón PLAY; al volver a pulsar PLAY, deberá continuar desde ese tiempo sin reiniciarlo.

**RF-3 — Reiniciar**
El sistema deberá ofrecer un botón RESET a la derecha de PLAY/PAUSE.

- CA-3.1: El botón RESET deberá mostrarse siempre a la derecha de PLAY/PAUSE, deshabilitado cuando el cronómetro esté parado o en pausa.
- CA-3.2: Mientras el cronómetro esté en curso, el botón RESET deberá estar habilitado.
- CA-3.3: Cuando el usuario pulse RESET, el sistema deberá devolver la fase actual a su tiempo completo, detener el cronómetro mostrando PLAY y no cambiar de fase.
- CA-3.4: Si el tiempo llega a cero a la vez que se pulsa RESET, entonces deberá mandar la transición de fase: la fase no puede quedar sin terminar ni saltarse el cambio de fase.

**RF-4 — Fin de la concentración**
Al terminar la concentración, el sistema deberá avisar y pasar al descanso.

- CA-4.1: Cuando el tiempo de concentración llegue a cero, el sistema deberá pasar a la fase de descanso con su tiempo completo y el cronómetro en curso.
- CA-4.2: Cuando el tiempo de concentración llegue a cero, el sistema deberá mostrar la tarjeta de aviso y emitir el aviso sonoro corto (RF-6).

**RF-5 — Fin del descanso**
Al terminar el descanso, el sistema deberá avisar y volver a la concentración.

- CA-5.1: Cuando el tiempo de descanso llegue a cero, el sistema deberá pasar a la fase de concentración con su tiempo completo y el cronómetro en curso.
- CA-5.2: Cuando el tiempo de descanso llegue a cero, el sistema deberá mostrar la tarjeta de aviso y emitir el aviso sonoro corto (RF-6).
- CA-5.3: Mientras el usuario no pulse PAUSE o RESET, el sistema deberá encadenar concentración y descanso indefinidamente.

**RF-6 — Tarjeta de aviso**
El sistema deberá avisar cada cambio de fase con una tarjeta en la parte superior y un sonido corto.

- CA-6.1: Cuando se complete una fase, el sistema deberá mostrar una tarjeta de aviso en la parte superior y emitir un aviso sonoro corto.
- CA-6.2: La tarjeta deberá ocultarse sola entre 3 y 5 segundos, o antes si el usuario pulsa sobre ella.
- CA-6.3: Cuando llegue una tarjeta nueva, deberá sustituir a la anterior sin solaparse con ella.

**RF-7 — Edición de los tiempos**
El sistema deberá permitir ajustar la duración de cada fase en minutos enteros, con 25 y 5 minutos como valores por defecto.

- CA-7.1: Cuando el usuario acceda por primera vez a la aplicación, los tiempos deberán ser 25 minutos de concentración y 5 minutos de descanso.
- CA-7.2: Cuando el cronómetro esté parado o en pausa, el sistema deberá permitir editar los minutos de concentración y de descanso en un campo numérico de valores enteros entre 1 y 60.
- CA-7.3: Mientras el cronómetro esté en curso, el sistema deberá impedir la edición de los tiempos.
- CA-7.4: Si el usuario introduce un valor decimal, 0, negativo, vacío o no numérico, entonces el sistema deberá rechazarlo y conservar el último valor válido.
- CA-7.5: Cuando el usuario edite el tiempo de la fase actual, el tiempo restante y el círculo deberán tomar el valor nuevo y el cronómetro deberá quedar parado y listo para PLAY, tanto en parado como en pausa.
- CA-7.6: Si el usuario pulsa PLAY con un valor inválido tecleado, entonces el sistema deberá arrancar con el último valor válido.

**RF-8 — Recuerdo de los ajustes**
El sistema deberá conservar los tiempos ajustados y la fase actual entre visitas.

- CA-8.1: Cuando el usuario recargue la página, el sistema deberá restaurar los tiempos de concentración y descanso ajustados.
- CA-8.2: Cuando el usuario recargue la página con un ciclo en curso, el sistema deberá recordar la fase actual con su tiempo completo y el cronómetro parado, sin perder ni saltarse ninguna fase.
- CA-8.3: Si el estado guardado está corrupto o fuera de rango, entonces el sistema deberá usar los tiempos por defecto (25 y 5) y la fase actual recordada si es válida.

**RF-9 — Paleta calmada preparada para futuros temas**
La pantalla deberá usar una paleta de colores calmada, definida como un conjunto cerrado y reutilizable.

- CA-9.1: Cuando el usuario acceda a la pantalla, esta deberá usar una única paleta, con contraste suficiente y aplicada de forma coherente a fondo, círculo, tipografía y botones.
- CA-9.2: Si la paleta se sustituye por otra, entonces la disposición, los controles y el comportamiento de la pantalla no deberán cambiar.

## Requisitos no funcionales

- **RNF-1 — Idioma**: textos de interfaz y de spec en castellano; código, variables y comentarios en inglés.
- **RNF-2 — Responsive**: la pantalla debe verse correctamente y ser usable en móvil (desde 375 px de ancho) y en escritorio.
- **RNF-3 — Precisión**: al final de una fase, el tiempo mostrado no debe desviarse más de ±1 segundo del tiempo real transcurrido.
- **RNF-4 — Accesibilidad**: los botones deben tener nombre accesible y el estado PLAY/PAUSE debe ser identificable sin depender solo del color.
- **RNF-5 — Sin dependencias nuevas**: el aviso sonoro y el resto de la funcionalidad deben resolverse sin dependencias externas nuevas.
  - Nota (dependencia aprobada explícitamente por el usuario): la única dependencia añadida en esta spec es `@vitest/coverage-v8` como devDependency, necesaria para medir y bloquear la cobertura de RNF-6. No afecta a la funcionalidad.
- **RNF-6 — Cobertura**: mínimo 90% de cobertura sobre la lógica, según la constitución.

## Casos límite

- **CL-1**: El tiempo llega a cero mientras el usuario pulsa PAUSE o RESET → manda la transición de fase (CA-3.4).
- **CL-2**: Valores límite 1 y 60 minutos → aceptados; decimales, 0, negativos, vacío o texto no numérico → rechazados conservando el último valor válido.
- **CL-3**: El usuario edita un tiempo y pulsa PLAY sin salir del campo → arranca con el último valor válido.
- **CL-4**: El usuario edita el tiempo de la fase actual en pausa (p. ej. descanso) → el cronómetro queda parado, listo para PLAY, con el tiempo nuevo.
- **CL-5**: Recarga durante el descanso → se recuerda la fase de descanso con su tiempo completo, cronómetro parado, y los tiempos ajustados se conservan.
- **CL-6**: El navegador bloquea el sonido hasta la primera interacción del usuario → la tarjeta de aviso debe mostrarse igualmente.
- **CL-7**: Varias transiciones seguidas → las tarjetas se sustituyen entre sí, sin solaparse ni tapar los controles.
- **CL-8**: Al volver, el tiempo transcurrido cubre varias fases → el sistema deberá situarse en la fase que corresponda al tiempo real transcurrido, con el cronómetro corriendo, y emitir una única tarjeta y un único aviso sonoro, sin ráfaga por las fases ya pasadas.

## Fuera de alcance

- Selección de otras paletas o temas: esta versión deja la paleta preparada, pero solo ofrece una.
- Contador de ciclos, estadísticas, historial o registro de sesiones.
- Notificaciones del navegador, integración con calendario o recordatorios.
- Volumen, elección o configuración del sonido de aviso.
- Edición de tiempos en segundos o en cualquier unidad distinta de minutos.
- Pausas largas, ciclos configurables o cualquier variante además de concentración (25) y descanso (5).
- Internacionalización.

## Criterios de finalización

1. La pantalla muestra el círculo, el tiempo restante y los controles PLAY/PAUSE con RESET a la derecha, deshabilitado sin cronómetro en curso (RF-1, RF-2, RF-3).
2. El ciclo se encadena solo: concentración → descanso → concentración, con tarjeta y aviso sonoro en cada transición (RF-4, RF-5, RF-6).
3. Los tiempos se editan como enteros de 1 a 60 minutos solo con el cronómetro parado o en pausa, y se recuerdan al recargar junto a la fase actual (RF-7, RF-8).
4. La paleta es un conjunto cerrado y coherente, sustituible sin alterar la pantalla (RF-9).
5. Casos límite del documento cubiertos (CL-1 a CL-8).
6. Verificado en móvil de 375 px y en escritorio (RNF-2).
7. Cobertura de tests ≥ 90% y verificaciones del proyecto en verde (RNF-6).

## Dudas abiertas

- Ninguna.
