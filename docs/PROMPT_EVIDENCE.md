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

**Prompt 6 (literal), aprobando la fase 3:**
> Si

**Respuesta (paráfrasis):** implementa salas y red con servidor autoritativo, predicción e interpolación; corrige una prueba mal escrita por la propia IA y ajusta otras dos tras analizar sus fallos; verifica con dos navegadores independientes.

**Prompt 7 (literal), aprobando la fase 4:**
> Si

**Respuesta (paráfrasis):** implementa el núcleo de infección con reglas en el servidor, HUD y pantalla de resultados; añade 11 pruebas de reglas; corrige una pérdida de avisos, pruebas intermitentes por azar y un redondeo; verifica una partida completa con dos navegadores.

**Prompt 8 (literal), aprobando la fase 5:**
> Si

**Respuesta (paráfrasis):** implementa el generador procedural en el servidor con validación por BFS; mide el porcentaje de mapas válidos con distintos huecos mínimos y elige 52 px; añade pruebas con 200 semillas; corrige dos errores en la prueba de navegador; genera una imagen con tres mapas como evidencia.

**Respuesta de Claude tras la fase 5 (paráfrasis):** propone dos caminos para la fase 6: A) especificar el arte primero o B) pulir la interfaz sin arte; recomienda A.

**Prompt 9 (literal):**
> La A

**Respuesta (paráfrasis):** redacta la propuesta de estilo y la lista de recursos con prompts para ChatGPT, marcadas como pendientes de aprobación.

**Prompt 10 (literal), respuesta a las tres preguntas de estilo:**
> 1. Vista desde arriba.
> 2. Si.
> 3. La que recomiendas

**Respuesta (paráfrasis):** marca el estilo como aprobado y reescribe los prompts para vista cenital pura; señala que los personajes no deben llevar sombra dibujada porque el sprite rotará.

**Prompt 11 (literal):**
> Si, ves haciendo y le pido a chatgpt que las vaya creando.

**Respuesta (paráfrasis):** prepara la carga de imágenes con respaldo a placeholders, rotación y efectos por código, ajustes, créditos, minimapa, indicador de conexión y sonidos sintetizados; lo verifica con imágenes de prueba temporales.

**Prompt 12 (literal):**
> Quiero que cuando acabes todos los placeholders y tengas listo todo, generes tu las imágenes porque ChatGPT no sabe interpretar bien las peticiones.

**Respuesta (paráfrasis):** acepta el cambio de reparto y aclara que no tiene un generador de imágenes, sino que dibujará con código SVG. Genera 14 recursos, los revisa en una hoja de contactos, redibuja el superviviente y retoca el logo; al probarlos en partida detecta y corrige dos fallos de interfaz anteriores.

**Prompt 13 (literal):**
> De momento dejamos esos bocetos, pero con opción a cambiarlo vale? Intentaré acabarlos con ChatGPT, pero ahora me está dando problemas. Puede seguir con lo demás por ahora.

**Respuesta (paráfrasis):** marca el arte como provisional, protege las futuras imágenes del equipo frente a sobrescrituras y propone el diseño de la fase 7 para su aprobación.

**Respuestas del usuario al diseño de la fase 7** (preguntas de opción múltiple formuladas por Claude): sprint y habilidades «Sí, tal cual»; objetos «Los 5 objetos»; orden «Mejoras por partes».
