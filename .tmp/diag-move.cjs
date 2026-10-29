// Diagnostic: hold a key and sample player x/y over time on one CDP connection.
const WebSocket = require('ws');
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function conn() {
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
const SAMPLE = `(()=>{const s=Phaser && null;})()`;
async function sample(send) {
  const r = await send('Runtime.evaluate', { expression: `(()=>{const g=window.__probeGame;const s=g.scene.keys.GameScene;const b=s.player.body;return {x:Math.round(s.player.x),y:Math.round(s.player.y),vx:Math.round(b.velocity.x),vy:Math.round(b.velocity.y),time:Math.round(s.time.now)};})()`, returnByValue: true });
  return r.result.value;
}
async function main() {
  const { ws, send } = await conn();
  // attach game to window for sampling (read-only convenience; does not modify game state)
  const att = await send('Runtime.evaluate', { expression: `(()=>{ if(!window.__probeGame){ const r=[]; const proto=Phaser.Game.prototype; return 'need-query'; } return 'ok'; })()`, returnByValue: true });
  // use queryObjects to set window.__probeGame
  const proto = await send('Runtime.evaluate', { expression: 'Phaser.Game.prototype' });
  const objs = await send('Runtime.queryObjects', { prototypeObjectId: proto.result.objectId });
  const setRef = await send('Runtime.callFunctionOn', { objectId: objs.objects.objectId, functionDeclaration: 'function(){ window.__probeGame = this[0]; return !!this[0]; }', returnByValue: true });
  console.log('attach', setRef.result.value);
  const key = process.argv[2] || 'd';
  const code = process.argv[3] || 'KeyD';
  const vk = Number(process.argv[4] || 68);
  const dur = Number(process.argv[5] || 2000);
  const params = { key, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk };
  await send('Input.dispatchKeyEvent', { type: 'keyDown', ...params });
  const samples = [];
  const t0 = Date.now();
  while (Date.now() - t0 < dur) { samples.push({ t: Date.now() - t0, ...(await sample(send)) }); await sleep(200); }
  await send('Input.dispatchKeyEvent', { type: 'keyUp', ...params });
  console.log(JSON.stringify(samples, null, 1));
  ws.terminate();
}
main().catch(e => { console.error(e); process.exitCode = 1; });
