// World Lab click + capture: node .tmp/wl-click.cjs <x> <y> <shotPath> [waitMs]
const fs = require('node:fs'), path = require('node:path'), WebSocket = require('ws');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const targets = await (await fetch('http://127.0.0.1:9333/json/list')).json();
  const t = targets.find(x => x.type === 'page' && /world-lab/.test(x.url));
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.once('open', r); ws.once('error', j); });
  let id = 0; const p = new Map(); const errors = [];
  ws.on('message', raw => { const m = JSON.parse(raw); if (!m.id) { if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text); if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') errors.push(m.params.entry.text + ' ' + (m.params.entry.url || '')); return; } const e = p.get(m.id); if (!e) return; p.delete(m.id); m.error ? e.j(new Error(JSON.stringify(m.error))) : e.r(m.result); });
  const send = (method, params = {}) => new Promise((r, j) => { const i = ++id; p.set(i, { r, j }); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1100, deviceScaleFactor: 1, mobile: false });
  const x = Number(process.argv[2]), y = Number(process.argv[3]);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'none', buttons: 0 });
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 });
  await sleep(70);
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 });
  await sleep(Number(process.argv[5] || 1500));
  const out = process.argv[4];
  if (out) { const s = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }); fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, Buffer.from(s.data, 'base64')); }
  const dom = await send('Runtime.evaluate', { expression: `(()=>({text:(document.body.innerText||'').slice(0,900)}))()`, returnByValue: true });
  console.log(JSON.stringify({ errors, text: dom.result.value.text }, null, 1));
  ws.terminate();
})().catch(e => { console.error(e); process.exitCode = 1; });
