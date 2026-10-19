# MEMORY.md — Simple Pomodoro GBDevs

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual

- Spec 001 en curso, rama `spec/001-create-project`.
- Angular 22 + TS + Vite scaffoldado; Prettier operativo (`.prettierrc`); vitest vía `@angular/build:unit-test`.
- **T1 completada**: ESLint 10 flat config (`eslint.config.js`) con typescript-eslint 8 + angular-eslint 22; scripts `format`, `format:check`, `lint` en verde; exclusiones (`dist`, `coverage`, `.angular`, `.husky`, `package-lock.json`) en `.prettierignore` e `ignores` de ESLint.
- **T2 completada**: scripts `test:run` (`ng test --no-watch`, ejecución única vitest) y `verify` (formato + calidad + tests con echo por paso y parada en el primer fallo); `verify` probado en verde y en fallo (paso de formato y de lint identificados).
- **T3 completada**: husky 9 + lint-staged 17. `core.hooksPath=.husky/_` activo vía script `prepare`; pre-commit = `set -e` + `npx lint-staged` (prettier auto-formatea y re-stagea; eslint --fix en *.ts); pre-push = `set -e` + `npm run verify`. Todos los escenarios probados (ver Decisiones).
- **T4 completada**: Tailwind CSS 4.3 + `@tailwindcss/postcss` + `postcss` (3 devDeps, RN-1, instalados sin `--force`); `src/styles.css` = `@import 'tailwindcss';` (CSS-first, sin `tailwind.config.js`); config PostCSS en `postcss.config.json`; `angular.json` intacto; build de producción y `verify` en verde; utility class verificada con Chrome DevTools (móvil 375x667 y consola sin errores).
- **T5 completada**: `AGENTS.md` rellena "## Comandos" con los scripts reales (`start`, `build`, `watch`, `format`, `format:check`, `lint`, `test`, `test:run`, `verify`) y documenta en "## Límites" la excepción de dependencias (RN-1); `README.md` reescrito en castellano y breve con comandos. Ambos referencian `docs/constitution.md` (reglas innegociables + resolución de conflictos) sin duplicarla.
- Pendiente: T6 (cierre).

## Decisiones (y por qué)

- ESLint sin `@eslint/js`: el plan autoriza solo 3 devDependencies (RN-1) y ESLint 10 ya no lo trae; `tseslint.configs.recommended` cubre lo necesario.
- Config solo de calidad, sin reglas de formato (CL-5): Prettier es el único formateador.
- Sin `--max-warnings` en el script `lint`: un warning sale con exit 0 y no bloquea (CA-2.5).
- `templateAccessibility` NO incluido: el plan solo pide reglas Angular recomendadas; añadirlo podría introducir warnings no pedidos.
- `npm run format` sobre el repo re-formateó 5 ficheros .md/.json preexistentes (sangrado de listas, tablas, JSON a 2 espacios). Solo cambios cosméticos.
- `verify` encadena con `echo <paso> && npm run <script>`: para en el primer fallo y el echo indica el paso; `build` queda fuera de `verify` (comando propio, plan §5). Echoes en inglés corto (RN-4).
- Hooks T3, según plan: lint-staged `"*": "prettier --check --write --ignore-unknown"` (auto-formatea y re-stagea → CL-3) y `"*.ts": "eslint --fix"` (error grave bloquea → CA-2.1; warning no → CA-2.5). Husky 9 ejecuta los hooks con `sh -e`: no necesita shebang.
- T3 probado sin commits reales: auto-formateo en verde; formato persistente → exit 1 con fichero indicado (simulado con fichero de solo lectura, EPERM); lint error bloquea / warning no; pre-push verde; formato sin commitear y test fallido bloquean pre-push; `eslint.config.js` roto bloquea ambos hooks (fail-closed CL-7); stage vacío no falla (CL-1).
- T5: la excepción RN-1 (solo dependencias de herramientado) se escribe una única vez en `AGENTS.md` "## Límites"; la constitución se referencia, no se duplica (CA-5.1).
- T4: config **`postcss.config.json`** en vez de `postcss.config.mjs` (plan §3): `@angular/build:application` v22 solo auto-detecta `postcss.config.json`/`.postcssrc.json` (vía `JSON.parse`); con `.mjs` el plugin no corría y el CSS salía con `@tailwind utilities;` sin expandir (build en "verde" engañoso). Desviación aprobada por el usuario durante T4; `angular.json` sin tocar.
- T4: verificación en el título con el modificador important de v4 (`text-3xl! font-bold!`): el `<style>` del template placeholder es CSS unlayered y gana a `@layer utilities` de la misma propiedad (computed 30px/700 en vez de 50px/500). Temporal, con comentario en `app.html`.
- `endOfLine: "auto"` en `.prettierrc` (decisión del usuario): con `core.autocrlf=true` en Windows, tras un commit bloqueado el revert de lint-staged dejaba ficheros en CRLF y el siguiente `format:check`/pre-push fallaba (falso bloqueo). Con `"auto"` Prettier respeta el fin de línea existente y el quirk desaparece.

## Aprendizajes y errores a evitar

- `@typescript-eslint/no-unused-vars` es ERROR en recommended (no warning); para probar que un warning no bloquea, usar `@angular-eslint/use-lifecycle-interface` (warn).
- Avisos de git sobre LF/CRLF en Windows son normales (core.autocrlf); no son fallos.
- `npm install` con las 3 nuevas deps añadió ~96 paquetes transitivas: no instalar nada más fuera de la excepción RN-1.
- Quirk Windows de CRLF (T3) resuelto con `endOfLine: "auto"` (ver Decisiones): tras un commit bloqueado, el revert de lint-staged dejaba ficheros en CRLF y `format:check` fallaba.
- T4: si en el CSS generado aparece `@tailwind utilities;` literal, el plugin NO se ejecutó — el build **no** falla por eso; comprobar siempre `.clase{` en `dist/.../styles-*.css`.
- T4: el `<style>` inline del template (y los estilos de componentes Angular) son unlayered y pisan las utility classes de `@layer utilities` si compiten en la misma propiedad; contar con `!` o revisar esto al diseñar pantallas.

## Próximos pasos

- T6 según tasks.md.
