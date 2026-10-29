const fs = require('node:fs');
const WebSocket = require('ws');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function connect() {
  const targets = await (await fetch('http://127.0.0.1:9333/json/list')).json();
  const target = targets.find(item => item.type === 'page' && item.url.startsWith('http://127.0.0.1:5173/'));
  if (!target) throw new Error('Local Vite page not found.');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.once('open', resolve);
    ws.once('error', reject);
  });
  let sequence = 0;
  const pending = new Map();
  const events = [];
  ws.on('message', raw => {
    const message = JSON.parse(raw.toString());
    if (!message.id) {
      events.push(message);
      return;
    }
    const entry = pending.get(message.id);
    if (!entry) return;
    pending.delete(message.id);
    if (message.error) entry.reject(new Error(JSON.stringify(message.error)));
    else entry.resolve(message.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
  return { target, ws, send, events };
}

async function main() {
  const [, , command, ...args] = process.argv;
  const client = await connect();
  const { send, ws, events } = client;
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Log.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });

  if (command === 'observe') {
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.mkdirSync(require('node:path').dirname(args[0]), { recursive: true });
    fs.writeFileSync(args[0], Buffer.from(shot.data, 'base64'));
    console.log(JSON.stringify({ url: client.target.url, screenshot: args[0] }));
  } else if (command === 'click') {
    const [x, y, button = 'left'] = args;
    const buttons = button === 'left' ? 1 : 2;
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Number(x), y: Number(y), button: 'none', buttons: 0 });
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: Number(x), y: Number(y), button, buttons, clickCount: 1 });
    await sleep(100);
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: Number(x), y: Number(y), button, buttons: 0, clickCount: 1 });
  } else if (command === 'keytap') {
    const [key, code, virtualKey] = args;
    const params = { key, code, windowsVirtualKeyCode: Number(virtualKey), nativeVirtualKeyCode: Number(virtualKey) };
    await send('Input.dispatchKeyEvent', { type: 'keyDown', ...params });
    await sleep(80);
    await send('Input.dispatchKeyEvent', { type: 'keyUp', ...params });
  } else if (command === 'keyhold') {
    const [key, code, virtualKey, duration] = args;
    const params = { key, code, windowsVirtualKeyCode: Number(virtualKey), nativeVirtualKeyCode: Number(virtualKey) };
    await send('Input.dispatchKeyEvent', { type: 'keyDown', ...params });
    await sleep(Number(duration));
    await send('Input.dispatchKeyEvent', { type: 'keyUp', ...params });
  } else if (command === 'mousehold') {
    const [x, y, button = 'left', duration = '1000'] = args;
    const buttons = button === 'left' ? 1 : 2;
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Number(x), y: Number(y), button: 'none', buttons: 0 });
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: Number(x), y: Number(y), button, buttons, clickCount: 1 });
    await sleep(Number(duration));
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: Number(x), y: Number(y), button, buttons: 0, clickCount: 1 });
  } else if (command === 'reload') {
    await send('Page.reload', { ignoreCache: true });
    await sleep(Number(args[0] || 2500));
  } else if (command === 'navigate') {
    await send('Page.navigate', { url: args[0] });
    await sleep(Number(args[1] || 2500));
  } else if (command === 'eval') {
    const expression = Buffer.from(args[0], 'base64').toString('utf8');
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    console.log(JSON.stringify(result.result.value));
  } else if (command === 'watch') {
    await sleep(Number(args[0] || 1000));
    console.log(JSON.stringify(events.filter(event =>
      event.method === 'Runtime.exceptionThrown' ||
      (event.method === 'Log.entryAdded' && event.params.entry.level === 'error')
    )));
  } else {
    throw new Error(`Unknown command: ${command}`);
  }
  ws.terminate();
  process.exit(0);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
