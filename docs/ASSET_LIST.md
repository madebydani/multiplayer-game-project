# Lista de recursos gráficos

Estados: `pendiente` → `recibido` → `integrado` → `probado`.
Herramienta prevista: ChatGPT (generación de imágenes), con revisión del equipo. Registrar aquí, al recibir cada archivo: herramienta y fecha, nº de iteraciones aproximado, criterio humano para elegirlo y cualquier retoque manual.

> **Estilo:** ver `docs/ART_STYLE.md` (propuesta pendiente de aprobación). Si el estilo cambia, ajustar los prompts antes de generar.

## Cómo generar con coherencia
1. Generar **todos los personajes en la misma conversación** de ChatGPT, y lo mismo con los elementos del bosque, para que mantenga el estilo.
2. Empezar cada petición con el **prompt base** y añadir el del recurso.
3. Pedir siempre **fondo transparente** y comprobarlo al descargar (si sale un fondo de cuadros dibujado, no es transparente).
4. Guardar con el nombre exacto de la tabla en la carpeta indicada.
5. Si hay que retocar (recortar, quitar fondo), anotarlo en «Notas».

### Prompt base (pegar al principio de cada petición)
> Recurso para un videojuego 2D de navegador llamado HUNTED, de persecución en un bosque nocturno. Estilo ilustración vectorial plana, formas redondeadas, contorno oscuro fino (#0D1410), sombras suaves, sin texturas realistas ni texto. Ambiente de misterio amable, apto para todas las edades. Vista desde arriba ligeramente inclinada (3/4). Luz desde arriba a la izquierda; sombra suave hacia abajo a la derecha. Paleta: verdes #1B2E22, #2F5A35, #5D9C59; tierra #6B5236; roca #7D8288; madera #7A4E2D. Un solo objeto, centrado, con margen alrededor, fondo transparente (PNG).

## Prioridad 1: personajes (imprescindibles)

| Archivo | Propósito | Tamaño | Transp. | Vista / anclaje | Fotogramas | Estado |
|---|---|---|---|---|---|---|
| `client/assets/characters/survivor.png` | Superviviente | 256×256 | Sí | 3/4, mira a la derecha; pies en el centro inferior del dibujo | 1 (opcional: `survivor_walk.png`, 2 fotogramas de 256×256 en fila = 512×256) | pendiente |
| `client/assets/characters/monster.png` | Monstruo | 256×256 | Sí | Igual que el superviviente | 1 (opcional: `monster_walk.png`, 512×256) | pendiente |

**Prompt superviviente:**
> Personaje superviviente: explorador joven y pequeño, cuerpo redondeado tipo chibi, gorro de lana, mochila y una linterna encendida en la mano. Ropa crema #F3E9D2 con detalles azules #4FC3F7. Expresión alerta pero simpática. Mira hacia la derecha. Ocupa unos 2/3 del lienzo de 256×256.

**Prompt monstruo:**
> Personaje monstruo: criatura del bosque más ancha que un humano, silueta con dos cuernos curvos y púas en la espalda, garras grandes, ojos amarillos brillantes (#FFE082). Cuerpo rojo #E53935 con sombras morado oscuro #4A148C. Da respeto pero es simpático, nada sangriento. Mira hacia la derecha. Ocupa unos 2/3 del lienzo de 256×256. La silueta debe distinguirse claramente de un explorador humano.

## Prioridad 2: bosque

| Archivo | Propósito | Tamaño | Transp. | Notas de integración | Estado |
|---|---|---|---|---|---|
| `client/assets/environment/tree_1.png` … `tree_3.png` | 3 variantes de árbol | 256×256 | Sí | La copa redonda debe llenar ~80 % del lienzo: el juego la escala al radio de colisión | pendiente |
| `client/assets/environment/rock_1.png`, `rock_2.png` | 2 rocas | 128×128 | Sí | Forma casi redonda (la colisión es un círculo) | pendiente |
| `client/assets/environment/bush_1.png`, `bush_2.png` | Arbustos decorativos | 128×128 | Sí | Sin colisión; más claros que los árboles | pendiente |
| `client/assets/environment/cabin.png` | Cabaña vista desde arriba | 448×320 | Sí | Rectangular (proporción ~1,4:1); el juego la estira al tamaño de cada cabaña | pendiente |
| `client/assets/environment/ground.png` | Suelo del bosque | 256×256 | **No** | **Debe repetirse sin costuras** (mosaico) | pendiente |

**Prompts del bosque** (añadir tras el prompt base):
- Árbol: «Árbol visto desde arriba: copa redonda y frondosa de pino o roble, tonos #2F5A35 y #5D9C59, ligero brillo de luna. Que no se vea el suelo alrededor. Variante 1 de 3: (redondeada / con forma de estrella de ramas / más oscura con musgo).»
- Roca: «Roca de bosque vista desde arriba, forma casi redonda, gris #7D8288 con musgo verde en un lado.»
- Arbusto: «Arbusto bajo y redondo con hojas pequeñas, verde claro #5D9C59, con unas bayas.»
- Cabaña: «Tejado de una cabaña de madera visto desde arriba, rectangular, tejas de madera #7A4E2D, chimenea pequeña, aspecto acogedor.»
- Suelo: «Textura de suelo de bosque nocturno vista desde arriba: hierba corta y hojas caídas en #1B2E22 y #2F5A35, poco contraste para no distraer. Patrón que se repite sin costuras en mosaico. Sin objetos grandes. Sin transparencia.»

## Prioridad 3: interfaz

| Archivo | Propósito | Tamaño | Transp. | Estado |
|---|---|---|---|---|
| `client/assets/ui/logo.png` | Logo «HUNTED» del menú | 1024×384 | Sí | pendiente |
| `client/assets/ui/icon_survivor.png` | Icono de rol en el HUD y en los resultados | 128×128 | Sí | pendiente |
| `client/assets/ui/icon_monster.png` | Ídem para el monstruo | 128×128 | Sí | pendiente |

**Prompts de interfaz:**
- Logo: «Logotipo de texto "HUNTED" para un juego de persecución en el bosque: letras gruesas y legibles en crema #F3E9D2 con contorno #0D1410, unas marcas de garra en la letra U y ramas o hojas decorativas. Comprueba que el texto diga exactamente HUNTED.»
- Iconos: «Icono circular sencillo, legible a 32 px: (cabeza del explorador con gorro, azul #4FC3F7) / (cabeza del monstruo con cuernos y ojos amarillos, rojo #E53935). Mismo estilo en los dos.»

## Más adelante (no generar todavía)
- Objetos y power-ups (fase 7): se especificarán cuando se aprueben las habilidades.
- Audio (pulido): recursos originales o con licencia verificada.

## Registro de recursos recibidos
| Fecha | Archivo | Herramienta | Iteraciones | Criterio de elección | Retoques | Estado |
|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — |
