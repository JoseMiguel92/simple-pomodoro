# Plan — Spec 004: Selector de paletas de colores

CÓMO de la spec aprobada (`specs/004-color-palettes/spec.md`). Rama de trabajo: `spec/004-color-palettes`.

## 1. Alcance y objetivos

- Selector junto al timer con las 4 paletas (RF-1, RF-8); cambio inmediato de los 7 tokens con transición suave (RF-2); Sereno por defecto (RF-3); persistencia por el gate de consentimiento de la 003 (RF-4, RF-5); revocación borra la paleta y vuelve a Sereno al instante (RF-6); valor inválido → Sereno silenciosa (RF-7).
- Sin dependencias nuevas (RNF-6); contraste AA y 375 px verificados en navegador (RNF-1, RNF-2); teclado y `prefers-reduced-motion` (RNF-3, RNF-4); cobertura ≥ 90 % sobre la lógica (RNF-7).
- **El cronómetro y su lógica no cambian**: la paleta es ortogonal al timer (CA-2.2).
- Fuera de alcance (spec): paletas personalizadas, tema automático del sistema, sincronización.

## 2. Diseño

### 2.1 Datos de paleta: fuente única (RF-3, RF-7)

- Las 4 paletas (hex exactos de la tabla de la spec) viven **una sola vez, en TypeScript** (`palette.logic.ts`); nada se duplica en CSS ni en la plantilla.
- Cada paleta: `id`, nombre en castellano y los 7 hex (bg, surface, text, accent, track, focus, break); Sereno es la primera y la por defecto.

### 2.2 Aplicación runtime de los tokens (RF-2, RNF-4)

- Tailwind v4 emite las utilidades como `var(--color-*)`: sobreescribir esas 7 variables en `:root` (`documentElement`) re-teje toda la app —incluidos modal y pie— sin tocar utilidades ni componentes.
- El servicio de paleta escribe las variables con `setProperty` al iniciar y en cada selección; la transición suave la aporta una regla CSS global limitada a propiedades de color, dentro de `@media (prefers-reduced-motion: no-preference)`.
- Descartado: atributo `data-palette` + reglas CSS con los hex → duplicaría los datos (deriva TS↔CSS); descartado `[style]` en un wrapper de la plantilla → `body` y el modal quedarían fuera del alcance.

### 2.3 Persistencia (RF-4, RF-5, RF-6, RF-7)

- **Clave propia `pomodoro.palette.v1` en el mismo punto único de persistencia** (`TimerStorageService`), con el mismo gate `canPersist`:
  - `loadPalette()`: con aceptar → `parsePaletteId` del valor guardado; sin aceptar o inválido → Sereno (CA-4.2, CA-5.2, CA-7.1).
  - `writePalette(id)`: no-op sin aceptar (CA-5.1); escritura inmediata con aceptar (CA-4.1).
  - `wipeAppData()` pasa a borrar también la clave de la paleta → la revocación la borra al instante sin nuevo punto de borrado (CA-6.1).
- `parsePaletteId` (puro): solo los 4 ids; corrupto, vacío o desconocido → `null` → Sereno silencioso (RF-7).
- Descartado: campo dentro del JSON de estado del timer — acoplaría modelo y servicio del timer al tema, exigiría serializar todo el estado para guardar solo la paleta (CA-4.1 "al instante") y un estado corrupto arrastraría la paleta.
- Al aceptar el consentimiento más tarde **no** se persiste la paleta elegida en memoria: la spec solo exige guardar al elegir con consentimiento y CA-5.2 ya cubre el recarga → Sereno.

### 2.4 Servicio de paleta

- `PaletteService` (root): señal `active` inicializada con `loadPalette()`; `select(id)` → aplicar + `writePalette(id)` (el gate hace el no-op); `restoreDefault()` → Sereno para la revocación (CA-6.1, al instante).
- No toca `TimerService`: CA-2.2 (cambiar de paleta con el cronómetro en curso no lo interrumpe) se cumple por construcción.

### 2.5 Selector UI (RF-1, RF-8, RNF-2/3/4)

- `app-palette-picker`, presentacional: `[active]: PaletteId`, `(select)(id)`; su estado abierto/cerrado, el foco y Escape viven dentro del componente.
- Botón con icono de paleta (SVG inline, sin deps) a la izquierda de la tarjeta; nombre accesible ("Elegir paleta de colores"); `aria-expanded`; el modal de la 003 ya lo bloquea mientras está abierto (CL-2, gratis).
- Desplegable animado (keyframes de opacidad/escala en su CSS), anclado al botón y contenido dentro del viewport a 375 px; sin animación con `prefers-reduced-motion: reduce`.
- Cada opción es un rectángulo con el nombre: fondo = bg de su paleta, texto = otro color de su paleta (estilos inline desde los datos de 2.1); ✓ delante del nombre (más `aria-current`) solo en la activa (RF-8); foco visible = borde con otro color de la paleta; activa + enfocada = ambas señales (CA-1.3).
- Teclado: Tab recorre las opciones, Escape cierra y devuelve el foco al botón.
- Descartado: `role="menu"` con gestión de flechas — más código con las mismas capacidades usando botones.

## 3. Funciones y contratos lógicos (puros)

`src/app/palette/palette.logic.ts` (nuevo):

- `type PaletteId = 'sereno' | 'noche' | 'atardecer' | 'bosque'`.
- `interface Palette { id: PaletteId; name: string; bg: string; surface: string; text: string; accent: string; track: string; focus: string; break: string }` (hex de la spec).
- `PALETTES: readonly Palette[]` (las 4, en orden de la tabla) y `DEFAULT_PALETTE_ID: PaletteId = 'sereno'`.
- `parsePaletteId(raw: string | null): PaletteId | null` — solo los 4 ids; cualquier otra cosa → `null` (RF-7, CA-7.1).
- `getPalette(id: PaletteId): Palette`.

Ninguna necesita `now` (sin dependencia temporal) ni DOM; el determinismo viene de los parámetros.

## 4. Contratos de componentes y servicio (congelado; permite paralelizar)

- **Selector** (`app-palette-picker`, nuevo): `[active]: PaletteId`, `(select)(id: PaletteId)`. Apertura/cierre, foco y Escape dentro del componente.
- **Servicio de paleta** (nuevo): señal `active`, `select(id)`, `restoreDefault()`.
- **Storage existente** (`timer-storage.service.ts`): `PALETTE_KEY`, `loadPalette()`, `writePalette(id)`; `wipeAppData()` borra además la clave de la paleta sin cambiar el resto de su comportamiento.
- **Shell (`app`)**: monta el selector a la izquierda de la tarjeta, pasa `active` y enruta `(select)` al servicio; `onRevoke` añade `palette.restoreDefault()`.

## 5. Estrategia de tests (≥ 90 %)

- **Lógica (objetivo 100 %)**: `palette.logic` → las 4 paletas con hex exactos de la tabla de la spec; `parsePaletteId` con los 4 ids, `null`, vacío y basura; `getPalette` estable. Ampliar la cobertura en `vitest.config.ts` y `angular.json` (patrón 002/003, `thresholds` 90 intactos).
- **Storage**: `loadPalette` con aceptar devuelve la guardada y sin aceptar Sereno; `writePalette` no escribe sin aceptar; `wipeAppData` borra la clave de la paleta; `localStorage` que lanza → degradación sin excepción (CL-3).
- **Servicio de paleta** (TestBed + localStorage simulado): arranque con guardada / vacía / corrupta; `select` aplica y escribe con aceptar y no escribe sin aceptar; `restoreDefault` → Sereno.
- **Selector (TestBed)**: render con las 4 opciones y el nombre accesible; `(select)` al elegir; ✓ y `aria-current` solo en la activa; Escape cierra y devuelve el foco; `aria-expanded` coherente.
- **Integración (`app.spec`)**: elegir con aceptar → clave escrita y tema restaurado en el arranque siguiente (CA-4.2); elegir sin consentimiento → en memoria, recarga → Sereno (CA-5.x); revocar → clave borrada y Sereno al instante (CA-6.1); elegir con el cronómetro en curso no lo altera (CA-2.2).
- El umbral 90 se mide sobre la lógica nueva; los componentes son plantilla fina (constitución 4).

## 6. Verificación final en navegador

1. `npm run verify`, `npm run test:coverage` (umbral 90) y `npm run build` en verde.
2. Chrome DevTools, consola limpia, **375×667** y escritorio:
   1. Abrir selector → 4 opciones con nombre, ✓ en Sereno; elegir Noche → cambian los 7 colores de toda la app con transición suave.
   2. Con el cronómetro en curso, cambiar de paleta → sigue corriendo sin saltos (CA-2.2).
   3. Sin consentimiento → elegir aplica en memoria; recarga → Sereno (CA-5.2).
   4. Con aceptar → elegir, recarga → paleta restaurada y clave `pomodoro.palette.v1` escrita (CA-4.1, CA-4.2).
   5. Revocar → Sereno al instante y clave borrada (CA-6.1).
   6. Basura en la clave de la paleta → recarga → Sereno sin avisos (CA-7.1).
   7. Popup abierto → el selector queda tras el overlay (CL-2); teclado: Tab/Escape/foco visible; `prefers-reduced-motion` → sin animación (RNF-3, RNF-4).
   8. Contraste AA comprobado en las 4 paletas (RNF-1); el desplegable no se sale de la pantalla a 375 px (RNF-2).

## Cobertura RF → plan

| RF   | Dónde se cubre       |
| ---- | -------------------- |
| RF-1 | §2.5, §4, T4/T5      |
| RF-2 | §2.2, §2.4, T3/T5    |
| RF-3 | §2.1, §2.3, T1/T3    |
| RF-4 | §2.3, §2.4, T2/T3    |
| RF-5 | §2.3, §2.4, T2/T3    |
| RF-6 | §2.3, §2.4, T2/T3/T5 |
| RF-7 | §2.3, §3, T1/T2      |
| RF-8 | §2.5, T4             |
