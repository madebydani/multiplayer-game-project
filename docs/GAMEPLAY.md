# Mecánicas ampliadas (fase 7)

> Diseño **aprobado por el equipo** el 2026-11-13 (preguntas de opción múltiple: «Sí, tal cual», «Los 5 objetos», «Mejoras por partes»).
> Todos los valores están en `shared/config.js` para ajustarlos tras jugar.
> Regla general: **el servidor decide todo** (energía, recargas, recogida de objetos, efectos). El cliente solo envía las teclas pulsadas y dibuja lo que recibe.

## Controles

| Tecla | Acción | Desde |
|---|---|---|
| WASD / flechas | Moverse | fase 2 |
| Shift | Sprint (mientras se mantenga pulsado) | 7a |
| Espacio | Habilidad propia del rol | 7b |
| 1 / 2 | Usar el objeto de la ranura 1 / 2 | 7c |
| M | Mostrar u ocultar el minimapa | fase 6 |

Ninguna tecla tiene dos acciones.

### Controles táctiles (móvil / tableta, implementados al final de la fase 7)
| Control | Equivale a |
|---|---|
| Joystick (abajo a la izquierda) | WASD, 8 direcciones (zona muerta del 30 %) |
| Botón «Sprint» (mantener pulsado) | Shift |
| Botón «Habilidad» | Espacio |
| Botones «1» y «2» | Teclas 1 y 2 |

Solo aparecen en pantallas táctiles. En vertical se pide girar el dispositivo. **Probado solo en móviles emulados en Chromium; pendiente de probar en dispositivos reales (iOS y Android).**

## 7a — Sprint (ambos bandos)

| Aspecto | Valor |
|---|---|
| Efecto | ×1,4 de velocidad mientras se mantiene Shift y se avanza |
| Energía | 2 s de sprint continuo con la barra llena |
| Recarga | De vacía a llena en 6 s, siempre que no se esté esprintando |
| Límite | Si la energía llega a 0, hay que esperar a recuperar el 25 % para volver a esprintar (evita parpadeos de velocidad) |
| No funciona | Con el monstruo inicial congelado |
| Cómo se ve | Tu barra de energía en el HUD, con porcentaje en texto. A los demás: el personaje se balancea más rápido |

## 7b — Habilidades propias (Espacio)

### Superviviente: Señuelo
| Aspecto | Valor |
|---|---|
| Efecto | Aparece una copia falsa en tu posición que sigue andando en la dirección en la que ibas (choca con los obstáculos como un jugador) |
| Duración | 4 s |
| Recarga | 15 s |
| Límites | 1 señuelo a la vez; no puede capturar ni ser capturado; los monstruos lo ven exactamente igual que a un superviviente (mismo dibujo, nombre y anillo) |
| Cómo se ve | Para ti y los supervivientes: translúcido con la etiqueta «señuelo». Para los monstruos: idéntico a ti. Al acabar, desaparece con un «puf» |

### Monstruo: Rastreo
| Aspecto | Valor |
|---|---|
| Efecto | Flecha alrededor del monstruo que apunta al superviviente más cercano. Solo la dirección, no la distancia |
| Duración | 3 s (la flecha se actualiza mientras dura) |
| Recarga | 20 s |
| Límites | No detecta a supervivientes invisibles ni dentro del humo; ignora los señuelos |
| Cómo se ve | Solo lo ve el monstruo que lo usa |

## 7c — Objetos en el mapa (teclas 1 / 2)

| Aspecto | Valor |
|---|---|
| Aparición | El servidor los coloca en puntos libres al azar: 3 al empezar y 1 más cada 20 s, con un máximo de 6 a la vez |
| Recogida | Pasando por encima. El servidor comprueba la distancia y que haya hueco en el inventario. Desaparece para todos |
| Inventario | 2 ranuras. Si están llenas, no se recoge |
| Quién recoge qué | Cada objeto es de un bando; el otro bando lo ve, pero no puede cogerlo |
| Transformación | Si capturan a un superviviente, pierde sus objetos de superviviente |

| Bando | Objeto | Efecto | Duración |
|---|---|---|---|
| Superviviente | Energía | Llena la barra de sprint al instante | — |
| Superviviente | Humo | Nube de 120 px de radio en tu posición: los supervivientes dentro no son visibles para los monstruos | 5 s |
| Superviviente | Invisibilidad | Invisible para los monstruos; se te puede capturar si te tocan | 4 s |
| Monstruo | Radar | Todos los supervivientes visibles aparecen en tu minimapa con su posición exacta | 3 s |
| Monstruo | Furia | ×1,2 de velocidad (se suma al sprint) | 5 s |

### Ocultación segura
Para que el humo y la invisibilidad no se puedan saltar leyendo los datos de red, **el servidor no envía a los monstruos la posición de los supervivientes ocultos**. A partir de la 7c cada jugador recibe su propio estado filtrado, no un estado común para todos.

### Cómo se ve
- Objetos en el suelo: iconos de 32 px con la forma y el color del bando, más una letra (E, H, I, R, F) para no depender del color.
- Inventario en el HUD: 2 ranuras con icono, nombre y tecla.
- Efectos activos: barra con el tiempo restante.
- Humo: nube gris semitransparente, visible para todos. Los monstruos no ven lo que hay dentro.
- Invisible: tú te ves translúcido. Los monstruos no te ven. Los supervivientes te ven translúcido.
