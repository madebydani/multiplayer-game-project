# Decisiones de diseño

### D1 — Arquitectura: servidor autoritativo con envío de entradas (2026-11-13)
- Decisión: el cliente envía solo su entrada (dirección WASD); el servidor simula movimiento y colisiones (~20 ticks/s) y difunde el estado. Predicción local del propio jugador e interpolación de remotos.
- Alternativa: el cliente envía su posición y el servidor la valida. Descartada: más fácil de manipular y requiere más reglas de validación.
- Motivo: cumple §3 y §9 (el cliente no decide capturas, roles ni resultados; se impiden teletransportes y velocidades imposibles).
- Propuesta: Claude Code. Aprobada por el usuario.

### D2 — Código compartido en `shared/` y sin bundler (2026-11-13)
- Decisión: ES modules en cliente y servidor; `shared/config.js`, `collision.js`, `events.js` usados por ambos. Phaser se sirve directamente.
- Motivo: misma lógica de colisiones en predicción y servidor; estructura simple y explicable en 2.º DAM.

### D3 — Mapa generado y validado en servidor, enviado como lista de obstáculos (2026-11-13)
- Decisión: el servidor genera con semilla, valida (sin solapamientos, conectividad por BFS en rejilla, spawns libres) y envía la lista final.
- Alternativa: enviar solo la semilla. Descartada: §5 advierte que no garantiza coincidencia.

### D4 — Velocidades y radio de captura (2026-11-13)
- Decisión: radio del jugador 16 px; superviviente 200 px/s; monstruo 210 px/s; captura si distancia entre centros ≤ 40 px. Configurable.
- Alternativas ofrecidas: misma velocidad (200/200); monstruo claramente más rápido (190/230, radio 36).
- Elegida por el usuario: monstruo algo más rápido. Pendiente de ajuste tras pruebas reales.

### D5 — Tiempos de protección (2026-11-13)
- Decisión: 3 s sin poder capturar tras transformarse; el monstruo inicial queda inmóvil 5 s al empezar.
- Alternativas ofrecidas: 3 s sin ventaja inicial; 2 s + 3 s.
- Elegida por el usuario.

### D6 — Desconexión del único monstruo (2026-11-13)
- Problema detectado: las reglas de §4 no cubren que se desconecte el único monstruo con ≥ 2 supervivientes; la partida quedaría bloqueada.
- Decisión: el servidor convierte a un superviviente al azar en monstruo, avisa a todos y le aplica el bloqueo de 3 s.
- Alternativa: finalizar por abandono. Descartada por el usuario.
- Resto de reglas de desconexión: según §4 de la especificación.

### D7 — Presentación del resultado (2026-11-13) — implementada en fase 4
- Decisión (propuesta por defecto, sin objeción): bando ganador + lista por jugador: *Sobrevivió* / *Transformado a mm:ss (por X)* / *Monstruo inicial* / *Desconectado*; duración y motivo del final (tiempo, todos capturados, abandono).

### D8 — Duración de partida (2026-11-13)
- Decisión: el anfitrión elige 3, 5, 7 o 10 min; por defecto 5.

### D9 — Tabla de controles futura (2026-11-13, provisional)
- Propuesta: WASD/flechas mover · Shift sprint · Espacio habilidad · 1/2 objetos · Esc pausa/menú.
- Se confirmará antes de la fase 7.

### D10 — Prueba en dos máquinas por red local (2026-11-13)
- Decisión: prueba obligatoria en LAN (un PC servidor, otro por IP local).
- Alternativas: despliegue público (Render/Railway) o ambas. No elegidas por ahora.

### D11 — Colisiones propias en lugar de Arcade Physics de Phaser (2026-11-13, fase 2)
- Decisión: colisiones círculo-círculo y círculo-rectángulo en `shared/collision.js`; Phaser solo dibuja, gestiona cámara y teclado.
- Alternativa: Arcade Physics de Phaser. Descartada: no se puede ejecutar en el servidor Node, y el servidor y el cliente deben calcular el mismo movimiento (D1).
- Detalles: movimiento dividido en subpasos (no atraviesa paredes finas) y resolución por ejes (el personaje resbala junto a obstáculos).
- Propuesta: Claude Code.

### D12 — Delta de tiempo real en Phaser (`smoothStep: false`) (2026-11-13, fase 2)
- Problema detectado en prueba: a ~28 FPS el personaje iba a 90 px/s en lugar de 200, porque Phaser suaviza el delta a ~16,7 ms.
- Decisión: desactivar `smoothStep`; se mantiene un tope de 100 ms por fotograma.
- Motivo: la velocidad debe ser la misma en cualquier equipo; imprescindible para sincronizar con el servidor en fase 3.

### D14 — Pasos fijos de 50 ms con número de secuencia (2026-11-13, fase 3)
- Decisión: cliente y servidor avanzan en pasos de 50 ms; cada entrada lleva `seq`. El servidor devuelve la última `seq` procesada y el cliente reaplica las pendientes (reconciliación).
- Alternativa: el servidor aplica "la última tecla pulsada" en cada tick y el cliente se mueve con su delta de fotograma. Descartada: cliente y servidor calcularían recorridos distintos y habría tirones constantes.
- Comprobado: con las mismas entradas, la posición del servidor coincide con la predicha por el cliente (`test/network.test.js`).

### D15 — Límite de entradas por jugador (anti speed hack) (2026-11-13, fase 3)
- Decisión: cada tick da 1 crédito (máx. 4); cada entrada procesada gasta 1; cola máxima de 8 entradas (se descartan las más antiguas).
- Consecuencia observada en pruebas: si llegan más de 8 entradas de golpe se pierden las antiguas y el cliente se corrige unos píxeles. Un cliente normal envía 1 cada 50 ms.

### D16 — Menú y sala en HTML; Phaser solo para la partida (2026-11-13, fase 3)
- Motivo: formularios nativos (campo de texto, botones, foco con teclado, `role="alert"`) son más accesibles y sencillos que recrearlos en el canvas.
- Phaser se crea al empezar la partida y se destruye al terminar (sin bucles huérfanos en el cliente).

### D17 — Códigos de sala de 4 caracteres sin caracteres ambiguos (2026-11-13, fase 3)
- Alfabeto sin O/0, I/1 ni L; 31⁴ ≈ 923 000 combinaciones; se comprueba unicidad entre salas activas.

### D18 — Tiempo de partida medido en ticks (2026-11-13, fase 4)
- Decisión: el servidor cuenta el tiempo como `tick × 50 ms`, no con el reloj del sistema.
- Motivo: partida determinista; las pruebas avanzan tick a tick sin esperar minutos reales.
- Limitación: si el servidor se retrasa mucho, el reloj de partida también; aceptable para una partida de 2–6 jugadores.

### D19 — Resultado por abandono sin bando ganador (2026-11-13, fase 4)
- Decisión: si la partida termina por abandono (menos de 2 jugadores o se fue el último superviviente), `winner = null` y se muestra «Partida terminada».
- Motivo: la especificación pide «finalizar por abandono» y no registrar una captura ficticia; otorgar la victoria a un bando sería ambiguo. Se puede cambiar si el equipo prefiere otra regla.

### D20 — Revancha = volver a la misma sala (2026-11-13, fase 4)
- Decisión: al terminar, la sala sigue existiendo; «Volver a la sala» deja al grupo listo para que el anfitrión empiece otra partida. «Menú principal» sale de la sala.
- Alternativa: botón de revancha automática. Descartada por ahora: requiere confirmar que todos quieren seguir.

### D21 — Una captura por contacto con varios supervivientes a la vez (2026-11-13, fase 4)
- Decisión: si un monstruo toca a dos supervivientes en el mismo tick, captura a ambos. Lo que se evita es el encadenamiento: el recién transformado no captura durante 3 s.

### D22 — Hueco mínimo entre obstáculos de 52 px (2026-11-13, fase 5)
- Primer intento: 36 px (jugador de 32 px + 4). Resultado medido: 185 de 200 mapas fallaban la validación con «zonas aisladas» de 1 a 9 celdas.
- Causa: la rejilla de validación (16 px) no siempre tenía un punto dentro de pasillos tan estrechos; eran falsos aislamientos, no zonas cerradas reales.
- Alternativas probadas: 48 px (196/200 válidos), 52 px (200/200), 56 px (200/200). Alternativa no probada: rejilla de 8 px (unas 4 veces más lenta).
- Decisión: 52 px. Misma densidad de obstáculos (~124 de media), ~9 ms por mapa, y pasillos más cómodos para perseguir y huir.

### D23 — Puntos de aparición: el más lejano a los ya elegidos (2026-11-13, fase 5)
- Decisión: 400 candidatos libres (60 px alrededor sin obstáculos); se elige cada punto maximizando la distancia al más cercano ya elegido (mínimo 450 px). En la partida se reparten en orden aleatorio.
- Efecto observado: los puntos tienden a quedar cerca de los bordes y esquinas del mapa. Aceptable (el monstruo está inmóvil 5 s); se puede revisar tras jugar.

### D24 — Arbustos solo decorativos (2026-11-13, fase 5)
- Decisión: los arbustos no tienen colisión y se dibujan debajo de los jugadores.
- Motivo: ocultarse queda para el objeto «humo»/invisibilidad (fase 7); que un arbusto tape a un jugador ahora sería confuso.

### D25 — Especificación de arte antes de integrar (2026-11-13, fase 6) — APROBADA con cambios
- Elección del usuario: opción A (especificar el arte primero) frente a B (pulir la interfaz sin arte).
- Propuesta de Claude Code en `ART_STYLE.md` y `ASSET_LIST.md`, **pendiente de aprobación**: vista 3/4 con volteo horizontal, paleta con valores hexadecimales, recursos a 2× con fondo transparente, una imagen fija por personaje y animación por código.
- Motivo de la animación por código: los generadores de imagen no suelen mantener el mismo personaje entre fotogramas; así basta con una imagen coherente por personaje.
- Identidad de cada jugador con un anillo de color dibujado por código, no con 6 variantes de imagen.
- **Decisión del equipo:** vista **cenital pura con rotación** (en lugar de la 3/4 con volteo propuesta), paleta aprobada, animación por código.
- Consecuencia técnica señalada por la IA: los personajes se generan sin sombra (giraría con el sprite) y el juego la dibuja por código; los prompts se reescribieron para vista desde justo encima.
- Excepción propuesta: los iconos de interfaz, de frente, para que sean legibles a 32 px.

### D26 — Lista de imágenes publicada por el servidor y respaldo a placeholders (2026-11-13, fase 6)
- Decisión: `GET /assets-manifest.json` lista los archivos de `client/assets/` en cada petición; el cliente carga solo esos.
- Alternativa: intentar cargar todas y capturar errores. Descartada: cada imagen ausente generaría errores 404 en la consola y no se distinguirían de fallos reales.
- Ventaja: el equipo puede añadir imágenes de una en una sin tocar código ni reiniciar.

### D27 — Minimapa solo con tu bando (2026-11-13, fase 6)
- Decisión: el minimapa muestra el bosque, tu posición, la de tu mismo rol y la zona visible; no muestra a los rivales. Tecla M para ocultarlo (no choca con la tabla de controles D9).
- Motivo: mostrar a los rivales anularía el escondite y solaparía el objeto «radar» previsto en la fase 7.

### D28 — Efectos de sonido sintetizados (2026-11-13, fase 6)
- Decisión: sonidos provisionales generados con Web Audio (inicio, captura, transformación, cuenta atrás de 10 s, victoria/derrota). Volumen regulable en Ajustes.
- Motivo: sin problemas de licencia y sin archivos; hace que el control de volumen tenga efecto. Se pueden sustituir por audio definitivo.

### D29 — Ajuste «Reducir animaciones» propio del juego (2026-11-13, fase 6)
- Decisión: casilla en Ajustes, guardada en el navegador, que por defecto copia `prefers-reduced-motion` del sistema. Desactiva destellos, rebotes, balanceo, giro suave y transiciones de avisos.

### D30 — Copas de los árboles por encima de los jugadores (2026-11-13, fase 6)
- Decisión: con imagen, las copas se dibujan sobre los personajes y los tapan un poco al pasar al lado (la colisión no cambia).
- Motivo: da profundidad en vista cenital. Revisar al jugar si dificulta ver a los demás.

### D31 — El arte lo genera Claude Code con código SVG (2026-11-13, fase 6) — cambio de la especificación
- Petición del usuario (literal): «Quiero que cuando acabes todos los placeholders y tengas listo todo, generes tu las imágenes porque ChatGPT no sabe interpretar bien las peticiones.»
- Cambia §7 de la especificación, que decía que Claude Code no generaría las ilustraciones finales.
- Aclaración de la IA: Claude Code no dispone de un generador de imágenes; dibuja ilustraciones vectoriales (SVG) con código y las convierte a PNG. Encaja con el estilo aprobado (plano, vectorial), pero el resultado es más geométrico que una ilustración pintada.
- Ventajas: reproducible (mismo resultado en cada ejecución), editable (cada dibujo es una función), sin dudas de licencia (obra generada para el proyecto; el logo usa la fuente Inter, con licencia OFL).
- Script: `tools/art/build-art.cjs` (requiere Playwright). Fuentes SVG en `tools/art/svg/`.
- Revisión del equipo: se aceptan como **bocetos provisionales**, con opción a sustituirlos por arte hecho con ChatGPT. Para no perder ese arte, el script ya no sobrescribe PNG existentes salvo con `--force`.

### D32 — Diseño de la fase 7 (2026-11-13) — aprobado
- Propuesta de Claude Code, aprobada por el equipo sin cambios: sprint común (Shift), habilidades propias con Espacio (señuelo / rastreo), 5 objetos (Energía, Humo, Invisibilidad / Radar, Furia), inventario de 2 con teclas 1/2. Orden: 7a sprint, 7b habilidades, 7c objetos y móvil al final. Detalle en `docs/GAMEPLAY.md`.
- Duplicados evitados (§6): se descartan las «botas» (duplicaban el sprint); «Energía» recarga el sprint en vez de ser otro sprint; rastreo (dirección a uno) y radar (posición exacta de todos) son distintos.
- La tabla de controles D9 queda confirmada.

### D33 — Energía del sprint dentro de la función de movimiento compartida (2026-11-13, fase 7a)
- Decisión: la energía se calcula en `applyInput` (`shared/movement.js`), por entrada, igual en cliente y servidor.
- Detalle: el servidor envía la energía sin redondear. Redondearla haría que el cliente reconciliara desde un valor distinto y podría agotarse un tick antes o después que en el servidor, con pequeños tirones.
- Comprobado en navegador: corrección máxima entre predicción y servidor durante 2 s de sprint = 0 px.

### D34 — Estado personal por jugador (2026-11-13, fase 7b)
- Decisión: el servidor calcula una vez la parte común del estado y envía a cada jugador una copia con `you` (su recarga y, si es monstruo rastreando, la dirección). Antes se enviaba el mismo estado a toda la sala.
- Motivo: el rastreo solo debe verlo quien lo usa. En la 7c servirá también para no enviar a los monstruos la posición de los ocultos.
- Coste: un mensaje por jugador en lugar de uno por sala (máx. 6 por tick); asumible.

### D35 — Señuelo: indistinguible en pantalla, no en los datos (2026-11-13, fase 7b)
- Decisión: el señuelo viaja en `decoys` con su propio id y el campo `owner`. El cliente del monstruo lo dibuja idéntico al dueño; el del superviviente, translúcido y con la etiqueta «señuelo».
- Limitación conocida: alguien que inspeccione los mensajes de red podría distinguirlo. Ocultarlo del todo exigiría identificadores aleatorios para todos los jugadores en cada partida. Se acepta para un proyecto académico; no afecta a quién gana (el señuelo no captura ni puede ser capturado).
- Contraste: la invisibilidad y el humo (7c) sí se ocultarán en los datos, porque ahí la información es decisiva.

### D36 — Ocultación filtrada en el servidor (2026-11-13, fase 7c)
- Decisión: a los monstruos no se les envía la entrada de los supervivientes invisibles o dentro del humo (`personalize`). Rastreo y radar también los ignoran. La captura por contacto sigue funcionando.
- Motivo: si solo se ocultaran al dibujar, cualquiera podría leer la posición en los mensajes de red.

### D37 — Furia en la predicción del cliente (2026-11-13, fase 7c)
- Decisión: el multiplicador de furia está en la función de movimiento compartida y el cliente recibe `fury` en cada estado.
- Limitación conocida: justo cuando la furia empieza o termina, el cliente puede predecir un tick con la velocidad anterior y corregirse unos píxeles. Se acepta.

### D38 — HUD dividido en dos zonas (2026-11-13, fase 7c)
- Problema: con sprint, habilidad e inventario, el HUD superior llegaba a 4 líneas y tapaba el mapa.
- Decisión: arriba la información de la partida (rol, estado, tiempo, supervivientes, conexión, Salir); abajo la barra de acciones (habilidad, ranuras, sprint, efectos); los avisos justo encima. Márgenes de cámara ajustados a ambas zonas.

### D39 — Objetos del suelo dibujados por código (2026-11-13, fase 7c)
- Decisión: círculo azul (superviviente) o rombo rojo (monstruo) con la letra del objeto. Forma, color y letra: no depende solo del color.
- Se podrán sustituir por iconos ilustrados más adelante (pendiente en `ASSET_LIST.md`).

### D40 — Controles táctiles con eventos «pointer» en HTML (2026-11-13, fase 7)
- Decisión: joystick y botones en HTML (no en Phaser) con eventos `pointer`, que funcionan igual con dedo, ratón o lápiz. El joystick produce la misma entrada que WASD, así que el servidor no cambia.
- Detección: `(pointer: coarse)` o soporte de `ontouchstart`; en táctil se recolocan el minimapa, el HUD y la barra de acciones.
- Verificación: solo en emulación (iPhone 13, Galaxy S9+ e iPad Mini en Playwright). Según la especificación, no se afirma compatibilidad con iOS ni Android hasta probarlo en dispositivos reales.

### D41 — Desplazamiento en los menús (2026-11-13, fase 7)
- Problema encontrado al emular un móvil en horizontal: la página tenía `overflow: hidden` en todas las pantallas y el menú no cabía en 390 px de alto. No se podía llegar a «Crear sala» ni a «Unirse».
- Decisión: los menús se pueden desplazar; solo la partida es fija a pantalla completa. Además, menús compactos en pantallas bajas.
- Comprobado: todos los botones del menú son alcanzables en 4 dispositivos emulados, sin desplazamiento horizontal.

### D42 — Política de reconexión (2026-11-13, fase 8) — PROPUESTA pendiente de aprobación
- Pendiente desde la fase 1: §4 pedía proponerla «sin bloquear el MVP». La IA no la propuso hasta la revisión de la especificación en la fase 8.
- Situación actual: si se corta la conexión, el jugador sale de la partida en el acto (como al cerrar la pestaña).
- Propuesta:
  1. Al crear o unirse a una sala, el servidor da un **código de sesión** secreto que el navegador guarda (`sessionStorage`).
  2. Si alguien se desconecta **durante una partida**, su personaje se queda quieto en el mapa durante **20 s** (se le puede capturar) y los demás ven «reconectando…».
  3. Si vuelve en ese tiempo con el mismo código de sesión, recupera su personaje, rol, objetos y lugar en el resultado.
  4. Si no vuelve, se aplica la regla actual de abandono.
  5. En la sala de espera no cambia nada: salir es salir.
- Alternativa más simple: no reconectar (como ahora) y documentarlo como limitación.
- Riesgo: más estados posibles (desconectado temporalmente) que probar; ~1 día de trabajo con pruebas.

### D43 — Error en el bucle de partida: termina solo esa partida (2026-11-13, fase 8)
- Antes, un error inesperado dentro del tick habría tumbado el proceso de Node y todas las salas.
- Ahora se registra, la partida termina con motivo «error» y se avisa a sus jugadores; el resto sigue. Probado simulando un fallo.

### D13 — Versiones fijadas de dependencias (2026-11-13, fase 2)
- `express@5.1.0`, `phaser@3.90.0` (última 3.x disponible en npm), `socket.io@4.8.1` y, solo para pruebas, `socket.io-client@4.8.1`. Phaser se sirve desde `node_modules` en `/vendor/phaser`, sin CDN ni bundler.
