# HUNTED

Videojuego multijugador online en navegador, 2D top-down, de persecución e infección.
Un jugador empieza como monstruo; cada superviviente capturado se transforma en monstruo.
Los supervivientes ganan si queda al menos uno cuando se acaba el tiempo.

> **Estado:** fase 6. Juego completo con arte integrado (pendiente de revisión del equipo). Ver `docs/PROJECT_STATUS.md`.

## Tecnologías
- Cliente: HTML5, CSS3, JavaScript (ES modules), Phaser 3.
- Servidor: Node.js, Express, Socket.IO (servidor autoritativo).
- Código compartido cliente/servidor en `shared/` (configuración, colisiones, eventos).

## Requisitos
- Node.js 18 o superior y npm (probado con Node 22).
- Navegador de escritorio actual.

## Instalación y ejecución
```bash
npm install
```
```bash
npm start
```
Abrir `http://localhost:3000`, escribir un nombre y **Crear sala**. Los demás se unen con el código de 4 caracteres. El anfitrión elige la duración y pulsa **Empezar partida** (mínimo 2 jugadores, máximo 6). Puerto configurable con la variable `PORT`.

| Tecla | Acción |
|---|---|
| WASD o flechas | Moverse |
| Shift | Sprint (barra de energía en el HUD) |
| Espacio | Habilidad: señuelo (superviviente) o rastreo (monstruo) |
| M | Mostrar u ocultar el minimapa |

En **Ajustes** se regula el volumen y se pueden reducir las animaciones (por defecto sigue la preferencia del sistema operativo).

## Pruebas
```bash
npm test
```
Pruebas en navegador con dos jugadores (con el servidor arrancado; requieren Playwright instalado):
```bash
node test/e2e/two-browsers.cjs
```
```bash
node test/e2e/ui.cjs
```

## Jugar en red local (dos ordenadores)
1. En el ordenador servidor: `npm start`. La consola muestra la dirección para la red local (p. ej. `http://192.168.1.20:3000`).
2. En el otro ordenador (misma red): abrir esa dirección en el navegador.
3. Si no conecta, permitir Node.js en el cortafuegos del ordenador servidor.

*Pendiente de verificar con dos ordenadores reales.*

## Reglas (resumen)
- 2–6 jugadores por sala; el anfitrión inicia la partida (duración por defecto 5 min).
- El servidor elige un monstruo inicial al azar; queda inmóvil 5 s al empezar.
- Captura por proximidad (40 px) validada por el servidor; el capturado se transforma.
- Un monstruo recién transformado no puede capturar durante 3 s.
- Ganan los monstruos si no queda ningún superviviente; ganan los supervivientes si el tiempo llega a cero.
- Superviviente = círculo de color; monstruo = estrella roja (translúcida mientras no puede capturar).
- Desconexiones: si quedan menos de 2 jugadores o se va el último superviviente, la partida termina por abandono; si se va el único monstruo, un superviviente al azar pasa a ser monstruo.
- Al terminar se muestra el bando ganador, el motivo, la duración y qué fue de cada jugador. «Volver a la sala» permite jugar otra partida con el mismo grupo.

Detalle completo: `docs/HUNTED_SPEC.md` y `docs/DECISIONS.md`.

## Arquitectura
```
server/index.js    Express + Socket.IO: conecta los eventos con salas y partidas
server/rooms.js    salas: códigos, unirse, anfitrión, salir (sin Socket.IO, testeable)
server/match.js    simulación autoritativa de la partida a 20 ticks/s
server/mapgen.js   generación y validación del bosque procedural
shared/config.js   velocidades, radios, tiempos
shared/collision.js, movement.js   movimiento y colisiones (cliente y servidor)
shared/events.js   nombres de los eventos de red (y qué datos lleva cada uno)
shared/testMap.js  mapa fijo usado solo por las pruebas automáticas
client/index.html  menú y sala (HTML) + partida (Phaser)
client/js/         main.js (pantallas), net.js (Socket.IO), scenes/GameScene.js,
                   assets.js (imágenes), settings.js (ajustes), sound.js (efectos)
test/              node:test (unidad e integración) y e2e/ (Playwright)
```

### Cómo se genera el mapa
1. Al empezar cada partida, el servidor elige una **semilla** aleatoria; con la misma semilla siempre sale el mismo bosque.
2. Traza dos caminos sinuosos y coloca cabañas, rocas y árboles al azar, descartando los que quedarían a menos de 52 px de otro obstáculo, del borde o encima de un camino. Como un jugador mide 32 px, siempre cabe por cualquier hueco.
3. Elige 6 puntos de aparición libres y lo más separados posible.
4. **Valida** el mapa con una búsqueda en anchura sobre una rejilla de 16 px: todo el terreno libre debe estar conectado. Si falla, prueba con la semilla siguiente.
5. Envía a los clientes la **lista final** de obstáculos (no solo la semilla), así todos ven exactamente lo mismo.

### Arte e imágenes
Las ilustraciones actuales son **bocetos provisionales** dibujados con código vectorial en `tools/art/build-art.cjs` (fuentes SVG en `tools/art/svg/`) y exportados a PNG en `client/assets/`. Para sustituir una por arte definitivo, basta con reemplazar el PNG manteniendo el nombre y el tamaño de `docs/ASSET_LIST.md`.

Para regenerar los bocetos (requiere Playwright). Por defecto no sobrescribe los PNG que ya existen:
```bash
node tools/art/build-art.cjs --force
```
El servidor publica qué imágenes existen (`/assets-manifest.json`) y el juego usa las que encuentre; si falta alguna, la dibuja con formas geométricas provisionales.

### Cómo funciona el multijugador
1. Cada cliente envía 20 veces por segundo solo **qué teclas pulsa** (`input`).
2. El servidor mueve a cada jugador con las mismas reglas de colisión y envía el **estado** a toda la sala (`state`).
3. El cliente mueve a su jugador al instante (**predicción**) y lo corrige con el estado del servidor (**reconciliación**).
4. A los demás jugadores los dibuja 100 ms en el pasado, entre dos estados recibidos (**interpolación**).
5. El servidor limita cuántas entradas procesa por jugador, así que no se puede ir más rápido enviando más mensajes.

## Documentación
| Archivo | Contenido |
|---|---|
| `docs/HUNTED_SPEC.md` | Especificación original (literal) |
| `docs/REQUIREMENTS.md` | Requisitos académicos y su estado |
| `docs/DECISIONS.md` | Decisiones de diseño y alternativas |
| `docs/GAMEPLAY.md` | Controles, sprint, habilidades y objetos (fase 7) |
| `docs/DEVELOPMENT_LOG.md` | Diario de desarrollo con IA |
| `docs/PROMPT_EVIDENCE.md` | Prompts relevantes y respuestas de la IA |
| `docs/PROJECT_STATUS.md` | Estado actual y siguiente fase |
| `docs/ART_STYLE.md` | Criterios de dirección artística |
