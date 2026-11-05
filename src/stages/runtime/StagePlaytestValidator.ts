import type { EnemyPlacement, LevelDefinition } from '../../data/LevelData';
import type {
  DialogueDefinition,
  MissionDefinition,
  NpcDefinition,
  ResolvedStageEncounter,
  StageCommand,
  StageCondition,
  StageEventRule,
  StageManifest,
  StageModule,
  StageSignal,
} from '../contracts';

/**
 * Real player collision box, derived from Hero.ts:
 * setSize(42, 58) multiplied by setDisplaySize(86, 76) over a 128x114 frame.
 * The world body is 28.21875 x 38.6667; the validator rounds up to 29 x 39.
 */
export const PLAYTEST_CHARACTER = Object.freeze({
  tileSize: 32,
  sourceBodyWidth: 42,
  sourceBodyHeight: 58,
  displayWidth: 86,
  displayHeight: 76,
  frameWidth: 128,
  frameHeight: 114,
  bodyWidth: 29,
  bodyHeight: 39,
  bodyOffsetY: 13.333334,
  sampleStep: 8,
});

export type PlaytestCharacterModel = typeof PLAYTEST_CHARACTER;

export type PlaytestStatus = 'PASS' | 'FAIL' | 'UNKNOWN';
export type PlaytestSeedSource = 'authored' | 'explicit' | 'variant';

export interface PlaytestPoint {
  readonly x: number;
  readonly y: number;
}

export type PlaytestRegionRole =
  | 'start' | 'exploration' | 'combat' | 'objective' | 'exit' | string;

export interface PlaytestPlanRegionView {
  readonly id: string;
  readonly title?: string;
  readonly role: PlaytestRegionRole;
  readonly anchor?: PlaytestPoint;
  readonly connections?: readonly string[];
}

export interface PlaytestPlanObjectiveView {
  readonly id: string;
  readonly title?: string;
  readonly regionId: string;
  readonly missionId?: string;
  readonly dependsOn?: readonly string[];
  readonly unlocksExitIds?: readonly string[];
}

export interface PlaytestPlanExitConditionView {
  readonly exitId: string;
  readonly regionId: string;
  readonly requiresObjectiveIds: readonly string[];
}

export interface PlaytestPlanView {
  readonly id: string;
  readonly progression: string;
  readonly template?: string;
  readonly startRegionId: string;
  readonly exitRegionIds: readonly string[];
  readonly regions: readonly PlaytestPlanRegionView[];
  readonly objectives: readonly PlaytestPlanObjectiveView[];
  readonly exitConditions: readonly PlaytestPlanExitConditionView[];
}

export interface PlaytestRoutesView {
  readonly main: readonly PlaytestPoint[];
  readonly branch?: readonly PlaytestPoint[];
}

export interface PlaytestCheck {
  readonly id: string;
  readonly code: string;
  readonly status: PlaytestStatus;
  /** True when a FAIL/UNKNOWN blocks the static playtest result. */
  readonly required: boolean;
  readonly message: string;
  readonly suggestion?: string;
  readonly referenceId?: string;
  readonly location?: PlaytestPoint;
}

export interface PlaytestRegionResult {
  readonly id: string;
  readonly title: string | null;
  readonly role: PlaytestRegionRole;
  readonly anchor: PlaytestPoint | null;
  readonly status: PlaytestStatus;
  readonly required: boolean;
  readonly code: string;
  readonly message: string;
  readonly distance: number | null;
}

export interface PlaytestDiagnostic {
  readonly code: string;
  readonly severity: 'error' | 'warning' | 'info';
  readonly message: string;
  readonly path: readonly (string | number)[];
  readonly referenceId?: string;
  readonly location?: PlaytestPoint;
  readonly suggestion?: string;
}

export interface PlaytestCameraResult {
  readonly status: PlaytestStatus;
  readonly worldWidth: number | null;
  readonly worldHeight: number | null;
  readonly viewportWidth: number;
  readonly viewportHeight: number;
  readonly message: string;
}

export interface StagePlaytestSeedReport {
  readonly seed: number | null;
  readonly source: PlaytestSeedSource;
  readonly result: PlaytestStatus;
  readonly character: PlaytestCharacterModel;
  readonly checks: readonly PlaytestCheck[];
  readonly diagnostics: readonly PlaytestDiagnostic[];
  readonly regions: readonly PlaytestRegionResult[];
  readonly camera: PlaytestCameraResult;
  readonly liveExecution: 'not-executed';
}

export interface StagePlaytestInput {
  readonly stage: StageModule;
  readonly level?: LevelDefinition;
  readonly encounter?: ResolvedStageEncounter;
  readonly plan?: PlaytestPlanView;
  readonly routes?: PlaytestRoutesView;
  /** Stage ids registered together with this one; used to validate exit targets. */
  readonly chapterStageIds?: readonly string[];
  readonly seed?: number;
  readonly seedSource?: PlaytestSeedSource;
}

const TILE = 32;
const SOLID_TILES = new Set([1, 2, 3]);
const SPAWN_TILE = 8;
const EXIT_TILE = 5;
const BOSS_TILE = 9;
const CAMERA_VIEWPORT = Object.freeze({ width: 1280, height: 720 });

type Tri = 'yes' | 'no' | 'unknown';

interface Point {
  readonly x: number;
  readonly y: number;
}

interface Visit {
  readonly visited: Uint8Array;
  readonly distance: Int32Array;
}

function triAnd(values: readonly Tri[]): Tri {
  if (values.some(value => value === 'no')) return 'no';
  if (values.some(value => value === 'unknown')) return 'unknown';
  return 'yes';
}

function triOr(values: readonly Tri[]): Tri {
  if (values.some(value => value === 'yes')) return 'yes';
  if (values.some(value => value === 'unknown')) return 'unknown';
  return 'no';
}

function triNot(value: Tri): Tri {
  return value === 'yes' ? 'no' : value === 'no' ? 'yes' : 'unknown';
}

function triToStatus(value: Tri): PlaytestStatus {
  return value === 'yes' ? 'PASS' : value === 'no' ? 'FAIL' : 'UNKNOWN';
}

function isSolidTile(tile: number): boolean {
  return SOLID_TILES.has(tile);
}

function stableSort<T>(values: readonly T[], key: (value: T) => string): readonly T[] {
  return Object.freeze([...values].sort((left, right) => {
    const leftKey = key(left);
    const rightKey = key(right);
    return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
  }));
}

function matchesSuffix(id: string, suffix: string): boolean {
  return id === suffix || id.endsWith(`.${suffix}`) || id.endsWith(`-${suffix}`) ||
    id.endsWith(`_${suffix}`);
}

function isRectangular(tileMap: readonly (readonly number[])[]): boolean {
  if (!Array.isArray(tileMap) || tileMap.length === 0) return false;
  if (!Array.isArray(tileMap[0])) return false;
  const width = tileMap[0].length;
  if (width === 0) return false;
  return tileMap.every(row => Array.isArray(row) && row.length === width &&
    row.every(tile => Number.isInteger(tile)));
}

/**
 * Fine-grid erosion of the level by the real player body. It is a deterministic
 * geometric check, not a physics simulation: a sample is free only when the
 * 29x39 body centered on it never overlaps wall, pillar or water.
 */
class ClearanceWalk {
  public readonly cols: number;
  public readonly rows: number;
  public readonly step: number;
  public readonly free: Uint8Array;
  private readonly widthPx: number;
  private readonly heightPx: number;
  private readonly tileWidth: number;
  private readonly tileHeight: number;
  private readonly bodyHalfWidth: number;
  private readonly bodyHalfHeight: number;

  public constructor(
    private readonly tileMap: readonly (readonly number[])[],
    private readonly character: PlaytestCharacterModel,
  ) {
    this.tileHeight = tileMap.length;
    this.tileWidth = tileMap[0]?.length ?? 0;
    this.widthPx = this.tileWidth * TILE;
    this.heightPx = this.tileHeight * TILE;
    this.step = character.sampleStep;
    this.cols = Math.ceil(this.widthPx / this.step);
    this.rows = Math.ceil(this.heightPx / this.step);
    this.bodyHalfWidth = character.bodyWidth / 2;
    this.bodyHalfHeight = character.bodyHeight / 2;
    this.free = new Uint8Array(this.cols * this.rows);
    for (let row = 0; row < this.rows; row += 1) {
      for (let col = 0; col < this.cols; col += 1) {
        this.free[row * this.cols + col] = this.isBodyFree(
          col * this.step + this.step / 2,
          row * this.step + this.step / 2,
        ) ? 1 : 0;
      }
    }
  }

  public samplePoint(col: number, row: number): Point {
    return {
      x: col * this.step + this.step / 2,
      y: row * this.step + this.step / 2,
    };
  }

  public indexAt(x: number, y: number): number {
    const col = Math.floor(x / this.step);
    const row = Math.floor(y / this.step);
    if (col < 0 || row < 0 || col >= this.cols || row >= this.rows) return -1;
    return row * this.cols + col;
  }

  public isFreeAt(x: number, y: number): boolean {
    const index = this.indexAt(x, y);
    return index >= 0 && this.free[index] === 1;
  }

  /** Nearest free sample centre within a radius; deterministic tie-breaking. */
  public nearestFree(x: number, y: number, maximumRadiusPx: number): Point | undefined {
    const originCol = Math.floor(x / this.step);
    const originRow = Math.floor(y / this.step);
    if (originCol >= 0 && originRow >= 0 && originCol < this.cols && originRow < this.rows &&
      this.free[originRow * this.cols + originCol] === 1) {
      return this.samplePoint(originCol, originRow);
    }
    const maximumRing = Math.ceil(maximumRadiusPx / this.step);
    for (let ring = 1; ring <= maximumRing; ring += 1) {
      let best: Point | undefined;
      let bestDistance = Number.POSITIVE_INFINITY;
      for (let row = originRow - ring; row <= originRow + ring; row += 1) {
        for (let col = originCol - ring; col <= originCol + ring; col += 1) {
          if (Math.max(Math.abs(col - originCol), Math.abs(row - originRow)) !== ring) continue;
          if (col < 0 || row < 0 || col >= this.cols || row >= this.rows) continue;
          if (this.free[row * this.cols + col] !== 1) continue;
          const point = this.samplePoint(col, row);
          const distance = Math.hypot(point.x - x, point.y - y);
          if (distance < bestDistance - 1e-6) {
            best = point;
            bestDistance = distance;
          }
        }
      }
      if (best) return best;
    }
    return undefined;
  }

  public bfs(start: Point, extraBlocked?: Uint8Array): Visit {
    const total = this.cols * this.rows;
    const visited = new Uint8Array(total);
    const distance = new Int32Array(total).fill(-1);
    const startIndex = this.indexAt(start.x, start.y);
    if (startIndex < 0 || this.free[startIndex] !== 1 ||
      (extraBlocked && extraBlocked[startIndex] === 1)) {
      return { visited, distance };
    }
    const queue = new Int32Array(total);
    let head = 0;
    let tail = 0;
    queue[tail++] = startIndex;
    visited[startIndex] = 1;
    distance[startIndex] = 0;
    while (head < tail) {
      const index = queue[head++];
      const col = index % this.cols;
      const row = (index - col) / this.cols;
      for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
        for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
          if (offsetX === 0 && offsetY === 0) continue;
          const nextCol = col + offsetX;
          const nextRow = row + offsetY;
          if (nextCol < 0 || nextRow < 0 || nextCol >= this.cols || nextRow >= this.rows) continue;
          const nextIndex = nextRow * this.cols + nextCol;
          if (visited[nextIndex] === 1 || this.free[nextIndex] !== 1) continue;
          if (extraBlocked && extraBlocked[nextIndex] === 1) continue;
          if (offsetX !== 0 && offsetY !== 0) {
            const horizontal = row * this.cols + nextCol;
            const vertical = nextRow * this.cols + col;
            if (this.free[horizontal] !== 1 || this.free[vertical] !== 1) continue;
          }
          visited[nextIndex] = 1;
          distance[nextIndex] = distance[index] + 1;
          queue[tail++] = nextIndex;
        }
      }
    }
    return { visited, distance };
  }

  public distanceAt(point: Point, visit: Visit): number | null {
    const index = this.indexAt(point.x, point.y);
    if (index < 0 || visit.visited[index] !== 1) return null;
    return visit.distance[index] * this.step;
  }

  public isReachable(point: Point, visit: Visit): boolean {
    const index = this.indexAt(point.x, point.y);
    return index >= 0 && visit.visited[index] === 1;
  }

  private isBodyFree(centerX: number, centerY: number): boolean {
    const bodyCenterY = centerY + this.character.bodyOffsetY;
    const left = centerX - this.bodyHalfWidth;
    const right = centerX + this.bodyHalfWidth;
    const top = bodyCenterY - this.bodyHalfHeight;
    const bottom = bodyCenterY + this.bodyHalfHeight;
    if (left < 0 || top < 0 || right > this.widthPx || bottom > this.heightPx) return false;
    const minimumX = Math.floor(left / TILE);
    const maximumX = Math.floor((right - 1e-6) / TILE);
    const minimumY = Math.floor(top / TILE);
    const maximumY = Math.floor((bottom - 1e-6) / TILE);
    for (let y = minimumY; y <= maximumY; y += 1) {
      for (let x = minimumX; x <= maximumX; x += 1) {
        if (x < 0 || y < 0 || x >= this.tileWidth || y >= this.tileHeight) return false;
        if (isSolidTile(this.tileMap[y][x])) return false;
      }
    }
    return true;
  }
}

interface TileSearch {
  readonly width: number;
  readonly height: number;
  readonly parents: Int32Array;
}

/** Four-connected tile search used only to locate the first blocked sample. */
function tileSearch(tileMap: readonly (readonly number[])[], start: Point): TileSearch {
  const height = tileMap.length;
  const width = tileMap[0]?.length ?? 0;
  const parents = new Int32Array(width * height).fill(-2);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;
  if (start.x >= 0 && start.y >= 0 && start.x < width && start.y < height &&
    !isSolidTile(tileMap[start.y][start.x])) {
    const startIndex = start.y * width + start.x;
    parents[startIndex] = -1;
    queue[tail++] = startIndex;
    while (head < tail) {
      const index = queue[head++];
      const col = index % width;
      const row = (index - col) / width;
      for (const [offsetX, offsetY] of [[0, -1], [1, 0], [0, 1], [-1, 0]] as const) {
        const nextCol = col + offsetX;
        const nextRow = row + offsetY;
        if (nextCol < 0 || nextRow < 0 || nextCol >= width || nextRow >= height) continue;
        const nextIndex = nextRow * width + nextCol;
        if (parents[nextIndex] !== -2 || isSolidTile(tileMap[nextRow][nextCol])) continue;
        parents[nextIndex] = index;
        queue[tail++] = nextIndex;
      }
    }
  }
  return { width, height, parents };
}

function tilePath(search: TileSearch, target: Point): readonly Point[] {
  if (target.x < 0 || target.y < 0 || target.x >= search.width || target.y >= search.height) {
    return Object.freeze([]);
  }
  const targetIndex = target.y * search.width + target.x;
  if (search.parents[targetIndex] === -2) return Object.freeze([]);
  const reversed: Point[] = [];
  let index = targetIndex;
  while (index >= 0) {
    const col = index % search.width;
    const row = (index - col) / search.width;
    reversed.push({ x: col, y: row });
    index = search.parents[index];
  }
  return Object.freeze(reversed.reverse());
}

interface CommandFact {
  readonly command: StageCommand;
  readonly owner: 'dialogue' | 'event';
  readonly dialogueId?: string;
  readonly nodeId?: string;
  readonly eventRule?: StageEventRule;
}

interface ProgressionContent {
  readonly manifest: StageManifest;
  readonly npcs: readonly NpcDefinition[];
  readonly dialogues: readonly DialogueDefinition[];
  readonly missions: readonly MissionDefinition[];
  readonly events: readonly StageEventRule[];
  readonly level: LevelDefinition;
  readonly encounterEnemies: readonly { readonly type: string; readonly x: number; readonly y: number }[];
  readonly encounterId: string | null;
  readonly npcReachability: ReadonlyMap<string, Tri>;
  readonly encounterReachability: Tri;
}

function collectCommandFacts(content: ProgressionContent): readonly CommandFact[] {
  const facts: CommandFact[] = [];
  content.dialogues.forEach(dialogue => {
    dialogue.nodes.forEach(node => {
      (node.onEnter ?? []).forEach(command => facts.push({
        command, owner: 'dialogue', dialogueId: dialogue.id, nodeId: node.id,
      }));
      (node.choices ?? []).forEach(choice => {
        (choice.commands ?? []).forEach(command => facts.push({
          command, owner: 'dialogue', dialogueId: dialogue.id, nodeId: node.id,
        }));
      });
    });
  });
  content.events.forEach(event => {
    event.commands.forEach(command => facts.push({
      command, owner: 'event', eventRule: event,
    }));
  });
  return facts;
}

class ProgressionAnalysis {
  private readonly facts: readonly CommandFact[];
  private readonly missionById: ReadonlyMap<string, MissionDefinition>;
  private readonly dialogueById: ReadonlyMap<string, DialogueDefinition>;
  private readonly eventById: ReadonlyMap<string, StageEventRule>;
  private readonly npcById: ReadonlyMap<string, NpcDefinition>;
  private readonly exitIds: ReadonlySet<string>;
  private readonly nodeReachability = new Map<string, ReadonlySet<string>>();
  private readonly cache = new Map<string, Tri>();

  public constructor(private readonly content: ProgressionContent) {
    this.facts = collectCommandFacts(content);
    this.missionById = new Map(content.missions.map(mission => [mission.id, mission]));
    this.dialogueById = new Map(content.dialogues.map(dialogue => [dialogue.id, dialogue]));
    this.eventById = new Map(content.events.map(event => [event.id, event]));
    this.npcById = new Map(content.npcs.map(npc => [npc.id, npc]));
    this.exitIds = new Set(content.manifest.exits.map(exit => exit.id));
  }

  public condition(value: StageCondition | undefined, stack: Set<string> = new Set()): Tri {
    if (!value) return 'yes';
    switch (value.type) {
      case 'flag.equals':
        return this.flagValue(value.flag, value.value, stack);
      case 'mission.status': {
        const mission = this.missionById.get(value.missionId);
        if (!mission) return 'no';
        if (value.status === 'completed') return this.mission(mission.id, stack);
        if (value.status === 'active' || value.status === 'available') {
          return this.missionStart(mission.id, stack);
        }
        return 'unknown';
      }
      case 'progression.unlocked':
        return 'unknown';
      case 'all':
        return triAnd(value.conditions.map(child => this.condition(child, stack)));
      case 'any':
        return triOr(value.conditions.map(child => this.condition(child, stack)));
      case 'not':
        return triNot(this.condition(value.condition, stack));
      default:
        return 'unknown';
    }
  }

  public missionSatisfiable(missionId: string): Tri {
    return this.mission(missionId, new Set());
  }

  public missionStartable(missionId: string): Tri {
    return this.missionStart(missionId, new Set());
  }

  public eventReachable(eventId: string): Tri {
    const event = this.eventById.get(eventId);
    return event ? this.event(event, new Set()) : 'no';
  }

  /** Per-objective satisfiability used for precise progression diagnostics. */
  public objectiveStatuses(missionId: string): readonly {
    readonly id: string;
    readonly signal: StageSignal['type'];
    readonly status: 'yes' | 'no' | 'unknown';
  }[] {
    const mission = this.missionById.get(missionId);
    if (!mission) return Object.freeze([]);
    return Object.freeze(mission.objectives
      .filter(objective => objective.optional !== true)
      .map(objective => Object.freeze({
        id: objective.id,
        signal: objective.signal,
        status: this.signalSatisfiable(
          objective.signal, objective.target, objective.filter, new Set(),
        ),
      })));
  }

  public referencedMissionIds(): readonly string[] {
    const ids = new Set<string>();
    if (this.content.manifest.completionMissionId) {
      ids.add(this.content.manifest.completionMissionId);
    }
    this.content.manifest.exits.forEach(exit => {
      if (exit.condition?.type === 'mission.status') ids.add(exit.condition.missionId);
    });
    this.content.events.forEach(event => {
      if (event.condition?.type === 'mission.status') ids.add(event.condition.missionId);
      event.commands.forEach(command => {
        if (command.type === 'mission.start' || command.type === 'mission.advance') {
          ids.add(command.missionId);
        }
      });
    });
    this.content.dialogues.forEach(dialogue => dialogue.nodes.forEach(node => {
      (node.choices ?? []).forEach(choice => (choice.commands ?? []).forEach(command => {
        if (command.type === 'mission.start' || command.type === 'mission.advance') {
          ids.add(command.missionId);
        }
      }));
    }));
    return Object.freeze([...ids].sort());
  }

  private remember(key: string, value: Tri): Tri {
    if (value !== 'unknown') this.cache.set(key, value);
    return value;
  }

  private flagValue(
    flag: string,
    expected: boolean | number | string,
    stack: Set<string>,
  ): Tri {
    const values: Tri[] = [];
    for (const fact of this.facts) {
      const command = fact.command;
      if (command.type === 'flag.set' && command.flag === flag && command.value === expected) {
        values.push(this.commandReachable(fact, stack));
      }
      if (command.type === 'reward.grant' && command.reward.type === 'stage.flag' &&
        command.reward.flag === flag && command.reward.value === expected) {
        values.push(this.commandReachable(fact, stack));
      }
    }
    for (const mission of this.content.missions) {
      for (const reward of mission.rewards ?? []) {
        if (reward.type !== 'stage.flag' || reward.flag !== flag || reward.value !== expected) continue;
        values.push(this.mission(mission.id, stack));
      }
    }
    return values.length === 0 ? 'no' : triOr(values);
  }

  private mission(missionId: string, stack: Set<string>): Tri {
    const key = `mission:${missionId}`;
    const cached = this.cache.get(key);
    if (cached) return cached;
    if (stack.has(key)) return 'unknown';
    const mission = this.missionById.get(missionId);
    if (!mission) return 'no';
    const nextStack = new Set(stack).add(key);
    const start = this.missionStart(missionId, nextStack);
    if (start === 'no') return this.remember(key, 'no');
    const required = mission.objectives.filter(objective => objective.optional !== true);
    const objectives = required.map(objective =>
      this.signalSatisfiable(objective.signal, objective.target, objective.filter, nextStack));
    return this.remember(key, triAnd([start, ...objectives]));
  }

  private missionStart(missionId: string, stack: Set<string>): Tri {
    const key = `start:${missionId}`;
    const cached = this.cache.get(key);
    if (cached) return cached;
    const mission = this.missionById.get(missionId);
    if (!mission) return 'no';
    if (mission.start === 'stage-enter') return this.remember(key, 'yes');
    const values = this.facts
      .filter(fact => fact.command.type === 'mission.start' &&
        fact.command.missionId === missionId)
      .map(fact => this.commandReachable(fact, stack));
    return this.remember(key, values.length === 0 ? 'no' : triOr(values));
  }

  private commandReachable(fact: CommandFact, stack: Set<string>): Tri {
    if (fact.owner === 'event') {
      return fact.eventRule ? this.event(fact.eventRule, stack) : 'unknown';
    }
    if (!fact.dialogueId) return 'unknown';
    const dialogue = this.dialogueById.get(fact.dialogueId);
    if (!dialogue) return 'no';
    const startable = this.dialogue(fact.dialogueId, stack);
    if (startable === 'no') return 'no';
    if (fact.nodeId && !this.reachableNodes(dialogue).has(fact.nodeId)) return 'no';
    return startable;
  }

  private reachableNodes(dialogue: DialogueDefinition): ReadonlySet<string> {
    const cached = this.nodeReachability.get(dialogue.id);
    if (cached) return cached;
    const nodes = new Map(dialogue.nodes.map(node => [node.id, node]));
    const visited = new Set<string>();
    const queue = [dialogue.startNodeId];
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      const node = nodes.get(id);
      if (!node) continue;
      if (node.nextNodeId) queue.push(node.nextNodeId);
      (node.choices ?? []).forEach(choice => queue.push(choice.nextNodeId));
    }
    this.nodeReachability.set(dialogue.id, visited);
    return visited;
  }

  private dialogue(dialogueId: string, stack: Set<string>): Tri {
    const key = `dialogue:${dialogueId}`;
    const cached = this.cache.get(key);
    if (cached) return cached;
    if (stack.has(key)) return 'unknown';
    const dialogue = this.dialogueById.get(dialogueId);
    if (!dialogue) return 'no';
    const values: Tri[] = [];
    if (this.content.manifest.entryDialogueId === dialogueId) values.push('yes');
    for (const npc of this.content.npcs) {
      if (npc.interactionDialogueId !== dialogueId) continue;
      values.push(this.content.npcReachability.get(npc.id) ?? 'unknown');
    }
    const nextStack = new Set(stack).add(key);
    for (const fact of this.facts) {
      if (fact.command.type !== 'dialogue.start' ||
        fact.command.dialogueId !== dialogueId) continue;
      values.push(this.commandReachable(fact, nextStack));
    }
    return this.remember(key, values.length === 0 ? 'no' : triOr(values));
  }

  private event(rule: StageEventRule, stack: Set<string>): Tri {
    const key = `event:${rule.id}`;
    const cached = this.cache.get(key);
    if (cached) return cached;
    if (stack.has(key)) return 'unknown';
    const nextStack = new Set(stack).add(key);
    const trigger = this.eventTrigger(rule, nextStack);
    const condition = rule.condition ? this.condition(rule.condition, nextStack) : 'yes';
    return this.remember(key, triAnd([trigger, condition]));
  }

  private eventTrigger(rule: StageEventRule, stack: Set<string>): Tri {
    const filter = rule.filter;
    switch (rule.when) {
      case 'stage.entered':
        return !filter || filter.field !== 'stageId' || filter.equals === this.content.manifest.id
          ? 'yes' : 'no';
      case 'npc.interacted': {
        const npcId = filter?.field === 'npcId' ? filter.equals : undefined;
        if (!npcId) return this.content.npcs.length > 0 ? 'unknown' : 'no';
        if (!this.npcById.has(npcId)) return 'no';
        return this.content.npcReachability.get(npcId) ?? 'unknown';
      }
      case 'encounter.completed': {
        const encounterId = filter?.field === 'encounterId' ? filter.equals : this.content.encounterId;
        if (!encounterId || encounterId !== this.content.encounterId) return 'no';
        return this.content.encounterReachability;
      }
      case 'enemy.defeated': {
        if (this.content.encounterEnemies.length === 0) return 'no';
        const archetype = filter?.field === 'archetype' ? filter.equals : undefined;
        if (archetype && !this.content.encounterEnemies.some(enemy => enemy.type === archetype)) {
          return 'no';
        }
        return this.content.encounterReachability;
      }
      case 'item.collected': {
        const itemType = filter?.field === 'itemType' ? filter.equals : undefined;
        if (itemType && !this.content.level.items.some(item => item.type === itemType)) return 'no';
        return this.content.level.items.length > 0 ? 'yes' : 'no';
      }
      case 'dialogue.completed': {
        const dialogueId = filter?.field === 'dialogueId' ? filter.equals : undefined;
        if (!dialogueId) return this.content.dialogues.length > 0 ? 'unknown' : 'no';
        return this.dialogue(dialogueId, stack);
      }
      case 'mission.completed': {
        const missionId = filter?.field === 'missionId' ? filter.equals : undefined;
        if (!missionId) return 'unknown';
        return this.mission(missionId, stack);
      }
      case 'stage.exit.requested': {
        const exitId = filter?.field === 'exitId' ? filter.equals : undefined;
        if (!exitId) return this.exitIds.size > 0 ? 'unknown' : 'no';
        return this.exitIds.has(exitId) ? 'yes' : 'no';
      }
      default:
        return 'unknown';
    }
  }

  private signalSatisfiable(
    signal: StageSignal['type'],
    target: number,
    filter: MissionDefinition['objectives'][number]['filter'] | undefined,
    stack: Set<string>,
  ): Tri {
    if (!Number.isFinite(target) || target <= 0) return 'yes';
    switch (signal) {
      case 'stage.entered':
        return 'yes';
      case 'encounter.completed': {
        const encounterId = filter?.field === 'encounterId' ? filter.equals : this.content.encounterId;
        if (!encounterId || encounterId !== this.content.encounterId) return 'no';
        return target <= 1 ? this.content.encounterReachability : 'no';
      }
      case 'enemy.defeated': {
        if (filter?.field === 'enemyId') return 'unknown';
        const archetype = filter?.field === 'archetype' ? filter.equals : undefined;
        const count = archetype
          ? this.content.encounterEnemies.filter(enemy => enemy.type === archetype).length
          : this.content.encounterEnemies.length;
        if (count < target || count === 0) return 'no';
        return this.content.encounterReachability;
      }
      case 'item.collected': {
        if (filter?.field === 'itemId') return 'unknown';
        const itemType = filter?.field === 'itemType' ? filter.equals : undefined;
        const count = itemType
          ? this.content.level.items.filter(item => item.type === itemType).length
          : this.content.level.items.length;
        return count >= target ? 'yes' : 'no';
      }
      case 'npc.interacted': {
        const npcId = filter?.field === 'npcId' ? filter.equals : undefined;
        if (!npcId) return this.content.npcs.length > 0 ? 'unknown' : 'no';
        if (!this.npcById.has(npcId)) return 'no';
        return this.content.npcReachability.get(npcId) ?? 'unknown';
      }
      case 'dialogue.completed': {
        const dialogueId = filter?.field === 'dialogueId' ? filter.equals : undefined;
        if (!dialogueId) return this.content.dialogues.length > 0 ? 'unknown' : 'no';
        return this.dialogue(dialogueId, stack);
      }
      case 'mission.completed': {
        const missionId = filter?.field === 'missionId' ? filter.equals : undefined;
        if (!missionId) return 'unknown';
        if (!this.missionById.has(missionId)) return 'no';
        return this.mission(missionId, stack);
      }
      case 'stage.exit.requested': {
        const exitId = filter?.field === 'exitId' ? filter.equals : undefined;
        if (!exitId) return this.exitIds.size > 0 ? 'yes' : 'no';
        return this.exitIds.has(exitId) ? 'yes' : 'no';
      }
      default:
        return 'unknown';
    }
  }
}

function planGraphHasCycle(regions: readonly PlaytestPlanRegionView[]): boolean {
  const adjacency = new Map<string, Set<string>>();
  regions.forEach(region => adjacency.set(region.id, new Set()));
  regions.forEach(region => (region.connections ?? []).forEach(connection => {
    adjacency.get(region.id)?.add(connection);
    adjacency.get(connection)?.add(region.id);
  }));
  const state = new Map<string, number>();
  const visit = (node: string, parent: string | undefined): boolean => {
    state.set(node, 1);
    for (const next of adjacency.get(node) ?? []) {
      if (next === parent) continue;
      const current = state.get(next) ?? 0;
      if (current === 1) return true;
      if (current === 0 && visit(next, node)) return true;
    }
    state.set(node, 2);
    return false;
  };
  for (const id of adjacency.keys()) {
    if ((state.get(id) ?? 0) === 0 && visit(id, undefined)) return true;
  }
  return false;
}

function deriveEncounterEnemies(
  level: LevelDefinition,
  encounter: ResolvedStageEncounter | undefined,
): readonly { readonly type: string; readonly x: number; readonly y: number }[] {
  if (encounter) {
    return encounter.waves.flatMap(wave => wave.enemies.map(enemy => ({
      type: enemy.type, x: enemy.x, y: enemy.y,
    })));
  }
  return [...(level.enemies ?? []), ...(level.ambush ?? []),
    ...(level.waves ?? []).flatMap(wave => wave.enemies ?? [])]
    .map((enemy: EnemyPlacement) => ({ type: enemy.type, x: enemy.x, y: enemy.y }));
}

function encounterIdOf(stage: StageModule): string | null {
  return stage.encounter?.id ?? null;
}

function objectiveEncounterMatches(mission: MissionDefinition, encounterId: string): boolean {
  return mission.objectives.some(objective =>
    (objective.signal === 'encounter.completed' || objective.signal === 'enemy.defeated') &&
    (objective.filter?.field !== 'encounterId' || objective.filter.equals === encounterId));
}

function requiredEncounter(
  manifest: StageManifest,
  missions: readonly MissionDefinition[],
  events: readonly StageEventRule[],
  encounterId: string | null,
): boolean {
  if (!encounterId) return false;
  const gatingMissions = new Set<string>();
  if (manifest.completionMissionId) gatingMissions.add(manifest.completionMissionId);
  manifest.exits.forEach(exit => {
    if (exit.condition?.type === 'mission.status') gatingMissions.add(exit.condition.missionId);
  });
  events.forEach(event => {
    if (event.condition?.type === 'mission.status') gatingMissions.add(event.condition.missionId);
  });
  return missions.some(mission => gatingMissions.has(mission.id) &&
    objectiveEncounterMatches(mission, encounterId));
}

export class StagePlaytestValidator {
  public validate(input: StagePlaytestInput): StagePlaytestSeedReport {
    const character = PLAYTEST_CHARACTER;
    const seed = input.seed ?? null;
    const source = input.seedSource ?? 'authored';
    const stage = input.stage;
    const level = input.level ?? stage.authoredLevel;
    const checks: PlaytestCheck[] = [];
    const regions: PlaytestRegionResult[] = [];
    const add = (value: PlaytestCheck): void => {
      checks.push(Object.freeze(value));
    };
    const camera = this.camera(level, add);

    if (!level || !isRectangular(level.tileMap) || level.tileMap.length < 3 ||
      (level.tileMap[0]?.length ?? 0) < 3) {
      add({
        id: 'map.valid', code: 'NAVIGATION_MAP_INVALID', status: 'FAIL', required: true,
        message: 'Resolved level has no usable tile map for physical navigation.',
        suggestion: 'Provide a rectangular authored map with at least one spawn and one exit tile.',
      });
      return this.finish(seed, source, checks, regions, camera);
    }

    const walk = new ClearanceWalk(level.tileMap, character);
    const spawn = this.findTile(level.tileMap, SPAWN_TILE);
    if (!spawn) {
      add({
        id: 'navigation.spawn', code: 'NAVIGATION_SPAWN_MISSING', status: 'FAIL', required: true,
        message: 'Tile map has no spawn tile.',
        suggestion: 'Place a `spawn` (8) tile inside the walkable area.',
      });
      return this.finish(seed, source, checks, regions, camera);
    }
    const spawnCenter = { x: spawn.x * TILE + TILE / 2, y: spawn.y * TILE + TILE / 2 };
    const spawnFree = walk.nearestFree(spawnCenter.x, spawnCenter.y, TILE * 2);
    if (!spawnFree) {
      add({
        id: 'navigation.spawn', code: 'NAVIGATION_PATH_BLOCKED', status: 'FAIL', required: true,
        message: `The ${character.bodyWidth}x${character.bodyHeight} player body has no free position near spawn ${spawn.x},${spawn.y}.`,
        suggestion: 'Widen the spawn area so the real player body fits without touching solid tiles.',
        location: spawn,
      });
      return this.finish(seed, source, checks, regions, camera);
    }
    const visit = walk.bfs(spawnFree);
    add({
      id: 'navigation.spawn', code: 'NAVIGATION_PATH_CLEAR', status: 'PASS', required: true,
      message: `Spawn at ${spawn.x},${spawn.y} has clearance for a ${character.bodyWidth}x${character.bodyHeight} body.`,
      location: spawn,
    });

    const content = this.content(stage, level, input.encounter, walk, visit);
    const progression = new ProgressionAnalysis(content);
    const chapterStageIds = new Set(input.chapterStageIds ?? [stage.manifest.id]);

    this.checkExits(stage, level, walk, visit, progression, chapterStageIds, spawn, add);
    this.checkNpcs(content, walk, visit, add);
    this.checkEncounter(content, walk, visit, add);
    this.checkPlan(input.plan, stage, walk, visit, progression, add, regions);
    this.checkMissions(progression, add);
    this.checkCompletion(stage, progression, add);
    this.checkBranches(input, walk, visit, add);
    this.checkCameraFollow(add);
    add({
      id: 'live.execution', code: 'PLAYTEST_LIVE_EXECUTION_UNVERIFIED', status: 'UNKNOWN',
      required: false,
      message: 'No real Phaser playthrough was executed; geometry and narrative satisfiability only.',
      suggestion: 'Run `npm run chapter -- preview <slug> --visual` and play the stage in a browser.',
    });
    if ((input.plan?.objectives.length ?? 0) > 1) add({
      id: 'progression.order', code: 'PROGRESSION_ORDER_UNVERIFIED', status: 'UNKNOWN',
      required: false,
      message: 'Objective order and choice availability depend on live play and were not verified.',
      suggestion: 'Homologate the intended sequence in the Phaser preview.',
    });

    return this.finish(seed, source, checks, regions, camera);
  }

  private content(
    stage: StageModule,
    level: LevelDefinition,
    encounter: ResolvedStageEncounter | undefined,
    walk: ClearanceWalk,
    visit: Visit,
  ): ProgressionContent {
    const npcReachability = new Map<string, Tri>();
    (stage.npcs ?? []).forEach(npc => {
      npcReachability.set(npc.id, this.tileReachability(npc.spawn, walk, visit));
    });
    const encountered = encounter ?? (stage.encounter?.source.kind === 'authored-waves'
      ? {
          id: stage.encounter.id,
          start: stage.encounter.start,
          completion: stage.encounter.completion,
          scaling: stage.encounter.scaling,
          source: 'declarative' as const,
          waves: stage.encounter.source.waves,
        }
      : undefined);
    const encounterEnemies = deriveEncounterEnemies(level, encountered);
    const encounterReachability = encounterEnemies.length === 0
      ? 'no'
      : triAnd(encounterEnemies.map(enemy => this.tileReachability(
        { kind: 'tile', x: enemy.x, y: enemy.y }, walk, visit)));
    return {
      manifest: stage.manifest,
      npcs: stage.npcs ?? [],
      dialogues: stage.dialogues ?? [],
      missions: stage.missions ?? [],
      events: stage.events ?? [],
      level,
      encounterEnemies,
      encounterId: encounterIdOf(stage) ?? encountered?.id ?? null,
      npcReachability,
      encounterReachability,
    };
  }

  private checkExits(
    stage: StageModule,
    level: LevelDefinition,
    walk: ClearanceWalk,
    visit: Visit,
    progression: ProgressionAnalysis,
    chapterStageIds: ReadonlySet<string>,
    spawn: Point,
    add: (check: PlaytestCheck) => void,
  ): void {
    const exitTiles = this.findTiles(level.tileMap, EXIT_TILE);
    const bossTiles = this.findTiles(level.tileMap, BOSS_TILE);
    stage.manifest.exits.forEach(exit => {
      let target: Point | undefined;
      if (exit.anchor.kind === 'tile') target = { x: exit.anchor.x, y: exit.anchor.y };
      else if (exit.anchor.kind === 'map-exit') target = exitTiles[0] ?? bossTiles[0];
      else target = spawn;
      if (!target) {
        add({
          id: `exit.reach.${exit.id}`, code: 'EXIT_UNREACHABLE', status: 'FAIL', required: true,
          message: `Exit ${exit.id} has no resolvable tile anchor.`,
          suggestion: 'Add a tile anchor or an exit/boss tile to the map.',
          referenceId: exit.id,
        });
      } else {
        this.navigationTarget(
          `exit.reach.${exit.id}`, target, 'exit', exit.id, `Exit ${exit.id}`,
          walk, visit, add, level.tileMap, spawn,
        );
      }
      const condition = progression.condition(exit.condition);
      if (exit.condition) {
        add({
          id: `exit.condition.${exit.id}`,
          code: condition === 'yes' ? 'PROGRESSION_CONDITION_MET'
            : condition === 'no' ? 'PROGRESSION_CONDITION_UNMET'
              : 'PROGRESSION_CONDITION_UNVERIFIED',
          status: triToStatus(condition),
          required: true,
          message: condition === 'yes'
            ? `Exit ${exit.id} condition can be produced by declared content.`
            : condition === 'no'
              ? `Exit ${exit.id} condition cannot be produced by any reachable command.`
              : `Exit ${exit.id} condition depends on external progression state.`,
          ...(condition === 'yes' ? {} : {
            suggestion: 'Add a reachable flag/mission producer, or make the exit unconditional.',
          }),
          referenceId: exit.id,
        });
      }
      const targetStage = exit.targetStageId;
      const targetValid = targetStage === 'campaign.complete' || chapterStageIds.has(targetStage);
      add({
        id: `exit.target.${exit.id}`,
        code: targetValid ? 'TRANSITION_REFERENCE_VALID' : 'TRANSITION_UNVERIFIED',
        status: targetValid ? 'PASS' : 'UNKNOWN',
        required: false,
        message: targetValid
          ? `Exit ${exit.id} targets ${targetStage}; the reference is valid for this chapter.`
          : `Exit ${exit.id} targets ${targetStage}; the destination cannot be executed headlessly.`,
        referenceId: exit.id,
      });
    });
  }

  private checkNpcs(
    content: ProgressionContent,
    walk: ClearanceWalk,
    visit: Visit,
    add: (check: PlaytestCheck) => void,
  ): void {
    const spawn = this.findTile(content.level.tileMap, SPAWN_TILE) ?? { x: 0, y: 0 };
    content.npcs.forEach(npc => {
      const required = npc.role !== 'ambient';
      if (npc.spawn.kind !== 'tile') {
        add({
          id: `npc.reach.${npc.id}`, code: 'NPC_REACH_UNVERIFIED', status: 'UNKNOWN',
          required: false,
          message: `NPC ${npc.id} uses a non-tile anchor and was not physically verified.`,
          referenceId: npc.id,
        });
        return;
      }
      this.navigationTarget(
        `npc.reach.${npc.id}`, { x: npc.spawn.x, y: npc.spawn.y }, 'npc', npc.id,
        `NPC ${npc.id}`, walk, visit, add, content.level.tileMap, spawn, required,
      );
    });
  }

  private checkEncounter(
    content: ProgressionContent,
    walk: ClearanceWalk,
    visit: Visit,
    add: (check: PlaytestCheck) => void,
  ): void {
    const required = requiredEncounter(
      content.manifest, content.missions, content.events, content.encounterId,
    );
    const spawn = this.findTile(content.level.tileMap, SPAWN_TILE) ?? { x: 0, y: 0 };
    content.encounterEnemies.forEach((enemy, index) => {
      this.navigationTarget(
        `encounter.enemy.${index}`,
        { x: enemy.x, y: enemy.y },
        'encounter',
        content.encounterId ?? `enemy.${index}`,
        `Encounter enemy ${enemy.type}`,
        walk, visit, add, content.level.tileMap, spawn, required,
      );
    });
  }

  private checkPlan(
    plan: PlaytestPlanView | undefined,
    stage: StageModule,
    walk: ClearanceWalk,
    visit: Visit,
    progression: ProgressionAnalysis,
    add: (check: PlaytestCheck) => void,
    regions: PlaytestRegionResult[],
  ): void {
    if (!plan) return;
    const branched = plan.progression === 'branched' || plan.template === 'branched';
    const objectiveRegions = new Set(plan.objectives.map(objective => objective.regionId));
    plan.regions.forEach(region => {
      const branchRegion = branched && (matchesSuffix(region.id, 'split') ||
        matchesSuffix(region.id, 'branch') || matchesSuffix(region.id, 'rejoin'));
      const required = region.role === 'start' || region.role === 'exit' ||
        region.role === 'objective' || objectiveRegions.has(region.id) || branchRegion;
      if (!region.anchor) {
        regions.push(Object.freeze({
          id: region.id,
          title: region.title ?? null,
          role: region.role,
          anchor: null,
          status: 'UNKNOWN',
          required,
          code: 'REGION_ANCHOR_PENDING',
          message: 'Plan region has no anchor; physical reachability is inconclusive.',
          distance: null,
        }));
        add({
          id: `region.${region.id}`, code: 'REGION_ANCHOR_PENDING', status: 'UNKNOWN',
          required,
          message: `Plan region ${region.id} has no anchor.`,
          suggestion: 'Add an anchor on a walkable tile when the region is implemented.',
          referenceId: region.id,
        });
        return;
      }
      const outcome = this.navigationOutcome(
        region.anchor,
        walk,
        visit,
        region.role === 'exit' ? 'exit' : region.role === 'objective' ? 'objective' : 'region',
        add,
        region.id,
      );
      regions.push(Object.freeze({
        id: region.id,
        title: region.title ?? null,
        role: region.role,
        anchor: region.anchor,
        status: outcome.status,
        required,
        code: outcome.code,
        message: outcome.message,
        distance: outcome.distance,
      }));
    });
    plan.objectives.forEach(objective => {
      if (!plan.regions.some(region => region.id === objective.regionId)) add({
        id: `objective.region.${objective.id}`,
        code: 'OBJECTIVE_UNREACHABLE',
        status: 'FAIL',
        required: true,
        message: `Objective ${objective.id} references unknown region ${objective.regionId}.`,
        suggestion: 'Reference a declared plan region.',
        referenceId: objective.id,
      });
      if (objective.missionId) {
        const startable = progression.missionStartable(objective.missionId);
        if (startable !== 'yes') add({
          id: `objective.start.${objective.id}`,
          code: 'PROGRESSION_OBJECTIVE_UNSTARTABLE',
          status: triToStatus(startable),
          required: true,
          message: startable === 'no'
            ? `Objective ${objective.id} references mission ${objective.missionId}, which has no reachable start trigger.`
            : `Objective ${objective.id} depends on mission ${objective.missionId}, whose start depends on live state.`,
          suggestion: 'Declare a reachable dialogue/event command that starts the mission.',
          referenceId: objective.id,
        });
      }
      (objective.unlocksExitIds ?? []).forEach(exitId => {
        if (!stage.manifest.exits.some(exit => exit.id === exitId)) add({
          id: `objective.exit.${objective.id}.${exitId}`,
          code: 'PROGRESSION_CONDITION_UNMET',
          status: 'FAIL',
          required: true,
          message: `Objective ${objective.id} unlocks unknown exit ${exitId}.`,
          suggestion: 'Reference an exit declared in the StageManifest or fix the plan.',
          referenceId: exitId,
        });
      });
    });
    plan.exitConditions.forEach(condition => {
      if (!stage.manifest.exits.some(exit => exit.id === condition.exitId)) add({
        id: `plan.exit.${condition.exitId}`,
        code: 'PROGRESSION_CONDITION_UNMET',
        status: 'FAIL',
        required: true,
        message: `Plan exit condition references unknown exit ${condition.exitId}.`,
        suggestion: 'Reference an exit declared in the StageManifest.',
        referenceId: condition.exitId,
      });
      const objectiveIds = new Set(plan.objectives.map(objective => objective.id));
      condition.requiresObjectiveIds.forEach(objectiveId => {
        if (!objectiveIds.has(objectiveId)) {
          add({
            id: `plan.exit.objective.${condition.exitId}.${objectiveId}`,
            code: 'PROGRESSION_CONDITION_UNMET',
            status: 'FAIL',
            required: true,
            message: `Exit condition for ${condition.exitId} requires unknown objective ${objectiveId}.`,
            suggestion: 'Reference a declared plan objective.',
            referenceId: objectiveId,
          });
          return;
        }
        const objective = plan.objectives.find(item => item.id === objectiveId);
        if (!objective?.missionId) return;
        const satisfiable = progression.missionSatisfiable(objective.missionId);
        if (satisfiable === 'no') add({
          id: `plan.exit.satisfiable.${condition.exitId}.${objectiveId}`,
          code: 'PROGRESSION_CONDITION_UNMET',
          status: 'FAIL',
          required: true,
          message: `Exit condition for ${condition.exitId} requires objective ${objectiveId}, whose mission cannot be completed.`,
          suggestion: 'Fix the mission trigger or objectives.',
          referenceId: objectiveId,
        });
        else if (satisfiable === 'unknown') add({
          id: `plan.exit.satisfiable.${condition.exitId}.${objectiveId}`,
          code: 'PROGRESSION_CONDITION_UNVERIFIED',
          status: 'UNKNOWN',
          required: true,
          message: `Exit condition for ${condition.exitId} depends on live mission state.`,
          suggestion: 'Homologate the mission flow in the Phaser preview.',
          referenceId: objectiveId,
        });
      });
    });
  }

  private checkMissions(
    progression: ProgressionAnalysis,
    add: (check: PlaytestCheck) => void,
  ): void {
    progression.referencedMissionIds().forEach(missionId => {
      progression.objectiveStatuses(missionId).forEach(objective => {
        if (objective.status === 'yes') return;
        add({
          id: `mission.${missionId}.objective.${objective.id}`,
          code: objective.status === 'no'
            ? 'PROGRESSION_SIGNAL_UNSATISFIABLE'
            : 'PROGRESSION_SIGNAL_UNVERIFIED',
          status: objective.status === 'no' ? 'FAIL' : 'UNKNOWN',
          required: true,
          message: objective.status === 'no'
            ? `Objective ${objective.id} (${objective.signal}) of mission ${missionId} cannot be satisfied by the stage content.`
            : `Objective ${objective.id} (${objective.signal}) of mission ${missionId} depends on runtime occurrence ids or external state.`,
          suggestion: objective.status === 'no'
            ? 'Provide the missing signal source or reduce the objective target.'
            : 'Homologate this objective in the Phaser preview.',
          referenceId: missionId,
        });
      });
    });
  }

  private checkCompletion(
    stage: StageModule,
    progression: ProgressionAnalysis,
    add: (check: PlaytestCheck) => void,
  ): void {
    const completionMission = stage.manifest.completionMissionId;
    if (completionMission) {
      const satisfiable = progression.missionSatisfiable(completionMission);
      add({
        id: 'progression.completion-mission',
        code: satisfiable === 'yes' ? 'PROGRESSION_COMPLETION_POSSIBLE'
          : satisfiable === 'no' ? 'PROGRESSION_COMPLETION_UNREACHABLE'
            : 'PROGRESSION_CONDITION_UNVERIFIED',
        status: triToStatus(satisfiable),
        required: true,
        message: satisfiable === 'yes'
          ? `Completion mission ${completionMission} has a reachable start and satisfiable objectives.`
          : satisfiable === 'no'
            ? `Completion mission ${completionMission} cannot be completed from declared content.`
            : `Completion mission ${completionMission} depends on live state.`,
        suggestion: 'Verify mission triggers, objectives and the encounter that feeds them.',
        referenceId: completionMission,
      });
    }
    const completeOptions = (stage.events ?? []).flatMap(event =>
      event.commands
        .filter((command): command is Extract<StageCommand, { type: 'stage.complete' }> =>
          command.type === 'stage.complete')
        .map(command => ({
          exitId: command.exitId,
          reachable: progression.eventReachable(event.id),
        })));
    const completesExit = (exitId: string): Tri => {
      const options = completeOptions.filter(option => option.exitId === exitId);
      return options.length === 0 ? 'no' : triOr(options.map(option => option.reachable));
    };
    const candidates = stage.manifest.exits.map(exit => ({
      exit,
      condition: progression.condition(exit.condition),
      complete: completesExit(exit.id),
    }));
    const completeCandidate = candidates.find(candidate =>
      candidate.condition === 'yes' && candidate.complete === 'yes');
    const partialCandidate = completeCandidate ?? candidates.find(candidate =>
      candidate.condition !== 'no' && candidate.complete !== 'no');
    const result: Tri = completeCandidate
      ? 'yes'
      : partialCandidate
        ? triAnd([partialCandidate.condition, partialCandidate.complete])
        : 'no';
    add({
      id: 'progression.completion',
      code: result === 'yes' ? 'PROGRESSION_COMPLETION_POSSIBLE'
        : result === 'no' ? 'PROGRESSION_COMPLETION_UNREACHABLE'
          : 'PROGRESSION_CONDITION_UNVERIFIED',
      status: triToStatus(result),
      required: true,
      message: result === 'yes'
        ? `Exit ${completeCandidate?.exit.id ?? 'unknown'} is unlockable and a reachable stage.complete command exists.`
        : result === 'no'
          ? 'No exit combines a satisfiable condition with a reachable stage.complete command.'
          : 'Stage completion depends on external progression state.',
      suggestion: 'Add a reachable stage.complete command for an unlockable exit.',
      ...(partialCandidate ? { referenceId: partialCandidate.exit.id } : {}),
    });
    add({
      id: 'transition.execution', code: 'TRANSITION_UNVERIFIED',
      status: 'UNKNOWN', required: false,
      message: 'The real scene transition was not executed by this static playtest.',
      suggestion: 'Use `preview <slug> --visual` and cross the exit in Phaser.',
    });
  }

  private checkBranches(
    input: StagePlaytestInput,
    walk: ClearanceWalk,
    visit: Visit,
    add: (check: PlaytestCheck) => void,
  ): void {
    const plan = input.plan;
    const branched = plan?.progression === 'branched' || plan?.template === 'branched' ||
      (input.stage.manifest.tags ?? []).includes('template.branched');
    if (!branched) return;
    const split = plan?.regions.find(region => matchesSuffix(region.id, 'split'));
    const branch = plan?.regions.find(region => matchesSuffix(region.id, 'branch'));
    const rejoin = plan?.regions.find(region => matchesSuffix(region.id, 'rejoin'));
    if (plan) {
      const hasCycle = planGraphHasCycle(plan.regions);
      add({
        id: 'branch.graph', code: hasCycle ? 'BRANCH_GRAPH_PRESENT' : 'BRANCH_GRAPH',
        status: hasCycle ? 'PASS' : 'FAIL', required: true,
        message: hasCycle
          ? 'Plan region graph contains a real cycle for the bifurcation.'
          : 'Branched plan region graph has no cycle; the secondary route is only decorative.',
        suggestion: 'Connect split, branch and rejoin so the graph contains a cycle.',
      });
    }
    if (!branch?.anchor || !split?.anchor || !rejoin?.anchor) {
      add({
        id: 'branch.structure', code: 'BRANCH_GRAPH', status: 'UNKNOWN', required: true,
        message: 'Plan does not expose anchored split, branch and rejoin regions.',
        suggestion: 'Anchor split, branch and rejoin regions.',
      });
      return;
    }
    const splitPoint = this.freePoint(split.anchor, walk);
    const rejoinPoint = this.freePoint(rejoin.anchor, walk);
    const branchPoint = this.freePoint(branch.anchor, walk);
    if (!splitPoint || !rejoinPoint || !branchPoint) {
      add({
        id: 'branch.structure', code: 'BRANCH_PATH_BLOCKED', status: 'FAIL', required: true,
        message: 'A bifurcation anchor has no free position for the player body.',
        suggestion: 'Widen the split, branch and rejoin areas.',
        location: branch.anchor,
      });
      return;
    }
    const branchVisit = walk.bfs(branchPoint);
    const returns = walk.isReachable(rejoinPoint, branchVisit);
    add({
      id: 'branch.return',
      code: returns ? 'BRANCH_RETURN_CLEAR' : 'BRANCH_RETURN_BLOCKED',
      status: returns ? 'PASS' : 'FAIL', required: true,
      message: returns
        ? 'The branch anchor returns to the rejoin region.'
        : 'The branch anchor cannot return to the rejoin region.',
      suggestion: 'Keep the secondary route connected to the rejoin region.',
      location: branch.anchor,
    });
    const reachable = walk.isReachable(branchPoint, visit);
    add({
      id: 'branch.spawn',
      code: reachable ? 'BRANCH_PATH_REACHABLE' : 'BRANCH_PATH_BLOCKED',
      status: reachable ? 'PASS' : 'FAIL', required: true,
      message: reachable
        ? 'The branch anchor is reachable from spawn.'
        : 'The branch anchor is unreachable from spawn.',
      suggestion: 'Open the secondary route from the split to the branch.',
      location: branch.anchor,
    });
    const routes = input.routes;
    if (!routes?.branch || routes.main.length === 0) {
      add({
        id: 'branch.routes', code: 'BRANCH_GRAPH', status: 'UNKNOWN', required: true,
        message: 'No route geometry was exposed, so distinct physical paths cannot be proven.',
        suggestion: 'Expose geometry routes or validate a generated panoramic template.',
      });
      return;
    }
    const mainBlocked = routes.main.find(point => !this.freePoint(point, walk));
    add({
      id: 'branch.main-route',
      code: mainBlocked ? 'NAVIGATION_PATH_BLOCKED' : 'BRANCH_MAIN_PATH_CLEAR',
      status: mainBlocked ? 'FAIL' : 'PASS', required: true,
      message: mainBlocked
        ? `Main route is blocked at ${mainBlocked.x},${mainBlocked.y}.`
        : 'Main generated route is clear for the player body.',
      ...(mainBlocked ? {
        suggestion: 'Remove solid tiles from the main route.',
        location: mainBlocked,
      } : {}),
    });
    const branchBlocked = routes.branch.find(point => !this.freePoint(point, walk));
    add({
      id: 'branch.secondary-route',
      code: branchBlocked ? 'BRANCH_PATH_BLOCKED' : 'BRANCH_PATH_CLEAR',
      status: branchBlocked ? 'FAIL' : 'PASS', required: true,
      message: branchBlocked
        ? `Secondary route is blocked at ${branchBlocked.x},${branchBlocked.y}.`
        : 'Secondary generated route is clear for the player body.',
      ...(branchBlocked ? {
        suggestion: 'Remove solid tiles from the secondary route.',
        location: branchBlocked,
      } : {}),
    });
    const mainBetween = this.middlePoints(
      routes.main.filter(point => point.x >= split.anchor!.x && point.x <= rejoin.anchor!.x),
    );
    const branchBarrier = this.routeBarrier(
      walk, this.middlePoints(routes.branch), [splitPoint, rejoinPoint],
    );
    const withoutBranch = walk.bfs(splitPoint, branchBarrier);
    const mainSurvives = walk.isReachable(rejoinPoint, withoutBranch);
    add({
      id: 'branch.main-survives',
      code: mainSurvives ? 'BRANCH_MAIN_PATH_CLEAR' : 'BRANCH_MAIN_PATH_BLOCKED',
      status: mainSurvives ? 'PASS' : 'FAIL', required: true,
      message: mainSurvives
        ? 'The main route still reaches rejoin when the secondary band is ignored.'
        : 'The main route cannot reach rejoin without the secondary band.',
      suggestion: 'Keep a continuous main corridor between split and rejoin.',
    });
    const mainBarrier = this.routeBarrier(walk, mainBetween, [splitPoint, rejoinPoint]);
    const withoutMain = walk.bfs(splitPoint, mainBarrier);
    const branchSurvives = walk.isReachable(rejoinPoint, withoutMain);
    add({
      id: 'branch.branch-survives',
      code: branchSurvives ? 'BRANCH_PATH_CLEAR' : 'BRANCH_PATH_BLOCKED',
      status: branchSurvives ? 'PASS' : 'FAIL', required: true,
      message: branchSurvives
        ? 'The secondary route reaches rejoin when the main band is ignored.'
        : 'The secondary route cannot reach rejoin when the main band is ignored.',
      suggestion: 'Keep the secondary route physically independent until rejoin.',
    });
  }

  private camera(
    level: LevelDefinition | undefined,
    add: (check: PlaytestCheck) => void,
  ): PlaytestCameraResult {
    if (!level || !isRectangular(level.tileMap)) {
      add({
        id: 'camera.bounds', code: 'CAMERA_BOUNDS_INVALID', status: 'FAIL', required: true,
        message: 'Camera bounds cannot be derived without a valid map.',
      });
      return Object.freeze({
        status: 'FAIL' as const,
        worldWidth: null,
        worldHeight: null,
        viewportWidth: CAMERA_VIEWPORT.width,
        viewportHeight: CAMERA_VIEWPORT.height,
        message: 'Camera bounds cannot be derived without a valid map.',
      });
    }
    const worldWidth = (level.tileMap[0]?.length ?? 0) * TILE;
    const worldHeight = level.tileMap.length * TILE;
    const valid = worldWidth > 0 && worldHeight > 0;
    add({
      id: 'camera.bounds',
      code: valid ? 'CAMERA_BOUNDS_VALID' : 'CAMERA_BOUNDS_INVALID',
      status: valid ? 'PASS' : 'FAIL', required: true,
      message: valid
        ? `World bounds ${worldWidth}x${worldHeight} are valid for the ${CAMERA_VIEWPORT.width}x${CAMERA_VIEWPORT.height} camera.`
        : 'Map dimensions produce invalid camera bounds.',
      suggestion: 'Provide a map with positive width and height.',
    });
    return Object.freeze({
      status: valid ? 'PASS' as const : 'FAIL' as const,
      worldWidth,
      worldHeight,
      viewportWidth: CAMERA_VIEWPORT.width,
      viewportHeight: CAMERA_VIEWPORT.height,
      message: valid ? 'Camera world bounds are valid.' : 'Camera world bounds are invalid.',
    });
  }

  private checkCameraFollow(add: (check: PlaytestCheck) => void): void {
    add({
      id: 'camera.follow', code: 'CAMERA_FOLLOW_UNVERIFIED', status: 'UNKNOWN',
      required: false,
      message: 'Camera follow and parallax were not executed; only world bounds were checked.',
      suggestion: 'Verify the camera during the Phaser preview.',
    });
  }

  private navigationTarget(
    id: string,
    target: Point,
    kind: 'exit' | 'npc' | 'encounter',
    referenceId: string,
    label: string,
    walk: ClearanceWalk,
    visit: Visit,
    add: (check: PlaytestCheck) => void,
    tileMap: readonly (readonly number[])[],
    spawn: Point,
    required = true,
  ): void {
    const free = walk.nearestFree(target.x * TILE + TILE / 2, target.y * TILE + TILE / 2, TILE * 3);
    if (!free) {
      add({
        id, code: kind === 'exit' ? 'EXIT_UNREACHABLE' : kind === 'npc' ? 'NPC_UNREACHABLE' : 'ENCOUNTER_UNREACHABLE',
        status: 'FAIL', required,
        message: `${label} at ${target.x},${target.y} has no free position for the player body.`,
        suggestion: 'Widen the area around the target so the real player body fits.',
        referenceId, location: target,
      });
      return;
    }
    if (walk.isReachable(free, visit)) {
      add({
        id, code: kind === 'exit' ? 'EXIT_REACHABLE' : kind === 'npc' ? 'NPC_REACHABLE' : 'ENCOUNTER_REACHABLE',
        status: 'PASS', required,
        message: `${label} at ${target.x},${target.y} is reachable with a ${walk.step}px clearance grid.`,
        referenceId, location: target,
      });
      return;
    }
    const path = tilePath(tileSearch(tileMap, spawn), target);
    const blocked = path.find(point => {
      const near = walk.nearestFree(point.x * TILE + TILE / 2, point.y * TILE + TILE / 2, TILE);
      return !near || !walk.isReachable(near, visit);
    });
    const narrow = path.length > 0;
    add({
      id,
      code: narrow ? 'PASSAGE_TOO_NARROW' : kind === 'exit' ? 'EXIT_UNREACHABLE'
        : kind === 'npc' ? 'NPC_UNREACHABLE' : 'ENCOUNTER_UNREACHABLE',
      status: 'FAIL', required,
      message: narrow
        ? `${label} at ${target.x},${target.y} is reachable by tiles but not by the ${walk.step === 8 ? '29x39 player body' : 'player body'} (first blocked point ${blocked?.x ?? target.x},${blocked?.y ?? target.y}).`
        : `${label} at ${target.x},${target.y} is unreachable from spawn.`,
      suggestion: narrow
        ? 'Widen the passage so the real player body fits, including its vertical offset.'
        : 'Remove or reposition solid tiles between spawn and the target.',
      referenceId,
      location: blocked ?? target,
    });
  }

  private navigationOutcome(
    target: Point,
    walk: ClearanceWalk,
    visit: Visit,
    kind: 'region' | 'exit' | 'objective',
    add: (check: PlaytestCheck) => void,
    referenceId: string,
  ): { readonly status: PlaytestStatus; readonly code: string; readonly message: string;
    readonly distance: number | null } {
    const codePrefix = kind === 'exit' ? 'EXIT' : kind === 'objective' ? 'OBJECTIVE' : 'REGION';
    const free = walk.nearestFree(target.x * TILE + TILE / 2, target.y * TILE + TILE / 2, TILE * 3);
    if (!free) {
      add({
        id: `region.${referenceId}`, code: `${codePrefix}_UNREACHABLE`,
        status: 'FAIL', required: true,
        message: `Region ${referenceId} at ${target.x},${target.y} has no free position for the player body.`,
        suggestion: 'Widen the region area or move its anchor.',
        referenceId, location: target,
      });
      return {
        status: 'FAIL', code: `${codePrefix}_UNREACHABLE`,
        message: `Region ${referenceId} has no free position.`, distance: null,
      };
    }
    if (walk.isReachable(free, visit)) {
      const distance = walk.distanceAt(free, visit);
      add({
        id: `region.${referenceId}`, code: `${codePrefix}_REACHABLE`,
        status: 'PASS', required: true,
        message: `Region ${referenceId} at ${target.x},${target.y} is reachable by the player body.`,
        referenceId, location: target,
      });
      return {
        status: 'PASS', code: `${codePrefix}_REACHABLE`,
        message: `Region ${referenceId} is reachable.`, distance,
      };
    }
    add({
      id: `region.${referenceId}`, code: `${codePrefix}_UNREACHABLE`,
      status: 'FAIL', required: true,
      message: `Region ${referenceId} at ${target.x},${target.y} is unreachable from spawn.`,
      suggestion: 'Open a physical path from spawn to the region.',
      referenceId, location: target,
    });
    return {
      status: 'FAIL', code: `${codePrefix}_UNREACHABLE`,
      message: `Region ${referenceId} is unreachable.`, distance: null,
    };
  }

  private tileReachability(
    anchor: { readonly kind: string; readonly x?: number; readonly y?: number },
    walk: ClearanceWalk,
    visit: Visit,
  ): Tri {
    if (anchor.kind !== 'tile' || typeof anchor.x !== 'number' || typeof anchor.y !== 'number') {
      return 'unknown';
    }
    const free = walk.nearestFree(anchor.x * TILE + TILE / 2, anchor.y * TILE + TILE / 2, TILE * 3);
    if (!free) return 'no';
    return walk.isReachable(free, visit) ? 'yes' : 'no';
  }

  private freePoint(point: Point, walk: ClearanceWalk): Point | undefined {
    return walk.nearestFree(point.x * TILE + TILE / 2, point.y * TILE + TILE / 2, TILE * 3);
  }

  /**
   * The template routes converge at split/rejoin. Testing the middle of each
   * route avoids a false failure caused by the shared approach segments.
   */
  private middlePoints(route: readonly Point[]): readonly Point[] {
    if (route.length < 5) return route;
    const from = Math.floor(route.length * 0.3);
    const to = Math.ceil(route.length * 0.7);
    return route.slice(from, to);
  }

  /** Builds a fine-grid barrier around a route band, keeping endpoints usable. */
  private routeBarrier(
    walk: ClearanceWalk,
    route: readonly Point[],
    keep: readonly Point[],
  ): Uint8Array {
    const barrier = new Uint8Array(walk.cols * walk.rows);
    const radius = TILE * 1.25;
    route.forEach(point => {
      const center = { x: point.x * TILE + TILE / 2, y: point.y * TILE + TILE / 2 };
      if (keep.some(endpoint =>
        Math.hypot(endpoint.x - center.x, endpoint.y - center.y) <= TILE * 2)) return;
      const minimumCol = Math.max(0, Math.floor((center.x - radius) / walk.step));
      const maximumCol = Math.min(walk.cols - 1, Math.ceil((center.x + radius) / walk.step));
      const minimumRow = Math.max(0, Math.floor((center.y - radius) / walk.step));
      const maximumRow = Math.min(walk.rows - 1, Math.ceil((center.y + radius) / walk.step));
      for (let row = minimumRow; row <= maximumRow; row += 1) {
        for (let col = minimumCol; col <= maximumCol; col += 1) {
          const sample = walk.samplePoint(col, row);
          if (Math.hypot(sample.x - center.x, sample.y - center.y) <= radius) {
            barrier[row * walk.cols + col] = 1;
          }
        }
      }
    });
    return barrier;
  }

  private findTile(tileMap: readonly (readonly number[])[], tile: number): Point | undefined {
    for (let y = 0; y < tileMap.length; y += 1) {
      for (let x = 0; x < (tileMap[y]?.length ?? 0); x += 1) {
        if (tileMap[y][x] === tile) return { x, y };
      }
    }
    return undefined;
  }

  private findTiles(tileMap: readonly (readonly number[])[], tile: number): readonly Point[] {
    const result: Point[] = [];
    tileMap.forEach((row, y) => row.forEach((value, x) => {
      if (value === tile) result.push({ x, y });
    }));
    return result;
  }

  private finish(
    seed: number | null,
    source: PlaytestSeedSource,
    checks: readonly PlaytestCheck[],
    regions: readonly PlaytestRegionResult[],
    camera: PlaytestCameraResult,
  ): StagePlaytestSeedReport {
    const sortedChecks = stableSort(checks, check => check.id);
    const required = sortedChecks.filter(check => check.required);
    const result: PlaytestStatus = required.some(check => check.status === 'FAIL') ? 'FAIL'
      : required.some(check => check.status === 'UNKNOWN') ? 'UNKNOWN'
        : 'PASS';
    const diagnostics: PlaytestDiagnostic[] = sortedChecks
      .filter(check => check.status !== 'PASS')
      .map(check => Object.freeze({
        code: check.code,
        severity: check.status === 'FAIL' ? 'error' as const : 'warning' as const,
        message: check.message,
        path: Object.freeze(['checks', check.id]),
        ...(check.referenceId ? { referenceId: check.referenceId } : {}),
        ...(check.location ? { location: check.location } : {}),
        ...(check.suggestion ? { suggestion: check.suggestion } : {}),
      }));
    return Object.freeze({
      seed,
      source,
      result,
      character: PLAYTEST_CHARACTER,
      checks: sortedChecks,
      diagnostics: Object.freeze(diagnostics),
      regions: stableSort(regions, region => region.id),
      camera,
      liveExecution: 'not-executed' as const,
    });
  }
}
