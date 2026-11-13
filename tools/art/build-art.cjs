// Genera el arte de HUNTED con CÓDIGO (dibujos vectoriales SVG → PNG).
// Autor: Claude Code, a petición del equipo (ver docs/DECISIONS.md, D31).
// Estilo: docs/ART_STYLE.md (vista cenital pura, ilustración plana, paleta fija).
//
// Son BOCETOS PROVISIONALES: el equipo puede sustituir cualquier PNG por una
// ilustración hecha con otra herramienta (p. ej. ChatGPT) con el mismo nombre.
//
// Uso (requiere Playwright con Chromium instalado):
//   node tools/art/build-art.cjs                  → crea solo los PNG que NO existen
//   node tools/art/build-art.cjs --force          → regenera y SOBRESCRIBE todos
//   node tools/art/build-art.cjs --force monster  → regenera solo los que contienen "monster"
// Los SVG fuente se escriben siempre en tools/art/svg/.
// Por defecto no se sobrescribe nada: así no se pierden imágenes del equipo.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..', '..');
const SVG_DIR = path.join(__dirname, 'svg');
const OUT_DIR = path.join(ROOT, 'client', 'assets');

// Paleta aprobada (docs/ART_STYLE.md)
const C = {
  outline: '#0D1410',
  groundDark: '#1B2E22',
  green: '#2F5A35',
  greenMid: '#3F7A45',
  greenLight: '#5D9C59',
  dirt: '#6B5236',
  rock: '#7D8288',
  rockLight: '#A3A9AF',
  rockDark: '#5E6368',
  wood: '#7A4E2D',
  woodLight: '#9A6A40',
  woodDark: '#5A3820',
  cream: '#F3E9D2',
  blue: '#4FC3F7',
  blueDark: '#2B8FC0',
  skin: '#F2C7A0',
  red: '#E53935',
  redDark: '#B71C1C',
  purple: '#4A148C',
  yellow: '#FFE082',
};

// Generador con semilla: el arte sale idéntico en cada ejecución.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const svg = (w, h, body, defs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
  (defs ? `<defs>${defs}</defs>` : '') +
  body +
  '</svg>';

const stroke = (w = 5) => `stroke="${C.outline}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const softShadow = (id, blur = 6) =>
  `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${blur}"/></filter>`;

/** Polígono irregular alrededor de (cx, cy): radio r con variación. */
function blobPoints(cx, cy, r, n, jitter, rand) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (1 - jitter / 2 + rand() * jitter);
    pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`);
  }
  return pts.join(' ');
}

// ---------------------------------------------------------------------------
// PERSONAJES (256×256, vista cenital, mirando a la DERECHA, sin sombra,
// centro del cuerpo en el centro del lienzo; el juego los rota)
// ---------------------------------------------------------------------------

function survivor() {
  const defs = `<radialGradient id="beam" cx="0" cy="0.5" r="1">
      <stop offset="0" stop-color="${C.yellow}" stop-opacity="0.85"/>
      <stop offset="1" stop-color="${C.yellow}" stop-opacity="0"/>
    </radialGradient>`;
  return svg(
    256,
    256,
    `
    <!-- haz de la linterna (hacia delante) -->
    <polygon points="196,150 252,122 252,200" fill="url(#beam)"/>
    <!-- mochila (a la espalda = izquierda) -->
    <rect x="52" y="92" width="52" height="72" rx="16" fill="${C.woodLight}" ${stroke()}/>
    <rect x="60" y="104" width="22" height="48" rx="8" fill="${C.wood}"/>
    <line x1="96" y1="96" x2="120" y2="92" ${stroke(4)}/>
    <line x1="96" y1="160" x2="120" y2="164" ${stroke(4)}/>
    <!-- brazos -->
    <ellipse cx="150" cy="78" rx="26" ry="15" fill="${C.cream}" ${stroke()} transform="rotate(-20 150 78)"/>
    <ellipse cx="156" cy="176" rx="30" ry="15" fill="${C.cream}" ${stroke()} transform="rotate(18 156 176)"/>
    <!-- manos -->
    <circle cx="176" cy="72" r="11" fill="${C.skin}" ${stroke(4)}/>
    <!-- linterna en la mano derecha -->
    <rect x="172" y="146" width="30" height="16" rx="4" fill="${C.rockDark}" ${stroke(4)}/>
    <rect x="198" y="143" width="8" height="22" rx="3" fill="${C.yellow}" ${stroke(3)}/>
    <circle cx="180" cy="168" r="11" fill="${C.skin}" ${stroke(4)}/>
    <!-- hombros / cuerpo -->
    <ellipse cx="128" cy="128" rx="44" ry="58" fill="${C.cream}" ${stroke()}/>
    <!-- bufanda azul alrededor del cuello -->
    <path d="M150,92 Q170,128 150,164" fill="none" stroke="${C.blue}" stroke-width="14" stroke-linecap="round"/>
    <path d="M150,92 Q170,128 150,164" fill="none" ${stroke(3)} opacity="0.5"/>
    <!-- cabeza: cara por delante (derecha) -->
    <circle cx="150" cy="128" r="32" fill="${C.skin}" ${stroke()}/>
    <circle cx="170" cy="115" r="4.5" fill="${C.outline}"/>
    <circle cx="170" cy="141" r="4.5" fill="${C.outline}"/>
    <ellipse cx="180" cy="128" rx="4" ry="5" fill="#E8A87C"/>
    <!-- gorro de lana: cubre la parte de atrás de la cabeza -->
    <circle cx="126" cy="128" r="31" fill="${C.blue}" ${stroke()}/>
    <g stroke="${C.blueDark}" stroke-width="4" stroke-linecap="round">
      <line x1="130" y1="128" x2="152" y2="110"/><line x1="130" y1="128" x2="155" y2="128"/><line x1="130" y1="128" x2="152" y2="146"/>
      <line x1="122" y1="128" x2="118" y2="100"/><line x1="122" y1="128" x2="118" y2="156"/><line x1="120" y1="128" x2="98" y2="128"/>
    </g>
    <path d="M148,104 Q160,128 148,152" fill="none" stroke="${C.cream}" stroke-width="8" stroke-linecap="round"/>
    <circle cx="120" cy="128" r="12" fill="${C.cream}" ${stroke(4)}/>
  `,
    defs,
  );
}

function monster() {
  const defs = `<radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${C.yellow}" stop-opacity="0.9"/>
      <stop offset="1" stop-color="${C.yellow}" stop-opacity="0"/>
    </radialGradient>`;
  // púas a lo largo del lomo (línea central horizontal, hacia atrás)
  const spikes = [52, 78, 104]
    .map((x) => `<polygon points="${x - 14},128 ${x},104 ${x + 14},128 ${x},152" fill="${C.purple}" ${stroke(4)}/>`)
    .join('');
  const claws = (cx, cy, dir) =>
    [-10, 0, 10]
      .map((o) => `<path d="M${cx + 10},${cy + o} q14,${dir * 2} 22,${o / 2}" fill="none" stroke="${C.cream}" stroke-width="5" stroke-linecap="round"/>`)
      .join('');
  return svg(
    256,
    256,
    `
    <!-- brazos con garras -->
    <ellipse cx="150" cy="52" rx="36" ry="20" fill="${C.red}" ${stroke()} transform="rotate(-15 150 52)"/>
    <ellipse cx="150" cy="204" rx="36" ry="20" fill="${C.red}" ${stroke()} transform="rotate(15 150 204)"/>
    ${claws(176, 46, -1)}
    ${claws(176, 210, 1)}
    <!-- cuerpo ancho -->
    <ellipse cx="114" cy="128" rx="78" ry="70" fill="${C.red}" ${stroke()}/>
    <ellipse cx="96" cy="128" rx="46" ry="40" fill="${C.redDark}" opacity="0.55"/>
    ${spikes}
    <!-- cuernos curvados hacia delante -->
    <path d="M168,104 Q196,64 236,72 Q206,82 186,114 Z" fill="${C.cream}" ${stroke(4)}/>
    <path d="M168,152 Q196,192 236,184 Q206,174 186,142 Z" fill="${C.cream}" ${stroke(4)}/>
    <!-- cabeza -->
    <circle cx="172" cy="128" r="36" fill="${C.red}" ${stroke()}/>
    <circle cx="162" cy="128" r="22" fill="${C.purple}" opacity="0.35"/>
    <!-- ojos brillantes -->
    <circle cx="196" cy="112" r="18" fill="url(#glow)"/>
    <circle cx="196" cy="144" r="18" fill="url(#glow)"/>
    <ellipse cx="196" cy="112" rx="9" ry="8" fill="${C.yellow}" ${stroke(3)}/>
    <ellipse cx="196" cy="144" rx="9" ry="8" fill="${C.yellow}" ${stroke(3)}/>
    <rect x="197" y="106" width="3" height="12" rx="1.5" fill="${C.outline}"/>
    <rect x="197" y="138" width="3" height="12" rx="1.5" fill="${C.outline}"/>
  `,
    defs,
  );
}

// ---------------------------------------------------------------------------
// BOSQUE (vista cenital, luz arriba-izquierda, sombra abajo-derecha)
// ---------------------------------------------------------------------------

function treeRound() {
  const rand = rng(11);
  const clusters = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    clusters.push(`<circle cx="${(128 + Math.cos(a) * 62).toFixed(1)}" cy="${(128 + Math.sin(a) * 62).toFixed(1)}" r="${(36 + rand() * 6).toFixed(1)}" fill="${C.green}" ${stroke(4)}/>`);
  }
  return svg(
    256,
    256,
    `
    <circle cx="138" cy="140" r="100" fill="#000" opacity="0.35" filter="url(#sh)"/>
    ${clusters.join('')}
    <circle cx="128" cy="128" r="70" fill="${C.green}"/>
    <circle cx="112" cy="108" r="44" fill="${C.greenMid}"/>
    <circle cx="100" cy="92" r="22" fill="${C.greenLight}"/>
    <circle cx="150" cy="96" r="12" fill="${C.greenLight}" opacity="0.8"/>
    <circle cx="90" cy="140" r="10" fill="${C.greenLight}" opacity="0.7"/>
  `,
    softShadow('sh', 8),
  );
}

function treePine() {
  const star = (r1, r2, n, rot, fill) => {
    const pts = [];
    for (let i = 0; i < n * 2; i++) {
      const a = (i / (n * 2)) * Math.PI * 2 + rot;
      const r = i % 2 ? r2 : r1;
      pts.push(`${(128 + Math.cos(a) * r).toFixed(1)},${(128 + Math.sin(a) * r).toFixed(1)}`);
    }
    return `<polygon points="${pts.join(' ')}" fill="${fill}" ${stroke(4)}/>`;
  };
  return svg(
    256,
    256,
    `
    <circle cx="138" cy="140" r="96" fill="#000" opacity="0.35" filter="url(#sh)"/>
    ${star(102, 62, 10, 0, '#24452A')}
    ${star(78, 46, 9, 0.3, C.green)}
    ${star(52, 30, 8, 0.1, C.greenMid)}
    ${star(26, 14, 6, 0.4, C.greenLight)}
    <circle cx="128" cy="128" r="6" fill="${C.woodDark}"/>
  `,
    softShadow('sh', 8),
  );
}

function treeMossy() {
  const rand = rng(33);
  return svg(
    256,
    256,
    `
    <circle cx="138" cy="140" r="98" fill="#000" opacity="0.35" filter="url(#sh)"/>
    <polygon points="${blobPoints(128, 128, 100, 22, 0.16, rand)}" fill="#20402A" ${stroke(4)}/>
    <polygon points="${blobPoints(122, 122, 70, 16, 0.2, rand)}" fill="${C.green}"/>
    <circle cx="96" cy="100" r="20" fill="#6B8F4E"/>
    <circle cx="160" cy="150" r="14" fill="#6B8F4E" opacity="0.8"/>
    <circle cx="112" cy="168" r="10" fill="#6B8F4E" opacity="0.7"/>
    <circle cx="104" cy="104" r="9" fill="${C.greenLight}"/>
  `,
    softShadow('sh', 8),
  );
}

function rock(seed, moss) {
  const rand = rng(seed);
  return svg(
    128,
    128,
    `
    <polygon points="${blobPoints(68, 70, 54, 10, 0.18, rng(seed))}" fill="#000" opacity="0.35" filter="url(#sh)"/>
    <polygon points="${blobPoints(64, 64, 54, 10, 0.18, rand)}" fill="${C.rock}" ${stroke(4)}/>
    <polygon points="${blobPoints(54, 52, 30, 8, 0.25, rand)}" fill="${C.rockLight}"/>
    <path d="M70,82 l14,10 M60,92 l6,-12" stroke="${C.rockDark}" stroke-width="3" stroke-linecap="round"/>
    ${moss ? `<polygon points="${blobPoints(88, 84, 16, 8, 0.4, rand)}" fill="${C.greenMid}"/>` : ''}
  `,
    softShadow('sh', 4),
  );
}

function bush(seed, berries) {
  const rand = rng(seed);
  const leaves = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + rand();
    leaves.push(`<circle cx="${(64 + Math.cos(a) * 28).toFixed(1)}" cy="${(64 + Math.sin(a) * 28).toFixed(1)}" r="${(20 + rand() * 4).toFixed(1)}" fill="${C.greenMid}" ${stroke(3)}/>`);
  }
  const dots = [];
  for (let i = 0; i < 6; i++) {
    const a = rand() * Math.PI * 2;
    const r = 10 + rand() * 30;
    const color = berries ? '#C62828' : C.cream;
    dots.push(`<circle cx="${(64 + Math.cos(a) * r).toFixed(1)}" cy="${(64 + Math.sin(a) * r).toFixed(1)}" r="${berries ? 4 : 3.5}" fill="${color}"/>`);
  }
  return svg(
    128,
    128,
    `
    <circle cx="68" cy="70" r="50" fill="#000" opacity="0.3" filter="url(#sh)"/>
    ${leaves.join('')}
    <circle cx="64" cy="64" r="30" fill="${C.greenMid}"/>
    <circle cx="56" cy="56" r="16" fill="${C.greenLight}"/>
    ${dots.join('')}
  `,
    softShadow('sh', 4),
  );
}

function cabin() {
  // Tejado a dos aguas visto desde arriba; ocupa todo el lienzo porque el
  // juego lo estira al rectángulo de colisión (la sombra la pone el código).
  const planks = [];
  for (let x = 24; x < 448; x += 28) {
    planks.push(`<line x1="${x}" y1="10" x2="${x}" y2="156" stroke="${C.woodDark}" stroke-width="3" opacity="0.6"/>`);
    planks.push(`<line x1="${x + 14}" y1="164" x2="${x + 14}" y2="310" stroke="${C.outline}" stroke-width="3" opacity="0.45"/>`);
  }
  return svg(
    448,
    320,
    `
    <rect x="4" y="4" width="440" height="312" rx="10" fill="${C.woodLight}" ${stroke(8)}/>
    <rect x="8" y="160" width="432" height="152" rx="6" fill="${C.wood}"/>
    ${planks.join('')}
    <line x1="4" y1="160" x2="444" y2="160" ${stroke(8)}/>
    <!-- chimenea -->
    <rect x="320" y="60" width="54" height="54" rx="6" fill="${C.rock}" ${stroke(6)}/>
    <rect x="332" y="72" width="30" height="30" rx="4" fill="${C.outline}"/>
    <!-- ventanita del tejado con luz cálida -->
    <rect x="96" y="196" width="60" height="40" rx="6" fill="${C.yellow}" ${stroke(6)}/>
    <line x1="126" y1="196" x2="126" y2="236" ${stroke(4)}/>
  `,
  );
}

function ground() {
  // Mosaico sin costuras: cada detalle se dibuja también desplazado ±256
  // para que lo que sale por un borde entre por el opuesto.
  const rand = rng(7);
  const items = [];
  const wrap = (draw) => {
    for (const dx of [-256, 0, 256]) for (const dy of [-256, 0, 256]) items.push(draw(dx, dy));
  };
  for (let i = 0; i < 46; i++) {
    const x = rand() * 256;
    const y = rand() * 256;
    const kind = rand();
    const rot = Math.round(rand() * 360);
    if (kind < 0.55) {
      // mata de hierba: tres trazos
      wrap((dx, dy) => `<g transform="translate(${(x + dx).toFixed(1)} ${(y + dy).toFixed(1)}) rotate(${rot})" stroke="#284A31" stroke-width="2" stroke-linecap="round"><line x1="0" y1="0" x2="-3" y2="-7"/><line x1="0" y1="0" x2="0" y2="-8"/><line x1="0" y1="0" x2="3" y2="-7"/></g>`);
    } else if (kind < 0.85) {
      // hoja caída
      const color = rand() < 0.5 ? '#3A3324' : '#2C3F25';
      wrap((dx, dy) => `<ellipse cx="${(x + dx).toFixed(1)}" cy="${(y + dy).toFixed(1)}" rx="5" ry="2.5" fill="${color}" transform="rotate(${rot} ${(x + dx).toFixed(1)} ${(y + dy).toFixed(1)})"/>`);
    } else {
      // piedrecita
      wrap((dx, dy) => `<circle cx="${(x + dx).toFixed(1)}" cy="${(y + dy).toFixed(1)}" r="2" fill="#33463A"/>`);
    }
  }
  return svg(256, 256, `<rect width="256" height="256" fill="${C.groundDark}"/>${items.join('')}`);
}

// ---------------------------------------------------------------------------
// INTERFAZ
// ---------------------------------------------------------------------------

function logo() {
  const defs = `<linearGradient id="txt" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFF8E7"/><stop offset="1" stop-color="${C.cream}"/>
    </linearGradient>`;
  const leaf = (x, y, rot, fill) =>
    `<path d="M0,0 Q18,-14 36,0 Q18,14 0,0 Z" fill="${fill}" ${stroke(3)} transform="translate(${x} ${y}) rotate(${rot})"/>`;
  return svg(
    1024,
    384,
    `
    <!-- rama decorativa -->
    <path d="M120,300 Q512,350 904,300" fill="none" stroke="${C.woodDark}" stroke-width="10" stroke-linecap="round"/>
    ${leaf(180, 306, -30, C.greenMid)}${leaf(300, 322, 20, C.green)}${leaf(700, 322, 160, C.green)}${leaf(840, 306, 210, C.greenMid)}
    ${leaf(500, 336, 70, C.greenLight)}
    <!-- texto -->
    <text x="512" y="250" text-anchor="middle" font-family="Inter Display Black, Inter, DejaVu Sans, sans-serif" font-weight="900" font-size="210" letter-spacing="14"
      fill="url(#txt)" stroke="${C.outline}" stroke-width="14" paint-order="stroke" stroke-linejoin="round">HUNTED</text>
    <!-- marcas de garra sobre la U -->
    <g stroke="${C.red}" stroke-width="12" stroke-linecap="round">
      <line x1="282" y1="96" x2="326" y2="232"/>
      <line x1="312" y1="92" x2="356" y2="228"/>
      <line x1="342" y1="96" x2="384" y2="224"/>
    </g>
    <!-- ojos en la oscuridad -->
    <ellipse cx="930" cy="48" rx="11" ry="7" fill="${C.yellow}"/><ellipse cx="962" cy="48" rx="11" ry="7" fill="${C.yellow}"/>
  `,
    defs,
  );
}

function iconSurvivor() {
  return svg(
    128,
    128,
    `
    <circle cx="64" cy="64" r="60" fill="${C.blue}" ${stroke(5)}/>
    <circle cx="64" cy="72" r="34" fill="${C.skin}" ${stroke(4)}/>
    <path d="M28,64 Q30,24 64,22 Q98,24 100,64 Z" fill="${C.blueDark}" ${stroke(4)}/>
    <rect x="26" y="56" width="76" height="14" rx="7" fill="${C.cream}" ${stroke(4)}/>
    <circle cx="64" cy="18" r="10" fill="${C.cream}" ${stroke(4)}/>
    <circle cx="52" cy="82" r="4" fill="${C.outline}"/><circle cx="76" cy="82" r="4" fill="${C.outline}"/>
    <path d="M54,94 Q64,101 74,94" fill="none" ${stroke(3)}/>
  `,
  );
}

function iconMonster() {
  return svg(
    128,
    128,
    `
    <circle cx="64" cy="64" r="60" fill="${C.purple}" ${stroke(5)}/>
    <path d="M36,52 Q22,22 30,10 Q40,30 52,40 Z" fill="${C.cream}" ${stroke(4)}/>
    <path d="M92,52 Q106,22 98,10 Q88,30 76,40 Z" fill="${C.cream}" ${stroke(4)}/>
    <circle cx="64" cy="70" r="38" fill="${C.red}" ${stroke(4)}/>
    <ellipse cx="50" cy="64" rx="9" ry="7" fill="${C.yellow}" ${stroke(3)}/><ellipse cx="78" cy="64" rx="9" ry="7" fill="${C.yellow}" ${stroke(3)}/>
    <rect x="49" y="58" width="3" height="12" rx="1.5" fill="${C.outline}"/><rect x="77" y="58" width="3" height="12" rx="1.5" fill="${C.outline}"/>
    <path d="M46,88 L54,96 L60,88 L68,96 L74,88 L82,96" fill="none" stroke="${C.cream}" stroke-width="4" stroke-linejoin="round"/>
  `,
  );
}

// ---------------------------------------------------------------------------

const ASSETS = {
  'characters/survivor': [survivor, 256, 256],
  'characters/monster': [monster, 256, 256],
  'environment/tree_1': [treeRound, 256, 256],
  'environment/tree_2': [treePine, 256, 256],
  'environment/tree_3': [treeMossy, 256, 256],
  'environment/rock_1': [() => rock(5, true), 128, 128],
  'environment/rock_2': [() => rock(9, false), 128, 128],
  'environment/bush_1': [() => bush(3, true), 128, 128],
  'environment/bush_2': [() => bush(8, false), 128, 128],
  'environment/cabin': [cabin, 448, 320],
  'environment/ground': [ground, 256, 256],
  'ui/logo': [logo, 1024, 384],
  'ui/icon_survivor': [iconSurvivor, 128, 128],
  'ui/icon_monster': [iconMonster, 128, 128],
};

(async () => {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const only = args.find((a) => !a.startsWith('--')); // opcional: solo un recurso
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const [name, [draw, w, h]] of Object.entries(ASSETS)) {
    if (only && !name.includes(only)) continue;
    const source = draw();
    const svgPath = path.join(SVG_DIR, `${name}.svg`);
    fs.mkdirSync(path.dirname(svgPath), { recursive: true });
    fs.writeFileSync(svgPath, source);

    await page.setViewportSize({ width: w, height: h });
    await page.setContent(`<html><body style="margin:0;background:transparent">${source}</body></html>`);
    const pngPath = path.join(OUT_DIR, `${name}.png`);
    if (fs.existsSync(pngPath) && !force) {
      console.log(`${name}.png  ya existe: no se toca (usa --force para sobrescribir)`);
      continue;
    }
    fs.mkdirSync(path.dirname(pngPath), { recursive: true });
    await page.locator('svg').screenshot({ path: pngPath, omitBackground: true });
    console.log(`${name}.png  ${w}×${h}`);
  }
  await browser.close();
})();
