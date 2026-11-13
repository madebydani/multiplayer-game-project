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

  // Espera al final de la congelación (5 s) y persigue al superviviente.
  await monster.waitForFunction(() => window.__hunted.scene.getScene('Game').me.frozen === false, null, { timeout: 8000 });
  const target = await survivor.evaluate(() => window.__hunted.scene.getScene('Game').me);
  const start = await myPos(monster);
  const key = target.x > start.x ? 'd' : 'a';
  await monster.keyboard.down(key);
  await survivor.waitForSelector('#results:not([hidden])', { timeout: 5000 });
  await monster.keyboard.up(key);
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
  await Promise.all([A, B].map((p) => p.waitForSelector('#game-screen:not([hidden])')));
  log.rematchStarted = true;

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
