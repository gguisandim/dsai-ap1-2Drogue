// World Lab eval + capture: node .tmp/wl-eval.cjs <exprFile> <shotPath> [waitMs]
const fs = require('node:fs'), path = require('node:path'), WebSocket = require('ws');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const expr = fs.readFileSync(process.argv[2], 'utf8');
  const targets = await (await fetch('http://127.0.0.1:9333/json/list')).json();
  const t = targets.find(x => x.type === 'page' && /world-lab/.test(x.url));
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.once('open', r); ws.once('error', j); });
  let id = 0; const p = new Map();
  ws.on('message', raw => { const m = JSON.parse(raw); if (!m.id) return; const e = p.get(m.id); if (!e) return; p.delete(m.id); m.error ? e.j(new Error(JSON.stringify(m.error))) : e.r(m.result); });
  const send = (method, params = {}) => new Promise((r, j) => { const i = ++id; p.set(i, { r, j }); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1100, deviceScaleFactor: 1, mobile: false });
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  await sleep(Number(process.argv[4] || 1200));
  if (process.argv[3]) { const s = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }); fs.mkdirSync(path.dirname(process.argv[3]), { recursive: true }); fs.writeFileSync(process.argv[3], Buffer.from(s.data, 'base64')); }
  console.log(JSON.stringify(r.result.value, null, 1));
  ws.terminate();
})().catch(e => { console.error(e); process.exitCode = 1; });
