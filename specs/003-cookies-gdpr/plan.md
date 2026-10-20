# Plan — Spec 003: Popup de consentimiento de cookies y almacenamiento local (RGPD)

CÓMO de la spec aprobada (`specs/003-cookies-gdpr/spec.md`). Rama de trabajo: `spec/003-cookies-gdpr`.

## 1. Alcance y objetivos

- Popup que bloquea la app hasta que el usuario elija (RF-1, RF-4) y enlace de revocación en el pie (RF-6).
- **Gate de consentimiento en el único punto de persistencia existente** (servicio de storage del plan 002 §3): lectura, escritura y borrado. **No se reescribe la lógica del cronómetro.**
- Aceptar habilita la persistencia (RF-2); rechazar la bloquea y borra lo previo (RF-3); la elección es la única escritura sin consentimiento (RF-5); elección corrupta = sin elección (RF-7); sin almacenamiento → degradación a memoria (CL-7).
- Sin dependencias nuevas (RNF-6); paleta de tokens existente (RNF-4); 375 px y escritorio (RNF-2); cobertura ≥ 90 % sobre la lógica nueva (RNF-5, constitución 4).
- Fuera de alcance (spec): cookies de terceros, categorías granulares, textos legales, dos pestañas.

## 2. Diseño (nivel QUÉ)

### 2.1 Modal bloqueante (RF-1, RF-4, RNF-3)

- Overlay que cubre la app e impide toda interacción mientras no haya elección; solo se cierra con "Aceptar" y "Rechazar" (ni Escape, ni clic fuera).
- Rol de diálogo con `aria-modal`, foco inicial en el popup y atrapado mientras esté abierto; aviso en castellano junto a los botones; botones con nombre accesible, sin depender solo del color.
- Descartado: banner no bloqueante (la spec exige bloqueo); `<dialog>` nativo (RNF-6 pide implementarlo a mano, y su cierre nativo por Escape/backdrop habría que anularlo igualmente).

### 2.2 Estados de consentimiento

- **Sin elección** (o corrupta) → popup; **aceptar** → persistencia activa; **rechazar** → persistencia bloqueada + borrado de lo previo.
- La elección vive en su **propia clave** (`'accept' | 'reject'`), separada de la clave de datos de la app.
- Al rechazar, orden obligatorio (CA-3.1): **borrar datos previos → después escribir la elección**; la elección no se borra a sí misma.
- Descartado: guardar la elección dentro del mismo JSON que los tiempos — el borrado la destruiría y un estado de datos corrupto dispararía el popup sin motivo (RF-5, CL-1).

### 2.3 Gate en el punto único de storage (RF-2, RF-3, RF-5)

- Todas las operaciones del servicio de storage consultan primero la elección:
  - `save`: sin elección o con rechazo → no escribe nada; con aceptar → escribe (el cronómetro no se entera).
  - `load`: solo con aceptar devuelve lo guardado; si no, devuelve los defectos (25/5, focus) → CA-2.2 y CA-3.3.
  - borrado: elimina los datos de la app conservando la elección; la revocación añade el borrado de la propia elección.
- Descartado: comprobar el consentimiento en cada llamante (servicio del timer, `pagehide`,…) — puntos de fallo múltiples; RF-5 exige que **ninguna** escritura se escape y el gate único lo garantiza por construcción.

### 2.4 Borrado de datos (RF-3, RF-6)

- Se borran los datos de la app en el navegador (clave de estado y cookies propias del origen) **sin tocar la clave de la elección**, salvo al revocar.
- Revocar borra elección + datos **sin confirmación** (CA-6.2) → vuelve el popup y la app parte de 25/5 (CA-6.3, CL-3, CL-6).
- Descartado: `localStorage.clear()` — borraría claves ajenas a la app en el mismo origen.

### 2.5 Degradación sin almacenamiento (CL-7)

- Las operaciones siguen con `try/catch` (patrón 002): si el navegador no guarda, la elección no se recuerda → el parse devuelve "sin elección" → popup en cada visita y app en memoria con 25/5.
- Descartado: sondeo explícito de disponibilidad — código adicional y la degradación ya sale del propio parse + `try/catch`.

### 2.6 Enlace de revocar (RF-6)

- En el pie, texto pequeño, visible **solo** con elección guardada y popup cerrado (CA-6.1), navegable por teclado con nombre accesible; al activarlo borra directamente.

## 3. Funciones y contratos lógicos (puros; estado como parámetro)

`src/app/consent/consent.logic.ts` (nuevo):

- `type ConsentChoice = 'accept' | 'reject'`.
- `parseConsent(raw: string | null): ConsentChoice | null` — solo valores esperados; corrupto, ilegible, vacío o fuera de valores → `null` (RF-7, CL-1).
- `canPersist(choice: ConsentChoice | null): boolean` — `true` solo con `'accept'` (gate de RF-2/RF-3/RF-5).

Ninguna necesita `now`: el determinismo viene de recibir el estado como parámetro; `timer.logic.ts` (con `now`) queda intacto.

Contrato del gate sobre el servicio de storage existente:

- `load(): StoredState` — defectos salvo `'accept'`.
- `save(state): void` — no-op sin `'accept'`.
- `readConsent(): ConsentChoice | null`, `writeConsent(choice): void` (única escritura permitida sin aceptar), `clearConsent(): void`, `wipeAppData(): void` (borra datos, conserva la elección).

## 4. Contratos de componentes y estado (congelado; permite paralelizar)

- **Popup** (`app-consent-dialog`, nuevo): `[visible]: boolean`, `(accept)`, `(reject)`. Bloqueo, foco y Escape viven dentro del componente.
- **Pie de revocación** (`app-consent-footer`, nuevo): `[visible]: boolean`, `(revoke)`.
- **Servicio de consentimiento** (nuevo): expone `choice` como señal (`ConsentChoice | null`) y los gestos `accept()`, `reject()`, `revoke()` con el orden de §2.2/§2.4; al aceptar, además, dispara el guardado inmediato del estado actual (CA-2.1).
- **Shell (`app`)**: decide visibilidad (popup si `choice === null`; pie si hay elección y popup cerrado) y compone las piezas; el cronómetro no cambia salvo, si hace falta para CA-2.1, exponerle el guardado inmediato sin tocar su lógica.

## 5. Estrategia de tests (≥ 90 %)

- **Lógica (objetivo 100 %)**: `consent.logic` → `'accept'`, `'reject'`, corrupto, ilegible, vacío y `null`; `canPersist` coherente (RF-7, CL-1). Ampliar el `coverage.include` **en `vitest.config.ts` y los `coverageInclude` de `angular.json`** (desviación T2 de la 002), `thresholds` 90 intactos.
- **Gate (servicio de storage)** con `localStorage` simulado: `save` no escribe sin elección ni con rechazo y escribe con aceptación; `load` devuelve defectos sin aceptación; `wipeAppData` conserva la elección; `localStorage` que lanza → degradación sin excepción (CL-7).
- **Componentes (TestBed)**: popup → render, emisión de `(accept)`/`(reject)`, foco atrapado, Escape no cierra, botones con nombre accesible y texto (no solo color), aviso visible (RF-4); pie → visibilidad según elección y popup, emisión de `(revoke)` (CA-6.1).
- **Integración de flujo (`app.spec`)**: sin elección → popup → aceptar → estado persistido al momento (CA-2.1) → recarga restaura (CA-2.2); rechazar → datos borrados y cero escrituras (CA-3.1, CA-3.2); corrupto → popup (CL-1); revocar → popup y 25/5 al volver a elegir (CL-3, CL-6).
- El umbral 90 se mide sobre la lógica nueva; los componentes son plantilla fina (constitución 4).

## 6. Verificación final en navegador

1. `npm run verify`, `npm run test:coverage` (umbral 90) y `npm run build` en verde.
2. Chrome DevTools, consola limpia, móvil **375×667** y escritorio:
   1. Sin elección → popup bloquea la app; Escape no cierra; foco atrapado.
   2. Aceptar → se guarda al instante; recarga → tiempos y fase restaurados; pie visible.
   3. Rechazar → datos previos borrados, solo queda la elección; recarga → 25/5.
   4. Elección corrupta (basura en la clave) → recarga → popup (CL-1).
   5. Revocar → borra todo sin confirmación → popup; elegir de nuevo → 25/5 (CL-3, CL-6).
   6. Almacenamiento no disponible (modo incógnito) → app en memoria y popup en cada visita (CL-7).

## Cobertura RF → plan

| RF   | Dónde se cubre        |
| ---- | --------------------- |
| RF-1 | §2.1, §4, §5, T3/T5   |
| RF-2 | §2.3, §3, T2/T5       |
| RF-3 | §2.3, §2.4, T2/T5     |
| RF-4 | §2.1, §5, T3          |
| RF-5 | §2.2, §2.3, §3, T1/T2 |
| RF-6 | §2.4, §2.6, §4, T4/T5 |
| RF-7 | §3, §5, T1            |
