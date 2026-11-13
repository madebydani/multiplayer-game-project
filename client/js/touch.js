// Controles táctiles (móvil / tableta): joystick virtual y botones.
// Solo se activan en pantallas táctiles; en ordenador no aparecen.
// El joystick produce la misma entrada que WASD: x, y ∈ {-1, 0, 1}.

/** Estado compartido con la escena de juego (se combina con el teclado). */
export const touchInput = { x: 0, y: 0, s: 0 };

export const isTouchDevice =
  (window.matchMedia?.('(pointer: coarse)').matches ?? false) || 'ontouchstart' in window;

const DEAD_ZONE = 0.3; // fracción del radio sin movimiento
const AXIS = Math.sin(Math.PI / 8); // ≈0,38: umbral para 8 direcciones

/**
 * Prepara el joystick y los botones.
 * @param {{ onAbility: () => void, onItem: (slot: number) => void }} actions
 */
export function setupTouchControls(actions) {
  if (!isTouchDevice) return;
  document.body.classList.add('touch');

  const stick = document.getElementById('joystick');
  const knob = document.getElementById('joystick-knob');
  let pointerId = null;

  const update = (e) => {
    const rect = stick.getBoundingClientRect();
    const radius = rect.width / 2;
    let vx = (e.clientX - (rect.left + radius)) / radius;
    let vy = (e.clientY - (rect.top + radius)) / radius;
    const len = Math.hypot(vx, vy);
    if (len > 1) {
      vx /= len;
      vy /= len;
    }
    knob.style.transform = `translate(${vx * radius * 0.6}px, ${vy * radius * 0.6}px)`;
    if (len < DEAD_ZONE) {
      touchInput.x = 0;
      touchInput.y = 0;
      return;
    }
    const nx = vx / Math.max(len, 1e-9);
    const ny = vy / Math.max(len, 1e-9);
    touchInput.x = nx > AXIS ? 1 : nx < -AXIS ? -1 : 0;
    touchInput.y = ny > AXIS ? 1 : ny < -AXIS ? -1 : 0;
  };
  const release = () => {
    pointerId = null;
    touchInput.x = 0;
    touchInput.y = 0;
    knob.style.transform = '';
  };

  stick.addEventListener('pointerdown', (e) => {
    pointerId = e.pointerId;
    stick.setPointerCapture(e.pointerId);
    update(e);
  });
  stick.addEventListener('pointermove', (e) => e.pointerId === pointerId && update(e));
  stick.addEventListener('pointerup', release);
  stick.addEventListener('pointercancel', release);

  // Sprint: mientras se mantiene pulsado.
  const sprint = document.getElementById('touch-sprint');
  sprint.addEventListener('pointerdown', (e) => {
    sprint.setPointerCapture(e.pointerId);
    touchInput.s = 1;
    sprint.classList.add('pressed');
  });
  for (const ev of ['pointerup', 'pointercancel']) {
    sprint.addEventListener(ev, () => {
      touchInput.s = 0;
      sprint.classList.remove('pressed');
    });
  }

  document.getElementById('touch-ability').addEventListener('pointerdown', () => actions.onAbility());
  document.getElementById('touch-item-0').addEventListener('pointerdown', () => actions.onItem(0));
  document.getElementById('touch-item-1').addEventListener('pointerdown', () => actions.onItem(1));
}

/** Suelta todos los controles (al terminar la partida). */
export function resetTouchInput() {
  touchInput.x = 0;
  touchInput.y = 0;
  touchInput.s = 0;
}
