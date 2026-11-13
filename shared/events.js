// Nombres de los eventos Socket.IO (los usan cliente y servidor).
export const EV = {
  // Cliente → servidor
  CREATE_ROOM: 'room:create', // { name } → ack { ok, code } | { ok: false, error }
  JOIN_ROOM: 'room:join', // { code, name } → ack
  LEAVE_ROOM: 'room:leave', // sin datos
  START_GAME: 'game:start', // sin datos → ack (solo anfitrión)
  INPUT: 'input', // { seq, x, y } con x, y ∈ {-1, 0, 1}

  // Servidor → cliente
  ROOM_UPDATE: 'room:update', // { code, hostId, players: [{ id, name }], max, state }
  GAME_STARTED: 'game:started', // { map, players: [{ id, name, x, y, color }] }
  STATE: 'state', // { t, players: [{ id, x, y, dx, dy, seq }] }
  GAME_ENDED: 'game:ended', // { reason }
};
