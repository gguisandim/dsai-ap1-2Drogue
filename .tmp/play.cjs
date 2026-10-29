// Batch input driver. Usage: node .tmp/play.cjs <actions.json>
// actions: array of {a:'move',x,y} {a:'key',key,code,vk,duration} {a:'tap',key,code,vk}
//          {a:'hold',x,y,duration,button} {a:'click',x,y} {a:'shot',path} {a:'sleep',ms} {a:'info'}
const fs = require('node:fs');
const path = require('node:path');
const WebSocket = require('ws');
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function connect() {
  const targets = await (await fetch('http://127.0.0.1:9333/json/list')).json();
  const target = targets.find(t => t.type === 'page' && t.url.startsWith('http://127.0.0.1:5173/'));
  if (!target) throw new Error('Local Vite page not found.');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.once('open', res); ws.once('error', rej); });
  let id = 0; const pending = new Map();
  ws.on('message', raw => {
    const m = JSON.parse(raw.toString());
    if (!m.id) return;
    const p = pending.get(m.id); if (!p) return; pending.delete(m.id);
    if (m.error) p.reject(new Error(JSON.stringify(m.error))); else p.resolve(m.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const rid = ++id; pending.set(rid, { resolve, reject });
    ws.send(JSON.stringify({ id: rid, method, params }));
  });
  await send('Runtime.enable'); await send('Page.enable');
  return { ws, send };
}

async function main() {
  const actions = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const { ws, send } = await connect();
  const results = [];
  for (const ac of actions) {
    try {
      if (ac.a === 'move') {
        await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: ac.x, y: ac.y, button: 'none', buttons: 0 });
      } else if (ac.a === 'tap' || ac.a === 'key') {
        const p = { key: ac.key, code: ac.code, windowsVirtualKeyCode: ac.vk, nativeVirtualKeyCode: ac.vk };
        await send('Input.dispatchKeyEvent', { type: 'keyDown', ...p });
        await sleep(ac.a === 'key' ? (ac.duration || 0) : 60);
        await send('Input.dispatchKeyEvent', { type: 'keyUp', ...p });
      } else if (ac.a === 'hold' || ac.a === 'click') {
        const button = ac.button || 'left';
        const buttons = button === 'left' ? 1 : 2;
        await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: ac.x, y: ac.y, button: 'none', buttons: 0 });
        await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: ac.x, y: ac.y, button, buttons, clickCount: 1 });
        await sleep(ac.a === 'hold' ? (ac.duration || 100) : 60);
        await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: ac.x, y: ac.y, button, buttons: 0, clickCount: 1 });
      } else if (ac.a === 'shot') {
        const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
        fs.mkdirSync(path.dirname(ac.path), { recursive: true });
        fs.writeFileSync(ac.path, Buffer.from(shot.data, 'base64'));
        results.push({ shot: ac.path });
      } else if (ac.a === 'sleep') {
        await sleep(ac.ms);
      } else if (ac.a === 'close') {
        await send('Page.close');
      }
    } catch (e) { results.push({ error: String(e), at: ac }); }
  }
  console.log(JSON.stringify({ done: actions.length, results }));
  ws.terminate();
}
main().catch(e => { console.error(e); process.exitCode = 1; });
