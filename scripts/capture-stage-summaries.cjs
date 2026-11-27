#!/usr/bin/env node
const fs = require('node:fs');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const REPO = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(REPO, 'src', 'assets', 'stage-summaries');
const CLI_ARGS = process.argv.slice(2);
const STAGE_FILTER = CLI_ARGS.includes('--stage')
  ? CLI_ARGS[CLI_ARGS.indexOf('--stage') + 1]
  : undefined;
if (CLI_ARGS.includes('--stage') && !STAGE_FILTER) {
  throw new Error('--stage requires a stage ID.');
}

require('ts-node').register({ project: path.join(REPO, 'tsconfig.cli.json') });
const { GameSessionService } = require(path.join(REPO, 'src', 'application', 'stages', 'GameSessionService'));
const {
  resolveStageSummaryAsset,
  STAGE_SUMMARY_CATALOG,
} = require(path.join(REPO, 'src', 'presentation', 'assets', 'StageSummaryAssetCatalog'));

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close(() => resolve(address.port));
    });
  });
}

function requestJson(url, options) {
  return fetch(url, options).then(async response => {
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
    return response.json();
  });
}

async function waitFor(getValue, timeoutMs, description) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const value = await getValue();
    if (value !== undefined && value !== null) return value;
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  throw new Error(`Timed out waiting for ${description}.`);
}

function stopChild(child) {
  if (!child || child.exitCode !== null) return Promise.resolve();
  return new Promise(resolve => {
    const timer = setTimeout(resolve, 5_000);
    child.once('close', () => {
      clearTimeout(timer);
      resolve();
    });
    child.kill();
  });
}

function findBrowser() {
  const candidates = [
    process.env.UMBRA_BROWSER,
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);
  return candidates.find(candidate => {
    try { return fs.statSync(candidate).isFile(); } catch { return false; }
  });
}

function captureTargets() {
  const service = new GameSessionService();
  if (!service.catalog) throw new Error('The stage catalog could not be loaded.');
  const entries = service.catalog.list()
    .filter(entry => entry.loadability === 'loadable')
    .sort((left, right) => left.chapterId.localeCompare(right.chapterId) ||
      left.stageId.localeCompare(right.stageId));
  const catalogIds = entries.map(entry => entry.stageId).sort();
  const summaryIds = Object.keys(STAGE_SUMMARY_CATALOG).sort();
  if (JSON.stringify(catalogIds) !== JSON.stringify(summaryIds)) {
    throw new Error(`Summary catalog differs from loadable stages. Catalog: ${catalogIds.join(', ')}; summaries: ${summaryIds.join(', ')}.`);
  }

  const selectedEntries = STAGE_FILTER
    ? entries.filter(entry => entry.stageId === STAGE_FILTER)
    : entries;
  if (STAGE_FILTER && selectedEntries.length === 0) {
    throw new Error(`Unknown or non-loadable stage: ${STAGE_FILTER}.`);
  }
  return selectedEntries.flatMap(entry => {
    const module = service.registry.get(entry.stageId);
    if (!module) throw new Error(`Stage module is missing: ${entry.stageId}.`);
    const variants = Object.keys(module.manifest.presentationVariants ?? {}).sort();
    const targets = [
      { stageId: entry.stageId },
      ...variants.map(presentationVariantId => ({ stageId: entry.stageId, presentationVariantId })),
    ];
    return targets.map(target => {
      const asset = resolveStageSummaryAsset(target.stageId, target.presentationVariantId);
      if (!asset) {
        throw new Error(`No summary asset is explicitly mapped for ${target.stageId}/${target.presentationVariantId ?? 'default'}.`);
      }
      return { ...target, ...asset };
    });
  });
}

class Cdp {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.logs = [];
    socket.onmessage = event => {
      const message = JSON.parse(String(event.data));
      if (!Number.isInteger(message.id)) {
        if (message.method === 'Runtime.consoleAPICalled') {
          this.logs.push(message.params.args
            .map(argument => argument.value ?? argument.description ?? '')
            .join(' '));
        } else if (message.method === 'Runtime.exceptionThrown') {
          this.logs.push(message.params.exceptionDetails?.exception?.description ??
            message.params.exceptionDetails?.text ?? 'Unspecified browser exception.');
        } else if (message.method === 'Log.entryAdded') {
          this.logs.push(message.params.entry.text);
        }
        return;
      }
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(JSON.stringify(message.error)));
      else pending.resolve(message.result);
    };
  }

  static async connect(url) {
    if (typeof WebSocket !== 'function') {
      throw new Error('Node.js 22 or newer is required for the built-in WebSocket client.');
    }
    const socket = new WebSocket(url);
    await new Promise((resolve, reject) => {
      socket.onopen = resolve;
      socket.onerror = () => reject(new Error('Could not connect to the local Chromium CDP.'));
    });
    return new Cdp(socket);
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const result = await this.send('Runtime.evaluate', {
      expression, returnByValue: true, awaitPromise: true,
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    }
    return result.result.value;
  }

  close() {
    this.socket.close();
  }
}

function checkPng(fileName) {
  const buffer = fs.readFileSync(fileName);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (!buffer.subarray(0, 8).equals(signature)) {
    throw new Error(`Capture is not a PNG: ${fileName}`);
  }
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  if (width !== 460 || height !== 250) {
    throw new Error(`Capture dimensions must be 460x250, got ${width}x${height}: ${fileName}`);
  }
  if (buffer.length < 1_000) throw new Error(`Capture is unexpectedly small: ${fileName}`);
  return buffer;
}

async function run() {
  const browserPath = findBrowser();
  if (!browserPath) {
    throw new Error('No local Chromium or Edge browser was found; set UMBRA_BROWSER to its executable.');
  }
  const targets = captureTargets();
  const devPort = await freePort();
  const cdpPort = await freePort();
  const profileDir = path.join(os.tmpdir(), `umbra-stage-summary-${process.pid}`);
  const vitePath = path.join(REPO, 'node_modules', 'vite', 'bin', 'vite.js');
  const vite = spawn(process.execPath, [
    vitePath, '--host', '127.0.0.1', '--port', String(devPort), '--strictPort',
  ], { cwd: REPO, stdio: 'ignore', windowsHide: true });
  let browser;
  let cdp;
  try {
    await waitFor(async () => {
      try {
        const response = await fetch(`http://127.0.0.1:${devPort}/`);
        return response.ok ? true : undefined;
      } catch {
        return undefined;
      }
    }, 30_000, 'Vite development server');

    fs.mkdirSync(profileDir, { recursive: true });
    browser = spawn(browserPath, [
      '--headless=new',
      `--remote-debugging-port=${cdpPort}`,
      '--remote-debugging-address=127.0.0.1',
      '--remote-allow-origins=*',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-extensions',
      '--no-first-run',
      '--no-default-browser-check',
      '--hide-scrollbars',
      '--window-size=1280,720',
      '--force-device-scale-factor=1',
      `--user-data-dir=${profileDir}`,
      'about:blank',
    ], { stdio: 'ignore', windowsHide: true });

    await waitFor(async () => {
      try {
        return await requestJson(`http://127.0.0.1:${cdpPort}/json/version`);
      } catch {
        return undefined;
      }
    }, 30_000, 'Chromium debugging endpoint');
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    const hashes = new Map();
    for (let index = 0; index < targets.length; index += 1) {
      const target = targets[index];
      const query = new URLSearchParams({
        stageSummaryCapture: '1',
        stageId: target.stageId,
      });
      if (target.presentationVariantId) {
        query.set('presentationVariant', target.presentationVariantId);
      }
      const url = `http://127.0.0.1:${devPort}/?${query.toString()}`;
      const page = await requestJson(`http://127.0.0.1:${cdpPort}/json/new?${encodeURIComponent(url)}`, {
        method: 'PUT',
      });
      cdp = await Cdp.connect(page.webSocketDebuggerUrl);
      try {
        await cdp.send('Page.enable');
        await cdp.send('Runtime.enable');
        await cdp.send('Log.enable');
        await cdp.send('Emulation.setDeviceMetricsOverride', {
          width: 1280, height: 720, deviceScaleFactor: 1, mobile: false,
        });

        let state;
        try {
          state = await waitFor(async () => {
            let value;
            try {
              value = await cdp.evaluate('globalThis.__UMBRA_STAGE_SUMMARY_CAPTURE__ ?? null');
            } catch {
              return undefined;
            }
            const matchingTarget = value?.stageId === target.stageId &&
              (value?.presentationVariantId ?? undefined) === target.presentationVariantId;
            if (matchingTarget && value?.status === 'error') {
              throw new Error(`${value.stageId}: ${value.error}`);
            }
            return matchingTarget && value?.status === 'ready' ? value : undefined;
          }, 60_000, `${target.stageId}/${target.presentationVariantId ?? 'default'} render`);
        } catch (error) {
          let lastState;
          try {
            lastState = await cdp.evaluate('globalThis.__UMBRA_STAGE_SUMMARY_CAPTURE__ ?? null');
          } catch {
            lastState = undefined;
          }
          throw new Error(`${error.message} Last capture state: ${JSON.stringify(lastState)}. Browser log: ${cdp.logs.slice(-12).join(' | ')}`);
        }
        if (state.stageId !== target.stageId ||
          (state.presentationVariantId ?? undefined) !== target.presentationVariantId) {
          throw new Error(`Capture target mismatch: expected ${target.stageId}/${target.presentationVariantId ?? 'default'}.`);
        }
        const rect = await cdp.evaluate(`(() => {
          const canvas = document.querySelector('canvas');
          if (!canvas) return null;
          const bounds = canvas.getBoundingClientRect();
          return { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height };
        })()`);
        if (!rect || rect.width < 460 || rect.height < 250) {
          throw new Error(`The Phaser canvas is too small for capture: ${JSON.stringify(rect)}.`);
        }
        const screenshot = await cdp.send('Page.captureScreenshot', {
          format: 'png',
          fromSurface: true,
          captureBeyondViewport: false,
          clip: { x: rect.x, y: rect.y, width: 460, height: 250, scale: 1 },
        });
        const filePath = path.join(OUTPUT_DIR, target.fileName);
        const bytes = Buffer.from(screenshot.data, 'base64');
        fs.writeFileSync(filePath, bytes);
        const validated = checkPng(filePath);
        const hash = require('node:crypto').createHash('sha256').update(validated).digest('hex');
        hashes.set(hash, (hashes.get(hash) ?? 0) + 1);
        console.log(`${index + 1}/${targets.length} ${target.stageId} [${target.presentationVariantId ?? 'default'}] ${target.fileName} ${state.renderer}`);
      } finally {
        cdp.close();
        cdp = undefined;
        await fetch(`http://127.0.0.1:${cdpPort}/json/close/${page.id}`).catch(() => undefined);
      }
    }
    const duplicates = [...hashes.entries()].filter(([, count]) => count > 1).length;
    console.log(`Captured ${targets.length} stage/variant summaries; ${duplicates} duplicate PNG hash(es).`);
  } finally {
    cdp?.close();
    await Promise.all([stopChild(browser), stopChild(vite)]);
    try {
      fs.rmSync(profileDir, {
        recursive: true, force: true, maxRetries: 5, retryDelay: 500,
      });
    } catch (error) {
      console.error(`Could not remove temporary browser profile ${profileDir}: ${error.message}`);
    }
  }
}

run().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
