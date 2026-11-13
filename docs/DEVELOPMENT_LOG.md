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
