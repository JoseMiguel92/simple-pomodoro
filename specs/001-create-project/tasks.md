# Tareas — Spec 001: Creación y bases del proyecto

Ejecución en la rama `spec/001-create-project`, en orden. Cada tarea termina con MEMORY.md actualizado y un commit con mensaje conventional-commits aprobado por el usuario (RN-6). T4 y T5 son paralelizables entre sí y con T1–T3; T6 va al final.

## T1 — Calidad y formato: ESLint + scripts básicos (✅ completada)

- **Objetivo**: ESLint operativo conviviendo con Prettier sin ámbitos solapados, y comandos de formato/calidad.
- **Ficheros**: `eslint.config.js` (nuevo), `.prettierignore` (nuevo), `package.json` (devDependencies `eslint`, `typescript-eslint`, `angular-eslint`; scripts `format`, `format:check`, `lint`).
- **RF**: RF-1 (parcial), RF-2, RF-7 (parcial). Excepción de dependencias: RN-1.
- **Hecho cuando**: `npm run format:check` y `npm run lint` terminan en verde sobre el repo; un error grave de lint sale con código ≠ 0 y un warning no; `dist`, `coverage` y `package-lock.json` quedan excluidos de format y lint; MEMORY.md actualizado.

## T2 — Comandos de verificación unificados

- **Objetivo**: un comando por verificación (formato, calidad, tests, build) y uno global que las encadene (HU-5).
- **Ficheros**: `package.json` (scripts `test:run` = `ng test --no-watch`, `verify`; `build` ya existe).
- **RF**: RF-7.
- **Hecho cuando**: `npm run test:run` ejecuta los tests vitest existentes una sola vez y queda en verde; `npm run verify` encadena formato + calidad + tests e indica claramente qué paso falla si falla; MEMORY.md actualizado.

## T3 — Hooks de git: pre-commit y pre-push

- **Objetivo**: auto-formateo y calidad en commit; formato, calidad y tests antes del push (HU-2).
- **Ficheros**: `.husky/pre-commit` (nuevo), `.husky/pre-push` (nuevo), `package.json` (devDependencies `husky`, `lint-staged`; script `prepare`; config `lint-staged`).
- **RF**: RF-1, RF-2, RF-3. Casos límite: CL-1, CL-3, CL-6, CL-7. Excepción de dependencias: RN-1.
- **Hecho cuando**: un commit con fichero desformateado lo auto-formatea y completa el commit; si el formato persiste, el commit se bloquea indicando el fichero; un error grave de lint bloquea el commit y un warning no; un push con formato erróneo (commit previo con `--no-verify`) o con tests fallidos se bloquea; una herramienta rota (p. ej. `eslint.config.js` inválido) bloquea la integración (fail-closed); `npm install` deja los hooks activos sin pasos manuales; MEMORY.md actualizado.

## T4 — Tailwind CSS v4 (paralelizable con T1–T3)

- **Objetivo**: sistema de estilos fijado en la constitución instalado y operativo (HU-3).
- **Ficheros**: `postcss.config.mjs` (nuevo), `src/styles.css` (`@import 'tailwindcss';`), `src/app/app.html` (utility class de verificación), `package.json` (devDependencies `tailwindcss`, `@tailwindcss/postcss`, `postcss`).
- **RF**: RF-4; CA-4.1, CA-4.2. Excepción de dependencias: RN-1.
- **Hecho cuando**: `npm run build` de producción termina sin errores con Tailwind activo; la app servida aplica las utility classes verificadas con Chrome DevTools (estilos, consola sin errores y vista móvil); MEMORY.md actualizado.

## T5 — Convenciones, comandos y excepción de dependencias documentadas (paralelizable)

- **Objetivo**: reglas y excepción por escrito para cualquier colaborador (HU-1).
- **Ficheros**: `AGENTS.md` (sección "## Comandos" con `start`, `build`, `format`, `format:check`, `lint`, `test:run`, `verify`; en "## Límites", la excepción acotada y autorizada en esta spec a dependencias de herramientado: hooks de git, formateo, calidad de código y sistema de estilos), `README.md` (apuntar los comandos de verificación si aplica).
- **RF**: RF-5; RN-1.
- **Hecho cuando**: AGENTS.md documenta la excepción textual acotada (el resto de dependencias sigue prohibido) y lista todos los comandos; la documentación se lee en castellano y el código en inglés (RN-4); MEMORY.md actualizado.

## T6 — Memoria de proyecto y verificación final

- **Objetivo**: cerrar la spec con la memoria al día y todos los criterios de finalización comprobados (HU-4).
- **Ficheros**: `MEMORY.md`.
- **RF**: RF-6; RN-2, RN-5, RN-6; criterios de finalización 1–7.
- **Hecho cuando**: MEMORY.md refleja estado actual, decisiones (con su porqué) y errores a evitar, por debajo de ~50 líneas; `npm run verify` y `npm run build` en verde; el recorrido completo de hooks probado (T3) y la app verificada con Chrome DevTools (consola y vista móvil); todos los cambios integrados con mensajes conventional-commits aprobados.
