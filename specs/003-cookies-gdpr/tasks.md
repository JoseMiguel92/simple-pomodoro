# Tareas — Spec 003: Popup de consentimiento de cookies y almacenamiento local (RGPD)

Ejecución en la rama `spec/003-cookies-gdpr`, en orden. Cada tarea lleva sus tests dentro del mismo alcance y termina con un commit de mensaje conventional-commits aprobado por el usuario (incluye el código de la tarea). Sin dependencias nuevas (RNF-6).

**Olas de paralelización** (contrato de §4 del plan congelado):

- **Ola 1 (paralelo)**: T1 || T3 || T4 (ficheros disjuntos; comparten solo el contrato: `ConsentChoice = 'accept' | 'reject'` y las salidas `accept`/`reject`/`revoke`).
- **Ola 2**: T2 (necesita T1: el gate importa `parseConsent`/`canPersist`).
- **Ola 3**: T5 (necesita T2, T3 y T4).
- **Ola 4 (serial)**: T6 y después T7.

`MEMORY.md` lo toca **un solo implementer por ola** (uno de los que la cierran, al final de la ola) y T7 al final, para evitar conflictos.

## T1 — Lógica pura de consentimiento y cobertura (RF-5, RF-7)

- **Objetivo**: parse y decisión de persistencia deterministas, sin DOM.
- **Ficheros**: `src/app/consent/consent.logic.ts`, `src/app/consent/consent.logic.spec.ts` (nuevos), `vitest.config.ts` y `angular.json` (incluir la lógica nueva en la cobertura; `thresholds` 90 intactos).
- **RF**: RF-5 (decisión `canPersist`), RF-7 (CA-7.1); RNF-5, RNF-6. Casos límite: CL-1.
- **Depende de**: nada (paralela con T3 y T4).
- **Hecho cuando**: `parseConsent` acepta solo `'accept'`/`'reject'` y devuelve `null` ante corrupto, ilegible, vacío o fuera de valores; `canPersist` solo es `true` con `'accept'`; `npm run test:coverage` sale en verde con umbral 90 y la lógica nueva al 100 %.
- **Estado**: ✅ Hecha. `consent.logic.ts` (puro, sin DOM ni `now`) + 7 tests: `'accept'`, `'reject'`, `null`, vacío, corrupto/ilegible, fuera de valores y `canPersist` coherente. `test:coverage` en verde: 100 % en los 3 ficheros de lógica (umbral 90 intacto), `test:run` 112/112, `format:check` y `lint` en verde. Cobertura ampliada en `vitest.config.ts` y `angular.json` (patrón 002).

## T2 — Gate de consentimiento en el punto único de storage (RF-2, RF-3, RF-5)

- **Objetivo**: que leer, escribir y borrar pasen por la elección.
- **Ficheros**: `src/app/timer/timer-storage.service.ts`, `src/app/timer/timer-storage.service.spec.ts`.
- **RF**: RF-2 (gate de lectura), RF-3 (CA-3.1, CA-3.2), RF-5 (CA-5.1, CA-5.2); RNF-5. Casos límite: CL-2, CL-7.
- **Depende de**: T1.
- **Hecho cuando**: `save` no escribe sin elección ni con rechazo y escribe con aceptación; `load` devuelve 25/5 salvo con aceptación; `readConsent`/`writeConsent`/`clearConsent` y `wipeAppData` (borra datos de la app, conserva la elección) toleran `localStorage` que lanza (CL-7); tests en verde.
- **Estado**: ✅ Hecha. Gate en `timer-storage.service.ts`: `save`/`load` consultan `canPersist`; nuevos `readConsent`/`writeConsent`/`clearConsent`/`wipeAppData` con clave propia `pomodoro.consent.v1` (borra clave de estado y cookies del origen, nunca `localStorage.clear()`; `try/catch` en todo → CL-7). 9 tests nuevos (14 en el spec). **Desviación aprobada**: adaptación de setup en `timer.service.spec.ts` (concede `'accept'` y no borra la elección en el test de `pagehide`) porque los 3 tests de persistencia de la 002 asumían escritura sin elección. `test:run` 135/135, `test:coverage` 100% en la lógica (umbral 90 intacto), `format:check` y `lint` limpios, `build` OK. Commit pendiente de aprobación.

## T3 — Popup modal bloqueante (RF-1, RF-4)

- **Objetivo**: el diálogo de aceptación/rechazo.
- **Ficheros**: `src/app/consent/consent-dialog/consent-dialog.ts|.html|.spec.ts` (nuevos).
- **RF**: RF-1 (CA-1.1 a CA-1.3), RF-4 (CA-4.1); RNF-2, RNF-3, RNF-4, RNF-6. Contrato: `[visible]`, `(accept)`, `(reject)`.
- **Depende de**: nada (solo el contrato).
- **Hecho cuando**: el overlay impide toda interacción con la app y solo se cierra con "Aceptar"/"Rechazar" (Escape no cierra); rol de diálogo con foco inicial y atrapado; aviso en castellano junto a los botones; nombres accesibles y solo tokens de paleta; el spec cubre render, emisión de ambos botones, foco y Escape; se ve bien a 375 px.
- **Estado**: Hecho. `app-consent-dialog` con contrato `[visible]`/`(accept)`/`(reject)`, overlay `fixed inset-0` que absorbe los clics, `role="dialog"` + `aria-modal`, foco inicial vía `afterNextRender` y atrapado de Tab/Shift+Tab; Escape se traga sin emitir. 10 tests en verde; `test:run` 126/126, lint y format limpios, `build` OK. La verificación visual a 375 px en navegador queda para T6 (el componente aún no está montado en el shell).

## T4 — Enlace de revocar en el pie (RF-6)

- **Objetivo**: poder cambiar de opinión.
- **Ficheros**: `src/app/consent/consent-footer/consent-footer.ts|.html|.spec.ts` (nuevos).
- **RF**: RF-6 (CA-6.1 a nivel de UI); RNF-2, RNF-3. Contrato: `[visible]`, `(revoke)`.
- **Depende de**: nada (solo el contrato).
- **Hecho cuando**: texto pequeño en el pie, visible solo con `visible=true`, navegable por teclado con nombre accesible y sin depender del color; emite `(revoke)`; el spec cubre ambos estados y la emisión; correcto a 375 px.
- **Estado**: Hecho (2026-10-20): `consent-footer` con `[visible]`/`(revoke)` y 4 tests en verde.

## T5 — Servicio de consentimiento, orquestación y shell (RF-1, RF-2, RF-3, RF-6)

- **Objetivo**: encadenar popup, gate, borrado y revocación en la pantalla.
- **Ficheros**: `src/app/consent/consent.service.ts` y `.spec.ts` (nuevos), `src/app/app.ts`, `src/app/app.html`, `src/app/app.spec.ts`; `src/app/timer/timer.service.ts` solo si hace falta exponer el guardado inmediato (CA-2.1), sin tocar su lógica.
- **RF**: RF-1, RF-2 (CA-2.1, CA-2.2), RF-3 (CA-3.3), RF-6 (CA-6.1 a CA-6.3), RF-7; RNF-5. Casos límite: CL-3, CL-4, CL-5, CL-6.
- **Depende de**: T2, T3, T4 (y T1 vía T2).
- **Hecho cuando**: la elección es señal y el shell muestra el popup con `choice === null` y el pie solo con elección y popup cerrado; aceptar escribe la elección y persiste el estado actual al momento, y la recarga lo restaura; rechazar borra los datos previos **antes** de escribir la elección y la recarga da 25/5; revocar borra elección y datos sin confirmación → popup y 25/5; con rechazo la app funciona normal sin escribir nada; `npm run test:coverage` en verde.
- **Estado**:

## T6 — Verificación en Chrome DevTools (criterios de finalización 1 a 10)

- **Objetivo**: comprobar el comportamiento real en el navegador.
- **Ficheros**: ninguno (si aparece un fallo, se corrige en su tarea y se repite).
- **RF**: RF-1 a RF-7; RNF-1 a RNF-4. Casos límite: CL-1 a CL-7.
- **Depende de**: T5.
- **Hecho cuando**: el recorrido de §6 del plan funciona en móvil **375×667** y escritorio con consola limpia (aceptar, rechazar, revocar, elección corrupta, almacenamiento no disponible); `npm run verify`, `npm run test:coverage` y `npm run build` en verde; el resultado queda anotado.
- **Estado**:

## T7 — Memoria del proyecto

- **Objetivo**: dejar el estado y las decisiones por escrito.
- **Ficheros**: `MEMORY.md`.
- **RF**: RNF-1 (documentación en castellano).
- **Depende de**: T6.
- **Hecho cuando**: `MEMORY.md` recoge el gate en el punto único de storage, la clave propia de la elección con su orden de escritura/borrado, la degradación CL-7 y la ausencia de dependencias nuevas, por debajo de ~50 líneas.
- **Estado**:
