# Tareas — Spec 002: Pantalla principal del cronómetro Pomodoro

Ejecución en la rama `spec/002-pomodoro-timer`, en orden. Cada tarea es independiente y lleva sus tests dentro del mismo alcance. Cada tarea termina con un commit de mensaje conventional-commits aprobado por el usuario.

**Olas de paralelización** (contrato de §4 del plan congelado):

- **Ola 1 (paralelo)**: T1 || T7.
- **Ola 2**: T2 (necesita T1 para medir cobertura).
- **Ola 3 (paralelo)**: T3 || T4 || T5 || T6 (ficheros disjuntos; T5 y T6 no dependen de T2 salvo el tipo `Phase`). Pueden adelantarse a la ola 1 respetando el contrato, pero no compilan ni se testean hasta que T2 esté mergeado.
- **Ola 4**: T8 (integra todo).
- **Ola 5**: T9 y después T10 (serial).

`MEMORY.md` lo toca **un solo implementer por ola** (al cerrar T2, al cerrar la ola 3 y en T8) y T10 al final, para evitar conflictos.

## T1 — Herramienta de cobertura y script (RNF-6; nota RNF-5 ya aplicada)

- **Objetivo**: poder medir la cobertura.
- **Ficheros**: `package.json` (devDependency `@vitest/coverage-v8` — dependencia aprobada explícitamente por el usuario; script `"test:coverage": "ng test --no-watch --coverage"`).
- **RF**: RNF-6 (parcial).
- **Depende de**: nada.
- **Hecho cuando**: `npm run test:coverage` imprime la tabla de cobertura y sale con 0; `@vitest/coverage-v8` es la única dependencia añadida; el umbral y su `include` quedan para T2 (aún no hay lógica que medir).
- **Estado**: ✅ Hecha. `@vitest/coverage-v8@^5.0.5` (misma versión que el `vitest` instalado) + script `test:coverage`; la tabla de cobertura se imprime y sale con 0; `format:check`, `lint` y `test:run` en verde. Umbral y `coverage.include` sin tocar (T2).

## T2 — Lógica pura del ciclo y validación de estado guardado (RF-1, RF-4, RF-5, RF-7, RF-8)

- **Objetivo**: todo el cálculo y la validación, deterministas y sin DOM.
- **Ficheros**: `src/app/timer/timer.model.ts`, `src/app/timer/timer.logic.ts`, `src/app/timer/timer.logic.spec.ts`, `src/app/timer/timer-storage.ts`, `src/app/timer/timer-storage.spec.ts`, `vitest.config.ts` (nuevo: `coverage.include` de lógica + `thresholds` 90).
- **RF**: RF-1, RF-4, RF-5, RF-7, RF-8; RNF-3, RNF-6. Casos límite: CL-1, CL-2, CL-5, CL-8.
- **Depende de**: T1 (para medir la cobertura).
- **Hecho cuando**: existen las funciones puras de §3 del plan con `now` como parámetro; `npm run test:coverage` sale en verde con umbral 90 y `timer.logic.ts`/`timer-storage.ts` al 100 %; los tests cubren transición exacta a 0 ms, progreso, `MM:SS`, edición válida/inválida (1, 60, 0, 61, decimal, vacío, texto), estado corrupto → 25/5 con fase válida, y CL-8 con `now` que salta varias fases emitiendo una sola transición.
- **Estado**: ✅ Hecha. 40 tests (100 % en `timer.logic.ts` y `timer-storage.ts`, 4 métricas). Desviación anotada: el `coverage.include` de `vitest.config.ts` por sí solo no basta — el builder de Angular instrumenta desde `angular.json`, así que los globs `coverageInclude` viven también ahí y `runnerConfig` apunta a `vitest.config.ts` (donde quedan los `thresholds`). `format:check`, `lint`, `test:run` y `build` en verde.

## T3 — Círculo y tiempo restante (RF-1)

- **Objetivo**: el elemento visual del tiempo.
- **Ficheros**: `src/app/timer/timer-dial/timer-dial.ts|.html|.css|.spec.ts`.
- **RF**: RF-1 (CA-1.1 a CA-1.4); RNF-4. Contrato: `[progress]`, `[remaining]`, `[phase]`.
- **Depende de**: nada (solo el contrato).
- **Hecho cuando**: muestra el tiempo en `MM:SS` y un `<circle>` SVG cuyo `stroke-dashoffset` responde a `progress` (lleno/vacío/media circunferencia) con transición de 1 s, usando solo tokens de la paleta; el spec cubre lleno, mitad y vacío; se ve correcto a 375 px.

## T4 — Botones PLAY/PAUSE y RESET (RF-2, RF-3)

- **Objetivo**: los controles del cronómetro.
- **Ficheros**: `src/app/timer/timer-controls/timer-controls.ts|.html|.spec.ts`.
- **RF**: RF-2, RF-3 (CA-3.1, CA-3.2); RNF-4. Contrato: `[running]`, `(toggle)`, `(reset)`.
- **Depende de**: nada (solo el contrato).
- **Hecho cuando**: un único botón alterna PLAY y PAUSE, con nombre accesible y texto en castellano además del icono (RNF-4, no solo color); RESET está siempre a la derecha y `disabled` sin cronómetro en curso; el spec cubre ambos estados y el caso deshabilitado.

## T5 — Edición de los minutos (RF-7)

- **Objetivo**: los campos de configuración.
- **Ficheros**: `src/app/timer/time-inputs/time-inputs.ts|.html|.spec.ts`.
- **RF**: RF-7 (CA-7.2, CA-7.3 a nivel de UI); RNF-4. Contrato: `[focusMinutes]`, `[breakMinutes]`, `[disabled]`, `(focusChange)`, `(breakChange)`.
- **Depende de**: nada (solo el contrato).
- **Hecho cuando**: dos `input[type=number]` rotulados en castellano, con `min`/`max` 1..60, deshabilitados cuando se pasa `disabled`, y que emiten el valor tecleado sin validarlo; el spec cubre el estado deshabilitado y la emisión de cada campo.

## T6 — Tarjeta de aviso (RF-6)

- **Objetivo**: el aviso visual de cada cambio de fase.
- **Ficheros**: `src/app/timer/phase-notice/phase-notice.ts|.html|.spec.ts`.
- **RF**: RF-6 (CA-6.1 a CA-6.3); RNF-2. Contrato: `[message]`, `(dismiss)`.
- **Depende de**: nada (solo el contrato).
- **Hecho cuando**: la tarjeta aparece en la parte superior, se oculta sola entre 3 y 5 s o al pulsarla, y un mensaje nuevo sustituye al anterior sin solaparse; el spec con reloj falso cubre autoocultado, click y sustitución; no tapa los controles a 375 px.

## T7 — Paleta cerrada y base responsive (RF-9, RNF-2) (✅ completada)

- **Objetivo**: el conjunto de colores sustituible en un solo punto.
- **Ficheros**: `src/styles.css` (bloque `@theme`), `src/app/app.css` (base de pantalla).
- **RF**: RF-9 (CA-9.1, CA-9.2); RNF-2.
- **Depende de**: nada; paralelizable con todo.
- **Hecho cuando**: existe un único bloque `@theme` con los 7 tokens de §2.4 del plan; no hay ningún color literal en `src/app/**/*.html` ni en los `.css` de componentes; cambiar los valores del bloque no altera disposición, controles ni comportamiento (CA-9.2); contraste suficiente comprobado a simple vista.

## T8 — Servicio del temporizador, sonido, persistencia y pantalla (RF-2 a RF-8)

- **Objetivo**: encadenar todo y montar la pantalla.
- **Ficheros**: `src/app/timer/timer.service.ts`, `timer.service.spec.ts`, `timer-sound.service.ts`, `timer-sound.service.spec.ts`, `timer-storage.service.ts`, `timer-storage.service.spec.ts`, `src/app/app.ts`, `src/app/app.html`, `src/app/app.css`, `src/app/app.spec.ts`.
- **RF**: RF-2, RF-3, RF-4, RF-5, RF-6, RF-7, RF-8, RF-9 (aplicación); RNF-2, RNF-4, RNF-5. Casos límite: CL-1, CL-3, CL-4, CL-6, CL-8.
- **Depende de**: T2, T3, T4, T5, T6, T7.
- **Hecho cuando**: el servicio (señales) arranca y pausa conservando el tiempo, reanuda sin reiniciar, resetea a la fase actual sin cambiarla, encadena fases con una sola tarjeta y un solo pitido (sin ráfaga), bloquea la edición en curso, deja el cronómetro parado y listo al editar la fase actual (CA-7.5), y persiste/restaura tiempos y fase con corrupto → 25/5; el sonido bloqueado no rompe el flujo (CL-6); el shell compone los 4 componentes y se ve correcto a 375 px; `npm run test:coverage` en verde.

## T9 — Verificación en Chrome DevTools (criterios de finalización 1 a 7)

- **Objetivo**: comprobar el comportamiento real en el navegador.
- **Ficheros**: ninguno (si aparece un fallo, se corrige en su tarea y se repite).
- **RF**: RF-1 a RF-9; RNF-2, RNF-3, RNF-4. Casos límite: CL-6, CL-8.
- **Depende de**: T8.
- **Hecho cuando**: con `npm start`, la consola está limpia; el recorrido de §6 del plan funciona en emulación móvil **375×667** y en escritorio; el tiempo no se desvía más de ±1 s tras volver de una pestaña en segundo plano (una sola tarjeta); el resultado queda anotado.

## T10 — Memoria del proyecto

- **Objetivo**: dejar el estado y las decisiones por escrito.
- **Ficheros**: `MEMORY.md`.
- **RF**: RNF-1 (documentación en castellano).
- **Depende de**: T9.
- **Hecho cuando**: `MEMORY.md` recoge el estado actual, las decisiones con su porqué (reloj absoluto como fuente de verdad, almacenamiento por fase, tokens `@theme`, Web Audio, `@vitest/coverage-v8` como dependencia aprobada) y los errores a evitar, por debajo de ~50 líneas.
