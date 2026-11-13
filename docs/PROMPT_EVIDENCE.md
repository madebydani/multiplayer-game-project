# Evidencia de prompts

Los prompts del usuario se citan literalmente cuando son visibles en la sesión. Las respuestas de Claude se resumen (marcado *paráfrasis*). Para evidencia completa, exportar la conversación de Claude Code.

## 2026-11-13 — Sesión de planificación (Claude Code)

**Prompt 1 (literal):**
> /hypercasual-game-developer
>
> Quiero desarrollar HUNTED utilizando esta skill como guía principal y game-development-journal para documentar todo el proceso.
>
> Voy a proporcionarte el prompt completo del videojuego.
>
> Antes de comenzar, confirma que puedes acceder a ambas skills y que seguirás sus instrucciones durante el desarrollo.
>
> No programes todavía.

**Respuesta (paráfrasis):** confirma que `game-development-journal` está disponible y explica cómo la aplicará; informa de que `hypercasual-game-developer` no está instalada en la sesión y no se ejecutó; ofrece instalarla o pegar su contenido.

**Prompt 2:** archivo adjunto con la especificación completa → copia literal en `docs/HUNTED_SPEC.md`.

**Respuesta (paráfrasis):** arquitectura (Express + Socket.IO autoritativo, Phaser, `shared/`), cinco decisiones bloqueantes con propuestas, tabla de 8 fases con criterios de terminación, confirmación del reparto Claude Code / ChatGPT y lista de documentos a crear.

**Prompt 3 (literal):**
> Si tienes dudas me puedes preguntar

**Respuesta (paráfrasis):** Claude formula 4 preguntas de opción múltiple (desconexión del monstruo, velocidades, tiempos de protección, prueba en dos PC). Respuestas del usuario: opciones recomendadas en las cuatro. Claude pregunta si guardar la especificación en el repositorio.

**Prompt 4 (literal):**
> Si

**Respuesta (paráfrasis):** inicio de la fase 1: creación de documentación base y estructura de carpetas.

**Prompt 5 (literal), aprobando la fase 2:**
> Si

**Respuesta (paráfrasis):** implementa el prototipo local, ejecuta pruebas, detecta y corrige tres problemas (script de test, velocidad dependiente de FPS, obstáculos solapados) y documenta.
