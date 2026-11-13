// Escena de juego: dibujo del mapa y de los jugadores, entrada y red.
//
// ARTE: si existe la imagen definitiva (ver client/js/assets.js) se usa; si no,
// se dibuja un placeholder geométrico. Roles distinguibles por FORMA además de
// color: superviviente = círculo / explorador; monstruo = estrella / criatura.
// Un monstruo que aún no puede capturar se ve translúcido.
//
// RED — jugador local: PREDICCIÓN. Cada TICK_MS lee el teclado, se mueve al
// instante y envía la entrada. Al llegar el estado del servidor, toma su
// posición como buena y vuelve a aplicar las entradas que aún no ha procesado.
// RED — jugadores remotos: INTERPOLACIÓN, dibujados INTERP_DELAY_MS en el pasado.
import { PLAYER_RADIUS, TICK_MS, INTERP_DELAY_MS } from '/shared/config.js';
import { EV } from '/shared/events.js';
import { applyInput } from '/shared/movement.js';
import { availableTextures, FILL } from '../assets.js';
import { settings } from '../settings.js';

const COLORS = {
  ground: 0x1f3324,
  grid: 0x263d2b,
  path: 0x4a3f2c,
  tree: 0x0f2414,
  treeEdge: 0x2f5a35,
  rock: 0x6b6f73,
  rockLight: 0x8a8f94,
  cabin: 0x6d4428,
  cabinDark: 0x4e2f1a,
  bush: 0x2e5e34,
  bushLight: 0x3f7a45,
  monster: 0xe53935,
};

// Tamaño en pantalla de la imagen de un personaje (el dibujo ocupa ~2/3).
const CHARACTER_SIZE = 64 / FILL.character;
const MINIMAP_WIDTH = 180;

export class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  /** data = { map, players, myId, socket, onState } */
  init(data) {
    this.map = data.map;
    this.myId = data.myId;
    this.socket = data.socket;
    this.initialPlayers = data.players;
    this.onStateCallback = data.onState ?? (() => {});
  }

  preload() {
    for (const [key, path] of availableTextures()) {
      if (!this.textures.exists(key)) this.load.image(key, `assets/${path}`);
    }
  }

  create() {
    this.drawMap();

    this.sprites = new Map(); // id → datos de dibujo del jugador
    this.snapshots = []; // estados recibidos (para interpolar remotos)
    this.roles = new Map(); // id → rol actual (para el minimapa)
    for (const p of this.initialPlayers) {
      this.addPlayerSprite(p);
      this.roles.set(p.id, p.role);
    }

    const me = this.initialPlayers.find((p) => p.id === this.myId);
    // frozen empieza en true si soy el monstruo inicial (inmóvil 5 s).
    this.me = { x: me.x, y: me.y, dx: 0, dy: 1, lastSeq: 0, role: me.role, frozen: me.role === 'monster' };
    this.prev = { x: me.x, y: me.y }; // posición en el tick anterior (suavizado)
    this.pending = []; // entradas enviadas y aún no confirmadas
    this.seq = 0;
    this.acc = 0;
    this.moving = false;

    const mine = this.sprites.get(this.myId);
    mine.container.setDepth(20);
    this.cameras.main.setBounds(0, 0, this.map.width, this.map.height);
    this.cameras.main.startFollow(mine.container, true, 0.2, 0.2);

    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,LEFT,DOWN,RIGHT');
    this.input.keyboard.on('keydown-M', () => this.toggleMinimap());

    this.createMinimap();

    this.onState = (s) => this.receiveState(s);
    this.socket.on(EV.STATE, this.onState);
    this.events.once('destroy', () => {
      this.socket.off(EV.STATE, this.onState);
      this.minimap?.canvas.remove();
    });
  }

  // ---------- Jugadores ----------

  addPlayerSprite(p) {
    // Sombra y anillo de color: no giran, van bajo el cuerpo.
    const shadow = this.add.ellipse(3, 6, PLAYER_RADIUS * 2.2, PLAYER_RADIUS * 1.4, 0x000000, 0.35);
    const ring = this.add.circle(0, 0, PLAYER_RADIUS + 5).setStrokeStyle(3, p.color, 0.9);
    const arrow = this.add.triangle(0, 0, 0, -6, 0, 6, 10, 0, 0xffffff);
    const label = this.add
      .text(0, -PLAYER_RADIUS - 30, '', {
        fontSize: '14px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    const container = this.add.container(p.x, p.y, [shadow, ring, arrow, label]).setDepth(10);
    const sprite = {
      container,
      shadow,
      ring,
      arrow,
      label,
      body: null,
      role: null,
      angle: 0,
      color: p.color,
      name: p.name,
      isMe: p.id === this.myId,
    };
    this.sprites.set(p.id, sprite);
    this.setRole(sprite, p.role, false);
  }

  /** Dibuja el cuerpo según el rol: imagen si existe; si no, círculo o estrella. */
  setRole(sprite, role, animate = true) {
    if (sprite.role === role) return;
    sprite.role = role;
    sprite.body?.destroy();

    if (this.textures.exists(role)) {
      sprite.body = this.add.image(0, 0, role).setDisplaySize(CHARACTER_SIZE, CHARACTER_SIZE);
      sprite.arrow.setVisible(false); // la propia imagen indica hacia dónde mira
      // Anillo y sombra al tamaño del dibujo (~64 px), para que se vean alrededor.
      sprite.ring.setRadius(36);
      sprite.shadow.setSize(64, 40);
    } else {
      sprite.ring.setRadius(PLAYER_RADIUS + 5);
      sprite.shadow.setSize(PLAYER_RADIUS * 2.2, PLAYER_RADIUS * 1.4);
      const outline = sprite.isMe ? 0xffffff : 0x000000;
      sprite.body =
        role === 'monster'
          ? this.add.star(0, 0, 6, PLAYER_RADIUS * 0.6, PLAYER_RADIUS * 1.25, COLORS.monster).setStrokeStyle(3, sprite.color)
          : this.add.circle(0, 0, PLAYER_RADIUS, sprite.color).setStrokeStyle(3, outline);
      sprite.arrow.setVisible(true);
    }
    sprite.baseScale = sprite.body.scaleX;
    sprite.body.setRotation(sprite.angle);
    sprite.container.addAt(sprite.body, 2); // encima de sombra y anillo
    sprite.label.setText(`${role === 'monster' ? '★' : '●'} ${sprite.name}${sprite.isMe ? ' (tú)' : ''}`);

    if (animate && !settings.reduceMotion) {
      // Efecto de transformación: destello y "rebote" de tamaño.
      sprite.container.setScale(1.8);
      this.tweens.add({ targets: sprite.container, scale: 1, duration: 400, ease: 'Back.Out' });
      const flash = this.add.circle(sprite.container.x, sprite.container.y, PLAYER_RADIUS * 3, COLORS.monster, 0.5).setDepth(5);
      this.tweens.add({ targets: flash, alpha: 0, scale: 2, duration: 500, onComplete: () => flash.destroy() });
    }
  }

  /** Orienta al jugador hacia donde se mueve y lo balancea al andar. */
  setDirection(sprite, dx, dy, moving, time) {
    if (dx !== 0 || dy !== 0) {
      const target = Math.atan2(dy, dx);
      // Giro suave (o instantáneo si se reducen las animaciones).
      sprite.angle = settings.reduceMotion ? target : Phaser.Math.Angle.RotateTo(sprite.angle, target, 0.25);
    }
    sprite.body.setRotation(sprite.angle);
    sprite.arrow.setRotation(sprite.angle);
    sprite.arrow.setAlpha(moving ? 1 : 0.4);

    // Balanceo al andar: leve pulso de tamaño.
    const bob = moving && !settings.reduceMotion ? 1 + 0.05 * Math.sin(time / 70) : 1;
    sprite.body.setScale(sprite.baseScale * bob);
  }

  // ---------- Mapa ----------

  drawMap() {
    const { width, height } = this.map;
    const has = (key) => this.textures.exists(key);

    // Suelo: textura en mosaico si existe; si no, color y rejilla tenue.
    if (has('ground')) {
      this.add.tileSprite(0, 0, width, height, 'ground').setOrigin(0);
    } else {
      const g = this.add.graphics();
      g.fillStyle(COLORS.ground).fillRect(0, 0, width, height);
      g.lineStyle(1, COLORS.grid);
      for (let x = 0; x <= width; x += 100) g.lineBetween(x, 0, x, height);
      for (let y = 0; y <= height; y += 100) g.lineBetween(0, y, width, y);
    }

    const g = this.add.graphics();

    // Caminos: polilíneas gruesas con las uniones redondeadas.
    for (const path of this.map.paths ?? []) {
      g.lineStyle(path.width, COLORS.path);
      g.fillStyle(COLORS.path);
      for (let i = 0; i < path.points.length - 1; i++) {
        const a = path.points[i];
        const b = path.points[i + 1];
        g.lineBetween(a.x, a.y, b.x, b.y);
        g.fillCircle(b.x, b.y, path.width / 2);
      }
    }

    // Variantes disponibles de cada tipo (p. ej. tree_1, tree_3 si falta tree_2).
    const variants = (prefix) => [1, 2, 3].map((n) => `${prefix}_${n}`).filter(has);
    const trees = variants('tree');
    const rocks = variants('rock');
    const bushes = variants('bush');

    // Arbustos (decoración, sin colisión): debajo de los jugadores.
    (this.map.decor ?? []).forEach((d, i) => {
      if (bushes.length) {
        const size = (d.r * 2) / FILL.bush;
        this.add.image(d.x, d.y, bushes[i % bushes.length]).setDisplaySize(size, size);
      } else {
        g.fillStyle(COLORS.bush).fillCircle(d.x, d.y, d.r);
        g.fillStyle(COLORS.bushLight).fillCircle(d.x - d.r * 0.3, d.y - d.r * 0.3, d.r * 0.5);
      }
    });

    // Obstáculos: por encima de los jugadores (las copas tapan un poco al pasar al lado).
    this.map.obstacles.forEach((ob, i) => {
      if (ob.kind === 'tree') {
        if (trees.length) {
          const size = (ob.r * 2) / FILL.tree;
          this.add.image(ob.x, ob.y, trees[i % trees.length]).setDisplaySize(size, size).setDepth(30);
        } else {
          g.fillStyle(COLORS.tree).fillCircle(ob.x, ob.y, ob.r);
          g.lineStyle(3, COLORS.treeEdge).strokeCircle(ob.x, ob.y, ob.r);
          g.fillStyle(COLORS.treeEdge).fillCircle(ob.x - ob.r * 0.25, ob.y - ob.r * 0.25, ob.r * 0.35);
        }
      } else if (ob.kind === 'rock') {
        if (rocks.length) {
          const size = (ob.r * 2) / FILL.rock;
          this.add.image(ob.x, ob.y, rocks[i % rocks.length]).setDisplaySize(size, size);
        } else {
          g.fillStyle(COLORS.rock).fillCircle(ob.x, ob.y, ob.r);
          g.fillStyle(COLORS.rockLight).fillCircle(ob.x - ob.r * 0.3, ob.y - ob.r * 0.3, ob.r * 0.4);
        }
      } else if (ob.shape === 'rect') {
        if (has('cabin')) {
          this.add.image(ob.x, ob.y, 'cabin').setOrigin(0).setDisplaySize(ob.w, ob.h);
        } else {
          // Cabaña vista desde arriba: tejado a dos aguas.
          g.fillStyle(COLORS.cabin).fillRect(ob.x, ob.y, ob.w, ob.h);
          g.fillStyle(COLORS.cabinDark).fillRect(ob.x, ob.y + ob.h / 2, ob.w, ob.h / 2);
          g.lineStyle(3, 0x000000).strokeRect(ob.x, ob.y, ob.w, ob.h);
          g.lineBetween(ob.x, ob.y + ob.h / 2, ob.x + ob.w, ob.y + ob.h / 2);
        }
      }
    });
    g.lineStyle(6, 0x000000).strokeRect(0, 0, width, height);
  }

  // ---------- Minimapa ----------
  // Lienzo HTML aparte (no Phaser): muestra el bosque, a ti y a los de TU bando.
  // No muestra a los rivales: eso sería un "radar" (previsto como objeto en la fase 7).

  createMinimap() {
    const scale = MINIMAP_WIDTH / this.map.width;
    const w = MINIMAP_WIDTH;
    const h = Math.round(this.map.height * scale);

    // Fondo estático pintado una sola vez.
    const background = document.createElement('canvas');
    background.width = w;
    background.height = h;
    const bg = background.getContext('2d');
    bg.fillStyle = '#1f3324';
    bg.fillRect(0, 0, w, h);
    bg.strokeStyle = '#6b5236';
    bg.lineCap = 'round';
    bg.lineJoin = 'round';
    for (const path of this.map.paths ?? []) {
      bg.lineWidth = Math.max(2, path.width * scale);
      bg.beginPath();
      path.points.forEach((p, i) => (i ? bg.lineTo(p.x * scale, p.y * scale) : bg.moveTo(p.x * scale, p.y * scale)));
      bg.stroke();
    }
    for (const ob of this.map.obstacles) {
      bg.fillStyle = ob.kind === 'rock' ? '#7d8288' : ob.kind === 'cabin' ? '#7a4e2d' : '#0f2414';
      if (ob.shape === 'circle') {
        bg.beginPath();
        bg.arc(ob.x * scale, ob.y * scale, Math.max(1.5, ob.r * scale), 0, Math.PI * 2);
        bg.fill();
      } else {
        bg.fillRect(ob.x * scale, ob.y * scale, ob.w * scale, ob.h * scale);
      }
    }

    const canvas = document.createElement('canvas');
    canvas.id = 'minimap';
    canvas.width = w;
    canvas.height = h;
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Minimapa: tu posición y la de tu bando. Tecla M para ocultarlo.');
    document.getElementById('game-screen').append(canvas);
    this.minimap = { canvas, ctx: canvas.getContext('2d'), background, scale, visible: true };
  }

  toggleMinimap() {
    this.minimap.visible = !this.minimap.visible;
    this.minimap.canvas.hidden = !this.minimap.visible;
  }

  drawMinimap() {
    const m = this.minimap;
    if (!m.visible) return;
    const { ctx, scale } = m;
    ctx.drawImage(m.background, 0, 0);
    const myRole = this.me.role;
    for (const [id, sprite] of this.sprites) {
      if (!sprite.container.visible) continue;
      const isMe = id === this.myId;
      if (!isMe && this.roles.get(id) !== myRole) continue; // solo tu bando
      ctx.fillStyle = isMe ? '#ffffff' : `#${sprite.color.toString(16).padStart(6, '0')}`;
      ctx.beginPath();
      ctx.arc(sprite.container.x * scale, sprite.container.y * scale, isMe ? 4 : 3, 0, Math.PI * 2);
      ctx.fill();
    }
    // Zona visible de la cámara.
    const view = this.cameras.main.worldView;
    ctx.strokeStyle = '#ffffff88';
    ctx.lineWidth = 1;
    ctx.strokeRect(view.x * scale, view.y * scale, view.width * scale, view.height * scale);
  }

  // ---------- Red ----------

  receiveState(state) {
    state.receivedAt = performance.now();
    this.snapshots.push(state);
    if (this.snapshots.length > 30) this.snapshots.shift();

    // Roles y estado de captura de todos (incluido yo).
    for (const p of state.players) {
      this.roles.set(p.id, p.role);
      const sprite = this.sprites.get(p.id);
      if (!sprite) continue;
      this.setRole(sprite, p.role);
      // Monstruo que aún no puede capturar: translúcido.
      sprite.body.setAlpha(p.role === 'monster' && p.cooldownMs > 0 ? 0.5 : 1);
    }
    this.onStateCallback(state);

    const mine = state.players.find((p) => p.id === this.myId);
    if (!mine) return;
    // Reconciliación: posición del servidor + entradas que aún no ha procesado.
    this.me.x = mine.x;
    this.me.y = mine.y;
    this.me.role = mine.role;
    this.me.frozen = mine.frozen;
    this.pending = this.pending.filter((i) => i.seq > mine.seq);
    for (const input of this.pending) applyInput(this.me, input, TICK_MS / 1000, this.map);
  }

  readInput() {
    const k = this.keys;
    return {
      x: (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0),
      y: (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0),
    };
  }

  // ---------- Bucle ----------

  update(time, delta) {
    // Pasos fijos de TICK_MS, igual que el servidor.
    this.acc += Math.min(delta, 250);
    while (this.acc >= TICK_MS) {
      this.acc -= TICK_MS;
      const dir = this.readInput();
      const input = { seq: ++this.seq, x: dir.x, y: dir.y };
      this.prev = { x: this.me.x, y: this.me.y };
      applyInput(this.me, input, TICK_MS / 1000, this.map);
      this.pending.push(input);
      this.socket.emit(EV.INPUT, input);
      this.moving = !this.me.frozen && (dir.x !== 0 || dir.y !== 0);
    }

    // Jugador local: suavizado entre el tick anterior y el actual.
    const a = this.acc / TICK_MS;
    const mine = this.sprites.get(this.myId);
    mine.container.setPosition(this.prev.x + (this.me.x - this.prev.x) * a, this.prev.y + (this.me.y - this.prev.y) * a);
    this.setDirection(mine, this.me.dx, this.me.dy, this.moving, time);

    this.renderRemotes(time);
    this.drawMinimap();
  }

  renderRemotes(time) {
    const renderAt = performance.now() - INTERP_DELAY_MS;
    const snaps = this.snapshots;
    if (snaps.length === 0) return;

    // Busca los dos estados que rodean renderAt.
    let older = snaps[0];
    let newer = snaps[0];
    for (let i = snaps.length - 1; i >= 0; i--) {
      if (snaps[i].receivedAt <= renderAt) {
        older = snaps[i];
        newer = snaps[i + 1] ?? snaps[i];
        break;
      }
    }
    const span = newer.receivedAt - older.receivedAt;
    const a = span > 0 ? Math.min(1, (renderAt - older.receivedAt) / span) : 1;

    const present = new Set();
    for (const p of newer.players) {
      if (p.id === this.myId) continue;
      present.add(p.id);
      const sprite = this.sprites.get(p.id);
      if (!sprite) continue;
      const o = older.players.find((q) => q.id === p.id) ?? p;
      const x = o.x + (p.x - o.x) * a;
      const y = o.y + (p.y - o.y) * a;
      const moving = Math.abs(p.x - o.x) + Math.abs(p.y - o.y) > 0.5;
      sprite.container.setPosition(x, y);
      this.setDirection(sprite, p.dx, p.dy, moving, time);
    }
    // Jugadores que ya no están (desconectados): se ocultan.
    for (const [id, sprite] of this.sprites) {
      if (id !== this.myId) sprite.container.setVisible(present.has(id));
    }
  }
}
