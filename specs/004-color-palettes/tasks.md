# Tareas — Spec 004: Selector de paletas de colores

Ejecución en la rama `spec/004-color-palettes`, en orden. Cada tarea lleva sus tests dentro del mismo alcance y termina con un commit conventional-commits aprobado por el usuario (incluye el código de la tarea). Sin dependencias nuevas (RNF-6).

**Olas de paralelización** (contrato de §4 del plan congelado):

- **Ola 1**: T1.
- **Ola 2 (paralelo)**: T2 || T4 (ficheros disjuntos; comparten solo el contrato `PaletteId`).
- **Ola 3**: T3 (necesita T2: `loadPalette`/`writePalette`).
- **Ola 4**: T5 (necesita T3 y T4).
- **Ola 5 (serial)**: T6 → T7 → T8.

`MEMORY.md` lo toca **solo T8**, al final, para evitar conflictos.

## T1 — Lógica pura de paletas y cobertura (RF-3, RF-7)

- **Objetivo**: datos de las 4 paletas y parse del id, deterministas sin DOM.
- **Ficheros**: `src/app/palette/palette.logic.ts`, `src/app/palette/palette.logic.spec.ts` (nuevos), `vitest.config.ts` y `angular.json` (incluir la lógica nueva en la cobertura; `thresholds` 90 intactos).
- **RF**: RF-3 (`DEFAULT_PALETTE_ID`), RF-7 (CA-7.1); RNF-5, RNF-6.
- **Depende de**: nada.
- **Hecho cuando**: `PALETTES` contiene Sereno, Noche, Atardecer y Bosque con los 7 hex exactos de la tabla de la spec; `parsePaletteId` devuelve los 4 ids y `null` ante vacío, basura o desconocido (silencioso); `getPalette` resuelve por id; `npm run test:coverage` en verde con umbral 90 y la lógica nueva al 100 %.
- **Estado**:

## T2 — Persistencia de la paleta con el gate de consentimiento (RF-4, RF-5, RF-6, RF-7)

- **Objetivo**: leer, escribir y borrar la paleta por el mismo punto único de persistencia, con el gate `canPersist`.
- **Ficheros**: `src/app/timer/timer-storage.service.ts`, `src/app/timer/timer-storage.service.spec.ts`.
- **RF**: RF-4 (CA-4.1, CA-4.2), RF-5 (CA-5.1), RF-6 (`wipeAppData` borra la clave de la paleta), RF-7 (fallback vía `parsePaletteId`); RNF-5. Casos límite: CL-3.
- **Depende de**: T1.
- **Hecho cuando**: `PALETTE_KEY = 'pomodoro.palette.v1'`; `loadPalette` con aceptar devuelve la guardada, y sin aceptar o con valor inválido devuelve Sereno; `writePalette` es no-op sin aceptar y escribe con aceptar; `wipeAppData` borra además la clave de la paleta; `localStorage` que lanza degrada sin excepción; tests en verde.
- **Estado**:

## T3 — Servicio de paleta y aplicación runtime del tema (RF-2, RF-3, RF-4, RF-5, RF-6)

- **Objetivo**: señal de paleta activa, selección con persistencia por gate y re-tejido de los 7 tokens con transición suave.
- **Ficheros**: `src/app/palette/palette.service.ts` y `.spec.ts` (nuevos), `src/styles.css` (regla de transición de propiedades de color bajo `@media (prefers-reduced-motion: no-preference)`).
- **RF**: RF-2 (CA-2.1), RF-3, RF-4, RF-5, RF-6 (`restoreDefault`), RF-7 (arranque silencioso); RNF-4, RNF-5.
- **Depende de**: T2.
- **Hecho cuando**: `active` arranca con `loadPalette()` (Sereno si no hay valor o es corrupto); `select` escribe las 7 variables `--color-*` en `documentElement` y llama a `writePalette` (no-op sin aceptar); `restoreDefault` vuelve a Sereno; la transición de color existe y no se aplica con `prefers-reduced-motion`; `npm run test:coverage` en verde.
- **Estado**:

## T4 — Componente selector de paletas (RF-1, RF-8)

- **Objetivo**: el botón con icono y el desplegable con las opciones rectángulo+nombre.
- **Ficheros**: `src/app/palette/palette-picker/palette-picker.ts|.html|.spec.ts` (nuevos; `.css` si hace falta para la animación).
- **RF**: RF-1 (CA-1.2, CA-1.3), RF-8 (CA-8.1); RNF-2, RNF-3, RNF-4, RNF-5. Contrato: `[active]: PaletteId`, `(select)(id)`.
- **Depende de**: T1 (solo el contrato).
- **Hecho cuando**: botón con icono de paleta (SVG inline), nombre accesible y `aria-expanded`; desplegable animado (sin animación con `prefers-reduced-motion`) con las 4 opciones: rectángulo con fondo = bg y texto = otro color de su paleta; ✓ y `aria-current` solo en la activa; foco = borde con otro color de la paleta y activa+enfocada tiene ambas señales; Tab recorre, Escape cierra y devuelve el foco; el spec cubre render, `(select)`, marca de activa y teclado.
- **Estado**:

## T5 — Integración en el shell (RF-1, RF-2, RF-6, RF-8)

- **Objetivo**: montar el selector junto al timer y encadenarlo con la persistencia y la revocación.
- **Ficheros**: `src/app/app.ts`, `src/app/app.html`, `src/app/app.spec.ts`.
- **RF**: RF-1 (CA-1.1), RF-2 (CA-2.2), RF-6 (CA-6.1 al instante), RF-8; RNF-5. Casos límite: CL-2, CL-4.
- **Depende de**: T3, T4.
- **Hecho cuando**: el selector queda a la izquierda de la tarjeta con `active` del servicio y `(select)` → `select(id)`; `onRevoke` añade `palette.restoreDefault()` y la clave de la paleta desaparece al instante; elegir con el cronómetro en curso no lo altera; elegir sin consentimiento no escribe; recarga sin valor guardado → Sereno; `app.spec` cubre los flujos anteriores y `npm run test:coverage` queda en verde.
- **Estado**:

## T6 — Verificación en Chrome DevTools (criterios de finalización 1 a 10)

- **Objetivo**: comprobar el comportamiento real en el navegador.
- **Ficheros**: ninguno (si aparece un fallo, se corrige en su tarea y se repite).
- **RF**: RF-1 a RF-8; RNF-1 a RNF-4. Casos límite: CL-1 a CL-4.
- **Depende de**: T5.
- **Hecho cuando**: el recorrido de §6 del plan funciona en móvil **375×667** y escritorio con consola limpia (cambio con transición, timer en curso intacto, sin consentimiento → memoria → Sereno al recargar, con aceptar → restaurada, revocación → Sereno al instante, clave corrupta → Sereno silencioso, popup bloqueante, teclado, reduced-motion, desplegable dentro del viewport); contraste AA comprobado en las 4 paletas; `npm run verify`, `npm run test:coverage` y `npm run build` en verde; resultado anotado.
- **Estado**:

## T7 — Refactor: radio del SVG sin duplicar (mejora de memoria, sin cambio de comportamiento)

- **Objetivo**: eliminar el `45` a mano de la plantilla del dial.
- **Ficheros**: `src/app/timer/timer-dial/timer-dial.html`, `src/app/timer/timer-dial/timer-dial.ts`.
- **RF**: ninguno (refactor interno; constitución 3).
- **Depende de**: T6 (al final, para no interferir con la verificación visual).
- **Hecho cuando**: los dos `[attr.r]` del template usan la constante `RADIUS` expuesta desde `timer-dial.ts`; sin cambio visual ni de comportamiento; tests en verde.
- **Estado**: ✅ completada

## T8 — Memoria del proyecto

- **Objetivo**: dejar el estado y las decisiones por escrito.
- **Ficheros**: `MEMORY.md`.
- **RF**: RNF-5 (documentación en castellano).
- **Depende de**: T7.
- **Hecho cuando**: `MEMORY.md` recoge la clave propia de la paleta con su gate, la fuente única de datos en TS, la aplicación runtime por variables CSS con transición bajo `prefers-reduced-motion` y la ausencia de dependencias nuevas, por debajo de ~50 líneas.
- **Estado**:
