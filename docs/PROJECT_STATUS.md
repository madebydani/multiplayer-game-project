# Estado del proyecto

**Actualizado:** 2026-11-13

## Estado actual
- Fase 1 (planificación): completada.
- Fase 2 (prototipo local): completada.
- Fase 3 (salas y red): **completada**. Menú, sala con código, anfitrión, 2–6 jugadores, movimiento autoritativo sincronizado, fin por abandono. 24 pruebas automáticas + prueba con dos navegadores independientes.
- Pendiente de verificar por el equipo: prueba con **dos ordenadores** en la misma red (instrucciones en el README) y botón «Copiar código».

## Siguiente fase (pendiente de autorización)
**Fase 4 — Núcleo de infección:** roles (monstruo inicial al azar), forma/icono distinto por rol, captura validada en servidor (40 px), transformación, bloqueo de 3 s tras transformarse, monstruo inicial inmóvil 5 s, temporizador elegido por el anfitrión (3/5/7/10 min), condiciones de victoria, evento `gameEnded`, pantalla de resultados (D7) y reglas de desconexión (D6).

Criterio de cierre: partida completa con dos clientes que termine con victoria de cada bando; sin capturas duplicadas; sin temporizadores ni salas huérfanas.

## Notas para retomar en una sesión nueva
- Especificación: `docs/HUNTED_SPEC.md`. Decisiones: `docs/DECISIONS.md`.
- Trabajar una fase por vez y esperar aprobación.
- La skill `hypercasual-game-developer` no estaba disponible en la sesión inicial.
