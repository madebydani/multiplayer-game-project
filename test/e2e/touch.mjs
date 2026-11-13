// Controles táctiles en un móvil EMULADO (no sustituye a probar en un dispositivo real).
// Arranca su propio servidor. Uso: node test/e2e/touch.mjs [carpeta]
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const { createHuntedServer } = await import('../../server/index.js');
const out = process.argv[2] || '.';
const srv = createHuntedServer();
await new Promise((r) => srv.httpServer.listen(0, r));
const url = `http://localhost:${srv.httpServer.address().port}`;
const b = await chromium.launch();
const errors = [];
const phone = devices['iPhone 13 landscape'];
const ctxM = await b.newContext({ ...phone });
const M = await ctxM.newPage();
M.on('pageerror', e => errors.push('M ' + e.message)); M.on('console', m => m.type()==='error' && errors.push('M ' + m.text()));
const ctxD = await b.newContext({ viewport: { width: 1000, height: 640 } });
const D = await ctxD.newPage();
D.on('pageerror', e => errors.push('D ' + e.message));
await M.goto(url); await D.goto(url);
const r = {};
r.touchClassMobile = await M.evaluate(() => document.body.classList.contains('touch'));
r.touchClassDesktop = await D.evaluate(() => document.body.classList.contains('touch'));
await M.screenshot({ path: out + '/fase7-movil-menu.png' });
await M.fill('#name', 'Móvil'); await M.click('#btn-create'); await M.waitForSelector('#lobby:not([hidden])');
const code = await M.textContent('#lobby-code');
await D.fill('#name', 'PC'); await D.fill('#code', code); await D.click('#btn-join');
await M.waitForFunction(() => document.querySelectorAll('#lobby-players li').length === 2);
await M.click('#btn-start');
for (const p of [M, D]) await p.waitForFunction(() => window.__hunted?.scene?.getScene('Game')?.me);
const match = srv.rooms.rooms.get(code).match;
// El móvil será superviviente para probar el movimiento.
const mId = await M.evaluate(() => window.__hunted.scene.getScene('Game').myId);
r.mobileRole = match.players.get(mId).role;
r.controlsVisible = await M.isVisible('#joystick') && await M.isVisible('#touch-ability');
r.controlsHiddenDesktop = !(await D.isVisible('#joystick'));
// Joystick hacia la derecha con el ratón emulado (eventos pointer)
const box = await M.locator('#joystick').boundingBox();
const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
await M.waitForTimeout(5200); // por si es el monstruo congelado
const before = await M.evaluate(() => ({ ...window.__hunted.scene.getScene('Game').me }));
await M.mouse.move(cx, cy); await M.mouse.down(); await M.mouse.move(cx + 60, cy, { steps: 3 });
await M.waitForTimeout(400);
r.touchInputDuringDrag = await M.evaluate(() => window.__hunted.scene.getScene('Game').touch);
await M.waitForTimeout(400);
await M.mouse.up();
const after = await M.evaluate(() => ({ ...window.__hunted.scene.getScene('Game').me }));
r.movedRightPx = Math.round(after.x - before.x);
r.touchInputAfterRelease = await M.evaluate(() => window.__hunted.scene.getScene('Game').touch);
// Botón de habilidad
await M.locator('#touch-ability').click();
await M.waitForTimeout(400);
r.abilityHud = await M.textContent('#hud-ability');
await M.screenshot({ path: out + '/fase7-movil-partida.png' });
// Orientación vertical → aviso
await M.setViewportSize({ width: 390, height: 844 });
await M.waitForTimeout(300);
r.rotateHintPortrait = await M.isVisible('#rotate-hint');
await M.screenshot({ path: out + '/fase7-movil-vertical.png' });
await M.setViewportSize({ width: 844, height: 390 });
await M.waitForTimeout(300);
r.rotateHintLandscape = await M.isVisible('#rotate-hint');
console.log(JSON.stringify({ ...r, errors }, null, 1));
await b.close(); srv.io.close(); process.exit(0);
