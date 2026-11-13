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
