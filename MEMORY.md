# MEMORY.md — Simple Pomodoro GBDevs

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual

- Spec 001 en curso, rama `spec/001-create-project`.
- Angular 22 + TS + Vite scaffoldado; Prettier operativo (`.prettierrc`); vitest vía `@angular/build:unit-test`.
- **T1 completada**: ESLint 10 flat config (`eslint.config.js`) con typescript-eslint 8 + angular-eslint 22; scripts `format`, `format:check`, `lint` en verde; exclusiones (`dist`, `coverage`, `.angular`, `.husky`, `package-lock.json`) en `.prettierignore` e `ignores` de ESLint.
- **T2 completada**: scripts `test:run` (`ng test --no-watch`, ejecución única vitest) y `verify` (formato + calidad + tests con echo por paso y parada en el primer fallo); `verify` probado en verde y en fallo (paso de formato y de lint identificados).
- Pendiente: T3 (husky + lint-staged), T4 (Tailwind v4), T5 (docs AGENTS/README), T6 (cierre).

## Decisiones (y por qué)

- ESLint sin `@eslint/js`: el plan autoriza solo 3 devDependencies (RN-1) y ESLint 10 ya no lo trae; `tseslint.configs.recommended` cubre lo necesario.
- Config solo de calidad, sin reglas de formato (CL-5): Prettier es el único formateador.
- Sin `--max-warnings` en el script `lint`: un warning sale con exit 0 y no bloquea (CA-2.5).
- `templateAccessibility` NO incluido: el plan solo pide reglas Angular recomendadas; añadirlo podría introducir warnings no pedidos.
- `npm run format` sobre el repo re-formateó 5 ficheros .md/.json preexistentes (sangrado de listas, tablas, JSON a 2 espacios). Solo cambios cosméticos.
- `verify` encadena con `echo <paso> && npm run <script>`: para en el primer fallo y el echo indica el paso; `build` queda fuera de `verify` (comando propio, plan §5). Echoes en inglés corto (RN-4).

## Aprendizajes y errores a evitar

- `@typescript-eslint/no-unused-vars` es ERROR en recommended (no warning); para probar que un warning no bloquea, usar `@angular-eslint/use-lifecycle-interface` (warn).
- Avisos de git sobre LF/CRLF en Windows son normales (core.autocrlf); no son fallos.
- `npm install` con las 3 nuevas deps añadió ~96 paquetes transitivas: no instalar nada más fuera de la excepción RN-1.

## Próximos pasos

- T3: husky + lint-staged con pruebas manuales de bloqueo (fail-closed).
- T4, T5 y T6 según tasks.md.
