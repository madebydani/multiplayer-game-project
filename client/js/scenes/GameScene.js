// Escena de juego — fase 2: prototipo local con un personaje.
// Todo el arte son PLACEHOLDERS geométricos (ver docs/ART_STYLE.md).
import { PLAYER_RADIUS, SPEED } from '/shared/config.js';
import { moveCircle } from '/shared/collision.js';
import { createTestMap } from '/shared/testMap.js';

const COLORS = {
  ground: 0x1f3324,
  grid: 0x263d2b,
  path: 0x4a3f2c,
  tree: 0x0f2414,
  treeEdge: 0x2f5a35,
  rock: 0x6b6f73,
  cabin: 0x5a3b22,
  survivor: 0x4fc3f7,
  outline: 0xffffff,
};

export class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create() {
    this.map = createTestMap();
    this.drawMap();

    // Jugador local (placeholder: círculo + flecha de dirección).
    this.player = {
      x: this.map.spawn.x,
      y: this.map.spawn.y,
      dirX: 0,
      dirY: 1,
      moving: false,
    };
    this.playerGfx = this.add.container(this.player.x, this.player.y);
    const body = this.add.circle(0, 0, PLAYER_RADIUS, COLORS.survivor).setStrokeStyle(3, COLORS.outline);
    this.arrow = this.add.triangle(0, 0, 0, -6, 0, 6, 10, 0, COLORS.outline);
    this.playerGfx.add([body, this.arrow]);
    this.playerGfx.setDepth(10);

    // Cámara.
    this.cameras.main.setBounds(0, 0, this.map.width, this.map.height);
    this.cameras.main.startFollow(this.playerGfx, true, 0.15, 0.15);

    // Controles: WASD y flechas (accesibilidad).
    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,LEFT,DOWN,RIGHT');

    this.add
      .text(12, 12, 'HUNTED — prototipo local (fase 2)\nWASD / flechas para moverse', {
        fontSize: '16px',
        color: '#e8f5e9',
        backgroundColor: '#00000099',
        padding: { x: 8, y: 6 },
      })
      .setScrollFactor(0)
      .setDepth(100);
  }

  drawMap() {
    const g = this.add.graphics();
    g.fillStyle(COLORS.ground).fillRect(0, 0, this.map.width, this.map.height);

    // Rejilla tenue para percibir el movimiento.
    g.lineStyle(1, COLORS.grid);
    for (let x = 0; x <= this.map.width; x += 100) g.lineBetween(x, 0, x, this.map.height);
    for (let y = 0; y <= this.map.height; y += 100) g.lineBetween(0, y, this.map.width, y);

    for (const p of this.map.paths) {
      g.fillStyle(COLORS.path).fillRect(p.x, p.y, p.w, p.h);
    }

    for (const ob of this.map.obstacles) {
      if (ob.kind === 'tree') {
        g.fillStyle(COLORS.tree).fillCircle(ob.x, ob.y, ob.r);
        g.lineStyle(3, COLORS.treeEdge).strokeCircle(ob.x, ob.y, ob.r);
      } else if (ob.kind === 'rock') {
        g.fillStyle(COLORS.rock).fillCircle(ob.x, ob.y, ob.r);
      } else if (ob.shape === 'rect') {
        g.fillStyle(COLORS.cabin).fillRect(ob.x, ob.y, ob.w, ob.h);
        g.lineStyle(3, 0x000000).strokeRect(ob.x, ob.y, ob.w, ob.h);
      }
    }

    // Borde del mapa.
    g.lineStyle(6, 0x000000).strokeRect(0, 0, this.map.width, this.map.height);
  }

  update(_time, delta) {
    const k = this.keys;
    let ix = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0);
    let iy = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0);

    const p = this.player;
    p.moving = ix !== 0 || iy !== 0;

    if (p.moving) {
      const len = Math.hypot(ix, iy); // normaliza la diagonal
      ix /= len;
      iy /= len;
      p.dirX = ix;
      p.dirY = iy;

      const dt = Math.min(delta, 100) / 1000; // evita saltos si la pestaña se congela
      const dist = SPEED.survivor * dt;
      const next = moveCircle(p.x, p.y, PLAYER_RADIUS, ix * dist, iy * dist, this.map.obstacles, this.map);
      p.x = next.x;
      p.y = next.y;
    }

    this.playerGfx.setPosition(p.x, p.y);
    this.arrow.setRotation(Math.atan2(p.dirY, p.dirX));
    // Reposo: la flecha se atenúa cuando el personaje está quieto.
    this.arrow.setAlpha(p.moving ? 1 : 0.4);
  }
}
