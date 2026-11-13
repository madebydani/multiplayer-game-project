// Prueba de extremo a extremo con DOS navegadores independientes (Playwright).
// Requiere el servidor arrancado (npm start) y Playwright instalado.
// Uso: node test/e2e/two-browsers.cjs [carpeta-para-capturas]
const { chromium } = require('playwright');

(async () => {
  const out = process.argv[2] || '.';
  const browser = await chromium.launch();
  const errors = [];
  const log = {};

  const open = async (label) => {
    const ctx = await browser.newContext({ viewport: { width: 900, height: 600 } });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(`${label}: ${e.message}`));
    page.on('console', (m) => m.type() === 'error' && errors.push(`${label}: ${m.text()}`));
    await page.goto('http://localhost:3000');
    return page;
  };
  const A = await open('A');
  const B = await open('B');

  // --- Sala ---
  await A.fill('#name', 'Ana');
  await A.click('#btn-create');
  await A.waitForSelector('#lobby:not([hidden])');
  const code = await A.textContent('#lobby-code');
  log.startDisabledAlone = await A.isDisabled('#btn-start');

  await B.fill('#name', 'Bea');
  await B.fill('#code', code.toLowerCase());
  await B.click('#btn-join');
  await B.waitForSelector('#lobby:not([hidden])');
  await A.waitForFunction(() => document.querySelectorAll('#lobby-players li').length === 2);
  await A.selectOption('#duration', '3');
  await B.waitForFunction(() => document.getElementById('duration-text').textContent === '3 min');
  log.durationSeenByGuest = await B.textContent('#duration-text');
  log.guestSeesStart = await B.isVisible('#btn-start');
  await A.screenshot({ path: `${out}/fase4-sala.png` });

  // --- Partida 1: el monstruo persigue y captura ---
  await A.click('#btn-start');
  await Promise.all([A, B].map((p) => p.waitForFunction(() => window.__hunted?.scene?.getScene('Game')?.me)));
  const roleOf = (p) => p.evaluate(() => window.__hunted.scene.getScene('Game').me.role);
  const [roleA, roleB] = [await roleOf(A), await roleOf(B)];
  log.roles = { A: roleA, B: roleB };
  const monster = roleA === 'monster' ? A : B;
  const survivor = monster === A ? B : A;

  // Mapa: ambos clientes reciben exactamente el mismo.
  const mapOf = (p) => p.evaluate(() => JSON.stringify(window.__hunted.scene.getScene('Game').map));
  const [mapA, mapB] = [await mapOf(A), await mapOf(B)];
  log.sameMapBothClients = mapA === mapB;
  log.map1 = (({ seed, obstacles, decor }) => ({ seed, obstacles: obstacles.length, decor: decor.length }))(JSON.parse(mapA));

  await A.waitForTimeout(800);
  log.hudMonster = await monster.textContent('#hud');
  log.hudSurvivor = await survivor.textContent('#hud');
  await monster.screenshot({ path: `${out}/fase4-partida-monstruo.png` });

  // Intenta moverse estando congelado (no debería moverse).
  const myPos = (p) => p.evaluate(() => {
    const m = window.__hunted.scene.getScene('Game').me;
    return { x: Math.round(m.x), y: Math.round(m.y) };
  });
  const frozen0 = await myPos(monster);
  await monster.keyboard.down('a');
  await monster.keyboard.down('d');
  await monster.waitForTimeout(1000);
  await monster.keyboard.up('a');
  await monster.keyboard.up('d');
  log.monsterMovedWhileFrozen = JSON.stringify(frozen0) !== JSON.stringify(await myPos(monster));

  // Espera al final de la congelación (5 s) y persigue al superviviente:
  // cada 100 ms pulsa las teclas que apuntan hacia él (persecución "voraz";
  // el personaje resbala por los obstáculos). Si se atasca, prueba a rodear.
  await monster.waitForFunction(() => window.__hunted.scene.getScene('Game').me.frozen === false, null, { timeout: 8000 });
  const chaseStart = Date.now();
  let held = new Set();
  let last = null;
  let stuck = 0;
  while (Date.now() - chaseStart < 40000) {
    if (await monster.isVisible('#results')) break;
    const st = await monster.evaluate(() => {
      const s = window.__hunted.scene.getScene('Game');
      if (!s) return null;
      const other = [...s.sprites.entries()].find(([id]) => id !== s.myId)[1].container;
      return { x: s.me.x, y: s.me.y, tx: other.x, ty: other.y };
    });
    if (!st) break;
    const dx = st.tx - st.x;
    const dy = st.ty - st.y;
    const moved = last ? Math.hypot(st.x - last.x, st.y - last.y) : 99;
    stuck = moved < 3 ? stuck + 1 : 0;
    last = st;
    const want = new Set();
    if (stuck > 3) {
      // Atascado: se mueve en perpendicular un rato para rodear el obstáculo.
      want.add(Math.abs(dx) > Math.abs(dy) ? (stuck % 20 < 10 ? 'w' : 's') : stuck % 20 < 10 ? 'a' : 'd');
    } else {
      if (Math.abs(dx) > 8) want.add(dx > 0 ? 'd' : 'a');
      if (Math.abs(dy) > 8) want.add(dy > 0 ? 's' : 'w');
    }
    for (const k of held) if (!want.has(k)) await monster.keyboard.up(k);
    for (const k of want) if (!held.has(k)) await monster.keyboard.down(k);
    held = want;
    await monster.waitForTimeout(100);
  }
  for (const k of held) await monster.keyboard.up(k);
  log.chaseSeconds = Math.round((Date.now() - chaseStart) / 1000);
  await survivor.waitForSelector('#results:not([hidden])', { timeout: 5000 });
  await monster.waitForSelector('#results:not([hidden])');

  log.result1 = {
    title: await A.textContent('#results-title'),
    reason: await A.textContent('#results-reason'),
    players: await A.$$eval('#results-players li', (l) => l.map((x) => x.textContent)),
  };
  await survivor.screenshot({ path: `${out}/fase4-resultados.png` });

  // --- Revancha: ambos vuelven a la sala y empieza otra partida ---
  await A.click('#btn-again');
  await B.click('#btn-again');
  await A.waitForSelector('#lobby:not([hidden])');
  await A.click('#btn-start');
  // Espera a que exista el juego NUEVO (el anterior se destruyó al terminar).
  await Promise.all(
    [A, B].map((p) =>
      p.waitForFunction((oldSeed) => {
        const seed = window.__hunted?.scene?.getScene('Game')?.map?.seed;
        return seed !== undefined && seed !== oldSeed;
      }, log.map1.seed),
    ),
  );
  log.rematchStarted = true;
  const map2 = JSON.parse(await mapOf(A));
  log.map2 = { seed: map2.seed, obstacles: map2.obstacles.length };
  log.rematchNewMap = JSON.stringify(map2.obstacles) !== JSON.stringify(JSON.parse(mapA).obstacles);
  log.rematchSameMapBothClients = (await mapOf(A)) === (await mapOf(B));
  await A.waitForTimeout(500);
  await A.screenshot({ path: `${out}/fase5-mapa-A.png` });
  await B.screenshot({ path: `${out}/fase5-mapa-B.png` });

  // B sale: A ve resultados por abandono.
  await B.click('#btn-quit');
  await A.waitForSelector('#results:not([hidden])', { timeout: 3000 });
  log.result2 = {
    title: await A.textContent('#results-title'),
    reason: await A.textContent('#results-reason'),
  };

  console.log(JSON.stringify({ ...log, errors }, null, 1));
  await browser.close();
})();
