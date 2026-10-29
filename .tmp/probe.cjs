// Read-only inspection helper: finds the live Phaser.Game instance via CDP queryObjects.
// Usage: node .tmp/probe.cjs <body-file.js>
// The body file is evaluated as: (function(game){ <body> })(this[0]) with `this` = array of Game instances.
const fs = require('node:fs');
const WebSocket = require('ws');

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function connect() {
  const targets = await (await fetch('http://127.0.0.1:9333/json/list')).json();
  const target = targets.find(t => t.type === 'page' && t.url.startsWith('http://127.0.0.1:5173/'));
  if (!target) throw new Error('Local Vite page not found.');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.once('open', res); ws.once('error', rej); });
  let id = 0;
  const pending = new Map();
  ws.on('message', raw => {
    const m = JSON.parse(raw.toString());
    if (!m.id) return;
    const p = pending.get(m.id);
    if (!p) return;
    pending.delete(m.id);
    if (m.error) p.reject(new Error(JSON.stringify(m.error)));
    else p.resolve(m.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const rid = ++id;
    pending.set(rid, { resolve, reject });
    ws.send(JSON.stringify({ id: rid, method, params }));
  });
  await send('Runtime.enable');
  return { ws, send };
}

async function main() {
  const body = fs.readFileSync(process.argv[2], 'utf8');
  const { ws, send } = await connect();
  const proto = await send('Runtime.evaluate', { expression: 'Phaser.Game.prototype', objectGroup: 'probe' });
  if (proto.exceptionDetails) throw new Error(proto.exceptionDetails.text);
  const objs = await send('Runtime.queryObjects', { prototypeObjectId: proto.result.objectId, objectGroup: 'probe' });
  if (objs.exceptionDetails) throw new Error(objs.exceptionDetails.text);
  const fn = `function(){\n  const game = this[0];\n  if (!game) return { error: 'no game instance' };\n  ${body}\n}`;
  const res = await send('Runtime.callFunctionOn', {
    objectId: objs.objects.objectId,
    functionDeclaration: fn,
    returnByValue: true,
    awaitPromise: true,
  });
  if (res.exceptionDetails) {
    console.error('EXCEPTION', JSON.stringify(res.exceptionDetails, null, 2));
    process.exitCode = 1;
  } else {
    console.log(JSON.stringify(res.result.value, null, 2));
  }
  await send('Runtime.releaseObjectGroup', { objectGroup: 'probe' }).catch(() => {});
  ws.terminate();
}

main().catch(e => { console.error(e); process.exitCode = 1; });
