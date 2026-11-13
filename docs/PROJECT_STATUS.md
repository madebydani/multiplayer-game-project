# Estado del proyecto

**Actualizado:** 2026-11-13

## Estado actual
- Fase 1 (planificación): completada. Decisiones en `DECISIONS.md`.
- Fase 2 (prototipo local): **completada**. Un jugador con WASD/flechas, mapa fijo de placeholders, cámara y colisiones. 8 pruebas automáticas pasan.
- Pendiente de verificar: prueba manual del equipo en su navegador (`npm install`, `npm start`, `http://localhost:3000`).

## Siguiente fase (pendiente de autorización)
**Fase 3 — Salas y red:** Socket.IO; pantalla de menú (nombre, crear sala, unirse por código); sala con código copiable, lista de jugadores, anfitrión y plazas (máx. 6); el servidor simula el movimiento a partir de las entradas (D1) y los clientes ven a los demás con interpolación.

Criterio de cierre: dos navegadores independientes ven moverse al otro en la misma sala; salas aisladas; pruebas de salas pasan.

## Notas para retomar en una sesión nueva
- Especificación: `docs/HUNTED_SPEC.md`.
- Trabajar una fase por vez y esperar aprobación.
- La skill `hypercasual-game-developer` no estaba disponible en la sesión inicial.
