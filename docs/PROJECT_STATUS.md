# Estado del proyecto

**Actualizado:** 2026-11-13

## Estado actual
- Fases 1–4: completadas (planificación, prototipo, salas y red, núcleo de infección).
- Fase 5 (mapa procedural): **completada**. Bosque distinto en cada partida (caminos, cabañas, rocas, árboles, arbustos decorativos), validado en el servidor y enviado a todos. 42 pruebas automáticas + prueba con dos navegadores.
- **Núcleo del MVP terminado:** dos navegadores, una sala, movimiento sincronizado, infección, victoria y mapa aleatorio.
- Pendiente de verificar por el equipo: **dos ordenadores** en LAN; partida con 3+ jugadores reales; equilibrio (velocidades, densidad del bosque, posición de los puntos de aparición).

## Siguiente fase (pendiente de autorización)
**Fase 6 — Arte e interfaz:** necesita decisiones y recursos del equipo:
1. Definir el estilo en `docs/ART_STYLE.md` (paleta, tamaño base de personajes y tiles, fotogramas).
2. Crear `docs/ASSET_LIST.md` con cada recurso necesario (nombre, tamaño, transparencia, perspectiva, animaciones, estado).
3. Generar las imágenes con ChatGPT y pasarlas al repositorio.
4. Claude Code las integra y pule menús, HUD, efectos y accesibilidad (volumen, reducir animaciones).

Alternativa: hacer antes el pulido de interfaz que no depende de arte (pantalla de créditos, ajustes, minimapa, indicadores de conexión).

## Notas para retomar en una sesión nueva
- Especificación: `docs/HUNTED_SPEC.md`. Decisiones: `docs/DECISIONS.md`.
- Trabajar una fase por vez y esperar aprobación.
- La skill `hypercasual-game-developer` no estaba disponible en la sesión inicial.
