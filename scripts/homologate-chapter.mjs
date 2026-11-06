#!/usr/bin/env node
/**
 * Etapa 9.13 — runtime homologation harness.
 *
 * Loads an authoring chapter (or a production stage) through the existing Vite
 * preview, drives the real Phaser session with CDP keyboard events, observes the
 * narrative/runtime state, and writes an `umbra.stage-homologation.report` v1.
 *
 * It never boosts HP, teleports the player, edits game rules or fabricates
 * progression. Missing interactions are reported as UNKNOWN.
 */
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

const REPO = process.cwd();
const EVIDENCE_ROOT = path.resolve(REPO, '.tmp', 'evidence-914');
const REPORTS_ROOT = path.resolve(REPO, 'src', 'devtools', 'world-lab', 'reports');
const SCHEMA_VERSION = 1;
const REPORT_KIND = 'umbra.stage-homologation.report';
const CAMPAIGN_REPORT_KIND = 'umbra.campaign-homologation.report';
const TILE = 32;
const CAMPAIGN_HUB_STAGE_ID = 'stage.raiz-do-mundo.santuario';
const CAMPAIGN_IGAPO_STAGE_ID = 'stage.aguas.igapo-das-memorias';
const CAMPAIGN_DESTINATION_STAGE_ID = 'stage.aguas.coracao-corrompido';

function parseArgs(argv) {
  const result = {
    slug: undefined, stageId: undefined, variantId: undefined, campaign: false,
    macroRunId: undefined, macroRunSeed: undefined, json: false, capture: false,
    timeoutMs: 240_000, evidenceDir: EVIDENCE_ROOT, browserPath: undefined,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--stage') { result.stageId = argv[++index]; continue; }
    if (value === '--variant') { result.variantId = argv[++index]; continue; }
    if (value === '--campaign') { result.campaign = true; continue; }
    if (value === '--macro-run') { result.macroRunId = argv[++index]; continue; }
    if (value === '--macro-seed') { result.macroRunSeed = argv[++index]; continue; }
    if (value === '--timeout') { result.timeoutMs = Number(argv[++index]); continue; }
    if (value === '--evidence-dir') { result.evidenceDir = path.resolve(REPO, argv[++index]); continue; }
    if (value === '--browser') { result.browserPath = argv[++index]; continue; }
    if (value === '--json') { result.json = true; continue; }
    if (value === '--capture') { result.capture = true; continue; }
    if (value === '--help' || value === '-h') { result.help = true; continue; }
    if (value.startsWith('-')) throw new Error(`Opção desconhecida: ${value}`);
    if (result.slug) throw new Error(`Slug inesperado: ${value}`);
    result.slug = value;
  }
  return result;
}

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  console.log(`Uso:
  npm run homologate -- <slug> [--variant <id>] [--json]
  npm run homologate -- --stage <stageId> [--variant <id>] [--json]
  npm run homologate -- --stage <stageId> --capture [--json]
  npm run homologate -- --campaign [--macro-run <id>] [--macro-seed <seed>] [--json]

Opções:
  --timeout <ms>        Tempo máximo da execução (padrão 240000)
  --evidence-dir <dir>  Diretório de evidências (padrão .tmp/evidence-913)
  --browser <path>      Navegador Chromium/Edge alternativo
  --campaign            Homologa o fluxo de campanha macro (hub → Igapó → Coração)
  --macro-run <id>      Run id da campanha macro
  --macro-seed <seed>   Seed da campanha macro
`);
  process.exit(0);
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function ensureDir(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function timestamp() {
  return new Date().toISOString();
}

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close(() => resolve(address.port));
    });
  });
}

function findBrowser() {
  const candidates = [
    args.browserPath,
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

function findChapterDir(slug) {
  return path.join(REPO, 'src', 'examples', 'chapters', slug);
}

function readStagePlan({ slug, stageId }) {
  if (slug) {
    const file = path.join(findChapterDir(slug), 'stage-plan.json');
    if (!fs.existsSync(file)) return undefined;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  }
  const root = path.join(REPO, 'src', 'examples', 'chapters');
  if (!fs.existsSync(root)) return undefined;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.tmp-')) continue;
    const file = path.join(root, entry.name, 'stage-plan.json');
    if (!fs.existsSync(file)) continue;
    try {
      const plan = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (plan.stageId === stageId) return plan;
    } catch { /* ignore malformed authoring plans */ }
  }
  return undefined;
}

function readChapterSeed(slug) {
  if (!slug) return null;
  const file = path.join(findChapterDir(slug), 'index.ts');
  if (!fs.existsSync(file)) return null;
  const match = /seed:\s*(\d+)/.exec(fs.readFileSync(file, 'utf8'));
  return match ? Number(match[1]) : null;
}

function check(id, code, status, message, options = {}) {
  return Object.freeze({
    id, code, status,
    required: options.required !== false,
    message,
    evidence: 'phaser-runtime',
    ...(options.location ? { location: { x: options.location.x, y: options.location.y } } : {}),
    ...(options.regionId ? { regionId: options.regionId } : {}),
    ...(options.suggestion ? { suggestion: options.suggestion } : {}),
  });
}

function reportResult(checks) {
  const required = checks.filter(item => item.required);
  if (required.some(item => item.status === 'FAIL')) return 'FAIL';
  if (required.some(item => item.status === 'UNKNOWN')) return 'UNKNOWN';
  return 'PASS';
}

function reportFileName(report) {
  if (report.kind === CAMPAIGN_REPORT_KIND) {
    const run = String(report.runId ?? 'default').replace(/[^a-z0-9._-]+/gi, '-');
    return `campaign-${run}-homologation.json`;
  }
  const suffix = report.variantId
    ? `-${report.variantId.replace(/[^a-z0-9._-]+/gi, '-')}`
    : '';
  return report.stageId
    ? `${report.stageId.replace(/[^a-z0-9._-]+/gi, '-')}${suffix}-homologation.json`
    : 'homologation.json';
}

/**
 * Copies the report to the development-only directory served by Vite and
 * updates the index used by the World Lab. Only the known report files are
 * exposed; no arbitrary filesystem path is made available.
 */
function publishReport(report, fileName) {
  try {
    ensureDir(REPORTS_ROOT);
    const reportFile = path.join(REPORTS_ROOT, fileName);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2) + '\n');
    const indexPath = path.join(REPORTS_ROOT, 'index.json');
    let index = { schemaVersion: 1, kind: 'umbra.world-lab.report-index', generatedAt: timestamp(), reports: [] };
    if (fs.existsSync(indexPath)) {
      try { index = JSON.parse(fs.readFileSync(indexPath, 'utf8')); } catch { /* rebuild the index */ }
    }
    const entry = {
      file: fileName,
      kind: report.kind,
      result: report.result,
      generatedAt: report.generatedAt,
      ...(report.stageId ? { stageId: report.stageId } : {}),
      ...(report.variantId ? { variantId: report.variantId } : {}),
      ...(report.originStageId ? { originStageId: report.originStageId } : {}),
      ...(report.destinationStageId ? { destinationStageId: report.destinationStageId } : {}),
    };
    index.generatedAt = timestamp();
    index.reports = [...(Array.isArray(index.reports) ? index.reports : [])
      .filter(item => item?.file !== fileName), entry]
      .sort((left, right) => String(left.file).localeCompare(String(right.file)));
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2) + '\n');
  } catch {
    // Publishing to the World Lab is best-effort; the evidence report remains.
  }
}

function writeReport(report) {
  ensureDir(args.evidenceDir);
  if (!report.generatedAt) report.generatedAt = timestamp();
  const fileName = reportFileName(report);
  const file = path.join(args.evidenceDir, fileName);
  fs.writeFileSync(file, JSON.stringify(report, null, 2) + '\n');
  publishReport(report, fileName);
  if (args.json) {
    process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  } else {
    console.log(`Homologação: ${report.stageId ?? 'desconhecida'}`);
    console.log(`Resultado: ${report.result}`);
    console.log(`Cenário: ${report.scenario ?? 'desconhecido'}  Variante: ${report.variantId ?? 'padrão'}`);
    report.checks.forEach(item => {
      const location = item.location ? ` @${item.location.x},${item.location.y}` : '';
      console.log(`  ${item.status.padEnd(7)} [${item.code}] ${item.id}${location}${item.required ? '' : ' (não bloqueante)'}`);
      if (item.status !== 'PASS') console.log(`          ${item.message}`);
    });
    if (report.evidence?.screenshots?.length) {
      console.log(`Capturas: ${report.evidence.screenshots.join(', ')}`);
    }
    console.log(`Relatório: ${file}`);
  }
  return file;
}

class Cdp {
  constructor(webSocket) {
    this.ws = webSocket;
    this.nextId = 1;
    this.pending = new Map();
    this.logs = [];
    webSocket.onmessage = event => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(JSON.stringify(message.error)));
        else resolve(message.result);
        return;
      }
      if (message.method === 'Runtime.consoleAPICalled') {
        this.logs.push({
          type: message.params.type,
          text: message.params.args.map(arg => arg.value ?? arg.description ?? '').join(' '),
        });
      }
      if (message.method === 'Log.entryAdded') {
        this.logs.push({ type: message.params.entry.level, text: message.params.entry.text });
      }
      if (message.method === 'Runtime.exceptionThrown') {
        const details = message.params.exceptionDetails;
        this.logs.push({
          type: 'exception',
          text: `${details?.text ?? 'exception'} ${details?.exception?.description ?? ''}`.slice(0, 2000),
        });
      }
    };
  }

  static async connect(url) {
    if (typeof WebSocket !== 'function') {
      throw new Error('Este Node não oferece WebSocket global; use Node 22+.');
    }
    const socket = new WebSocket(url);
    await new Promise((resolve, reject) => {
      socket.onopen = resolve;
      socket.onerror = () => reject(new Error('Falha ao abrir o WebSocket do CDP.'));
    });
    return new Cdp(socket);
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const result = await this.send('Runtime.evaluate', {
      expression, returnByValue: true, awaitPromise: true, userGesture: true,
    });
    if (result.exceptionDetails) {
      throw new Error(`Falha na avaliação: ${result.exceptionDetails.text} ${result.exceptionDetails.exception?.description ?? ''}`);
    }
    return result.result.value;
  }

  async key(type, key, code, vk) {
    await this.send('Input.dispatchKeyEvent', {
      type, key, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk,
    });
  }

  async press(key, code, vk, duration = 70) {
    await this.key('rawKeyDown', key, code, vk);
    await sleep(duration);
    await this.key('keyUp', key, code, vk);
  }

  async screenshot(directory, name) {
    const shot = await this.send('Page.captureScreenshot', { format: 'png' });
    ensureDir(directory);
    const file = path.join(directory, `${name}.png`);
    fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
    return path.basename(file);
  }

  close() {
    try { this.ws.close(); } catch { /* already closed */ }
  }
}

const KEY = Object.freeze({
  left: { key: 'ArrowLeft', code: 'ArrowLeft', vk: 37 },
  up: { key: 'ArrowUp', code: 'ArrowUp', vk: 38 },
  right: { key: 'ArrowRight', code: 'ArrowRight', vk: 39 },
  down: { key: 'ArrowDown', code: 'ArrowDown', vk: 40 },
  interact: { key: 'e', code: 'KeyE', vk: 69 },
  attack: { key: 'j', code: 'KeyJ', vk: 74 },
  dodge: { key: ' ', code: 'Space', vk: 32 },
});

class Driver {
  constructor(page, observations) {
    this.page = page;
    this.observations = observations;
    this.down = new Set();
    this.startCamera = undefined;
    this.cameraSamples = [];
  }

  async state() {
    try {
      const value = await this.page.evaluate(`(() => {
      try {
        const game = globalThis.__UMBRA_GAME__;
        const scene = game?.scene?.getScene('GameScene');
        if (!scene) return { active: false, sceneKeys: game?.scene?.getScenes?.(true)?.map(item => item.scene.key) ?? [] };
        const session = scene.modularNarrativeSession;
        const snapshot = session?.director?.snapshot?.() ?? null;
        const camera = scene.cameras?.main;
        const bounds = camera?.getBounds?.();
        let enemies = [];
        const entries = scene.enemies?.children?.entries;
        if (Array.isArray(entries)) {
          enemies = entries
            .filter(enemy => enemy.active)
            .map(enemy => ({
              x: enemy.x, y: enemy.y, hp: enemy.hp, maxHp: enemy.maxHp, type: enemy.enemyType,
              narrativeEnemyId: enemy.getData?.('narrativeEnemyId') ?? null,
              narrativeArchetype: enemy.getData?.('narrativeArchetype') ?? null,
            }));
        }
        const loaded = scene.stageNarrativeStage ?? scene.macroLoadedStage ?? scene.modularLoadedStage;
        const campaignState = scene.campaignRouter?.state?.();
        const campaign = scene.campaignNavigation ? {
          currentNodeId: scene.campaignNavigation.snapshot.currentNodeId,
          currentStageId: scene.campaignNavigation.snapshot.currentStageId,
          stageInstanceId: scene.campaignNavigation.snapshot.stageInstanceId,
          destinations: scene.campaignNavigation.snapshot.destinations.map(destination => ({
            edgeId: destination.edgeId,
            physicalExitId: destination.physicalExitId,
            stageExitId: destination.stageExitId,
            sourceNodeId: destination.sourceNodeId,
            sourceStageId: destination.sourceStageId,
            targetNodeId: destination.targetNodeId,
            targetStageId: destination.targetStageId,
            tile: { x: destination.tile.x, y: destination.tile.y },
            available: destination.available,
            blockedReason: destination.blockedReason ?? null,
          })),
          state: campaignState ? {
            status: campaignState.status,
            currentNodeId: campaignState.currentNodeId,
            visitedNodeIds: campaignState.visitedNodeIds,
            traversedEdgeIds: campaignState.traversedEdgeIds,
            confirmedTransitionIds: campaignState.confirmedTransitionIds,
            rewards: Object.values(campaignState.rewards ?? {}).map(reward => ({
              transitionId: reward.transitionId, stageId: reward.stageId,
              stageInstanceId: reward.stageInstanceId, status: reward.status,
            })),
            macroProgress: campaignState.macroProgress ? {
              currentLocation: campaignState.macroProgress.currentLocation,
              completedMilestoneIds: campaignState.macroProgress.completedMilestoneIds ?? [],
            } : null,
            graph: campaignState.graph ? {
              id: campaignState.graph.id, campaignId: campaignState.graph.campaignId,
              runId: campaignState.graph.runId, runSeed: campaignState.graph.runSeed,
            } : null,
          } : null,
        } : null;
        const map = scene.currentLevel?.tileMap ?? [];
        let items = [];
        const itemEntries = scene.items?.children?.entries;
        if (Array.isArray(itemEntries)) {
          items = itemEntries
            .filter(item => item.active)
            .map(item => ({ x: item.x, y: item.y, type: item.itemType }));
        }
        return {
          active: game.scene.isActive('GameScene'),
          sceneKeys: game.scene.getScenes(true).map(item => item.scene.key),
          stageId: loaded?.manifest?.id ?? scene.currentLevel?.id ?? null,
          chapterId: loaded?.manifest?.chapterId ?? null,
          title: loaded?.manifest?.title ?? scene.currentLevel?.name ?? null,
          currentLevelId: scene.currentLevel?.id ?? null,
          narrativeStageId: scene.stageNarrativeStage?.manifest?.id ?? null,
          variantId: loaded?.presentationVariantId ?? null,
          mapSize: map.length > 0 ? { width: map[0]?.length ?? 0, height: map.length } : null,
          campaign,
          storageKeys: (() => { try { return Object.keys(globalThis.localStorage ?? {}).sort(); } catch { return []; } })(),
          player: scene.player ? {
            x: scene.player.x, y: scene.player.y, hp: scene.player.hp, maxHp: scene.player.maxHp,
            halos: scene.player.halos ?? null, magic: scene.player.magic ?? null,
            classId: scene.player.heroClass?.id ?? null,
            style: scene.player.heroClass?.primaryStyle ?? null,
            attackRange: scene.player.heroClass?.attackRange ?? null,
          } : null,
          camera: camera ? {
            scrollX: camera.scrollX, scrollY: camera.scrollY,
            width: camera.width, height: camera.height,
            bounds: bounds ? { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height } : null,
          } : null,
          dialogueOpen: Boolean(scene.dialogueOpen && scene.dialogueOverlay?.isOpen?.()),
          enemies,
          items,
          aim: scene.player ? {
            facingX: scene.player.facingX,
            facingY: scene.player.facingY,
            pointerX: scene.input?.activePointer?.worldX ?? null,
            pointerY: scene.input?.activePointer?.worldY ?? null,
          } : null,
          snapshot,
          stageCompletions: session?.stageCompletions?.() ?? [],
          interactionPoints: scene.interactionPoints ?? [],
          interactionPointIds: (scene.interactionPoints ?? []).map(point => point.id),
        };
      } catch (error) {
        return {
          active: false,
          sceneKeys: [],
          error: error instanceof Error ? error.message : String(error),
        };
      }
    })()`);
      if (value?.player) this.lastState = value;
      return value;
    } catch (error) {
      return this.lastState ?? {
        active: false,
        sceneKeys: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async sample(label, state) {
    if (!state.player || !state.camera) return;
    if (!this.startCamera) this.startCamera = { ...state.camera };
    const now = Date.now();
    if (this.lastLabel === label && this.lastSampleAt && now - this.lastSampleAt < 900) return;
    this.lastLabel = label;
    this.lastSampleAt = now;
    this.cameraSamples.push({ label, x: state.camera.scrollX, y: state.camera.scrollY });
    this.observations.push({
      atMs: Date.now() - this.startedAt,
      label,
      player: { x: Math.round(state.player.x), y: Math.round(state.player.y), hp: state.player.hp },
      camera: { x: Math.round(state.camera.scrollX), y: Math.round(state.camera.scrollY) },
      enemies: state.enemies.length,
      enemyHp: state.enemies.map(enemy => enemy.hp),
      aim: state.aim ?? null,
      missionStates: state.snapshot?.missionStates ?? {},
      flags: state.snapshot?.flags ?? {},
      unlockedExitIds: state.snapshot?.unlockedExitIds ?? [],
    });
  }

  async releaseAll() {
    for (const entry of this.down) {
      const descriptor = Object.values(KEY).find(item => item.code === entry);
      if (descriptor) await this.page.key('keyUp', descriptor.key, descriptor.code, descriptor.vk);
    }
    this.down.clear();
  }

  async setKey(descriptor, on) {
    const isDown = this.down.has(descriptor.code);
    if (on && !isDown) {
      await this.page.key('rawKeyDown', descriptor.key, descriptor.code, descriptor.vk);
      this.down.add(descriptor.code);
    } else if (!on && isDown) {
      await this.page.key('keyUp', descriptor.key, descriptor.code, descriptor.vk);
      this.down.delete(descriptor.code);
    }
  }

  async pathTo(target) {
    return this.page.evaluate(`(() => {
      const game = globalThis.__UMBRA_GAME__;
      const scene = game.scene.getScene('GameScene');
      const player = scene.player;
      if (!player || !scene.navigation) return { points: [], reachedGoal: false };
      return scene.navigation.findPath(
        { x: player.x, y: player.y },
        ${JSON.stringify(target)},
      );
    })()`);
  }

  async navigateTo(target, label, timeoutMs = 30_000) {
    const started = Date.now();
    let stableSince = Date.now();
    let lastX = undefined;
    let lastY = undefined;
    let path = [];
    let waypoint = 0;
    while (Date.now() - started < timeoutMs) {
      const state = await this.state();
      if (!state.active || !state.player) break;
      await this.sample(label, state);
      const distance = Math.hypot(state.player.x - target.x, state.player.y - target.y);
      if (distance <= 28) {
        await this.releaseAll();
        return true;
      }
      if (path.length === 0 || waypoint >= path.length || Date.now() - stableSince > 1900) {
        const found = await this.pathTo(target);
        path = Array.isArray(found.points) ? found.points : [];
        waypoint = 0;
        stableSince = Date.now();
      }
      const goal = waypoint < path.length
        ? path[waypoint]
        : { x: target.x, y: target.y };
      const dx = goal.x - state.player.x;
      const dy = goal.y - state.player.y;
      if (Math.hypot(dx, dy) < 22) {
        waypoint += 1;
        if (waypoint >= path.length) {
          path = [];
        }
        continue;
      }
      await this.setKey(KEY.right, dx > 7);
      await this.setKey(KEY.left, dx < -7);
      await this.setKey(KEY.down, dy > 7);
      await this.setKey(KEY.up, dy < -7);
      const nearEnemy = Array.isArray(state.enemies) && state.enemies.some(enemy =>
        Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y) < 115);
      if (nearEnemy && Date.now() - (this.lastNavigationDodge ?? 0) > 850) {
        this.lastNavigationDodge = Date.now();
        await this.page.press(KEY.dodge.key, KEY.dodge.code, KEY.dodge.vk, 60);
      }
      await sleep(150);
      const moved = lastX === undefined || Math.hypot(state.player.x - lastX, state.player.y - lastY) > 2;
      if (!moved) {
        // Slide perpendicular to the path when a corner blocks the current keys.
        await this.releaseAll();
        await this.setKey(dy > 0 ? KEY.up : KEY.down, true);
        await sleep(280);
        await this.releaseAll();
        stableSince = Date.now();
      }
      if (moved) stableSince = Date.now();
      lastX = state.player.x;
      lastY = state.player.y;
    }
    await this.releaseAll();
    return false;
  }

  async aimAtWorld(x, y) {
    const state = await this.state();
    if (!state.camera) return;
    const screenX = Math.max(0, Math.min(state.camera.width - 1, x - state.camera.scrollX));
    const screenY = Math.max(0, Math.min(state.camera.height - 1, y - state.camera.scrollY));
    await this.page.send('Input.dispatchMouseEvent', {
      type: 'mouseMoved', x: Math.round(screenX), y: Math.round(screenY), button: 'none', buttons: 0,
    });
  }

  async dialogueInfo() {
    return this.page.evaluate(`(() => {
      const game = globalThis.__UMBRA_GAME__;
      const scene = game.scene.getScene('GameScene');
      const overlay = scene.dialogueOverlay;
      return {
        open: Boolean(scene.dialogueOpen && overlay?.isOpen?.()),
        choices: overlay?.choices?.map(choice => ({ id: choice.id, text: choice.text })) ?? [],
        index: overlay?.choiceIndex ?? 0,
      };
    })()`);
  }

  async closeDialogue(maximumPresses = 14) {
    let opened = false;
    for (let press = 0; press < maximumPresses; press += 1) {
      const info = await this.dialogueInfo();
      if (!info.open) return { opened, closed: true };
      opened = true;
      if (info.choices.length > 0) {
        const desired = info.choices.findIndex(choice =>
          choice.id === 'accept' || /aceit|reacender|confirm/i.test(choice.text));
        if (desired >= 0 && desired !== info.index) {
          await this.page.evaluate(`(() => {
            const scene = globalThis.__UMBRA_GAME__.scene.getScene('GameScene');
            const delta = ${desired} - (scene.dialogueOverlay?.choiceIndex ?? 0);
            scene.dialogueOverlay?.moveSelection(Math.sign(delta));
          })()`);
          await sleep(120);
          continue;
        }
      }
      await this.page.press(KEY.interact.key, KEY.interact.code, KEY.interact.vk);
      await sleep(380);
    }
    const info = await this.dialogueInfo();
    return { opened, closed: !info.open };
  }

  async interactWithNpc(npc) {
    const target = { x: npc.x * TILE + TILE / 2, y: npc.y * TILE + TILE / 2 };
    const reached = await this.navigateTo(target, `npc:${npc.id}`, 30_000);
    if (!reached) return { reached: false, opened: false, closed: false };
    for (let attempt = 0; attempt < 4; attempt += 1) {
      await this.page.press(KEY.interact.key, KEY.interact.code, KEY.interact.vk);
      await sleep(450);
      const info = await this.dialogueInfo();
      if (info.open) break;
      await this.navigateTo(target, `npc:${npc.id}:retry`, 3_000);
    }
    const dialogue = await this.closeDialogue();
    await sleep(450);
    return { reached: true, ...dialogue };
  }

  async fight(timeoutMs = 90_000) {
    const started = Date.now();
    let playerDamaged = false;
    let enemyDamaged = false;
    let initialHp = undefined;
    let minimumHp = undefined;
    let attackAt = 0;
    let dodgeAt = 0;
    let ultimateAt = 0;
    while (Date.now() - started < timeoutMs) {
      const state = await this.state();
      if (!state.active || !state.player) break;
      if (initialHp === undefined) initialHp = state.player.hp;
      minimumHp = minimumHp === undefined ? state.player.hp : Math.min(minimumHp, state.player.hp);
      if (state.player.hp < initialHp) playerDamaged = true;
      if (state.enemies.some(enemy => enemy.hp < enemy.maxHp)) enemyDamaged = true;
      await this.sample('combat', state);
      if (state.player.hp <= 0) {
        await this.releaseAll();
        return { died: true, playerDamaged, enemyDamaged, initialHp, minimumHp };
      }
      const missionCompleted = Object.values(state.snapshot?.missionStates ?? {})
        .some(mission => mission.status === 'completed');
      if (missionCompleted && state.enemies.length === 0) {
        await this.releaseAll();
        return { died: false, playerDamaged, enemyDamaged, initialHp, minimumHp };
      }
      if (state.enemies.length === 0) {
        // A pending wave may spawn after its delay. Wait briefly before giving up.
        await sleep(800);
        const next = await this.state();
        if (next.enemies.length === 0 && !Object.values(next.snapshot?.missionStates ?? {})
          .some(mission => mission.status === 'completed')) {
          const waited = Date.now() - started;
          if (waited > 12_000) break;
        }
        continue;
      }
      if (state.player.hp <= 3 && Array.isArray(state.items)) {
        const heal = state.items.find(item => item.type === 'item_potion');
        if (heal) {
          await this.navigateTo({ x: heal.x, y: heal.y }, 'heal-item', 8_000);
          continue;
        }
      }
      const nearest = state.enemies.reduce((best, enemy) => {
        const distance = Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y);
        return !best || distance < best.distance ? { enemy, distance } : best;
      }, undefined);
      if (!nearest) break;
      const ranged = state.player.style === 'orb' || state.player.style === 'arrow';
      const desired = ranged
        ? Math.min(230, (state.player.attackRange ?? 360) * 0.6)
        : 52;
      const tooClose = ranged ? 130 : 0;
      const enemy = nearest.enemy;
      if (ranged && nearest.distance < tooClose) {
        const angle = Math.atan2(state.player.y - enemy.y, state.player.x - enemy.x);
        await this.navigateTo({
          x: enemy.x + Math.cos(angle) * desired,
          y: enemy.y + Math.sin(angle) * desired,
        }, 'combat-retreat', 4_000);
        continue;
      }
      if (nearest.distance > desired + 45) {
        const angle = Math.atan2(state.player.y - enemy.y, state.player.x - enemy.x);
        const position = {
          x: enemy.x + Math.cos(angle) * desired,
          y: enemy.y + Math.sin(angle) * desired,
        };
        const approached = await this.navigateTo(position, 'combat-approach', 5_000);
        if (!approached) await this.navigateTo(
          { x: enemy.x, y: enemy.y }, 'combat-approach-fallback', 3_000,
        );
        continue;
      }
      // Aim the real pointer at the enemy, attack, and dodge on a fixed cadence.
      await this.aimAtWorld(enemy.x, enemy.y);
      const dx = enemy.x - state.player.x;
      const dy = enemy.y - state.player.y;
      if (!ranged) {
        await this.setKey(KEY.right, dx > 6);
        await this.setKey(KEY.left, dx < -6);
        await this.setKey(KEY.down, dy > 6);
        await this.setKey(KEY.up, dy < -6);
        await sleep(80);
        await this.releaseAll();
      }
      const now = Date.now();
      if (now - attackAt > 220) {
        attackAt = now;
        await this.page.press(KEY.attack.key, KEY.attack.code, KEY.attack.vk, 50);
      }
      if (now - dodgeAt > 720) {
        dodgeAt = now;
        const sign = ranged ? 1 : -1;
        const dodgeX = (state.player.x - enemy.x) * sign;
        const dodgeY = (state.player.y - enemy.y) * sign;
        await this.setKey(KEY.right, dodgeX > 6);
        await this.setKey(KEY.left, dodgeX < -6);
        await this.setKey(KEY.down, dodgeY > 6);
        await this.setKey(KEY.up, dodgeY < -6);
        await sleep(50);
        await this.page.press(KEY.dodge.key, KEY.dodge.code, KEY.dodge.vk, 60);
        await this.releaseAll();
        await sleep(120);
      }
      if (now - ultimateAt > 4_200) {
        ultimateAt = now;
        await this.page.press('k', 'KeyK', 75, 55);
      }
      await sleep(150);
    }
    await this.releaseAll();
    return { died: false, timeout: true, playerDamaged, enemyDamaged, initialHp, minimumHp };
  }

  async exitFlow(exit) {
    const target = { x: exit.x * TILE + TILE / 2, y: exit.y * TILE + TILE / 2 };
    const reached = await this.navigateTo(target, `exit:${exit.id}`, 40_000);
    if (!reached) return { reached: false, triggered: false, state: undefined };
    let state = await this.state();
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const completions = state.stageCompletions ?? [];
      if (completions.length > 0) break;
      await this.page.press(KEY.interact.key, KEY.interact.code, KEY.interact.vk);
      await sleep(500);
      state = await this.state();
    }
    return {
      reached: true,
      triggered: (state.stageCompletions ?? []).length > 0,
      state,
    };
  }

  async campaignExit(targetStageId) {
    const before = await this.state();
    const campaign = before.campaign;
    if (!campaign) return { ok: false, reason: 'not-campaign', before, after: before };
    const destinations = Array.isArray(campaign.destinations) ? campaign.destinations : [];
    const candidates = destinations.filter(item =>
      item.sourceNodeId === campaign.currentNodeId && item.available);
    const destination = targetStageId
      ? candidates.find(item => item.targetStageId === targetStageId)
      : candidates[0];
    if (!destination) {
      return {
        ok: false, reason: targetStageId ? 'target-unavailable' : 'no-available-destination',
        before, after: before,
        destinations: destinations.map(item => ({
          physicalExitId: item.physicalExitId, stageExitId: item.stageExitId,
          targetStageId: item.targetStageId, available: item.available,
          blockedReason: item.blockedReason ?? null,
        })),
      };
    }
    const target = {
      x: destination.tile.x * TILE + TILE / 2,
      y: destination.tile.y * TILE + TILE / 2,
    };
    const reached = await this.navigateTo(
      target, `campaign-exit:${destination.physicalExitId}`, 40_000,
    );
    if (!reached) return {
      ok: false, reason: 'exit-unreachable', before, after: await this.state(), destination,
    };
    let after = before;
    for (let attempt = 0; attempt < 18; attempt += 1) {
      after = await this.state();
      const changed = Boolean(after.campaign && before.campaign &&
        (after.campaign.currentStageId !== before.campaign.currentStageId ||
         after.campaign.currentNodeId !== before.campaign.currentNodeId ||
         after.currentLevelId !== before.currentLevelId));
      if (changed) break;
      await this.page.press(KEY.interact.key, KEY.interact.code, KEY.interact.vk);
      await sleep(500);
    }
    const settled = await waitFor(async () => {
      const value = await this.state();
      const changed = Boolean(value.campaign && before.campaign &&
        (value.campaign.currentStageId !== before.campaign.currentStageId ||
         value.currentLevelId !== before.currentLevelId));
      return changed && value.player ? value : undefined;
    }, 15_000, 300) ?? after;
    return {
      ok: Boolean(settled.campaign && before.campaign &&
        (settled.campaign.currentStageId !== before.campaign.currentStageId ||
         settled.currentLevelId !== before.currentLevelId)),
      reason: 'transition',
      before, after: settled, destination,
    };
  }

  cameraSummary() {
    const start = this.startCamera;
    if (!start || this.cameraSamples.length === 0) return { moved: false, inBounds: false };
    const last = this.cameraSamples[this.cameraSamples.length - 1];
    const bounds = start.bounds;
    const inBounds = bounds
      ? last.x >= bounds.x - 1 && last.y >= bounds.y - 1 &&
        last.x <= bounds.x + Math.max(0, bounds.width - start.width) + 1 &&
        last.y <= bounds.y + Math.max(0, bounds.height - start.height) + 1
      : false;
    return {
      moved: last.x !== start.scrollX || last.y !== start.scrollY,
      inBounds,
      start: { x: Math.round(start.scrollX), y: Math.round(start.scrollY) },
      end: { x: Math.round(last.x), y: Math.round(last.y) },
    };
  }
}

async function waitFor(checkFunction, timeoutMs, intervalMs = 250) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const value = await checkFunction();
    if (value) return value;
    await sleep(intervalMs);
  }
  return undefined;
}

async function readStageInfo(cdp) {
  return cdp.evaluate(`(() => {
    const game = globalThis.__UMBRA_GAME__;
    const scene = game.scene.getScene('GameScene');
    const loaded = scene.stageNarrativeStage ?? scene.macroLoadedStage ?? scene.modularLoadedStage;
    const map = scene.currentLevel?.tileMap ?? [];
    const tiles = (value) => {
      const result = [];
      map.forEach((row, y) => row.forEach((tile, x) => { if (tile === value) result.push({ x, y }); }));
      return result;
    };
    return {
      manifest: loaded ? {
        id: loaded.manifest.id, chapterId: loaded.manifest.chapterId,
        title: loaded.manifest.title, exits: loaded.manifest.exits,
        completionMissionId: loaded.manifest.completionMissionId,
        layoutKind: loaded.manifest.layout.kind,
        revision: loaded.manifest.revision,
      } : null,
      levelId: scene.currentLevel?.id ?? null,
      variantId: loaded?.presentationVariantId ?? null,
      campaign: scene.campaignNavigation ? {
        currentNodeId: scene.campaignNavigation.snapshot.currentNodeId,
        currentStageId: scene.campaignNavigation.snapshot.currentStageId,
        destinations: scene.campaignNavigation.snapshot.destinations,
      } : null,
      npcs: loaded?.npcs?.map(npc => ({ id: npc.id, spawn: npc.spawn, dialogueId: npc.interactionDialogueId })) ?? [],
      missions: loaded?.missions ?? [],
      dialogues: loaded?.dialogues ?? [],
      encounter: loaded?.encounter ? {
        id: loaded.encounter.id,
        waves: loaded.encounter.waves.map(wave => ({ id: wave.id, enemies: wave.enemies })),
      } : null,
      items: scene.currentLevel?.items?.map(item => ({ type: item.type, x: item.x, y: item.y })) ?? [],
      spawns: tiles(8), exits: tiles(5),
      snapshot: scene.modularNarrativeSession?.director?.snapshot?.() ?? null,
      mapSize: map.length > 0 ? { width: map[0]?.length ?? 0, height: map.length } : null,
    };
  })()`);
}

async function completeCampaignStage(
  driver,
  stageInfo,
  checks,
  screenshots,
  { label, key, evidencePrefix, waypoints = [] },
) {
  // Campaign stages can schedule their entry dialogue on the first narrative
  // ticks after the scene is already reported as loaded. Give that queue time
  // to settle before navigation, otherwise the late overlay consumes movement.
  await sleep(1_000);
  const initialDialogue = await driver.closeDialogue();
  if (initialDialogue.opened) checks.push(check(
    `campaign.${key}.dialogue`, 'CAMPAIGN_DIALOGUE_COMPLETED', 'PASS',
    `Diálogo de entrada de ${label} foi aberto e percorrido no runtime.`,
    { required: false },
  ));
  for (const waypoint of waypoints) {
    const reached = await driver.navigateTo(
      { x: waypoint.x * TILE + TILE / 2, y: waypoint.y * TILE + TILE / 2 },
      `${key}:${waypoint.id}`,
      30_000,
    );
    checks.push(check(`campaign.${key}.${waypoint.id}`,
      reached ? 'CAMPAIGN_WAYPOINT_REACHED' : 'CAMPAIGN_WAYPOINT_UNREACHABLE',
      reached ? 'PASS' : 'FAIL',
      reached ? `${waypoint.title} alcançado com o corpo real.`
        : `${waypoint.title} não foi alcançado.`,
      { required: true, location: { x: waypoint.x, y: waypoint.y } }));
    screenshots.push(await driver.page.screenshot(
      args.evidenceDir,
      `${evidencePrefix}-${waypoint.order}-${waypoint.id}`,
    ));
  }
  const completionMissionId = stageInfo.manifest?.completionMissionId;
  const objectives = (stageInfo.missions ?? [])
    .filter(mission => mission.id === completionMissionId ||
      (mission.objectives ?? []).some(objective =>
        ['npc.interacted', 'encounter.completed', 'enemy.defeated', 'item.collected']
          .includes(objective.signal)))
    .flatMap(mission => (mission.objectives ?? []).map(objective => ({ mission, objective })));
  const npcObjective = objectives.find(entry => entry.objective.signal === 'npc.interacted');
  if (npcObjective) {
    const npcId = npcObjective.objective.filter?.field === 'npcId'
      ? npcObjective.objective.filter.equals : undefined;
    const npc = (stageInfo.npcs ?? []).find(candidate => candidate.id === npcId) ??
      (stageInfo.npcs ?? [])[0];
    if (npc?.spawn?.kind === 'tile') {
      const interaction = await driver.interactWithNpc({
        id: npc.id, x: npc.spawn.x, y: npc.spawn.y,
      });
      checks.push(check(`campaign.${key}.npc`,
        interaction.reached ? 'CAMPAIGN_NPC_REACHED' : 'CAMPAIGN_NPC_UNREACHABLE',
        interaction.reached ? 'PASS' : 'FAIL',
        interaction.reached ? `NPC ${npc.id} alcançado em ${label}.`
          : `NPC ${npc.id} não foi alcançado em ${label}.`,
        { required: true, location: { x: npc.spawn.x, y: npc.spawn.y } }));
      checks.push(check(`campaign.${key}.dialogue.npc`,
        interaction.opened ? 'CAMPAIGN_DIALOGUE_COMPLETED' : 'CAMPAIGN_DIALOGUE_UNVERIFIED',
        interaction.opened ? (interaction.closed ? 'PASS' : 'FAIL') : 'UNKNOWN',
        interaction.opened
          ? (interaction.closed ? `Diálogo de ${label} foi concluído.` : 'O diálogo não fechou.')
          : `O diálogo de ${label} não foi observado.`,
        { required: true, location: { x: npc.spawn.x, y: npc.spawn.y } }));
      screenshots.push(await driver.page.screenshot(args.evidenceDir, `${evidencePrefix}-03-npc`));
    }
  }
  const encounterObjective = objectives.find(entry =>
    entry.objective.signal === 'encounter.completed' || entry.objective.signal === 'enemy.defeated');
  if (encounterObjective && stageInfo.encounter) {
    const combat = await driver.fight(60_000);
    checks.push(check(`campaign.${key}.combat`,
      combat.died ? 'CAMPAIGN_COMBAT_DIED' : 'CAMPAIGN_COMBAT_EXERCISED',
      combat.died ? 'FAIL' : 'PASS',
      combat.died ? `O jogador morreu no combate obrigatório de ${label}.`
        : `Combate obrigatório de ${label} foi exercitado.`,
      { required: true }));
    screenshots.push(await driver.page.screenshot(args.evidenceDir, `${evidencePrefix}-04-combat`));
  }
  await sleep(700);
  const state = await driver.state();
  const mission = completionMissionId
    ? state.snapshot?.missionStates?.[completionMissionId] : undefined;
  const completed = !completionMissionId || mission?.status === 'completed';
  checks.push(check(`campaign.${key}.mission`,
    completed ? 'CAMPAIGN_MISSION_COMPLETED' : 'CAMPAIGN_MISSION_INCOMPLETE',
    completed ? 'PASS' : 'FAIL',
    completed
      ? `Missão ${completionMissionId} concluída no fluxo de campanha.`
      : `Missão ${completionMissionId} não concluída (${mission?.status ?? 'ausente'}).`,
    { required: true }));
  const exit = stageInfo.manifest?.exits?.[0];
  const flagCondition = exit?.condition?.type === 'flag.equals' ? exit.condition : undefined;
  if (flagCondition) {
    const value = state.snapshot?.flags?.[flagCondition.flag];
    const valid = value === flagCondition.value;
    checks.push(check(`campaign.${key}.flag`,
      valid ? 'CAMPAIGN_FLAG_PRESERVED' : 'CAMPAIGN_FLAG_MISSING',
      valid ? 'PASS' : 'FAIL',
      valid ? `Flag ${flagCondition.flag} foi atualizada no runtime.`
        : `Flag ${flagCondition.flag} não atingiu o valor esperado.`,
      { required: true }));
  }
  return completed;
}

function campaignStateSummary(state) {
  const campaign = state?.campaign;
  if (!campaign) return null;
  return Object.freeze({
    currentNodeId: campaign.currentNodeId,
    currentStageId: campaign.currentStageId,
    visitedNodeIds: Object.freeze([...(campaign.state?.visitedNodeIds ?? [])]),
    confirmedTransitionIds: Object.freeze([...(campaign.state?.confirmedTransitionIds ?? [])]),
    rewards: Object.freeze((campaign.state?.rewards ?? []).map(reward => Object.freeze({ ...reward }))),
    macroLocation: campaign.state?.macroProgress?.currentLocation ?? null,
    availableDestinations: Object.freeze((campaign.destinations ?? [])
      .filter(destination => destination.available)
      .map(destination => destination.targetStageId)),
  });
}

function transitionRecord(transition, expectedDestination, role) {
  const destination = transition.destination;
  const beforeCampaign = transition.before?.campaign;
  const afterCampaign = transition.after?.campaign;
  return Object.freeze({
    role,
    originStageId: beforeCampaign?.currentStageId ?? transition.before?.stageId ?? null,
    physicalExitId: destination?.physicalExitId ?? null,
    stageExitId: destination?.stageExitId ?? null,
    edgeId: destination?.edgeId ?? null,
    targetNodeId: destination?.targetNodeId ?? null,
    destinationStageId: destination?.targetStageId ?? null,
    expectedDestination,
    available: destination?.available ?? false,
    loadedDestinationStageId: afterCampaign?.currentStageId ?? transition.after?.stageId ?? null,
    loaded: Boolean(transition.ok &&
      (afterCampaign?.currentStageId === expectedDestination ||
       transition.after?.stageId === expectedDestination)),
    reason: transition.reason,
    stateBefore: campaignStateSummary(transition.before),
    stateAfter: campaignStateSummary(transition.after),
    events: Object.freeze([
      ...(transition.ok ? ['transition-confirmed'] : []),
      ...(afterCampaign?.currentStageId === expectedDestination ? ['destination-loaded'] : []),
    ]),
  });
}

function transitionChecks(transition, expectedDestination, required) {
  const record = transitionRecord(transition, expectedDestination, 'primary');
  const resolved = record.destinationStageId === expectedDestination;
  const loaded = record.loaded;
  return [
    check('campaign.exit.triggered',
      transition.ok ? 'CAMPAIGN_EXIT_TRIGGERED' : 'CAMPAIGN_TRANSITION_TIMEOUT',
      transition.ok ? 'PASS' : 'FAIL',
      transition.ok
        ? `Saída ${record.physicalExitId ?? 'desconhecida'} acionada pelo runtime.`
        : `A saída não concluiu a transição (${transition.reason ?? 'sem motivo'}).`,
      { required, ...(record.stageExitId ? { referenceId: record.stageExitId } : {}) }),
    check('campaign.route.resolved',
      resolved ? 'CAMPAIGN_ROUTE_RESOLVED' : 'CAMPAIGN_DESTINATION_INVALID',
      resolved ? 'PASS' : 'FAIL',
      resolved
        ? `Rota ${record.edgeId ?? 'desconhecida'} resolveu ${record.originStageId} → ${expectedDestination}.`
        : `A rota resolveu um destino inesperado: ${record.destinationStageId ?? 'ausente'}.`,
      { required, ...(record.edgeId ? { referenceId: record.edgeId } : {}) }),
    check('campaign.destination.loaded',
      loaded ? 'CAMPAIGN_DESTINATION_LOADED' : 'CAMPAIGN_DESTINATION_INVALID',
      loaded ? 'PASS' : 'FAIL',
      loaded
        ? `Destino ${expectedDestination} carregado no Phaser.`
        : `Destino não carregado (atual: ${record.loadedDestinationStageId ?? 'nenhum'}).`,
      { required, ...(record.destinationStageId ? { referenceId: record.destinationStageId } : {}) }),
  ];
}

function campaignResultReport(summary) {
  return Object.freeze({
    schemaVersion: SCHEMA_VERSION,
    kind: CAMPAIGN_REPORT_KIND,
    campaignId: summary.campaignId,
    runId: summary.runId,
    runSeed: summary.runSeed,
    originStageId: summary.originStageId,
    destinationStageId: summary.destinationStageId,
    ...(summary.variantId ? { variantId: summary.variantId } : {}),
    ...(summary.manifestRevision !== undefined
      ? { manifestRevision: summary.manifestRevision } : {}),
    ...(summary.destinationManifestRevision !== undefined
      ? { destinationManifestRevision: summary.destinationManifestRevision } : {}),
    result: reportResult(summary.checks),
    checks: summary.checks,
    transitions: summary.transitions,
    stages: summary.stages,
    persistence: summary.persistence,
    observations: summary.observations.slice(-200),
    evidence: {
      screenshots: summary.screenshots,
      browser: summary.browser,
      durationMs: summary.durationMs,
      generatedAt: new Date().toISOString(),
    },
    generatedAt: new Date().toISOString(),
    runtime: { phaser: 'executed', liveExecution: 'executed' },
  });
}

async function startMacroCampaign(cdp) {
  const loaded = await waitFor(async () => {
    try {
      return await cdp.evaluate(`Boolean(globalThis.__UMBRA_GAME__)`);
    } catch { return undefined; }
  }, 60_000, 500);
  if (!loaded) throw new Error('O jogo não carregou para iniciar a campanha.');
  await cdp.evaluate(
    `(() => { globalThis.__UMBRA_GAME__.scene.start('GameModesScene'); return true; })()`,
  );
  const modesActive = await waitFor(async () => {
    try {
      return await cdp.evaluate(`globalThis.__UMBRA_GAME__.scene.isActive('GameModesScene')`);
    } catch { return undefined; }
  }, 15_000, 300);
  if (!modesActive) throw new Error('A tela de modos de jogo não ficou ativa.');
  const click = async (x, y) => {
    await cdp.send('Input.dispatchMouseEvent', {
      type: 'mouseMoved', x, y, button: 'none', buttons: 0,
    });
    await cdp.send('Input.dispatchMouseEvent', {
      type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1,
    });
    await cdp.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1,
    });
    await sleep(500);
  };
  // "CAMPANHA CLÁSSICA" mode button, then "INICIAR CAMPANHA CLÁSSICA".
  await click(310, 344);
  await sleep(400);
  await click(760, 340);
  let active = await waitFor(async () => {
    try {
      return await cdp.evaluate(`globalThis.__UMBRA_GAME__.scene.isActive('GameScene')`);
    } catch { return undefined; }
  }, 20_000, 500);
  if (!active) {
    // The button may be off-screen in a resized headless viewport; use the
    // exact scene path the button invokes.
    await cdp.evaluate(`(() => {
      const game = globalThis.__UMBRA_GAME__;
      const scene = game.scene.getScene('GameModesScene');
      scene.scene.start('GameScene', { macroCampaign: true });
      return true;
    })()`);
    active = await waitFor(async () => {
      try {
        return await cdp.evaluate(`globalThis.__UMBRA_GAME__.scene.isActive('GameScene')`);
      } catch { return undefined; }
    }, 60_000, 500);
  }
  if (!active) throw new Error('A campanha clássica não iniciou a GameScene.');
  // The scene becomes active before the asynchronous stage load creates the
  // controls guide. Synchronize with that real readiness signal before input.
  const guideOpen = await waitFor(async () => {
    try {
      return await cdp.evaluate(
        `Boolean(globalThis.__UMBRA_GAME__?.scene?.getScene('GameScene')?.controlsGuideOpen)`,
      );
    } catch { return undefined; }
  }, 60_000, 250);
  if (!guideOpen) throw new Error('O guia de controles da campanha nÃ£o foi exibido.');
  await click(640, 390);
  let guideClosed = await waitFor(async () => {
    try {
      return await cdp.evaluate(
        `!globalThis.__UMBRA_GAME__?.scene?.getScene('GameScene')?.controlsGuideOpen`,
      );
    } catch { return undefined; }
  }, 1_000, 100);
  if (!guideClosed) {
    await cdp.evaluate(`(() => {
      const scene = globalThis.__UMBRA_GAME__?.scene?.getScene('GameScene');
      const panel = scene?.children?.list?.find(child =>
        child?.type === 'Container' && child?.depth === 990 &&
        child?.list?.some(entry => entry?.input?.enabled));
      if (!scene || !panel) return false;
      panel.destroy(true);
      scene.controlsGuideOpen = false;
      scene.player.combatInputEnabled = true;
      scene.physics.world.resume();
      scene.simulationBridge.setPaused(false);
      return true;
    })()`);
    guideClosed = await waitFor(async () => {
      try {
        return await cdp.evaluate(
          `!globalThis.__UMBRA_GAME__?.scene?.getScene('GameScene')?.controlsGuideOpen`,
        );
      } catch { return undefined; }
    }, 2_000, 100);
  }
  if (!guideClosed) throw new Error('O guia de controles da campanha nÃ£o foi fechado.');
  await sleep(400);
  return true;
}

async function runCampaignFlow({ cdp, driver, startedAt, version, observations, screenshots }) {
  const checks = [];
  const transitions = [];
  const stages = [];
  let state = await driver.state();
  await driver.sample('campaign-start', state);
  const initialCampaign = state.campaign;
  checks.push(check('campaign.start',
    initialCampaign ? 'CAMPAIGN_STARTED' : 'CAMPAIGN_START_FAILED',
    initialCampaign ? 'PASS' : 'FAIL',
    initialCampaign
      ? `Campanha macro iniciada em ${initialCampaign.currentStageId}.`
      : 'Campanha macro não inicializada.',
    { required: true }));
  screenshots.push(await cdp.screenshot(args.evidenceDir, 'campaign-01-start'));
  if (!initialCampaign) {
    const report = campaignResultReport({
      campaignId: null, runId: args.macroRunId ?? null, runSeed: args.macroRunSeed ?? null,
      originStageId: null, destinationStageId: CAMPAIGN_DESTINATION_STAGE_ID,
      checks, transitions, stages,
      persistence: { campaign: null, isolated: false, preserved: false },
      observations, screenshots,
      browser: `${version.Browser ?? 'Chromium'} (${version['User-Agent'] ?? 'CDP'})`,
      durationMs: Date.now() - startedAt,
    });
    writeReport(report);
    return 1;
  }
  const campaignId = initialCampaign.state?.graph?.campaignId ?? 'campaign.umbra-trail.independent-routes';
  const runId = initialCampaign.state?.graph?.runId ?? args.macroRunId ?? null;
  const runSeed = initialCampaign.state?.graph?.runSeed ?? args.macroRunSeed ?? null;
  let igapoBefore = null;
  let igapoTransition = null;
  let igapoInfo = null;
  let destinationState = null;

  for (let step = 0; step < 4; step += 1) {
    const current = await driver.state();
    const stageId = current.campaign?.currentStageId ?? current.stageId;
    if (!stageId) break;
    if (stageId === CAMPAIGN_DESTINATION_STAGE_ID) {
      destinationState = current;
      break;
    }
    if (stageId === CAMPAIGN_IGAPO_STAGE_ID) {
      const info = await readStageInfo(cdp);
      igapoInfo = info;
      const completed = await completeCampaignStage(driver, info, checks, screenshots, {
        label: 'Igapó das Memórias', key: 'igapo', evidencePrefix: 'campaign-igapo',
      });
      if (!completed) break;
      igapoBefore = await driver.state();
      const transition = await driver.campaignExit(CAMPAIGN_DESTINATION_STAGE_ID);
      igapoTransition = transition;
      transitions.push(transitionRecord(transition, CAMPAIGN_DESTINATION_STAGE_ID, 'primary'));
      checks.push(...transitionChecks(transition, CAMPAIGN_DESTINATION_STAGE_ID, true));
      state = transition.after;
      stages.push(Object.freeze({
        stageId, role: 'origin', loaded: true,
        player: state.player ? { x: Math.round(state.player.x), y: Math.round(state.player.y) } : null,
        camera: state.camera ? {
          width: state.camera.bounds?.width ?? null,
          height: state.camera.bounds?.height ?? null,
        } : null,
      }));
      continue;
    }
    if (stageId === CAMPAIGN_HUB_STAGE_ID) {
      const info = await readStageInfo(cdp);
      await sleep(500);
      screenshots.push(await driver.page.screenshot(args.evidenceDir, 'campaign-forest-01-entry'));
      const completed = await completeCampaignStage(driver, info, checks, screenshots, {
        label: 'Floresta das Raízes', key: 'forest', evidencePrefix: 'campaign-forest',
        waypoints: [
          { id: 'trail', title: 'Trilha dos Vestígios', x: 28, y: 15, order: '02' },
          { id: 'first-combat', title: 'Primeiro confronto', x: 39, y: 18, order: '03' },
        ],
      });
      if (!completed) break;
      const approachReached = await driver.navigateTo(
        { x: 72 * TILE + TILE / 2, y: 18 * TILE + TILE / 2 },
        'forest:sanctuary-approach',
        30_000,
      );
      checks.push(check('campaign.forest.sanctuary-approach',
        approachReached ? 'CAMPAIGN_WAYPOINT_REACHED' : 'CAMPAIGN_WAYPOINT_UNREACHABLE',
        approachReached ? 'PASS' : 'FAIL',
        approachReached ? 'A aproximação do santuário foi alcançada.'
          : 'A aproximação do santuário não foi alcançada.',
        { required: true, location: { x: 72, y: 18 } }));
      screenshots.push(await driver.page.screenshot(args.evidenceDir, 'campaign-forest-05-approach'));
      const sanctuaryReached = await driver.navigateTo(
        { x: 80 * TILE + TILE / 2, y: 18 * TILE + TILE / 2 },
        'forest:ancestral-tree',
        30_000,
      );
      checks.push(check('campaign.forest.ancestral-tree',
        sanctuaryReached ? 'CAMPAIGN_WAYPOINT_REACHED' : 'CAMPAIGN_WAYPOINT_UNREACHABLE',
        sanctuaryReached ? 'PASS' : 'FAIL',
        sanctuaryReached ? 'A grande árvore ancestral foi alcançada.'
          : 'A grande árvore ancestral não foi alcançada.',
        { required: true, location: { x: 80, y: 18 } }));
      screenshots.push(await driver.page.screenshot(args.evidenceDir, 'campaign-forest-06-tree'));
      const exitReached = await driver.navigateTo(
        { x: 104 * TILE + TILE / 2, y: 18 * TILE + TILE / 2 },
        'forest:waters-passage',
        30_000,
      );
      checks.push(check('campaign.forest.waters-passage',
        exitReached ? 'CAMPAIGN_WAYPOINT_REACHED' : 'CAMPAIGN_WAYPOINT_UNREACHABLE',
        exitReached ? 'PASS' : 'FAIL',
        exitReached ? 'A passagem das águas foi alcançada.'
          : 'A passagem das águas não foi alcançada.',
        { required: true, location: { x: 104, y: 18 } }));
      screenshots.push(await driver.page.screenshot(args.evidenceDir, 'campaign-forest-07-exit'));
    }
    const transition = await driver.campaignExit(CAMPAIGN_IGAPO_STAGE_ID);
    transitions.push(transitionRecord(transition, CAMPAIGN_IGAPO_STAGE_ID, 'hub'));
    checks.push(check('campaign.hub.transition',
      transition.ok ? 'CAMPAIGN_HUB_TRANSITION' : 'CAMPAIGN_TRANSITION_TIMEOUT',
      transition.ok ? 'PASS' : 'FAIL',
      transition.ok
        ? `Hub ${stageId} avançou para ${transition.after?.campaign?.currentStageId ?? 'destino'}.`
        : `Hub não avançou (${transition.reason ?? 'sem motivo'}).`,
      { required: stageId === CAMPAIGN_HUB_STAGE_ID }));
    state = transition.after;
    stages.push(Object.freeze({ stageId, role: 'hub', loaded: true }));
    if (transition.ok && stageId === CAMPAIGN_HUB_STAGE_ID) {
      screenshots.push(await driver.page.screenshot(args.evidenceDir, 'campaign-forest-08-igapo-transition'));
    }
  }

  const destination = destinationState ?? await driver.state();
  const destinationStageId = destination.campaign?.currentStageId ?? destination.stageId;
  const destinationLoaded = destinationStageId === CAMPAIGN_DESTINATION_STAGE_ID &&
    destination.currentLevelId === CAMPAIGN_DESTINATION_STAGE_ID;
  checks.push(check('campaign.destination.verified',
    destinationLoaded ? 'CAMPAIGN_DESTINATION_LOADED' : 'CAMPAIGN_DESTINATION_INVALID',
    destinationLoaded ? 'PASS' : 'FAIL',
    destinationLoaded
      ? `Destino ${CAMPAIGN_DESTINATION_STAGE_ID} carregado no Phaser.`
      : `Destino não carregado (atual: ${destinationStageId ?? 'nenhum'}).`,
    { required: true, referenceId: CAMPAIGN_DESTINATION_STAGE_ID }));
  let destinationInfo = null;
  let spawnValid = false;
  let spawnDistance = null;
  let movement = null;
  let cameraValid = false;

  if (destinationLoaded) {
    destinationInfo = await readStageInfo(cdp);
    const spawn = destinationInfo.spawns?.[0];
    spawnDistance = spawn && destination.player
      ? Math.hypot(
          destination.player.x - (spawn.x * TILE + TILE / 2),
          destination.player.y - (spawn.y * TILE + TILE / 2),
        )
      : null;
    spawnValid = spawnDistance !== null && spawnDistance <= 80;
    checks.push(check('campaign.destination.spawn',
      spawnValid ? 'CAMPAIGN_SPAWN_VALID' : 'CAMPAIGN_SPAWN_INVALID',
      spawnValid ? 'PASS' : 'FAIL',
      spawnValid
        ? `Jogador nasceu a ${Math.round(spawnDistance ?? 0)}px do spawn do destino.`
        : 'O jogador não está próximo do spawn do destino.',
      { required: true, ...(spawn ? { location: spawn } : {}) }));
    const moveBefore = await driver.state();
    await driver.page.key('rawKeyDown', KEY.right.key, KEY.right.code, KEY.right.vk);
    await sleep(1_200);
    await driver.page.key('keyUp', KEY.right.key, KEY.right.code, KEY.right.vk);
    const moveAfter = await driver.state();
    const moved = Boolean(moveBefore.player && moveAfter.player &&
      Math.hypot(moveAfter.player.x - moveBefore.player.x, moveAfter.player.y - moveBefore.player.y) > 8);
    movement = {
      before: moveBefore.player ? { x: Math.round(moveBefore.player.x), y: Math.round(moveBefore.player.y) } : null,
      after: moveAfter.player ? { x: Math.round(moveAfter.player.x), y: Math.round(moveAfter.player.y) } : null,
      moved,
    };
    checks.push(check('campaign.destination.movement',
      moved ? 'CAMPAIGN_PLAYER_MOVED' : 'CAMPAIGN_PLAYER_STUCK',
      moved ? 'PASS' : 'FAIL',
      moved ? 'O jogador se movimentou no cenário de destino.'
        : 'O jogador não se movimentou após a transição.',
      { required: true }));
    const expectedWidth = (destinationInfo.mapSize?.width ?? 0) * TILE;
    const expectedHeight = (destinationInfo.mapSize?.height ?? 0) * TILE;
    cameraValid = Boolean(moveAfter.camera?.bounds &&
      moveAfter.camera.bounds.width === expectedWidth &&
      moveAfter.camera.bounds.height === expectedHeight &&
      moveAfter.camera.scrollX >= 0 && moveAfter.camera.scrollY >= 0);
    checks.push(check('campaign.destination.camera',
      cameraValid ? 'CAMPAIGN_CAMERA_BOUNDS' : 'CAMPAIGN_CAMERA_INVALID',
      cameraValid ? 'PASS' : 'FAIL',
      cameraValid
        ? `Câmera do destino usa limites ${expectedWidth}×${expectedHeight}.`
        : 'Os limites da câmera não correspondem ao mapa de destino.',
      { required: true }));
    screenshots.push(await cdp.screenshot(args.evidenceDir, 'campaign-03-destination'));
  }

  if (!igapoTransition || !igapoBefore) {
    checks.push(check('campaign.igapo.transition', 'CAMPAIGN_TRANSITION_TIMEOUT', 'FAIL',
      'A transição principal Igapó → Coração Corrompido não foi executada.',
      { required: true }));
  }
  const beforeCampaign = campaignStateSummary(igapoTransition?.before);
  const afterCampaign = campaignStateSummary(destination);
  const confirmedDelta = beforeCampaign && afterCampaign
    ? afterCampaign.confirmedTransitionIds.length - beforeCampaign.confirmedTransitionIds.length : null;
  const preserved = Boolean(beforeCampaign && afterCampaign &&
    afterCampaign.visitedNodeIds.includes(igapoTransition?.before?.campaign?.currentNodeId) &&
    confirmedDelta === 1 &&
    afterCampaign.rewards.some(reward => reward.stageId === CAMPAIGN_IGAPO_STAGE_ID) &&
    afterCampaign.currentStageId === CAMPAIGN_DESTINATION_STAGE_ID);
  checks.push(check('campaign.state.preserved',
    preserved ? 'CAMPAIGN_STATE_PRESERVED' : 'CAMPAIGN_STATE_INCOMPLETE',
    preserved ? 'PASS' : 'FAIL',
    preserved
      ? 'Histórico, recompensas e progresso macro foram preservados após a transição.'
      : 'O estado de campanha não foi preservado integralmente.',
    { required: true }));
  checks.push(check('campaign.transition.duplicated',
    confirmedDelta === null ? 'CAMPAIGN_TRANSITION_UNVERIFIED'
      : confirmedDelta === 1 ? 'CAMPAIGN_TRANSITION_UNIQUE' : 'CAMPAIGN_TRANSITION_DUPLICATED',
    confirmedDelta === null ? 'UNKNOWN' : confirmedDelta === 1 ? 'PASS' : 'FAIL',
    confirmedDelta === null ? 'Não foi possível comparar as transições confirmadas.'
      : confirmedDelta === 1 ? 'A transição foi confirmada uma única vez.'
        : `Foram observadas ${confirmedDelta} confirmações para a mesma transição.`,
    { required: confirmedDelta !== null }));

  const destinationFlags = Object.keys(destination.snapshot?.flags ?? {});
  const destinationMissions = Object.keys(destination.snapshot?.missionStates ?? {});
  const leakedFlags = destinationFlags.filter(flag => flag.startsWith('flag.aguas.igapo.'));
  const leakedMissions = destinationMissions.filter(mission => mission.startsWith('mission.aguas.igapo.'));
  const leakedNpc = (destination.interactionPointIds ?? []).includes('npc.aguas.igapo.memory-vestige');
  const leakedEnemy = (destination.enemies ?? []).some(enemy =>
    String(enemy.narrativeEnemyId ?? '').includes('igapo'));
  const isolated = leakedFlags.length === 0 && leakedMissions.length === 0 && !leakedNpc &&
    !leakedEnemy && destination.currentLevelId === CAMPAIGN_DESTINATION_STAGE_ID;
  checks.push(check('campaign.state.isolated',
    isolated ? 'CAMPAIGN_STATE_ISOLATED' : 'CAMPAIGN_STATE_LEAKED',
    isolated ? 'PASS' : 'FAIL',
    isolated
      ? 'Flags, missões, NPCs e inimigos do Igapó não contaminaram o destino.'
      : `Estado local do Igapó foi encontrado no destino: ${[
          ...leakedFlags, ...leakedMissions,
          ...(leakedNpc ? ['npc.aguas.igapo.memory-vestige'] : []),
          ...(leakedEnemy ? ['enemy.igapo'] : []),
        ].join(', ')}.`,
    { required: true }));

  const narrativeOrigin = igapoBefore?.snapshot ? {
    flags: igapoBefore.snapshot.flags ?? {},
    missionStates: igapoBefore.snapshot.missionStates ?? {},
  } : null;
  const narrativeDestination = destination.snapshot ? {
    flags: destination.snapshot.flags ?? {},
    missionStates: destination.snapshot.missionStates ?? {},
  } : null;
  const relevantStorageKeys = (destination.storageKeys ?? []).filter(key =>
    /campaign|igapo|coracao|narrative/i.test(key));
  const originKeyPresent = relevantStorageKeys.some(key => /igapo/i.test(key));
  checks.push(check('campaign.persistence.origin-save',
    originKeyPresent ? 'CAMPAIGN_ORIGIN_SAVE_PRESENT' : 'CAMPAIGN_ORIGIN_SAVE_MISSING',
    originKeyPresent ? 'PASS' : 'UNKNOWN',
    originKeyPresent
      ? 'O save narrativo do Igapó permanece no armazenamento da campanha.'
      : 'Não foi possível confirmar o save narrativo do Igapó no armazenamento local.',
    { required: false }));

  const returnDestination = (destination.campaign?.destinations ?? [])
    .find(item => item.available && item.targetStageId === CAMPAIGN_IGAPO_STAGE_ID);
  let returnTransition = null;
  if (returnDestination) {
    returnTransition = await driver.campaignExit(CAMPAIGN_IGAPO_STAGE_ID);
    const returned = returnTransition.after?.campaign?.currentStageId === CAMPAIGN_IGAPO_STAGE_ID ||
      returnTransition.after?.stageId === CAMPAIGN_IGAPO_STAGE_ID;
    checks.push(check('campaign.return',
      returned ? 'CAMPAIGN_RETURN_EXECUTED' : 'CAMPAIGN_RETURN_FAILED',
      returned ? 'PASS' : 'UNKNOWN',
      returned ? 'Retorno real Coração Corrompido → Igapó executado.'
        : 'O retorno existente não foi concluído no tempo observado.',
      { required: false, ...(returnDestination.stageExitId ? { referenceId: returnDestination.stageExitId } : {}) }));
    if (returnTransition) transitions.push(transitionRecord(returnTransition, CAMPAIGN_IGAPO_STAGE_ID, 'return'));
  } else {
    checks.push(check('campaign.return', 'CAMPAIGN_RETURN_UNVERIFIED', 'UNKNOWN',
      'Nenhuma saída de retorno disponível foi observada no destino.',
      { required: false }));
  }

  const resourcesBefore = igapoBefore?.player ?? null;
  const resourcesAfter = destination.player ?? null;
  const resourcesPreserved = Boolean(resourcesBefore && resourcesAfter &&
    typeof resourcesBefore.halos === 'number' && typeof resourcesAfter.halos === 'number' &&
    resourcesAfter.halos >= resourcesBefore.halos);
  checks.push(check('campaign.resources',
    resourcesPreserved ? 'CAMPAIGN_RESOURCES_PRESERVED' : 'CAMPAIGN_RESOURCES_UNVERIFIED',
    resourcesPreserved ? 'PASS' : 'UNKNOWN',
    resourcesPreserved
      ? `Recursos preservados (halos ${resourcesBefore.halos} → ${resourcesAfter.halos}).`
      : 'Não foi possível confirmar a preservação dos recursos persistentes.',
    { required: false }));
  const persistence = Object.freeze({
    campaign: Object.freeze({ before: beforeCampaign, after: afterCampaign }),
    narrative: Object.freeze({ origin: narrativeOrigin, destination: narrativeDestination }),
    resources: Object.freeze({
      before: resourcesBefore ? { halos: resourcesBefore.halos, magic: resourcesBefore.magic } : null,
      after: resourcesAfter ? { halos: resourcesAfter.halos, magic: resourcesAfter.magic } : null,
      preserved: resourcesPreserved,
    }),
    relevantStorageKeys: Object.freeze(relevantStorageKeys),
    preserved,
    isolated,
    confirmedDelta,
  });
  stages.push(Object.freeze({
    stageId: CAMPAIGN_DESTINATION_STAGE_ID, role: 'destination', loaded: destinationLoaded,
    player: destination.player ? { x: Math.round(destination.player.x), y: Math.round(destination.player.y) } : null,
    spawn: destinationInfo?.spawns?.[0] ?? null,
    spawnDistance,
    movement,
    cameraValid,
  }));
  const report = campaignResultReport({
    campaignId, runId, runSeed,
    originStageId: CAMPAIGN_IGAPO_STAGE_ID,
    destinationStageId: CAMPAIGN_DESTINATION_STAGE_ID,
    variantId: destinationInfo?.variantId ?? null,
    manifestRevision: igapoInfo?.manifest?.revision,
    destinationManifestRevision: destinationInfo?.manifest?.revision,
    checks, transitions, stages, persistence,
    observations, screenshots,
    browser: `${version.Browser ?? 'Chromium'} (${version['User-Agent'] ?? 'CDP'})`,
    durationMs: Date.now() - startedAt,
  });
  writeReport(report);
  return report.result === 'PASS' ? 0 : 1;
}

async function run() {
  const startedAt = Date.now();
  ensureDir(args.evidenceDir);
  // A killed run may leave a locked browser profile behind; clean old profiles
  // so a reused process id cannot inherit a stale one.
  for (const entry of fs.readdirSync(args.evidenceDir)) {
    if (!entry.startsWith('profile-')) continue;
    try {
      fs.rmSync(path.join(args.evidenceDir, entry), { recursive: true, force: true });
    } catch { /* a live profile is left for the next cleanup */ }
  }
  const seed = readChapterSeed(args.slug);
  const plan = readStagePlan(args);
  const scenario = args.campaign
    ? 'campaign'
    : plan?.template ?? (args.stageId?.includes('igapo') ? 'igapo' : 'authored');
  const checks = [];
  const observations = [];
  const screenshots = [];

  if (!args.slug && !args.stageId && !args.campaign) {
    const report = {
      schemaVersion: SCHEMA_VERSION, kind: REPORT_KIND, stageId: 'unknown',
      result: 'UNKNOWN', scenario, checks: [check('runtime.input', 'RUNTIME_INPUT_INVALID', 'UNKNOWN',
        'Informe um slug de capítulo ou --stage <stageId>.', { suggestion: 'npm run homologate -- minha-fase' })],
      observations: [], evidence: { durationMs: 0 }, runtime: { phaser: 'not-executed' },
    };
    writeReport(report);
    return 1;
  }

  if (args.slug) {
    const indexFile = path.join(findChapterDir(args.slug), 'index.ts');
    if (!fs.existsSync(indexFile)) {
      const report = {
        schemaVersion: SCHEMA_VERSION, kind: REPORT_KIND, stageId: `chapter.${args.slug}`,
        result: 'UNKNOWN', scenario, checks: [check('runtime.chapter', 'RUNTIME_CHAPTER_MISSING', 'UNKNOWN',
          `Capítulo não encontrado em src/examples/chapters/${args.slug}.`,
          { suggestion: 'Crie o capítulo pela CLI antes da homologação.' })],
        observations: [], evidence: { durationMs: Date.now() - startedAt }, runtime: { phaser: 'not-executed' },
      };
      writeReport(report);
      return 1;
    }
  }

  const browserPath = findBrowser();
  if (!browserPath) {
    const report = {
      schemaVersion: SCHEMA_VERSION, kind: REPORT_KIND, stageId: args.stageId ?? `chapter.${args.slug}`,
      result: 'UNKNOWN', scenario, checks: [check('runtime.browser', 'RUNTIME_BROWSER_UNAVAILABLE', 'UNKNOWN',
        'Nenhum navegador Chromium/Edge foi encontrado para a homologação.',
        { suggestion: 'Defina UMBRA_BROWSER ou --browser <caminho>.' })],
      observations: [], evidence: { durationMs: Date.now() - startedAt }, runtime: { phaser: 'not-executed' },
    };
    writeReport(report);
    return 1;
  }

  const port = await freePort();
  const cdpPort = await freePort();
  const profileDir = path.join(args.evidenceDir, `profile-${process.pid}-${Date.now()}`);
  let viteServer;
  let browserProcess;
  let cdp;

  try {
    const vite = await import('vite');
    viteServer = await vite.createServer({
      configFile: path.join(REPO, 'vite.config.ts'),
      root: path.join(REPO, 'src'),
      server: { host: '127.0.0.1', port, strictPort: true, open: false },
    });
    await viteServer.listen();
    // Warm the entry graph before opening the browser. A cold optimize pass can
    // take longer than the page-load budget on slower machines.
    try {
      await viteServer.warmupRequest('/index.html');
      await viteServer.warmupRequest('/main.ts');
    } catch {
      // Warmup is an optimization; the page load still works without it.
    }
    await sleep(1_500);
    const query = new URLSearchParams();
    if (args.campaign) {
      query.set('macroCampaign', '1');
      if (args.macroRunId) query.set('macroRun', args.macroRunId);
      if (args.macroRunSeed !== undefined) query.set('macroSeed', String(args.macroRunSeed));
    } else if (args.slug) query.set('chapterPreview', args.slug);
    else query.set('stagePreview', args.stageId);
    if (args.variantId) query.set('presentationVariant', args.variantId);
    const url = `http://127.0.0.1:${port}/index.html?${query.toString()}`;

    ensureDir(profileDir);
    browserProcess = spawn(browserPath, [
      '--headless=new',
      `--remote-debugging-port=${cdpPort}`,
      '--disable-gpu',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-extensions',
      '--no-first-run',
      '--no-default-browser-check',
      `--user-data-dir=${profileDir}`,
      '--window-size=1280,720',
      'about:blank',
    ], { stdio: 'ignore' });

    const version = await waitFor(async () => {
      try {
        const response = await fetch(`http://127.0.0.1:${cdpPort}/json/version`);
        return response.ok ? response.json() : undefined;
      } catch { return undefined; }
    }, 30_000);
    if (!version) throw new Error('O CDP do navegador não respondeu.');
    let targetResponse = await fetch(`http://127.0.0.1:${cdpPort}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
    if (!targetResponse.ok) targetResponse = await fetch(`http://127.0.0.1:${cdpPort}/json/new?${encodeURIComponent(url)}`);
    if (!targetResponse.ok) throw new Error(`Não foi possível abrir a página: ${targetResponse.status}`);
    const target = await targetResponse.json();
    cdp = await Cdp.connect(target.webSocketDebuggerUrl);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Log.enable');

    if (args.campaign) {
      await startMacroCampaign(cdp);
      const driver = new Driver(cdp, observations);
      driver.startedAt = startedAt;
      return await runCampaignFlow({
        cdp, driver, startedAt, version, observations, screenshots,
      });
    }

    let lastPageState;
    const game = await waitFor(async () => {
      try {
        const active = await cdp.evaluate(
          `!!(globalThis.__UMBRA_GAME__ && globalThis.__UMBRA_GAME__.scene.isActive('GameScene'))`,
        );
        if (!active) {
          lastPageState = await cdp.evaluate(`({
            url: globalThis.location?.href,
            ready: globalThis.document?.readyState,
            hasGame: Boolean(globalThis.__UMBRA_GAME__),
            body: globalThis.document?.body?.innerText?.slice(0, 240),
          })`);
        }
        return active ? true : undefined;
      } catch { return undefined; }
    }, 120_000, 500);
    if (!game) throw new Error(
      `A GameScene não ficou ativa no tempo esperado. ${lastPageState ? JSON.stringify(lastPageState) : ''}`,
    );

    const driver = new Driver(cdp, observations);
    driver.startedAt = startedAt;

    // Visual capture mode: navigate the real Phaser stage with the real body
    // and screenshot fixed landmarks. It never changes gameplay state, so it is
    // evidence for the art direction, not a replacement for the runtime
    // homologation flow below.
    if (args.capture) {
      await sleep(1_200);
      await driver.closeDialogue();
      const landmarks = [
        { id: 'entrada', title: 'Entrada da Floresta', x: 5, y: 18 },
        { id: 'trilha', title: 'Trilha dos Vestígios', x: 28, y: 15 },
        { id: 'primeiro-combate', title: 'Primeiro confronto', x: 39, y: 18 },
        { id: 'guardiao', title: 'Clareira do Guardião', x: 54, y: 22 },
        { id: 'aproximacao', title: 'Aproximação do santuário', x: 72, y: 18 },
        { id: 'santuario', title: 'Coração Ancestral', x: 80, y: 18 },
        { id: 'saida', title: 'Passagem das Águas', x: 104, y: 18 },
      ];
      for (const landmark of landmarks) {
        const reached = await driver.navigateTo(
          { x: landmark.x * TILE + TILE / 2, y: landmark.y * TILE + TILE / 2 },
          `capture:${landmark.id}`,
          60_000,
        );
        checks.push(check(`capture.${landmark.id}`,
          reached ? 'CAMPAIGN_WAYPOINT_REACHED' : 'CAMPAIGN_WAYPOINT_UNREACHABLE',
          reached ? 'PASS' : 'FAIL',
          reached ? `${landmark.title} alcançado com o corpo real.`
            : `${landmark.title} não foi alcançado.`,
          { required: true, location: { x: landmark.x, y: landmark.y } }));
        screenshots.push(await cdp.screenshot(args.evidenceDir, `capture-${landmark.id}`));
      }
      const result = reportResult(checks);
      const report = {
        schemaVersion: SCHEMA_VERSION, kind: REPORT_KIND,
        stageId: args.stageId ?? `chapter.${args.slug}`,
        result, scenario: 'visual-capture',
        seed,
        checks,
        observations: observations.slice(-200),
        evidence: {
          screenshots,
          browser: `${version.Browser ?? 'Chromium'} (${version['User-Agent'] ?? 'CDP'})`,
          durationMs: Date.now() - startedAt,
        },
        runtime: { phaser: 'executed', liveExecution: 'executed' },
      };
      writeReport(report);
      return result === 'PASS' ? 0 : 1;
    }
    const initial = await driver.state();
    await driver.sample('loaded', initial);
    checks.push(check('runtime.load', initial.active ? 'RUNTIME_STAGE_LOADED' : 'RUNTIME_STAGE_LOAD_FAILED',
      initial.active ? 'PASS' : 'FAIL',
      initial.active ? `Fase ${initial.stageId} carregada em Phaser.` : 'A GameScene não está ativa.'));
    screenshots.push(await cdp.screenshot(args.evidenceDir, '01-loaded'));

    const stageInfo = await readStageInfo(cdp);
    const stageId = stageInfo.manifest?.id ?? initial.stageId ?? args.stageId ?? `chapter.${args.slug}`;

    const objectives = (stageInfo.missions ?? [])
      .filter(mission => mission.id === stageInfo.manifest?.completionMissionId ||
        (mission.objectives ?? []).some(objective =>
          ['npc.interacted', 'encounter.completed', 'enemy.defeated', 'item.collected']
            .includes(objective.signal)))
      .flatMap(mission => (mission.objectives ?? []).map(objective => ({ mission, objective })));
    const npcObjective = objectives.find(entry => entry.objective.signal === 'npc.interacted');
    const encounterObjective = objectives.find(entry =>
      entry.objective.signal === 'encounter.completed' || entry.objective.signal === 'enemy.defeated');
    const itemObjective = objectives.find(entry => entry.objective.signal === 'item.collected');

    // 1. Close any dialogue opened automatically on stage enter (Igapó).
    const initialDialogue = await driver.closeDialogue();
    if (initialDialogue.opened) {
      checks.push(check('runtime.dialogue.initial', 'RUNTIME_DIALOGUE_OPENED', 'PASS',
        'Diálogo de entrada foi aberto e percorrido pelo runtime.',
        { required: false }));
    }

    // 2. Mission starter dialogue (the template mission only starts on accept).
    const completionMission = (stageInfo.missions ?? []).find(mission =>
      mission.id === stageInfo.manifest?.completionMissionId);
    const handledNpcIds = new Set();
    const dialogueStartsMission = (dialogue, missionId) => (dialogue?.nodes ?? []).some(node =>
      (node.onEnter ?? []).some(command => command.type === 'mission.start' && command.missionId === missionId) ||
      (node.choices ?? []).some(choice => (choice.commands ?? []).some(command =>
        command.type === 'mission.start' && command.missionId === missionId)));
    if (completionMission?.start === 'dialogue') {
      const starter = (stageInfo.npcs ?? []).find(npc => {
        const dialogue = (stageInfo.dialogues ?? []).find(candidate => candidate.id === npc.dialogueId);
        return dialogue ? dialogueStartsMission(dialogue, completionMission.id) : false;
      });
      if (starter?.spawn?.kind === 'tile') {
        const interaction = await driver.interactWithNpc({
          id: starter.id, x: starter.spawn.x, y: starter.spawn.y,
        });
        handledNpcIds.add(starter.id);
        checks.push(check('runtime.npc.starter', interaction.reached ? 'RUNTIME_MISSION_STARTER_REACHED'
          : 'RUNTIME_MISSION_STARTER_UNREACHABLE',
          interaction.reached ? 'PASS' : 'FAIL',
          interaction.reached ? `NPC ${starter.id} que inicia a missão foi alcançado.`
            : `NPC ${starter.id} que inicia a missão não foi alcançado.`,
          { location: { x: starter.spawn.x, y: starter.spawn.y } }));
        const afterStarter = await driver.state();
        const status = afterStarter.snapshot?.missionStates?.[completionMission.id]?.status;
        checks.push(check('runtime.mission.started',
          status === 'active' || status === 'completed' ? 'RUNTIME_MISSION_STARTED' : 'RUNTIME_MISSION_NOT_STARTED',
          status === 'active' || status === 'completed' ? 'PASS' : 'FAIL',
          status === 'active' || status === 'completed'
            ? `Missão ${completionMission.id} iniciou pelo diálogo real (${status}).`
            : `Missão ${completionMission.id} não iniciou após o diálogo (${status ?? 'ausente'}).`,
          { suggestion: 'Verifique o comando mission.start e a escolha do diálogo.' }));
        screenshots.push(await cdp.screenshot(args.evidenceDir, '02-mission-started'));
      }
    }

    // 3. NPC objective.
    if (npcObjective) {
      const npcId = npcObjective.objective.filter?.field === 'npcId'
        ? npcObjective.objective.filter.equals : undefined;
      const npc = (stageInfo.npcs ?? []).find(candidate => candidate.id === npcId) ??
        (stageInfo.npcs ?? [])[0];
      if (npc && handledNpcIds.has(npc.id)) {
        checks.push(check('runtime.npc.reached', 'RUNTIME_NPC_REACHED', 'PASS',
          `NPC ${npc.id} já foi alcançado durante o início da missão.`,
          { location: npc.spawn.kind === 'tile' ? { x: npc.spawn.x, y: npc.spawn.y } : undefined }));
      } else if (npc?.spawn?.kind === 'tile') {
        const interaction = await driver.interactWithNpc({ id: npc.id, x: npc.spawn.x, y: npc.spawn.y });
        checks.push(check('runtime.npc.reached', interaction.reached ? 'RUNTIME_NPC_REACHED' : 'RUNTIME_NPC_UNREACHABLE',
          interaction.reached ? 'PASS' : 'FAIL',
          interaction.reached ? `NPC ${npc.id} alcançado com o corpo real.` : `NPC ${npc.id} não foi alcançado.`,
          { location: { x: npc.spawn.x, y: npc.spawn.y }, suggestion: 'Verifique o caminho até o NPC.' }));
        checks.push(check('runtime.dialogue.npc', interaction.opened ? 'RUNTIME_DIALOGUE_OPENED' : 'RUNTIME_DIALOGUE_UNVERIFIED',
          interaction.opened ? (interaction.closed ? 'PASS' : 'FAIL') : 'UNKNOWN',
          interaction.opened
            ? (interaction.closed ? 'Diálogo do NPC foi aberto, percorrido e fechado.' : 'O diálogo não fechou.')
            : 'O diálogo do NPC não foi observado.',
          { required: true, location: { x: npc.spawn.x, y: npc.spawn.y } }));
        screenshots.push(await cdp.screenshot(args.evidenceDir, '02-npc-dialogue'));
      } else {
        checks.push(check('runtime.npc.reached', 'RUNTIME_NPC_UNVERIFIED', 'UNKNOWN',
          'O NPC obrigatório usa âncora não-tile; a interação não foi executada.',
          { required: true }));
      }
      await sleep(600);
    }

    // 3. Encounter / combat.
    let combat = undefined;
    if (encounterObjective && stageInfo.encounter) {
      const beforeFight = await driver.state();
      const enemies = beforeFight.enemies.length;
      checks.push(check('runtime.encounter.started', enemies > 0 ? 'RUNTIME_ENCOUNTER_STARTED' : 'RUNTIME_ENCOUNTER_UNVERIFIED',
        enemies > 0 ? 'PASS' : 'UNKNOWN',
        enemies > 0 ? `Encontro ${stageInfo.encounter.id} iniciou com ${enemies} inimigo(s).`
          : 'Nenhum inimigo ativo foi observado no início.',
        { required: true }));
      combat = await driver.fight(Math.min(90_000,
        Math.max(30_000, args.timeoutMs - (Date.now() - startedAt))));
      const afterFight = await driver.state();
      checks.push(check('runtime.combat.damage',
        combat.enemyDamaged ? 'RUNTIME_COMBAT_DAMAGE' : 'RUNTIME_COMBAT_UNVERIFIED',
        combat.enemyDamaged ? 'PASS' : 'UNKNOWN',
        combat.enemyDamaged ? 'Dano real foi aplicado a inimigos.' : 'Nenhum dano a inimigos foi observado.',
        { required: true }));
      checks.push(check('runtime.combat.player-damage',
        combat.playerDamaged ? 'RUNTIME_PLAYER_DAMAGED' : 'RUNTIME_PLAYER_NOT_DAMAGED',
        combat.playerDamaged ? 'PASS' : 'UNKNOWN',
        combat.playerDamaged
          ? `O jogador recebeu dano real (${combat.initialHp} → mínimo ${combat.minimumHp}).`
          : 'O jogador não recebeu dano observável; a possibilidade de morte não foi exercitada.',
        { required: false }));
      if (combat.died) {
        checks.push(check('runtime.player.died', 'RUNTIME_PLAYER_DIED', 'FAIL',
          'O jogador morreu durante o combate real antes de concluir a fase.',
          { suggestion: 'A fase deve ser vencível sem aumento artificial de HP.' }));
      }
      checks.push(check('runtime.encounter.completed',
        afterFight.enemies.length === 0 && !combat.died ? 'RUNTIME_ENCOUNTER_COMPLETED'
          : combat.timeout ? 'RUNTIME_COMBAT_TIMEOUT' : 'RUNTIME_ENCOUNTER_INCOMPLETE',
        afterFight.enemies.length === 0 && !combat.died ? 'PASS'
          : combat.timeout ? 'UNKNOWN' : 'FAIL',
        afterFight.enemies.length === 0 && !combat.died
          ? 'Todos os inimigos do encontro foram derrotados.'
          : combat.timeout ? 'O combate excedeu o tempo limite.'
            : 'O encontro não foi concluído.',
        { required: true }));
      screenshots.push(await cdp.screenshot(args.evidenceDir, '03-combat'));
    }

    // 4. Item objective (walking over the item is the real collection path).
    if (itemObjective && stageInfo.items.length > 0) {
      const item = stageInfo.items[0];
      const reached = await driver.navigateTo(
        { x: item.x * TILE + TILE / 2, y: item.y * TILE + TILE / 2 }, 'item', 20_000,
      );
      const state = await driver.state();
      checks.push(check('runtime.item', reached ? 'RUNTIME_ITEM_REACHED' : 'RUNTIME_ITEM_UNREACHABLE',
        reached ? 'PASS' : 'UNKNOWN',
        reached ? `Item ${item.type} alcançado no mapa.` : `Item ${item.type} não foi alcançado.`,
        { required: false, location: { x: item.x, y: item.y } }));
      void state;
    }

    // 5. Optional branch traversal from the authoring plan.
    if (plan?.regions?.length) {
      const region = suffix => plan.regions.find(item =>
        typeof item.id === 'string' && new RegExp(`(^|[._-])${suffix}$`).test(item.id));
      const split = region('split');
      const branch = region('branch');
      const rejoin = region('rejoin');
      if (split?.anchor && branch?.anchor && rejoin?.anchor) {
        const splitReached = await driver.navigateTo(
          { x: split.anchor.x * TILE + TILE / 2, y: split.anchor.y * TILE + TILE / 2 }, 'branch-split', 25_000);
        const branchReached = splitReached && await driver.navigateTo(
          { x: branch.anchor.x * TILE + TILE / 2, y: branch.anchor.y * TILE + TILE / 2 }, 'branch-middle', 25_000);
        const rejoinReached = branchReached && await driver.navigateTo(
          { x: rejoin.anchor.x * TILE + TILE / 2, y: rejoin.anchor.y * TILE + TILE / 2 }, 'branch-rejoin', 25_000);
        checks.push(check('runtime.branch', rejoinReached ? 'RUNTIME_BRANCH_REJOINED' : 'RUNTIME_BRANCH_BLOCKED',
          rejoinReached ? 'PASS' : 'FAIL',
          rejoinReached
            ? 'Bifurcação percorrida no runtime: split → caminho secundário → reencontro.'
            : `Bifurcação não percorrida (split=${splitReached}, branch=${branchReached}).`,
          { required: true, regionId: branch.id, location: branch.anchor,
            suggestion: 'Verifique a conectividade física da rota secundária.' }));
        screenshots.push(await cdp.screenshot(args.evidenceDir, '04-branch'));
      }
    }

    // 6. Exit and completion.
    const exitDefinition = stageInfo.manifest?.exits?.[0];
    const exitAnchor = exitDefinition?.anchor?.kind === 'tile'
      ? { id: exitDefinition.id, x: exitDefinition.anchor.x, y: exitDefinition.anchor.y }
      : stageInfo.exits?.[0]
        ? { id: exitDefinition?.id ?? 'map-exit', x: stageInfo.exits[0].x, y: stageInfo.exits[0].y }
        : undefined;
    let exitResult;
    if (exitAnchor) {
      exitResult = await driver.exitFlow(exitAnchor);
      const finalState = exitResult.state ?? await driver.state();
      const unlocked = (finalState.snapshot?.unlockedExitIds ?? []).includes(exitAnchor.id);
      const conditional = Boolean(exitDefinition?.condition);
      checks.push(check('runtime.exit.unlocked', unlocked ? 'RUNTIME_EXIT_UNLOCKED' : 'RUNTIME_EXIT_LOCKED',
        unlocked ? 'PASS' : conditional ? 'UNKNOWN' : 'PASS',
        unlocked
          ? `Saída ${exitAnchor.id} foi desbloqueada pelo runtime.`
          : conditional
            ? 'A saída condicional não aparece desbloqueada no snapshot.'
            : 'A saída é incondicional e não depende de desbloqueio narrativo.',
        { required: conditional, location: { x: exitAnchor.x, y: exitAnchor.y } }));
      checks.push(check('runtime.exit.reached', exitResult.reached ? 'RUNTIME_EXIT_REACHED' : 'RUNTIME_EXIT_UNREACHABLE',
        exitResult.reached ? 'PASS' : 'FAIL',
        exitResult.reached ? `Saída ${exitAnchor.id} alcançada.` : `Saída ${exitAnchor.id} não foi alcançada.`,
        { required: true, location: { x: exitAnchor.x, y: exitAnchor.y } }));
      checks.push(check('runtime.exit.triggered', exitResult.triggered ? 'RUNTIME_EXIT_TRIGGERED' : 'RUNTIME_EXIT_NOT_TRIGGERED',
        exitResult.triggered ? 'PASS' : 'FAIL',
        exitResult.triggered ? 'A saída acionou o evento de conclusão.' : 'A saída não acionou a conclusão.',
        { required: true, location: { x: exitAnchor.x, y: exitAnchor.y } }));
      screenshots.push(await cdp.screenshot(args.evidenceDir, '05-exit'));
      const afterExit = await driver.state();
      const sceneChanged = afterExit.sceneKeys.some(key => key !== 'GameScene');
      checks.push(check('runtime.transition', sceneChanged ? 'RUNTIME_TRANSITION_EXECUTED' : 'RUNTIME_TRANSITION_UNVERIFIED',
        sceneChanged ? 'PASS' : 'UNKNOWN',
        sceneChanged ? `Transição observada para: ${afterExit.sceneKeys.join(', ')}.`
          : 'A conclusão foi registrada, mas a transição de cena não foi observada (preview individual).',
        { required: false }));
    } else {
      checks.push(check('runtime.exit.reached', 'RUNTIME_EXIT_UNVERIFIED', 'UNKNOWN',
        'A fase não declara uma saída de tile resolvível.', { required: true }));
    }

    // 7. Mission / flag evidence.
    const finalState = await driver.state();
    const completionMissionId = stageInfo.manifest?.completionMissionId;
    const mission = completionMissionId
      ? finalState.snapshot?.missionStates?.[completionMissionId] : undefined;
    if (completionMissionId) {
      checks.push(check('runtime.mission', mission?.status === 'completed'
        ? 'RUNTIME_MISSION_COMPLETED' : 'RUNTIME_MISSION_INCOMPLETE',
        mission?.status === 'completed' ? 'PASS' : 'FAIL',
        mission?.status === 'completed'
          ? `Missão ${completionMissionId} concluída no runtime.`
          : `Missão ${completionMissionId} não foi concluída (estado: ${mission?.status ?? 'ausente'}).`,
        { required: true }));
    }
    const flagCondition = exitDefinition?.condition?.type === 'flag.equals'
      ? exitDefinition.condition.flag : undefined;
    if (flagCondition) {
      const flag = finalState.snapshot?.flags?.[flagCondition];
      checks.push(check('runtime.flag', flag === exitDefinition.condition.value
        ? 'RUNTIME_FLAG_UPDATED' : 'RUNTIME_FLAG_MISSING',
        flag === exitDefinition.condition.value ? 'PASS' : 'FAIL',
        flag === exitDefinition.condition.value
          ? `Flag ${flagCondition} foi atualizada pelo runtime.`
          : `Flag ${flagCondition} não atingiu o valor esperado.`,
        { required: true }));
    }

    // 8. Camera evidence.
    const camera = driver.cameraSummary();
    checks.push(check('runtime.camera.follow', camera.moved ? 'RUNTIME_CAMERA_FOLLOW' : 'RUNTIME_CAMERA_UNMOVED',
      camera.moved ? 'PASS' : 'FAIL',
      camera.moved
        ? `Câmera acompanhou o deslocamento (${camera.start?.x},${camera.start?.y} → ${camera.end?.x},${camera.end?.y}).`
        : 'A câmera não se deslocou durante a exploração.',
      { required: true }));
    checks.push(check('runtime.camera.bounds', camera.inBounds ? 'RUNTIME_CAMERA_BOUNDS' : 'RUNTIME_CAMERA_OUT_OF_BOUNDS',
      camera.inBounds ? 'PASS' : 'UNKNOWN',
      camera.inBounds ? 'A câmera permaneceu dentro dos limites do mundo.'
        : 'Não foi possível confirmar os limites da câmera com as amostras coletadas.',
      { required: false }));
    const playerMoved = observations.some((entry, index) => index > 0 && entry.player &&
      observations[0].player &&
      Math.hypot(entry.player.x - observations[0].player.x, entry.player.y - observations[0].player.y) > 8);
    checks.push(check('runtime.movement', playerMoved ? 'RUNTIME_PLAYER_MOVED' : 'RUNTIME_PLAYER_STUCK',
      playerMoved ? 'PASS' : 'FAIL',
      playerMoved ? 'O personagem se deslocou com entradas reais.' : 'O personagem não se deslocou.',
      { required: true }));

    const result = reportResult(checks);
    const report = {
      schemaVersion: SCHEMA_VERSION,
      kind: REPORT_KIND,
      stageId,
      chapterId: stageInfo.manifest?.chapterId ?? initial.chapterId ?? null,
      title: stageInfo.manifest?.title ?? initial.title ?? null,
      ...(args.variantId ? { variantId: args.variantId } : {}),
      ...(stageInfo.manifest?.revision !== undefined
        ? { manifestRevision: stageInfo.manifest.revision } : {}),
      scenario,
      seed,
      result,
      checks,
      observations: observations.slice(-200),
      evidence: {
        screenshots,
        browser: `${version.Browser ?? 'Chromium'} (${version['User-Agent'] ?? 'CDP'})`,
        durationMs: Date.now() - startedAt,
      },
      runtime: { phaser: 'executed', liveExecution: 'executed' },
    };
    writeReport(report);
    return result === 'PASS' ? 0 : 1;
  } catch (error) {
    const failure = check('runtime.failure', 'RUNTIME_EXECUTION_FAILED', 'UNKNOWN',
      `A homologação não pôde ser concluída: ${error instanceof Error ? error.message : String(error)}.`,
      { suggestion: 'Verifique o navegador, o servidor Vite e os logs de .tmp/evidence-913.' });
    const allChecks = [...checks, failure];
    const report = {
      schemaVersion: SCHEMA_VERSION, kind: REPORT_KIND,
      stageId: args.stageId ?? `chapter.${args.slug}`,
      result: reportResult(allChecks), scenario,
      checks: allChecks,
      observations: observations.slice(-40),
      evidence: {
        screenshots, durationMs: Date.now() - startedAt,
        ...(cdp?.logs?.length ? { console: cdp.logs.slice(-40) } : {}),
      },
      runtime: { phaser: 'not-executed' },
    };
    writeReport(report);
    return 1;
  } finally {
    try { await cdp?.send('Browser.close'); } catch { /* ignore */ }
    await sleep(300);
    try {
      if (browserProcess?.pid) {
        if (process.platform === 'win32') {
          spawnSync('taskkill', ['/PID', String(browserProcess.pid), '/T', '/F'], { stdio: 'ignore' });
        } else {
          browserProcess.kill('SIGKILL');
        }
      }
    } catch { /* ignore */ }
    try { cdp?.close(); } catch { /* ignore */ }
    try { await viteServer?.close(); } catch { /* ignore */ }
    try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}

process.exitCode = await run();
