// Prueba de integración: servidor real + dos clientes Socket.IO.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { io as connect } from 'socket.io-client';
import { createHuntedServer } from '../server/index.js';
import { EV } from '../shared/events.js';
import { applyInput } from '../shared/movement.js';
import { TICK_MS } from '../shared/config.js';

let server;
let url;
const clients = [];

before(async () => {
  server = createHuntedServer();
  await new Promise((r) => server.httpServer.listen(0, r));
  url = `http://localhost:${server.httpServer.address().port}`;
});

after(async () => {
  for (const c of clients) c.disconnect();
  server.io.close();
});

function client() {
  const c = connect(url, { transports: ['websocket'], forceNew: true });
  clients.push(c);
  return c;
}
const ask = (c, ev, data) => c.timeout(2000).emitWithAck(ev, data);
const once = (c, ev) => new Promise((r) => c.once(ev, r));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

test('dos clientes: sala, inicio, movimiento sincronizado y abandono', async () => {
  const a = client();
  const b = client();

  const created = await ask(a, EV.CREATE_ROOM, { name: 'Ana' });
  assert.equal(created.ok, true);

  const lobbyUpdate = once(a, EV.ROOM_UPDATE);
  const joined = await ask(b, EV.JOIN_ROOM, { code: created.code, name: 'Bea' });
  assert.equal(joined.ok, true);
  const room = await lobbyUpdate;
  assert.deepEqual(room.players.map((p) => p.name), ['Ana', 'Bea']);

  // B no es anfitrión: no puede empezar.
  assert.equal((await ask(b, EV.START_GAME)).ok, false);

  const startedB = once(b, EV.GAME_STARTED);
  assert.equal((await ask(a, EV.START_GAME)).ok, true);
  const start = await startedB;
  assert.equal(start.players.length, 2);
  // Se mueve el superviviente (el monstruo inicial está inmóvil 5 s).
  const runner = start.players.find((p) => p.role === 'survivor');
  const sock = runner.id === created.you ? a : b;
  const watcher = sock === a ? b : a;

  // 10 entradas hacia arriba, al ritmo real del cliente (1 cada TICK_MS).
  for (let s = 1; s <= 10; s++) {
    sock.emit(EV.INPUT, { seq: s, x: 0, y: -1 });
    await wait(TICK_MS);
  }
  await wait(300);

  // El otro cliente recibe el estado con el superviviente desplazado.
  const state = await once(watcher, EV.STATE);
  const now = state.players.find((p) => p.id === runner.id);
  assert.equal(now.seq, 10);
  assert.equal(state.survivors, 1);
  // La predicción del cliente (misma función applyInput) coincide con el servidor.
  const predicted = { x: runner.x, y: runner.y, dx: 0, dy: 1, lastSeq: 0, role: 'survivor' };
  for (let s = 1; s <= 10; s++) applyInput(predicted, { seq: s, x: 0, y: -1 }, TICK_MS / 1000, start.map);
  assert.ok(runner.y - now.y > 30, `se movió ${runner.y - now.y}px`);
  assert.ok(
    Math.abs(predicted.x - now.x) < 0.01 && Math.abs(predicted.y - now.y) < 0.01,
    `predicho ${predicted.x},${predicted.y} servidor ${now.x},${now.y}`,
  );

  // Unirse a una partida en curso no está permitido.
  const c = client();
  assert.equal((await ask(c, EV.JOIN_ROOM, { code: created.code, name: 'Cris' })).ok, false);

  // Si B se desconecta, queda 1 jugador: fin por abandono y bucle detenido.
  const ended = once(a, EV.GAME_ENDED);
  b.disconnect();
  const result = await ended;
  assert.equal(result.reason, 'abandon');
  assert.equal(result.winner, null);
  assert.equal(result.players.find((p) => p.name === 'Bea').status, 'disconnected');
  const serverRoom = server.rooms.rooms.get(created.code);
  assert.equal(serverRoom.state, 'lobby');
  assert.equal(serverRoom.match, null);
  assert.equal(serverRoom.hostId, created.you);

  // Al salir el último jugador, la sala desaparece.
  await ask(a, EV.LEAVE_ROOM);
  assert.equal(server.rooms.rooms.has(created.code), false);
});

test('salas aisladas: una sala no recibe el estado de otra', async () => {
  const a = client();
  const b = client();
  const x = client();
  const y = client();
  const r1 = await ask(a, EV.CREATE_ROOM, { name: 'A' });
  await ask(b, EV.JOIN_ROOM, { code: r1.code, name: 'B' });
  const r2 = await ask(x, EV.CREATE_ROOM, { name: 'X' });
  await ask(y, EV.JOIN_ROOM, { code: r2.code, name: 'Y' });

  await ask(a, EV.START_GAME);
  let leaked = false;
  x.on(EV.STATE, () => (leaked = true));
  await wait(300);
  assert.equal(leaked, false);
  assert.equal(server.rooms.rooms.get(r2.code).state, 'lobby');
});

test('duración elegida por el anfitrión y partida completa hasta victoria', async () => {
  const a = client();
  const b = client();
  const r = await ask(a, EV.CREATE_ROOM, { name: 'Ana' });
  await ask(b, EV.JOIN_ROOM, { code: r.code, name: 'Bea' });
  assert.equal((await ask(b, EV.SET_DURATION, { minutes: 3 })).ok, false); // no es anfitrión
  assert.equal((await ask(a, EV.SET_DURATION, { minutes: 4 })).ok, false); // no permitido
  const upd = once(b, EV.ROOM_UPDATE);
  assert.equal((await ask(a, EV.SET_DURATION, { minutes: 3 })).ok, true);
  assert.equal((await upd).durationMin, 3);

  const started = once(a, EV.GAME_STARTED);
  await ask(a, EV.START_GAME);
  assert.equal((await started).durationMs, 3 * 60000);

  // Para no esperar 3 minutos, el test acorta la partida en el servidor.
  const match = server.rooms.rooms.get(r.code).match;
  match.durationMs = match.elapsedMs + 200;
  const ended = await once(b, EV.GAME_ENDED);
  assert.equal(ended.winner, 'survivors');
  assert.equal(ended.reason, 'time');
  assert.equal(match.running, false);
  assert.equal(server.rooms.rooms.get(r.code).state, 'lobby');
});

test('el servidor publica la lista de imágenes disponibles', async () => {
  const res = await fetch(`${url}/assets-manifest.json`);
  assert.equal(res.status, 200);
  const files = await res.json();
  assert.ok(Array.isArray(files));
  assert.ok(files.every((f) => /\.(png|jpe?g|webp|ogg|mp3|wav)$/i.test(f) && !f.includes('\\')));
});

test('ping: el servidor responde al instante', async () => {
  const c = client();
  const t0 = Date.now();
  await c.timeout(2000).emitWithAck(EV.PING);
  assert.ok(Date.now() - t0 < 500);
});
