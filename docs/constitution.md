# Constitución del proyecto simple-pomodoro-gbdevs

Reglas innegociables. Si una decisión las incumple, esa decisión está mal.

1. **Stack mínimo**: La aplicación se construye con Angular (v22) + Typescript, Tailwind CSS (v4.3) y Vite. Se debe siempre intentar realizar todo el desarrollo sin dependencias externas a Angular. Si existiera alguna limitación o se considera que alguna dependencia puede mejorar o ahorrar tiempo en una funcionalidad en concreto se indicará para decidir sobre ello.
2. **Spec antes que código**: cada funcionalidad se escribe primero en `specs/NNN/spec.md`. O el código cumple el spec, o se actualiza el spec.
3. **Lógica separada de la interfaz**: la lógica de la aplicación debe estar separada de los controladores de la vista de la aplicación, así como las llamadas externas si las hubiera.
4. **Tests**: la lógica y los componentes deben tener las pruebas necesarias para cubrir toda la cobertura posible, mínimo un 90%. Los ficheros de tests deben ir separados por funcionalidades o ficheros a probar. No se deben crear métodos de tests innecesarios.
5. **Idioma**: variables, funciones, comentarios deben ir en inglés. Los textos de la interfaz y specs deben ir en castellano.

Si dos reglas chocan, manda la 1.
