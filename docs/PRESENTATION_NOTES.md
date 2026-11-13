# HUNTED: resumen para la presentación

> Material de apoyo para preparar la exposición (no son las diapositivas). Todo lo que aparece aquí está respaldado por el diario (`DEVELOPMENT_LOG.md`), las decisiones (`DECISIONS.md`) y las evidencias (`docs/evidence/`). Los datos marcados como *pendiente* deben completarse tras la prueba con dos ordenadores.

## 1. Qué es HUNTED
- Juego multijugador en navegador, 2D con vista cenital, de persecución e infección, de 2 a 6 jugadores.
- Un monstruo al azar; cada superviviente capturado se convierte en monstruo. Los supervivientes ganan si queda alguno al acabar el tiempo.
- Cada partida se juega en un bosque distinto, generado al azar.
- Ampliaciones: sprint, habilidades (señuelo / rastreo), 5 objetos, minimapa, controles táctiles.

## 2. Tecnologías y por qué
| Tecnología | Por qué |
|---|---|
| Phaser 3 | Dibujo, cámara y teclado sin escribir un motor propio |
| Node.js + Express | Un solo proceso sirve la web y el juego |
| Socket.IO | Tiempo real bidireccional con salas integradas |
| JavaScript con módulos ES y sin empaquetador | El mismo código (`shared/`) funciona en servidor y cliente; fácil de explicar |
| `node:test` + Playwright | Pruebas sin dependencias extra; navegadores reales para probar el multijugador |

## 3. Arquitectura en una imagen
```
 Navegador A ──input (teclas, 20/s)──►  SERVIDOR (autoritativo)  ◄──input── Navegador B
             ◄──state (personal, 20/s)── · salas y códigos        ──state──►
                                         · simula movimiento y colisiones
                                         · decide capturas, objetos, victoria
                                         · genera y valida el mapa
                                         └─ game:ended → resultado a todos
 shared/  = configuración, colisiones y movimiento usados por los DOS lados
```
Conceptos para explicar:
- **Servidor autoritativo:** el cliente solo envía teclas; no puede teletransportarse, ir más rápido ni decidir capturas.
- **Predicción y reconciliación:** tu personaje se mueve al instante y se corrige con el servidor. Medido: 0 px de corrección durante el sprint.
- **Interpolación:** a los demás se les dibuja 100 ms en el pasado para que se muevan suaves.
- **Estado personal:** a los monstruos no les llega la posición de quien está invisible o en el humo, así que no se puede hacer trampa leyendo los datos de red.
- **Mapa:** semilla → colocación con hueco mínimo → validación con búsqueda en anchura (BFS) → se envía la lista final de obstáculos, no solo la semilla.

## 4. Cómo se trabajó con IA
**Herramientas:**
- Claude Code: código, pruebas, documentación y los bocetos de arte en SVG.
- ChatGPT: previsto para el arte final; el equipo tuvo problemas con las peticiones y por ahora se usan los bocetos (D31).

**Método** (fijado en la especificación del equipo, `HUNTED_SPEC.md`):
1. Especificación escrita por el equipo antes de empezar.
2. Plan por fases, con aprobación humana antes de cada una.
3. Las decisiones abiertas se resolvieron con preguntas de opción múltiple de la IA al equipo.
4. Pruebas en cada fase, separando lo comprobado automáticamente, lo comprobado a mano y lo pendiente.
5. Diario, decisiones y prompts registrados durante el desarrollo, no reconstruidos al final.

**Decisiones tomadas por el equipo** (ejemplos):
- Velocidades, tiempos de protección, nuevo monstruo si se va el único y prueba en red local (fase 1).
- Especificar el arte antes que la interfaz; vista **cenital pura** en lugar de la 3/4 propuesta por la IA.
- Que la IA dibujara bocetos al fallar ChatGPT, pero dejándolos como provisionales.
- Diseño de habilidades y objetos, y orden de trabajo de la fase 7.

**Errores de la IA detectados y corregidos** (buen material para explicar el proceso):

| Fase | Error | Cómo se detectó |
|---|---|---|
| 3 | Una prueba comparaba un valor consigo mismo (siempre pasaba) | Revisión del código de prueba |
| 3 | `npm test` intentaba ejecutar el script de navegador | La prueba falló |
| 4 | Los avisos generados entre ticks se perdían | Revisión antes de probar |
| 5 | Una condición de espera de la prueba de navegador accedía a `null` | La prueba falló |
| 3→6 | El botón «Unirse» se salía del panel desde la fase 3 | Captura de pantalla en la fase 6 |
| 2→7 | En móvil horizontal no se podía llegar a «Crear sala» (`overflow: hidden` global) | Emulación de móvil en la fase 7 |
| 6 | El primer boceto del superviviente parecía una diana | Revisión visual de la hoja de arte |

**Problemas que se resolvieron midiendo, no suponiendo:**
- Con un hueco de 36 px, el 92 % de los mapas no pasaba la validación. Se probaron 48, 52 y 56 px; con 52 px pasan los 200 de 200 (D22).
- La velocidad dependía de los FPS (90 px/s en vez de 200) por el suavizado de Phaser. Corregido (D12).
- Una prueba de red falló porque el límite anti-trampas descartó entradas. El juego se comportaba bien; la prueba no (D15).

## 5. Pruebas (datos reales)
| Tipo | Cantidad y resultado |
|---|---|
| Unidad e integración (`npm test`) | 73 pruebas, todas pasan |
| Mapas validados | 200 semillas en cada ejecución |
| Navegador (Playwright) | 4 guiones: partida completa, interfaz, objetos, móvil emulado |
| Carga | 180 conexiones (30 salas) durante 2 min: 20 estados/s, retraso máx. 12 ms, sin salas huérfanas |
| Dos ordenadores en LAN | *Pendiente (`TEST_PLAN.md`)* |
| Móvil real | *Pendiente* |

Tamaño aproximado: unas 2600 líneas de juego (cliente, servidor y compartido) y unas 1500 de pruebas; 41 decisiones documentadas; 28 capturas de evidencia; 14 commits por fase (los de esta fase de entrega no están contados).

## 6. Limitaciones conocidas (es mejor decirlas)
- El arte son bocetos provisionales.
- Sin reconexión: si se cae la conexión, el jugador sale de la partida (propuesta D42 pendiente).
- El señuelo se puede distinguir inspeccionando los mensajes de red (D35); la invisibilidad y el humo no.
- Al empezar o acabar la furia puede haber una corrección de pocos píxeles (D37).
- Controles táctiles probados solo en emulación.
- Equilibrio (velocidades, tiempos, objetos) sin ajustar con jugadores reales.

## 7. Guion de demostración (5 minutos)
1. Ordenador A: `npm start` y señalar la dirección de red local.
2. Ordenador B: abrir la dirección, unirse con el código.
3. Mostrar la sala: anfitrión, duración, «Cómo se juega».
4. Partida: mapa igual en ambos, monstruo inmóvil 5 s, sprint, señuelo, objeto de humo.
5. Captura → transformación → pantalla de resultados.
6. «Volver a la sala» → otra partida → mapa distinto.
7. Opcional: `npm test` en directo (unos 15 s).

## 8. Evidencias recomendadas
- `docs/evidence/fase5-tres-mapas.png`: tres mapas con semillas distintas.
- `docs/evidence/fase7c-humo-monstruo.png` frente a `fase7c-humo-superviviente.png`: qué ve cada bando.
- `docs/evidence/fase6-arte-hoja.png`: bocetos de arte.
- Conversaciones exportadas de Claude Code y ChatGPT: *pendiente del equipo*.
