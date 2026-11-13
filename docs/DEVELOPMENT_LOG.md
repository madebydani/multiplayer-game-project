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

### 2026-11-13 — Arte aceptado como bocetos provisionales
- Respuesta del usuario (literal): «De momento dejamos esos bocetos, pero con opción a cambiarlo vale? Intentaré acabarlos con ChatGPT, pero ahora me está dando problemas. Puede seguir con lo demás por ahora.»
- Cambio: `tools/art/build-art.cjs` ya no sobrescribe PNG existentes salvo con `--force`, para no borrar el arte que el equipo traiga de ChatGPT. Comprobado: sin `--force` no modifica ningún archivo.
- Documentado en README, `ASSET_LIST.md` y D31.

### 2026-11-13 — Fase 7a: sprint
- Diseño de toda la fase 7 aprobado por el equipo sin cambios (3 preguntas de opción múltiple: «Sí, tal cual», «Los 5 objetos», «Mejoras por partes»). Documentado en `docs/GAMEPLAY.md` antes de programar, como pide §6.
- Herramienta: Claude Code (sesión en la nube).
- Modificado: `shared/config.js`, `shared/movement.js` (energía de sprint compartida), `server/match.js` (validación de `s`, energía en el estado), `shared/events.js`, `client/js/scenes/GameScene.js` (Shift, predicción, balanceo más rápido), `client/js/main.js` y `client/index.html`/`style.css` (barra de energía con texto), `test/match.test.js`.
- Decisiones: D32, D33.
- Incidencia evitada: la IA vio, antes de probarlo, que redondear la energía en el estado provocaría correcciones; se envía sin redondear (D33).
- Comprobado automáticamente: 51 pruebas (7 nuevas: ×1,4, duración de 2 s, umbral del 25 %, recarga en 6 s, sin gasto quieto o congelado, valores no válidos rechazados, no se supera la velocidad enviando más mensajes). Playwright: la barra baja al ritmo previsto, «agotado» y recuperación correctos; **0 px de corrección** entre predicción y servidor; sin errores de consola.
- Pendiente: sensación de juego con jugadores reales (¿2 s de sprint son pocos o muchos?).
- Evidencia: `docs/evidence/fase7a-sprint.png`.

### 2026-11-13 — Fase 7b: habilidades propias (señuelo y rastreo)
- Objetivo: habilidad con Espacio según `docs/GAMEPLAY.md` (aprobado).
- Herramienta: Claude Code (sesión en la nube).
- Modificado: `server/match.js` (`useAbility`, señuelos, rastreo, `personalize`, al transformarse se pierde el señuelo), `server/index.js` (estado personal por jugador, evento `ability` con motivo de rechazo), `shared/config.js`, `shared/events.js`, `client/js/scenes/GameScene.js` (señuelos según el bando de quien mira, flecha de rastreo, captura de Espacio), `client/js/main.js` (HUD de la habilidad con texto, aviso si no se puede usar), `client/js/sound.js`, pruebas.
- Decisiones: D34 (estado personal), D35 (limitación conocida del señuelo).
- Incidencias:
  1. El HUD creció a tres líneas y, con el aviso inferior, tapaba al jugador en los bordes del mapa → más margen de cámara arriba y abajo.
  2. Al verse el exterior del mapa, el final redondeado de los caminos sobresalía → recortado.
  3. La flecha de rastreo era demasiado pequeña en la captura → agrandada.
  4. Prevención: Espacio podía «pulsar» un botón de la página con el foco → se captura en Phaser y se quita el foco al empezar la partida.
- Comprobado automáticamente: 59 pruebas (8 nuevas: señuelo, no capturable, recarga, rastreo solo para el monstruo, congelado, pérdida al transformarse, desconexión del dueño, estado personal por red). Playwright con 2 navegadores: el monstruo ve el señuelo idéntico al dueño y el superviviente lo ve translúcido con etiqueta; desaparece a los 4 s; la flecha apunta al superviviente (−0,79 rad, igual que el esperado) y el superviviente no la ve; avisos y HUD correctos; sin errores. Las pruebas de navegador anteriores siguen pasando.
- Pendiente: equilibrio con jugadores reales.
- Evidencia: `docs/evidence/fase7b-*.png`.

### 2026-11-13 — Fase 7c: objetos
- Objetivo: 5 objetos según `docs/GAMEPLAY.md` (Energía, Humo, Invisibilidad / Radar, Furia), inventario de 2, teclas 1/2.
- Herramienta: Claude Code (sesión en la nube).
- Modificado: `shared/config.js` (`ITEMS`, aparición, inventario), `shared/movement.js` (furia), `server/match.js` (aparición, recogida, uso, nubes, `isHidden`, filtro por destinatario, radar), `server/index.js` (evento `item:use`), `client/js/scenes/GameScene.js` (objetos, nubes, translucidez, aura de furia, radar en el minimapa, teclas 1/2), `client/js/main.js` (ranuras, efectos, avisos), `client/index.html`/`style.css` (HUD en dos zonas), `client/js/sound.js`, pruebas; nuevo `test/e2e/items.mjs`.
- Decisiones: D36–D39.
- Incidencia: con el inventario, el HUD llegó a 4 líneas y tapaba el mapa (visto en las capturas). Se dividió en HUD superior y barra de acciones inferior (D38).
- Observación correcta, no fallo: el radar del monstruo salió vacío porque el único superviviente estaba dentro del humo.
- Comprobado automáticamente: 71 pruebas (12 nuevas: aparición y máximo, recogida por bando y con hueco, motivos de error, energía, invisibilidad oculta al monstruo pero se puede capturar, caducidad, humo, radar sin los ocultos, furia ×1,2 y fin, pérdida de objetos al ser capturado, rastreo ignora a los ocultos; por red: el monstruo no recibe al invisible). Playwright (servidor en el mismo proceso para colocar objetos): recogida con aviso, nube visible para ambos, el monstruo no ve al superviviente en el humo, ranura vacía con motivo, furia y radar en el HUD; sin errores. Las otras 3 pruebas de navegador siguen pasando.
- Pendiente: equilibrio (frecuencia de aparición, duraciones) con jugadores reales.
- Evidencia: `docs/evidence/fase7c-*.png`.

### 2026-11-13 — Fase 7: controles táctiles (móvil y tableta)
- Objetivo: última parte aprobada de la fase 7.
- Herramienta: Claude Code (sesión en la nube).
- Creado: `client/js/touch.js`, `test/e2e/touch.mjs`. Modificado: `client/index.html` (joystick, botones, aviso de girar), `client/css/style.css` (diseño táctil, menús desplazables, menús compactos), `client/js/main.js`, `client/js/scenes/GameScene.js` (combina teclado y táctil).
- Decisiones: D40, D41.
- Incidencia importante: con el móvil emulado en horizontal, el menú no cabía y la página no dejaba desplazar, así que era imposible crear o unirse a una sala desde un móvil. Venía de la fase 2 (`overflow: hidden` global). Corregido.
- Comprobado automáticamente (EMULACIÓN, no dispositivos reales): los controles aparecen solo en táctil; el joystick mueve al jugador (109–195 px en ~0,8 s) y vuelve a 0 al soltar; el botón de habilidad funciona (rastreo y señuelo); el aviso de girar aparece solo en vertical; menús alcanzables en iPhone 13 (horizontal y vertical), Galaxy S9+ e iPad Mini; sin errores. Las pruebas de escritorio y las 71 automáticas siguen pasando.
- **Pendiente:** probar en móviles y tabletas reales (iOS y Android) antes de afirmar compatibilidad.
- Evidencia: `docs/evidence/fase7-movil-*.png`.
