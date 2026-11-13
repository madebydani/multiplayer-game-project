// Servidor de HUNTED: sirve el cliente y gestiona salas y partidas con Socket.IO.
import express from 'express';
import { createServer } from 'node:http';
import { networkInterfaces } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { Server } from 'socket.io';
import { EV } from '../shared/events.js';
import { createTestMap } from '../shared/testMap.js';
import { RoomManager, RoomError } from './rooms.js';
import { Match } from './match.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function createHuntedServer() {
  const app = express();
  app.use(express.static(path.join(root, 'client')));
  app.use('/shared', express.static(path.join(root, 'shared')));
  app.use('/vendor/phaser', express.static(path.join(root, 'node_modules/phaser/dist')));

  const httpServer = createServer(app);
  const io = new Server(httpServer);
  const rooms = new RoomManager();

  const sendRoom = (room) => io.to(room.code).emit(EV.ROOM_UPDATE, RoomManager.publicView(room));

  /** La partida terminó: comunica el resultado a todos y vuelve la sala a espera. */
  function endMatch(room, result) {
    room.match?.stop();
    room.match = null;
    room.state = 'lobby';
    io.to(room.code).emit(EV.GAME_ENDED, result);
    sendRoom(room);
  }

  /** Saca a un jugador de su sala (por salir o por desconexión). */
  function leaveRoom(socket) {
    const before = rooms.roomOf(socket.id);
    if (!before) return;
    socket.leave(before.code);
    const room = rooms.leave(socket.id); // null si la sala quedó vacía (y se borró)
    if (!room) return;
    // Si la partida termina por esta salida, endMatch ya avisa a la sala.
    room.match?.removePlayer(socket.id);
    sendRoom(room);
  }

  // Envuelve un manejador para responder { ok, error } por el ack de Socket.IO.
  const handle = (fn) => (data, ack) => {
    const reply = typeof ack === 'function' ? ack : () => {};
    try {
      reply({ ok: true, ...(fn(data ?? {}) ?? {}) });
    } catch (err) {
      if (!(err instanceof RoomError)) console.error(err);
      reply({ ok: false, error: err instanceof RoomError ? err.message : 'Error interno.' });
    }
  };

  io.on('connection', (socket) => {
    socket.on(
      EV.CREATE_ROOM,
      handle(({ name }) => {
        const room = rooms.createRoom(socket.id, name);
        socket.join(room.code);
        sendRoom(room);
        return { code: room.code, you: socket.id };
      }),
    );

    socket.on(
      EV.JOIN_ROOM,
      handle(({ code, name }) => {
        const room = rooms.joinRoom(socket.id, code, name);
        socket.join(room.code);
        sendRoom(room);
        return { code: room.code, you: socket.id };
      }),
    );

    socket.on(EV.LEAVE_ROOM, handle(() => leaveRoom(socket)));

    socket.on(
      EV.START_GAME,
      handle(() => {
        const room = rooms.checkCanStart(socket.id);
        room.state = 'playing';
        const match = new Match(createTestMap(), [...room.players.values()], {
          durationMs: room.durationMin * 60000,
        });
        room.match = match;
        io.to(room.code).emit(EV.GAME_STARTED, match.initialView());
        sendRoom(room);
        match.start(
          (snapshot) => io.to(room.code).emit(EV.STATE, snapshot),
          (result) => {
            if (room.match === match) endMatch(room, result);
          },
        );
      }),
    );

    socket.on(
      EV.SET_DURATION,
      handle(({ minutes }) => {
        sendRoom(rooms.setDuration(socket.id, minutes));
      }),
    );

    socket.on(EV.INPUT, (input) => {
      rooms.roomOf(socket.id)?.match?.addInput(socket.id, input);
    });

    socket.on('disconnect', () => leaveRoom(socket));
  });

  return { app, httpServer, io, rooms };
}

/** Direcciones IPv4 de la red local, para conectarse desde otro ordenador. */
function lanAddresses() {
  return Object.values(networkInterfaces())
    .flat()
    .filter((n) => n && n.family === 'IPv4' && !n.internal)
    .map((n) => n.address);
}

// Arranque solo si se ejecuta directamente (no al importarlo en las pruebas).
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const PORT = Number(process.env.PORT) || 3000;
  const { httpServer } = createHuntedServer();
  httpServer.listen(PORT, () => {
    console.log(`HUNTED escuchando en http://localhost:${PORT}`);
    for (const ip of lanAddresses()) console.log(`  Desde otro ordenador de la red: http://${ip}:${PORT}`);
  });
}
