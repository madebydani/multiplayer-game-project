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
  ABILITY,
  SPEED,
  ITEMS,
  ITEM_SPAWN,
  ITEM_RADIUS,
  INVENTORY_SIZE,
  SPRINT_ENERGY_MS,
} from '../shared/config.js';
import { overlaps, moveCircle } from '../shared/collision.js';
import { applyInput, initialSprint } from '../shared/movement.js';

// Colores de los placeholders: uno por plaza (máx. 6).
export const PLAYER_COLORS = [0x4fc3f7, 0xffb74d, 0xba68c8, 0x81c784, 0xf06292, 0xfff176];

export class Match {
  /**
   * @param {object} map  mapa con width, height, spawn y obstacles
   * @param {{id: string, name: string}[]} players
   * @param {{durationMs?: number, random?: () => number, items?: boolean}} options
   *   items: false desactiva la aparición de objetos (útil en algunas pruebas)
   */
  constructor(
    map,
    players,
    { durationMs = DEFAULT_MATCH_DURATION_MIN * 60000, random = Math.random, items = true } = {},
  ) {
    this.map = map;
    this.durationMs = durationMs;
    this.random = random;
    this.tick = 0;
    this.timer = null;
    this.result = null; // se rellena al terminar
    this.onEnd = () => {};
    this.events = []; // capturas, etc. pendientes de enviar con el próximo estado
    this.decoys = new Map(); // ownerId → señuelo activo
    this.decoyCounter = 0;
    this.items = new Map(); // id → objeto en el suelo { id, type, x, y }
    this.clouds = []; // nubes de humo { id, x, y, untilMs }
    this.itemCounter = 0;
    this.itemsEnabled = items;
    this.nextItemAtMs = ITEM_SPAWN.everyMs;

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
        ...initialSprint(),
        // Habilidad propia: el monstruo inicial no puede usarla hasta que se descongela.
        abilityReadyAtMs: isMonster ? MONSTER_START_FREEZE_MS : 0,
        abilityUntilMs: 0,
        // Objetos
        inventory: [], // tipos de objeto, máx. INVENTORY_SIZE
        invisUntilMs: 0,
        radarUntilMs: 0,
        furyUntilMs: 0,
        fury: false,
      };
      this.players.set(p.id, player);
      this.roster.set(p.id, player);
    });

    if (this.itemsEnabled) for (let i = 0; i < ITEM_SPAWN.initial; i++) this.spawnItem();
  }

  // ---------- Objetos ----------

  /** Coloca un objeto al azar en un punto libre, lejos de otros objetos. */
  spawnItem(type = null) {
    if (this.items.size >= ITEM_SPAWN.max) return null;
    const types = Object.keys(ITEMS);
    const kind = type ?? types[Math.floor(this.random() * types.length)];
    const margin = 60;
    for (let tries = 0; tries < 60; tries++) {
      const x = margin + this.random() * (this.map.width - 2 * margin);
      const y = margin + this.random() * (this.map.height - 2 * margin);
      if (this.map.obstacles.some((ob) => overlaps(x, y, PLAYER_RADIUS + 4, ob))) continue;
      if ([...this.items.values()].some((it) => Math.hypot(it.x - x, it.y - y) < 200)) continue;
      const item = { id: `i${++this.itemCounter}`, type: kind, x: round(x), y: round(y) };
      this.items.set(item.id, item);
      return item;
    }
    return null;
  }

  /** Recogida: un jugador del bando correcto, con hueco, pasa por encima. */
  checkPickups() {
    for (const item of [...this.items.values()]) {
      const side = ITEMS[item.type].side;
      for (const p of this.players.values()) {
        if (p.role !== side || p.inventory.length >= INVENTORY_SIZE) continue;
        if (Math.hypot(p.x - item.x, p.y - item.y) > PLAYER_RADIUS + ITEM_RADIUS) continue;
        p.inventory.push(item.type);
        this.items.delete(item.id);
        this.events.push({ type: 'pickup', id: item.id, by: p.id, item: item.type });
        break;
      }
    }
  }

  /** Usa el objeto de la ranura `slot`. Devuelve un mensaje de error o null. */
  useItem(playerId, slot) {
    const p = this.players.get(playerId);
    if (!p || this.result) return 'La partida no está en curso.';
    if (slot !== 0 && slot !== 1) return 'Ranura no válida.';
    const type = p.inventory[slot];
    if (!type) return `No tienes ningún objeto en la ranura ${slot + 1}.`;
    const def = ITEMS[type];
    if (def.side !== p.role) return 'Ese objeto no es de tu bando.';
    if (p.frozen) return 'Todavía no puedes moverte.';
    const now = this.elapsedMs;
    p.inventory.splice(slot, 1);
    if (type === 'energy') {
      p.energy = SPRINT_ENERGY_MS;
      p.exhausted = false;
    } else if (type === 'smoke') {
      this.clouds.push({ id: `c${++this.itemCounter}`, x: round(p.x), y: round(p.y), untilMs: now + def.durationMs });
    } else if (type === 'invis') {
      p.invisUntilMs = now + def.durationMs;
    } else if (type === 'radar') {
      p.radarUntilMs = now + def.durationMs;
    } else if (type === 'fury') {
      p.furyUntilMs = now + def.durationMs;
    }
    this.events.push({ type: 'useItem', id: p.id, item: type });
    return null;
  }

  /** ¿Está este superviviente oculto para los monstruos (invisible o dentro del humo)? */
  isHidden(p) {
    if (p.role !== 'survivor') return false;
    const now = this.elapsedMs;
    if (now < p.invisUntilMs) return true;
    return this.clouds.some((c) => Math.hypot(c.x - p.x, c.y - p.y) <= ITEMS.smoke.radius);
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
      // Si algo falla en un tick, se registra y termina SOLO esta partida:
      // un error no debe tumbar el servidor ni las demás salas.
      try {
        const snapshot = this.step();
        if (!this.result) onTick(snapshot);
      } catch (err) {
        console.error('Error en el bucle de la partida:', err);
        if (!this.result) this.finish(null, 'error');
        else this.stop();
      }
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
    const { seq, x, y, s = 0 } = input;
    if (!Number.isInteger(seq) || seq <= p.lastSeq) return false;
    if (![-1, 0, 1].includes(x) || ![-1, 0, 1].includes(y) || ![0, 1].includes(s)) return false;
    if (p.inputs.length >= MAX_INPUT_CREDIT * 2) p.inputs.shift(); // cola acotada
    p.inputs.push({ seq, x, y, s });
    return true;
  }

  /**
   * Activa la habilidad propia del rol (Espacio). Devuelve un mensaje de error
   * o null si se activó. El servidor decide si se puede usar.
   */
  useAbility(playerId) {
    const p = this.players.get(playerId);
    if (!p || this.result) return 'La partida no está en curso.';
    const now = this.elapsedMs;
    if (p.frozen) return 'Todavía no puedes moverte.';
    if (now < p.abilityReadyAtMs) return `${ABILITY[p.role].name}: espera ${Math.ceil((p.abilityReadyAtMs - now) / 1000)} s.`;
    const { durationMs, cooldownMs } = ABILITY[p.role];
    p.abilityUntilMs = now + durationMs;
    p.abilityReadyAtMs = now + cooldownMs;
    if (p.role === 'survivor') {
      // Señuelo: copia que sigue andando en la dirección en la que mira el jugador.
      this.decoys.set(p.id, {
        id: `d${++this.decoyCounter}`,
        owner: p.id,
        x: p.x,
        y: p.y,
        dx: p.dx,
        dy: p.dy,
        untilMs: p.abilityUntilMs,
      });
    }
    this.events.push({ type: 'ability', id: p.id, role: p.role });
    return null;
  }

  /** Mueve los señuelos y elimina los que han caducado. */
  updateDecoys(now, dt) {
    for (const [owner, d] of this.decoys) {
      if (now >= d.untilMs || !this.players.has(owner)) {
        this.decoys.delete(owner);
        this.events.push({ type: 'decoyEnd', id: d.id });
        continue;
      }
      const len = Math.hypot(d.dx, d.dy) || 1;
      const dist = SPEED.survivor * dt;
      const next = moveCircle(d.x, d.y, PLAYER_RADIUS, (d.dx / len) * dist, (d.dy / len) * dist, this.map.obstacles, this.map);
      d.x = next.x;
      d.y = next.y;
    }
  }

  /** Dirección (ángulo) hacia el superviviente más cercano, o null si no hay. */
  trackAngle(m) {
    let best = null;
    let bestDist = Infinity;
    for (const s of this.players.values()) {
      if (s.role !== 'survivor' || this.isHidden(s)) continue; // no detecta a los ocultos
      const d = Math.hypot(s.x - m.x, s.y - m.y);
      if (d < bestDist) {
        bestDist = d;
        best = s;
      }
    }
    return best ? Math.atan2(best.y - m.y, best.x - m.x) : null;
  }

  /** Un paso de simulación: movimiento, capturas y fin de partida. */
  step() {
    if (this.result) return this.snapshot();
    this.tick++;
    const dt = TICK_MS / 1000;
    const now = this.elapsedMs;

    this.clouds = this.clouds.filter((c) => now < c.untilMs);
    if (this.itemsEnabled && now >= this.nextItemAtMs) {
      this.spawnItem();
      this.nextItemAtMs = now + ITEM_SPAWN.everyMs;
    }

    for (const p of this.players.values()) {
      p.frozen = p.initialMonster && p.role === 'monster' && now < MONSTER_START_FREEZE_MS;
      p.fury = p.role === 'monster' && now < p.furyUntilMs;
      // Cada tick se gana 1 crédito: de media, nunca más de 1 entrada por tick.
      p.credit = Math.min(MAX_INPUT_CREDIT, p.credit + 1);
      while (p.inputs.length > 0 && p.credit >= 1) {
        p.credit--;
        applyInput(p, p.inputs.shift(), dt, this.map);
      }
    }

    this.updateDecoys(now, dt);
    this.checkPickups();
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
        this.becameMonster(s, now);
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
      this.becameMonster(chosen, this.elapsedMs);
      this.events.push({ type: 'newMonster', id: chosen.id });
    }
  }

  /** Al pasar a monstruo: pierde su señuelo y su habilidad se reinicia. */
  becameMonster(p, now) {
    const d = this.decoys.get(p.id);
    if (d) {
      this.decoys.delete(p.id);
      this.events.push({ type: 'decoyEnd', id: d.id });
    }
    p.abilityUntilMs = 0;
    p.abilityReadyAtMs = now + CAPTURE_COOLDOWN_MS;
    // Pierde los objetos de superviviente y los efectos de ocultación.
    p.inventory = p.inventory.filter((t) => ITEMS[t].side === 'monster');
    p.invisUntilMs = 0;
  }

  finish(winner, reason) {
    this.stop();
    this.result = {
      winner, // 'survivors' | 'monsters' | null (abandono)
      reason, // 'time' | 'allCaptured' | 'abandon' | 'error'
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
        energy: p.energy, // sin redondear: el cliente la predice con el mismo cálculo
        exhausted: p.exhausted,
        sprinting: p.sprinting,
        fury: p.fury,
        hidden: this.isHidden(p), // se filtra para los monstruos en personalize()
      })),
      items: [...this.items.values()],
      clouds: this.clouds.map((c) => ({ id: c.id, x: c.x, y: c.y, msLeft: c.untilMs - now })),
      // Los señuelos llevan su propio id; `owner` dice a quién imitan.
      decoys: [...this.decoys.values()].map((d) => ({ id: d.id, owner: d.owner, x: round(d.x), y: round(d.y), dx: d.dx, dy: d.dy })),
    };
  }

  /**
   * Estado para UN jugador: la parte común más `you`, con lo que solo él debe
   * saber (recarga de su habilidad y, si es monstruo rastreando, la dirección).
   */
  personalize(snapshot, playerId) {
    const p = this.players.get(playerId);
    if (!p) return snapshot;
    const now = this.elapsedMs;
    const active = now < p.abilityUntilMs;
    const radar = p.role === 'monster' && now < p.radarUntilMs;
    // Los monstruos NO reciben a los supervivientes ocultos (ni su posición).
    const players =
      p.role === 'monster' ? snapshot.players.filter((q) => !q.hidden) : snapshot.players;
    return {
      ...snapshot,
      players,
      you: {
        abilityReadyMs: Math.max(0, p.abilityReadyAtMs - now),
        abilityActiveMs: active ? p.abilityUntilMs - now : 0,
        trackAngle: active && p.role === 'monster' ? this.trackAngle(p) : null,
        inventory: p.inventory,
        effects: {
          invis: Math.max(0, p.invisUntilMs - now),
          fury: Math.max(0, p.furyUntilMs - now),
          radar: Math.max(0, p.radarUntilMs - now),
        },
        // Radar: posiciones exactas de los supervivientes visibles.
        radar: radar ? players.filter((q) => q.role === 'survivor').map((q) => ({ x: q.x, y: q.y })) : null,
      },
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
