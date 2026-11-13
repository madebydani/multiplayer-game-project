# Estado del proyecto

**Actualizado:** 2026-11-13

## Estado actual
- Fases 1–7: completadas (planificación, prototipo, salas y red, infección, mapa procedural, arte e interfaz, mejoras).
- Fase 8 (entrega): **preparada por Claude Code**. Pruebas de carga y robustez, plan de pruebas manuales, README final, requisitos actualizados y resumen para la presentación.
- Pruebas: 73 automáticas + 4 guiones de navegador + prueba de carga, todas en verde.

## Pendiente del equipo (imprescindible para la entrega)
1. **Prueba con dos ordenadores en red local** → `docs/TEST_PLAN.md`, sección 1. Anotar el resultado (también si algo falla).
2. Exportar las conversaciones de Claude Code y ChatGPT como evidencia literal.
3. Nombres del equipo para Créditos (`client/index.html`, comentario «EDITAR»).

## Pendiente del equipo (recomendable)
- Sonido, accesibilidad con teclado y móvil real (`TEST_PLAN.md`, secciones 3 y 4).
- Sensaciones de juego para ajustar `shared/config.js` (`TEST_PLAN.md`, sección 5).
- Arte definitivo con ChatGPT (opcional; sustituir los PNG de `client/assets/`).

## Decisiones abiertas
- **D42 — Reconexión:** propuesta (20 s para volver con el mismo personaje) o dejarla como limitación documentada.

## Notas para retomar en una sesión nueva
- Especificación: `docs/HUNTED_SPEC.md`. Decisiones: `docs/DECISIONS.md`. Mecánicas: `docs/GAMEPLAY.md`.
- Trabajar una fase por vez y esperar aprobación.
- La skill `hypercasual-game-developer` no estaba disponible en la sesión inicial.
