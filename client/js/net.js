// Conexión con el servidor (Socket.IO). `io` lo carga /socket.io/socket.io.js.
export const socket = io();

/** Envía un evento y espera la respuesta (ack) del servidor. */
export function request(event, data = {}) {
  return new Promise((resolve) => {
    socket.timeout(5000).emit(event, data, (err, res) => {
      resolve(err ? { ok: false, error: 'El servidor no responde.' } : res);
    });
  });
}
