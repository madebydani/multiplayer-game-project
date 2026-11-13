# Estado del proyecto

**Actualizado:** 2026-11-13

## Estado actual
- Fases 1–3: completadas (planificación, prototipo local, salas y red).
- Fase 4 (núcleo de infección): **completada**. Partida completa: monstruo inicial al azar (inmóvil 5 s), captura a 40 px validada en servidor, transformación con bloqueo de 3 s, temporizador elegido por el anfitrión, victoria por captura o por tiempo, abandono, nuevo monstruo si se va el único, HUD y pantalla de resultados. 36 pruebas automáticas + prueba con dos navegadores.
- Pendiente de verificar por el equipo: **dos ordenadores** en LAN, partida con 3 o más jugadores reales y si el equilibrio de velocidades (200/210 px/s) resulta divertido.

## Siguiente fase (pendiente de autorización)
**Fase 5 — Mapa procedural:** el servidor genera un bosque distinto en cada partida (árboles, rocas, arbustos, caminos) a partir de una semilla, lo valida (sin solapamientos, todo el terreno libre conectado, puntos de aparición libres y separados) y lo envía a los clientes. Sustituye a `shared/testMap.js`.

Criterio de cierre: cada partida tiene un mapa distinto y todos los clientes lo ven igual; una prueba automática con muchas semillas confirma conectividad y que nadie aparece atrapado.

## Notas para retomar en una sesión nueva
- Especificación: `docs/HUNTED_SPEC.md`. Decisiones: `docs/DECISIONS.md`.
- Trabajar una fase por vez y esperar aprobación.
- La skill `hypercasual-game-developer` no estaba disponible en la sesión inicial.
