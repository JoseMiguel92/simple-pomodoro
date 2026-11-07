# MEMORY.md — Simple Pomodoro GBDevs

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual

- **Spec 006 (cadencia del conteo) implementada y verificada (T1–T6)**, rama `006-timer-jumps` pendiente de merge: Firefox en condiciones controladas y regresión Chrome sin diferencias; `verify` + coverage (100 %) + build en verde.
- **006/T4 Firefox (condiciones controladas)**: 7,4 min, 442 cambios, deltas 935–1057 ms, 0 saltos ni repeticiones, deriva ≈0 (transiciones a 60,018/360,015/420,011 s), dial ±0,1 s, consola limpia; CL-1/CL-4/CL-5 OK.
- **006/T5 Chrome (regresión)**: 65 s limpios → 00:59→00:01→01:00, deltas 960–1039 ms (74 mediciones), 0 saltos/repeticiones; pausa/reset/edición 1..60/aviso 4 s/recarga/consola limpia; escritorio y móvil 375×667 sin overflow.
- **006/T2–T3**: `nextTickDelay(state, now)` pura en `timer.logic.ts` (`null` parado, `0` vencido, `1000` en límite justo, resto `% 1000`); servicio con un `setTimeout` encadenado reprogramado en cada tick, `apply()` y visibilitychange (sin `setInterval`/`TICK_MS`).
- Specs 001–005 mergeadas en `master` (`--no-ff`, ramas eliminadas): Pomodoro completo (SVG que se vacía, PLAY/PAUSE + RESET, edición 1..60, ciclos con pitido), cookies/RGPD y selector de 4 paletas (Sereno default, Noche, Atardecer, Bosque).
- Stack: Angular 22 + TS + Vite; vitest vía `@angular/build:unit-test`; Tailwind v4 CSS-first (`@theme` en `src/styles.css`). Calidad: Prettier único, ESLint 10 flat, husky 9 + lint-staged (pre-push `npm run verify`).

## Decisiones importantes (y por qué)

- **Repintado con `setTimeout` encadenado alineado a límites de segundo vía `nextTickDelay`**: el `setInterval(1000)` + `Math.ceil` acumulaba jitter en Firefox (cambios ~1005–1020 ms) y saltaba un valor visible; recalcular el retardo en cada disparo ata el repintado al reloj y elimina la deriva.
- **Reloj absoluto (`endsAt` + `Date.now()`) como fuente de verdad del timer**: deriva 0 s en segundo plano (RNF-3). La lógica pura recibe `now` por parámetro (`advance`), determinista y testeable en Node.
- **Selector de paletas**: los 7 hex por paleta viven solo en `palette.logic.ts` (sin duplicados en CSS); aplicación runtime reescribiendo las 7 variables `--color-*` en `documentElement`; paleta persistida en `pomodoro.palette.v1` con el MISMO gate `canPersist` que el timer.
- **Revocación: `restoreDefault()` DESPUÉS de `clearConsent()`** — si se limpia el consentimiento primero, el gate deja de bloquear y `writePalette` reescribe la clave.
- **Gate de consentimiento (003)**: sin `'accept'`, `save` es no-op y `load` devuelve 25/5; elección en clave propia `pomodoro.consent.v1`. Al rechazar: borrar datos → DESPUÉS escribir la elección. Sin `localStorage.clear()`.
- **Tokens `@theme` de Tailwind v4** (cero colores literales en utilities) + paleta runtime sobre esas mismas variables. **Sonido con Web Audio nativo**. **Cobertura** con `@vitest/coverage-v8` (globs `coverageInclude` también en `angular.json`).
- **NUEVA REGLA (2026-10, usuario): mensajes de commit en INGLÉS**, conventional-commits + código de tarea `T#`. Propuesta pendiente de moverla a `AGENTS.md`.

## Aprendizajes y errores a evitar

- **Medir la cadencia en condiciones controladas**: el Firefox DevTools MCP concurrente con otra verificación (Chrome) introduce ruido en las mediciones (micro-pares 1105/885 ms); no es defecto de la app.
- **Límites de verificación por MCP**: CL-2 (ventana sin foco) no es reproducible; el pitido no es verificable (sin audio). CL-3 (salto de reloj ≥5 s) cubierto por test con `vi.setSystemTime` (un único ajuste + cadencia limpia); no verificable en navegador por MCP.
- **`viewChild.required` dentro de un `effect` lanza NG0951** → usar no-required + `effect` o foco inicial con `afterNextRender`.
- **`preventDefault` incondicional en Tab rompe el focus trap** (bug de la 003): prevenir solo en el primer/último elemento enfocable.
- **`localStorage` puede lanzar al acceder** (incógnito): `try/catch` en lectura/escritura → degradación a memoria sin excepción.
- Si en `dist/.../styles-*.css` aparece `@tailwind utilities;` literal, el plugin PostCSS NO se ejecutó y el build **no** falla: comprobar `.clase{` expandida; el config debe ser `postcss.config.json`.
- Estilos unlayered pisan `@layer utilities` de v4 → modifier `!` (`text-3xl!`). `@typescript-eslint/no-unused-vars` es ERROR; avisos LF/CRLF en Windows son normales.
