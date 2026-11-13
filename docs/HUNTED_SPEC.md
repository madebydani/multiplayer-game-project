# HUNTED | Especificación y plan de trabajo para Claude Code

## 0. Objetivo y forma de trabajar

Desarrolla **HUNTED**, un videojuego **multijugador online en navegador**, 2D con cámara cenital (top-down), de persecución e infección. Un jugador empieza como monstruo; cada superviviente capturado se convierte en otro monstruo y continúa jugando. Los supervivientes intentan resistir hasta que termine el tiempo.

**Este documento describe el objetivo final, NO una orden para implementar todo en la primera respuesta.** Antes de programar, inspecciona el repositorio, comprueba las skills disponibles, analiza los requisitos académicos, identifica las decisiones pendientes y presenta un plan incremental. Espera mi aprobación antes de escribir código. Después, implementa **una fase por vez**, con una demostración y pruebas verificables, sin avanzar de fase sin autorización.

Si están disponibles, aplica `hypercasual-game-developer` y `game-development-journal`. No supongas que una skill se ha cargado si no puedes comprobarlo. No sobreescribas código existente ni descartes cambios de otras personas sin consultar. Usa mensajes concisos para ahorrar contexto sin omitir información importante.

## 1. Tecnologías y plataforma

- **Cliente:** HTML5, CSS3, JavaScript (sin TypeScript), Phaser 3 para juego 2D y colisiones.
- **Servidor:** Node.js, Express, Socket.IO; servidor autoritativo para el estado de partida.
- **Destino:** navegadores actuales en ordenador; soporte táctil para móviles y tabletas como fase posterior.
- **Persistencia:** no obligatoria; SQLite solo si sobra tiempo y se aprueba expresamente.
- **Sin login:** nombres visibles elegidos por jugadores e identificador de sesión asignado por el servidor.
- Arquitectura modular, clara y explicable por estudiantes de segundo de DAM. Evita complejidad innecesaria.

## 2. Requisitos académicos irrenunciables

1. Mínimo dos jugadores conectados desde **máquinas diferentes** a una misma partida.
2. Mapa **aleatorio por partida** y compartido de forma coherente.
3. Objetivo, reglas y condiciones de victoria claras.
4. Comunicación en tiempo real entre jugadores, con servidor que gestiona el resultado y lo comunica a todos.
5. Juego realmente ejecutable, con atención a estética, usabilidad y accesibilidad.
6. Documentación del trabajo con IA: herramientas, prompts importantes, decisiones, tecnologías investigadas, intentos fallidos, correcciones y pruebas reales.

El enunciado **no exige** registro de usuarios, base de datos, historial persistente ni endpoint HTTP propio si la gestión de resultados queda cubierta por un mecanismo adecuado. No añadas esos sistemas como obligatorios.

## 3. Reglas de HUNTED

- De **2 a 6 jugadores** por sala.
- El anfitrión inicia cuando hay al menos dos jugadores.
- Al empezar, el servidor elige al azar **un monstruo inicial**; el resto son supervivientes.
- Todos aparecen en puntos válidos y distintos del mapa.
- Duración configurada por anfitrión antes de empezar; valor por defecto **5 minutos**.
- Monstruos: ganan si **no queda ningún superviviente activo** antes del límite de tiempo.
- Supervivientes: ganan como **equipo** si el tiempo llega a cero y queda al menos uno activo. El resultado individual debe distinguir quién sobrevivió de quién fue transformado; aclara esta presentación en el plan.
- Cuando el servidor confirma una captura, el superviviente pasa a monstruo sin desconectarse, con cambio visual sincronizado.
- Tras transformarse, el nuevo monstruo tendrá un breve **periodo sin poder capturar** a otro jugador, para evitar capturas encadenadas accidentales. No se trata de protección frente a otros monstruos.
- Las capturas exigen contacto/proximidad según un **radio de captura configurable**; el servidor comprueba posiciones válidas, equipos y estado de partida, y evita duplicaciones.
- El cliente no puede decidir por sí solo capturas, roles, resultados ni efectos de objetos.

## 4. Salas y ciclo de vida

- Pantalla inicial con crear sala, unirse mediante código y ajustes básicos.
- En sala: código copiable, listado de jugadores, nombres, anfitrión, número de plazas y botón iniciar exclusivo del anfitrión.
- Máximo seis jugadores; no aceptar unirse a partidas en curso en el MVP.
- Salas aisladas entre sí; códigos únicos entre salas activas.
- Si el anfitrión sale antes de comenzar, reasigna anfitrión.
- **Regla inicial de desconexiones:** antes de comenzar, si el anfitrión sale, se reasigna; durante una partida, si alguien se desconecta, su personaje deja de participar y el servidor actualiza el estado. Si ya no queda ningún superviviente porque el último ha abandonado, finalizar por abandono (no registrar una captura ficticia). Si queda menos de dos jugadores conectados, finalizar por abandono y notificar el motivo. Proponer una política de reconexión sencilla antes de implementarla, sin bloquear el MVP.
- Al terminar: mostrar ganador, jugadores supervivientes y transformados, duración, opciones de volver al menú y crear otra sala/partida. Evitar temporizadores y salas huérfanas.

## 5. Mapa procedural y movimiento

- Mapa top-down mayor que la pantalla; cámara que sigue al jugador.
- Bosque oscuro y legible: suelo, caminos, árboles, rocas, arbustos y, en fases posteriores, cabañas y decoración.
- Obstáculos sólidos donde corresponda; no atravesar árboles, rocas ni edificios.
- Generación reproducible: **semilla y algoritmo compatibles**, o distribución validada generada por servidor y enviada a los clientes. No confiar únicamente en que compartir la semilla garantiza coincidencia si cliente y servidor generan distinto.
- Garantizar posiciones iniciales libres, ausencia de solapamientos y conectividad básica del mapa; validar que las rutas relevantes sean transitables.
- Movimiento fluido con WASD, colisiones 2D, cámara, reposo y dirección de marcha. El servidor valida velocidades y desplazamientos; interpolar visualmente a los jugadores remotos.
- **Controles por definir antes de las ampliaciones:** durante el MVP, WASD para mover; habilidades, sprint, interacción e inventario se asignarán en una tabla de controles aprobada antes de desarrollarlos. No dar dos acciones incompatibles a una misma tecla.
- Controles táctiles, joystick y escalado móvil serán posteriores al MVP; probarlos en dispositivos reales antes de afirmar compatibilidad.

## 6. Objetos y habilidades (ampliaciones, no bloqueantes del MVP)

El MVP **no requiere** ocho power-ups ni inventario completo. Cuando el núcleo funcione, planifica su incorporación gradual:

- Supervivientes: botas (velocidad), energía (sprint), humo (ocultación), señuelo (distracción), invisibilidad temporal.
- Monstruos: velocidad, rastreo aproximado, radar temporal.
- Habilidades propias: monstruo con sprint/rastreo; superviviente con sprint/señuelo.
- Objetos sincronizados: recogida autorizada por servidor, desaparición para todos, duración y reutilización controladas.
- Inventario máximo de dos objetos, cuando se implemente; proponer controles claros de teclado y táctiles. Evitar duplicidad confusa entre power-ups y habilidades (p. ej., sprint y botas, rastreo y radar).
- Antes de implementar cada habilidad, documentar efecto, duración, recarga, límites y cómo se muestra a cada jugador. Evitar ventajas desproporcionadas.

## 7. Diseño visual y arte: reparto de responsabilidades

**Claude Code NO es el generador de las ilustraciones finales.**

- Claude Code se ocupa del **código, diseño funcional de UI, animación con recursos existentes e integración de assets**.
- Para las primeras fases usa **placeholders sencillos** (círculos, rectángulos o siluetas con colores y formas claramente diferenciados; obstáculos y suelo con figuras básicas), sin dedicar tiempo a crear ilustraciones definitivas, sprites complejos o buscar paquetes de arte por su cuenta. Los placeholders deben permitir probar colisiones, movimiento, lectura del mapa y diferenciación de roles.
- La dirección artística y los recursos visuales finales se trabajarán aparte con **ChatGPT y herramientas de generación de imágenes**, bajo revisión del equipo humano.
- Cuando haga falta un asset, añadirlo a `docs/ASSET_LIST.md` con nombre de archivo, propósito, dimensiones propuestas, transparencia, perspectiva, animaciones/fotogramas necesarios y estado `pendiente / recibido / integrado / probado`.
- Mantén `docs/ART_STYLE.md` con: bosque misterioso pero agradable, estética 2D ilustrada plana, sombras suaves, personajes reconocibles y contraste suficiente. No inventes un estilo definitivo sin consultarme.
- Recursos en `client/assets/characters/`, `environment/`, `items/`, `ui/`, `audio/` (o equivalente coherente).
- Una vez suministrados los PNG/spritesheets, intégralos manteniendo escala, colisiones, punto de anclaje y rendimiento. No presentes placeholders como arte final.
- Audio y efectos sonoros: etapa de pulido, con recursos originales o licencias verificadas.

## 8. Interfaz y accesibilidad

- **Menú:** HUNTED, jugar/crear/unirse, ajustes, créditos.
- **Sala:** código, copiar, jugadores, anfitrión, plazas, iniciar/salir.
- **Partida:** roles distinguibles por forma e icono además de color, temporizador, supervivientes restantes, indicadores de conexión; inventario y habilidades cuando existan.
- **Fin:** ganador, supervivientes, transformados, tiempo, volver al menú/revancha según se implemente.
- Controles y texto legibles, buen contraste, volumen regulable y posibilidad de reducir animaciones.
- Móviles/tabletas: fase avanzada con interfaz táctil, controles grandes, orientación horizontal y pruebas en pantallas reales. No afirmar que el juego funciona en iOS/Android sin comprobarlo.

## 9. Red, robustez y pruebas

- Diseña eventos Socket.IO coherentes y valida entradas, identidad de conexión, pertenencia a sala y estado de partida.
- El servidor mantiene estado de posiciones, roles, transformaciones, temporizador, objetos y victorias. Los clientes dibujan el estado recibido.
- Reduce mensajes redundantes; evita que una sala modifique otra.
- Evita capturas duplicadas, velocidades imposibles, teletransportes, manipulación de roles y procesos activos después de finalizar.
- Maneja desconexiones, limpieza de timers y errores de red.
- Incluye un mecanismo del servidor para comunicar el **resultado** a todos los jugadores. Puede ser el evento `gameEnded`; un endpoint HTTP adicional no es obligatorio salvo necesidad concreta.
- Tras cada fase, ejecuta las comprobaciones posibles y distingue: `comprobado automáticamente`, `comprobado manualmente` y `pendiente de verificar`.
- **Prueba fundamental:** dos navegadores independientes y, antes de la entrega, dos ordenadores distintos en una red o despliegue accesible. No confundas dos pestañas en una máquina con esa prueba final.

## 10. Documentación académica y colaboración

- Mantén un README práctico (requisitos, instalación, ejecución, reglas, arquitectura y multijugador).
- Mantén `docs/REQUIREMENTS.md` con `pendiente / implementado / probado` para cada exigencia académica.
- Mantén `docs/DEVELOPMENT_LOG.md` breve: fecha/hito, herramientas de IA usadas, petición/prompt relevante (cita literal solo cuando esté disponible), decisiones, alternativas investigadas por personas, problemas, reformulaciones, pruebas y resultado real.
- No inventes prompts, respuestas de IA ni pruebas; sugiere exportar las conversaciones para conservar evidencia literal.
- Registra también la generación externa de imágenes con ChatGPT cuando se incorporen assets: objetivos, iteraciones, criterios humanos y archivos finales.
- Haz que los avances sean comprensibles para una exposición de segundo de DAM, pero no generes extensas redacciones después de cada cambio.
- Trabajamos dos compañeros: no sobrescribas ni hagas push de cambios ajenos sin revisarlos. Pregunta antes de operaciones destructivas.

## 11. Fases y condiciones de aceptación

1. **Planificación:** arquitectura mínima, decisiones pendientes, mapa de requisitos y riesgos. **Sin código** hasta mi aprobación.
2. **Prototipo local:** cliente Phaser, mapa sencillo, un personaje, cámara y colisiones. Demostrar movimiento y ejecución.
3. **Salas y red:** crear/unirse, dos clientes, anfitrión, identidad y sincronización básica. Demostrar partida conjunta.
4. **Núcleo de infección:** roles, captura validada en servidor, transformación, temporizador y resultado. Demostrar partida completa con dos clientes.
5. **Mapa procedural:** generación aleatoria sincronizada, colisiones y posiciones válidas; comprobar que nadie queda atrapado.
6. **Arte e interfaz:** integración de assets proporcionados externamente y pulido de menús/HUD/efectos.
7. **Mejoras opcionales:** power-ups, habilidades, inventario, versión móvil y accesibilidad avanzada, de manera incremental.
8. **Entrega:** pruebas desde dos máquinas, estabilidad, README, diario y material para presentación.

Para cada fase: indica brevemente archivos afectados, comportamiento implementado, pruebas ejecutadas, limitaciones y siguiente paso. Si no has podido ejecutar una prueba, dilo expresamente. Conserva funcionalidades ya estables y no hagas grandes refactorizaciones sin justificar su necesidad.

## 12. Límites del primer encargo y eficiencia

- El prompt es la **especificación de alcance final**, no un encargo de completarlo en una única ejecución. No prometas que todo está terminado hasta que existan pruebas.
- En el primer intercambio, no escribas archivos, instales dependencias, generes imágenes ni ejecutes comandos que modifiquen el repositorio. Solo inspecciona lo necesario para proponer el plan.
- No repitas íntegramente esta especificación en cada respuesta: cita el apartado que guía la tarea. Minimiza relecturas, evita reescribir archivos enteros cuando baste un cambio localizado y no amplíes el alcance sin aprobación.
- El primer objetivo jugable es **dos navegadores, una sala, movimiento sincronizado, infección y victoria**. El resto, incluido el móvil, se incorporará más adelante según prioridad.

## 13. Primera respuesta solicitada

**No implementes el juego ahora.** Primero:

1. Resume la arquitectura propuesta y justifica brevemente las tecnologías ya seleccionadas.
2. Identifica un máximo de cinco decisiones de diseño verdaderamente bloqueantes (por ejemplo: radio de captura, duración del bloqueo de captura tras transformación y futuros controles). Usa las reglas de desconexión propuestas en este documento salvo que detectes un problema técnico concreto.
3. Presenta las fases y los criterios para considerarlas terminadas.
4. Confirma el reparto de trabajo: Claude Code hace código e integra sprites; ChatGPT genera los recursos gráficos finales.
5. Indica qué archivos de documentación iniciarás cuando autorice la fase 1.

Espera mi aprobación antes de modificar archivos.
