// Escena de juego — fase 4: jugadores sincronizados, roles e infección.
// Roles distinguibles por FORMA además de color: superviviente = círculo,
// monstruo = estrella roja. Un monstruo que aún no puede capturar se ve translúcido.
// Todo el arte son PLACEHOLDERS geométricos (ver docs/ART_STYLE.md).
//
// Jugador local: PREDICCIÓN. Cada TICK_MS lee el teclado, se mueve al instante
// y envía la entrada al servidor. Cuando llega el estado del servidor, se toma su
// posición como la buena y se vuelven a aplicar las entradas que aún no ha procesado.
//
// Jugadores remotos: INTERPOLACIÓN. Se dibujan con INTERP_DELAY_MS de retraso,
// a medio camino entre los dos estados recibidos que rodean ese instante.
import { PLAYER_RADIUS, TICK_MS, INTERP_DELAY_MS } from '/shared/config.js';
import { EV } from '/shared/events.js';
import { applyInput } from '/shared/movement.js';

const COLORS = {
  ground: 0x1f3324,
  grid: 0x263d2b,
  path: 0x4a3f2c,
  tree: 0x0f2414,
  treeEdge: 0x2f5a35,
  rock: 0x6b6f73,
  cabin: 0x6d4428,
  cabinDark: 0x4e2f1a,
  rockLight: 0x8a8f94,
  bush: 0x2e5e34,
  bushLight: 0x3f7a45,
  monster: 0xe53935,
};

const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

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

  create() {
    this.drawMap();

    this.sprites = new Map(); // id → { container, arrow }
    this.snapshots = []; // estados recibidos (para interpolar remotos)
    for (const p of this.initialPlayers) this.addPlayerSprite(p);

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

    this.onState = (s) => this.receiveState(s);
    this.socket.on(EV.STATE, this.onState);
    this.events.once('destroy', () => this.socket.off(EV.STATE, this.onState));
  }

  addPlayerSprite(p) {
    const arrow = this.add.triangle(0, 0, 0, -6, 0, 6, 10, 0, 0xffffff);
    const label = this.add
      .text(0, -PLAYER_RADIUS - 16, '', {
        fontSize: '14px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    const container = this.add.container(p.x, p.y, [arrow, label]).setDepth(10);
    const sprite = { container, arrow, label, body: null, role: null, color: p.color, name: p.name, isMe: p.id === this.myId };
    this.sprites.set(p.id, sprite);
    this.setRole(sprite, p.role, false);
  }

  /** Dibuja el cuerpo según el rol: círculo (superviviente) o estrella (monstruo). */
  setRole(sprite, role, animate = true) {
    if (sprite.role === role) return;
    sprite.role = role;
    sprite.body?.destroy();
    const outline = sprite.isMe ? 0xffffff : 0x000000;
    sprite.body =
      role === 'monster'
        ? this.add.star(0, 0, 6, PLAYER_RADIUS * 0.6, PLAYER_RADIUS * 1.25, COLORS.monster).setStrokeStyle(3, sprite.color)
        : this.add.circle(0, 0, PLAYER_RADIUS, sprite.color).setStrokeStyle(3, outline);
    sprite.container.addAt(sprite.body, 0);
    sprite.label.setText(`${role === 'monster' ? '★' : '●'} ${sprite.name}${sprite.isMe ? ' (tú)' : ''}`);

    if (animate && !reduceMotion) {
      // Efecto de transformación: destello y "rebote" de tamaño.
      sprite.container.setScale(1.8);
      this.tweens.add({ targets: sprite.container, scale: 1, duration: 400, ease: 'Back.Out' });
      const flash = this.add.circle(sprite.container.x, sprite.container.y, PLAYER_RADIUS * 3, COLORS.monster, 0.5).setDepth(5);
      this.tweens.add({ targets: flash, alpha: 0, scale: 2, duration: 500, onComplete: () => flash.destroy() });
    }
  }

  drawMap() {
    const { width, height } = this.map;
    const g = this.add.graphics();
    g.fillStyle(COLORS.ground).fillRect(0, 0, width, height);
    g.lineStyle(1, COLORS.grid);
    for (let x = 0; x <= width; x += 100) g.lineBetween(x, 0, x, height);
    for (let y = 0; y <= height; y += 100) g.lineBetween(0, y, width, y);

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

    // Arbustos (decoración, sin colisión): debajo de los jugadores.
    for (const d of this.map.decor ?? []) {
      g.fillStyle(COLORS.bush).fillCircle(d.x, d.y, d.r);
      g.fillStyle(COLORS.bushLight).fillCircle(d.x - d.r * 0.3, d.y - d.r * 0.3, d.r * 0.5);
    }

    for (const ob of this.map.obstacles) {
      if (ob.kind === 'tree') {
        g.fillStyle(COLORS.tree).fillCircle(ob.x, ob.y, ob.r);
        g.lineStyle(3, COLORS.treeEdge).strokeCircle(ob.x, ob.y, ob.r);
        g.fillStyle(COLORS.treeEdge).fillCircle(ob.x - ob.r * 0.25, ob.y - ob.r * 0.25, ob.r * 0.35);
      } else if (ob.kind === 'rock') {
        g.fillStyle(COLORS.rock).fillCircle(ob.x, ob.y, ob.r);
        g.fillStyle(COLORS.rockLight).fillCircle(ob.x - ob.r * 0.3, ob.y - ob.r * 0.3, ob.r * 0.4);
      } else if (ob.shape === 'rect') {
        // Cabaña vista desde arriba: tejado a dos aguas.
        g.fillStyle(COLORS.cabin).fillRect(ob.x, ob.y, ob.w, ob.h);
        g.fillStyle(COLORS.cabinDark).fillRect(ob.x, ob.y + ob.h / 2, ob.w, ob.h / 2);
        g.lineStyle(3, 0x000000).strokeRect(ob.x, ob.y, ob.w, ob.h);
        g.lineBetween(ob.x, ob.y + ob.h / 2, ob.x + ob.w, ob.y + ob.h / 2);
      }
    }
    g.lineStyle(6, 0x000000).strokeRect(0, 0, width, height);
  }

  // ---------- Red ----------

  receiveState(state) {
    state.receivedAt = performance.now();
    this.snapshots.push(state);
    if (this.snapshots.length > 30) this.snapshots.shift();

    // Roles y estado de captura de todos (incluido yo).
    for (const p of state.players) {
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

  update(_time, delta) {
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
      this.moving = dir.x !== 0 || dir.y !== 0;
    }

    // Jugador local: suavizado entre el tick anterior y el actual.
    const a = this.acc / TICK_MS;
    const mine = this.sprites.get(this.myId);
    mine.container.setPosition(this.prev.x + (this.me.x - this.prev.x) * a, this.prev.y + (this.me.y - this.prev.y) * a);
    this.setDirection(mine, this.me.dx, this.me.dy, this.moving);

    this.renderRemotes();
  }

  renderRemotes() {
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
      this.setDirection(sprite, p.dx, p.dy, moving);
    }
    // Jugadores que ya no están (desconectados): se ocultan.
    for (const [id, sprite] of this.sprites) {
      if (id !== this.myId) sprite.container.setVisible(present.has(id));
    }
  }

  setDirection(sprite, dx, dy, moving) {
    sprite.arrow.setRotation(Math.atan2(dy, dx));
    sprite.arrow.setAlpha(moving ? 1 : 0.4);
  }
}
