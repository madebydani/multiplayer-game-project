// Colisiones 2D sencillas: el jugador es un círculo; los obstáculos son
// círculos ({ shape: 'circle', x, y, r }) o rectángulos ({ shape: 'rect', x, y, w, h },
// con x, y en la esquina superior izquierda).
// Este módulo lo usan el cliente (predicción) y el servidor (autoridad),
// así ambos calculan exactamente el mismo resultado.

/** Comprueba si un círculo se solapa con un obstáculo. */
export function overlaps(cx, cy, r, ob) {
  if (ob.shape === 'circle') {
    const dx = cx - ob.x;
    const dy = cy - ob.y;
    const rr = r + ob.r;
    return dx * dx + dy * dy < rr * rr;
  }
  const nx = clamp(cx, ob.x, ob.x + ob.w);
  const ny = clamp(cy, ob.y, ob.y + ob.h);
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

/**
 * Devuelve el desplazamiento mínimo {x, y} para sacar el círculo del obstáculo
 * (o {x: 0, y: 0} si no hay solapamiento).
 */
export function pushOut(cx, cy, r, ob) {
  if (ob.shape === 'circle') {
    const dx = cx - ob.x;
    const dy = cy - ob.y;
    const dist = Math.hypot(dx, dy);
    const minDist = r + ob.r;
    if (dist >= minDist) return { x: 0, y: 0 };
    if (dist === 0) return { x: minDist, y: 0 }; // centros iguales: empuja a la derecha
    const k = (minDist - dist) / dist;
    return { x: dx * k, y: dy * k };
  }

  const inside = cx > ob.x && cx < ob.x + ob.w && cy > ob.y && cy < ob.y + ob.h;
  if (inside) {
    // Centro dentro del rectángulo: sale por el lado más cercano.
    const left = cx - ob.x;
    const right = ob.x + ob.w - cx;
    const top = cy - ob.y;
    const bottom = ob.y + ob.h - cy;
    const min = Math.min(left, right, top, bottom);
    if (min === left) return { x: -(left + r), y: 0 };
    if (min === right) return { x: right + r, y: 0 };
    if (min === top) return { x: 0, y: -(top + r) };
    return { x: 0, y: bottom + r };
  }

  const nx = clamp(cx, ob.x, ob.x + ob.w);
  const ny = clamp(cy, ob.y, ob.y + ob.h);
  const dx = cx - nx;
  const dy = cy - ny;
  const dist = Math.hypot(dx, dy);
  if (dist >= r) return { x: 0, y: 0 };
  const k = (r - dist) / dist;
  return { x: dx * k, y: dy * k };
}

/**
 * Mueve un círculo (x, y, r) con el desplazamiento (dx, dy) respetando
 * obstáculos y límites del mapa. Divide el movimiento en pasos pequeños para
 * no atravesar obstáculos finos y resuelve cada eje por separado para que el
 * personaje "resbale" junto a las paredes.
 * @returns {{x: number, y: number}} nueva posición
 */
export function moveCircle(x, y, r, dx, dy, obstacles, bounds) {
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / (r / 2)));
  const sx = dx / steps;
  const sy = dy / steps;

  for (let i = 0; i < steps; i++) {
    x += sx;
    ({ x, y } = resolve(x, y, r, obstacles));
    y += sy;
    ({ x, y } = resolve(x, y, r, obstacles));
  }

  return {
    x: clamp(x, r, bounds.width - r),
    y: clamp(y, r, bounds.height - r),
  };
}

function resolve(x, y, r, obstacles) {
  for (const ob of obstacles) {
    const p = pushOut(x, y, r, ob);
    x += p.x;
    y += p.y;
  }
  return { x, y };
}

export function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}
