# Requisitos académicos

Estados: `pendiente` / `implementado` / `probado`. Fuente: `HUNTED_SPEC.md` §2.
«Probado automáticamente» = pruebas en este repositorio. «Pendiente del equipo» = solo se puede comprobar con ordenadores o dispositivos reales (ver `TEST_PLAN.md`).

| # | Requisito | Estado | Evidencia |
|---|---|---|---|
| 1 | Mínimo dos jugadores desde **máquinas diferentes** en una misma partida | Implementado. Probado automáticamente con clientes de red reales y con 2 navegadores independientes en una máquina. **Pendiente del equipo:** prueba con 2 ordenadores en LAN (`TEST_PLAN.md`, sección 1) | `test/network.test.js`, `test/e2e/two-browsers.cjs`, `docs/evidence/fase3-*.png` |
| 2 | Mapa **aleatorio por partida** y compartido de forma coherente | Implementado y probado: semilla aleatoria por partida, 200 semillas validadas (sin solapamientos, todo conectado), ambos navegadores reciben el mismo mapa, la revancha genera otro | `test/mapgen.test.js`, `test/e2e/two-browsers.cjs`, `docs/evidence/fase5-*.png` |
| 3 | Objetivo, reglas y condiciones de victoria claras | Implementado y probado: «Cómo se juega» en la sala, HUD con rol, estado y tiempo, pantalla de resultados con motivo y estado de cada jugador | `test/match.test.js`, `docs/evidence/fase4-*.png` |
| 4 | Comunicación en tiempo real; el servidor gestiona y comunica el resultado | Implementado y probado: servidor autoritativo a 20 ticks/s, decide capturas, objetos y victoria, y envía `game:ended` a toda la sala. Prueba de carga con 180 conexiones estable | `test/network.test.js`, `test/stress.mjs` |
| 5 | Juego ejecutable, con estética, usabilidad y accesibilidad | Implementado y probado: arte provisional integrado (bocetos SVG), roles por forma, icono y color, textos en el HUD (no solo color), volumen, reducir animaciones, teclado y flechas, controles táctiles. **Pendiente del equipo:** sonido y móvil en dispositivos reales; arte definitivo opcional | `test/e2e/ui.cjs`, `test/e2e/touch.mjs`, `docs/evidence/fase6-*.png`, `fase7-*.png` |
| 6 | Documentación del trabajo con IA | Implementado: diario por hito, prompts literales, 41 decisiones con alternativas, fallos e intentos corregidos, evidencias y resumen para la presentación. **Pendiente del equipo:** exportar las conversaciones completas (Claude Code y ChatGPT) | `DEVELOPMENT_LOG.md`, `PROMPT_EVIDENCE.md`, `DECISIONS.md`, `PRESENTATION_NOTES.md` |

No exigido por el enunciado (no se añade como obligatorio): registro de usuarios, base de datos, historial persistente, endpoint HTTP propio.

## Otros puntos de la especificación
| Apartado | Estado |
|---|---|
| §4 Salas: códigos únicos, máx. 6, anfitrión reasignado, sin unirse a partidas en curso | Implementado y probado |
| §4 Desconexiones: abandono, último superviviente, único monstruo | Implementado y probado |
| §4 Política de reconexión | **Propuesta pendiente de aprobación** (D42) |
| §9 Robustez: entradas validadas, salas aisladas, sin capturas duplicadas ni velocidades imposibles, temporizadores limpios | Implementado y probado (incluida la prueba de carga y las entradas basura) |
