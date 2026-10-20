# MEMORY.md — Simple Pomodoro GBDevs

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual

- **Spec 002 implementada, aprobada y verificada** en la rama `spec/002-pomodoro-timer` (pendiente de merge a `master` y push); spec 001 ya mergeada y su rama eliminada.
- Pantalla Pomodoro completa: círculo SVG que se vacía, PLAY/PAUSE + RESET, edición de minutos 1..60, ciclos auto con tarjeta y pitido, persistencia en `localStorage`.
- Stack sin cambios: Angular 22 + TS + Vite; vitest vía `@angular/build:unit-test`; Tailwind v4 CSS-first (bloque `@theme` en `src/styles.css`).
- Calidad sin cambios: Prettier único formateador (`.prettierrc`), ESLint 10 flat; husky 9 + lint-staged (pre-commit formato+lint, pre-push `npm run verify`).
- Verificación en verde: `npm run verify`, `npm run test:coverage` (100 % sobre la lógica, umbral 90), `npm run build` y Chrome DevTools (móvil 375×667 y escritorio, consola limpia). 105 tests.

## Decisiones (y por qué)

- **Reloj absoluto como fuente de verdad**: el estado guarda `endsAt` (`Date.now()`) y por tick `remaining = max(0, endsAt - Date.now())` → deriva 0 s con la pestaña en segundo plano (RNF-3). Descartado decrementar un contador por tick (acumula deriva); `performance.now()` no sirve porque se reinicia al recargar.
- **`now` como parámetro en la lógica pura** (`timer.logic.ts`, `timer-storage.ts`): funciones deterministas sin DOM, testeadas en Node (CL-8 resuelta con `advance(state, now)` → una sola transición por tick).
- **Almacenamiento por fase, no instante** (`{focusMinutes, breakMinutes, phase}`): recargar en curso deja la fase recordada con su tiempo completo y parado (CA-8.2) sin perder ninguna fase.
- **Tokens `@theme` de Tailwind v4** (7 tokens de color, cero colores literales en plantillas/CSS): paleta sustituible en un solo punto sin tocar la pantalla (RF-9).
- **Sonido con Web Audio nativo** (Oscillator + Gain, `AudioContext` perezoso en el primer gesto): sin dependencias; si el navegador lo bloquea, solo no suena y la tarjeta se ve igual (CL-6).
- **`@vitest/coverage-v8`**: única dependencia nueva de la spec, devDependency **aprobada explícitamente por el usuario** (RNF-5/RNF-6).
- **Desviación T2**: los globs `coverageInclude` viven también en `angular.json` porque el builder de Angular instrumenta desde ahí; `vitest.config.ts` (vía `runnerConfig`) guarda `coverage.include` y `thresholds`.
- Base spec 001 vigente: Prettier único y ESLint sin reglas de formato (CL-5); `endOfLine: "auto"` (evita falso bloqueo CRLF en Windows); hooks fail-closed con `set -e` y pre-push como segunda red; excepción RN-1 escrita una sola vez en `AGENTS.md`.

## Aprendizajes y errores a evitar

- Si en `dist/.../styles-*.css` aparece `@tailwind utilities;` literal, el plugin PostCSS NO se ejecutó y el build **no** falla: comprobar `.clase{` expandida; el config debe ser `postcss.config.json` (el builder solo auto-detecta JSON).
- Estilos unlayered pisan `@layer utilities` de v4 en la misma propiedad → modifier `!` (`text-3xl!`) o evitar estilos propios sobre propiedades con utility en conflicto.
- `@typescript-eslint/no-unused-vars` es ERROR en recommended; avisos de git sobre LF/CRLF con `core.autocrlf` en Windows son normales, no fallos.
- No añadir ninguna dependencia fuera de la excepción RN-1 (la única aprobada en spec 002: `@vitest/coverage-v8`).
- No confiar en que un comando de cobertura falle sin la dependencia instalada: verificar la tabla y los umbrales (`ng test --coverage` abortaba sin ella).

## Mejora pendiente (para la próxima spec)

- **Radio del SVG duplicado**: `src/app/timer/timer-dial/timer-dial.html` usa `45` a mano en `[attr.r]` mientras `timer-dial.ts` define `const RADIUS = 45` → dos puntos de verdad para un mismo valor. Unificar en la constante al crear la siguiente spec.

## Próximos pasos

- Merge de `spec/002-pomodoro-timer` en `master` y push a `origin` (`master` solo existe en local).
- Revisar la mejora pendiente del radio 45 en la próxima spec.
