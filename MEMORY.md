# MEMORY.md — Simple Pomodoro GBDevs

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual

- **Spec 001 completada y mergeada en `master`** (solo bases, sin funcionalidad Pomodoro); rama `spec/001-create-project` eliminada.
- Stack: Angular 22 + TS + Vite; vitest vía `@angular/build:unit-test`; Tailwind CSS v4 (`src/styles.css` = `@import 'tailwindcss';`, CSS-first).
- Calidad: Prettier único formateador (`.prettierrc`); ESLint 10 flat (`eslint.config.js`) solo calidad, typescript-eslint + angular-eslint.
- Hooks husky 9 + lint-staged 17 activos (`core.hooksPath=.husky/_`, vía script `prepare`): pre-commit = auto-formateo + lint; pre-push = `npm run verify` (formato, calidad y tests).
- Verificación en verde: `npm run verify`, `npm run build`, app servida con Chrome DevTools (consola limpia, utility aplicada, móvil 375x667).
- Docs: `AGENTS.md` (comandos + excepción RN-1), `README.md`; `docs/constitution.md` referenciada, nunca duplicada.

## Decisiones (y por qué)

- Config PostCSS en **`postcss.config.json`**, no `.mjs` (plan §3 corregido en T6): `@angular/build:application` v22 solo auto-detecta JSON; con `.mjs` el plugin no corría y el build salía en "verde" engañoso con `@tailwind utilities;` sin expandir. `angular.json` sin tocar.
- Prettier único formateador, ESLint sin reglas de formato (CL-5); sin `--max-warnings` para que un warning no bloquee (CA-2.5).
- `endOfLine: "auto"` (decisión del usuario): con `core.autocrlf=true`, el revert de lint-staged tras un commit bloqueado dejaba CRLF y el siguiente `format:check` fallaba (falso bloqueo).
- Hooks: lint-staged `"*": prettier --check --write --ignore-unknown` (re-stagea tras formatear → CL-3) y `"*.ts": eslint --fix`; `set -e` en ambos hooks = fail-closed (CL-7); pre-push como segunda red ante `--no-verify` (CL-6).
- Sin `@eslint/js` ni `templateAccessibility`: la excepción RN-1 limita a 3 devDeps de calidad y no se piden warnings extra.
- Excepción RN-1 escrita una única vez en `AGENTS.md` "## Límites" (CA-5.1).

## Aprendizajes y errores a evitar

- Si en `dist/.../styles-*.css` aparece `@tailwind utilities;` literal, el plugin NO se ejecutó y el build **no** falla: comprobar siempre `.clase{` expandida.
- Estilos unlayered (`<style>` de plantilla o de componente) pisan `@layer utilities` de v4 en la misma propiedad → modificador `!` (`text-3xl!`) o revisarlo al diseñar pantallas.
- `@typescript-eslint/no-unused-vars` es ERROR en recommended; para probar que un warning no bloquea, `@angular-eslint/use-lifecycle-interface` (warn).
- Avisos de git sobre LF/CRLF en Windows con `core.autocrlf` son normales, no fallos.
- No añadir ninguna dependencia fuera de la excepción RN-1.

## Próximos pasos

- **Spec 002**: funcionalidad del Pomodoro (cronómetro y ciclos de trabajo/descanso). Crear rama `spec/002-...` antes de planificar.
- `master` solo en local: falta el push a `origin`.
