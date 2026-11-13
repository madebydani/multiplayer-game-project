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
