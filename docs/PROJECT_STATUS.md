# Estado del proyecto

**Actualizado:** 2026-11-13

## Estado actual
- Fases 1–4: completadas (planificación, prototipo, salas y red, núcleo de infección).
- Fase 5 (mapa procedural): **completada**. Bosque distinto en cada partida (caminos, cabañas, rocas, árboles, arbustos decorativos), validado en el servidor y enviado a todos. 42 pruebas automáticas + prueba con dos navegadores.
- **Núcleo del MVP terminado:** dos navegadores, una sala, movimiento sincronizado, infección, victoria y mapa aleatorio.
- Pendiente de verificar por el equipo: **dos ordenadores** en LAN; partida con 3+ jugadores reales; equilibrio (velocidades, densidad del bosque, posición de los puntos de aparición).

## Fase 6 — Arte e interfaz (en curso)
- Hecho: estilo aprobado (`ART_STYLE.md`) y lista de 16 recursos con prompts (`ASSET_LIST.md`).
- Hecho: el juego carga las imágenes de `client/assets/` en cuanto existen (respaldo a placeholders), rota a los personajes, añade sombra, anillo de color y balanceo.
- Hecho: Ajustes (volumen, reducir animaciones), Créditos, minimapa (M), indicador de conexión, sonidos sintetizados. 44 pruebas automáticas + 2 pruebas de navegador.
- **Equipo:** generar con ChatGPT los recursos (prioridad 1: `survivor.png`, `monster.png`), subirlos y rellenar el registro de `ASSET_LIST.md`; facilitar los nombres para Créditos.
- Claude Code, al recibir cada imagen: comprobar escala, rotación y legibilidad, ajustar `FILL` si hace falta y marcarla como integrada/probada.

## Notas para retomar en una sesión nueva
- Especificación: `docs/HUNTED_SPEC.md`. Decisiones: `docs/DECISIONS.md`.
- Trabajar una fase por vez y esperar aprobación.
- La skill `hypercasual-game-developer` no estaba disponible en la sesión inicial.
