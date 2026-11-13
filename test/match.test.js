import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Match, spawnPoints } from '../server/match.js';
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
  const m = new Match(createTestMap(), players);
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
  const m = new Match(createTestMap(), players);
  const b = m.players.get('b');
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
  const m = new Match(createTestMap(), players);
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
