const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');
const WebSocket = require('ws');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function start() {
  const targets = await (await fetch('http://127.0.0.1:9333/json/list')).json();
  const target = targets.find(item => item.type === 'page' && item.url.startsWith('http://127.0.0.1:5173/'));
  if (!target) throw new Error('Local Vite page not found.');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject); });
  let id = 0;
  const pending = new Map();
  const errors = [];
  ws.on('message', raw => {
    const message = JSON.parse(raw.toString());
    if (!message.id) {
      if (message.method === 'Runtime.exceptionThrown' ||
          (message.method === 'Log.entryAdded' && message.params.entry.level === 'error')) errors.push(message);
      return;
    }
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    if (message.error) request.reject(new Error(JSON.stringify(message.error)));
    else request.resolve(message.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const requestId = ++id;
    pending.set(requestId, { resolve, reject });
    ws.send(JSON.stringify({ id: requestId, method, params }));
  });
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Log.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });

  async function run(command) {
    if (command.action === 'observe') {
      const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      fs.mkdirSync(path.dirname(command.path), { recursive: true });
      fs.writeFileSync(command.path, Buffer.from(shot.data, 'base64'));
      return { screenshot: command.path };
    }
    if (command.action === 'click') {
      const button = command.button || 'left';
      const buttons = button === 'left' ? 1 : 2;
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: command.x, y: command.y, button: 'none', buttons: 0 });
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: command.x, y: command.y, button, buttons, clickCount: 1 });
      await sleep(command.duration || 100);
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: command.x, y: command.y, button, buttons: 0, clickCount: 1 });
      return { clicked: [command.x, command.y, button] };
    }
    if (command.action === 'keytap' || command.action === 'keyhold') {
      const params = { key: command.key, code: command.code, windowsVirtualKeyCode: command.vk, nativeVirtualKeyCode: command.vk };
      await send('Input.dispatchKeyEvent', { type: 'keyDown', ...params });
      await sleep(command.action === 'keyhold' ? command.duration : 80);
      await send('Input.dispatchKeyEvent', { type: 'keyUp', ...params });
      return { key: command.key, duration: command.duration || 80 };
    }
    if (command.action === 'mousehold') {
      const button = command.button || 'left';
      const buttons = button === 'left' ? 1 : 2;
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: command.x, y: command.y, button: 'none', buttons: 0 });
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: command.x, y: command.y, button, buttons, clickCount: 1 });
      await sleep(command.duration);
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: command.x, y: command.y, button, buttons: 0, clickCount: 1 });
      return { held: [command.x, command.y, button], duration: command.duration };
    }
    if (command.action === 'eval') {
      const result = await send('Runtime.evaluate', { expression: command.expression, returnByValue: true, awaitPromise: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
      return { value: result.result.value };
    }
    if (command.action === 'reload') {
      await send('Page.reload', { ignoreCache: true });
      await sleep(command.duration || 2500);
      return { reloaded: true };
    }
    if (command.action === 'navigate') {
      await send('Page.navigate', { url: command.url });
      await sleep(command.duration || 2500);
      return { navigated: command.url };
    }
    if (command.action === 'sleep') {
      await sleep(command.duration);
      return { slept: command.duration };
    }
    if (command.action === 'errors') return { errors };
    throw new Error(`Unknown action: ${command.action}`);
  }

  console.log('READY');
  const input = readline.createInterface({ input: process.stdin, terminal: false });
  for await (const line of input) {
    if (!line.trim()) continue;
    try {
      const result = await run(JSON.parse(line));
      console.log(`RESULT ${JSON.stringify(result)}`);
    } catch (error) {
      console.log(`ERROR ${JSON.stringify({ message: error.message })}`);
    }
  }
  ws.close();
}

start().catch(error => { console.error(error); process.exit(1); });
