# Lista de recursos gráficos

Estados: `pendiente` → `recibido` → `integrado` → `probado`.
Herramienta prevista: ChatGPT (generación de imágenes), con revisión del equipo. Registrar aquí, al recibir cada archivo: herramienta y fecha, nº de iteraciones aproximado, criterio humano para elegirlo y cualquier retoque manual.

> **Estilo:** ver `docs/ART_STYLE.md` (aprobado el 2026-11-13: vista cenital pura, animación por código). Si el estilo cambia, ajustar los prompts antes de generar.

## Integración (ya preparada en el código)
- Basta con guardar el PNG con el nombre exacto en su carpeta y recargar el juego: el servidor lo detecta solo.
- Si falta una imagen, el juego usa el placeholder. Se pueden subir de una en una.
- Variantes: si solo hay `tree_1.png`, todos los árboles la usan; si hay varias, se reparten.
- Escalado automático según el tamaño de colisión: personajes ~64 px en pantalla; árboles, rocas y arbustos según la fracción del lienzo indicada en `client/js/assets.js` (`FILL`). Si una imagen sale demasiado grande o pequeña, se ajusta ahí.
- Comprobado con imágenes de prueba dibujadas por código (no son arte del juego, se borraron): `docs/evidence/fase6-imagenes-prueba.png`.

## Cómo generar con coherencia
1. Generar **todos los personajes en la misma conversación** de ChatGPT, y lo mismo con los elementos del bosque, para que mantenga el estilo.
2. Empezar cada petición con el **prompt base** y añadir el del recurso.
3. Pedir siempre **fondo transparente** y comprobarlo al descargar (si sale un fondo de cuadros dibujado, no es transparente).
4. Guardar con el nombre exacto de la tabla en la carpeta indicada.
5. Si hay que retocar (recortar, quitar fondo), anotarlo en «Notas».
6. **Personajes:** comprobar que se reconocen al reducirlos a 64 px (en vista cenital es fácil que parezcan una mancha). Si no, pedir formas más marcadas.

### Prompt base (pegar al principio de cada petición)
> Recurso para un videojuego 2D de navegador llamado HUNTED, de persecución en un bosque nocturno. Estilo ilustración vectorial plana, formas redondeadas, contorno oscuro fino (#0D1410), sombras suaves, sin texturas realistas ni texto. Ambiente de misterio amable, apto para todas las edades. Vista cenital pura, desde justo encima. Luz desde arriba a la izquierda. Paleta: verdes #1B2E22, #2F5A35, #5D9C59; tierra #6B5236; roca #7D8288; madera #7A4E2D. Un solo objeto, centrado, con margen alrededor, fondo transparente (PNG).

## Prioridad 1: personajes (imprescindibles)

| Archivo | Propósito | Tamaño | Transp. | Vista / anclaje | Fotogramas | Estado |
|---|---|---|---|---|---|---|
| `client/assets/characters/survivor.png` | Superviviente | 256×256 | Sí | Cenital, orientado a la derecha; centro del cuerpo en el centro del lienzo (el juego rota alrededor de ese punto); sin sombra | 1 | pendiente |
| `client/assets/characters/monster.png` | Monstruo | 256×256 | Sí | Igual que el superviviente | 1 | pendiente |

**Prompt superviviente:**
> Personaje superviviente visto desde justo encima: explorador joven y pequeño, formas redondeadas. Se ven la parte superior de un gorro de lana con pompón, los hombros, una mochila en la espalda y los dos brazos; una mano sostiene una linterna que apunta hacia la derecha con un pequeño haz de luz. El frente de la cabeza mira a la derecha. Ropa crema #F3E9D2 con detalles azules #4FC3F7. Sin sombra en el suelo. Centrado, ocupa unos 2/3 del lienzo de 256×256.

**Prompt monstruo:**
> Personaje monstruo visto desde justo encima: criatura del bosque más ancha que un humano. Se ven la cabeza con dos cuernos curvos que apuntan hacia delante (a la derecha), una fila de púas a lo largo del lomo, dos brazos con garras grandes a los lados y un par de ojos amarillos brillantes (#FFE082) en la parte delantera de la cabeza. Cuerpo rojo #E53935 con zonas morado oscuro #4A148C. Da respeto pero es simpático, nada sangriento. Sin sombra en el suelo. Centrado, ocupa unos 2/3 del lienzo de 256×256. La silueta debe distinguirse claramente de la de un explorador humano.

## Prioridad 2: bosque

| Archivo | Propósito | Tamaño | Transp. | Notas de integración | Estado |
|---|---|---|---|---|---|
| `client/assets/environment/tree_1.png` … `tree_3.png` | 3 variantes de árbol | 256×256 | Sí | La copa redonda debe llenar ~80 % del lienzo: el juego la escala al radio de colisión | pendiente |
| `client/assets/environment/rock_1.png`, `rock_2.png` | 2 rocas | 128×128 | Sí | Forma casi redonda (la colisión es un círculo) | pendiente |
| `client/assets/environment/bush_1.png`, `bush_2.png` | Arbustos decorativos | 128×128 | Sí | Sin colisión; más claros que los árboles | pendiente |
| `client/assets/environment/cabin.png` | Cabaña vista desde arriba | 448×320 | Sí | Rectangular (proporción ~1,4:1); el juego la estira al tamaño de cada cabaña | pendiente |
| `client/assets/environment/ground.png` | Suelo del bosque | 256×256 | **No** | **Debe repetirse sin costuras** (mosaico) | pendiente |

**Prompts del bosque** (añadir tras el prompt base):
- Árbol: «Árbol visto desde justo encima: copa redonda y frondosa de pino o roble, tonos #2F5A35 y #5D9C59, ligero brillo de luna, sombra suave hacia abajo a la derecha. Que no se vea el suelo alrededor. Variante 1 de 3: (redondeada / con forma de estrella de ramas / más oscura con musgo).»
- Roca: «Roca de bosque vista desde justo encima, forma casi redonda, gris #7D8288 con musgo verde en un lado, sombra suave hacia abajo a la derecha.»
- Arbusto: «Arbusto bajo y redondo con hojas pequeñas, verde claro #5D9C59, con unas bayas.»
- Cabaña: «Tejado de una cabaña de madera visto desde justo encima, rectangular, tejas de madera #7A4E2D, chimenea pequeña, aspecto acogedor, sombra suave hacia abajo a la derecha.»
- Suelo: «Textura de suelo de bosque nocturno vista desde arriba: hierba corta y hojas caídas en #1B2E22 y #2F5A35, poco contraste para no distraer. Patrón que se repite sin costuras en mosaico. Sin objetos grandes. Sin transparencia.»

## Prioridad 3: interfaz

| Archivo | Propósito | Tamaño | Transp. | Estado |
|---|---|---|---|---|
| `client/assets/ui/logo.png` | Logo «HUNTED» del menú | 1024×384 | Sí | pendiente |
| `client/assets/ui/icon_survivor.png` | Icono de rol en el HUD y en los resultados | 128×128 | Sí | pendiente |
| `client/assets/ui/icon_monster.png` | Ídem para el monstruo | 128×128 | Sí | pendiente |

**Prompts de interfaz:**
- Logo: «Logotipo de texto "HUNTED" para un juego de persecución en el bosque: letras gruesas y legibles en crema #F3E9D2 con contorno #0D1410, unas marcas de garra en la letra U y ramas o hojas decorativas. Comprueba que el texto diga exactamente HUNTED.»
- Iconos: «Icono circular sencillo, legible a 32 px, vista de frente: (cara del explorador con gorro, azul #4FC3F7) / (cara del monstruo con cuernos y ojos amarillos, rojo #E53935). Mismo estilo en los dos.» (Los iconos de interfaz van de frente, no cenitales, para que se reconozcan mejor en tamaño pequeño.)

## Más adelante (no generar todavía)
- Objetos y power-ups (fase 7): se especificarán cuando se aprueben las habilidades.
- Audio (pulido): recursos originales o con licencia verificada.

## Registro de recursos recibidos
| Fecha | Archivo | Herramienta | Iteraciones | Criterio de elección | Retoques | Estado |
|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — |
