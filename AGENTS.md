# AGENTS.md — Simple Pomodoro GBDevs

Aplicación web de un crónometro de tipo Pomodoro para la concentración.

## Stack y estructura

- Angular, Tailwind CSS y Vite.

## Convenciones

- Textos de la interfaz en español.
- Código simple, nombres descriptivos y comentarios solo donde aporten en inglés.
- Diseño limpio y responsive; cualquier pantalla nueva debe verse bien en el móvil.
- Si el proyecto no tiene inicializado el repositorio git, pregunta si se quiere inicializar.
- Los commits deben seguir el estándar conventional-commits.
- Antes de hacer commit, genera el mensaje y pregunta si está bien y si hacer el commit.

## Reglas

- Lee `docs/constitution.md` y la spec activa (`specs/NN-*/`) antes de tocar código.
- Se deben seguir principios SOLID y mantener siempre el código lo más simple posible. Si algún método se considera candidato a ser refactorizado, para minimizar su complejidad o porque ya no es necesario, se debe indicar para su posible modificación.
- Sigue reglas de diseño actuales (2026) y simples.

## Forma de trabajar

- Antes de planificar una spec, crea una rama de git con el código de la spec activa y trabaja en ella.
- Haz solo lo que se pide: no añadas funcionalidades por tu cuenta.
- Cambios pequeños y enfocados; no reescribas lo que ya funciona.
- Al terminar, resume qué has cambiado y cualquier decisión que deba revisar.

## Límites

- Pregunta antes: crear archivos nuevo o cambiar el formato de los datos guardados.
- Nunca: añadir dependencias, frameworks o un paso de build.
- Siempre: actualizar `MEMORY.md` al terminar cada tarea.

## Memoria

- Al empezar, lee `MEMORY.md` para conocer el estado del proyecto y las decisiones
  tomadas.
- Al terminar una tarea, actualízalo: estado actual, decisiones importantes (con su
  porqué) y errores a evitar.
- Mantenlo breve (máximo ~50 líneas): resume o elimina lo que ya no aporte.
- Si algo se convierte en una regla permanente, propón moverlo a `AGENTS.md` en lugar de
  dejarlo en la memoria.
- No guardes nunca datos sensibles (claves, tokens, datos personales).
- No añadas en la memoria ningún dato que esté en cv-data, si es necesario pregunta antes.

## Verificación

- Test propios del proyecto que se deben lanzar al hacer build. Después de cada cambio, verifica con el MCP de Chrome
  DevTools: prueba la funcionalidad, revisa la consola y comprueba la vista móvil.

## Comandos

-
