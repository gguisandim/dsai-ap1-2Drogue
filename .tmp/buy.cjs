// Dialog-safe shop buy: clicks the Green Herb Lollipop BUY button and auto-dismisses alert().
const WebSocket = require('ws');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const t = (await (await fetch('http://127.0.0.1:9333/json/list')).json()).find(x => x.type === 'page' && x.url.startsWith('http://127.0.0.1:5173/'));
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.once('open', r); ws.once('error', j); });
  let id = 0; const pending = new Map();
  let send;
  ws.on('message', async raw => {
    const m = JSON.parse(raw);
    if (!m.id) {
      if (m.method === 'Page.javascriptDialogOpening') {
        console.log('DIALOG:', m.params.message);
        try { await send('Page.handleJavaScriptDialog', { accept: true }); } catch (e) { console.log('dialog err', e.message); }
      }
      return;
    }
    const e = pending.get(m.id); if (!e) return; pending.delete(m.id);
    m.error ? e.j(new Error(JSON.stringify(m.error))) : e.r(m.result);
  });
  send = (method, params = {}) => new Promise((r, j) => { const i = ++id; pending.set(i, { r, j }); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Runtime.enable'); await send('Page.enable');
  const att = await send('Runtime.evaluate', { expression: `(()=>{const p=Phaser.Game.prototype;return 'ok';})()`, returnByValue: true }).catch(() => null);
  const x = Number(process.argv[2] || 940), y = Number(process.argv[3] || 295);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'none', buttons: 0 });
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 });
  await sleep(80);
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 });
  await sleep(600);
  console.log('done');
  ws.terminate();
})().catch(e => { console.error(e); process.exitCode = 1; });
