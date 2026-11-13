// Movimiento de un jugador a partir de una entrada. Lo usan el servidor
// (autoridad) y el cliente (predicción), así ambos calculan lo mismo.
import { PLAYER_RADIUS, SPEED } from './config.js';
import { moveCircle } from './collision.js';

/**
 * @param {{x:number, y:number, dx:number, dy:number, lastSeq:number, role:string, frozen:boolean}} p jugador (se modifica)
 * @param {{seq:number, x:-1|0|1, y:-1|0|1}} input dirección pulsada
 * @param {number} dt segundos
 * @param {{width:number, height:number, obstacles:object[]}} map
 */
export function applyInput(p, input, dt, map) {
  p.lastSeq = input.seq;
  if (p.frozen) return; // monstruo inicial inmóvil al empezar
  if (input.x === 0 && input.y === 0) return;
  const len = Math.hypot(input.x, input.y); // normaliza la diagonal
  const dist = (SPEED[p.role] ?? SPEED.survivor) * dt;
  const next = moveCircle(p.x, p.y, PLAYER_RADIUS, (input.x / len) * dist, (input.y / len) * dist, map.obstacles, map);
  p.x = next.x;
  p.y = next.y;
  p.dx = input.x;
  p.dy = input.y;
}
