# Spec 001 — Creación y bases del proyecto

## Contexto y objetivo

La aplicación es un cronómetro tipo Pomodoro destinado a un usuario que necesita mantener la concentración. Antes de construir funcionalidad, el proyecto necesita unas bases sólidas: reglas compartidas, herramientas que impidan desalineaciones de formato y calidad, sistema de estilos preparado y documentación inicial.

**Punto de partida real**: el proyecto ya existe y es funcional — scaffold de Angular + TypeScript operativo, formateador con su configuración inicial, runner de tests, constitución y convenciones ya redactadas, repositorio git con commit inicial y una memoria de proyecto vacía. **Falta**: comprobación de calidad, hooks de git (commit y push), sistema de estilos, comandos de verificación unificados y la memoria rellenada.

El objetivo de esta spec es dejar todo lo anterior configurado, verificable y listo para que desarrollos futuros y otros desarrolladores trabajen sobre una base coherente y mantenible. **No se implementa ninguna funcionalidad de usuario en esta spec.**

## Usuarios

- **Desarrollador actual y futuro**: trabaja en el repositorio; es el principal beneficiario de esta spec.
- **Usuario final**: persona que usará el Pomodoro para concentrarse. No recibe funcionalidad en esta versión.

## Historias de usuario

- **HU-1**: Como desarrollador, quiero que las reglas innegociables y las convenciones de trabajo estén documentadas, para que cualquier colaborador sepa cómo se trabaja en el proyecto.
- **HU-2**: Como desarrollador, quiero que commit y push queden protegidos por comprobaciones de formato, calidad y tests, para que el repositorio nunca acumule desalineaciones.
- **HU-3**: Como desarrollador, quiero que el sistema de estilos base esté instalado y operativo, para empezar interfaces sin preparar el terreno en cada tarea.
- **HU-4**: Como responsable del proyecto, quiero que el estado y las decisiones queden registradas en una memoria de proyecto, para poder retomar el trabajo entre sesiones sin perder contexto.
- **HU-5**: Como desarrollador, quiero un comando estándar por cada verificación (formato, calidad, tests, build), para comprobar el estado del proyecto de forma rápida antes de integrar.

## Requisitos funcionales

**RF-1 — Formateo automático en commit y verificación en push**
El sistema deberá verificar y corregir el formato del código antes de completar cada commit. El sistema deberá verificar el formato antes de permitir cada push, bloqueándolo si hay incidencias.

- CA-1.1: Cuando el desarrollador ejecute un commit con cambios correctamente formateados, el commit deberá completarse sin intervención adicional.
- CA-1.2: Cuando el desarrollador ejecute un commit que incluya un fichero con formato incorrecto, el sistema deberá formatearlo automáticamente antes de finalizar el commit.
- CA-1.3: Si tras el auto-formateo un fichero permanece con formato incorrecto, el commit deberá bloquearse indicando el fichero afectado.
- CA-1.4: Cuando el desarrollador ejecute un push con cambios con formato incorrecto (p. ej. commiteados sin hook), el push deberá bloquearse indicando el fichero afectado.

**RF-2 — Comprobación de calidad en commit y push**
Para evitar la acumulación de código que incumpla las reglas de calidad, el sistema deberá comprobar la calidad del código en cada commit y cada push, bloqueando los errores graves.

- CA-2.1: Cuando la comprobación detecte errores graves de calidad en un commit, el commit deberá bloquearse indicando el error detectado.
- CA-2.2: Cuando la comprobación no detecte errores graves de calidad, el commit deberá completarse.
- CA-2.3: Cuando un error de calidad requiera intervención manual, el sistema deberá indicarlo.
- CA-2.4: Cuando el push incluya errores graves de calidad en los commits que lo componen, el push deberá bloquearse indicando el error.
- CA-2.5: Los avisos de calidad no graves no deberán bloquear el commit ni el push; deberán mostrarse como advertencia.

**RF-3 — Tests antes del push**
Para evitar subir código con pruebas rotas, el sistema deberá ejecutar los tests antes de permitir cada push.

- CA-3.1: Cuando todos los tests finalicen sin fallos, el push deberá permitirse.
- CA-3.2: Si algún test falla, el push deberá bloquearse indicando el test o tests fallidos.

**RF-4 — Sistema de estilos base operativo**
El sistema de estilos fijado en la constitución deberá estar instalado y funcionando desde el inicio.

- CA-4.1: Cuando un componente utilice clases del sistema de estilos y se sirva la aplicación, los estilos deberán aplicarse correctamente.
- CA-4.2: Cuando se ejecute el build de producción con el sistema de estilos instalado, el proceso deberá finalizar sin errores.

**RF-5 — Reglas y convenciones documentadas**
El proyecto deberá mantener documentadas sus reglas innegociables y sus convenciones de trabajo.

- CA-5.1: Cuando un nuevo desarrollador lea la documentación de reglas, deberá encontrar todas las reglas innegociables de la constitución (incluida la de resolución de conflictos entre reglas), las convenciones de trabajo y la excepción autorizada para añadir dependencias de herramientado (hooks de git, formateo, calidad de código y sistema de estilos).
- CA-5.2: Cuando se finalice una tarea en la que se tomó una decisión de proyecto, la decisión y su porqué deberán quedar registradas.

**RF-6 — Memoria de proyecto**
El proyecto deberá mantener una memoria de estado entre sesiones, con un tamaño limitado para que siga siendo útil.

- CA-6.1: Cuando una tarea se complete y se actualice la memoria, esta deberá reflejar el estado actual, las decisiones tomadas y los errores a evitar.
- CA-6.2: Si la memoria supera el tamaño recomendado (~50 líneas), deberá resumirse o eliminarse lo que ya no aporte.

**RF-7 — Comandos de verificación estándar**
El proyecto deberá disponer de comandos estándar para ejecutar las verificaciones de formato, calidad, tests y build.

- CA-7.1: Cuando el desarrollador ejecute cada comando de verificación, este deberá informar claramente de si hay errores.
- CA-7.2: Cuando todas las verificaciones estén en verde, ningún commit cuyo staging las supere deberá bloquearse.

## Requisitos no funcionales

- **RN-1 — Excepción limitada a dependencias de herramientado**: solo se autoriza añadir dependencias para hooks de git, formateo, calidad de código y sistema de estilos; cualquier otra dependencia requiere aprobación previa. Esta excepción deberá quedar escrita en la documentación de convenciones (ver CA-5.1).
- **RN-2 — Reproducible**: un desarrollador nuevo debe poder clonar, instalar y tener todas las verificaciones operativas sin pasos manuales adicionales.
- **RN-3 — Rendimiento de los hooks**: la comprobación de commit no deberá superar unos pocos segundos (orden de 5 s) en este repositorio; la de push tendrá el tiempo razonable de ejecutar calidad y tests completos.
- **RN-4 — Idioma**: código, variables y comentarios en inglés; textos de interfaz, documentación y specs en castellano.
- **RN-5 — Cobertura**: mínimo del 90% sobre la lógica existente según la constitución. Se exige desde la primera spec con funcionalidad; en esta spec basta con que los tests existentes pasen en verde.
- **RN-6 — Commit convencional**: todo cambio se integra siguiendo el estándar de conventional-commits, con mensaje generado y aprobado antes de confirmar.

## Casos límite

- **CL-1**: Commit o push sin ficheros afectados por formato, calidad ni tests fallidos → no debe bloquearse ni fallar.
- **CL-2**: Ficheros generados o binarios (imágenes, build artifacts) → deben quedar excluidos de las comprobaciones.
- **CL-3**: El auto-formateo modifica ficheros tras su stage → deben quedar en el estado correcto y volver a comprobarse antes de permitir el commit.
- **CL-4**: Varias correcciones fallidas seguidas → el mensaje de bloqueo debe seguir siendo claro y no ocultar la causa original.
- **CL-5**: Dos herramientas con reglas en conflicto (formato vs. calidad) → la configuración debe resolverse para que no se contradigan entre sí.
- **CL-6**: Commit realizado sin hooks (p. ej. con `--no-verify`) → el push actúa como segunda red de seguridad (formato, calidad y tests).
- **CL-7**: Fallo interno de una herramienta (crash o configuración rota) durante commit o push → el sistema deberá bloquear la integración (fail-closed) e informar del fallo de la herramienta.

## Fuera de alcance

- Cualquier funcionalidad del cronómetro Pomodoro (temporizador, fases, sesiones, notificaciones).
- CI/CD, integración continua y despliegue (decidido: fuera).
- Publicación, dominio, hosting y analítica.
- Internacionalización (la interfaz es solo en español).

## Criterios de finalización

1. Repo clonable e instalable con todas las verificaciones operativas (RN-2).
2. Hooks de git activos en `pre-commit` y `pre-push`: auto-formateo con bloqueo si persiste el problema, calidad que bloquea errores graves sin bloquear avisos, y tests antes del push (RF-1, RF-2, RF-3).
3. Fallo interno de una herramienta bloquea la integración, no la permite (CL-7).
4. Sistema de estilos base instalado y verificado con un build de producción correcto (RF-4).
5. Comandos de verificación (formato, calidad, tests, build) en verde, incluidos los tests existentes (RF-7, RN-5).
6. Constitución completa, convenciones con la excepción de dependencias, y memoria de proyecto presentes y actualizadas (RF-5, RF-6).
7. Todos los cambios integrados con mensajes conventional-commits (RN-6).

## Dudas abiertas

- Ninguna. Resueltas durante la redacción: alcance solo bases; hooks con auto-formateo y bloqueo si persiste; hooks en `pre-commit` y `pre-push`; avisos de calidad no bloquean; fallo de herramienta → fail-closed; tests ejecutándose en `pre-push`; sistema de estilos incluido en esta spec; ESLint incluido y bloqueando errores graves; CI/CD fuera de alcance; cobertura del 90% activa desde la primera spec con funcionalidad.
