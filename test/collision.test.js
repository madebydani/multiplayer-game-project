import { test } from 'node:test';
import assert from 'node:assert/strict';
import { overlaps, moveCircle } from '../shared/collision.js';
import { createTestMap } from '../shared/testMap.js';
import { PLAYER_RADIUS } from '../shared/config.js';

const bounds = { width: 1000, height: 1000 };
const R = 16;

test('overlaps detecta círculo y rectángulo', () => {
  const tree = { shape: 'circle', x: 100, y: 100, r: 20 };
  assert.equal(overlaps(130, 100, R, tree), true);
  assert.equal(overlaps(140, 100, R, tree), false);
  const box = { shape: 'rect', x: 0, y: 0, w: 50, h: 50 };
  assert.equal(overlaps(60, 25, R, box), true);
  assert.equal(overlaps(70, 25, R, box), false);
});

test('movimiento libre sin obstáculos', () => {
  const p = moveCircle(500, 500, R, 30, -20, [], bounds);
  assert.deepEqual(p, { x: 530, y: 480 });
});

test('no atraviesa un árbol al avanzar contra él', () => {
  const tree = { shape: 'circle', x: 200, y: 100, r: 20 };
  let x = 100;
  for (let i = 0; i < 50; i++) ({ x } = moveCircle(x, 100, R, 10, 0, [tree], bounds));
  assert.ok(x <= 200 - 20 - R + 0.001, `x=${x}`);
});

test('no atraviesa una pared fina con un paso grande', () => {
  const wall = { shape: 'rect', x: 200, y: 0, w: 4, h: 1000 };
  const p = moveCircle(150, 500, R, 300, 0, [wall], bounds);
  assert.ok(p.x < 200, `x=${p.x}`);
});

test('resbala a lo largo de una pared en diagonal', () => {
  const wall = { shape: 'rect', x: 200, y: 0, w: 50, h: 1000 };
  const p = moveCircle(184, 500, R, 10, 10, [wall], bounds);
  assert.ok(p.x <= 184.001);
  assert.ok(p.y > 505);
});

test('respeta los límites del mapa', () => {
  const p = moveCircle(20, 20, R, -100, -100, [], bounds);
  assert.deepEqual(p, { x: R, y: R });
});

test('el punto de aparición del mapa de prueba está libre', () => {
  const map = createTestMap();
  const blocked = map.obstacles.some((ob) => overlaps(map.spawn.x, map.spawn.y, PLAYER_RADIUS, ob));
  assert.equal(blocked, false);
});

test('los obstáculos del mapa de prueba no se solapan entre sí', () => {
  const { obstacles } = createTestMap();
  const bad = [];
  for (let i = 0; i < obstacles.length; i++) {
    for (let j = i + 1; j < obstacles.length; j++) {
      const a = obstacles[i];
      const b = obstacles[j];
      // Comprobación aproximada: círculo envolvente de cada obstáculo.
      const ra = a.shape === 'circle' ? a.r : Math.hypot(a.w, a.h) / 2;
      const rb = b.shape === 'circle' ? b.r : Math.hypot(b.w, b.h) / 2;
      const ca = a.shape === 'circle' ? a : { x: a.x + a.w / 2, y: a.y + a.h / 2 };
      const cb = b.shape === 'circle' ? b : { x: b.x + b.w / 2, y: b.y + b.h / 2 };
      if (Math.hypot(ca.x - cb.x, ca.y - cb.y) < ra + rb) bad.push(`${a.kind}@${ca.x},${ca.y} / ${b.kind}@${cb.x},${cb.y}`);
    }
  }
  assert.deepEqual(bad, []);
});
