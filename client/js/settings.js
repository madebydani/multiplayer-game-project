// Ajustes del jugador (volumen y reducir animaciones), guardados en el navegador.
// Si el almacenamiento no está disponible, se usan los valores por defecto.
const KEY = 'hunted-settings';

const systemReducesMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

const defaults = {
  volume: 0.6, // 0..1
  reduceMotion: systemReducesMotion, // por defecto, lo que diga el sistema operativo
};

let current = { ...defaults };
try {
  current = { ...defaults, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
} catch {
  /* sin almacenamiento o datos corruptos: valores por defecto */
}

export const settings = {
  get volume() {
    return current.volume;
  },
  get reduceMotion() {
    return current.reduceMotion;
  },
  set(changes) {
    current = { ...current, ...changes };
    try {
      localStorage.setItem(KEY, JSON.stringify(current));
    } catch {
      /* sin almacenamiento: el cambio dura hasta recargar */
    }
  },
};
