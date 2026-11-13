// Prueba de objetos con dos navegadores. Arranca su propio servidor (no hace falta npm start)
// para poder colocar objetos junto a los jugadores. Uso: node test/e2e/items.mjs [carpeta]
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const { createHuntedServer } = await import('../../server/index.js');
const out = process.argv[2] || '.';
const srv = createHuntedServer();
await new Promise((r) => srv.httpServer.listen(0, r));
const url = `http://localhost:${srv.httpServer.address().port}`;
const b = await chromium.launch();
const errors = [];
const mk = async () => { const c = await b.newContext({ viewport: { width: 1000, height: 640 } }); const p = await c.newPage(); p.on('pageerror', e => errors.push(e.message)); p.on('console', m => m.type()==='error' && errors.push(m.text())); await p.goto(url); return p; };
const A = await mk(), B = await mk();
await A.fill('#name', 'Ana'); await A.click('#btn-create'); await A.waitForSelector('#lobby:not([hidden])');
const code = await A.textContent('#lobby-code');
await B.fill('#name', 'Bea'); await B.fill('#code', code); await B.click('#btn-join');
await A.waitForFunction(() => document.querySelectorAll('#lobby-players li').length === 2);
await A.click('#btn-start');
for (const p of [A, B]) await p.waitForFunction(() => window.__hunted?.scene?.getScene('Game')?.me);
const match = srv.rooms.rooms.get(code).match;
const ids = [...match.players.values()];
const survP = ids.find(p => p.role === 'survivor'), monP = ids.find(p => p.role === 'monster');
const myId = (pg) => pg.evaluate(() => window.__hunted.scene.getScene('Game').myId);
const surv = (await myId(A)) === survP.id ? A : B; const mon = surv === A ? B : A;
const r = {};
// Acercamos al monstruo para que ambos estén en pantalla (lo hace el servidor).
monP.x = survP.x + 250; monP.y = survP.y;
// Objeto de humo bajo los pies del superviviente → recogida.
match.items.set('tsmoke', { id: 'tsmoke', type: 'smoke', x: survP.x, y: survP.y });
match.items.set('tinvis', { id: 'tinvis', type: 'invis', x: survP.x + 100, y: survP.y + 100 });
await surv.waitForTimeout(500);
r.slots = [await surv.textContent('#slot-0'), await surv.textContent('#slot-1')];
r.toast = await surv.textContent('#toast');
r.itemSpritesSurv = await surv.evaluate(() => window.__hunted.scene.getScene('Game').itemSprites.size);
r.itemSpritesMon = await mon.evaluate(() => window.__hunted.scene.getScene('Game').itemSprites.size);
await surv.screenshot({ path: out + '/fase7c-objetos.png' });
// Usar humo (tecla 1)
await surv.keyboard.press('1');
await surv.waitForTimeout(500);
r.cloudsSurv = await surv.evaluate(() => window.__hunted.scene.getScene('Game').cloudSprites.size);
r.cloudsMon = await mon.evaluate(() => window.__hunted.scene.getScene('Game').cloudSprites.size);
r.monSeesSurvivorInSmoke = await mon.evaluate(() => { const s = window.__hunted.scene.getScene('Game'); return [...s.sprites.entries()].filter(([id]) => id !== s.myId).map(([, x]) => x.container.visible); });
r.survAlpha = await surv.evaluate(() => { const s = window.__hunted.scene.getScene('Game'); return s.sprites.get(s.myId).container.alpha; });
r.slotsAfterUse = [await surv.textContent('#slot-0'), await surv.textContent('#slot-1')];
await mon.screenshot({ path: out + '/fase7c-humo-monstruo.png' });
await surv.screenshot({ path: out + '/fase7c-humo-superviviente.png' });
// Usar ranura vacía → aviso
await surv.keyboard.press('2');
await surv.waitForTimeout(300);
r.emptySlotToast = await surv.textContent('#toast');
// Monstruo: furia y radar
await mon.waitForFunction(() => !window.__hunted.scene.getScene('Game').me.frozen, null, { timeout: 8000 });
monP.inventory = ['fury', 'radar'];
await mon.waitForTimeout(200);
await mon.keyboard.press('1');
await mon.keyboard.press('1'); // tras usar la 1, el radar pasa a la ranura 1
await mon.waitForTimeout(400);
r.monEffects = await mon.textContent('#hud-effects');
r.monRadar = await mon.evaluate(() => window.__hunted.scene.getScene('Game').radar);
r.monFuryPredicted = await mon.evaluate(() => window.__hunted.scene.getScene('Game').me.fury);
await mon.screenshot({ path: out + '/fase7c-radar.png' });
console.log(JSON.stringify({ ...r, errors }, null, 1));
await b.close();
srv.io.close();
process.exit(0);
