// Comprueba ajustes, créditos, minimapa e indicador de conexión con dos navegadores.
// Requiere el servidor arrancado. Uso: node test/e2e/ui.cjs [carpeta-para-capturas]
const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2] || '.';
  const b = await chromium.launch();
  const errors = [];
  const mk = async () => { const c = await b.newContext({ viewport: { width: 1000, height: 640 } }); const p = await c.newPage(); p.on('pageerror', e => errors.push(e.message)); p.on('console', m => m.type()==='error' && errors.push(m.text())); await p.goto('http://localhost:3000'); return p; };
  const A = await mk(), B = await mk();
  const r = {};
  // Ajustes
  await A.click('#btn-settings');
  r.settingsVisible = await A.isVisible('#settings');
  await A.fill('#volume', '30'); await A.dispatchEvent('#volume', 'input');
  r.volumeLabel = await A.textContent('#volume-value');
  await A.check('#reduce-motion');
  await A.screenshot({ path: out + '/fase6-ajustes.png' });
  await A.click('#settings .btn-back');
  await A.reload();
  r.persisted = await A.evaluate(() => ({ v: document.getElementById('volume').value, rm: document.getElementById('reduce-motion').checked }));
  await A.click('#btn-credits');
  r.creditsVisible = await A.isVisible('#credits');
  await A.click('#credits .btn-back');
  // Partida
  await A.fill('#name', 'Ana'); await A.click('#btn-create'); await A.waitForSelector('#lobby:not([hidden])');
  const code = await A.textContent('#lobby-code');
  await B.fill('#name', 'Bea'); await B.fill('#code', code); await B.click('#btn-join');
  await A.waitForFunction(() => document.querySelectorAll('#lobby-players li').length === 2);
  await A.click('#btn-start');
  await A.waitForFunction(() => window.__hunted?.scene?.getScene('Game')?.me);
  await A.waitForTimeout(2500);
  r.net = await A.textContent('#hud-net');
  r.minimap = await A.evaluate(() => { const c = document.getElementById('minimap'); return c && { w: c.width, h: c.height, visible: !c.hidden }; });
  r.reduceMotionApplied = await A.evaluate(() => document.body.classList.contains('reduce-motion'));
  await A.keyboard.down('d'); await A.waitForTimeout(600); await A.keyboard.up('d');
  r.angle = await A.evaluate(() => { const s = window.__hunted.scene.getScene('Game'); return s.sprites.get(s.myId).angle; });
  await A.keyboard.press('m');
  r.minimapHiddenAfterM = await A.evaluate(() => document.getElementById('minimap').hidden);
  await A.keyboard.press('m');
  await A.screenshot({ path: out + '/fase6-partida-placeholders.png' });
  await B.click('#btn-quit');
  await A.waitForSelector('#results:not([hidden])');
  r.minimapRemoved = await A.evaluate(() => !document.getElementById('minimap'));
  console.log(JSON.stringify({ ...r, errors }, null, 1));
  await b.close();
})();
