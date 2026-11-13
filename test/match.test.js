import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Match, spawnPoints } from '../server/match.js';
import { generateMap } from '../server/mapgen.js';
import { createTestMap } from '../shared/testMap.js';
import { overlaps } from '../shared/collision.js';
import { PLAYER_RADIUS, SPEED, TICK_MS, MAX_INPUT_CREDIT } from '../shared/config.js';

const players = [
  { id: 'a', name: 'Ana' },
  { id: 'b', name: 'Bea' },
];

test('puntos de aparición distintos y libres para 6 jugadores', () => {
  const map = createTestMap();
  const pts = spawnPoints(map, 6);
  for (const p of pts) assert.ok(!map.obstacles.some((ob) => overlaps(p.x, p.y, PLAYER_RADIUS, ob)));
  for (let i = 0; i < pts.length; i++)
    for (let j = i + 1; j < pts.length; j++)
      assert.ok(Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y) >= PLAYER_RADIUS * 2);
});

test('una entrada mueve exactamente velocidad × tick', () => {
  const m = new Match(createTestMap(), players, { random: () => 0.99 }); // monstruo: b
  const a = m.players.get('a');
  a.x = 300; // zona despejada del camino
  a.y = 900;
  m.addInput('a', { seq: 1, x: 1, y: 0 });
  m.step();
  assert.ok(Math.abs(a.x - (300 + SPEED.survivor * (TICK_MS / 1000))) < 1e-9);
  assert.equal(a.y, 900);
  assert.equal(a.lastSeq, 1);
});

test('rechaza entradas no válidas y repetidas', () => {
  const m = new Match(createTestMap(), players);
  assert.equal(m.addInput('a', { seq: 1, x: 5, y: 0 }), false);
  assert.equal(m.addInput('a', { seq: 1.5, x: 1, y: 0 }), false);
  assert.equal(m.addInput('a', null), false);
  assert.equal(m.addInput('nadie', { seq: 1, x: 1, y: 0 }), false);
  assert.equal(m.addInput('a', { seq: 1, x: 1, y: 0 }), true);
  m.step();
  assert.equal(m.addInput('a', { seq: 1, x: 1, y: 0 }), false); // ya procesada
});

test('anti speed hack: enviar muchas entradas no da más velocidad', () => {
  const m = new Match(createTestMap(), players, { random: () => 0 }); // monstruo: a
  const b = m.players.get('b');
  m.players.get('a').x = 2200; // monstruo lejos, para que no capture a "b"
  // Coloca a "b" en una zona despejada del camino y lejos de "a".
  b.x = 300;
  b.y = 900;
  const ticks = 40;
  let seq = 0;
  for (let t = 0; t < ticks; t++) {
    for (let k = 0; k < 10; k++) m.addInput('b', { seq: ++seq, x: 1, y: 0 });
    m.step();
  }
  const maxDist = SPEED.survivor * (TICK_MS / 1000) * (ticks + MAX_INPUT_CREDIT);
  assert.ok(b.x - 300 <= maxDist + 1e-6, `recorrido ${b.x - 300} > ${maxDist}`);
});

test('el servidor aplica colisiones (no atraviesa la cabaña)', () => {
  const m = new Match(createTestMap(), players, { random: () => 0.99 }); // monstruo: b
  const a = m.players.get('a');
  a.x = 1300;
  a.y = 1110;
  for (let s = 1; s <= 40; s++) {
    m.addInput('a', { seq: s, x: 1, y: 0 });
    m.step();
  }
  assert.equal(a.x, 1380 - PLAYER_RADIUS);
});

test('stop() detiene el bucle', async () => {
  const m = new Match(createTestMap(), players);
  let n = 0;
  m.start(() => n++);
  await new Promise((r) => setTimeout(r, TICK_MS * 3));
  m.stop();
  const after = n;
  await new Promise((r) => setTimeout(r, TICK_MS * 3));
  assert.ok(after > 0);
  assert.equal(n, after);
  assert.equal(m.running, false);
});

// ---------- Fase 4: infección ----------
import { CAPTURE_RADIUS, CAPTURE_COOLDOWN_MS, MONSTER_START_FREEZE_MS } from '../shared/config.js';

const three = [
  { id: 'a', name: 'Ana' },
  { id: 'b', name: 'Bea' },
  { id: 'c', name: 'Cris' },
];
const ticksFor = (ms) => Math.ceil(ms / TICK_MS);
const run = (m, ticks) => {
  for (let i = 0; i < ticks; i++) m.step();
};
// random() = 0 → el primer jugador ("a") es el monstruo inicial.
const newMatch = (list = three, opts = {}) => new Match(createTestMap(), list, { random: () => 0, ...opts });
// Coloca jugadores en una zona despejada del camino.
const place = (m, id, x, y = 900) => Object.assign(m.players.get(id), { x, y });

test('al empezar hay exactamente un monstruo inicial', () => {
  const m = new Match(createTestMap(), three);
  const roles = [...m.players.values()].map((p) => p.role);
  assert.equal(roles.filter((r) => r === 'monster').length, 1);
  assert.equal(roles.filter((r) => r === 'survivor').length, 2);
});

test('el monstruo inicial no se mueve durante los primeros 5 s', () => {
  const m = newMatch();
  place(m, 'a', 300);
  let seq = 0;
  for (let i = 0; i < ticksFor(MONSTER_START_FREEZE_MS) - 1; i++) {
    m.addInput('a', { seq: ++seq, x: 1, y: 0 });
    m.step();
  }
  assert.equal(m.players.get('a').x, 300);
  for (let i = 0; i < 5; i++) {
    m.addInput('a', { seq: ++seq, x: 1, y: 0 });
    m.step();
  }
  assert.ok(m.players.get('a').x > 300);
});

test('no captura durante la congelación inicial aunque esté pegado', () => {
  const m = newMatch();
  place(m, 'a', 300);
  place(m, 'b', 310);
  place(m, 'c', 900);
  run(m, ticksFor(MONSTER_START_FREEZE_MS) - 1);
  assert.equal(m.players.get('b').role, 'survivor');
  m.step();
  assert.equal(m.players.get('b').role, 'monster');
});

test('captura a distancia exacta del radio, no más allá', () => {
  const m = newMatch();
  run(m, ticksFor(MONSTER_START_FREEZE_MS));
  place(m, 'a', 300);
  place(m, 'b', 300 + CAPTURE_RADIUS + 0.5);
  place(m, 'c', 900);
  m.step();
  assert.equal(m.players.get('b').role, 'survivor');
  place(m, 'b', 300 + CAPTURE_RADIUS);
  const snap = m.step();
  const b = m.players.get('b');
  assert.equal(b.role, 'monster');
  assert.equal(b.capturedBy, 'Ana');
  assert.deepEqual(snap.events, [{ type: 'capture', victim: 'b', by: 'a' }]);
});

test('el nuevo monstruo no puede capturar durante 3 s (sin capturas encadenadas)', () => {
  const m = newMatch();
  run(m, ticksFor(MONSTER_START_FREEZE_MS));
  place(m, 'a', 300);
  place(m, 'b', 320); // capturado por a
  place(m, 'c', 900);
  m.step();
  assert.equal(m.players.get('b').role, 'monster');
  // Alejamos al monstruo original; c se pega al nuevo monstruo b.
  place(m, 'a', 1900, 300);
  place(m, 'c', 330);
  run(m, ticksFor(CAPTURE_COOLDOWN_MS) - 1);
  assert.equal(m.players.get('c').role, 'survivor');
  m.step();
  assert.equal(m.players.get('c').role, 'monster');
  assert.equal(m.players.get('c').capturedBy, 'Bea');
});

test('ganan los monstruos al capturar al último superviviente', () => {
  const m = newMatch(players);
  let result = null;
  m.onEnd = (r) => (result = r);
  run(m, ticksFor(MONSTER_START_FREEZE_MS));
  place(m, 'a', 300);
  place(m, 'b', 310);
  m.step();
  assert.equal(result.winner, 'monsters');
  assert.equal(result.reason, 'allCaptured');
  const byId = Object.fromEntries(result.players.map((p) => [p.id, p]));
  assert.equal(byId.a.status, 'initialMonster');
  assert.equal(byId.b.status, 'transformed');
  assert.equal(byId.b.capturedBy, 'Ana');
  assert.equal(byId.b.transformedAtMs, result.durationMs);
  // Una vez terminada, no avanza ni acepta entradas.
  const t = m.tick;
  m.step();
  assert.equal(m.tick, t);
  assert.equal(m.addInput('b', { seq: 99, x: 1, y: 0 }), false);
});

test('ganan los supervivientes al acabar el tiempo', () => {
  const m = newMatch(three, { durationMs: 2000 });
  let result = null;
  let calls = 0;
  m.onEnd = (r) => {
    result = r;
    calls++;
  };
  run(m, ticksFor(2000) + 10);
  assert.equal(calls, 1);
  assert.equal(result.winner, 'survivors');
  assert.equal(result.reason, 'time');
  assert.equal(result.durationMs, 2000);
  assert.deepEqual(
    result.players.map((p) => p.status),
    ['initialMonster', 'survived', 'survived'],
  );
});

test('el estado incluye tiempo restante, supervivientes y bloqueo del monstruo', () => {
  const m = newMatch(three, { durationMs: 60000 });
  const s = m.step();
  assert.equal(s.timeLeftMs, 60000 - TICK_MS);
  assert.equal(s.survivors, 2);
  const a = s.players.find((p) => p.id === 'a');
  assert.equal(a.role, 'monster');
  assert.equal(a.frozen, true);
  assert.equal(a.cooldownMs, MONSTER_START_FREEZE_MS - TICK_MS);
});

test('desconexión: si se va el único monstruo, otro pasa a ser monstruo', () => {
  const m = newMatch(three);
  m.removePlayer('a');
  assert.equal(m.result, null);
  const monsters = [...m.players.values()].filter((p) => p.role === 'monster');
  assert.equal(monsters.length, 1);
  assert.equal(monsters[0].reassigned, true);
  assert.equal(monsters[0].capturedBy, null);
  const snap = m.step();
  assert.equal(snap.events[0].type, 'newMonster');
  assert.equal(snap.players.find((p) => p.id === monsters[0].id).cooldownMs, CAPTURE_COOLDOWN_MS - TICK_MS);
});

test('desconexión: se va el último superviviente → abandono, sin captura', () => {
  const m = newMatch(three);
  run(m, ticksFor(MONSTER_START_FREEZE_MS));
  place(m, 'a', 300);
  place(m, 'b', 310);
  place(m, 'c', 900);
  m.step(); // b capturado; quedan a (monstruo), b (monstruo), c (superviviente)
  m.removePlayer('c');
  assert.equal(m.result.winner, null);
  assert.equal(m.result.reason, 'abandon');
  const c = m.result.players.find((p) => p.id === 'c');
  assert.equal(c.status, 'disconnected');
  assert.equal(c.capturedBy, null);
});

test('desconexión: quedan menos de 2 jugadores → abandono', () => {
  const m = newMatch(players);
  m.removePlayer('b');
  assert.equal(m.result.reason, 'abandon');
  assert.equal(m.running, false);
});

// ---------- Fase 7a: sprint ----------
import {
  SPRINT_MULTIPLIER,
  SPRINT_ENERGY_MS,
  SPRINT_RECHARGE_MS,
  SPRINT_RESTART_FRACTION,
} from '../shared/config.js';
import { applyInput, initialSprint } from '../shared/movement.js';

const openMap = { width: 100000, height: 1000, obstacles: [] };
const runner = () => ({ x: 100, y: 500, dx: 0, dy: 0, lastSeq: 0, role: 'survivor', frozen: false, ...initialSprint() });
const dt = TICK_MS / 1000;

test('sprint: ×1,4 de velocidad mientras hay energía', () => {
  const p = runner();
  applyInput(p, { seq: 1, x: 1, y: 0, s: 1 }, dt, openMap);
  assert.ok(Math.abs(p.x - (100 + SPEED.survivor * SPRINT_MULTIPLIER * dt)) < 1e-9);
  assert.equal(p.sprinting, true);
  assert.equal(p.energy, SPRINT_ENERGY_MS - TICK_MS);
});

test('sprint: la energía dura 2 s; después, velocidad normal y "agotado"', () => {
  const p = runner();
  const ticks = SPRINT_ENERGY_MS / TICK_MS;
  for (let i = 1; i <= ticks; i++) applyInput(p, { seq: i, x: 1, y: 0, s: 1 }, dt, openMap);
  assert.equal(p.energy, 0);
  assert.equal(p.exhausted, true);
  const x0 = p.x;
  applyInput(p, { seq: ticks + 1, x: 1, y: 0, s: 1 }, dt, openMap);
  assert.ok(Math.abs(p.x - x0 - SPEED.survivor * dt) < 1e-9, 'sin energía, velocidad normal');
});

test('sprint: tras agotarse, hace falta el 25 % para volver a esprintar', () => {
  const p = runner();
  let seq = 0;
  for (let i = 0; i < SPRINT_ENERGY_MS / TICK_MS; i++) applyInput(p, { seq: ++seq, x: 1, y: 0, s: 1 }, dt, openMap);
  const ticksTo25 = Math.ceil((SPRINT_RECHARGE_MS * SPRINT_RESTART_FRACTION) / TICK_MS);
  // Manteniendo Shift pulsado durante la recarga, no esprinta hasta el 25 %.
  for (let i = 0; i < ticksTo25; i++) {
    applyInput(p, { seq: ++seq, x: 1, y: 0, s: 1 }, dt, openMap);
    assert.equal(p.sprinting, false, `tick ${i}`);
  }
  applyInput(p, { seq: ++seq, x: 1, y: 0, s: 1 }, dt, openMap);
  assert.equal(p.sprinting, true);
});

test('sprint: la barra vacía se llena en 6 s sin esprintar', () => {
  const p = { ...runner(), energy: 0, exhausted: true };
  for (let i = 1; i <= SPRINT_RECHARGE_MS / TICK_MS; i++) applyInput(p, { seq: i, x: 0, y: 0, s: 0 }, dt, openMap);
  assert.ok(Math.abs(p.energy - SPRINT_ENERGY_MS) < 1e-6);
});

test('sprint: no gasta energía quieto ni congelado', () => {
  const p = runner();
  applyInput(p, { seq: 1, x: 0, y: 0, s: 1 }, dt, openMap);
  assert.equal(p.energy, SPRINT_ENERGY_MS);
  const f = { ...runner(), frozen: true };
  applyInput(f, { seq: 1, x: 1, y: 0, s: 1 }, dt, openMap);
  assert.equal(f.x, 100);
  assert.equal(f.energy, SPRINT_ENERGY_MS);
});

test('sprint: el servidor rechaza valores de sprint no válidos', () => {
  const m = newMatch(players);
  assert.equal(m.addInput('b', { seq: 1, x: 1, y: 0, s: 2 }), false);
  assert.equal(m.addInput('b', { seq: 1, x: 1, y: 0, s: true }), false);
  assert.equal(m.addInput('b', { seq: 1, x: 1, y: 0, s: 1 }), true);
  assert.equal(m.addInput('b', { seq: 2, x: 1, y: 0 }), true); // sin "s" = no esprintar
});

test('sprint: ni enviando muchas entradas se supera la velocidad de sprint', () => {
  const m = newMatch(players);
  const b = m.players.get('b');
  m.players.get('a').x = 2200;
  b.x = 300;
  b.y = 900;
  let seq = 0;
  const ticks = 30;
  for (let t = 0; t < ticks; t++) {
    for (let k = 0; k < 10; k++) m.addInput('b', { seq: ++seq, x: 1, y: 0, s: 1 });
    m.step();
  }
  const max = SPEED.survivor * SPRINT_MULTIPLIER * dt * (ticks + MAX_INPUT_CREDIT);
  assert.ok(b.x - 300 <= max + 1e-6);
});

// ---------- Fase 7b: habilidades propias ----------
import { ABILITY } from '../shared/config.js';

const afterFreeze = (list = three) => {
  const m = newMatch(list); // monstruo inicial: "a"
  run(m, ticksFor(MONSTER_START_FREEZE_MS));
  return m;
};

test('señuelo: aparece en tu posición y anda en tu dirección, choca y caduca a los 4 s', () => {
  const m = afterFreeze();
  place(m, 'a', 2200, 300);
  const b = place(m, 'b', 300);
  b.dx = 1;
  b.dy = 0;
  assert.equal(m.useAbility('b'), null);
  const snap = m.step();
  assert.equal(snap.decoys.length, 1);
  const d = snap.decoys[0];
  assert.equal(d.owner, 'b');
  assert.ok(Math.abs(d.x - (300 + SPEED.survivor * (TICK_MS / 1000))) < 0.01);
  assert.equal(b.x, 300); // el jugador real no se ha movido
  run(m, ticksFor(ABILITY.survivor.durationMs) - 2);
  assert.equal(m.decoys.size, 1);
  const end = m.step();
  assert.equal(m.decoys.size, 0);
  assert.ok(end.events.some((e) => e.type === 'decoyEnd' && e.id === d.id));
});

test('señuelo: no se puede capturar', () => {
  const m = afterFreeze();
  place(m, 'b', 300);
  place(m, 'c', 2000, 1500);
  m.players.get('b').dx = 0;
  m.players.get('b').dy = 0; // señuelo quieto
  m.useAbility('b');
  place(m, 'b', 1000, 1500); // el jugador real se va lejos
  place(m, 'a', 300); // el monstruo encima del señuelo
  const snap = m.step();
  assert.equal(m.players.get('b').role, 'survivor');
  assert.ok(!snap.events.some((e) => e.type === 'capture'));
});

test('habilidad: recarga de 15 s; antes devuelve un mensaje de espera', () => {
  const m = afterFreeze();
  assert.equal(m.useAbility('b'), null);
  run(m, 10);
  assert.match(m.useAbility('b'), /Señuelo: espera \d+ s/);
  run(m, ticksFor(ABILITY.survivor.cooldownMs) - 10);
  assert.equal(m.useAbility('b'), null);
});

test('rastreo: solo el monstruo que lo usa recibe la dirección al más cercano', () => {
  const m = afterFreeze();
  place(m, 'a', 1000, 900);
  place(m, 'b', 1300, 900); // a la derecha, a 300 px
  place(m, 'c', 1000, 1500); // abajo, a 600 px
  assert.equal(m.useAbility('a'), null);
  const snap = m.step();
  const forMonster = m.personalize(snap, 'a');
  const forSurvivor = m.personalize(snap, 'b');
  assert.ok(Math.abs(forMonster.you.trackAngle - 0) < 1e-9, 'apunta a la derecha');
  assert.equal(forSurvivor.you.trackAngle, null);
  assert.ok(forMonster.you.abilityActiveMs > 0);
  run(m, ticksFor(ABILITY.monster.durationMs));
  assert.equal(m.personalize(m.snapshot(), 'a').you.trackAngle, null);
});

test('habilidad: el monstruo inicial no la puede usar congelado', () => {
  const m = newMatch();
  m.step();
  assert.match(m.useAbility('a'), /Todavía no/);
});

test('al ser capturado se pierde el señuelo y la habilidad pasa a rastreo con espera', () => {
  const m = afterFreeze();
  place(m, 'c', 2000, 1500);
  const b = place(m, 'b', 300);
  m.useAbility('b');
  place(m, 'a', 300);
  const snap = m.step();
  assert.equal(b.role, 'monster');
  assert.equal(m.decoys.size, 0);
  assert.ok(snap.events.some((e) => e.type === 'decoyEnd'));
  assert.match(m.useAbility('b'), /Rastreo: espera/);
});

test('el señuelo desaparece si su dueño se desconecta', () => {
  const m = afterFreeze();
  m.useAbility('b');
  m.removePlayer('b');
  m.step();
  assert.equal(m.decoys.size, 0);
});

// ---------- Fase 7c: objetos ----------
import { ITEMS, ITEM_SPAWN, INVENTORY_SIZE } from '../shared/config.js';

/** Partida sin objetos al azar; los colocamos a mano. */
const itemMatch = () => {
  const m = newMatch(three, { items: false });
  run(m, ticksFor(MONSTER_START_FREEZE_MS));
  place(m, 'a', 2200, 300); // monstruo lejos
  place(m, 'b', 300);
  place(m, 'c', 1500, 1500);
  return m;
};
const putItem = (m, type, x, y) => {
  const it = { id: `t${m.items.size + 1}${type}`, type, x, y };
  m.items.set(it.id, it);
  return it;
};

test('objetos: aparecen 3 al empezar, uno más cada 20 s, máximo 6, en puntos libres', () => {
  const map = generateMap(31);
  const m = new Match(map, three);
  assert.equal(m.items.size, ITEM_SPAWN.initial);
  run(m, ticksFor(ITEM_SPAWN.everyMs * 10));
  assert.equal(m.items.size, ITEM_SPAWN.max);
  for (const it of m.items.values()) {
    assert.ok(!map.obstacles.some((ob) => overlaps(it.x, it.y, PLAYER_RADIUS, ob)), 'objeto sobre un obstáculo');
  }
});

test('objetos: se recogen pasando por encima solo si son de tu bando y hay hueco', () => {
  const m = itemMatch();
  putItem(m, 'radar', 300, 900); // de monstruo: el superviviente "b" no lo coge
  m.step();
  assert.equal(m.players.get('b').inventory.length, 0);
  assert.equal(m.items.size, 1);
  m.items.clear();
  putItem(m, 'smoke', 300, 900);
  const snap = m.step();
  assert.deepEqual(m.players.get('b').inventory, ['smoke']);
  assert.equal(m.items.size, 0);
  assert.ok(snap.events.some((e) => e.type === 'pickup' && e.by === 'b'));
  // Inventario lleno: no recoge más.
  putItem(m, 'invis', 300, 900);
  m.step();
  putItem(m, 'energy', 300, 900);
  m.step();
  assert.equal(m.players.get('b').inventory.length, INVENTORY_SIZE);
  assert.equal(m.items.size, 1);
});

test('objetos: usar ranura vacía o no válida devuelve un motivo', () => {
  const m = itemMatch();
  assert.match(m.useItem('b', 0), /ningún objeto en la ranura 1/);
  assert.match(m.useItem('b', 5), /Ranura no válida/);
});

test('energía: llena la barra de sprint', () => {
  const m = itemMatch();
  const b = m.players.get('b');
  Object.assign(b, { energy: 0, exhausted: true, inventory: ['energy'] });
  assert.equal(m.useItem('b', 0), null);
  assert.equal(b.energy, 2000);
  assert.equal(b.exhausted, false);
  assert.equal(b.inventory.length, 0);
});

test('invisibilidad: los monstruos no reciben tu posición durante 4 s (pero se te puede capturar)', () => {
  const m = itemMatch();
  m.players.get('b').inventory = ['invis'];
  m.useItem('b', 0);
  let snap = m.step();
  assert.ok(!m.personalize(snap, 'a').players.some((p) => p.id === 'b'), 'el monstruo no ve a b');
  assert.ok(m.personalize(snap, 'c').players.some((p) => p.id === 'b' && p.hidden), 'el compañero sí');
  // Captura por contacto aunque sea invisible.
  place(m, 'a', 300);
  snap = m.step();
  assert.equal(m.players.get('b').role, 'monster');
  assert.equal(m.players.get('b').invisUntilMs, 0);
});

test('invisibilidad: caduca a los 4 s', () => {
  const m = itemMatch();
  m.players.get('b').inventory = ['invis'];
  m.useItem('b', 0);
  run(m, ticksFor(ITEMS.invis.durationMs));
  assert.ok(m.personalize(m.snapshot(), 'a').players.some((p) => p.id === 'b'));
});

test('humo: oculta a los supervivientes que estén dentro de la nube, visible para todos', () => {
  const m = itemMatch();
  place(m, 'c', 380); // a 80 px de b: dentro del radio de 120
  m.players.get('b').inventory = ['smoke'];
  m.useItem('b', 0);
  const snap = m.step();
  assert.equal(snap.clouds.length, 1);
  const forMonster = m.personalize(snap, 'a');
  assert.ok(!forMonster.players.some((p) => p.id === 'b' || p.id === 'c'));
  assert.equal(forMonster.clouds.length, 1, 'la nube sí la ve');
  // Al salir de la nube vuelve a ser visible.
  place(m, 'c', 1500, 1500);
  assert.ok(m.personalize(m.step(), 'a').players.some((p) => p.id === 'c'));
  run(m, ticksFor(ITEMS.smoke.durationMs));
  assert.equal(m.clouds.length, 0);
});

test('radar: el monstruo recibe la posición de los supervivientes visibles durante 3 s', () => {
  const m = itemMatch();
  m.players.get('a').inventory = ['radar'];
  m.players.get('c').invisUntilMs = m.elapsedMs + 10000; // c invisible: no sale en el radar
  assert.equal(m.useItem('a', 0), null);
  const you = m.personalize(m.step(), 'a').you;
  assert.deepEqual(you.radar, [{ x: 300, y: 900 }]);
  assert.equal(m.personalize(m.snapshot(), 'b').you.radar, null);
  run(m, ticksFor(ITEMS.radar.durationMs));
  assert.equal(m.personalize(m.snapshot(), 'a').you.radar, null);
});

test('furia: ×1,2 de velocidad durante 5 s', () => {
  const m = itemMatch();
  const a = place(m, 'a', 300, 900);
  place(m, 'b', 2000, 1500);
  a.inventory = ['fury'];
  m.useItem('a', 0);
  m.addInput('a', { seq: 1, x: 1, y: 0 });
  m.step();
  assert.ok(Math.abs(a.x - (300 + SPEED.monster * ITEMS.fury.multiplier * (TICK_MS / 1000))) < 1e-9);
  run(m, ticksFor(ITEMS.fury.durationMs));
  const x0 = a.x;
  m.addInput('a', { seq: 2, x: 1, y: 0 });
  m.step();
  assert.ok(Math.abs(a.x - x0 - SPEED.monster * (TICK_MS / 1000)) < 1e-9);
});

test('al ser capturado se pierden los objetos de superviviente', () => {
  const m = itemMatch();
  m.players.get('b').inventory = ['smoke', 'energy'];
  place(m, 'a', 300);
  m.step();
  assert.deepEqual(m.players.get('b').inventory, []);
});

test('rastreo: ignora a los supervivientes ocultos', () => {
  const m = itemMatch();
  place(m, 'a', 1000, 900);
  place(m, 'b', 1300, 900); // más cerca, pero invisible
  place(m, 'c', 1000, 1500);
  m.players.get('b').invisUntilMs = m.elapsedMs + 10000;
  m.useAbility('a');
  const you = m.personalize(m.step(), 'a').you;
  assert.ok(Math.abs(you.trackAngle - Math.PI / 2) < 1e-9, 'apunta a c (abajo)');
});
