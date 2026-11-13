# Dirección artística

> **Estado: PROPUESTA pendiente de aprobación del equipo** (2026-11-13). Redactada por Claude Code a partir de los criterios de la especificación (§7). Nada de esto es definitivo hasta que el equipo lo revise.
> Los recursos finales se generan con ChatGPT y herramientas de imagen, bajo revisión humana. Claude Code solo los integra.

## Criterios fijados por la especificación (§7)
- Bosque misterioso pero agradable.
- Estética 2D ilustrada plana, sombras suaves.
- Personajes reconocibles; supervivientes y monstruos distinguibles por **forma e icono**, no solo por color.
- Contraste suficiente para legibilidad y accesibilidad.

## Propuesta

### Perspectiva
- **Vista cenital ligeramente inclinada (3/4 desde arriba)**, como en muchos juegos móviles de persecución: se ve la parte superior del personaje y un poco de su frente.
- Los personajes miran **a la derecha**; el juego los voltea al ir a la izquierda.
- Árboles, rocas y cabañas vistos desde arriba con la misma inclinación, con una sombra suave proyectada hacia **abajo a la derecha** (luz desde arriba a la izquierda) en todos los recursos.

### Estilo
- Ilustración vectorial plana, formas redondeadas y simples, contorno oscuro fino (2–3 px a tamaño final), sin texturas fotorrealistas ni degradados complejos.
- Tono «misterio amable»: noche de luna en el bosque, sin gore ni elementos de terror explícito. El monstruo debe dar respeto pero ser simpático (apto para todas las edades).
- Siluetas muy diferentes: el **superviviente** es pequeño, redondeado, con mochila y linterna; el **monstruo** es más ancho, con cuernos/púas, ojos brillantes y garras. Deben distinguirse incluso en blanco y negro.

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

### Animación
Los generadores de imagen tienen dificultades para mantener el mismo personaje en varios fotogramas. Por eso:
- **Mínimo necesario:** una imagen fija por personaje. El juego añade por código balanceo al andar, giro izquierda/derecha, aparición, destello de transformación y translucidez durante el bloqueo.
- **Opcional:** 2 fotogramas de paso por personaje, solo si salen coherentes.

### Identidad de cada jugador
No hace falta una imagen por color: el juego dibuja un **anillo de color bajo los pies** y el nombre encima. El rol se reconoce por el dibujo (superviviente o monstruo) y por el icono ●/★.

## Pendiente de aprobar
1. ¿Vista 3/4 con volteo, o cenital pura con rotación del sprite?
2. ¿La paleta y el tono «misterio amable»?
3. ¿Animación por código (recomendado) o fotogramas dibujados?
