// World Lab inspector: connects to the world-lab tab, waits, screenshots, dumps DOM text + console errors.
const fs = require('node:fs'), path = require('node:path'), WebSocket = require('ws');
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function connect() {
  const targets = await (await fetch('http://127.0.0.1:9333/json/list')).json();
  const t = targets.find(x => x.type === 'page' && /world-lab/.test(x.url));
  if (!t) throw new Error('world-lab target not found');
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.once('open', r); ws.once('error', j); });
  let id = 0; const p = new Map(); const errors = [];
  ws.on('message', raw => {
    const m = JSON.parse(raw);
    if (!m.id) {
      if (m.method === 'Runtime.exceptionThrown') errors.push({ t: 'exception', d: m.params.exceptionDetails.text, desc: m.params.exceptionDetails.exception && m.params.exceptionDetails.exception.description });
      if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') errors.push({ t: 'log', text: m.params.entry.text, url: m.params.entry.url });
      return;
    }
    const e = p.get(m.id); if (!e) return; p.delete(m.id);
    m.error ? e.j(new Error(JSON.stringify(m.error))) : e.r(m.result);
  });
  const send = (method, params = {}) => new Promise((r, j) => { const i = ++id; p.set(i, { r, j }); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1100, deviceScaleFactor: 1, mobile: false });
  return { ws, send, errors };
}
(async () => {
  const { ws, send, errors } = await connect();
  const wait = Number(process.argv[2] || 3500);
  await sleep(wait);
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  const out = process.argv[3] || '.tmp/evidence/worldlab.png';
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, Buffer.from(shot.data, 'base64'));
  const dom = await send('Runtime.evaluate', { expression: `(()=>({url:location.href,title:document.title,text:(document.body.innerText||'').slice(0,1200),buttons:Array.from(document.querySelectorAll('button')).map(b=>b.innerText.trim()).slice(0,30),canvases:document.querySelectorAll('canvas').length}))()`, returnByValue: true });
  console.log(JSON.stringify({ dom: dom.result.value, errors }, null, 1));
  ws.terminate();
})().catch(e => { console.error(e); process.exitCode = 1; });
