# Spec 006 — Cadencia del conteo del cronómetro

Estado: borrador

## 1. Contexto y objetivo

El usuario ve en Firefox que el tiempo restante se congela más de lo debido y luego recupera avanzando de golpe (p. ej. salta dos valores). En Chrome no sucede.

Bug reproducido registrando los cambios del valor MM:SS durante una fase de 1 minuto:

- **Firefox**: los cambios llegan tarde (~1005–1020 ms entre valores) y ocasionalmente el valor se salta un número (03:57 → 03:55, sin pasar por 03:56). Percepción: el número se congela ~2 s y luego baja 2 de golpe.
- **Chrome**: un cambio por segundo (~1000 ms), cada valor ~1 s en pantalla, sin saltos ni repeticiones.
- **Causa de fondo**: el repintado no queda alineado con los límites de segundo del reloj; en Firefox esa desalineación llega a saltar un valor (contexto del POR QUÉ, no es diseño).

**Objetivo**: que en Firefox el conteo se vea como hoy en Chrome: bajar exactamente 1 en 1, sin repetir ni saltar valores, y sin deriva acumulada respecto al tiempo real. Válido en Firefox y en Chrome (no romper Chrome).

La cadencia a corregir aplica solo con la pestaña visible. «Pestaña visible» significa: la pestaña es la mostrada en primer plano de su ventana y la ventana no está minimizada; el foco de la ventana no importa (ver CL-2). El cómo se logra (mecanismo interno) se decide en el plan: esta spec fija solo el comportamiento visible.

Esta spec precisa el CA-1.3 de la spec 002 («actualizarse cada segundo») y el CA-1.2 (vaciado del círculo) fijando criterios observables: el vaciado del dial se entiende ahora como pasos de 1 segundo coherentes con los dígitos (como se ve hoy en Chrome), no como vaciado «continuo». Todo lo demás de la 002 sigue en vigor.

## 2. Usuarios

- **Usuario final**: persona que usa la app para concentrarse (el mismo de la 002), también con Firefox como navegador.

## 3. Historias de usuario

- **HU-1**: Como usuario de la app en Firefox, quiero que los dígitos MM:SS y el dial bajen un segundo cada segundo, sin congelarse ni saltar valores, para fiarme del cronómetro de un solo vistazo.

## 4. Requisitos funcionales

**RF-1 — Cadencia de los dígitos MM:SS**
El sistema deberá bajar el valor mostrado exactamente un valor por segundo, en cuenta descendente consecutiva, con la pestaña visible.

Definición observable de «conteo limpio»: cada valor se muestra una única vez, cada cambio de valor ocurre entre 900 y 1100 ms después del anterior y el total mostrado nunca se adelanta ni se retrasa en más de 1 s respecto al tiempo real transcurrido.

- CA-1.1: MIENTRAS el cronómetro esté en curso con la pestaña visible, EL SISTEMA DEBERÁ cambiar el valor mostrado entre 900 y 1100 ms después del cambio anterior.
- CA-1.2: MIENTRAS el cronómetro esté en curso con la pestaña visible, EL SISTEMA DEBERÁ mostrar cada valor de segundos exactamente una vez y en orden consecutivo descendente, sin repetir ninguno ni saltarse ninguno.
- CA-1.3: MIENTRAS el cronómetro esté en curso con la pestaña visible, EL SISTEMA DEBERÁ cumplir la cadencia anterior tanto en la fase de concentración como en la de descanso.

**RF-2 — Cadencia del dial**
El sistema deberá mantener el dial (arco que se vacía) coherente con los dígitos y con el tiempo real, con la pestaña visible.

- CA-2.1: MIENTRAS el cronómetro esté en curso con la pestaña visible, EL SISTEMA DEBERÁ mantener en todo instante el nivel del dial correspondiente a la fracción de fase transcurrida según el tiempo real, con una tolerancia de ±1 s (RNF-3 de la 002), coherente con los dígitos y en ambas fases.

**RF-3 — Sincronía con el tiempo real (sin deriva acumulada)**
El sistema deberá mantener el valor mostrado ligado al tiempo real durante toda la fase, sin que los retrasos de repintado se acumulen.

- CA-3.1: MIENTRAS el cronómetro esté en curso con la pestaña visible, EL SISTEMA DEBERÁ mostrar en cada instante un valor que no se adelante ni se retrase en más de 1 s respecto al tiempo real transcurrido desde el arranque de la fase, sin deriva acumulada.
- CA-3.2: CUANDO llegue el fin de una fase con la pestaña visible, EL SISTEMA DEBERÁ producirlo dentro de la tolerancia del RNF-3 de la 002 (±1 s).

**RF-4 — Sin regresiones**
El sistema deberá aplicar la corrección sin alterar ningún otro comportamiento existente.

- CA-4.1: SI el usuario pausa, reanuda, reinicia o edita los tiempos, ENTONCES el sistema deberá mantener el comportamiento de la spec 002 (RF-1, RF-2, RF-3 y RF-7), sin cambios por esta corrección.
- CA-4.2: CUANDO el conteo arranque tras pausar, reiniciar o editar, EL SISTEMA DEBERÁ aplicar la cadencia limpia desde el primer segundo, sin arrastrar repeticiones ni saltos del estado anterior.
- CA-4.3: SI el navegador es Chrome, ENTONCES el sistema deberá seguir mostrando el conteo limpio actual: la corrección no deberá alterar su comportamiento visible.
- CA-4.4: Las transiciones de fase, la tarjeta de aviso y el sonido deberán seguir comportándose según RF-4, RF-5 y RF-6 de la spec 002.

## 5. Requisitos no funcionales

- **RNF-1 — Sin cambios de estilo**: la corrección no deberá alterar el aspecto (posición, tamaño, color, tipografía) de los dígitos ni del dial.
- **RNF-2 — Sin dependencias ni pasos de build nuevos**: la corrección se resuelve con las herramientas ya presentes en el proyecto.
- **RNF-3 — Verificabilidad**: cada CA deberá poder verificarse observando el navegador (Firefox y Chrome), con las interacciones que cada CA describa.
- **RNF-4 — Cobertura**: mantener ≥ 90 % de cobertura en la lógica y componentes afectados, según la constitución.
- **RNF-5 — Idioma**: spec e interfaz en castellano; código en inglés.

## 6. Casos límite

- **CL-1**: Transición automática de fase → el primer valor de la fase nueva (tiempo completo) deberá mostrarse una única vez y la cadencia limpia deberá arrancar desde el primer segundo, tanto en dígitos como en dial.
- **CL-2**: Pestaña visible pero ventana sin foco → la cadencia corregida deberá mantenerse: lo que condiciona el requisito es que la pestaña esté visible, no que la ventana tenga el foco.
- **CL-3**: Salto grande del reloj del sistema (5 s o más) con la pestaña visible → el valor mostrado deberá resincronizarse con un único ajuste y retomar la cadencia limpia; el salto y las repeticiones que ese único ajuste produzca no cuentan como defectuosos. Se verifica manipulando el reloj (ajuste del sistema o de las herramientas de desarrollador), no solo observando.
- **CL-4**: Recarga con ciclo en curso → el estado restaurado (fase con tiempo completo y cronómetro parado, CA-8.2 de la 002) deberá arrancar con la cadencia limpia al pulsar PLAY.
- **CL-5**: Vuelta de pestaña oculta → el valor mostrado deberá ser el correcto de inmediato (único ajuste de resincronización) y la cadencia limpia deberá reanudarse; el salto y las repeticiones que ese único ajuste produzca no cuentan como defectuosos. La resincronización proviene del RNF-3 de la 002 (deriva 0 s en segundo plano) y del comportamiento de visibilidad ya existente; la 006 solo exige que, tras ella, la cadencia limpia se reanude.

## 7. Fuera de alcance

- Cadencia visual con la pestaña oculta o en segundo plano: al volver basta la resincronización del comportamiento existente (RNF-3 de la 002).
- Lógica de ciclos, transición de fase, tarjeta de aviso y sonido.
- Persistencia y consentimiento (spec 003).
- Edición de minutos y sus unidades (RF-7 de la 002).
- Cambios de aspecto, estilo o disposición de la pantalla.
- Cualquier otra funcionalidad del cronómetro: esta spec solo corrige la cadencia visible.

## 8. Criterios de finalización

1. En Firefox, con pestaña visible, los dígitos bajan un valor por segundo, sin saltos ni repeticiones, en ambas fases (RF-1).
2. El dial se vacía proporcional al tiempo real y coherente con los dígitos, en ambas fases (RF-2).
3. Sin deriva acumulada; el fin de fase se produce dentro de la tolerancia de la 002 (RF-3).
4. Pausa, reanudación, reinicio, edición, transiciones, aviso y sonido sin cambios, y Chrome mantiene su conteo actual (RF-4).
5. Casos límite cubiertos (CL-1 a CL-5).
6. Cobertura ≥ 90 % y verificaciones del proyecto en verde (RNF-4).

## 9. Dudas abiertas

- Ninguna.
