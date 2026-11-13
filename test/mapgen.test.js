import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateMap, validateMap, floodFill, tooClose, createRandom, MIN_GAP } from '../server/mapgen.js';
import { overlaps } from '../shared/collision.js';
import { PLAYER_RADIUS, MAX_PLAYERS } from '../shared/config.js';
import { Match } from '../server/match.js';

const SEEDS = Array.from({ length: 200 }, (_, i) => i * 7919 + 1);

test('el generador con semilla es reproducible', () => {
  const r1 = createRandom(42);
  const r2 = createRandom(42);
  for (let i = 0; i < 10; i++) assert.equal(r1(), r2());
  assert.deepEqual(generateMap(1234), generateMap(1234));
});

test('semillas distintas dan mapas distintos', () => {
  const a = generateMap(1);
  const b = generateMap(2);
  assert.notDeepEqual(a.obstacles, b.obstacles);
});

test(`${SEEDS.length} semillas: mapas válidos, sin solapamientos y todo conectado`, () => {
  let retries = 0;
  for (const seed of SEEDS) {
    const map = generateMap(seed);
    retries += map.attempts - 1;
    const check = validateMap(map);
    assert.ok(check.ok, `semilla ${seed}: ${check.reason}`);

    // Comprobaciones independientes (no solo confiar en validateMap):
    // 1) ningún par de obstáculos a menos del hueco mínimo
    for (let i = 0; i < map.obstacles.length; i++)
      for (let j = i + 1; j < map.obstacles.length; j++)
        assert.ok(!tooClose(map.obstacles[i], map.obstacles[j]), `semilla ${seed}: obstáculos ${i} y ${j}`);

    // 2) puntos de aparición libres, separados y alcanzables desde cada uno
    assert.equal(map.spawns.length, MAX_PLAYERS);
    for (const s of map.spawns) {
      assert.ok(!map.obstacles.some((ob) => overlaps(s.x, s.y, PLAYER_RADIUS, ob)), `semilla ${seed}: spawn bloqueado`);
      const { walkable, reached } = floodFill(map, s);
      assert.equal(reached, walkable, `semilla ${seed}: desde (${s.x},${s.y}) no se llega a todo`);
    }
  }
  // Informativo: cuántas veces hubo que reintentar con otra semilla.
  assert.ok(retries <= SEEDS.length * 0.05, `demasiados reintentos: ${retries}`);
});

test('los obstáculos no invaden los caminos y respetan el borde', () => {
  for (const seed of SEEDS.slice(0, 30)) {
    const map = generateMap(seed);
    for (const ob of map.obstacles) {
      const box =
        ob.shape === 'circle' ? [ob.x - ob.r, ob.y - ob.r, ob.x + ob.r, ob.y + ob.r] : [ob.x, ob.y, ob.x + ob.w, ob.y + ob.h];
      assert.ok(box[0] >= MIN_GAP && box[1] >= MIN_GAP && box[2] <= map.width - MIN_GAP && box[3] <= map.height - MIN_GAP);
    }
    // Ningún punto del centro de los caminos está bloqueado para un jugador.
    for (const path of map.paths) {
      for (let i = 0; i < path.points.length - 1; i++) {
        const a = path.points[i];
        const b = path.points[i + 1];
        for (let t = 0; t <= 1; t += 0.05) {
          const x = Math.min(Math.max(a.x + (b.x - a.x) * t, PLAYER_RADIUS), map.width - PLAYER_RADIUS);
          const y = Math.min(Math.max(a.y + (b.y - a.y) * t, PLAYER_RADIUS), map.height - PLAYER_RADIUS);
          assert.ok(!map.obstacles.some((ob) => overlaps(x, y, PLAYER_RADIUS, ob)), `semilla ${seed}: camino bloqueado`);
        }
      }
    }
  }
});

test('la validación detecta una zona encerrada', () => {
  // Un anillo de rocas pegadas alrededor del spawn 0 deja una zona aislada.
  const map = generateMap(5);
  const s = map.spawns[0];
  const ring = [];
  for (let k = 0; k < 24; k++) {
    const a = (k / 24) * Math.PI * 2;
    ring.push({ shape: 'circle', kind: 'rock', x: s.x + Math.cos(a) * 120, y: s.y + Math.sin(a) * 120, r: 20 });
  }
  const closed = { ...map, obstacles: ring };
  const { walkable, reached } = floodFill(closed, s);
  assert.ok(reached < walkable);
  assert.equal(validateMap(closed).ok, false);
});

test('la partida usa puntos de aparición del mapa, distintos para cada jugador', () => {
  const map = generateMap(77);
  const players = Array.from({ length: 6 }, (_, i) => ({ id: `p${i}`, name: `P${i}` }));
  const m = new Match(map, players);
  const pos = [...m.players.values()].map((p) => `${p.x},${p.y}`);
  assert.equal(new Set(pos).size, 6);
  for (const p of m.players.values()) assert.ok(map.spawns.some((s) => s.x === p.x && s.y === p.y));
});
