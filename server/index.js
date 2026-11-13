// Servidor HTTP de HUNTED.
// Fase 2: solo sirve el cliente, el código compartido y Phaser.
// En la fase 3 se añadirá Socket.IO sobre este mismo servidor.
import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT) || 3000;

const app = express();
app.use(express.static(path.join(root, 'client')));
app.use('/shared', express.static(path.join(root, 'shared')));
app.use('/vendor/phaser', express.static(path.join(root, 'node_modules/phaser/dist')));

const server = createServer(app);
server.listen(PORT, () => {
  console.log(`HUNTED escuchando en http://localhost:${PORT}`);
});
