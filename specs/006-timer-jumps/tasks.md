# Tareas — Spec 006: Cadencia del conteo del cronómetro

Ejecución en la rama `006-timer-jumps` (ya creada), en orden. Una tarea = un commit (conventional-commits, en inglés, código T#); el usuario aprueba el mensaje antes de cada commit. Tests primero (TDD) en T2 y T3.

**Paralelización**: T1 → T2 → T3 en serie (T3 usa la función de T2). T4 ∥ T5 (ambas solo dependen de T3; `MEMORY.md` lo escribe un solo implementer por ola). T6 al final, en serie.

## T1 — Docs de la spec

Commitear spec 006, plan y tareas; anotar en `MEMORY.md` que arranca la 006 en su rama.

- Archivos: `specs/006-timer-jumps/*`, `MEMORY.md`
- Tests: —
- RF: — (documentación)
- Depende de: nada
- Hecho cuando: commit `docs(specs): add spec 006 with plan and tasks (T1)` propuesto y, si procede, hecho; `MEMORY.md` refleja la 006 en curso.

## T2 — Retardo de repintado alineado (RF-1, RF-3)

Añadir la función pura `nextTickDelay(state, now)` a `timer.logic.ts`: ms hasta el próximo límite de segundo visible (`null` parado, `0` vencido, `1000` en límite justo, si no `(endsAt − now) % 1000`). TDD: primero los tests, luego la función.

- Archivos: `src/app/timer/timer.logic.ts`, `src/app/timer/timer.logic.spec.ts`
- Tests (primero): parado → `null`; vencido → `0`; a medio segundo → ms exactos al próximo límite; límite justo → `1000`; invariante de alineación; cadena con retraso simulado (+17 ms por disparo) sin crecer.
- RF: RF-1 (base de CA-1.1/CA-1.2), RF-3 (CA-3.1)
- Depende de: T1
- Hecho cuando: tests de `nextTickDelay` en verde con cobertura ≥ 90 % en `timer.logic.ts`; commit `feat(timer): add repaint delay aligned to second boundaries (T2)` propuesto y, si procede, hecho; `MEMORY.md` actualizado.

## T3 — Repintado encadenado en el servicio (RF-1, RF-2, RF-3, RF-4)

Sustituir el `setInterval(1000)`/`TICK_MS` por un `setTimeout` encadenado con `nextTickDelay`, reprogramado tras cada tick, en cada `apply()` y tras el tick de `visibilitychange`. TDD: primero los tests de servicio, luego el cambio.

- Archivos: `src/app/timer/timer.service.ts`, `src/app/timer/timer.service.spec.ts`
- Tests (primero): con reloj falso y pasos desiguales (jitter simulado) el valor baja 1 en 1 sin repetir ni saltar y la transición cae dentro de ±1 s; pausa/reanudar/reset/editar reprograman sin arrastrar saltos; recarga + PLAY alineado (CL-4); `progress` un paso por segundo.
- RF: RF-1, RF-2, RF-3, RF-4 (CA-4.1/CA-4.2); CL-2, CL-4
- Depende de: T2
- Hecho cuando: tests en verde y cobertura ≥ 90 %; sin cambios en dial, plantillas, estilos ni lógica de ciclos; commit `fix(timer): align repaints to second boundaries (T3)` propuesto y, si procede, hecho; `MEMORY.md` actualizado.

## T4 — Verificación del arreglo en Firefox (RF-1, RF-2, RF-3; CL-1 a CL-5)

Con `npm start` y Firefox DevTools MCP: MutationObserver sobre el span MM:SS — deltas 900–1100 ms, sin saltos ni repeticiones en ambas fases; primer valor de la fase nueva limpio (CL-1); pestaña visible sin foco (CL-2); salto de reloj ≥ 5 s manipulando el reloj (CL-3, único ajuste exento); recarga + PLAY (CL-4); ocultar y volver (CL-5). Estilo intacto (RNF-1).

- Archivos: `MEMORY.md` (anotar resultado)
- Tests: — (verificación en navegador)
- RF: RF-1, RF-2, RF-3; criterios 1–3 de la spec
- Depende de: T3
- Hecho cuando: el registro del valor muestra cadencia y secuencia limpias en los 5 CL; `MEMORY.md` anota el resultado; commit `docs(memory): record spec 006 firefox verification (T4)` propuesto y, si procede, hecho.

## T5 — Regresión en Chrome con Chrome DevTools MCP (RF-4; CA-4.3)

Exigencia explícita del usuario: comprobar que con Chrome DevTools MCP todo sigue funcionando igual que antes de la modificación — cadencia limpia de dígitos y dial (como antes), pausa/reanudar sin reiniciar, RESET deshabilitado/habilitado, edición 1..60 con inválidos, transición con tarjeta y sonido, recarga con estado recordado, consola limpia, móvil 375×667 y escritorio.

- Archivos: `MEMORY.md` (anotar resultado)
- Tests: — (verificación en navegador)
- RF: RF-4 (CA-4.3); criterio 4 de la spec
- Depende de: T3 (independiente de T4 → paralelizable con ella)
- Hecho cuando: el recorrido completo es idéntico al previo a la modificación y la consola está limpia; `MEMORY.md` anota el resultado; commit `docs(memory): record spec 006 chrome regression check (T5)` propuesto y, si procede, hecho.

## T6 — Cierre: verificación completa y memoria

`npm run verify` (formato + calidad + tests) y `npm run test:coverage` en verde; `npm run build` sin errores; cerrar `MEMORY.md`: estado de la 006, decisión (repintado alineado a límites de segundo y su porqué) y el aprendizaje de que `setInterval` acumula deriva en Firefox.

- Archivos: `MEMORY.md`
- Tests: `npm run verify`, `npm run test:coverage`, `npm run build`
- RF: RNF-2, RNF-3, RNF-4, RNF-5 de la spec; criterios 5–6
- Depende de: T4 y T5
- Hecho cuando: todo en verde; `MEMORY.md` ≤ ~50 líneas con la decisión y su porqué; commit `docs(memory): close spec 006 cadence work (T6)` propuesto y, si procede, hecho.
