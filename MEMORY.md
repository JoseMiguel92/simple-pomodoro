# MEMORY.md — Simple Pomodoro GBDevs

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual

- **Spec 003 (cookies/RGPD) implementada en la rama `spec/003-cookies-gdpr`** (T1–T7, 141 tests): popup bloqueante de consentimiento, gate de persistencia y revocación en el pie; pendiente de validación del @reviewer y merge --no-ff (no hay remoto configurado; `master` aún no la contiene).
- Specs 001 y 002 mergeadas en `master` con --no-ff y sus ramas eliminadas.
- Pantalla Pomodoro completa: círculo SVG que se vacía, PLAY/PAUSE + RESET, edición 1..60, ciclos auto con pitido, persistencia tras gate de consentimiento.
- Stack sin cambios: Angular 22 + TS + Vite; vitest vía `@angular/build:unit-test`; Tailwind v4 CSS-first (bloque `@theme` en `src/styles.css`).
- Calidad sin cambios: Prettier único formateador (`.prettierrc`), ESLint 10 flat; husky 9 + lint-staged (pre-commit formato+lint, pre-push `npm run verify`).
- Verificación en verde: `npm run verify`, `npm run test:coverage` (100 % sobre la lógica, umbral 90), `npm run build` y Chrome DevTools (móvil 375×667 y escritorio, consola limpia).

## Decisiones (y por qué)

- **Reloj absoluto como fuente de verdad**: el estado guarda `endsAt` (`Date.now()`) y por tick `remaining = max(0, endsAt - Date.now())` → deriva 0 s con la pestaña en segundo plano (RNF-3). Descartado decrementar un contador por tick; `performance.now()` se reinicia al recargar.
- **`now` como parámetro en la lógica pura** (`timer.logic.ts`): funciones deterministas sin DOM, testeadas en Node (CL-8 resuelta con `advance(state, now)`).
- **Almacenamiento por fase, no instante** (`{focusMinutes, breakMinutes, phase}`): recargar en curso deja la fase recordada con su tiempo completo y parado (CA-8.2).
- **Gate de consentimiento en `TimerStorageService`** (spec 003): único punto de persistencia → RF-5 queda garantizada por construcción y no hay puntos de fallo múltiples como en comprobar el consentimiento en cada llamante. Sin `'accept'`: `save` es no-op y `load` devuelve 25/5.
- **Elección en clave propia `pomodoro.consent.v1`**, separada de la clave de datos: `wipeAppData` debe borrar los datos sin destruir la elección, y un estado de datos corrupto no debe disparar el popup sin motivo (RF-5, CL-1). Al rechazar, orden obligatorio: borrar datos → después escribir la elección (CA-3.1). Descartado `localStorage.clear()` (borraría claves ajenas al origen).
- **Sin `consent.service.ts`** (re-scope aprobado por el coordinator): la orquestación vive en el shell (elección como señal + gestos accept/reject/revoke); `timer.service` solo expone `persistNow()`/`restoreDefaults()` que delegan en los privados existentes (CA-2.1), sin tocar su lógica.
- **Pie de revocación visible con aceptar Y con rechazar** (CA-6.1): cambiar de opinión debe ser posible siempre, también tras un rechazo.
- **Revocación sin confirmación**: decisión explícita de diseño (CA-6.2); el enlace ya es un gesto deliberado.
- **Tokens `@theme` de Tailwind v4** (7 tokens de color, cero colores literales): paleta sustituible en un solo punto (RF-9).
- **Sonido con Web Audio nativo** (Oscillator + Gain, `AudioContext` perezoso en el primer gesto): sin dependencias; si el navegador lo bloquea, solo no suena (CL-6).
- **Cobertura**: `@vitest/coverage-v8` (única dependencia añadida en el proyecto, aprobada por el usuario); los globs `coverageInclude` viven también en `angular.json` porque el builder instrumenta desde ahí (patrón repetido en la 003).
- Base spec 001 vigente: Prettier único y ESLint sin reglas de formato (CL-5); `endOfLine: "auto"`; hooks fail-closed con `set -e`; excepción RN-1 escrita una sola vez en `AGENTS.md`.

## Aprendizajes y errores a evitar

- **`viewChild.required` dentro de un `effect` lanzaba NG0951** (popup de la 003): las queries requeridas aún no existen al reaccionar → foco inicial con `afterNextRender`.
- **`preventDefault` incondicional en Tab rompe el focus trap** (bug real de T6): con un solo botón enfocable el foco se traba y no se llega a "Aceptar" con el teclado; prevenir solo cuando el foco está en el primer/último elemento.
- **`localStorage` puede lanzar al acceder** (p. ej. modo incógnito): siempre `try/catch` en lectura/escritura → degradación a memoria sin excepción (CL-7).
- Si en `dist/.../styles-*.css` aparece `@tailwind utilities;` literal, el plugin PostCSS NO se ejecutó y el build **no** falla: comprobar `.clase{` expandida; el config debe ser `postcss.config.json` (el builder solo auto-detecta JSON).
- Estilos unlayered pisan `@layer utilities` de v4 en la misma propiedad → modifier `!` (`text-3xl!`) o evitar estilos propios sobre propiedades con utility en conflicto.
- `@typescript-eslint/no-unused-vars` es ERROR en recommended; avisos de git sobre LF/CRLF con `core.autocrlf` en Windows son normales, no fallos.
- No añadir ninguna dependencia fuera de la excepción RN-1; `ng test --coverage` abortaba sin `@vitest/coverage-v8` instalada (verificar la tabla y los umbrales, no confiar en el código de salida).

## Mejora pendiente (para la próxima spec)

- **Radio del SVG duplicado**: `src/app/timer/timer-dial/timer-dial.html` usa `45` a mano en `[attr.r]` mientras `timer-dial.ts` define `const RADIUS = 45` → unificar en la constante.

## Próximos pasos

- Validación del @reviewer de la spec 003 y merge --no-ff a `master` (sin remoto configurado todavía).
- Revisar la mejora pendiente del radio 45 en la próxima spec.
