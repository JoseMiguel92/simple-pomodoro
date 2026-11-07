# Simple Pomodoro

Aplicación web de un cronómetro tipo Pomodoro para mantener la concentración, construida con Angular y Tailwind CSS.

## Desarrollo

- `npm start` — servidor de desarrollo en http://localhost:4200.
- `npm run build` — build de producción en `dist/`.

## Verificación

- `npm run format:check` — comprueba el formato (Prettier).
- `npm run lint` — calidad del código (ESLint).
- `npm run test:run` — tests una sola vez (Vitest).
- `npm run verify` — encadena formato + calidad + tests; los hooks de git lo ejecutan antes de cada push.

## Despliegue

La web se publica en GitHub Pages en <https://josemiguel92.github.io/simple-pomodoro/> al hacer push a `master`, mediante `.github/workflows/publish.yml`.

- `npm run build:pages` — build de producción para Pages (base href `/simple-pomodoro/`); la salida queda en `dist/simple-pomodoro/browser/`.
- Requisito, una sola vez: en _Settings → Pages_, configurar el origen como **GitHub Actions**.

## Reglas del proyecto

Las reglas innegociables están en [`docs/constitution.md`](docs/constitution.md) y las convenciones de trabajo en [`AGENTS.md`](AGENTS.md).
