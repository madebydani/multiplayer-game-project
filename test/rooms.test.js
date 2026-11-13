import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RoomManager, RoomError, cleanName } from '../server/rooms.js';

test('crear sala: código de 4 caracteres y creador como anfitrión', () => {
  const rm = new RoomManager();
  const room = rm.createRoom('a', 'Ana');
  assert.match(room.code, /^[A-Z2-9]{4}$/);
  assert.equal(room.hostId, 'a');
  assert.equal(room.state, 'lobby');
});

test('los códigos son únicos entre salas activas', () => {
  // Generador "malo" que repite el primer código: debe buscar otro.
  const seq = [0, 0, 0, 0, 0, 0, 0, 0, 0.5, 0.5, 0.5, 0.5];
  let i = 0;
  const rm = new RoomManager(() => seq[i++ % seq.length]);
  const r1 = rm.createRoom('a', 'Ana');
  const r2 = rm.createRoom('b', 'Bea');
  assert.notEqual(r1.code, r2.code);
});

test('unirse por código (sin importar mayúsculas)', () => {
  const rm = new RoomManager();
  const room = rm.createRoom('a', 'Ana');
  rm.joinRoom('b', room.code.toLowerCase(), 'Bea');
  assert.equal(room.players.size, 2);
});

test('errores al unirse: código inexistente, sala llena, partida empezada', () => {
  const rm = new RoomManager();
  assert.throws(() => rm.joinRoom('x', 'ZZZZ', 'X'), RoomError);

  const room = rm.createRoom('p0', 'P0');
  for (let i = 1; i < 6; i++) rm.joinRoom(`p${i}`, room.code, `P${i}`);
  assert.throws(() => rm.joinRoom('p6', room.code, 'P6'), /llena/);

  const r2 = rm.createRoom('q0', 'Q0');
  rm.joinRoom('q1', r2.code, 'Q1');
  r2.state = 'playing';
  assert.throws(() => rm.joinRoom('q2', r2.code, 'Q2'), /empezado/);
});

test('no se puede estar en dos salas a la vez', () => {
  const rm = new RoomManager();
  const room = rm.createRoom('a', 'Ana');
  assert.throws(() => rm.createRoom('a', 'Ana'), /Ya estás/);
  assert.throws(() => rm.joinRoom('a', room.code, 'Ana'), /Ya estás/);
});

test('si sale el anfitrión se reasigna; sala vacía se elimina', () => {
  const rm = new RoomManager();
  const room = rm.createRoom('a', 'Ana');
  rm.joinRoom('b', room.code, 'Bea');
  rm.leave('a');
  assert.equal(room.hostId, 'b');
  assert.equal(rm.leave('b'), null);
  assert.equal(rm.rooms.size, 0);
});

test('solo el anfitrión empieza y con al menos 2 jugadores', () => {
  const rm = new RoomManager();
  const room = rm.createRoom('a', 'Ana');
  assert.throws(() => rm.checkCanStart('a'), /al menos 2/);
  rm.joinRoom('b', room.code, 'Bea');
  assert.throws(() => rm.checkCanStart('b'), /anfitrión/);
  assert.equal(rm.checkCanStart('a'), room);
});

test('validación de nombres', () => {
  assert.equal(cleanName('  Ana   López '), 'Ana López');
  assert.throws(() => cleanName('   '), RoomError);
  assert.throws(() => cleanName('x'.repeat(17)), RoomError);
  assert.throws(() => cleanName(42), RoomError);
});
