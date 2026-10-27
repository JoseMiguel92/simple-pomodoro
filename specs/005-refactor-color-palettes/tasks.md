# Tareas — Spec 005: Recolocación del selector de paletas

## T1 — Docs iniciales y memoria

Commitear spec 005, plan y tareas; actualizar `MEMORY.md`: la 004 ya está mergeada en `master` (commit `a99bff0`, pendiente de validación → hecha) y arranca la 005.

- Archivos: `specs/005-refactor-color-palettes/*`, `MEMORY.md`
- Tests: —
- RF: — (documentación)
- Hecho cuando: `MEMORY.md` refleja la 004 mergeada y la 005 en curso; commit `docs(specs): add spec 005 with plan and tasks (T1)` propuesto y, si procede, hecho.

## T2 — Recolocar el icono dentro de la tarjeta

Mover `app-palette-picker` dentro de la `<section>`, entre el subtítulo y el dial; quitar `gap-3`/`shrink-0` de `main` y actualizar el comentario (RF-1).

- Archivos: `src/app/app.html`, `src/app/app.spec.ts`
- Tests: reescribir el test de montaje del picker (dentro de la sección, orden subtítulo → picker → dial, tarjeta única hija de `main`) — CA-1.1–CA-1.3
- RF: RF-1, RF-3
- Hecho cuando: `npm run verify` en verde; commit `refactor(app): move palette picker into card (T2)` propuesto y, si procede, hecho; `MEMORY.md` actualizado.

## T3 — Centrar el desplegable bajo el icono

Cambiar el anclaje del dropdown de `left-0` a `left-1/2 -translate-x-1/2` y actualizar su comentario (RF-2, CA-2.1).

- Archivos: `src/app/palette/palette-picker/palette-picker.html`, `src/app/palette/palette-picker/palette-picker.spec.ts`
- Tests: añadir aserción de anclaje centrado al test de apertura (CA-2.1)
- RF: RF-2
- Hecho cuando: `npm run verify` en verde; commit `refactor(palette): centre the dropdown under its trigger (T3)` propuesto y, si procede, hecho; `MEMORY.md` actualizado.

## T4 — Verificación visual y cierre

Verificar con MCP de Chrome DevTools en móvil 375×667 y escritorio: icono bajo el subtítulo y centrado, tarjeta centrada sola, desplegable centrado tapando el dial (CL-1) que se cierra al elegir, botón con aspecto intacto, comportamiento 004 sin regresiones y consola limpia.

- Archivos: `MEMORY.md` (cierre de la 005)
- Tests: `npm run verify` final
- RF: criterios 1–4 y RNF-1 de la spec
- Hecho cuando: revisión visual OK en ambas vistas con consola sin errores, `npm run verify` en verde y `MEMORY.md` actualizado con el resultado.
