# Plan — Spec 002: Pantalla principal del cronómetro Pomodoro

CÓMO de la spec aprobada (`specs/002-pomodoro-timer/spec.md`, commit `cf2cac3`). Rama de trabajo: `spec/002-pomodoro-timer`.

## 1. Enfoque general

- Un **servicio de estado** (`TimerService`, señales de Angular) contiene todo el comportamiento del ciclo; los componentes son presentacionales y solo hablan por `inputs()`/`outputs()`. Cumple la regla 3 de la constitución (lógica fuera de la vista) y permite testear la lógica en Node sin DOM.
- Toda la aritmética temporal y la validación de datos son **funciones puras con `now` (epoch ms) como parámetro** (`timer.logic.ts`, `timer-storage.ts`): deterministas, sin efectos y con los 9 RF cubiertos sin tocar el navegador.
- Reparto: 1 hoja de tipos, 1 hoja de lógica pura, 1 hoja de persistencia pura, 3 servicios finos (estado, storage, sonido), 4 componentes de una sola responsabilidad y un bloque de tokens. Nada más.

## 2. Decisiones técnicas clave

### 2.1 Tiempo fiable en segundo plano (RNF-3 ±1 s, CL-8)

- El estado guarda `endsAt` (epoch ms de fin de fase) y, solo parado/pausado, `remainingMs`. En cada tick `remaining = max(0, endsAt - Date.now())`: **la verdad es el reloj** y el `setInterval(1000)` es solo un disparador de repintado. Si el navegador lo estrangula en segundo plano, el primer tick al volver recalcula el valor correcto → deriva 0 s.
  - Descartado: decrementar un contador por tick (`remaining -= 1000`) — acumula deriva y pierde el tiempo real con la pestaña oculta.
  - Descartado: `performance.now()` como única fuente — es monótono, pero se reinicia al recargar y RF-8 exige recordar entre visitas. Se usa `Date.now()` como fuente persistible.
- `visibilitychange` → visible fuerza un `tick(now)` inmediato, sin esperar al siguiente intervalo.
- **Sin ráfaga (CL-8)**: `advance(state, now)` avanza de fase en bucle hasta situarse en la fase que contiene `now` y devuelve `{ state, transitioned }` con **un único** booleano → como máximo una tarjeta y un pitido por tick.
- **CL-1 / CA-3.4**: PLAY, PAUSE y RESET ejecutan antes un `advance(state, now)`; si ese tick produce transición, la transición manda y la acción del usuario no deja la fase a medias.

### 2.2 Círculo que se vacía (RF-1) sin dependencias

- **SVG nativo**: un `<circle>` con `stroke-dasharray` = circunferencia y `stroke-dashoffset` = circunferencia × `progress()` (0 lleno → 1 vacío), rotado −90°. Con `transition: stroke-dashoffset 1s linear` en `timer-dial.css` el salto de 1 s del tick se ve como vaciado continuo (CA-1.2).
  - Descartado: `<canvas>` — dibujo imperativo, más código y sin DOM accesible.
  - Descartado: `conic-gradient` — control menos fino del borde y peor encaje con los tokens de paleta.

### 2.3 Persistencia (RF-8, CL-5)

- `localStorage`, clave única `pomodoro.state.v1`, con `{"focusMinutes":25,"breakMinutes":5,"phase":"focus"}`. Se guardan **tiempos por fase, no un instante absoluto** → CA-8.2 (recargar en curso deja la fase recordada con su tiempo completo y el cronómetro parado) sale gratis y ninguna fase se puede perder.
- `parseStoredState(raw)` (puro) valida clave por clave: entero 1..60 y `phase ∈ {focus, break}`; cada valor inválido cae a su defecto por separado → CA-8.3 (corrupto → 25/5 conservando la fase si es válida).
- El acceso al navegador queda aislado en `TimerStorageService` con `try/catch` (modo privado, cuota) → la lógica no conoce `localStorage`.
- Escritura al cambiar tiempos o fase y en `pagehide`/`visibilitychange`; nunca en cada tick.

### 2.4 Paleta como conjunto cerrado (RF-9)

- Los tokens viven en **un único bloque `@theme` de `src/styles.css`** (Tailwind v4 CSS-first): `--color-bg`, `--color-surface`, `--color-text`, `--color-accent`, `--color-track`, `--color-focus`, `--color-break`. La interfaz usa solo clases derivadas de ellos (`bg-surface`, `text-text`, `stroke-accent`…) y **ningún color literal**; sustituir la paleta es cambiar el bloque, sin tocar disposición ni controles (CA-9.2).
  - Descartado: `tailwind.config.js` (v4 es CSS-first) y colores por componente (dispersos → no se sustituyen de una vez).
- Aviso de MEMORY: los estilos unlayered pisaban `@layer utilities` → solo `timer-dial.css` usa estilo propio (la transición) y sobre una propiedad sin utility en conflicto.

### 2.5 Aviso sonoro sin dependencias (RF-6, RNF-5, CL-6)

- **Web Audio API nativa**: `TimerSoundService` crea el `AudioContext` de forma perezosa en el primer gesto (el PLAY) — así el navegador no lo bloquea — y emite un pitido corto (Oscillator + Gain, ~150 ms).
  - Descartado: `<audio>` con un `.mp3` en `public/` — añade un binario y depende de un asset ajeno al código.
- Si el contexto no existe, está `suspended` o `resume()` es rechazado, el servicio **captura el error y no hace nada**: la tarjeta se muestra igual (CL-6). El sonido es un extra, nunca una condición del flujo.

### 2.6 Cobertura de tests (RNF-6) — dependencia aprobada

- `@vitest/coverage-v8` pasa a devDependency: es la única añadida en esta spec, **aprobada explícitamente por el usuario** y anotada junto a RNF-5 en `spec.md`. Es la única forma de medirla: `ng test --coverage` aborta sin ella (comprobado en el repo).
- Medición: `npm run test:coverage` (`ng test --no-watch --coverage`), tabla por fichero. `vitest.config.ts` fija `coverage.include` a `timer.logic.ts` y `timer-storage.ts` y `thresholds` 90 (lines/branches/functions/statements), para que la cobertura no pueda bajar sin romper el comando.
  - Descartado: no fijar umbral y revisar la tabla a mano — la garantía se pierde en el siguiente commit.

## 3. Estructura de ficheros

Nuevos (lógica fuera de la vista):

| Fichero                                                         | Contenido                                                                                                                          |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/timer/timer.model.ts`                                  | Tipos (`Phase`, `TimerState`, `StoredState`) y constantes (25/5, rango 1..60, clave de storage).                                   |
| `src/app/timer/timer.logic.ts`                                  | Puros: `createState`, `remainingMs`, `progress`, `advance`, `start`, `pause`, `reset`, `setMinutes`, `formatTime`, `parseMinutes`. |
| `src/app/timer/timer.logic.spec.ts`                             | Tests de la lógica pura.                                                                                                           |
| `src/app/timer/timer-storage.ts`                                | Puros: `toStored`, `parseStoredState`.                                                                                             |
| `src/app/timer/timer-storage.spec.ts`                           | Tests de validación y estado corrupto.                                                                                             |
| `src/app/timer/timer-storage.service.ts`                        | Envoltura fina de `localStorage` con `try/catch`.                                                                                  |
| `src/app/timer/timer-storage.service.spec.ts`                   | Tests de lectura/escritura y degradación.                                                                                          |
| `src/app/timer/timer-sound.service.ts`                          | Web Audio: `unlock()`, `beep()`, tolerante a bloqueo.                                                                              |
| `src/app/timer/timer-sound.service.spec.ts`                     | Tests con contexto de audio ausente/bloqueado (CL-6).                                                                              |
| `src/app/timer/timer.service.ts`                                | Estado en señales + intervalo + `visibilitychange` + sonido + persistencia.                                                        |
| `src/app/timer/timer.service.spec.ts`                           | Tests de orquestación con reloj falso.                                                                                             |
| `src/app/timer/timer-dial/timer-dial.{ts,html,css,spec.ts}`     | Círculo SVG + tiempo `MM:SS`, presentacional.                                                                                      |
| `src/app/timer/timer-controls/timer-controls.{ts,html,spec.ts}` | Botones PLAY/PAUSE y RESET.                                                                                                        |
| `src/app/timer/time-inputs/time-inputs.{ts,html,spec.ts}`       | Campos numéricos 1..60, deshabilitados en curso.                                                                                   |
| `src/app/timer/phase-notice/phase-notice.{ts,html,spec.ts}`     | Tarjeta superior con autoocultado 3-5 s.                                                                                           |
| `vitest.config.ts`                                              | Solo cobertura: `include` de la lógica + umbral 90.                                                                                |

Modificados: `src/styles.css` (bloque `@theme`), `src/app/app.{ts,html,css}` y `src/app/app.spec.ts` (shell), `package.json` (devDependency + scripts), `MEMORY.md`.

## 4. Contrato interfaz ↔ lógica (congelado; permite paralelizar)

- `app-timer-dial`: `[progress]: number` (0..1), `[remaining]: string` (`MM:SS`), `[phase]: Phase`.
- `app-timer-controls`: `[running]: boolean`, `(toggle)`, `(reset)`; RESET con `[disabled]="!running"` y siempre a la derecha de PLAY/PAUSE (CA-3.1, CA-3.2).
- `app-time-inputs`: `[focusMinutes]`, `[breakMinutes]`, `[disabled]`, `(focusChange)`, `(breakChange)` — emiten el valor tecleado tal cual; validar es cosa de `parseMinutes`.
- `app-phase-notice`: `[message]: string | null`, `(dismiss)`.

## 5. Estrategia de tests (≥90 %)

- **Lógica (objetivo 100 %)**: `timer.logic` → transición exacta a 0 ms, progreso 0..1, `MM:SS`, edición válida/inválida (CL-2, CA-7.4, CA-7.5) y CL-1/CL-8 con `now` inyectado (varias fases saltadas → una sola transición). `timer-storage` → corrupto, fuera de rango, fase válida y `null`.
- **Servicios**: `vi.useFakeTimers()` + `Date.now` controlado; se comprueba que el intervalo no acumula deriva, que `visibilitychange` recalcula, que se persiste al cambiar y que el sonido bloqueado no rompe el flujo.
- **Interfaz**: un `.spec.ts` por componente en TestBed — render del tiempo, estado/etiquetas de los botones (RNF-4: nombre accesible y texto, no solo color), `disabled` de inputs y RESET, autoocultado de la tarjeta y emisión de eventos.
- El umbral solo cuenta `timer.logic.ts` y `timer-storage.ts` (los componentes son plantilla fina).

## 6. Verificación final

1. `npm run verify` (formato + calidad + tests) y `npm run test:coverage` con el umbral en verde; `npm run build` sin errores.
2. Chrome DevTools: consola limpia y recorrido completo (PLAY → pausa/reanuda sin reiniciar → RESET deshabilitado/habilitado → transición con tarjeta y sonido → recarga con tiempos y fase recordados → edición de 1 y 60 y rechazo de 0, 61, decimal y vacío) con emulación móvil **375×667** y en escritorio.
3. Comprobación manual de CL-6 (sonido bloqueado → la tarjeta se ve igual) y CL-8 (pestaña en segundo plano hasta pasar de fase → una sola tarjeta).

## Cobertura RF → plan

| RF   | Dónde se cubre                   |
| ---- | -------------------------------- |
| RF-1 | §2.2, §3 (dial), §5              |
| RF-2 | §2.1, §4, T4/T8                  |
| RF-3 | §2.1 (CL-1), §4, T4/T8           |
| RF-4 | §2.1, §2.5, §6                   |
| RF-5 | §2.1, §2.5                       |
| RF-6 | §2.5, §3 (tarjeta)               |
| RF-7 | §2.3, §5 (`parseMinutes`), T5/T8 |
| RF-8 | §2.3                             |
| RF-9 | §2.4                             |
