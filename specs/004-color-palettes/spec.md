# Spec 004 — Selector de paletas de colores

Estado: aprobada

## Contexto y objetivo

La app usa una única paleta de colores fija (7 tokens: fondo, superficie, texto, acento, pista, foco y descanso). El usuario quiere adaptar la apariencia a su gusto y contexto (día, noche, ambiente).

**Objetivo**: ofrecer un selector de paletas junto al timer que cambie todos los colores de la app, con 4 paletas incluidas, respetando el consentimiento de la spec 003 para su persistencia.

## Paletas

| Nombre                   | Fondo     | Superficie | Texto     | Acento    | Pista     | Foco      | Descanso  | Sentimiento                             |
| ------------------------ | --------- | ---------- | --------- | --------- | --------- | --------- | --------- | --------------------------------------- |
| **Sereno** (por defecto) | `#f8f5ee` | `#fffdfa`  | `#30271f` | `#007b66` | `#dfdad1` | `#b05139` | `#316f97` | natural, tranquilo, concentración suave |
| **Noche**                | `#0c121a` | `#161d29`  | `#e4e8ef` | `#2cc5c5` | `#2d333d` | `#eba941` | `#a486d7` | nocturno, intimista, bajar las luces    |
| **Atardecer**            | `#fceeed` | `#fffaf9`  | `#3c2829` | `#b94642` | `#ebd9d7` | `#b2417f` | `#6f4fa1` | cálido, enérgico, creativo              |
| **Bosque**               | `#ecf5ec` | `#f9fdf9`  | `#1d2a1d` | `#0b7643` | `#cedcce` | `#957f23` | `#207582` | orgánico, restaurador, descanso natural |

## Usuarios

- **Usuario final**: persona que usa el app para concentrarse; elige la paleta que mejor le acompañe.

## Historias de usuario

- **HU-1**: Como usuario, quiero elegir la paleta de colores de la app desde un icono junto al timer, para adaptar la apariencia a mi gusto o al momento del día.
- **HU-2**: Como usuario, quiero que al elegir una paleta cambien todos los colores de la app de forma suave, para que la experiencia sea coherente y agradable.
- **HU-3**: Como usuario, quiero que mi paleta elegida se recuerde en mi próxima visita, para no volver a elegirla cada vez.
- **HU-4**: Como usuario, quiero que si no doy mi consentimiento para guardar, la paleta se aplique igualmente en la sesión actual, para poder usarla aunque no se guarde.

## Requisitos funcionales

**RF-1 — Selector de paletas junto al timer**
El sistema deberá mostrar un control con un icono característico de paleta de colores, situado a la izquierda del cuadro del timer, que despliegue con animación un listado con las 4 paletas (Sereno, Noche, Atardecer y Bosque).

- CA-1.1: Dado que el popup de consentimiento no está visible, cuando el usuario acceda a la pantalla del cronómetro, el sistema deberá mostrar el control junto al cuadro del timer.
- CA-1.2: Cuando el usuario active el control, el sistema deberá desplegar con animación el listado con las 4 paletas disponibles.
- CA-1.3: Cada opción del listado deberá ser un rectángulo con el nombre de la paleta en su interior: el fondo del rectángulo usará el color predominante de la paleta (su color de fondo, el primero de la tabla), el nombre usará otro color de la paleta, la opción activa llevará un check (✓) delante del nombre y la opción con foco al navegar se resaltará con un borde usando otro color de la paleta; una opción puede estar activa y enfocada a la vez, y entonces tendrá ambas señales.

**RF-2 — Aplicación inmediata a toda la app con transición suave**
El sistema deberá aplicar al instante todos los colores de la paleta seleccionada (fondo, superficie, texto, acento, pista, foco y descanso) a toda la aplicación, mediante una transición suave.

- CA-2.1: Cuando el usuario seleccione una paleta, el sistema deberá cambiar de inmediato los 7 colores en toda la app, con transición suave y sin salto de golpe.
- CA-2.2: Cuando el usuario seleccione una paleta con el cronómetro en curso, el sistema deberá aplicarla sin interrumpirlo ni alterar su progreso.

**RF-3 — Paleta por defecto**
El sistema deberá usar la paleta Sereno como paleta por defecto en la primera visita y siempre que no haya una paleta elegida válida.

- CA-3.1: Dado que no existe ninguna paleta elegida, cuando el usuario acceda por primera vez, el sistema deberá mostrar la app con la paleta Sereno.

**RF-4 — Persistencia solo con consentimiento aceptado**
El sistema deberá guardar la paleta elegida en el almacenamiento local del navegador solo cuando el consentimiento (spec 003) esté aceptado, guardándola de inmediato.

- CA-4.1: Dado que el consentimiento está aceptado, cuando el usuario seleccione una paleta, el sistema deberá guardar la elección de inmediato.
- CA-4.2: Dado que existe una paleta guardada, cuando el usuario recargue la aplicación, el sistema deberá restaurar esa paleta.

**RF-5 — Elección sin consentimiento solo en memoria**
El sistema deberá aplicar en memoria la paleta elegida cuando no haya consentimiento aceptado, sin escribir nada en el navegador.

- CA-5.1: Dado que el consentimiento no está aceptado, cuando el usuario seleccione una paleta, el sistema deberá aplicarla en la sesión actual sin persistirla.
- CA-5.2: Dado que el consentimiento no está aceptado, cuando el usuario recargue la aplicación, el sistema deberá volver a la paleta Sereno.

**RF-6 — Revocación vuelve a la paleta por defecto**
El sistema deberá borrar la elección de paleta guardada y volver a la paleta Sereno de inmediato cuando el usuario revoque el consentimiento, junto al borrado existente de datos.

- CA-6.1: Cuando el usuario revoque el consentimiento (RF-6 de la spec 003), el sistema deberá borrar la elección de paleta guardada y mostrar Sereno al instante, junto con la vuelta a los valores por defecto 25/5, de modo que una paleta anterior no resucite al elegir de nuevo.

**RF-7 — Valor guardado inválido**
El sistema deberá tratar como no elegida una paleta guardada corrupta, vacía o que no corresponda a ninguna de las 4 paletas, usando Sereno sin avisos.

- CA-7.1: Si el valor guardado es corrupto, vacío o de una paleta inexistente, entonces el sistema deberá usar Sereno silenciosamente, sin ningún aviso y sin romper el funcionamiento de la app.

**RF-8 — Paleta activa identificable**
El sistema deberá identificar de forma clara, dentro del listado, la opción de la paleta actualmente activa, con una señal no dependiente solo del color.

- CA-8.1: Dado que el listado está abierto, el sistema deberá distinguir la opción de la paleta activa de las demás con el check (✓) delante del nombre descrito en CA-1.3; el borde reservado al foco no deberá usarse como marca de activa.

## Requisitos no funcionales

- **RNF-1 — Contraste**: cada una de las 4 paletas deberá cumplir el contraste AA en sus usos de texto y a bordes, iconos y estados de foco de elementos interactivos (la pista del cronómetro es decorativa y no cuenta).
- **RNF-2 — Responsive**: el selector y el listado deberán verse y usarse correctamente en móvil (desde 375 px de ancho) y en escritorio.
- **RNF-3 — Accesibilidad**: el control y sus opciones deberán ser navegables por teclado, con foco visible, nombre accesible y resaltado de la paleta activa no dependiente solo del color.
- **RNF-4 — Movimiento reducido**: con la preferencia `prefers-reduced-motion` activa, el despliegue del listado y el cambio de colores deberán respetar el movimiento reducido (animación mínima o nula).
- **RNF-5 — Idioma**: los textos de la interfaz y de la spec en castellano; código, variables y comentarios en inglés.
- **RNF-6 — Sin dependencias nuevas**: el selector deberá implementarse sin librerías externas, solo con el stack del proyecto.
- **RNF-7 — Cobertura**: mínimo 90% de cobertura sobre la lógica, según la constitución.

## Casos límite

- **CL-1**: Cambiar de paleta con el cronómetro en curso → se aplica sin interrumpirlo ni resetearlo (CA-2.2).
- **CL-2**: Popup de consentimiento abierto → el selector no es accesible mientras el modal bloquea; solo tras elegir "Aceptar" o "Rechazar" (CA-1.1).
- **CL-3**: Almacenamiento no disponible (modo incógnito o cuota llena) → la app degrada como en la spec 003 (CL-7): la paleta elegida se aplica en memoria durante la sesión y vuelve a Sereno al recargar.
- **CL-4**: Doble pestaña abierta → no se garantiza la coherencia en vivo entre pestañas (mismo criterio que la spec 003); al recargar, cada pestaña leerá la última paleta guardada.

## Fuera de alcance

- Crear, editar o importar paletas personalizadas: solo las 4 predefinidas.
- Tema oscuro automático según el sistema operativo: Noche se elige a mano, no por detección.
- Sincronización de la paleta entre dispositivos.

## Criterios de finalización

1. El selector aparece junto al timer y despliega con animación las 4 paletas; cada opción es un rectángulo con su nombre en el formato descrito (RF-1).
2. Al elegir una paleta cambian los 7 colores de toda la app con transición suave, sin interrumpir el cronómetro (RF-2).
3. Primera visita sin paleta guardada → Sereno (RF-3).
4. Con consentimiento, la paleta se guarda de inmediato y se restaura al recargar; sin consentimiento, se aplica en memoria y al recargar vuelve a Sereno (RF-4, RF-5).
5. Revocar el consentimiento borra la paleta guardada y vuelve a Sereno al instante (RF-6).
6. Un valor guardado inválido vuelve a Sereno de forma silenciosa y sin fallos (RF-7).
7. La paleta activa es identificable en el listado sin depender solo del color (RF-8).
8. Las 4 paletas cumplen contraste AA (RNF-1); verificado en móvil 375×667 y escritorio con consola limpia (RNF-2).
9. Control accesible por teclado con foco visible y `prefers-reduced-motion` respetado (RNF-3, RNF-4).
10. Textos en castellano (RNF-5); sin dependencias nuevas (RNF-6); cobertura de tests ≥ 90% (RNF-7); verificaciones del proyecto en verde (formato, calidad y tests).

## Dudas abiertas

- Ninguna.
