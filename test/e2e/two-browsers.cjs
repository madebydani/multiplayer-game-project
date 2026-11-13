const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2] || '.';
  const browser = await chromium.launch();
  const errors = [];
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

  await A.fill('#name', 'Ana');
  await A.click('#btn-create');
  await A.waitForSelector('#lobby:not([hidden])');
  const code = await A.textContent('#lobby-code');
  const startDisabled1 = await A.isDisabled('#btn-start');

  await B.fill('#name', 'Bea');
  await B.fill('#code', code.toLowerCase());
  await B.click('#btn-join');
  await B.waitForSelector('#lobby:not([hidden])');
  await A.waitForFunction(() => document.querySelectorAll('#lobby-players li').length === 2);
  await A.screenshot({ path: out + '/fase3-sala-anfitrion.png' });
  const lobbyA = await A.$$eval('#lobby-players li', (l) => l.map((x) => x.textContent));
  const startVisibleB = await B.isVisible('#btn-start');
  const hintB = await B.textContent('#lobby-hint');

  await A.click('#btn-start');
  await Promise.all([A, B].map((p) => p.waitForFunction(() => window.__hunted?.scene?.getScene('Game')?.me)));
  await A.waitForTimeout(500);

  const pos = (p) => p.evaluate(() => {
    const s = window.__hunted.scene.getScene('Game');
    const out = {};
    for (const [id, sp] of s.sprites) out[id === s.myId ? 'me' : 'other'] = { x: Math.round(sp.container.x), y: Math.round(sp.container.y) };
    return out;
  });
  const before = { A: await pos(A), B: await pos(B) };
  // A se mueve a la izquierda, B hacia abajo, a la vez.
  await A.keyboard.down('a');
  await B.keyboard.down('ArrowDown');
  await A.waitForTimeout(1200);
  await A.keyboard.up('a');
  await B.keyboard.up('ArrowDown');
  await A.waitForTimeout(600);
  const after = { A: await pos(A), B: await pos(B) };
  await A.screenshot({ path: out + '/fase3-partida-A.png' });
  await B.screenshot({ path: out + '/fase3-partida-B.png' });

  // B sale: A vuelve a la sala con aviso de abandono.
  await B.click('#btn-quit');
  await A.waitForSelector('#lobby:not([hidden])', { timeout: 3000 });
  const endMsg = await A.textContent('#lobby-error');

  console.log(JSON.stringify({ code, startDisabled1, lobbyA, startVisibleB, hintB, before, after, endMsg, errors }, null, 1));
  await browser.close();
})();
