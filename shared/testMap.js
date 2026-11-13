// Mapa FIJO de prueba para la fase 2 (prototipo local).
// Se sustituirá por el mapa procedural del servidor en la fase 5.
import { MAP_WIDTH, MAP_HEIGHT } from './config.js';
import { overlaps } from './collision.js';

export function createTestMap() {
  // Rocas y una cabaña rectangular (para probar colisiones con rectángulos).
  const fixed = [
    { shape: 'circle', kind: 'rock', x: 1500, y: 700, r: 34 },
    { shape: 'circle', kind: 'rock', x: 640, y: 1300, r: 28 },
    { shape: 'circle', kind: 'rock', x: 1900, y: 1400, r: 40 },
    { shape: 'rect', kind: 'cabin', x: 1380, y: 1040, w: 200, h: 140 },
  ];
  const obstacles = [...fixed];

  // Árboles: cuadrícula con desplazamientos fijos para que no parezca regular.
  const offsets = [0, 37, -22, 51, -45, 18, -9, 29];
  let k = 0;
  for (let gx = 200; gx < MAP_WIDTH - 100; gx += 260) {
    for (let gy = 180; gy < MAP_HEIGHT - 100; gy += 240) {
      const ox = offsets[k % offsets.length];
      const oy = offsets[(k + 3) % offsets.length];
      k++;
      // Deja libre el centro (zona de aparición) y un camino horizontal.
      if (Math.abs(gx - MAP_WIDTH / 2) < 220 && Math.abs(gy - MAP_HEIGHT / 2) < 220) continue;
      if (Math.abs(gy + oy - MAP_HEIGHT / 2) < 70) continue;
      const tree = { shape: 'circle', kind: 'tree', x: gx + ox, y: gy + oy, r: 26 + (k % 3) * 6 };
      // Descarta el árbol si choca con una roca o la cabaña (con margen).
      if (fixed.some((ob) => overlaps(tree.x, tree.y, tree.r + 20, ob))) continue;
      obstacles.push(tree);
    }
  }

  return {
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    spawn: { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 },
    // Camino decorativo (sin colisión).
    paths: [{ x: 0, y: MAP_HEIGHT / 2 - 40, w: MAP_WIDTH, h: 80 }],
    obstacles,
  };
}
