# Spec 007 — Publicación en GitHub Pages

Estado: borrador

## 1. Contexto y objetivo

La aplicación solo se ejecuta hoy en local (`npm start`). El usuario quiere una URL pública para usarla sin instalar nada y que cada cambio integrado en `master` se publique solo.

**Objetivo**: publicar la web en GitHub Pages mediante una GitHub Action, en `https://josemiguel92.github.io/simple-pomodoro/`, sin pasos manuales de build ni de subida.

El repositorio `JoseMiguel92/simple-pomodoro` es público y no tiene dominio propio. Al ser un site de proyecto, GitHub Pages sirve la web bajo el subpath `/simple-pomodoro/`, no bajo la raíz.

## 2. Usuarios

- **Usuario final**: persona que usa la app para concentrarse (el mismo de la 002), ahora desde una URL pública.
- **Mantenedor**: persona que integra cambios en `master` y espera que se publiquen solos.

## 3. Historias de usuario

- **HU-1**: Como usuario, quiero abrir la app en una URL pública para usarla desde cualquier dispositivo sin instalar nada.
- **HU-2**: Como mantenedor, quiero que cada push a `master` publique la versión nueva para no desplegar a mano.

## 4. Requisitos funcionales

**RF-1 — Publicación automática**

El sistema deberá construir y publicar la web en GitHub Pages al integrar cambios en la rama por defecto.

- CA-1.1: CUANDO se haga push a `master`, EL SISTEMA DEBERÁ construir y publicar la web en GitHub Pages.
- CA-1.2: La publicación no deberá requerir pasos manuales distintos de la configuración inicial de Pages en el repositorio.
- CA-1.3: SI el build falla, ENTONCES EL SISTEMA DEBERÁ fallar el workflow y no publicar nada.

**RF-2 — Funcionamiento bajo el subpath**

La web publicada deberá funcionar completa bajo `https://josemiguel92.github.io/simple-pomodoro/`.

- CA-2.1: Al abrir la URL publicada, EL SISTEMA DEBERÁ cargar la aplicación completa (HTML, JS, CSS y favicon) sin errores 404 de assets.
- CA-2.2: Las rutas de los assets generados deberán resolverse bajo `/simple-pomodoro/`.
- CA-2.3: El servidor de desarrollo local (`npm start` en `http://localhost:4200/`) deberá seguir funcionando sin cambios.

**RF-3 — Verificación antes de publicar**

El sistema deberá impedir la publicación de código que no supere la verificación del proyecto.

- CA-3.1: El workflow DEBERÁ ejecutar formato, lint y tests antes del build de publicación.
- CA-3.2: SI la verificación falla, ENTONCES EL SISTEMA DEBERÁ fallar el workflow y no publicar nada.

**RF-4 — Reproducibilidad y mínimo stack**

El build de publicación deberá ser reproducible y no añadir dependencias a la aplicación.

- CA-4.1: La instalación de dependencias en CI DEBERÁ usar el lockfile (`npm ci`) con una versión de Node fijada.
- CA-4.2: El workflow DEBERÁ usar únicamente acciones oficiales de GitHub; no se añadirán dependencias npm nuevas.

**RF-5 — Documentación**

La publicación deberá quedar documentada en el proyecto.

- CA-5.1: La URL publicada, el comando de build de Pages y el requisito de configurar Pages con origen «GitHub Actions» deberán estar en `README.md` y `AGENTS.md`.

## 5. Requisitos no funcionales

- **RNF-1 — Stack mínimo**: no se añaden dependencias ni frameworks; solo acciones oficiales de GitHub.
- **RNF-2 — Sin cambios en la app**: esta spec no altera la lógica ni la interfaz; solo el empaquetado y la publicación.
- **RNF-3 — Sin secretos nuevos**: el despliegue usa el token efímero de GitHub (`GITHUB_TOKEN`).
- **RNF-4 — Idioma**: spec y textos de interfaz en castellano; configuración y código en inglés.

## 6. Casos límite

- **CL-1**: Pages deshabilitado en el repositorio → el job de deploy falla; se activa _Settings → Pages → Source: GitHub Actions_ y se re-ejecuta el workflow.
- **CL-2**: Repositorio privado sin plan que incluya Pages → no se puede publicar; queda documentado como requisito del repositorio.
- **CL-3**: Varios pushes seguidos → el grupo de concurrencia `pages` evita publicaciones solapadas.
- **CL-4**: Primer push que añade el workflow → también construye y publica.
- **CL-5**: Dominio propio en el futuro → la web pasaría a servirse en la raíz y habría que cambiar el base href; fuera de alcance.
- **CL-6**: Rutas profundas (F5 en una URL interna) → hoy no hay rutas; si se añaden, hará falta un fallback tipo `404.html`.
- **CL-7**: Estado guardado en el navegador (consentimiento y paleta) → no se hereda entre orígenes; en la URL publicada se verá el aviso de cookies la primera vez.

## 7. Fuera de alcance

- Dominio propio, certificados personalizados y despliegues de preview por pull request.
- Cambios de lógica, interfaz o estilos de la aplicación.
- Tests automáticos del despliegue en sí (el deploy solo se verifica tras el merge).

## 8. Criterios de finalización

1. El workflow es válido, está en `master` y publica tras cada push (RF-1).
2. La URL publicada carga la app y todos sus assets sin 404 (RF-2).
3. El workflow ejecuta formato, lint y tests antes de publicar (RF-3).
4. El build de CI es reproducible y usa solo acciones oficiales (RF-4).
5. `README.md` y `AGENTS.md` documentan URL, comando y requisito de Pages (RF-5).
6. `npm run verify` y `npm run build:pages` en verde; sin cambios en la app (RNF-2).

## 9. Dudas abiertas

- Ninguna: rama, URL y alcance decididos en el plan.
