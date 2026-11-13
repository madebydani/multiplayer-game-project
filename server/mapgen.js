// Generación procedural del bosque (solo en el servidor).
// El servidor genera el mapa, lo valida y envía la LISTA FINAL de obstáculos a
// los clientes (ver docs/DECISIONS.md, D3): todos dibujan exactamente lo mismo.
import { MAP_WIDTH, MAP_HEIGHT, PLAYER_RADIUS, MAX_PLAYERS } from '../shared/config.js';
import { overlaps } from '../shared/collision.js';

// Hueco mínimo entre obstáculos (y con el borde): cabe un jugador (32 px) con
// 20 px de margen. Así ningún grupo de obstáculos puede encerrar una zona y la
// rejilla de validación (16 px) siempre tiene una celda dentro de cada pasillo.
// Con 36 px el 92 % de los mapas daba falsos "aislados" (ver DECISIONS.md, D22).
export const MIN_GAP = PLAYER_RADIUS * 2 + 20;
const PATH_WIDTH = 70;
const GRID = 16; // tamaño de celda para comprobar la conectividad
const SPAWN_CLEARANCE = 60; // espacio libre alrededor de cada punto de aparición
const SPAWN_MIN_DISTANCE = 450; // distancia mínima entre puntos de aparición

/** Generador pseudoaleatorio con semilla (mulberry32): misma semilla → mismos números. */
export function createRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Genera un mapa válido. Si una semilla no da un mapa válido (muy improbable),
 * prueba con la siguiente; `attempts` indica cuántas hicieron falta.
 */
export function generateMap(seed, { width = MAP_WIDTH, height = MAP_HEIGHT } = {}) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const map = tryGenerate(seed + attempt, width, height);
    const check = validateMap(map);
    if (check.ok) return { ...map, attempts: attempt + 1 };
  }
  throw new Error(`No se pudo generar un mapa válido a partir de la semilla ${seed}`);
}

export function tryGenerate(seed, width, height) {
  const rnd = createRandom(seed);
  const range = (min, max) => min + rnd() * (max - min);

  // 1. Caminos: uno horizontal y otro vertical, con curvas aleatorias.
  const paths = [
    makePath(rnd, { from: { x: 0, y: range(0.3, 0.7) * height }, to: { x: width, y: range(0.3, 0.7) * height } }, height),
    makePath(rnd, { from: { x: range(0.25, 0.75) * width, y: 0 }, to: { x: range(0.25, 0.75) * width, y: height } }, width),
  ];

  const obstacles = [];
  const fits = (ob) =>
    insideWithGap(ob, width, height) &&
    !obstacles.some((o) => tooClose(ob, o)) &&
    !paths.some((p) => nearPath(ob, p));

  // 2. Cabañas (rectángulos), pocas y grandes: se colocan primero.
  const cabins = Math.floor(range(1, 4));
  for (let i = 0, tries = 0; i < cabins && tries < 200; tries++) {
    const w = Math.round(range(150, 220));
    const h = Math.round(range(110, 160));
    const ob = { shape: 'rect', kind: 'cabin', x: Math.round(range(0, width - w)), y: Math.round(range(0, height - h)), w, h };
    if (fits(ob)) {
      obstacles.push(ob);
      i++;
    }
  }

  // 3. Rocas y árboles: muestreo por rechazo (se descartan los que no caben).
  const place = (kind, count, rMin, rMax) => {
    for (let i = 0, tries = 0; i < count && tries < count * 30; tries++) {
      const r = Math.round(range(rMin, rMax));
      const ob = { shape: 'circle', kind, x: Math.round(range(r, width - r)), y: Math.round(range(r, height - r)), r };
      if (fits(ob)) {
        obstacles.push(ob);
        i++;
      }
    }
  };
  place('rock', Math.floor(range(10, 18)), 18, 36);
  place('tree', Math.floor(range(90, 130)), 22, 40);

  // 4. Arbustos: solo decoración (no tienen colisión), fuera de los caminos.
  const decor = [];
  for (let i = 0, tries = 0; i < 60 && tries < 600; tries++) {
    const d = { kind: 'bush', x: Math.round(range(20, width - 20)), y: Math.round(range(20, height - 20)), r: Math.round(range(12, 22)) };
    const ob = { shape: 'circle', ...d };
    if (!obstacles.some((o) => overlapsShape(ob, o, 4)) && !paths.some((p) => nearPath(ob, p))) {
      decor.push(d);
      i++;
    }
  }

  const map = { seed, width, height, paths, obstacles, decor, spawns: [] };
  map.spawns = pickSpawns(map, rnd);
  return map;
}

/** Camino sinuoso: puntos intermedios con desviación aleatoria. */
function makePath(rnd, { from, to }, crossSize) {
  const points = [from];
  const segments = 6;
  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const jitter = (rnd() - 0.5) * crossSize * 0.25;
    const horizontal = from.x === 0;
    points.push({
      x: Math.round(from.x + (to.x - from.x) * t + (horizontal ? 0 : jitter)),
      y: Math.round(from.y + (to.y - from.y) * t + (horizontal ? jitter : 0)),
    });
  }
  points.push(to);
  return { width: PATH_WIDTH, points };
}

// ---------- Geometría auxiliar ----------

function bounds(ob) {
  return ob.shape === 'circle'
    ? { x1: ob.x - ob.r, y1: ob.y - ob.r, x2: ob.x + ob.r, y2: ob.y + ob.r }
    : { x1: ob.x, y1: ob.y, x2: ob.x + ob.w, y2: ob.y + ob.h };
}

function insideWithGap(ob, width, height) {
  const b = bounds(ob);
  return b.x1 >= MIN_GAP && b.y1 >= MIN_GAP && b.x2 <= width - MIN_GAP && b.y2 <= height - MIN_GAP;
}

/** ¿Están a menos de MIN_GAP? */
export function tooClose(a, b) {
  return overlapsShape(a, b, MIN_GAP);
}

/** ¿Se solapan dos obstáculos ampliando el primero en `margin`? */
function overlapsShape(a, b, margin) {
  if (a.shape === 'circle') return overlaps(a.x, a.y, a.r + margin, b);
  if (b.shape === 'circle') return overlaps(b.x, b.y, b.r + margin, a);
  // rectángulo contra rectángulo
  return !(a.x + a.w + margin <= b.x || b.x + b.w + margin <= a.x || a.y + a.h + margin <= b.y || b.y + b.h + margin <= a.y);
}

function nearPath(ob, path) {
  const b = bounds(ob);
  const cx = (b.x1 + b.x2) / 2;
  const cy = (b.y1 + b.y2) / 2;
  const radius = Math.hypot(b.x2 - b.x1, b.y2 - b.y1) / 2;
  for (let i = 0; i < path.points.length - 1; i++) {
    if (distToSegment(cx, cy, path.points[i], path.points[i + 1]) < radius + path.width / 2) return true;
  }
  return false;
}

function distToSegment(px, py, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / len2));
  return Math.hypot(px - (a.x + t * dx), py - (a.y + t * dy));
}

// ---------- Puntos de aparición ----------

/** Elige MAX_PLAYERS puntos libres, bien separados (el más lejano a los ya elegidos). */
function pickSpawns(map, rnd) {
  const candidates = [];
  for (let i = 0; i < 400; i++) {
    const x = Math.round(SPAWN_CLEARANCE + rnd() * (map.width - 2 * SPAWN_CLEARANCE));
    const y = Math.round(SPAWN_CLEARANCE + rnd() * (map.height - 2 * SPAWN_CLEARANCE));
    if (!map.obstacles.some((ob) => overlaps(x, y, SPAWN_CLEARANCE, ob))) candidates.push({ x, y });
  }
  if (candidates.length === 0) return [];
  const spawns = [candidates[0]];
  while (spawns.length < MAX_PLAYERS) {
    let best = null;
    let bestDist = -1;
    for (const c of candidates) {
      const d = Math.min(...spawns.map((s) => Math.hypot(s.x - c.x, s.y - c.y)));
      if (d > bestDist) {
        best = c;
        bestDist = d;
      }
    }
    if (bestDist < SPAWN_MIN_DISTANCE) break; // no hay más puntos suficientemente separados
    spawns.push(best);
  }
  return spawns;
}

// ---------- Validación ----------

/**
 * Comprueba que el mapa es jugable:
 *  - ningún obstáculo se solapa ni queda a menos de MIN_GAP de otro;
 *  - hay MAX_PLAYERS puntos de aparición libres y separados;
 *  - TODO el terreno libre está conectado (BFS en una rejilla), así que nadie
 *    puede quedar atrapado y todos los puntos de aparición se alcanzan entre sí.
 */
export function validateMap(map) {
  const { obstacles, spawns } = map;
  for (let i = 0; i < obstacles.length; i++) {
    if (!insideWithGap(obstacles[i], map.width, map.height)) return fail('obstáculo pegado al borde');
    for (let j = i + 1; j < obstacles.length; j++) {
      if (tooClose(obstacles[i], obstacles[j])) return fail('obstáculos demasiado juntos');
    }
  }
  if (spawns.length < MAX_PLAYERS) return fail('faltan puntos de aparición');
  for (const s of spawns) {
    if (obstacles.some((ob) => overlaps(s.x, s.y, PLAYER_RADIUS, ob))) return fail('punto de aparición bloqueado');
  }

  const { walkable, reached } = floodFill(map, spawns[0]);
  if (reached !== walkable) return fail(`zonas aisladas: ${walkable - reached} celdas`);
  return { ok: true, walkable };
}

function fail(reason) {
  return { ok: false, reason };
}

/** Rellena desde `start` las celdas donde cabe un jugador. Devuelve celdas libres y alcanzadas. */
export function floodFill(map, start) {
  const cols = Math.floor(map.width / GRID);
  const rows = Math.floor(map.height / GRID);
  const free = new Uint8Array(cols * rows);
  let walkable = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * GRID + GRID / 2;
      const y = r * GRID + GRID / 2;
      const inside = x >= PLAYER_RADIUS && y >= PLAYER_RADIUS && x <= map.width - PLAYER_RADIUS && y <= map.height - PLAYER_RADIUS;
      if (inside && !map.obstacles.some((ob) => overlaps(x, y, PLAYER_RADIUS, ob))) {
        free[r * cols + c] = 1;
        walkable++;
      }
    }
  }

  const startIdx = Math.floor(start.y / GRID) * cols + Math.floor(start.x / GRID);
  if (!free[startIdx]) return { walkable, reached: 0 };
  const seen = new Uint8Array(cols * rows);
  const queue = [startIdx];
  seen[startIdx] = 1;
  let reached = 0;
  while (queue.length > 0) {
    const i = queue.pop();
    reached++;
    const c = i % cols;
    const neighbours = [c > 0 ? i - 1 : -1, c < cols - 1 ? i + 1 : -1, i - cols, i + cols];
    for (const n of neighbours) {
      if (n >= 0 && n < free.length && free[n] && !seen[n]) {
        seen[n] = 1;
        queue.push(n);
      }
    }
  }
  return { walkable, reached };
}
