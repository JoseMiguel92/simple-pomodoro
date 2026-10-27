# Plan — Spec 005: Recolocación del selector de paletas

## Enfoque

Recolocación pura: dos cambios de plantilla, cero lógica nueva.

1. **Shell** (RF-1): sacar `app-palette-picker` de la fila de `<main>` y colocarlo dentro de la `<section>` tarjeta, entre el `<header>` (subtítulo) y `<app-timer-dial>`. Con `items-center` del flex de la tarjeta queda centrado (CA-1.1). Al quedar `main` con un solo hijo, se retiran `gap-3` y `shrink-0`, estilos muertos.
2. **Selector** (RF-2): el desplegable pasa de anclado a la izquierda (`left-0`) a centrado bajo el icono (`left-1/2 -translate-x-1/2`, CA-2.1).

No se toca ningún `.ts`: el contrato congelado del picker (`active` / `select`, plan §4 de la 004) y toda la lógica (timer, paletas, consentimiento) quedan intactos. Sin métodos nuevos; no surge ningún candidato a refactor.

## Archivos y qué cubre cada parte

| Archivo                                                 | Cambio                                                                                                                                                             | Cubre                               |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------- |
| `src/app/app.html`                                      | Mover el picker dentro de la tarjeta; quitar `gap-3`/`shrink-0`; actualizar el comentario                                                                          | RF-1 (CA-1.1, CA-1.2, CA-1.3), RF-3 |
| `src/app/app.spec.ts`                                   | Reescribir el test «mounts the picker left of the card» (línea ~245): picker dentro de la `section`, orden subtítulo → picker → dial, tarjeta única hija de `main` | RF-1 (CA-1.1–CA-1.3)                |
| `src/app/palette/palette-picker/palette-picker.html`    | Anclaje del dropdown: `left-0` → `left-1/2 -translate-x-1/2`; actualizar comentario de cabecera                                                                    | RF-2 (CA-2.1), RNF-1                |
| `src/app/palette/palette-picker/palette-picker.spec.ts` | Ampliar el test de apertura con aserción del anclaje centrado (patrón del proyecto: aserciones por clase en jsdom)                                                 | RF-2 (CA-2.1)                       |
| `MEMORY.md`                                             | Al final de cada tarea; en T1 además corregir que la 004 está mergeada en `master` (`a99bff0`)                                                                     | —                                   |

Los demás tests de `app.spec.ts` (enrutado de `select`, overlay CL-2, cronómetro en curso) consultan por selectores `app-palette-picker …`, que siguen válidos tras la recolocación: no requieren cambios.

## Decisiones

1. **Centrado del desplegable con utilities de Tailwind v4** (`left-1/2 -translate-x-1/2`) frente a hacerlo en `palette-picker.css`. Descartada la segunda: posiciona el dropdown igual pero parte su colocación entre plantilla y CSS (hoy `absolute top-full mt-2 w-48` ya vive en la plantilla), con diff mayor. En v4 `translate-x-*` usa la propiedad nativa `translate`, que compone con la animación `transform` de entrada de `palette-picker.css` sin colisión (el aviso de MEMORY aplica a conflictos sobre la MISMA propiedad).
2. **Eliminar `gap-3` de `<main>`** al quedar la tarjeta como único hijo. Descartado mantenerlo: estilo muerto.
3. **Sin cambios en TS ni en el aspecto del botón** (RF-3): solo plantillas y tests.

## Tests

- **Unitarios (jsdom, sin motor de layout)**: aserciones de estructura — orden DOM dentro de la sección, tarjeta como única hija de `main`, clases de anclaje centrado del dropdown (patrón ya usado en el test del overlay con `fixed`/`inset-0`). Cobertura ≥ 90% se mantiene: no hay código nuevo ejecutable.
- **Visual (T4, Chrome DevTools MCP)**: móvil 375×667 y escritorio — tarjeta centrada sola, icono bajo el subtítulo, desplegable centrado tapando el dial (CL-1, aceptado), botón idéntico, comportamiento 004 intacto, consola limpia.

## Riesgos

- **Conflicto utilities/animación**: si `-translate-x-1/2` colisionara con la animación de `palette-picker.css`, el desplegable bailaría o quedaría descentrado → se vería en T4. Plan B: mover el centrado a `palette-picker.css` con `translate: -50% 0`.
- **jsdom no calcula layout real**: el centrado se verifica por clases en unitarios y a ojo en T4.
- **Cabida en 375 px**: dropdown de 192 px centrado en tarjeta de ~295 px útiles → sin desbordamiento (RNF-1); confirmar en T4.
