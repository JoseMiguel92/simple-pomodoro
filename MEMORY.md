# MEMORY.md — Simple Pomodoro GBDevs

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual

- Spec 001 en curso, rama `spec/001-create-project`.
- Angular 22 + TS + Vite scaffoldado; Prettier operativo (`.prettierrc`); vitest vía `@angular/build:unit-test`.
- **T1 completada**: ESLint 10 flat config (`eslint.config.js`) con typescript-eslint 8 + angular-eslint 22; scripts `format`, `format:check`, `lint` en verde; exclusiones (`dist`, `coverage`, `.angular`, `.husky`, `package-lock.json`) en `.prettierignore` e `ignores` de ESLint.
- **T2 completada**: scripts `test:run` (`ng test --no-watch`, ejecución única vitest) y `verify` (formato + calidad + tests con echo por paso y parada en el primer fallo); `verify` probado en verde y en fallo (paso de formato y de lint identificados).
- **T3 completada**: husky 9 + lint-staged 17. `core.hooksPath=.husky/_` activo vía script `prepare`; pre-commit = `set -e` + `npx lint-staged` (prettier auto-formatea y re-stagea; eslint --fix en *.ts); pre-push = `set -e` + `npm run verify`. Todos los escenarios probados (ver Decisiones).
- Pendiente: T4 (Tailwind v4), T5 (docs AGENTS/README), T6 (cierre).

## Decisiones (y por qué)

- ESLint sin `@eslint/js`: el plan autoriza solo 3 devDependencies (RN-1) y ESLint 10 ya no lo trae; `tseslint.configs.recommended` cubre lo necesario.
- Config solo de calidad, sin reglas de formato (CL-5): Prettier es el único formateador.
- Sin `--max-warnings` en el script `lint`: un warning sale con exit 0 y no bloquea (CA-2.5).
- `templateAccessibility` NO incluido: el plan solo pide reglas Angular recomendadas; añadirlo podría introducir warnings no pedidos.
- `npm run format` sobre el repo re-formateó 5 ficheros .md/.json preexistentes (sangrado de listas, tablas, JSON a 2 espacios). Solo cambios cosméticos.
- `verify` encadena con `echo <paso> && npm run <script>`: para en el primer fallo y el echo indica el paso; `build` queda fuera de `verify` (comando propio, plan §5). Echoes en inglés corto (RN-4).
- Hooks T3, según plan: lint-staged `"*": "prettier --check --write --ignore-unknown"` (auto-formatea y re-stagea → CL-3) y `"*.ts": "eslint --fix"` (error grave bloquea → CA-2.1; warning no → CA-2.5). Husky 9 ejecuta los hooks con `sh -e`: no necesita shebang.
- T3 probado sin commits reales: auto-formateo en verde; formato persistente → exit 1 con fichero indicado (simulado con fichero de solo lectura, EPERM); lint error bloquea / warning no; pre-push verde; formato sin commitear y test fallido bloquean pre-push; `eslint.config.js` roto bloquea ambos hooks (fail-closed CL-7); stage vacío no falla (CL-1).
- `endOfLine: "auto"` en `.prettierrc` (decisión del usuario): con `core.autocrlf=true` en Windows, tras un commit bloqueado el revert de lint-staged dejaba ficheros en CRLF y el siguiente `format:check`/pre-push fallaba (falso bloqueo). Con `"auto"` Prettier respeta el fin de línea existente y el quirk desaparece.

## Aprendizajes y errores a evitar

- `@typescript-eslint/no-unused-vars` es ERROR en recommended (no warning); para probar que un warning no bloquea, usar `@angular-eslint/use-lifecycle-interface` (warn).
- Avisos de git sobre LF/CRLF en Windows son normales (core.autocrlf); no son fallos.
- `npm install` con las 3 nuevas deps añadió ~96 paquetes transitivas: no instalar nada más fuera de la excepción RN-1.
- Quirk Windows de CRLF (T3) resuelto con `endOfLine: "auto"` (ver Decisiones): tras un commit bloqueado, el revert de lint-staged dejaba ficheros en CRLF y `format:check` fallaba.

## Próximos pasos

- T4, T5 y T6 según tasks.md.
