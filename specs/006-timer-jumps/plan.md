# Plan — Spec 006: Cadencia del conteo del cronómetro

CÓMO de la spec aprobada (`specs/006-timer-jumps/spec.md`). Rama de trabajo: `006-timer-jumps` (ya creada).

## Causa raíz

- El dígito cambia solo cuando el ms restante cruza un múltiplo de 1000: `formatTime` redondea hacia arriba (`Math.ceil`) y el restante viene del reloj absoluto (`endsAt` − `Date.now()`).
- El repintado se dispara con `setInterval(1000)` fijo; en Firefox su cadencia se retrasa (~1005–1020 ms y acumulando), así que algún repintado cruza **dos** límites de segundo → el valor baja 2 de golpe (y antes se vio congelado ~2 s).
- Chrome dispara a ~1000 ms justo y nunca cruza dos límites: no lo sufre.

## Enfoque: repintado alineado al límite de segundo

Cambio mínimo, solo en el disparo del repintado; la verdad sigue siendo el reloj absoluto:

1. **Función pura nueva `nextTickDelay(state, now)`** en `timer.logic.ts`: ms hasta el próximo límite de segundo visible — `0` si el tiempo está vencido (transicionar ya), `1000` si se está justo en un límite (ese valor ya se acaba de pintar), y si no `(endsAt − now) % 1000`; `null` si el cronómetro no corre. Determinista con `now` inyectado.
2. **Servicio**: sustituir el `setInterval(1000)` (constante `TICK_MS`) por un `setTimeout` encadenado con ese retardo, reprogramado tras cada tick, en cada `apply()` y tras el tick inmediato de `visibilitychange`.

Propiedades que salen gratis: cada repintado coincide con un cambio de valor → cada valor se muestra una única vez (CA-1.1/CA-1.2); el retardo se recalcula desde el reloj en cada disparo → la puntualidad no se acumula, cadencia ~1000 ms y sin deriva (CA-3.1; CA-3.2 vía RNF-3 de la 002); ciclos, tarjeta, sonido, persistencia y edición intactos (RF-4).

**Alternativa descartada**: tick más fino (p. ej. 100 ms) actualizando las señales solo cuando cambia el segundo. Cumpliría los CA, pero multiplica los disparos, mete la guarda anti-ruido en el servicio (menos puro) y deja cadencia real de 1000±100 ms; el alineado logra lo mismo con menos piezas y es directo de testear.

**Dial**: sin cambios (RNF-1). Sigue `transition: stroke-dashoffset 1s linear`; su `progress` avanza ahora 1 paso por segundo coherente con los dígitos — la precisión del CA-1.2 de la 002 que la spec ya declara (pasos de 1 s, no vaciado «continuo»).

## Archivos y qué cubre cada parte

| Archivo                               | Cambio                                                                                                                                  | Cubre                                  |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `src/app/timer/timer.logic.ts`        | Nueva función pura `nextTickDelay(state, now)`; nada más                                                                                | RF-1, RF-3 (base)                      |
| `src/app/timer/timer.logic.spec.ts`   | Tests de `nextTickDelay`                                                                                                                | RF-1, RF-3                             |
| `src/app/timer/timer.service.ts`      | `setInterval`/`TICK_MS` → `setTimeout` encadenado con `nextTickDelay`; reprogramar tras cada tick, en `apply()` y en `visibilitychange` | RF-1, RF-2, RF-3, RF-4                 |
| `src/app/timer/timer.service.spec.ts` | Tests de cadencia sin saltos con retraso simulado y de reprogramación en pausa/reanudar/reset/editar                                    | RF-1, RF-3, RF-4 (CA-4.1/CA-4.2), CL-4 |
| `MEMORY.md`                           | Al cierre de cada tarea                                                                                                                 | —                                      |

No se toca: `timer-dial` (ts/html/css), `formatTime`/`Math.ceil`, `advance` ni la lógica de ciclos, plantillas, estilos ni `vitest.config.ts` (la cobertura ya incluye `timer.logic.ts`).

## Decisiones

1. **Alineación por retardo calculado** (función pura + `setTimeout` encadenado) frente a polling fino: ver «Enfoque»; recalcular el retardo en cada disparo es lo que elimina la deriva acumulada del `setInterval`.
2. **`formatTime` y `Math.ceil` sin cambiar**: el redondeo hacia arriba es correcto (muestra el segundo en curso); el salto venía de cuándo se repintaba, no de cómo se formateaba.
3. **`nextTickDelay` en la lógica pura, no en el servicio**: la regla del retardo es determinista y testeable en Node con `now` inyectado (regla 3 de la constitución).

## Tests (TDD; ≥ 90 %)

- **`nextTickDelay`** (pura): no corre → `null`; vencido → `0`; a medio segundo → ms exactos hasta el próximo límite; justo en límite → `1000`; invariante de alineación (`now + delay` cae en un múltiplo de 1000 respecto a `endsAt`); encadenado con retraso simulado (+17 ms por disparo) los retardos no crecen.
- **Servicio (reloj falso, vitest)**: avanzar el reloj a pasos desiguales (jitter simulado) → el valor mostrado baja 1 en 1 sin repetir ni saltar y la transición ocurre dentro de ±1 s (CA-3.2); pausa/reanudar/reset/editar reprograman sin arrastrar saltos (CA-4.1/CA-4.2); recarga + PLAY arranca alineado (CL-4); `progress` avanza un paso por segundo (RF-2).

## Verificación (método por cada CA observable)

a) `npm run test:run` + `npm run test:coverage` (umbral 90 en lo afectado) y `npm run build`.
b) **Firefox (Firefox DevTools MCP)**, con `npm start`: MutationObserver sobre el span MM:SS registrando cada cambio — deltas entre 900 y 1100 ms, sin saltos ni repeticiones, en concentración y descanso (RF-1/RF-3); CL-1 (primer valor de la fase nueva), CL-2 (pestaña visible sin foco de ventana), CL-3 (salto de reloj ≥ 5 s manipulando el reloj, único ajuste exento), CL-4 (recarga + PLAY) y CL-5 (ocultar y volver).
c) **Regresión en Chrome (Chrome DevTools MCP)** — exigencia explícita del usuario (CA-4.3): todo debe seguir funcionando igual que antes de la modificación — cadencia limpia de dígitos y dial, pausa/reanudar sin reiniciar, RESET deshabilitado/habilitado, edición 1..60 con rechazo de inválidos, transición con tarjeta y sonido, recarga con estado recordado, consola limpia y móvil 375×667.
d) `npm run verify` en verde al cierre.

## Cobertura RF → plan

| RF   | Dónde se cubre                                       |
| ---- | ---------------------------------------------------- |
| RF-1 | Enfoque 1–2, tests de lógica y servicio, verif. b)   |
| RF-2 | Enfoque (nota dial), tests de servicio, verif. b)/c) |
| RF-3 | Enfoque 1–2, tests de servicio, verif. b)            |
| RF-4 | Tests de servicio, verificación c)                   |

## Riesgos

- **Lateness extrema** (hilo bloqueado > 1 s): un repintado puede saltarse un valor; el siguiente realinea solo. Es caso de reloj real (CL-3) y queda dentro de la tolerancia de la spec.
- **Bucle de reprogramación con retardo 0**: la regla «límite justo → 1000» lo evita; cubierto por los tests de la función pura y del encadenado del servicio con reloj falso.
