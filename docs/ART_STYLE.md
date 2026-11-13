# Dirección artística

> **Estado: APROBADO por el equipo** (2026-11-13), con un cambio respecto a la propuesta inicial: vista cenital pura en lugar de 3/4. Redactado por Claude Code a partir de los criterios de la especificación (§7) y las respuestas del equipo.
> **Cambio de reparto (2026-11-13, decisión del equipo):** el arte ya no se genera con ChatGPT; lo dibuja Claude Code con código vectorial (SVG → PNG) en `tools/art/build-art.cjs`, siguiendo este estilo. Ver `DECISIONS.md`, D31.

## Criterios fijados por la especificación (§7)
- Bosque misterioso pero agradable.
- Estética 2D ilustrada plana, sombras suaves.
- Personajes reconocibles; supervivientes y monstruos distinguibles por **forma e icono**, no solo por color.
- Contraste suficiente para legibilidad y accesibilidad.

## Estilo aprobado

### Perspectiva
- **Vista cenital pura**: todo se ve desde justo encima (cabeza, hombros, mochila; copas de árboles; tejados).
- Los personajes se dibujan **orientados hacia la derecha** (el frente de la cabeza apunta a la derecha). El juego **rota** el sprite hacia la dirección en que se mueve, en las 8 direcciones.
- **Los personajes no llevan sombra dibujada**: si la tuvieran, giraría con ellos. El juego dibuja por código una sombra suave bajo cada personaje.
- Árboles, rocas, arbustos y cabañas no giran: llevan una sombra suave hacia **abajo a la derecha** (luz desde arriba a la izquierda).

### Estilo
- Ilustración vectorial plana, formas redondeadas y simples, contorno oscuro fino (2–3 px a tamaño final), sin texturas fotorrealistas ni degradados complejos.
- Tono «misterio amable»: noche de luna en el bosque, sin gore ni elementos de terror explícito. El monstruo debe dar respeto pero ser simpático (apto para todas las edades).
- Siluetas muy diferentes vistas desde arriba: el **superviviente** es pequeño y redondeado (gorro, mochila, haz de linterna hacia delante); el **monstruo** es más ancho, con cuernos que sobresalen hacia delante, púas en el lomo y garras a los lados. Deben distinguirse incluso en blanco y negro y a 64 px.

### Paleta (valores hexadecimales para pegar en los prompts)
| Uso | Color |
|---|---|
| Suelo del bosque (oscuro) | `#1B2E22` |
| Vegetación media | `#2F5A35` |
| Vegetación clara / reflejos de luna | `#5D9C59` |
| Tierra de caminos | `#6B5236` |
| Roca | `#7D8288` |
| Madera de cabañas | `#7A4E2D` |
| Superviviente (ropa) | crema `#F3E9D2` y azul `#4FC3F7` |
| Monstruo | rojo `#E53935`, morado oscuro `#4A148C`, ojos amarillos `#FFE082` |
| Contornos | casi negro `#0D1410` |

### Tamaños y escala
- En el juego, el jugador ocupa **32 px** de diámetro de colisión; el dibujo se mostrará a unos **56–64 px**.
- **Generar a 2× o más** (p. ej. 256×256 para personajes) y dejar que el juego reduzca: se ve más nítido.
- Todos los objetos con **fondo transparente (PNG)**, centrados, sin recortar bordes y con un poco de margen.

### Animación (aprobado: por código)
Los generadores de imagen tienen dificultades para mantener el mismo personaje en varios fotogramas. Por eso:
- Una imagen fija por personaje. El juego añade por código: rotación hacia la dirección de movimiento, balanceo y leve «respiración» al andar, sombra, aparición, destello de transformación y translucidez durante el bloqueo.
- Fotogramas dibujados: descartados por ahora.

### Identidad de cada jugador
No hace falta una imagen por color: el juego dibuja un **anillo de color bajo los pies** y el nombre encima. El rol se reconoce por el dibujo (superviviente o monstruo) y por el icono ●/★.

## Decisiones del equipo (2026-11-13)
1. Vista: **cenital pura** con rotación del sprite (la propuesta era 3/4 con volteo).
2. Paleta y tono «misterio amable»: **aprobados**.
3. Animación: **por código**, como se recomendó.
