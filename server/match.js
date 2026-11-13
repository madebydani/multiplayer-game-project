// Simulación autoritativa de una partida (sin Socket.IO, se puede probar aislada).
// Los clientes solo envían su entrada (dirección); el servidor calcula posiciones,
// capturas, transformaciones, tiempo y resultado.
//
// El tiempo se mide en ticks (TICK_MS cada uno), no con el reloj del sistema:
// así la partida es determinista y las pruebas pueden avanzar tick a tick.
import {
  PLAYER_RADIUS,
  TICK_MS,
  MAX_INPUT_CREDIT,
  CAPTURE_RADIUS,
  CAPTURE_COOLDOWN_MS,
  MONSTER_START_FREEZE_MS,
  DEFAULT_MATCH_DURATION_MIN,
  MIN_PLAYERS,
} from '../shared/config.js';
import { overlaps } from '../shared/collision.js';
import { applyInput } from '../shared/movement.js';

// Colores de los placeholders: uno por plaza (máx. 6).
export const PLAYER_COLORS = [0x4fc3f7, 0xffb74d, 0xba68c8, 0x81c784, 0xf06292, 0xfff176];

export class Match {
  /**
   * @param {object} map  mapa con width, height, spawn y obstacles
   * @param {{id: string, name: string}[]} players
   * @param {{durationMs?: number, random?: () => number}} options
   */
  constructor(map, players, { durationMs = DEFAULT_MATCH_DURATION_MIN * 60000, random = Math.random } = {}) {
    this.map = map;
    this.durationMs = durationMs;
    this.random = random;
    this.tick = 0;
    this.timer = null;
    this.result = null; // se rellena al terminar
    this.onEnd = () => {};
    this.events = []; // capturas, etc. pendientes de enviar con el próximo estado

    this.players = new Map(); // jugadores conectados que siguen en la simulación
    this.roster = new Map(); // TODOS los que empezaron (para el resultado final)
    const spawns = spawnPoints(map, players.length, random);
    const monsterIndex = Math.floor(random() * players.length);

    players.forEach((p, i) => {
      const isMonster = i === monsterIndex;
      const player = {
        id: p.id,
        name: p.name,
        color: PLAYER_COLORS[i % PLAYER_COLORS.length],
        x: spawns[i].x,
        y: spawns[i].y,
        dx: 0,
        dy: 1,
        role: isMonster ? 'monster' : 'survivor',
        initialMonster: isMonster,
        frozen: isMonster,
        canCaptureAtMs: isMonster ? MONSTER_START_FREEZE_MS : 0,
        transformedAtMs: null,
        capturedBy: null,
        reassigned: false, // convertido en monstruo porque se fue el único monstruo
        disconnected: false,
        inputs: [],
        credit: MAX_INPUT_CREDIT,
        lastSeq: 0,
      };
      this.players.set(p.id, player);
      this.roster.set(p.id, player);
    });
  }

  get elapsedMs() {
    return this.tick * TICK_MS;
  }

  get running() {
    return this.timer !== null;
  }

  /** Arranca el bucle. onTick recibe el estado; onEnd, el resultado (una sola vez). */
  start(onTick, onEnd = () => {}) {
    this.onEnd = onEnd;
    this.timer = setInterval(() => {
      const snapshot = this.step();
      if (!this.result) onTick(snapshot);
    }, TICK_MS);
  }

  stop() {
    clearInterval(this.timer);
    this.timer = null;
  }

  /** Guarda una entrada del cliente si es válida. Devuelve true si se aceptó. */
  addInput(playerId, input) {
    if (this.result) return false;
    const p = this.players.get(playerId);
    if (!p || !input) return false;
    const { seq, x, y } = input;
    if (!Number.isInteger(seq) || seq <= p.lastSeq) return false;
    if (![-1, 0, 1].includes(x) || ![-1, 0, 1].includes(y)) return false;
    if (p.inputs.length >= MAX_INPUT_CREDIT * 2) p.inputs.shift(); // cola acotada
    p.inputs.push({ seq, x, y });
    return true;
  }

  /** Un paso de simulación: movimiento, capturas y fin de partida. */
  step() {
    if (this.result) return this.snapshot();
    this.tick++;
    const dt = TICK_MS / 1000;
    const now = this.elapsedMs;

    for (const p of this.players.values()) {
      p.frozen = p.initialMonster && p.role === 'monster' && now < MONSTER_START_FREEZE_MS;
      // Cada tick se gana 1 crédito: de media, nunca más de 1 entrada por tick.
      p.credit = Math.min(MAX_INPUT_CREDIT, p.credit + 1);
      while (p.inputs.length > 0 && p.credit >= 1) {
        p.credit--;
        applyInput(p, p.inputs.shift(), dt, this.map);
      }
    }

    this.checkCaptures(now);
    this.checkEnd();
    const snapshot = this.snapshot();
    this.events = []; // los avisos ya van en este estado
    return snapshot;
  }

  checkCaptures(now) {
    const hunters = [...this.players.values()].filter((p) => p.role === 'monster' && now >= p.canCaptureAtMs);
    for (const m of hunters) {
      for (const s of this.players.values()) {
        if (s.role !== 'survivor') continue; // también evita capturar dos veces
        if (Math.hypot(m.x - s.x, m.y - s.y) > CAPTURE_RADIUS) continue;
        s.role = 'monster';
        s.transformedAtMs = now;
        s.capturedBy = m.name;
        s.canCaptureAtMs = now + CAPTURE_COOLDOWN_MS; // sin capturas encadenadas
        this.events.push({ type: 'capture', victim: s.id, by: m.id });
      }
    }
  }

  /** Comprueba victoria por captura o por tiempo, y abandonos. */
  checkEnd() {
    if (this.result) return;
    const connected = [...this.players.values()];
    const survivors = connected.filter((p) => p.role === 'survivor');
    if (connected.length < MIN_PLAYERS) return this.finish(null, 'abandon');
    if (survivors.length === 0) return this.finish('monsters', 'allCaptured');
    if (this.elapsedMs >= this.durationMs) return this.finish('survivors', 'time');
  }

  /**
   * Un jugador se desconecta: deja de participar, pero sigue en el resultado.
   * Reglas (ver docs/DECISIONS.md, D6): menos de 2 conectados → abandono;
   * se fue el último superviviente → abandono (no es una captura);
   * se fue el único monstruo → un superviviente al azar pasa a monstruo.
   */
  removePlayer(playerId) {
    const p = this.players.get(playerId);
    if (!p || this.result) return;
    this.players.delete(playerId);
    p.disconnected = true;
    p.inputs = [];

    const connected = [...this.players.values()];
    const survivors = connected.filter((q) => q.role === 'survivor');
    const monsters = connected.filter((q) => q.role === 'monster');

    if (connected.length < MIN_PLAYERS) return this.finish(null, 'abandon');
    if (survivors.length === 0) return this.finish(null, 'abandon');
    if (monsters.length === 0) {
      const chosen = survivors[Math.floor(this.random() * survivors.length)];
      chosen.role = 'monster';
      chosen.reassigned = true;
      chosen.transformedAtMs = this.elapsedMs;
      chosen.canCaptureAtMs = this.elapsedMs + CAPTURE_COOLDOWN_MS;
      this.events.push({ type: 'newMonster', id: chosen.id });
    }
  }

  finish(winner, reason) {
    this.stop();
    this.result = {
      winner, // 'survivors' | 'monsters' | null (abandono)
      reason, // 'time' | 'allCaptured' | 'abandon'
      durationMs: this.elapsedMs,
      players: [...this.roster.values()].map((p) => ({
        id: p.id,
        name: p.name,
        color: p.color,
        role: p.role,
        status: p.disconnected
          ? 'disconnected'
          : p.initialMonster
            ? 'initialMonster'
            : p.role === 'survivor'
              ? 'survived'
              : 'transformed',
        transformedAtMs: p.transformedAtMs,
        capturedBy: p.capturedBy,
        reassigned: p.reassigned,
      })),
    };
    this.onEnd(this.result);
  }

  snapshot() {
    const now = this.elapsedMs;
    return {
      t: this.tick,
      timeLeftMs: Math.max(0, this.durationMs - now),
      survivors: [...this.players.values()].filter((p) => p.role === 'survivor').length,
      events: this.events,
      players: [...this.players.values()].map((p) => ({
        id: p.id,
        x: round(p.x),
        y: round(p.y),
        dx: p.dx,
        dy: p.dy,
        seq: p.lastSeq,
        role: p.role,
        frozen: p.frozen,
        // ms que faltan para poder capturar (solo monstruos)
        cooldownMs: p.role === 'monster' ? Math.max(0, p.canCaptureAtMs - now) : 0,
      })),
    };
  }

  /** Datos iniciales para los clientes. */
  initialView() {
    return {
      map: this.map,
      durationMs: this.durationMs,
      players: [...this.players.values()].map((p) => ({
        id: p.id,
        name: p.name,
        color: p.color,
        x: p.x,
        y: p.y,
        role: p.role,
      })),
    };
  }
}

/**
 * Puntos de aparición distintos y libres. Si el mapa trae `spawns` (mapa
 * procedural, ya validados y separados), se reparten en orden aleatorio.
 * Si no (mapa fijo de pruebas), se colocan en círculo alrededor de `spawn`.
 */
export function spawnPoints(map, count, random = Math.random) {
  if (map.spawns?.length >= count) {
    const shuffled = [...map.spawns];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, count).map((p) => ({ ...p }));
  }
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
