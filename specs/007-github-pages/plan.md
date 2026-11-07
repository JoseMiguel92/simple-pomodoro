# Plan — Spec 007: Publicación en GitHub Pages

CÓMO de la spec aprobada (`specs/007-github-pages/spec.md`). Rama de trabajo: `007-github-pages`.

## Decisiones

### Rama disparadora: `master`

El repositorio usa `master` como rama por defecto (`origin/HEAD -> origin/master`). El snippet original apuntaba a `main` y nunca se habría ejecutado. Se mantiene `master` para no reescribir el historial ni cambiar la rama por defecto.

### Base href: script `build:pages`

Angular genera un `index.html` con `<base href="/">`; en un site de proyecto de Pages la app vive en `/simple-pomodoro/`, así que sin cambiarlo fallarían JS, CSS y favicon.

Se añade un script en `package.json`:

```json
"build:pages": "ng build --base-href=/simple-pomodoro/"
```

Es el único sitio donde se declara el subpath: lo usan CI y la verificación local. Alternativas descartadas:

- `--base-href` inline solo en el workflow: el path quedaría duplicado y la verificación local no sería la misma que la de CI.
- `baseHref` en la configuración `production` de `angular.json`: cambiaría el `npm run build` normal aunque no se vaya a publicar.

### Artefacto: `dist/simple-pomodoro/browser`

El builder `@angular/build:application` (Angular 22) emite por defecto `dist/<proyecto>/browser/`. Subir `dist` dejaría el `index.html` un nivel por debajo de la raíz del artefacto y Pages devolvería 404. Se sube directamente la carpeta `browser`.

### Workflow

- `actions/checkout@v4`, `actions/setup-node@v4`, `actions/upload-pages-artifact@v3`, `actions/deploy-pages@v4`. Las versiones del snippet (`checkout@v2`, `deploy-pages@v1`) usan Node 12/16, deprecados en los runners actuales.
- El input del artefacto es `name`, no `artifact-name` (el snippet usaba un input inexistente, que se ignoraba).
- Node 24, la misma versión que el entorno local (`v24.16.0`).
- `npm ci` en lugar de `npm install`: instalación reproducible desde `package-lock.json`.
- `npm run verify` (formato + lint + tests) antes del build; si falla, no se publica (RF-3).
- `concurrency.group: pages` con `cancel-in-progress: false`: evita solapar publicaciones y no cancela un deploy a medias.
- Permisos mínimos de Pages: `contents: read`, `pages: write`, `id-token: write`.

### Configuración manual del repositorio

Pages debe estar activo con _Source: GitHub Actions_. No se puede automatizar desde el workflow con las acciones oficiales y no se añade ninguna dependencia para hacerlo. Se documenta en `README.md` y `AGENTS.md`.

## Archivos y qué cubre cada parte

- `.github/workflows/publish.yml`: build, verificación, subida del artefacto y deploy.
- `package.json`: script `build:pages` (base href único).
- `specs/007-github-pages/*`: esta spec, el plan y las tareas.
- `README.md`: URL publicada, comando y requisito de Pages.
- `AGENTS.md`: sección de despliegue y comando nuevo.
- `MEMORY.md`: estado, decisiones y aprendizajes.

Sin cambios en `src/`, `angular.json`, `eslint.config.js` ni configuraciones de test.

## Verificación

1. `npm run build:pages` y comprobar `<base href="/simple-pomodoro/">` en `dist/simple-pomodoro/browser/index.html`.
2. Servir una copia temporal en `/simple-pomodoro/` (script Node efímero fuera del repo, sin dependencias) y abrirla con Chrome DevTools MCP: consola limpia, timer, paletas, consentimiento y móvil 375×667.
3. `npm run verify` en verde.
4. Tras el merge a `master`, comprobar el workflow en Actions y abrir la URL publicada. El deploy real no se puede verificar antes del merge.

## Alternativas descartadas

- **Pages desde una rama `gh-pages`**: exige commitear el build o usar un paso extra; con artefacto oficial el repo no guarda artefactos.
- **`actions/configure-pages`**: no es necesario para desplegar un artefacto; se mantiene el workflow mínimo.
- **`workflow_dispatch`**: no se pide; para reintentar tras activar Pages basta con _Re-run jobs_ en Actions.
