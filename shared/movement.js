// Movimiento de un jugador a partir de una entrada. Lo usan el servidor
// (autoridad) y el cliente (predicción), así ambos calculan lo mismo,
// incluida la energía del sprint.
import {
  PLAYER_RADIUS,
  SPEED,
  SPRINT_MULTIPLIER,
  SPRINT_ENERGY_MS,
  SPRINT_RECHARGE_MS,
  SPRINT_RESTART_FRACTION,
} from './config.js';
import { moveCircle } from './collision.js';

/** Valores iniciales de la energía de sprint de un jugador. */
export function initialSprint() {
  return { energy: SPRINT_ENERGY_MS, exhausted: false, sprinting: false };
}

/**
 * @param {{x:number, y:number, dx:number, dy:number, lastSeq:number, role:string,
 *          frozen:boolean, energy:number, exhausted:boolean, sprinting:boolean}} p jugador (se modifica)
 * @param {{seq:number, x:-1|0|1, y:-1|0|1, s?:0|1}} input dirección pulsada y sprint (s)
 * @param {number} dt segundos
 * @param {{width:number, height:number, obstacles:object[]}} map
 */
export function applyInput(p, input, dt, map) {
  p.lastSeq = input.seq;
  const moving = !p.frozen && (input.x !== 0 || input.y !== 0);

  // --- Energía del sprint ---
  const ms = dt * 1000;
  if (p.exhausted && p.energy >= SPRINT_ENERGY_MS * SPRINT_RESTART_FRACTION) p.exhausted = false;
  p.sprinting = moving && input.s === 1 && !p.exhausted && p.energy > 0;
  if (p.sprinting) {
    p.energy = Math.max(0, p.energy - ms);
    if (p.energy === 0) p.exhausted = true;
  } else {
    p.energy = Math.min(SPRINT_ENERGY_MS, p.energy + ms * (SPRINT_ENERGY_MS / SPRINT_RECHARGE_MS));
  }

  if (!moving) return;
  const len = Math.hypot(input.x, input.y); // normaliza la diagonal
  const speed = (SPEED[p.role] ?? SPEED.survivor) * (p.sprinting ? SPRINT_MULTIPLIER : 1);
  const dist = speed * dt;
  const next = moveCircle(p.x, p.y, PLAYER_RADIUS, (input.x / len) * dist, (input.y / len) * dist, map.obstacles, map);
  p.x = next.x;
  p.y = next.y;
  p.dx = input.x;
  p.dy = input.y;
}
