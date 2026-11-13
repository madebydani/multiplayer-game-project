// Imágenes definitivas (generadas con ChatGPT, ver docs/ASSET_LIST.md).
// El servidor publica en /assets-manifest.json qué archivos existen; el juego
// carga solo esos y, para los que falten, dibuja los placeholders geométricos.
// Así se pueden ir añadiendo imágenes de una en una sin romper nada.

/** clave de textura → ruta dentro de client/assets */
export const TEXTURES = {
  survivor: 'characters/survivor.png',
  monster: 'characters/monster.png',
  tree_1: 'environment/tree_1.png',
  tree_2: 'environment/tree_2.png',
  tree_3: 'environment/tree_3.png',
  rock_1: 'environment/rock_1.png',
  rock_2: 'environment/rock_2.png',
  bush_1: 'environment/bush_1.png',
  bush_2: 'environment/bush_2.png',
  cabin: 'environment/cabin.png',
  ground: 'environment/ground.png',
};

export const UI_IMAGES = {
  logo: 'ui/logo.png',
  iconSurvivor: 'ui/icon_survivor.png',
  iconMonster: 'ui/icon_monster.png',
};

// Qué fracción del lienzo ocupa el dibujo (según los prompts de ASSET_LIST.md):
// sirve para escalar la imagen al tamaño de colisión.
export const FILL = {
  character: 2 / 3, // el personaje ocupa ~2/3 de 256×256
  tree: 0.8,
  rock: 0.85,
  bush: 0.8,
};

let available = new Set();

/** Pide al servidor la lista de archivos disponibles (se vuelve a pedir en cada partida). */
export async function refreshManifest() {
  try {
    const res = await fetch('/assets-manifest.json', { cache: 'no-store' });
    available = new Set(await res.json());
  } catch {
    available = new Set();
  }
  return available;
}

export function hasAsset(path) {
  return available.has(path);
}

/** Texturas que existen, para cargarlas en Phaser. */
export function availableTextures() {
  return Object.entries(TEXTURES).filter(([, path]) => available.has(path));
}
