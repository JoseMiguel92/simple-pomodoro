# MEMORY.md — Simple Pomodoro GBDevs

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual

- **Spec 007 (publicación) mergeada en `master` (`b9d19bf`, `--no-ff`) y publicada**: workflow `.github/workflows/publish.yml` (push a `master`), build `npm run build:pages` con base href `/simple-pomodoro/` y artefacto `dist/simple-pomodoro/browser`. Verificada en local bajo el subpath y en la URL publicada (assets 200, consola limpia, timer, paletas, móvil 375×667); `verify` y build en verde.
- **README público** reescrito (sin spec, decisión del usuario): demo, características, scripts, despliegue y diagrama Mermaid del flujo SDD; capturas de escritorio y móvil en `docs/images/` (WebP) y cabecera centrada `docs/images/readme-header.webp`.
- **Spec 006 (cadencia del conteo) mergeada en `master` (`3dc19dd`, `--no-ff`)**: verificada en Firefox y regresión Chrome; `verify` + coverage (100 %) + build en verde. `nextTickDelay(state, now)` pura (`null` parado, `0` vencido, `1000` en límite, resto `% 1000`) con `setTimeout` encadenado.
- Specs 001–005 mergeadas en `master` (`--no-ff`, ramas eliminadas): Pomodoro completo (SVG que se vacía, PLAY/PAUSE + RESET, edición 1..60, ciclos con pitido), cookies/RGPD y selector de 4 paletas (Sereno default, Noche, Atardecer, Bosque).
- Stack: Angular 22 + TS + Vite; vitest vía `@angular/build:unit-test`; Tailwind v4 CSS-first (`@theme` en `src/styles.css`). Calidad: Prettier único, ESLint 10 flat, husky 9 + lint-staged (pre-push `npm run verify`).

## Decisiones importantes (y por qué)

- **Pages con base href en el script `build:pages`** (`ng build --base-href=/simple-pomodoro/`): única fuente del subpath para CI y verificación local. Disparador `master` (rama real del repo), `npm ci` + Node 24, `npm run verify` antes de publicar, `cancel-in-progress: false` para no cancelar deploys.
- **Repintado con `setTimeout` encadenado alineado a límites de segundo vía `nextTickDelay`**: el `setInterval(1000)` + `Math.ceil` acumulaba jitter en Firefox y saltaba un valor visible; recalcular el retardo en cada disparo ata el repintado al reloj y elimina la deriva.
- **Reloj absoluto (`endsAt` + `Date.now()`) como fuente de verdad del timer**: deriva 0 s en segundo plano (RNF-3). La lógica pura recibe `now` por parámetro (`advance`), determinista y testeable en Node.
- **Selector de paletas**: los 7 hex por paleta viven solo en `palette.logic.ts` (sin duplicados en CSS); aplicación runtime reescribiendo las 7 variables `--color-*` en `documentElement`; paleta persistida en `pomodoro.palette.v1` con el MISMO gate `canPersist` que el timer.
- **Revocación: `restoreDefault()` DESPUÉS de `clearConsent()`** — si se limpia el consentimiento primero, el gate deja de bloquear y `writePalette` reescribe la clave.
- **Gate de consentimiento (003)**: sin `'accept'`, `save` es no-op y `load` devuelve 25/5; elección en clave propia `pomodoro.consent.v1`. Al rechazar: borrar datos → DESPUÉS escribir la elección. Sin `localStorage.clear()`.
- **Tokens `@theme` de Tailwind v4** (cero colores literales en utilities) + paleta runtime sobre esas mismas variables. **Sonido con Web Audio nativo**. **Cobertura** con `@vitest/coverage-v8` (globs `coverageInclude` también en `angular.json`).
- **NUEVA REGLA (2026-10, usuario): mensajes de commit en INGLÉS**, conventional-commits + código de tarea `T#`. Propuesta pendiente de moverla a `AGENTS.md`.
- **README público**: diagrama Mermaid con subgrafos SDD → implementación → CI/Pages (sin colores ni HTML embebido); capturas WebP en `docs/images/`; sin cifras volátiles (nº de tests, cobertura) para que no queden obsoletas.

## Aprendizajes y errores a evitar

- **Mermaid del README**: solo se renderiza en la página de GitHub, no en todos los visores; validarlo abriendo el README del repo (no basta con Prettier). `prettier --check .` no procesa imágenes al recorrer el directorio. El README anterior indicaba `dist/` como salida cuando la real es `dist/simple-pomodoro/browser/`.
- **GitHub Pages**: Angular 22 emite `dist/<proyecto>/browser` (subir `dist` deja el index un nivel abajo → 404); el input de `upload-pages-artifact` es `name` (no `artifact-name`); `checkout@v2`/`deploy-pages@v1` usan Node deprecado. Pages debe configurarse con _Source: GitHub Actions_ (manual).
- **Límites de verificación por MCP**: CL-2 del timer (ventana sin foco) no es reproducible; el pitido no es verificable (sin audio); CL-3 cubierto por test con `vi.setSystemTime`.
- **`viewChild.required` dentro de un `effect` lanza NG0951** → usar no-required + `effect` o foco inicial con `afterNextRender`.
- **`preventDefault` incondicional en Tab rompe el focus trap** (bug de la 003): prevenir solo en el primer/último elemento enfocable.
- **`localStorage` puede lanzar al acceder** (incógnito): `try/catch` en lectura/escritura → degradación a memoria sin excepción.
- Si en `dist/.../styles-*.css` aparece `@tailwind utilities;` literal, el plugin PostCSS NO se ejecutó y el build **no** falla: comprobar `.clase{` expandida; el config debe ser `postcss.config.json`.
- Estilos unlayered pisan `@layer utilities` de v4 → modifier `!` (`text-3xl!`). `@typescript-eslint/no-unused-vars` es ERROR; avisos LF/CRLF en Windows son normales.
