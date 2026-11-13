# Requisitos académicos

Estados: `pendiente` / `implementado` / `probado`. Fuente: `HUNTED_SPEC.md` §2.

| # | Requisito | Estado | Fase prevista | Evidencia |
|---|---|---|---|---|
| 1 | Mínimo dos jugadores desde **máquinas diferentes** en una misma partida | implementado; probado con 2 navegadores independientes en una máquina; **pendiente** prueba con 2 ordenadores | 3 · 8 (prueba LAN) | `test/network.test.js`, `test/e2e/two-browsers.cjs`, `docs/evidence/fase3-*.png` |
| 2 | Mapa **aleatorio por partida** y compartido de forma coherente | implementado y probado: semilla aleatoria por partida; 200 semillas validadas; ambos navegadores reciben el mismo mapa; la revancha genera otro | 5 | `test/mapgen.test.js`, `test/e2e/two-browsers.cjs`, `docs/evidence/fase5-*.png` |
| 3 | Objetivo, reglas y condiciones de victoria claras | implementado y probado (lógica, HUD, «Cómo se juega» en la sala, pantalla de resultados); pulido visual en fase 6 | 4 · 6 | `test/match.test.js`, `docs/evidence/fase4-*.png` |
| 4 | Comunicación en tiempo real; el servidor gestiona y comunica el resultado | implementado y probado: el servidor decide capturas y victoria y envía `game:ended` a toda la sala | 3 · 4 | `test/network.test.js`, `test/e2e/two-browsers.cjs` |
| 5 | Juego ejecutable, con estética, usabilidad y accesibilidad | implementado parcialmente (ejecutable en local, placeholders, controles WASD/flechas) | 2–6 | `docs/evidence/fase2-*.png` |
| 6 | Documentación del trabajo con IA | implementado (en curso) | todas | `DEVELOPMENT_LOG.md`, `PROMPT_EVIDENCE.md`, `DECISIONS.md` |

No exigido por el enunciado (no se añade como obligatorio): registro de usuarios, base de datos, historial persistente, endpoint HTTP propio.
