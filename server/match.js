// Simulación autoritativa de una partida (sin Socket.IO, se puede probar aislada).
// Los clientes solo envían su entrada (dirección); el servidor calcula posiciones.
import { PLAYER_RADIUS, TICK_MS, MAX_INPUT_CREDIT } from '../shared/config.js';
import { overlaps } from '../shared/collision.js';
import { applyInput } from '../shared/movement.js';

// Colores de los placeholders: uno por plaza (máx. 6).
export const PLAYER_COLORS = [0x4fc3f7, 0xffb74d, 0xba68c8, 0x81c784, 0xf06292, 0xfff176];

export class Match {
  /**
   * @param {object} map  mapa con width, height, spawn y obstacles
   * @param {{id: string, name: string}[]} players
   */
  constructor(map, players) {
    this.map = map;
    this.tick = 0;
    this.timer = null;
    this.players = new Map();
    const spawns = spawnPoints(map, players.length);
    players.forEach((p, i) => {
      this.players.set(p.id, {
        id: p.id,
        name: p.name,
        color: PLAYER_COLORS[i % PLAYER_COLORS.length],
        x: spawns[i].x,
        y: spawns[i].y,
        dx: 0,
        dy: 1,
        inputs: [], // entradas pendientes de procesar
        credit: MAX_INPUT_CREDIT, // cuántas entradas puede procesar ahora
        lastSeq: 0, // última entrada procesada (para la reconciliación del cliente)
      });
    });
  }

  /** Arranca el bucle; onTick recibe la instantánea del estado. */
  start(onTick) {
    this.timer = setInterval(() => onTick(this.step()), TICK_MS);
  }

  stop() {
    clearInterval(this.timer);
    this.timer = null;
  }

  get running() {
    return this.timer !== null;
  }

  /** Guarda una entrada del cliente si es válida. Devuelve true si se aceptó. */
  addInput(playerId, input) {
    const p = this.players.get(playerId);
    if (!p || !input) return false;
    const { seq, x, y } = input;
    if (!Number.isInteger(seq) || seq <= p.lastSeq) return false;
    if (![-1, 0, 1].includes(x) || ![-1, 0, 1].includes(y)) return false;
    if (p.inputs.length >= MAX_INPUT_CREDIT * 2) p.inputs.shift(); // cola acotada
    p.inputs.push({ seq, x, y });
    return true;
  }

  removePlayer(playerId) {
    this.players.delete(playerId);
  }

  /** Un paso de simulación: procesa entradas y devuelve la instantánea. */
  step() {
    this.tick++;
    const dt = TICK_MS / 1000;
    for (const p of this.players.values()) {
      // Cada tick se gana 1 crédito: de media, nunca más de 1 entrada por tick.
      p.credit = Math.min(MAX_INPUT_CREDIT, p.credit + 1);
      while (p.inputs.length > 0 && p.credit >= 1) {
        const input = p.inputs.shift();
        p.credit--;
        applyInput(p, input, dt, this.map);
      }
    }
    return this.snapshot();
  }

  snapshot() {
    return {
      t: this.tick,
      players: [...this.players.values()].map((p) => ({
        id: p.id,
        x: round(p.x),
        y: round(p.y),
        dx: p.dx,
        dy: p.dy,
        seq: p.lastSeq,
      })),
    };
  }

  /** Datos iniciales para los clientes. */
  initialView() {
    return {
      map: this.map,
      players: [...this.players.values()].map((p) => ({
        id: p.id,
        name: p.name,
        color: p.color,
        x: p.x,
        y: p.y,
      })),
    };
  }
}

/** Puntos de aparición distintos y libres alrededor del spawn del mapa. */
export function spawnPoints(map, count) {
  const points = [];
  const ringRadius = 90;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const x = map.spawn.x + Math.cos(angle) * ringRadius;
    const y = map.spawn.y + Math.sin(angle) * ringRadius;
    const free = !map.obstacles.some((ob) => overlaps(x, y, PLAYER_RADIUS, ob));
    points.push(free ? { x, y } : { ...map.spawn });
  }
  return points;
}

function round(v) {
  return Math.round(v * 100) / 100;
}
