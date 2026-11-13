# HUNTED

Videojuego multijugador online en navegador, 2D top-down, de persecución e infección.
Un jugador empieza como monstruo; cada superviviente capturado se transforma en monstruo.
Los supervivientes ganan si queda al menos uno cuando se acaba el tiempo.

> **Estado:** fase 1 (planificación). Aún no hay código jugable. Ver `docs/PROJECT_STATUS.md`.

## Tecnologías
- Cliente: HTML5, CSS3, JavaScript (ES modules), Phaser 3.
- Servidor: Node.js, Express, Socket.IO (servidor autoritativo).
- Código compartido cliente/servidor en `shared/` (configuración, colisiones, eventos).

## Requisitos
- Node.js 18 o superior y npm. *(Pendiente de concretar en fase 2.)*

## Instalación y ejecución
*Pendiente (fase 2).* Se documentará `npm install` y `npm start`.

## Jugar en red local (dos ordenadores)
*Pendiente (fase 3).* Un PC ejecuta el servidor; el otro abre `http://<IP-local>:<puerto>`.

## Reglas (resumen)
- 2–6 jugadores por sala; el anfitrión inicia la partida (duración por defecto 5 min).
- El servidor elige un monstruo inicial al azar; queda inmóvil 5 s al empezar.
- Captura por proximidad (40 px) validada por el servidor; el capturado se transforma.
- Un monstruo recién transformado no puede capturar durante 3 s.
- Ganan los monstruos si no queda ningún superviviente; ganan los supervivientes si el tiempo llega a cero.

Detalle completo: `docs/HUNTED_SPEC.md` y `docs/DECISIONS.md`.

## Arquitectura prevista
```
server/   Express + Socket.IO: salas, bucle de partida, generación de mapa
shared/   config.js, collision.js, events.js (usados por cliente y servidor)
client/   index.html, css/, js/ (escenas Phaser, red), assets/
test/     node:test y Playwright
docs/     especificación, requisitos, diario y decisiones
```

## Documentación
| Archivo | Contenido |
|---|---|
| `docs/HUNTED_SPEC.md` | Especificación original (literal) |
| `docs/REQUIREMENTS.md` | Requisitos académicos y su estado |
| `docs/DECISIONS.md` | Decisiones de diseño y alternativas |
| `docs/DEVELOPMENT_LOG.md` | Diario de desarrollo con IA |
| `docs/PROMPT_EVIDENCE.md` | Prompts relevantes y respuestas de la IA |
| `docs/PROJECT_STATUS.md` | Estado actual y siguiente fase |
| `docs/ART_STYLE.md` | Criterios de dirección artística |
