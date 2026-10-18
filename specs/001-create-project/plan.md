# Plan — Spec 001: Creación y bases del proyecto

CÓMO de la spec aprobada (`specs/001-create-project/spec.md`). Rama de trabajo: `spec/001-create-project`.
Entorno: Windows + git bash. Todos los hooks ejecutan scripts npm, así que funcionan igual en cualquier SO.

## 1. Calidad y formato (RF-1, RF-2, RF-7)

- **ESLint con flat config** (`eslint.config.js`) usando `typescript-eslint` + `angular-eslint` (plugin de reglas Angular y procesador de plantillas `.html`).
  - Alternativa descartada: Biome/oxlint (más rápidos pero sin reglas para plantillas Angular ni ecosistema maduro; obligarían a mantener dos formateadores en paralelo).
  - Alternativa descartada: `ng lint` con builder `@angular-eslint/builder` (requiere tocar `angular.json` y añadir schematics; `eslint .` es directo y suficiente).
- **Prettier sigue siendo el único formateador** (ya instalado con `.prettierrc`). ESLint no incluye reglas de formato → cada herramienta tiene un ámbito y no se contradicen (CL-5).
- **Avisos no bloquean**: si solo hay warnings, ESLint sale con código 0 (equivale a CA-2.5); no se usa `--max-warnings`.
- **Exclusiones** (CL-2): `.prettierignore` nuevo y sección `ignores` en ESLint: `dist`, `coverage`, `node_modules`, `package-lock.json`, `.angular`, `.husky`.
- Dependencias (devDependencies, dentro de la excepción RN-1): `eslint`, `typescript-eslint`, `angular-eslint`.
- Scripts nuevos en `package.json`:
  - `"format": "prettier --write ."`
  - `"format:check": "prettier --check ."`
  - `"lint": "eslint ."`

## 2. Hooks de git (RF-1, RF-2, RF-3; CL-1 a CL-7)

- **husky** para gestionar los hooks versionados en `.husky/` (instala `core.hooksPath`).
  - Alternativa descartada: scripts manuales en `.git/hooks` (no versionados → incumple la reproducibilidad RN-2) y lefthook (menos estándar y curva innecesaria para este tamaño).
- `"prepare": "husky"` en `package.json` → un clon + `npm install` deja los hooks activos sin pasos manuales (RN-2).
- **lint-staged** en pre-commit, solo sobre ficheros en stage (RN-3: pocos segundos). Config en `package.json`:
  - `"*": "prettier --check --write --ignore-unknown"` — formatea y re-stagea los ficheros (así se resuelve CL-3 de serie); si el formato persiste tras el write → exit ≠ 0 → commit bloqueado con el fichero indicado (CA-1.3).
  - `"*.ts": "eslint --fix"` — corrige lo automático; error grave → exit ≠ 0 → commit bloqueado (CA-2.1); warning → no bloquea (CA-2.5).
- `.husky/pre-commit`: `set -e` + `npx lint-staged`.
- `.husky/pre-push`: `set -e` + `npm run verify` → formato completo del repo (segunda red de seguridad ante commits con `--no-verify`, CL-6), calidad completa y tests (RF-3).
- **Fail-closed (CL-7)**: `set -e` en ambos hooks; cualquier exit ≠ 0 (incluido el crash de una herramienta o config rota) detiene el hook y bloquea la integración.
- **Sin ficheros afectados (CL-1)**: lint-staged no hace nada si el stage está vacío; `verify` solo depende de la salida real de las herramientas.

## 3. Tailwind CSS v4 (RF-4)

- Instalar devDependencies: `tailwindcss`, `@tailwindcss/postcss`, `postcss` (guía oficial de Tailwind para Angular; añadir `--force` solo si npm resuelve conflicto de peer con la v3).
  - Alternativa descartada: `@tailwindcss/vite` declarado en `angular.json` — integración menos consolidada en el builder de Angular; la guía oficial de Angular usa PostCSS.
- Crear `postcss.config.mjs`: `export default { plugins: ["@tailwindcss/postcss"] }`. El builder `@angular/build:application` auto-detecta la configuración de PostCSS: no hay que tocar `angular.json`.
- `src/styles.css`: sustituir el comentario por `@import 'tailwindcss';`. Tailwind v4 no necesita `tailwind.config.js` (CSS-first).
- Verificación: utility class de prueba en `app.html` (p. ej. `text-3xl font-bold`) + `npm run build` de producción sin errores (CA-4.2) + Chrome DevTools: estilos aplicados, consola limpia y vista móvil (CA-4.1).

## 4. Documentación y memoria (RF-5, RF-6)

- `AGENTS.md`: rellenar la sección vacía "## Comandos" con los scripts del proyecto; añadir en "## Límites" la excepción acotada (autorizada en esta spec) a dependencias de herramientado: hooks de git, formateo, calidad de código y sistema de estilos; el resto sigue prohibido (CA-5.1, RN-1).
- `MEMORY.md`: se actualiza al final de cada tarea (estado, decisiones con su porqué, errores a evitar) y se mantiene por debajo de ~50 líneas (CA-6.1, CA-6.2).
- Commits: conventional-commits, mensaje generado y aprobado antes de cada commit (RN-6).

## 5. Funciones puras, tests y verificación

- Esta spec no añade lógica de aplicación → **no hay funciones puras nuevas que testear**. Cuando llegue la primera funcionalidad, la lógica irá separada de la vista (constitución) con el reloj/`hoy` como parámetro para poder testearla de forma determinista.
- Runner: el ya existente **vitest** vía `@angular/build:unit-test`, con ejecución única `ng test --no-watch`.
  - Alternativa descartada: `node --test` — duplicaría infraestructura ya presente y la constitución fija el stack Angular.
- Estrategia de verificación:
  1. `npm run verify` (formato + calidad + tests) y `npm run build` en verde (RF-7, RN-5).
  2. Pruebas manuales de los hooks: commit con fichero mal formateado (auto-formatea y completa), commit con error grave de lint (bloquea), push con un test fallido (bloquea), commit con `--no-verify` + push (bloquea por formato), config de herramienta rota (bloquea, fail-closed).
  3. Chrome DevTools: app servida, consola sin errores, utility class aplicada y vista móvil correcta.
- Cobertura: RN-5 — en esta spec bastan los tests existentes en verde; el umbral del 90% se activa desde la primera spec con funcionalidad.

## Cobertura RF → plan

| RF   | Dónde se cubre                                       |
| ---- | ---------------------------------------------------- |
| RF-1 | §1 (scripts de formato) + §2 (pre-commit / pre-push) |
| RF-2 | §1 (ESLint, avisos no bloquean) + §2 (hooks)         |
| RF-3 | §2 (tests en pre-push) + §5                          |
| RF-4 | §3 (Tailwind + build + Chrome DevTools)              |
| RF-5 | §4 (AGENTS.md, excepción de dependencias)            |
| RF-6 | §4 (MEMORY.md)                                       |
| RF-7 | §1 (scripts) + §5 (verify)                           |
