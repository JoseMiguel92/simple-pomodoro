# MEMORY.md — Simple Pomodoro GBDevs

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual

- **Spec 004 (selector de paletas) mergeada en `master` (`a99bff0`), rama eliminada (T1–T8).** T6 verificada en navegador: 11/11 comprobaciones OK (móvil 375×667 y escritorio, consola limpia), `verify` + coverage + build en verde.
- **Spec 005 (recolocación del selector) en curso en la rama `spec/005-refactor-color-palettes`: T1–T2 hechas (docs + picker dentro de la tarjeta, bajo el subtítulo; `main` sin `gap-3`/`shrink-0`). Pendiente T3 (centrar desplegable) y T4 (verificación visual).**
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
