// Flujo de pantallas: menú → sala → partida.
import { EV } from '/shared/events.js';
import { socket, request } from './net.js';
import { GameScene } from './scenes/GameScene.js';

const $ = (id) => document.getElementById(id);
const screens = ['menu', 'lobby', 'game-screen'];

let myId = null;
let game = null; // instancia de Phaser (solo existe durante la partida)

function show(screen) {
  for (const s of screens) $(s).hidden = s !== screen;
}

// ---------- Menú ----------
try {
  $('name').value = localStorage.getItem('hunted-name') ?? '';
} catch {
  /* almacenamiento no disponible: no pasa nada */
}

async function enterRoom(event, data) {
  $('menu-error').textContent = '';
  const res = await request(event, data);
  if (!res.ok) {
    $('menu-error').textContent = res.error;
    return;
  }
  myId = res.you;
  try {
    localStorage.setItem('hunted-name', data.name);
  } catch {
    /* sin almacenamiento */
  }
  show('lobby');
}

$('btn-create').onclick = () => enterRoom(EV.CREATE_ROOM, { name: $('name').value });
$('btn-join').onclick = () => enterRoom(EV.JOIN_ROOM, { code: $('code').value, name: $('name').value });
$('code').addEventListener('keydown', (e) => e.key === 'Enter' && $('btn-join').click());

// ---------- Sala ----------
socket.on(EV.ROOM_UPDATE, (room) => {
  $('lobby-code').textContent = room.code;
  $('lobby-count').textContent = `(${room.players.length}/${room.max})`;
  $('lobby-players').replaceChildren(
    ...room.players.map((p) => {
      const li = document.createElement('li');
      li.textContent = p.name + (p.id === myId ? ' (tú)' : '');
      if (p.id === room.hostId) {
        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.textContent = 'Anfitrión';
        li.append(badge);
      }
      return li;
    }),
  );

  const isHost = room.hostId === myId;
  const enough = room.players.length >= 2;
  $('btn-start').hidden = !isHost;
  $('btn-start').disabled = !enough;
  $('lobby-hint').textContent = isHost
    ? enough
      ? 'Cuando estéis todos, empieza la partida.'
      : 'Esperando a otro jugador (mínimo 2).'
    : 'Esperando a que el anfitrión empiece la partida.';
});

$('btn-copy').onclick = async () => {
  try {
    await navigator.clipboard.writeText($('lobby-code').textContent);
    $('copy-status').textContent = 'Código copiado.';
  } catch {
    $('copy-status').textContent = 'No se pudo copiar; apúntalo a mano.';
  }
};

$('btn-start').onclick = async () => {
  $('lobby-error').textContent = '';
  const res = await request(EV.START_GAME);
  if (!res.ok) $('lobby-error').textContent = res.error;
};

async function leave() {
  await request(EV.LEAVE_ROOM);
  stopGame();
  show('menu');
}
$('btn-leave').onclick = leave;
$('btn-quit').onclick = leave;

// ---------- Partida ----------
socket.on(EV.GAME_STARTED, (data) => {
  show('game-screen');
  stopGame();
  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: '#0d1410',
    scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
    // Delta real entre fotogramas (ver docs/DECISIONS.md, D12).
    fps: { smoothStep: false },
  });
  game.scene.add('Game', GameScene, true, { ...data, myId, socket });
  window.__hunted = game; // acceso para pruebas automáticas
  $('hud-info').textContent = `${data.players.length} jugadores · WASD / flechas`;
});

socket.on(EV.GAME_ENDED, ({ reason }) => {
  stopGame();
  show('lobby');
  $('lobby-error').textContent =
    reason === 'abandono' ? 'La partida terminó: no quedan jugadores suficientes.' : 'La partida terminó.';
});

socket.on('disconnect', () => {
  stopGame();
  show('menu');
  $('menu-error').textContent = 'Se perdió la conexión con el servidor.';
});

function stopGame() {
  if (game) {
    game.destroy(true);
    game = null;
  }
}
