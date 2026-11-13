# Requisitos académicos

Estados: `pendiente` / `implementado` / `probado`. Fuente: `HUNTED_SPEC.md` §2.

| # | Requisito | Estado | Fase prevista | Evidencia |
|---|---|---|---|---|
| 1 | Mínimo dos jugadores desde **máquinas diferentes** en una misma partida | pendiente | 3 (red) · 8 (prueba LAN) | — |
| 2 | Mapa **aleatorio por partida** y compartido de forma coherente | pendiente | 5 | — |
| 3 | Objetivo, reglas y condiciones de victoria claras | pendiente | 4 (lógica) · 6 (UI) | Reglas definidas en `DECISIONS.md` |
| 4 | Comunicación en tiempo real; el servidor gestiona y comunica el resultado | pendiente | 3 · 4 (`gameEnded`) | — |
| 5 | Juego ejecutable, con estética, usabilidad y accesibilidad | pendiente | 2–6 | — |
| 6 | Documentación del trabajo con IA | implementado (en curso) | todas | `DEVELOPMENT_LOG.md`, `PROMPT_EVIDENCE.md`, `DECISIONS.md` |

No exigido por el enunciado (no se añade como obligatorio): registro de usuarios, base de datos, historial persistente, endpoint HTTP propio.
