# Spec 003 — Popup de consentimiento de cookies y almacenamiento local (RGPD)

Estado: aprobada

## Contexto y objetivo

La app guarda ajustes de tiempo y fase en el navegador sin pedir permiso. El RGPD y la LOPDGDD, vigentes en 2026, exigen el consentimiento del usuario antes de almacenar datos en su navegador.

**Objetivo**: que el usuario decida de forma informada si la app guarda datos en su dispositivo, con un popup bloqueante que avise de las consecuencias y permita cambiar de opinión.

## Usuarios

- **Usuario final**: persona que usa la app para concentrarse; es quien da o retira su consentimiento.

## Historias de usuario

- **HU-1**: Como usuario, quiero que la app me pida permiso antes de guardar datos en mi navegador, para decidir yo sobre mi privacidad.
- **HU-2**: Como usuario, quiero que el popup me avise en una frase de qué pierdo si no acepto, para elegir con toda la información.
- **HU-3**: Como usuario, quiero que mi elección se recuerde, para no ver el popup en cada visita.
- **HU-4**: Como usuario, quiero poder cambiar de opinión más adelante, para borrar lo guardado y volver a decidir.
- **HU-5**: Como usuario, quiero que si rechazo no se guarde nada mío, para usar la app sin dejar rastro.

## Requisitos funcionales

**RF-1 — Modal bloqueante hasta que exista elección**
El sistema deberá mostrar un popup de aceptación o rechazo del almacenamiento local del navegador siempre que no exista una elección guardada, y el popup deberá ser bloqueante.

- CA-1.1: Dado que no existe ninguna elección guardada, cuando el usuario acceda a la aplicación, el sistema deberá mostrar el popup impidiendo usar la aplicación hasta que elija.
- CA-1.2: Mientras el usuario no haya elegido, el sistema deberá impedir cualquier interacción con la aplicación y solo deberá cerrar el popup con los botones "Aceptar" y "Rechazar", sin ninguna otra vía de cierre (ni siquiera con la tecla Escape).
- CA-1.3: Dado que existe una elección guardada (aceptar o rechazar), cuando el usuario acceda, el sistema deberá no mostrar el popup y permitir el uso directo de la aplicación.

**RF-2 — Aceptar guarda el estado y habilita la persistencia**
El sistema deberá guardar de inmediato el estado actual (tiempos y fase) y habilitar el guardado permanente en el almacenamiento local del navegador cuando el usuario acepte.

- CA-2.1: Cuando el usuario elija "Aceptar", el sistema deberá persistir sin demora los ajustes de tiempo y la fase actuales, además de permitir los guardados posteriores.
- CA-2.2: Dado que existe la elección "aceptar", cuando el usuario recargue la aplicación, el sistema deberá restaurar los ajustes y el progreso guardados.

**RF-3 — Rechazar no guarda nada y borra lo previo**
El sistema deberá impedir todo guardado cuando el usuario rechace, borrando los datos que la app hubiera guardado previamente (salvo la propia elección, RF-5).

- CA-3.1: Cuando el usuario elija "Rechazar", el sistema deberá borrar los datos previos de la aplicación en el navegador (cookies y almacenamiento local), excluyendo la propia elección de consentimiento, que se escribirá después de ese borrado (RF-5).
- CA-3.2: Dado que existe la elección "rechazar", mientras dicha elección siga vigente, el sistema deberá dejar la aplicación funcionando con normalidad sin guardar ningún dato (salvo la propia elección, RF-5).
- CA-3.3: Dado que existe la elección "rechazar", cuando el usuario vuelva a entrar, el sistema deberá usar los valores por defecto (25 y 5 minutos) y no conservar el progreso.

**RF-4 — Aviso de la consecuencia en el popup**
El sistema deberá incluir en el popup una frase corta en español que avise de que, sin aceptar, los ajustes y el progreso no se guardarán.

- CA-4.1: Dado que el popup está visible, el sistema deberá mostrar el aviso junto a los botones, sin necesidad de abrir ningún texto adicional.

**RF-5 — La elección es la única escritura permitida sin consentimiento**
El sistema deberá permitir, como única escritura en el navegador sin consentimiento aceptado, la propia elección de consentimiento, para recordarla entre visitas.

- CA-5.1: Mientras no exista la elección "aceptar", el sistema deberá impedir cualquier escritura en el navegador distinta de la propia elección.
- CA-5.2: Dado que la elección es "aceptar" o "rechazar" y el almacenamiento está disponible, el sistema deberá conservarla en el navegador para no volver a mostrar el popup en visitas posteriores.

**RF-6 — Cambiar de opinión (revocación)**
El sistema deberá ofrecer un enlace con texto pequeño en el pie de la pantalla, visible solo cuando exista una elección guardada (oculto mientras el popup esté abierto), para cambiar de opinión; al activarlo deberá borrar directamente, sin confirmación previa.

- CA-6.1: Dado que existe una elección guardada (aceptar o rechazar), cuando el popup no esté visible, el sistema deberá mostrar en el pie el enlace de revocación, visible en cualquier pantalla y accesible (navegable por teclado y con nombre accesible).
- CA-6.2: Cuando el usuario active ese enlace, el sistema deberá borrar directamente, sin pedir confirmación, la elección guardada y todos los datos que la aplicación hubiera guardado.
- CA-6.3: Dado que la elección ha sido borrada, el sistema deberá volver a mostrar el popup bloqueante (RF-1); al elegir de nuevo, la aplicación partirá de los valores por defecto (25 y 5), porque los datos se borraron al revocar, y solo volverá a guardar si se elige "Aceptar".

**RF-7 — Elección corrupta**
El sistema deberá tratar como inexistente cualquier elección guardada corrupta, ilegible o fuera de los valores esperados.

- CA-7.1: Si la elección guardada es corrupta, ilegible o está fuera de los valores esperados, entonces el sistema deberá mostrar de nuevo el popup bloqueante, como si no hubiera elección (RF-1).

## Requisitos no funcionales

- **RNF-1 — Idioma**: todos los textos del popup y de la spec en castellano; código, variables y comentarios en inglés.
- **RNF-2 — Responsive**: el popup debe verse y usarse correctamente en móvil (desde 375 px de ancho) y en escritorio.
- **RNF-3 — Accesibilidad del popup**: el popup deberá tener rol de diálogo, el foco deberá iniciar en el popup y quedar atrapado mientras esté abierto; Escape no deberá cerrarlo (solo "Aceptar" y "Rechazar"); los botones deberán tener nombre accesible y el aviso no deberá depender solo del color.
- **RNF-4 — Paleta**: el popup debe usar la paleta existente de tokens, sin colores nuevos.
- **RNF-5 — Cobertura**: mínimo 90% de cobertura sobre la lógica, según la constitución.
- **RNF-6 — Sin dependencias nuevas**: el popup deberá implementarse sin librerías externas, solo con el stack del proyecto.

## Casos límite

- **CL-1**: Elección corrupta o ilegible → se trata como "sin elección" y vuelve a aparecer el popup (RF-7).
- **CL-2**: Rechazo con datos guardados en una visita anterior → los datos se borran al confirmar el rechazo (CA-3.1).
- **CL-3**: Revocar con una sesión en curso → se borran elección y datos, el popup bloquea y, al elegir de nuevo, la aplicación vuelve a los valores por defecto (25 y 5).
- **CL-4**: Recargas repetidas sin ninguna elección → el popup vuelve a mostrarse en cada entrada.
- **CL-5**: Recargas con rechazo → siempre valores por defecto (25 y 5), sin persistencia de ninguna clase.
- **CL-6**: Revocar y elegir "Aceptar" de nuevo → la aplicación vuelve a guardar con normalidad, partiendo de 25 y 5 (los datos se borraron al revocar).
- **CL-7**: Almacenamiento no disponible (modo incógnito o cuota llena) → la app degrada: funciona en memoria con valores por defecto y el popup aparece en cada visita, porque no hay dónde recordar la elección.

## Fuera de alcance

- Banner de proveedores o cookies de terceros: la app no usa cookies de terceros.
- Categorías granulares de consentimiento (analítica, personalización): solo se ofrece aceptar o rechazar.
- Página de política de cookies o textos legales extensos: el popup solo lleva el aviso breve.
- Consentimiento de menores o mecanismos de doble consentimiento.
- Cambiar la persistencia existente de la app más allá de habilitarla (RF-2) o borrarla (RF-3, RF-6).
- Dos pestañas abiertas a la vez: no se garantiza la coherencia del estado entre pestañas.

## Criterios de finalización

1. Sin elección guardada, cada entrada muestra el popup bloqueante hasta elegir; con elección, no se muestra (RF-1).
2. Aceptar guarda de inmediato el estado actual y habilita el guardado; rechazar impide todo guardado y borra los datos previos (RF-2, RF-3).
3. El popup incluye la frase de aviso sobre no guardar ajustes ni progreso (RF-4).
4. Sin consentimiento, la única escritura permitida es la propia elección, que se recuerda entre visitas (RF-5).
5. El enlace de revocar, visible en el pie solo con elección guardada, borra elección y datos sin confirmación y vuelve a mostrar el popup (RF-6).
6. Una elección corrupta vuelve a mostrar el popup (RF-7).
7. Casos límite CL-1 a CL-7 cubiertos.
8. Verificado en móvil de 375 px y escritorio con consola limpia (RNF-2); cobertura de tests ≥ 90% (RNF-5).
9. Textos en castellano (RNF-1); popup accesible con rol de diálogo, foco atrapado y sin cierre con Escape (RNF-3); paleta de tokens sin colores nuevos (RNF-4); sin dependencias nuevas (RNF-6).
10. Verificaciones del proyecto en verde (formato, calidad y tests).

## Dudas abiertas

- Ninguna.
