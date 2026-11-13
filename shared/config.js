// Configuración compartida entre cliente y servidor.
// Valores aprobados en docs/DECISIONS.md (D4, D5, D8).

export const PLAYER_RADIUS = 16;

export const SPEED = {
  survivor: 200, // px/s
  monster: 210, // px/s
};

// Sprint (fase 7a, docs/GAMEPLAY.md)
export const SPRINT_MULTIPLIER = 1.4;
export const SPRINT_ENERGY_MS = 2000; // sprint continuo con la barra llena
export const SPRINT_RECHARGE_MS = 6000; // de vacía a llena sin esprintar
export const SPRINT_RESTART_FRACTION = 0.25; // tras agotarla, mínimo para volver a esprintar

// Habilidades propias (fase 7b, docs/GAMEPLAY.md)
export const ABILITY = {
  survivor: { name: 'Señuelo', durationMs: 4000, cooldownMs: 15000 },
  monster: { name: 'Rastreo', durationMs: 3000, cooldownMs: 20000 },
};

export const CAPTURE_RADIUS = 40; // distancia máxima entre centros (px)
export const CAPTURE_COOLDOWN_MS = 3000; // bloqueo tras transformarse
export const MONSTER_START_FREEZE_MS = 5000; // ventaja inicial de los supervivientes

export const MATCH_DURATIONS_MIN = [3, 5, 7, 10];
export const DEFAULT_MATCH_DURATION_MIN = 5;

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;

// Red: el cliente envía una entrada cada TICK_MS y el servidor simula
// a la misma frecuencia (20 veces por segundo).
export const TICK_MS = 50;
// Retraso con el que se dibuja a los jugadores remotos (interpolación).
export const INTERP_DELAY_MS = 100;
// Máximo de entradas acumuladas por jugador (evita el "speed hack" de
// enviar más entradas de las permitidas).
export const MAX_INPUT_CREDIT = 4;

export const NAME_MAX_LENGTH = 16;
export const ROOM_CODE_LENGTH = 4;

export const MAP_WIDTH = 2400;
export const MAP_HEIGHT = 1800;
