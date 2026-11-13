// Flujo de pantallas: menú → sala → partida → resultados.
import { EV } from '/shared/events.js';
import { SPRINT_ENERGY_MS, ABILITY, ITEMS } from '/shared/config.js';
import { socket, request } from './net.js';
import { GameScene } from './scenes/GameScene.js';
import { settings } from './settings.js';
import { sfx, unlockAudio } from './sound.js';
import { refreshManifest, hasAsset, UI_IMAGES } from './assets.js';

const $ = (id) => document.getElementById(id);
const screens = ['menu', 'settings', 'credits', 'lobby', 'game-screen', 'results'];

let myId = null;
let game = null; // instancia de Phaser (solo existe durante la partida)
let names = new Map(); // id → nombre de los jugadores de la partida actual
let toastTimer = null;
let pingTimer = null;
let lastTickSecond = null;

function show(screen) {
  for (const s of screens) $(s).hidden = s !== screen;
}

/** mm:ss. Cuenta atrás: redondea hacia arriba; tiempo transcurrido: hacia abajo. */
function formatTime(ms, roundUp = true) {
  const total = roundUp ? Math.ceil(ms / 1000) : Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

// ---------- Imágenes de interfaz (si existen) ----------
refreshManifest().then(() => {
  if (hasAsset(UI_IMAGES.logo)) {
    $('logo').src = `assets/${UI_IMAGES.logo}`;
    $('logo').hidden = false;
    $('title').classList.add('visually-hidden'); // el texto sigue para lectores de pantalla
  }
});

/** Icono de rol: imagen si existe; si no, el símbolo ● / ★. */
function roleIcon(role) {
  const path = role === 'monster' ? UI_IMAGES.iconMonster : UI_IMAGES.iconSurvivor;
  if (hasAsset(path)) {
    const img = document.createElement('img');
    img.src = `assets/${path}`;
    img.alt = '';
    return img;
  }
  return document.createTextNode(role === 'monster' ? '★ ' : '● ');
}

// Cualquier clic desbloquea el audio (los navegadores lo exigen).
document.addEventListener('pointerdown', unlockAudio, { once: true });
document.addEventListener('keydown', unlockAudio, { once: true });

// ---------- Ajustes y créditos ----------
function showVolume() {
  $('volume').value = String(Math.round(settings.volume * 100));
  $('volume-value').textContent = `${Math.round(settings.volume * 100)} %`;
}
showVolume();
$('reduce-motion').checked = settings.reduceMotion;
document.body.classList.toggle('reduce-motion', settings.reduceMotion);
$('volume').oninput = () => {
  settings.set({ volume: Number($('volume').value) / 100 });
  showVolume();
};
$('reduce-motion').onchange = () => {
  settings.set({ reduceMotion: $('reduce-motion').checked });
  document.body.classList.toggle('reduce-motion', settings.reduceMotion);
};
$('btn-test-sound').onclick = () => {
  unlockAudio();
  sfx.test();
};
$('btn-settings').onclick = () => show('settings');
$('btn-credits').onclick = () => show('credits');
for (const b of document.querySelectorAll('.btn-back')) b.onclick = () => show('menu');

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
socket.on(EV.GAME_STARTED, async (data) => {
  names = new Map(data.players.map((p) => [p.id, p.name]));
  lastTickSecond = null;
  show('game-screen');
  stopGame();
  await refreshManifest(); // por si el equipo ha añadido imágenes nuevas
  sfx.start();
  startPing();
  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: '#0d1410',
    scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
    // Delta real entre fotogramas (ver docs/DECISIONS.md, D12).
    fps: { smoothStep: false },
  });
  // Que ningún botón de la página conserve el foco (Espacio lo "pulsaría").
  document.activeElement?.blur();
  game.scene.add('Game', GameScene, true, {
    ...data,
    myId,
    socket,
    onState: updateHud,
    onLocal: updateEnergy,
    onAbility: useAbility,
    onUseItem: useItem,
  });
  window.__hunted = game; // acceso para pruebas automáticas
  updateHud({ timeLeftMs: data.durationMs, survivors: data.players.length - 1, events: [], players: data.players });
});

/** Mide la latencia cada 2 s y la muestra con texto (no solo color). */
function startPing() {
  clearInterval(pingTimer);
  const measure = () => {
    const t0 = performance.now();
    socket.timeout(2000).emit(EV.PING, (err) => {
      const el = $('hud-net');
      if (err) {
        el.textContent = 'Conexión: sin respuesta';
        el.className = 'net bad';
        return;
      }
      const ms = Math.round(performance.now() - t0);
      const quality = ms < 100 ? ['good', 'buena'] : ms < 250 ? ['fair', 'regular'] : ['bad', 'mala'];
      el.textContent = `Conexión ${quality[1]} · ${ms} ms`;
      el.className = `net ${quality[0]}`;
    });
  };
  measure();
  pingTimer = setInterval(measure, 2000);
}

/** Barra de sprint: con el valor predicho (cada fotograma), en % y en texto. */
function updateEnergy(me) {
  const pct = Math.round((me.energy / SPRINT_ENERGY_MS) * 100);
  $('energy-fill').style.width = `${pct}%`;
  $('energy-fill').classList.toggle('exhausted', me.exhausted);
  $('energy-text').textContent = me.exhausted ? 'agotado' : `${pct} %`;
}

/** Espacio: pide al servidor usar la habilidad; si no se puede, explica por qué. */
async function useAbility() {
  const res = await request(EV.ABILITY);
  if (res.ok) sfx.ability();
  else toast(res.error);
}

/** Teclas 1/2: usar un objeto del inventario. */
async function useItem(slot) {
  const res = await request(EV.USE_ITEM, { slot });
  if (res.ok) sfx.item();
  else toast(res.error);
}

/** Inventario (2 ranuras) y efectos activos con su tiempo restante. */
function updateInventory(you) {
  if (!you?.inventory) return;
  for (const slot of [0, 1]) {
    const el = $(`slot-${slot}`);
    const type = you.inventory[slot];
    el.textContent = type ? `${slot + 1} · ${ITEMS[type].name}` : `${slot + 1} · —`;
    el.className = `slot${type ? ` filled ${ITEMS[type].side}` : ''}`;
  }
  const labels = { invis: 'Invisible', fury: 'Furia', radar: 'Radar' };
  $('hud-effects').textContent = Object.entries(you.effects ?? {})
    .filter(([, ms]) => ms > 0)
    .map(([k, ms]) => `${labels[k]} ${Math.ceil(ms / 1000)} s`)
    .join(' · ');
}

/** Estado de la habilidad propia en el HUD (texto + color, no solo color). */
function updateAbility(role, you) {
  if (!role || !you) return;
  const name = ABILITY[role].name;
  const el = $('hud-ability');
  if (you.abilityActiveMs > 0) {
    el.textContent = `${name}: activo ${Math.ceil(you.abilityActiveMs / 1000)} s`;
    el.className = 'ability active';
  } else if (you.abilityReadyMs > 0) {
    el.textContent = `${name}: ${Math.ceil(you.abilityReadyMs / 1000)} s`;
    el.className = 'ability';
  } else {
    el.textContent = `${name}: lista (Espacio)`;
    el.className = 'ability ready';
  }
}

/** Actualiza el HUD (HTML) con cada estado del servidor. */
function updateHud(state) {
  const me = state.players.find((p) => p.id === myId);
  const total = names.size;
  $('hud-timer').textContent = formatTime(state.timeLeftMs);
  $('hud-timer').classList.toggle('urgent', state.timeLeftMs <= 30000);
  $('hud-survivors').textContent = `Supervivientes: ${state.survivors}/${total}`;

  // Últimos 10 segundos: un pitido por segundo.
  const second = Math.ceil(state.timeLeftMs / 1000);
  if (second <= 10 && second > 0 && second !== lastTickSecond) {
    lastTickSecond = second;
    sfx.tick();
  }

  updateAbility(me?.role, state.you);
  updateInventory(state.you);

  if (me) {
    const monster = me.role === 'monster';
    $('hud-role').replaceChildren(roleIcon(me.role), monster ? 'MONSTRUO' : 'SUPERVIVIENTE');
    $('hud-role').className = `role-tag ${me.role}`;
    let status = monster ? 'Atrapa a los supervivientes' : 'Huye de los monstruos';
    if (me.frozen) status = `Inmóvil ${Math.ceil(me.cooldownMs / 1000)} s`;
    else if (monster && me.cooldownMs > 0) status = `Podrás capturar en ${Math.ceil(me.cooldownMs / 1000)} s`;
    $('hud-status').textContent = status;
  }

  for (const ev of state.events ?? []) {
    if (ev.type === 'capture') {
      if (ev.victim === myId) sfx.transformed();
      else sfx.capture();
      const victim = ev.victim === myId ? 'Te ha' : `${names.get(ev.victim)} ha sido`;
      const by = ev.by === myId ? 'ti' : names.get(ev.by);
      toast(ev.victim === myId ? `¡Te ha capturado ${by}! Ahora eres monstruo.` : `${victim} capturado por ${by}.`);
    } else if (ev.type === 'pickup' && ev.by === myId) {
      sfx.pickup();
      toast(`Has recogido: ${ITEMS[ev.item].name}. Úsalo con 1 o 2.`);
    } else if (ev.type === 'newMonster') {
      sfx.newMonster();
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
  // ¿Ha ganado mi bando? Gano si sobreviví (y ganan los supervivientes) o si
  // acabé siendo monstruo (y ganan los monstruos).
  const mine = result.players.find((p) => p.id === myId);
  if (result.winner && mine) {
    const won = (result.winner === 'survivors') === (mine.role === 'survivor');
    (won ? sfx.win : sfx.lose)();
  }
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
      name.append(roleIcon(p.role), p.name + (p.id === myId ? ' (tú)' : ''));
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
  clearInterval(pingTimer);
  pingTimer = null;
  if (game) {
    game.destroy(true);
    game = null;
  }
}
