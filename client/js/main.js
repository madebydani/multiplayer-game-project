import { GameScene } from './scenes/GameScene.js';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#0d1410',
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  // Delta real entre fotogramas: con smoothStep (por defecto) Phaser fija el delta
  // en ~16,7 ms y, si el equipo va a pocos FPS, el personaje se mueve más lento.
  fps: { smoothStep: false },
  scene: [GameScene],
});

// Acceso para depuración y pruebas automáticas (Playwright).
window.__hunted = game;
