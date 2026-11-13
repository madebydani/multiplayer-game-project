// Prueba de carga y estabilidad (no forma parte de `npm test` porque tarda).
// Arranca un servidor en este proceso y simula muchas salas con jugadores que
// envían entradas al azar, usan habilidades y objetos, y se desconectan.
// Uso: node test/stress.mjs [salas] [jugadoresPorSala] [segundos]
import { io as connect } from 'socket.io-client';
import { createHuntedServer } from '../server/index.js';
import { EV } from '../shared/events.js';
import { TICK_MS } from '../shared/config.js';

const ROOMS = Number(process.argv[2] ?? 10);
const PER_ROOM = Number(process.argv[3] ?? 6);
const SECONDS = Number(process.argv[4] ?? 30);

const srv = createHuntedServer();
await new Promise((r) => srv.httpServer.listen(0, r));
const url = `http://localhost:${srv.httpServer.address().port}`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const ask = (c, ev, data) => c.timeout(5000).emitWithAck(ev, data);

const mem = () => Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
const memStart = mem();
const clients = [];
const stats = { states: 0, ended: 0, errors: 0 };

// Mide cuánto se retrasa el bucle de eventos de Node (si el servidor va sobrecargado, crece).
let maxLag = 0;
let last = performance.now();
const lagTimer = setInterval(() => {
  const now = performance.now();
  maxLag = Math.max(maxLag, now - last - 100);
  last = now;
}, 100);

function bot() {
  const c = connect(url, { transports: ['websocket'], forceNew: true });
  c.on(EV.STATE, () => stats.states++);
  c.on(EV.GAME_ENDED, () => stats.ended++);
  c.on('connect_error', () => stats.errors++);
  clients.push(c);
  return c;
}

console.log(`Creando ${ROOMS} salas × ${PER_ROOM} jugadores (${ROOMS * PER_ROOM} conexiones)…`);
const rooms = [];
for (let r = 0; r < ROOMS; r++) {
  const host = bot();
  const res = await ask(host, EV.CREATE_ROOM, { name: `H${r}` });
  const members = [host];
  for (let i = 1; i < PER_ROOM; i++) {
    const c = bot();
    const j = await ask(c, EV.JOIN_ROOM, { code: res.code, name: `P${r}-${i}` });
    if (!j.ok) throw new Error(j.error);
    members.push(c);
  }
  await ask(host, EV.SET_DURATION, { minutes: 10 });
  const s = await ask(host, EV.START_GAME);
  if (!s.ok) throw new Error(s.error);
  rooms.push({ code: res.code, members });
}

// Cada bot envía una entrada por tick (como un cliente real) y, a veces, acciones.
const seqs = new Map();
const inputTimer = setInterval(() => {
  for (const c of clients) {
    if (!c.connected) continue;
    const seq = (seqs.get(c) ?? 0) + 1;
    seqs.set(c, seq);
    const rnd = () => Math.floor(Math.random() * 3) - 1;
    c.emit(EV.INPUT, { seq, x: rnd(), y: rnd(), s: Math.random() < 0.2 ? 1 : 0 });
    if (Math.random() < 0.01) c.emit(EV.ABILITY, () => {});
    if (Math.random() < 0.01) c.emit(EV.USE_ITEM, { slot: Math.round(Math.random()) }, () => {});
  }
}, TICK_MS);

// Entradas basura de un cliente malicioso: no deben romper nada.
const evil = rooms[0].members[1];
for (const junk of [null, 42, 'x', { seq: 'a' }, { seq: 1e12, x: 9 }, { slot: 'z' }]) {
  evil.emit(EV.INPUT, junk);
  evil.emit(EV.USE_ITEM, junk, () => {});
  evil.emit(EV.ABILITY, junk, () => {});
  evil.emit(EV.JOIN_ROOM, junk, () => {});
}

const t0 = Date.now();
await wait((SECONDS * 1000) / 2);
// A mitad de la prueba: en la mitad de las salas se desconectan todos menos uno.
for (const room of rooms.slice(0, Math.floor(ROOMS / 2))) {
  for (const c of room.members.slice(1)) c.disconnect();
}
await wait((SECONDS * 1000) / 2);
const elapsed = (Date.now() - t0) / 1000;

const activeMatches = [...srv.rooms.rooms.values()].filter((r) => r.match?.running).length;
const statesPerClientPerSec = stats.states / elapsed / clients.length;

// Al final: todos se desconectan; no deben quedar salas ni bucles.
clearInterval(inputTimer);
for (const c of clients) c.disconnect();
await wait(500);
const leftoverRooms = srv.rooms.rooms.size;
const leftoverPlayers = srv.rooms.playerRoom.size;
clearInterval(lagTimer);

const report = {
  conexiones: clients.length,
  segundos: Math.round(elapsed),
  estadosPorClienteYSegundo: +statesPerClientPerSec.toFixed(1),
  esperado: `≈${1000 / TICK_MS} (menos en las salas que terminaron por abandono)`,
  retrasoMaxBucleMs: Math.round(maxLag),
  partidasActivasAntesDeSalir: activeMatches,
  partidasEsperadas: ROOMS - Math.floor(ROOMS / 2),
  partidasTerminadasNotificadas: stats.ended,
  salasQueQuedanAlFinal: leftoverRooms,
  jugadoresQueQuedanAlFinal: leftoverPlayers,
  memoriaMB: { inicio: memStart, fin: mem() },
  erroresConexion: stats.errors,
};
console.log(JSON.stringify(report, null, 1));
srv.io.close();
process.exit(leftoverRooms === 0 && leftoverPlayers === 0 && stats.errors === 0 ? 0 : 1);
