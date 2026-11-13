# Estado del proyecto

**Actualizado:** 2026-11-13

## Estado actual
- Fases 1–4: completadas (planificación, prototipo, salas y red, núcleo de infección).
- Fase 5 (mapa procedural): **completada**. Bosque distinto en cada partida (caminos, cabañas, rocas, árboles, arbustos decorativos), validado en el servidor y enviado a todos. 42 pruebas automáticas + prueba con dos navegadores.
- **Núcleo del MVP terminado:** dos navegadores, una sala, movimiento sincronizado, infección, victoria y mapa aleatorio.
- Pendiente de verificar por el equipo: **dos ordenadores** en LAN; partida con 3+ jugadores reales; equilibrio (velocidades, densidad del bosque, posición de los puntos de aparición).

## Fase 6 — Arte e interfaz (en curso)
- Hecho: estilo **aprobado** (vista cenital pura, paleta, animación por código) en `ART_STYLE.md` y lista de 16 recursos con prompts en `ASSET_LIST.md`.
- Siguiente paso del equipo: generar con ChatGPT los recursos de prioridad 1 (superviviente y monstruo), subirlos a `client/assets/` y rellenar el registro de `ASSET_LIST.md`.
- Mientras tanto, Claude Code puede (con autorización): preparar la carga de imágenes con respaldo automático a los placeholders si falta alguna, y hacer la opción B (créditos, ajustes de volumen y de reducir animaciones, minimapa, indicador de conexión).

## Notas para retomar en una sesión nueva
- Especificación: `docs/HUNTED_SPEC.md`. Decisiones: `docs/DECISIONS.md`.
- Trabajar una fase por vez y esperar aprobación.
- La skill `hypercasual-game-developer` no estaba disponible en la sesión inicial.
