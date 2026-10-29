// Ranged dagger thrower: aims at nearest enemy via live state read, uses real mouse input.
// Usage: node .tmp/throw.cjs <throws> <checkpointPath>
const fs = require('node:fs');
const path = require('node:path');
const WebSocket = require('ws');
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function connect() {
  const targets = await (await fetch('http://127.0.0.1:9333/json/list')).json();
  const t = targets.find(x => x.type === 'page' && x.url.startsWith('http://127.0.0.1:5173/'));
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.once('open', r); ws.once('error', j); });
  let id = 0; const p = new Map();
  ws.on('message', raw => { const m = JSON.parse(raw); if (!m.id) return; const e = p.get(m.id); if (!e) return; p.delete(m.id); m.error ? e.j(new Error(JSON.stringify(m.error))) : e.r(m.result); });
  const send = (method, params = {}) => new Promise((r, j) => { const i = ++id; p.set(i, { r, j }); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Runtime.enable');
  return { ws, send };
}

const STATE_EXPR = `(()=>{
  const s = Phaser.GAMES ? null : null;
  const g = window.__probeGame;
  const sc = g.scene.keys.GameScene;
  const cam = sc.cameras.main;
  const c = g.canvas; const r = c.getBoundingClientRect();
  const fx = wx => r.left + (wx - cam.worldView.x) / cam.worldView.width * r.width;
  const fy = wy => r.top + (wy - cam.worldView.y) / cam.worldView.height * r.height;
  const p = sc.player;
  const en = (sc.enemies.getChildren() || []).filter(e => e.active && e.hp > 0).map(e => ({x:e.x,y:e.y,hp:e.hp,maxHp:e.maxHp,kind:e.constructor.name}));
  en.sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));
  const near = en[0];
  return {
    player:{x:p.x,y:p.y,hp:p.hp,maxHp:p.maxHp,magic:Math.round(p.magic),facing:{x:+p.facingX.toFixed(2),y:+p.facingY.toFixed(2)}},
    wave: sc.currentWaveIndex, waveCount: sc.waves.length,
    nearest: near ? {x:near.x,y:near.y,hp:near.hp,dist:Math.round(Math.hypot(near.x-p.x,near.y-p.y)),sx:Math.round(fx(near.x)),sy:Math.round(fy(near.y))} : null,
    alive: en.length,
    exitsRevealed: sc.exitsRevealed,
    sceneKey: sc.scene.key,
    px: Math.round(fx(p.x)), py: Math.round(fy(p.y)),
  };
})()`;

async function state(send) {
  const r = await send('Runtime.evaluate', { expression: STATE_EXPR, returnByValue: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
}

async function shot(send, file) {
  const s = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.from(s.data, 'base64'));
}

(async () => {
  const maxThrows = Number(process.argv[2] || 6);
  const checkpoint = process.argv[3] || '.tmp/evidence/throw-cp.png';
  const { ws, send } = await connect();
  // attach game ref if missing
  const att = await send('Runtime.evaluate', { expression: `(()=>{ if(window.__probeGame) return 'ok'; return 'missing'; })()`, returnByValue: true });
  if (att.result.value === 'missing') {
    const proto = await send('Runtime.evaluate', { expression: 'Phaser.Game.prototype' });
    const objs = await send('Runtime.queryObjects', { prototypeObjectId: proto.result.objectId });
    await send('Runtime.callFunctionOn', { objectId: objs.objects.objectId, functionDeclaration: 'function(){ window.__probeGame = this[0]; return !!this[0]; }', returnByValue: true });
  }
  const log = [];
  for (let i = 0; i < maxThrows; i++) {
    const st = await state(send);
    log.push({ i, wave: st.wave, alive: st.alive, php: st.player.hp, near: st.nearest && { hp: st.nearest.hp, dist: st.nearest.dist } });
    if (!st.nearest || st.player.hp <= 0) { break; }
    // aim: press and hold at enemy, re-aim before release
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: st.nearest.sx, y: st.nearest.sy, button: 'none', buttons: 0 });
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: st.nearest.sx, y: st.nearest.sy, button: 'left', buttons: 1, clickCount: 1 });
    await sleep(230);
    const st2 = await state(send);
    if (st2.nearest) {
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: st2.nearest.sx, y: st2.nearest.sy, button: 'none', buttons: 1 });
      await sleep(30);
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: st2.nearest.sx, y: st2.nearest.sy, button: 'left', buttons: 0, clickCount: 1 });
    } else {
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: st.nearest.sx, y: st.nearest.sy, button: 'left', buttons: 0, clickCount: 1 });
    }
    await sleep(160);
  }
  const final = await state(send);
  await shot(send, checkpoint);
  console.log(JSON.stringify({ log, final }, null, 1));
  ws.terminate();
})().catch(e => { console.error(e); process.exitCode = 1; });
