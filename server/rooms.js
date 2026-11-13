// Gestión de salas SIN dependencia de Socket.IO (se puede probar aislada).
// Una sala está en estado 'lobby' (esperando) o 'playing' (partida en curso).
import { MAX_PLAYERS, MIN_PLAYERS, NAME_MAX_LENGTH, ROOM_CODE_LENGTH } from '../shared/config.js';

// Sin letras/números confundibles (O/0, I/1, L).
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export class RoomError extends Error {}

export function cleanName(raw) {
  if (typeof raw !== 'string') throw new RoomError('Nombre no válido.');
  // Quita caracteres de control y espacios repetidos.
  const name = raw.replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim();
  if (name.length === 0) throw new RoomError('Escribe un nombre.');
  if (name.length > NAME_MAX_LENGTH) throw new RoomError(`El nombre admite como máximo ${NAME_MAX_LENGTH} caracteres.`);
  return name;
}

export class RoomManager {
  constructor(random = Math.random) {
    this.random = random;
    this.rooms = new Map(); // code → room
    this.playerRoom = new Map(); // playerId → code
  }

  newCode() {
    for (let attempt = 0; attempt < 1000; attempt++) {
      let code = '';
      for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
        code += CODE_ALPHABET[Math.floor(this.random() * CODE_ALPHABET.length)];
      }
      if (!this.rooms.has(code)) return code;
    }
    throw new RoomError('No se pudo generar un código de sala.');
  }

  createRoom(playerId, rawName) {
    const name = cleanName(rawName);
    this.ensureFree(playerId);
    const code = this.newCode();
    const room = { code, hostId: playerId, state: 'lobby', players: new Map(), match: null };
    room.players.set(playerId, { id: playerId, name });
    this.rooms.set(code, room);
    this.playerRoom.set(playerId, code);
    return room;
  }

  joinRoom(playerId, rawCode, rawName) {
    const name = cleanName(rawName);
    this.ensureFree(playerId);
    const code = typeof rawCode === 'string' ? rawCode.trim().toUpperCase() : '';
    const room = this.rooms.get(code);
    if (!room) throw new RoomError('No existe ninguna sala con ese código.');
    if (room.state !== 'lobby') throw new RoomError('La partida ya ha empezado.');
    if (room.players.size >= MAX_PLAYERS) throw new RoomError('La sala está llena.');
    room.players.set(playerId, { id: playerId, name });
    this.playerRoom.set(playerId, code);
    return room;
  }

  /** Saca al jugador de su sala. Devuelve la sala (o null si se eliminó o no estaba). */
  leave(playerId) {
    const code = this.playerRoom.get(playerId);
    if (!code) return null;
    this.playerRoom.delete(playerId);
    const room = this.rooms.get(code);
    room.players.delete(playerId);

    if (room.players.size === 0) {
      room.match?.stop();
      this.rooms.delete(code);
      return null;
    }
    // Reasignar anfitrión al jugador más antiguo que quede.
    if (room.hostId === playerId) room.hostId = room.players.keys().next().value;
    return room;
  }

  checkCanStart(playerId) {
    const room = this.roomOf(playerId);
    if (!room) throw new RoomError('No estás en ninguna sala.');
    if (room.hostId !== playerId) throw new RoomError('Solo el anfitrión puede empezar.');
    if (room.state !== 'lobby') throw new RoomError('La partida ya ha empezado.');
    if (room.players.size < MIN_PLAYERS) throw new RoomError(`Hacen falta al menos ${MIN_PLAYERS} jugadores.`);
    return room;
  }

  roomOf(playerId) {
    const code = this.playerRoom.get(playerId);
    return code ? this.rooms.get(code) : null;
  }

  ensureFree(playerId) {
    if (this.playerRoom.has(playerId)) throw new RoomError('Ya estás en una sala.');
  }

  /** Datos públicos de la sala para enviar a los clientes. */
  static publicView(room) {
    return {
      code: room.code,
      hostId: room.hostId,
      state: room.state,
      max: MAX_PLAYERS,
      players: [...room.players.values()].map((p) => ({ id: p.id, name: p.name })),
    };
  }
}
