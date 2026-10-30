# MEMORY.md — Simple Pomodoro GBDevs

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual

- **Spec 006 (cadencia del conteo) en curso**, rama `006-timer-jumps`: corregir el salto del timer en Firefox mediante repintado alineado a límites de segundo (plan y tareas en `specs/006-timer-jumps/`).
- **006/T2 hecha**: `nextTickDelay(state, now)` pura en `timer.logic.ts` (`null` parado, `0` vencido, `1000` en límite justo, resto `% 1000`); recalcularlo en cada disparo es lo que evita la deriva.
- **006/T3 hecha**: servicio con un `setTimeout` encadenado alineado a límites de segundo vía `nextTickDelay` (reprogramado en cada tick, `apply()` y visibilitychange; sin `setInterval`/TICK_MS). Porqué: el jitter de Firefox con `setInterval(1000)` + `Math.ceil` hacía saltar un valor.
- **006/T4 verificada en Firefox (condiciones controladas)**: 7,4 min de conteo, 442 cambios, deltas 935–1057 ms, 0 saltos ni repeticiones, deriva ≈0 (transiciones a 60,018/360,015/420,011 s), dial ±0,1 s, consola limpia; CL-1/CL-4/CL-5 OK; CL-2/CL-3 no reproducibles con el MCP (pendientes). El primer intento (Chrome en paralelo) medía ruido del entorno: micro-pares 1105/885 ms.
- **006/T5 verificada en Chrome (regresión, sin diferencias)**: 65 s limpios → 00:59→00:01→01:00 estricto, deltas 960–1039 ms (74 mediciones), 0 saltos/repeticiones; dial 1 paso/s coherente; pausa/reset/edición 1..60/aviso 4 s/recarga/consola limpia; escritorio 1920×889 y móvil 375×667 sin overflow. Pitido no verificable por MCP (sin audio).
- **Spec 004 (selector de paletas) mergeada en `master` (`a99bff0`), rama eliminada (T1–T8).** T6 verificada en navegador: 11/11 comprobaciones OK (móvil 375×667 y escritorio, consola limpia), `verify` + coverage + build en verde.
- **Spec 005 (recolocación del selector) mergeada en `master` (`98b1ece`), rama eliminada (T1–T4).** Verificación T4 con Chrome DevTools en escritorio y móvil 375×667: picker dentro de la tarjeta entre subtítulo y dial (RF-1), tarjeta única y centrada, desplegable centrado bajo el icono que tapa el dial (CL-1) y se cierra al elegir, botón circular 44×44 intacto, sin overflow horizontal (RNF-1), consola limpia; `npm run verify` en verde (184/184); validación @reviewer RF por RF: OK.
- **Selector de paletas**: 4 paletas (Sereno default, Noche, Atardecer, Bosque); fuente única de datos en TS (los 7 hex por paleta viven solo en `palette.logic.ts`, sin duplicados en CSS); aplicación runtime re-escribiendo las 7 variables `--color-*` en `documentElement`; transición de color solo bajo `@media (prefers-reduced-motion: no-preference)`. Sin dependencias nuevas.
- Specs 001, 002 y 003 (cookies/RGPD) mergeadas en `master` con `--no-ff`; ramas eliminadas (sin remoto configurado todavía). Pantalla Pomodoro completa: SVG que se vacía, PLAY/PAUSE + RESET, edición 1..60, ciclos auto con pitido.
- Stack: Angular 22 + TS + Vite; vitest vía `@angular/build:unit-test`; Tailwind v4 CSS-first (`@theme` en `src/styles.css`). Calidad: Prettier único, ESLint 10 flat, husky 9 + lint-staged (pre-push `npm run verify`).

## Decisiones importantes (y por qué)

- **Paleta persistida en clave propia `pomodoro.palette.v1` dentro de `TimerStorageService`**, con el MISMO gate `canPersist` que los datos del timer (punto único de persistencia → RF-5 por construcción); `wipeAppData` la borra también.
- **Revocación: `restoreDefault()` DESPUÉS de `clearConsent()`** — si se limpia el consentimiento primero, el gate deja de bloquear y `writePalette` reescribe la clave (lección clave de T5 de la 004).
- **Reloj absoluto (`endsAt` + `Date.now()`) como fuente de verdad del timer**: deriva 0 s en segundo plano (RNF-3). La lógica pura recibe `now` por parámetro (`advance`), determinista y testeable en Node.
- **Gate de consentimiento (spec 003)**: sin `'accept'`, `save` es no-op y `load` devuelve 25/5; elección en clave propia `pomodoro.consent.v1` (los datos no destruyen la elección). Al rechazar: borrar datos → DESPUÉS escribir la elección. Sin `localStorage.clear()` (borraría claves ajenas al origen).
- **Sin `consent.service.ts`** (re-scope de la 003): la orquestación vive en el shell; `timer.service` solo expone `persistNow()`/`restoreDefaults()`.
- **Tokens `@theme` de Tailwind v4** (cero colores literales en utilities) + paleta runtime sobre esas mismas variables.
- **Sonido con Web Audio nativo** (sin dependencias; si el navegador lo bloquea, solo no suena).
- **Cobertura**: `@vitest/coverage-v8` (única dependencia añadida en el proyecto, aprobada); los globs `coverageInclude` viven también en `angular.json` porque el builder instrumenta desde ahí.
- **NUEVA REGLA (2026-10, usuario): todos los mensajes de commit, de aquí en adelante, en INGLÉS**, manteniendo conventional-commits + código de tarea `T#`. Propuesta pendiente de moverla a `AGENTS.md`.

## Aprendizajes y errores a evitar

- **`viewChild.required` dentro de un `effect` lanza NG0951**: las queries requeridas aún no existen al reaccionar → usar no-required + `effect` o foco inicial con `afterNextRender`.
- **`preventDefault` incondicional en Tab rompe el focus trap** (bug real de la 003): prevenir solo cuando el foco está en el primer/último elemento enfocable.
- **`localStorage` puede lanzar al acceder** (p. ej. modo incógnito): siempre `try/catch` en lectura/escritura → degradación a memoria sin excepción.
- **CL-2 (004)**: el overlay de consentimiento de la 003 cubre el picker mientras el modal está abierto; comportamiento aceptado, preverlo en la verificación visual.
- Si en `dist/.../styles-*.css` aparece `@tailwind utilities;` literal, el plugin PostCSS NO se ejecutó y el build **no** falla: comprobar `.clase{` expandida; el config debe ser `postcss.config.json`.
- Estilos unlayered pisan `@layer utilities` de v4 en la misma propiedad → modifier `!` (`text-3xl!`) o evitar estilos propios sobre propiedades con utility en conflicto.
- `@typescript-eslint/no-unused-vars` es ERROR en recommended; avisos de git sobre LF/CRLF con `core.autocrlf` en Windows son normales, no fallos.
