# Estado del proyecto

**Actualizado:** 2026-11-13

## Estado actual
- Fases 1–4: completadas (planificación, prototipo, salas y red, núcleo de infección).
- Fase 5 (mapa procedural): **completada**. Bosque distinto en cada partida (caminos, cabañas, rocas, árboles, arbustos decorativos), validado en el servidor y enviado a todos. 42 pruebas automáticas + prueba con dos navegadores.
- **Núcleo del MVP terminado:** dos navegadores, una sala, movimiento sincronizado, infección, victoria y mapa aleatorio.
- Pendiente de verificar por el equipo: **dos ordenadores** en LAN; partida con 3+ jugadores reales; equilibrio (velocidades, densidad del bosque, posición de los puntos de aparición).

## Fase 6 — Arte e interfaz (casi terminada)
- Hecho: estilo aprobado; 14 imágenes dibujadas con código por Claude Code (cambio de reparto, D31) e integradas; Ajustes, Créditos, minimapa, indicador de conexión, sonidos sintetizados.
- 44 pruebas automáticas + 2 pruebas de navegador en verde con el arte integrado.
- **Pendiente del equipo:** revisar el arte (`docs/evidence/fase6-arte-*.png` o jugando) y dar los nombres para Créditos.
- Pendiente de verificar: sonido en un ordenador real; latencia en un ordenador normal; dos ordenadores en LAN.

## Fase 7 — Mejoras (en curso)
- 7a Sprint, 7b Habilidades, 7c Objetos y controles táctiles: **completados** (diseño en `docs/GAMEPLAY.md`). Los controles táctiles solo se han probado en emulación: **falta probarlos en móviles reales**.

## Siguiente
- Fase 7 — Mejoras opcionales: power-ups, habilidades, inventario, versión móvil. Antes, definir la tabla de controles (D9) y cada habilidad (efecto, duración, recarga, cómo se muestra).
- Fase 8 — Entrega: prueba con dos ordenadores, estabilidad, README, diario y material para la presentación.

## Notas para retomar en una sesión nueva
- Especificación: `docs/HUNTED_SPEC.md`. Decisiones: `docs/DECISIONS.md`.
- Trabajar una fase por vez y esperar aprobación.
- La skill `hypercasual-game-developer` no estaba disponible en la sesión inicial.
