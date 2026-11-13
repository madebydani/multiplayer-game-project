// Configuración compartida entre cliente y servidor.
// Valores aprobados en docs/DECISIONS.md (D4, D5, D8).

export const PLAYER_RADIUS = 16;

export const SPEED = {
  survivor: 200, // px/s
  monster: 210, // px/s
};

export const CAPTURE_RADIUS = 40; // distancia máxima entre centros (px)
export const CAPTURE_COOLDOWN_MS = 3000; // bloqueo tras transformarse
export const MONSTER_START_FREEZE_MS = 5000; // ventaja inicial de los supervivientes

export const MATCH_DURATIONS_MIN = [3, 5, 7, 10];
export const DEFAULT_MATCH_DURATION_MIN = 5;

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;

export const MAP_WIDTH = 2400;
export const MAP_HEIGHT = 1800;
