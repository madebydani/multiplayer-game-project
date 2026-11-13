# Diario de desarrollo

### 2026-11-13 — Fase 1: planificación
- Objetivo: analizar la especificación de HUNTED, proponer arquitectura y plan por fases antes de programar.
- Herramienta: Claude Code (sesión en la nube). Skill `game-development-journal` cargada; la skill `hypercasual-game-developer` **no estaba disponible** en la sesión, así que no se aplicó.
- Prompts: especificación completa guardada literal en `docs/HUNTED_SPEC.md`; resto en `PROMPT_EVIDENCE.md`.
- Propuesta de la IA: servidor autoritativo por entradas, código compartido en `shared/`, mapa validado en servidor, 8 fases con criterios de aceptación.
- La IA detectó un hueco en las reglas (desconexión del único monstruo) y lo planteó como decisión.
- Decisiones del usuario mediante preguntas de opción múltiple: velocidades 200/210 px/s y captura 40 px; bloqueos 3 s + 5 s; nuevo monstruo al azar; prueba en LAN (ver `DECISIONS.md`).
- Archivos creados: `README.md`, `.gitignore`, `docs/*.md`, carpetas vacías `client/assets/*`.
- Pruebas: ninguna (fase sin código).
- Siguiente: fase 2, prototipo local, pendiente de autorización.

### 2026-11-13 — Fase 2: prototipo local
- Objetivo: cliente Phaser con mapa fijo, un personaje, cámara y colisiones (prompt literal: «Si», aprobando la fase).
- Herramienta: Claude Code (sesión en la nube).
- Creado: `package.json`, `server/index.js` (Express estático), `shared/config.js`, `shared/collision.js`, `shared/testMap.js`, `client/index.html`, `client/css/style.css`, `client/js/main.js`, `client/js/scenes/GameScene.js`, `test/collision.test.js`.
- Decisiones: colisiones propias compartidas en vez de Arcade Physics (D11); versiones fijadas (D13).
- Incidencias y correcciones:
  1. `npm test` fallaba porque `node --test test/` no acepta una carpeta en Node 22 → script cambiado a `node --test`.
  2. La prueba en navegador mostró 90 px/s en lugar de 200 a ~28 FPS por el `smoothStep` de Phaser → desactivado (D12); medido después: ~203 px/s.
  3. Nueva prueba automática detectó una roca solapada con un árbol y un árbol oculto bajo la cabaña → el mapa descarta árboles que chocan con obstáculos fijos.
- Comprobado automáticamente: 8 pruebas `node:test` pasan (colisiones, límites, spawn libre, sin solapamientos); Playwright/Chromium sin errores de consola: movimiento con WASD y flechas, cámara sigue al jugador, bloqueo en la cabaña en x = 1364 (borde − radio), límite izquierdo en x = 16.
- Comprobado manualmente: no (pendiente que el equipo lo pruebe en su navegador).
- Evidencia: `docs/evidence/fase2-inicio.png`, `docs/evidence/fase2-cabana.png`.
- Siguiente: fase 3, salas y red.

### 2026-11-13 — Fase 3: salas y red
- Objetivo: crear/unirse con código, anfitrión, sincronización entre dos clientes (prompt literal: «Si»).
- Herramienta: Claude Code (sesión en la nube).
- Creado: `shared/events.js`, `shared/movement.js`, `server/rooms.js`, `server/match.js`, `client/js/net.js`, `test/rooms.test.js`, `test/match.test.js`, `test/network.test.js`, `test/e2e/two-browsers.cjs`. Modificado: `server/index.js`, `client/index.html`, `client/css/style.css`, `client/js/main.js`, `client/js/scenes/GameScene.js`, `shared/config.js`.
- Decisiones: D14–D17 (pasos fijos con reconciliación, límite de entradas, menú en HTML, códigos sin ambigüedad).
- Desconexión en partida: si quedan menos de 2 jugadores, fin por «abandono», bucle detenido y vuelta a la sala; sala vacía se elimina.
- Incidencias:
  1. La IA escribió una prueba que comparaba un valor consigo mismo (siempre pasaba); detectado al revisar y corregido para medir velocidad × tick.
  2. Prueba de red suponía camino libre; el jugador chocaba con un árbol (80 px en vez de 100). Se cambió por una comprobación más útil: servidor == predicción del cliente.
  3. Esa prueba falló (20 px de diferencia): enviaba 10 entradas de golpe y el límite anti-trampas descartó 2. Comportamiento correcto; la prueba se ajustó al ritmo real (D15).
  4. `npm test` intentaba ejecutar también el script de Playwright de `test/e2e/` → patrón limitado a `test/*.test.js`.
- Comprobado automáticamente: 24 pruebas `node:test` pasan (salas, entradas, anti speed hack, colisiones en servidor, bucle detenido, 2 clientes Socket.IO reales, salas aisladas). Playwright: 2 contextos de Chromium independientes crean/unen sala, solo el anfitrión ve «Empezar», ambos se mueven a la vez y ven las mismas posiciones; al salir uno, el otro vuelve a la sala con aviso de abandono; sin errores de consola.
- Pendiente de verificar: dos ordenadores reales en LAN; comportamiento con latencia real de red; botón «Copiar código» (el navegador de pruebas no tiene portapapeles).
- Evidencia: `docs/evidence/fase3-*.png`.
- Siguiente: fase 4, núcleo de infección.

### 2026-11-13 — Fase 4: núcleo de infección
- Objetivo: roles, captura validada en servidor, transformación, temporizador, victoria, resultados y desconexiones (prompt literal: «Si»).
- Herramienta: Claude Code (sesión en la nube).
- Modificado: `server/match.js` (roles, capturas, bloqueos, fin de partida, desconexiones), `server/rooms.js` (duración), `server/index.js` (resultado a toda la sala), `shared/movement.js` (velocidad por rol, congelación), `shared/events.js`, `client/index.html`, `client/css/style.css`, `client/js/main.js` (HUD, avisos, resultados), `client/js/scenes/GameScene.js` (formas por rol, efecto de transformación que respeta «reducir movimiento»), pruebas.
- Decisiones: D18–D21 (tiempo en ticks, abandono sin ganador, revancha en la misma sala, captura múltiple sin encadenamiento).
- Incidencias:
  1. Revisando el código, la IA detectó que los avisos generados entre ticks (p. ej. «nuevo monstruo» al desconectarse) se borraban antes de enviarse. Corregido antes de probar.
  2. Tres pruebas antiguas fallaban de forma intermitente: el monstruo se elige al azar y, si tocaba al jugador que se movía, estaba congelado. Se fijó el azar en esas pruebas (3 ejecuciones seguidas sin fallos).
  3. La prueba de navegador antigua esperaba volver a la sala tras un abandono; ahora se muestran resultados. Reescrita para una partida completa.
  4. El tiempo de transformación se redondeaba hacia arriba («0:06» en vez de «0:05»). Corregido: cuenta atrás hacia arriba, tiempo transcurrido hacia abajo.
- Comprobado automáticamente: 36 pruebas `node:test` (11 nuevas de reglas: monstruo inicial único, congelación 5 s, radio exacto 40 px, bloqueo 3 s, victorias por captura y por tiempo, una sola llamada de fin, los 3 casos de desconexión; partida completa por red con duración elegida). Playwright con 2 navegadores: duración elegida por el anfitrión y vista por el invitado; el monstruo no se mueve congelado; persecución y captura reales; resultados correctos; revancha; abandono; sin errores de consola.
- Pendiente de verificar: partida de 3+ jugadores en navegadores (cubierta solo por pruebas de servidor); victoria por tiempo en navegador (cubierta por prueba de red); equilibrio real de velocidades; dos ordenadores en LAN.
- Evidencia: `docs/evidence/fase4-*.png`.
- Siguiente: fase 5, mapa procedural.

### 2026-11-13 — Fase 5: mapa procedural
- Objetivo: bosque aleatorio por partida, sincronizado, sin solapamientos y sin nadie atrapado (prompt literal: «Si»).
- Herramienta: Claude Code (sesión en la nube).
- Creado: `server/mapgen.js`, `test/mapgen.test.js`. Modificado: `server/index.js` (mapa nuevo por partida con `crypto.randomInt`), `server/match.js` (usa los puntos de aparición del mapa), `client/js/scenes/GameScene.js` (dibuja caminos, arbustos y cabañas), `test/network.test.js`, `test/e2e/two-browsers.cjs`.
- Diseño: semilla → caminos → cabañas, rocas y árboles con hueco mínimo → 6 puntos de aparición → validación por BFS → reintento con la semilla siguiente si falla. Se envía la lista final de obstáculos (D3).
- Incidencias:
  1. Con hueco de 36 px, el 92 % de los mapas fallaba la validación (falsos aislamientos por la rejilla). Se midieron 48/52/56 px y se eligió 52 (D22).
  2. Con el mapa nuevo, la prueba de navegador ya no podía capturar yendo en línea recta: se programó una persecución que esquiva obstáculos (captura en 4–10 s en las ejecuciones).
  3. La comprobación «la revancha usa otro mapa» dio falso: la prueba leía el juego anterior, ya destruido. Corregida esperando a la escena nueva; después, un error de la IA en la condición de espera (acceso a `null`), también corregido.
- Comprobado automáticamente: 42 pruebas `node:test`, entre ellas 200 semillas validadas con comprobaciones independientes (sin obstáculos demasiado juntos, spawns libres, todo el terreno alcanzable desde cada spawn, caminos despejados), reproducibilidad por semilla y detección de una zona encerrada artificial. Playwright: los dos navegadores reciben un mapa idéntico, la revancha genera otro distinto (también idéntico en ambos), persecución y captura reales, sin errores.
- Pendiente de verificar: sensación de juego en el bosque (densidad, tamaño) con jugadores reales; dos ordenadores en LAN.
- Evidencia: `docs/evidence/fase5-tres-mapas.png` (3 semillas), `docs/evidence/fase5-mapa-A.png`.
- Siguiente: fase 6, arte e interfaz (requiere los assets de ChatGPT).

### 2026-11-13 — Fase 6 (inicio): especificación de arte
- Objetivo: preparar lo necesario para generar el arte con ChatGPT. El usuario eligió la opción A (prompt literal: «La A»).
- Herramienta: Claude Code (sesión en la nube). No se ha generado ninguna imagen.
- Creado/actualizado: `docs/ART_STYLE.md` (propuesta de estilo, paleta, escala, animación), `docs/ASSET_LIST.md` (16 recursos en 3 prioridades, con tamaño, transparencia, vista, anclaje, estado y borrador de prompt para cada uno; tabla de registro para documentar la generación).
- Decisión: D25 (propuesta pendiente de aprobación).
- Pruebas: no aplica (solo documentación).
- Siguiente: el equipo revisa la propuesta y genera los recursos de prioridad 1; mientras, se puede hacer la opción B (interfaz sin arte).

### 2026-11-13 — Fase 6: estilo aprobado por el equipo
- Respuesta del usuario (literal): «1. Vista desde arriba. 2. Si. 3. La que recomiendas».
- Cambio respecto a la propuesta: vista cenital pura con rotación del sprite en lugar de 3/4 con volteo.
- Ajustes derivados: prompts de personajes reescritos para vista desde justo encima, sin sombra en los personajes (la añade el código), anclaje en el centro del lienzo para rotar, se eliminan los fotogramas opcionales; aviso para comprobar la legibilidad a 64 px.
- Archivos: `docs/ART_STYLE.md` (aprobado), `docs/ASSET_LIST.md`, `docs/DECISIONS.md` (D25).
- Siguiente: el equipo genera los recursos; Claude Code espera autorización para preparar la carga de imágenes y la opción B.

### 2026-11-13 — Fase 6: integración de arte preparada e interfaz (opción B)
- Objetivo: preparar la carga del arte mientras el equipo lo genera con ChatGPT, y hacer la interfaz que no depende de él (prompt literal: «Si, ves haciendo y le pido a chatgpt que las vaya creando.»).
- Herramienta: Claude Code (sesión en la nube).
- Creado: `client/js/assets.js`, `client/js/settings.js`, `client/js/sound.js`, `test/e2e/ui.cjs`. Modificado: `server/index.js` (`/assets-manifest.json`, ping), `shared/events.js`, `client/index.html` (ajustes, créditos, logo, indicador de red), `client/css/style.css`, `client/js/main.js`, `client/js/scenes/GameScene.js` (imágenes con respaldo, rotación en 8 direcciones, sombra, anillo de color, balanceo, minimapa), `test/network.test.js`.
- Decisiones: D26–D30.
- Incidencias:
  1. Con imágenes, el anillo de color del jugador quedaba oculto bajo el dibujo (tenía el tamaño del placeholder). Visto en la captura y corregido.
  2. La latencia medida en local fue de 50–130 ms. Probable causa: el entorno de pruebas sin GPU, con dos navegadores a ~25 FPS. Pendiente de medir en un ordenador normal.
  3. Una lectura de ángulo «hacia abajo» tras pulsar D resultó ser del monstruo congelado (comportamiento correcto).
- Comprobado automáticamente: 44 pruebas `node:test` (nuevas: lista de imágenes y ping). Playwright sin imágenes: ajustes que persisten al recargar, créditos, minimapa y tecla M, indicador de conexión, limpieza al terminar, partida completa. Playwright con 5 imágenes de PRUEBA dibujadas por código (luego borradas): se usan las existentes y placeholders para las demás, rotación correcta, iconos en HUD y resultados, el servidor detecta imágenes nuevas sin reiniciar. Sin errores de consola.
- No comprobado: que los sonidos se oigan bien (el navegador de pruebas no tiene salida de audio); arte real (aún no recibido); nombres del equipo en créditos (pendiente).
- Evidencia: `docs/evidence/fase6-ajustes.png`, `fase6-partida-placeholders.png`, `fase6-imagenes-prueba.png` (imágenes de prueba, no arte final).

### 2026-11-13 — Fase 6: arte generado por Claude Code
- Petición (literal): «Quiero que cuando acabes todos los placeholders y tengas listo todo, generes tu las imágenes porque ChatGPT no sabe interpretar bien las peticiones.»
- Cambio de reparto respecto a la especificación (§7): ver D31. La IA aclaró que no tiene un generador de imágenes y que dibujaría con código vectorial.
- Herramienta: Claude Code (sesión en la nube); SVG escrito a mano en `tools/art/build-art.cjs`, convertido a PNG con Chromium (Playwright).
- Creado: 14 PNG en `client/assets/` (personajes, 3 árboles, 2 rocas, 2 arbustos, cabaña, suelo, logo, 2 iconos) y sus SVG en `tools/art/svg/`.
- Iteraciones y fallos:
  1. Hoja de revisión: el superviviente parecía una diana u ojo (anillos concéntricos) y la cara no se veía. Redibujado.
  2. Los ojos del logo parecían una diéresis sobre la D; las garras quedaban entre la U y la N. Corregido.
  3. La partida con arte reveló dos fallos de interfaz ANTERIORES al arte: el HUD tapaba al jugador en el borde superior del mapa (se añadió margen a la cámara) y el botón «Unirse» se salía del panel del menú (desde la fase 3; no se vio en las capturas de entonces). Corregidos.
  4. La cabaña ocupa todo su rectángulo de colisión, así que su sombra se dibuja por código.
- Comprobado automáticamente: 44 pruebas `node:test`; `test/e2e/two-browsers.cjs` y `test/e2e/ui.cjs` con el arte integrado, sin errores de consola.
- Comprobado visualmente por la IA (capturas): legibilidad de los personajes a 64 px y 96 px, giro en partida, menú, partida y resultados.
- Pendiente: revisión y aprobación del arte por el equipo; nombres para Créditos.
- Evidencia: `docs/evidence/fase6-arte-hoja.png`, `fase6-arte-partida.png`, `fase6-arte-menu.png`, `fase6-arte-resultados.png`.
