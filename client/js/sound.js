// Efectos de sonido SINTETIZADOS con Web Audio (sin archivos de audio).
// Son provisionales y originales: no hay problemas de licencia. Se podrán
// sustituir por sonidos definitivos en la etapa de pulido.
import { settings } from './settings.js';

let ctx = null;

/** El navegador solo permite sonar tras una acción del usuario: se llama al pulsar un botón. */
export function unlockAudio() {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();
  } catch {
    ctx = null; // sin Web Audio: el juego funciona en silencio
  }
}

/** Una nota: frecuencia inicial → final, duración en segundos, forma de onda. */
function tone(from, to, duration, type = 'sine', delay = 0, gain = 0.25) {
  if (!ctx || settings.volume <= 0) return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t0);
  osc.frequency.exponentialRampToValueAtTime(to, t0 + duration);
  amp.gain.setValueAtTime(gain * settings.volume, t0);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(amp).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

export const sfx = {
  start: () => [262, 330, 392].forEach((f, i) => tone(f, f, 0.15, 'triangle', i * 0.12)),
  capture: () => tone(520, 140, 0.35, 'sawtooth', 0, 0.18),
  transformed: () => {
    tone(200, 60, 0.6, 'sawtooth', 0, 0.2);
    tone(300, 90, 0.6, 'square', 0.05, 0.08);
  },
  newMonster: () => tone(150, 300, 0.4, 'square', 0, 0.12),
  ability: () => tone(300, 900, 0.18, 'triangle', 0, 0.15),
  tick: () => tone(880, 880, 0.06, 'square', 0, 0.08),
  win: () => [392, 494, 587, 784].forEach((f, i) => tone(f, f, 0.2, 'triangle', i * 0.13)),
  lose: () => [392, 330, 262, 196].forEach((f, i) => tone(f, f, 0.25, 'triangle', i * 0.16)),
  test: () => tone(440, 660, 0.25, 'triangle'),
};
