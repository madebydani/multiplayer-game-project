// Nombres de los eventos Socket.IO (los usan cliente y servidor).
export const EV = {
  // Cliente → servidor
  CREATE_ROOM: 'room:create', // { name } → ack { ok, code } | { ok: false, error }
  JOIN_ROOM: 'room:join', // { code, name } → ack
  LEAVE_ROOM: 'room:leave', // sin datos
  SET_DURATION: 'room:duration', // { minutes } → ack (solo anfitrión)
  START_GAME: 'game:start', // sin datos → ack (solo anfitrión)
  INPUT: 'input', // { seq, x, y } con x, y ∈ {-1, 0, 1}
  PING: 'net:ping', // sin datos → ack vacío (para medir la latencia)

  // Servidor → cliente
  ROOM_UPDATE: 'room:update', // { code, hostId, players: [{ id, name }], max, state, durationMin }
  GAME_STARTED: 'game:started', // { map, durationMs, players: [{ id, name, x, y, color, role }] }
  STATE: 'state', // { t, timeLeftMs, survivors, events, players: [{ id, x, y, dx, dy, seq, role, frozen, cooldownMs }] }
  GAME_ENDED: 'game:ended', // resultado: { winner, reason, durationMs, players: [...] }
};
