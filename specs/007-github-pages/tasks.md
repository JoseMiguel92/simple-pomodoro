# Tareas — Spec 007: Publicación en GitHub Pages

Ejecución en la rama `007-github-pages`, en orden. Una tarea = un commit (conventional-commits, en inglés, código T#); el usuario aprueba el mensaje antes de cada commit.

## T1 — Docs de la spec

Commitear spec 007, plan y tareas.

- Archivos: `specs/007-github-pages/*`
- Tests: —
- RF: — (documentación)
- Depende de: nada
- Hecho cuando: commit `docs(specs): add spec 007 with plan and tasks (T1)` propuesto y, si procede, hecho.

## T2 — Workflow de publicación (RF-1, RF-2, RF-4)

Añadir `.github/workflows/publish.yml` y el script `build:pages` con el base href `/simple-pomodoro/`.

- Archivos: `.github/workflows/publish.yml`, `package.json`
- Tests: `npm run build:pages` y comprobar `<base href="/simple-pomodoro/">` en el `index.html` generado
- RF: RF-1, RF-2, RF-4
- Depende de: T1
- Hecho cuando: el YAML es válido y pasa Prettier; el build de Pages referencia el subpath; commit `feat(ci): publish site to GitHub Pages (T2)` propuesto y, si procede, hecho.

## T3 — Documentación (RF-5)

Documentar URL publicada, comando `npm run build:pages` y requisito de configurar Pages con origen «GitHub Actions».

- Archivos: `README.md`, `AGENTS.md`
- Tests: `npm run format:check`
- RF: RF-5
- Depende de: T2
- Hecho cuando: README y AGENTS describen el despliegue; commit `docs(deploy): document GitHub Pages publishing (T3)` propuesto y, si procede, hecho.

## T4 — Verificación y cierre (RF-2, RF-3, RNF-2)

`npm run verify` y `npm run build:pages` en verde; servir una copia temporal bajo `/simple-pomodoro/` y verificar con Chrome DevTools MCP (consola limpia, timer, paletas, consentimiento y móvil 375×667). Cerrar `MEMORY.md` con estado, decisiones y aprendizajes.

- Archivos: `MEMORY.md`
- Tests: `npm run verify`, `npm run build:pages`, verificación en navegador
- RF: RF-2, RF-3, RNF-2
- Depende de: T3
- Hecho cuando: todo en verde y la app funciona bajo el subpath; commit `docs(memory): record GitHub Pages verification (T4)` propuesto y, si procede, hecho.

## Cierre

Merge de `007-github-pages` a `master` con `--no-ff`; al hacer push se dispara el primer deploy. Comprobar el workflow en Actions y abrir la URL publicada (requiere Pages activo con origen «GitHub Actions»).
