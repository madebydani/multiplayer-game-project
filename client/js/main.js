// Flujo de pantallas: menú → sala → partida → resultados.
import { EV } from '/shared/events.js';
import { socket, request } from './net.js';
import { GameScene } from './scenes/GameScene.js';

const $ = (id) => document.getElementById(id);
const screens = ['menu', 'lobby', 'game-screen', 'results'];

let myId = null;
let game = null; // instancia de Phaser (solo existe durante la partida)
let names = new Map(); // id → nombre de los jugadores de la partida actual
let toastTimer = null;

function show(screen) {
  for (const s of screens) $(s).hidden = s !== screen;
}

/** mm:ss. Cuenta atrás: redondea hacia arriba; tiempo transcurrido: hacia abajo. */
function formatTime(ms, roundUp = true) {
  const total = roundUp ? Math.ceil(ms / 1000) : Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
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
  $('lobby-error').textContent = '';
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
  $('duration').hidden = !isHost;
  $('duration').value = String(room.durationMin);
  $('duration-text').textContent = isHost ? '' : `${room.durationMin} min`;
  $('lobby-hint').textContent = isHost
    ? enough
      ? 'Cuando estéis todos, empieza la partida.'
      : 'Esperando a otro jugador (mínimo 2).'
    : 'Esperando a que el anfitrión empiece la partida.';
});

$('duration').onchange = async () => {
  const res = await request(EV.SET_DURATION, { minutes: Number($('duration').value) });
  if (!res.ok) $('lobby-error').textContent = res.error;
};

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
$('btn-menu').onclick = leave;
$('btn-again').onclick = () => {
  $('lobby-error').textContent = '';
  show('lobby');
};

// ---------- Partida ----------
socket.on(EV.GAME_STARTED, (data) => {
  names = new Map(data.players.map((p) => [p.id, p.name]));
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
  game.scene.add('Game', GameScene, true, { ...data, myId, socket, onState: updateHud });
  window.__hunted = game; // acceso para pruebas automáticas
  updateHud({ timeLeftMs: data.durationMs, survivors: data.players.length - 1, events: [], players: data.players });
});

/** Actualiza el HUD (HTML) con cada estado del servidor. */
function updateHud(state) {
  const me = state.players.find((p) => p.id === myId);
  const total = names.size;
  $('hud-timer').textContent = formatTime(state.timeLeftMs);
  $('hud-timer').classList.toggle('urgent', state.timeLeftMs <= 30000);
  $('hud-survivors').textContent = `Supervivientes: ${state.survivors}/${total}`;

  if (me) {
    const monster = me.role === 'monster';
    $('hud-role').textContent = monster ? '★ MONSTRUO' : '● SUPERVIVIENTE';
    $('hud-role').className = `role-tag ${me.role}`;
    let status = monster ? 'Atrapa a los supervivientes' : 'Huye de los monstruos';
    if (me.frozen) status = `Inmóvil ${Math.ceil(me.cooldownMs / 1000)} s`;
    else if (monster && me.cooldownMs > 0) status = `Podrás capturar en ${Math.ceil(me.cooldownMs / 1000)} s`;
    $('hud-status').textContent = status;
  }

  for (const ev of state.events ?? []) {
    if (ev.type === 'capture') {
      const victim = ev.victim === myId ? 'Te ha' : `${names.get(ev.victim)} ha sido`;
      const by = ev.by === myId ? 'ti' : names.get(ev.by);
      toast(ev.victim === myId ? `¡Te ha capturado ${by}! Ahora eres monstruo.` : `${victim} capturado por ${by}.`);
    } else if (ev.type === 'newMonster') {
      toast(
        ev.id === myId
          ? 'El monstruo se ha ido: ¡ahora el monstruo eres tú!'
          : `El monstruo se ha ido. ${names.get(ev.id)} es el nuevo monstruo.`,
      );
    }
  }
}

function toast(text) {
  $('toast').textContent = text;
  $('toast').classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 3000);
}

// ---------- Resultados ----------
const REASONS = {
  time: 'Se acabó el tiempo y quedaban supervivientes.',
  allCaptured: 'Todos los supervivientes fueron capturados.',
  abandon: 'Partida terminada por abandono: no quedan jugadores suficientes.',
};

function statusText(p) {
  switch (p.status) {
    case 'survived':
      return { text: 'Sobrevivió', cls: 'survived' };
    case 'initialMonster':
      return { text: 'Monstruo inicial', cls: 'monster' };
    case 'transformed':
      return {
        text: p.reassigned
          ? `Nuevo monstruo por abandono (${formatTime(p.transformedAtMs, false)})`
          : `Transformado a los ${formatTime(p.transformedAtMs, false)} por ${p.capturedBy}`,
        cls: 'monster',
      };
    default:
      return { text: 'Desconectado', cls: '' };
  }
}

socket.on(EV.GAME_ENDED, (result) => {
  stopGame();
  $('results-title').textContent =
    result.winner === 'survivors'
      ? '¡Ganan los supervivientes!'
      : result.winner === 'monsters'
        ? '¡Ganan los monstruos!'
        : 'Partida terminada';
  $('results-reason').textContent = REASONS[result.reason] ?? '';
  $('results-duration').textContent = `Duración: ${formatTime(result.durationMs, false)}`;
  $('results-players').replaceChildren(
    ...result.players.map((p) => {
      const li = document.createElement('li');
      const name = document.createElement('span');
      name.textContent = (p.role === 'monster' ? '★ ' : '● ') + p.name + (p.id === myId ? ' (tú)' : '');
      const st = statusText(p);
      const status = document.createElement('span');
      status.className = `status ${st.cls}`;
      status.textContent = st.text;
      li.append(name, status);
      return li;
    }),
  );
  show('results');
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
