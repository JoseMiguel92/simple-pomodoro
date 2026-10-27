# Spec 005 — Recolocación del selector de paletas

Estado: borrador

## 1. Contexto y objetivo

La spec 004 añadió el selector de paletas (icono + listado de 4 paletas) situándolo a la izquierda de la tarjeta del timer, fuera de ella. Esa fila descentra la composición de la pantalla.

**Objetivo**: recolocar el icono del selector dentro de la tarjeta principal, centrado, justo debajo del subtítulo «Concentración y descanso, sin distracciones.», para lograr una pantalla limpia con la tarjeta centrada.

Es una recolocación pura: ni paletas nuevas ni cambios de funcionalidad. Esta spec supera las menciones de posición de la spec 004 —su RF-1, su HU-1 y su criterio de finalización 1, que situaban el selector a la izquierda del timer—; todo lo demás de la 004 sigue en vigor.

## 2. Usuarios

- **Usuario final**: persona que usa el app para concentrarse; ahora encuentra el selector dentro de la tarjeta.

## 3. Historias de usuario

- **HU-1**: Como usuario, quiero que el icono de paleta esté dentro de la tarjeta, bajo el subtítulo, para que la pantalla se vea centrada y ordenada.

## 4. Requisitos funcionales

**RF-1 — Icono dentro de la tarjeta, bajo el subtítulo**
El sistema deberá mostrar el icono del selector de paletas dentro de la tarjeta principal, centrado horizontalmente, justo debajo del subtítulo «Concentración y descanso, sin distracciones.» y encima del dial.

- CA-1.1: Dado que el popup de consentimiento no está visible, cuando el usuario acceda a la pantalla del cronómetro, el sistema deberá mostrar el icono de paleta dentro de la tarjeta, centrado, entre el subtítulo y el dial.
- CA-1.2: El dial, los controles y los campos de tiempo deberán mantener su posición y orden actuales dentro de la tarjeta.
- CA-1.3: La tarjeta deberá quedar como único elemento centrado en la pantalla, sin ningún control a su lado.

**RF-2 — Desplegable centrado bajo el icono**
El sistema deberá desplegar el listado de las 4 paletas (Sereno, Noche, Atardecer y Bosque) hacia abajo, anclado al icono y centrado respecto a él, al pulsar el icono.

- CA-2.1: Cuando el usuario active el icono, el sistema deberá desplegar el listado hacia abajo y centrado bajo el icono.
- CA-2.2: Cuando el usuario elija una paleta, el sistema deberá cerrar el listado (comportamiento actual).

**RF-3 — Aspecto del botón sin cambios**
El sistema deberá mantener el icono con el mismo tamaño y aspecto actuales (botón circular con el icono de paleta).

- CA-3.1: Tras la recolocación, el botón deberá verse igual que antes de ella: mismo tamaño, forma y aspecto.

## 5. Requisitos no funcionales

- **RNF-1 — Responsive**: en móvil (desde 375 px de ancho) el icono y su listado deberán verse y usarse igual que en escritorio; el listado abierto no deberá desbordar la pantalla.
- **RNF-2 — Sin cambios de estilo**: la recolocación no deberá introducir reglas visuales nuevas ni dependencias nuevas.
- **RNF-3 — Idioma**: interfaz y spec en castellano; código en inglés.
- **RNF-4 — Cobertura**: mantener ≥ 90% de cobertura en los tests de la lógica y componentes afectados, según la constitución.

## 6. Casos límite

- **CL-1**: Listado abierto tapando el dial → aceptado por diseño; el cronómetro sigue en curso y, al cerrarse el listado, el dial vuelve a estar visible e interactivo.
- **CL-2**: Popup de consentimiento abierto → el selector no es accesible mientras el modal bloquea (heredado de la 004).

## 7. Fuera de alcance

- Paletas nuevas y cambios de funcionalidad del selector, de su persistencia o del overlay de consentimiento.
- Mover el dial, los controles o los campos de tiempo.
- Cambiar el aspecto del botón o del listado.
- (Heredado de la 004): paletas personalizadas, tema automático y sincronización entre dispositivos.

## 8. Criterios de finalización

1. El icono de paleta aparece dentro de la tarjeta, centrado, bajo el subtítulo y encima del dial (RF-1).
2. Dial, controles y campos de tiempo no cambian de sitio; la tarjeta queda centrada sola en la pantalla (RF-1).
3. El desplegable se abre hacia abajo, centrado bajo el icono, y se cierra al elegir paleta (RF-2).
4. El botón se ve igual que antes, también en 375 px (RF-3, RNF-1).
5. Verificaciones del proyecto en verde (formato, calidad y tests), consola limpia y cobertura ≥ 90% (RNF-4).

## 9. Dudas abiertas

- Ninguna.
