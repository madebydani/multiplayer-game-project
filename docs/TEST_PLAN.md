# Plan de pruebas manuales (entrega)

Las pruebas automáticas están descritas en el README (`npm test`, `test/e2e/`, `test/stress.mjs`). Este documento cubre lo que **solo puede comprobar el equipo**: dos ordenadores reales, sensaciones de juego y dispositivos reales.

Para cada prueba: marcar ✅ / ❌, anotar observaciones y, si se puede, guardar captura o vídeo en `docs/evidence/`. Si algo falla, anotarlo tal cual: el profesor valora el proceso, también los fallos.

## Datos de la sesión de prueba
| Campo | Valor |
|---|---|
| Fecha | |
| Personas | |
| Ordenador servidor (SO, navegador) | |
| Ordenador cliente (SO, navegador) | |
| Red (casa, clase, wifi, cable) | |
| Dirección usada (p. ej. `http://192.168.1.20:3000`) | |

## 0. Preparación (ordenador servidor)
1. `npm install` y después `npm start`.
2. Apuntar la línea «Desde otro ordenador de la red: http://…».
3. Si el otro ordenador no conecta: permitir Node.js en el cortafuegos (Windows: aviso al arrancar o «Firewall de Windows Defender → Permitir una aplicación»). Comprobar que ambos están en la misma red y que no es una red de invitados que aísla dispositivos.

## 1. Requisito académico: dos máquinas en la misma partida
| # | Prueba | Resultado esperado | ✅/❌ | Observaciones |
|---|---|---|---|---|
| 1.1 | El cliente abre la dirección del servidor | Se ve el menú de HUNTED | | |
| 1.2 | PC1 crea sala; PC2 se une con el código | Ambos ven los 2 nombres; solo el anfitrión ve «Empezar» | | |
| 1.3 | El anfitrión elige 3 min y empieza | Ambos entran con el mismo mapa (comparar visualmente árboles, cabañas y caminos) | | |
| 1.4 | Ambos se mueven | Cada uno ve al otro moverse con fluidez, sin tirones ni saltos | | |
| 1.5 | Indicador de conexión | Anotar los ms en ambos: ______ / ______ | | |
| 1.6 | El monstruo captura al superviviente | Transformación visible en ambos; pantalla de resultados igual en ambos | | |
| 1.7 | «Volver a la sala» → otra partida | Mapa distinto al anterior | | |
| 1.8 | Partida de 3 min sin capturas | Ganan los supervivientes al llegar a 0:00, en ambos | | |
| 1.9 | Un jugador cierra la pestaña en mitad de la partida | El otro ve «Partida terminada por abandono» | | |

## 2. Reglas y mecánicas
| # | Prueba | Resultado esperado | ✅/❌ | Observaciones |
|---|---|---|---|---|
| 2.1 | Monstruo inicial | Inmóvil 5 s; HUD «Inmóvil N s» | | |
| 2.2 | Recién transformado | 3 s sin poder capturar (se ve translúcido) | | |
| 2.3 | Sprint (Shift) | Más rápido; barra que se vacía en 2 s y se recarga | | |
| 2.4 | Señuelo (Espacio, superviviente) | El monstruo lo ve igual que al jugador | | |
| 2.5 | Rastreo (Espacio, monstruo) | Flecha hacia el superviviente; solo la ve el monstruo | | |
| 2.6 | Objetos (1/2) | Recoger, usar; humo e invisibilidad ocultan al superviviente para el monstruo | | |
| 2.7 | Con 3 o más jugadores (si es posible) | Varias capturas; contador de supervivientes correcto | | |

## 3. Interfaz, accesibilidad y sonido
| # | Prueba | Resultado esperado | ✅/❌ | Observaciones |
|---|---|---|---|---|
| 3.1 | Sonido | Se oyen inicio, captura, cuenta atrás y victoria/derrota | | |
| 3.2 | Volumen a 0 | Silencio | | |
| 3.3 | «Reducir animaciones» | Sin destellos ni rebotes | | |
| 3.4 | Botón «Copiar código» | El código se pega bien en otro sitio | | |
| 3.5 | Navegar el menú solo con teclado (Tab, Enter) | Se puede crear y unirse sin ratón | | |
| 3.6 | Minimapa (M) | Se oculta y se muestra | | |

## 4. Móvil o tableta real (opcional; necesario para afirmar compatibilidad)
| # | Prueba | Resultado esperado | ✅/❌ | Dispositivo / navegador |
|---|---|---|---|---|
| 4.1 | Abrir la dirección en el móvil (misma wifi) | Menú legible; se llega a todos los botones | | |
| 4.2 | Jugar en horizontal | Joystick y botones responden; nada tapa al jugador | | |
| 4.3 | Girar a vertical | Aviso «Gira el dispositivo» | | |

## 5. Sensaciones de juego (para ajustar `shared/config.js`)
| Pregunta | Respuesta |
|---|---|
| ¿Es justo el equilibrio monstruo/superviviente (velocidades 200/210)? | |
| ¿La densidad del bosque es buena? | |
| ¿Los puntos de aparición están bien repartidos? | |
| ¿2 s de sprint son pocos o demasiados? | |
| ¿Aparecen demasiados o muy pocos objetos? | |
| ¿Las copas de los árboles tapan demasiado a los jugadores? | |
