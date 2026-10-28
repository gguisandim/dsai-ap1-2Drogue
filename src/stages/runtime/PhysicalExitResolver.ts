import type { LevelDefinition } from '../../data/LevelData';
import { isWalkableTile, TileKind } from '../../procedural';
import type {
  CampaignEdge,
  CampaignNode,
  LoadedStage,
  PhysicalExit,
  PhysicalExitDiagnostic,
  PhysicalExitDiagnosticCode,
  PhysicalExitFailureCode,
  PhysicalExitRequest,
  PhysicalExitResolution,
  PhysicalExitResult,
  StageAnchor,
} from '../contracts';

const CARDINAL = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
] as const;

const MINIMUM_SEPARATIONS = [3, 2, 1, 1] as const;
const MAXIMUM_ATTEMPTS = MINIMUM_SEPARATIONS.length;
const STABLE_ID = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;

interface Point {
  readonly x: number;
  readonly y: number;
}

interface Bounds {
  readonly width: number;
  readonly height: number;
}

interface ExplicitCandidate {
  readonly stageExitId: string;
  readonly points: readonly Point[];
}

interface ResolverInput {
  readonly node: CampaignNode;
  readonly edges: readonly CampaignEdge[];
  readonly stage: LoadedStage;
  readonly level: LevelDefinition;
  readonly bounds: Bounds;
  readonly spawn: Point;
  readonly reachable: ReadonlySet<string>;
  readonly reserved: ReadonlySet<string>;
  readonly explicit: readonly ExplicitCandidate[];
  readonly digest: string;
}

type Validation =
  | { readonly ok: true; readonly input: ResolverInput }
  | { readonly ok: false; readonly code: PhysicalExitFailureCode };

type Path = readonly (string | number)[];

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isStableId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value === value.trim() && STABLE_ID.test(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value === value.trim();
}

function isPoint(value: unknown): value is Point {
  return isRecord(value) && Number.isInteger(value.x) && Number.isInteger(value.y);
}

function compareStrings(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function pointKey(point: Point): string {
  return `${point.x},${point.y}`;
}

function samePoint(left: Point, right: Point): boolean {
  return left.x === right.x && left.y === right.y;
}

function chebyshev(left: Point, right: Point): number {
  return Math.max(Math.abs(left.x - right.x), Math.abs(left.y - right.y));
}

function hashParts(...parts: readonly (string | number)[]): number {
  const text = parts.map(part => {
    const value = String(part);
    return `${value.length}:${value}`;
  }).join('|');
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function hashHex(...parts: readonly (string | number)[]): string {
  return hashParts(...parts).toString(16).padStart(8, '0');
}

function inBounds(point: Point, bounds: Bounds): boolean {
  return Number.isInteger(point.x) && Number.isInteger(point.y) &&
    point.x >= 0 && point.y >= 0 && point.x < bounds.width && point.y < bounds.height;
}

function tileAt(level: LevelDefinition, point: Point): number {
  return level.tileMap[point.y][point.x];
}

function isFreeTile(tile: number, attempt: number): boolean {
  if (attempt < MAXIMUM_ATTEMPTS - 1) return tile === TileKind.Floor;
  return tile === TileKind.Floor || tile === TileKind.Exit || tile === TileKind.Boss;
}

function isExplicitTile(tile: number): boolean {
  return tile === TileKind.Floor || tile === TileKind.Exit || tile === TileKind.Boss;
}

function hasClearance(level: LevelDefinition, point: Point, bounds: Bounds): boolean {
  if (point.x <= 0 || point.y <= 0 ||
    point.x >= bounds.width - 1 || point.y >= bounds.height - 1) return false;
  return CARDINAL.some(direction => {
    const next = { x: point.x + direction.x, y: point.y + direction.y };
    return inBounds(next, bounds) && isWalkableTile(tileAt(level, next));
  });
}

function isBorderAdjacent(level: LevelDefinition, point: Point, bounds: Bounds): boolean {
  return CARDINAL.some(direction => {
    const next = { x: point.x + direction.x, y: point.y + direction.y };
    if (!inBounds(next, bounds)) return true;
    const tile = tileAt(level, next);
    return tile === TileKind.Wall || tile === TileKind.Pillar;
  });
}

function findTiles(level: LevelDefinition, tile: TileKind): Point[] {
  const result: Point[] = [];
  level.tileMap.forEach((row, y) => row.forEach((value, x) => {
    if (value === tile) result.push({ x, y });
  }));
  return result;
}

function anchorKey(anchor: StageAnchor): string {
  if (anchor.kind === 'tile') return `tile:${anchor.x},${anchor.y}`;
  if (anchor.kind === 'player-spawn') {
    return `spawn:${anchor.offsetX ?? 0},${anchor.offsetY ?? 0}`;
  }
  return 'map-exit';
}

function isAnchor(value: unknown): value is StageAnchor {
  if (!isRecord(value)) return false;
  if (value.kind === 'tile') return Number.isInteger(value.x) && Number.isInteger(value.y);
  if (value.kind === 'player-spawn') {
    return (value.offsetX === undefined || Number.isInteger(value.offsetX)) &&
      (value.offsetY === undefined || Number.isInteger(value.offsetY));
  }
  return value.kind === 'map-exit';
}

function pushDiagnostic(
  diagnostics: PhysicalExitDiagnostic[],
  code: PhysicalExitDiagnosticCode,
  message: string,
  path: Path,
  referenceId?: string,
): void {
  diagnostics.push({
    code,
    severity: 'error',
    message,
    path,
    ...(referenceId ? { referenceId } : {}),
  });
}

function sortDiagnostics(diagnostics: PhysicalExitDiagnostic[]): readonly PhysicalExitDiagnostic[] {
  diagnostics.sort((left, right) => {
    const leftKey = `${left.path.map(String).join('.')}|${left.code}|${left.referenceId ?? ''}`;
    const rightKey = `${right.path.map(String).join('.')}|${right.code}|${right.referenceId ?? ''}`;
    return compareStrings(leftKey, rightKey);
  });
  return Object.freeze(diagnostics.map(diagnostic => Object.freeze({ ...diagnostic })));
}

function levelDigest(stage: LoadedStage, level: LevelDefinition): string {
  const points = (values: readonly Point[]): string =>
    values.map(pointKey).sort(compareStrings).join(';');
  const enemies = [
    ...(Array.isArray(level.enemies) ? level.enemies : []),
    ...(Array.isArray(level.ambush) ? level.ambush : []),
    ...(Array.isArray(level.waves) ? level.waves.flatMap(wave =>
      Array.isArray(wave.enemies) ? wave.enemies : []) : []),
  ];
  const patrol = enemies.flatMap(enemy => Array.isArray(enemy.patrol) ? enemy.patrol : []);
  const legacyExits = (Array.isArray(level.exits) ? level.exits : []).flatMap(exit => [
    { x: exit.x, y: exit.y },
    { x: exit.spawnX, y: exit.spawnY },
  ]);
  const npcAnchors = (Array.isArray(stage.npcs) ? stage.npcs : [])
    .map(npc => anchorKey(npc.spawn))
    .sort(compareStrings);
  const manifestExits = (Array.isArray(stage.manifest.exits) ? stage.manifest.exits : [])
    .map(exit => `${exit.id}:${anchorKey(exit.anchor)}`)
    .sort(compareStrings);
  const material = [
    level.id,
    level.tileMap.map(row => row.join(',')).join(';'),
    points(findTiles(level, TileKind.Spawn)),
    points(findTiles(level, TileKind.Exit)),
    points(findTiles(level, TileKind.Boss)),
    points(enemies),
    points(patrol),
    points(Array.isArray(level.items) ? level.items : []),
    points(Array.isArray(level.decorations) ? level.decorations : []),
    points(legacyExits),
    ...npcAnchors,
    ...manifestExits,
  ];
  return `level.${hashHex('level', ...material)}`;
}

function reachableFrom(level: LevelDefinition, start: Point, bounds: Bounds): ReadonlySet<string> {
  const visited = new Set<string>([pointKey(start)]);
  const queue: Point[] = [start];
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const current = queue[cursor];
    for (const direction of CARDINAL) {
      const next = { x: current.x + direction.x, y: current.y + direction.y };
      if (!inBounds(next, bounds)) continue;
      const key = pointKey(next);
      if (visited.has(key)) continue;
      if (!isWalkableTile(tileAt(level, next))) continue;
      visited.add(key);
      queue.push(next);
    }
  }
  return visited;
}

function isReachablePath(level: LevelDefinition, start: Point, target: Point, bounds: Bounds): boolean {
  if (samePoint(start, target)) return true;
  const visited = new Set<string>([pointKey(start)]);
  const queue: Point[] = [start];
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const current = queue[cursor];
    for (const direction of CARDINAL) {
      const next = { x: current.x + direction.x, y: current.y + direction.y };
      if (!inBounds(next, bounds)) continue;
      const key = pointKey(next);
      if (visited.has(key)) continue;
      if (!isWalkableTile(tileAt(level, next))) continue;
      if (samePoint(next, target)) return true;
      visited.add(key);
      queue.push(next);
    }
  }
  return false;
}

function anchorPoints(
  anchor: StageAnchor,
  spawn: Point,
  level: LevelDefinition,
  bounds: Bounds,
): Point[] {
  if (anchor.kind === 'tile') {
    const point = { x: anchor.x, y: anchor.y };
    return inBounds(point, bounds) ? [point] : [];
  }
  if (anchor.kind === 'player-spawn') {
    const point = {
      x: spawn.x + (anchor.offsetX ?? 0),
      y: spawn.y + (anchor.offsetY ?? 0),
    };
    return inBounds(point, bounds) ? [point] : [];
  }
  const exits = findTiles(level, TileKind.Exit);
  const points = exits.length > 0 ? exits : findTiles(level, TileKind.Boss);
  return points.sort((left, right) => left.y - right.y || left.x - right.x);
}

/**
 * Resolves campaign edge exits into distinct, reachable tiles of a loaded
 * stage. It never mutates the level, the manifest or the campaign graph.
 */
export class PhysicalExitResolver {
  public resolve(request: PhysicalExitRequest): PhysicalExitResult {
    try {
      return this.resolveValidated(request);
    } catch (error) {
      const diagnostics: PhysicalExitDiagnostic[] = [];
      pushDiagnostic(
        diagnostics,
        'physical-exit.request-invalid',
        `Physical exit resolution failed unexpectedly: ` +
        `${error instanceof Error ? error.message : 'unknown error'}.`,
        ['request'],
      );
      return this.failure('invalid-request', diagnostics);
    }
  }

  private resolveValidated(request: PhysicalExitRequest): PhysicalExitResult {
    const diagnostics: PhysicalExitDiagnostic[] = [];
    const validation = this.validateRequest(request, diagnostics);
    if (!validation.ok) {
      return this.failure(validation.code, diagnostics);
    }
    const input = validation.input;

    if (input.edges.length > input.node.maximumPhysicalExits) {
      pushDiagnostic(
        diagnostics,
        'physical-exit.capacity-exceeded',
        `Node ${input.node.id} declares ${input.edges.length} exits but supports ` +
        `${input.node.maximumPhysicalExits}.`,
        ['node', 'maximumPhysicalExits'],
        input.node.id,
      );
      return this.failure('insufficient-exit-space', diagnostics);
    }

    if (input.edges.length === 0) {
      return {
        ok: true,
        value: {
          nodeId: input.node.id,
          stageId: input.node.stageId,
          levelDigest: input.digest,
          exits: [],
        },
      };
    }

    for (let attempt = 0; attempt < MAXIMUM_ATTEMPTS; attempt += 1) {
      const attemptDiagnostics: PhysicalExitDiagnostic[] = [];
      const exits = this.attempt(input, attempt, attemptDiagnostics);
      if (exits) {
        return {
          ok: true,
          value: {
            nodeId: input.node.id,
            stageId: input.node.stageId,
            levelDigest: input.digest,
            exits,
          },
        };
      }
      diagnostics.push(...attemptDiagnostics);
    }

    pushDiagnostic(
      diagnostics,
      'physical-exit.insufficient-space',
      `No deterministic placement satisfied ${input.edges.length} exits for node ${input.node.id}.`,
      ['node'],
      input.node.id,
    );
    return this.failure('insufficient-exit-space', diagnostics);
  }

  private attempt(
    input: ResolverInput,
    attempt: number,
    diagnostics: PhysicalExitDiagnostic[],
  ): readonly PhysicalExit[] | undefined {
    const minimumSeparation = MINIMUM_SEPARATIONS[attempt];
    const chosen: PhysicalExit[] = [];
    const chosenPoints: Point[] = [];
    const usedExplicitIds = new Set<string>();
    const usedStageExitIds = new Set<string>();
    const reservedStageExitIds = new Set(input.explicit.map(candidate => candidate.stageExitId));

    for (const edge of input.edges) {
      const explicit = this.findExplicitCandidate(
        input,
        edge,
        chosenPoints,
        usedExplicitIds,
        usedStageExitIds,
        minimumSeparation,
      );
      let tile: Point | undefined;
      let stageExitId: string | undefined;
      if (explicit) {
        tile = explicit.tile;
        stageExitId = explicit.stageExitId;
        usedExplicitIds.add(explicit.stageExitId);
      } else {
        tile = this.selectFreeTile(input, edge, chosenPoints, minimumSeparation, attempt);
        if (!tile) {
          pushDiagnostic(
            diagnostics,
            'physical-exit.insufficient-space',
            `Attempt ${attempt} found no free tile for edge ${edge.id}.`,
            ['edges', edge.id],
            edge.id,
          );
          return undefined;
        }
        stageExitId = this.freeStageExitId(edge, usedStageExitIds, reservedStageExitIds);
        if (!stageExitId) {
          pushDiagnostic(
            diagnostics,
            'physical-exit.insufficient-space',
            `Attempt ${attempt} found no unique stage exit id for edge ${edge.id}.`,
            ['edges', edge.id],
            edge.id,
          );
          return undefined;
        }
      }

      chosen.push({
        id: edge.physicalExitId,
        edgeId: edge.id,
        sourceNodeId: input.node.id,
        targetNodeId: edge.targetNodeId,
        stageExitId,
        tile,
        placementAttempt: attempt as PhysicalExit['placementAttempt'],
      });
      chosenPoints.push(tile);
      usedStageExitIds.add(stageExitId);
    }

    if (!this.revalidate(input, chosen, minimumSeparation)) {
      pushDiagnostic(
        diagnostics,
        'physical-exit.placement-invalid',
        `Attempt ${attempt} failed final placement validation.`,
        ['exits'],
      );
      return undefined;
    }
    return chosen.sort((left, right) => compareStrings(left.edgeId, right.edgeId));
  }

  private findExplicitCandidate(
    input: ResolverInput,
    edge: CampaignEdge,
    chosenPoints: readonly Point[],
    usedExplicitIds: ReadonlySet<string>,
    usedStageExitIds: ReadonlySet<string>,
    minimumSeparation: number,
  ): { readonly tile: Point; readonly stageExitId: string } | undefined {
    const preferred = input.explicit.filter(candidate => candidate.stageExitId === edge.exitSlotId);
    const remaining = input.explicit.filter(candidate => candidate.stageExitId !== edge.exitSlotId);
    for (const candidate of [...preferred, ...remaining]) {
      if (usedExplicitIds.has(candidate.stageExitId)) continue;
      if (usedStageExitIds.has(candidate.stageExitId)) continue;
      for (const point of candidate.points) {
        if (!isExplicitTile(tileAt(input.level, point))) continue;
        if (!this.isAvailable(input, point, chosenPoints, minimumSeparation)) continue;
        return { tile: point, stageExitId: candidate.stageExitId };
      }
    }
    return undefined;
  }

  private selectFreeTile(
    input: ResolverInput,
    edge: CampaignEdge,
    chosenPoints: readonly Point[],
    minimumSeparation: number,
    attempt: number,
  ): Point | undefined {
    const explicitPoints = new Set<string>();
    for (const candidate of input.explicit) {
      for (const point of candidate.points) explicitPoints.add(pointKey(point));
    }
    const candidates: Array<{
      readonly point: Point;
      readonly distance: number;
      readonly border: number;
      readonly hash: string;
    }> = [];
    for (let y = 0; y < input.bounds.height; y += 1) {
      for (let x = 0; x < input.bounds.width; x += 1) {
        const point = { x, y };
        if (explicitPoints.has(pointKey(point))) continue;
        if (!isFreeTile(tileAt(input.level, point), attempt)) continue;
        if (!this.isAvailable(input, point, chosenPoints, minimumSeparation)) continue;
        const distance = chosenPoints.length === 0
          ? chebyshev(input.spawn, point)
          : Math.min(...chosenPoints.map(chosen => chebyshev(chosen, point)));
        candidates.push({
          point,
          distance,
          border: isBorderAdjacent(input.level, point, input.bounds) ? 0 : 1,
          hash: hashHex('exit', input.node.stageSeed, edge.id, attempt, x, y),
        });
      }
    }
    if (candidates.length === 0) return undefined;
    candidates.sort((left, right) =>
      right.distance - left.distance ||
      left.border - right.border ||
      compareStrings(left.hash, right.hash) ||
      left.point.y - right.point.y ||
      left.point.x - right.point.x);
    return candidates[0].point;
  }

  private freeStageExitId(
    edge: CampaignEdge,
    used: ReadonlySet<string>,
    reserved: ReadonlySet<string>,
  ): string | undefined {
    for (const candidate of [edge.exitSlotId, edge.physicalExitId, edge.id]) {
      if (isStableId(candidate) && !used.has(candidate) && !reserved.has(candidate)) return candidate;
    }
    for (let index = 1; index <= 9; index += 1) {
      const candidate = `${edge.physicalExitId}.${index}`;
      if (!used.has(candidate) && !reserved.has(candidate)) return candidate;
    }
    return undefined;
  }

  private isAvailable(
    input: ResolverInput,
    point: Point,
    chosenPoints: readonly Point[],
    minimumSeparation: number,
  ): boolean {
    if (!inBounds(point, input.bounds)) return false;
    const key = pointKey(point);
    if (input.reserved.has(key)) return false;
    if (!input.reachable.has(key)) return false;
    if (!hasClearance(input.level, point, input.bounds)) return false;
    if (chosenPoints.some(chosen => samePoint(chosen, point))) return false;
    return chosenPoints.every(chosen => chebyshev(chosen, point) >= minimumSeparation);
  }

  private revalidate(
    input: ResolverInput,
    exits: readonly PhysicalExit[],
    minimumSeparation: number,
  ): boolean {
    if (exits.length !== input.edges.length) return false;
    const edgeIds = new Set<string>();
    const stageExitIds = new Set<string>();
    const points: Point[] = [];
    for (const exit of exits) {
      if (edgeIds.has(exit.edgeId) || stageExitIds.has(exit.stageExitId)) return false;
      edgeIds.add(exit.edgeId);
      stageExitIds.add(exit.stageExitId);
      if (!inBounds(exit.tile, input.bounds)) return false;
      if (!isWalkableTile(tileAt(input.level, exit.tile))) return false;
      if (input.reserved.has(pointKey(exit.tile))) return false;
      if (!hasClearance(input.level, exit.tile, input.bounds)) return false;
      if (!isReachablePath(input.level, input.spawn, exit.tile, input.bounds)) return false;
      if (points.some(point => samePoint(point, exit.tile))) return false;
      if (!points.every(point => chebyshev(point, exit.tile) >= minimumSeparation)) return false;
      points.push(exit.tile);
    }
    return true;
  }

  private validateRequest(
    request: PhysicalExitRequest,
    diagnostics: PhysicalExitDiagnostic[],
  ): Validation {
    if (!isRecord(request)) {
      pushDiagnostic(diagnostics, 'physical-exit.request-invalid',
        'Physical exit request must be an object.', ['request']);
      return { ok: false, code: 'invalid-request' };
    }
    if (!isRecord(request.node)) {
      pushDiagnostic(diagnostics, 'physical-exit.request-invalid',
        'Request node must be an object.', ['node']);
      return { ok: false, code: 'invalid-request' };
    }
    if (!isRecord(request.stage) || !isRecord(request.stage.manifest) ||
      !isRecord(request.stage.level)) {
      pushDiagnostic(diagnostics, 'physical-exit.request-invalid',
        'Request stage must expose a manifest and a resolved level.', ['stage']);
      return { ok: false, code: 'invalid-request' };
    }

    const node = request.node as CampaignNode;
    const stage = request.stage as LoadedStage;
    const level = request.stage.level as LevelDefinition;
    let valid = true;
    const reject = (message: string, path: Path): void => {
      valid = false;
      pushDiagnostic(diagnostics, 'physical-exit.request-invalid', message, path);
    };

    if (!isStableId(node.id)) reject('Node id must be a stable identifier.', ['node', 'id']);
    if (!isStableId(node.stageId)) reject('Node stageId must be a stable identifier.', ['node', 'stageId']);
    if (!isNonEmptyString(node.stageSeed)) reject('Node stageSeed is required.', ['node', 'stageSeed']);
    if (node.maximumPhysicalExits !== 1 && node.maximumPhysicalExits !== 2 &&
      node.maximumPhysicalExits !== 3) {
      reject('Node maximumPhysicalExits must be 1, 2 or 3.', ['node', 'maximumPhysicalExits']);
    }
    if (!isStableId(stage.manifest.id)) {
      reject('Stage manifest id must be a stable identifier.', ['stage', 'manifest', 'id']);
    } else if (stage.manifest.id !== node.stageId) {
      reject('Node stageId must match the loaded stage.', ['node', 'stageId']);
    }
    if (!Array.isArray(stage.manifest.exits)) {
      reject('Stage manifest exits must be an array.', ['stage', 'manifest', 'exits']);
    }
    if (!this.validTileMap(level)) {
      reject('Stage level must contain a rectangular integer tileMap.', ['stage', 'level', 'tileMap']);
    }
    if (!valid) return { ok: false, code: 'invalid-request' };

    const bounds: Bounds = { width: level.tileMap[0].length, height: level.tileMap.length };
    const spawns = findTiles(level, TileKind.Spawn);
    if (spawns.length === 0) {
      pushDiagnostic(diagnostics, 'physical-exit.entry-missing',
        'Stage has no spawn tile to anchor physical exits.', ['stage', 'level', 'tileMap']);
      return { ok: false, code: 'entry-unreachable' };
    }
    const spawn = spawns[0];
    if (!isWalkableTile(tileAt(level, spawn))) {
      pushDiagnostic(diagnostics, 'physical-exit.entry-unreachable',
        'Stage spawn tile is not walkable.', ['stage', 'level', 'tileMap', spawn.y, spawn.x]);
      return { ok: false, code: 'entry-unreachable' };
    }

    if (!Array.isArray(request.edges)) {
      reject('Request edges must be an array.', ['edges']);
      return { ok: false, code: 'invalid-request' };
    }
    const edges: CampaignEdge[] = [];
    const edgeIds = new Set<string>();
    const physicalExitIds = new Set<string>();
    const exitSlotIds = new Set<string>();
    request.edges.forEach((value, index) => {
      if (!isRecord(value)) {
        reject('Edge must be an object.', ['edges', index]);
        return;
      }
      const edge = value as unknown as CampaignEdge;
      if (!isStableId(edge.id)) reject('Edge id must be stable.', ['edges', index, 'id']);
      if (!isStableId(edge.physicalExitId)) {
        reject('Edge physicalExitId must be stable.', ['edges', index, 'physicalExitId']);
      }
      if (!isStableId(edge.exitSlotId)) {
        reject('Edge exitSlotId must be stable.', ['edges', index, 'exitSlotId']);
      }
      if (edge.sourceNodeId !== node.id) {
        reject(`Edge ${String(edge.id)} belongs to another source node.`, ['edges', index, 'sourceNodeId']);
      }
      if (!isNonEmptyString(edge.targetNodeId)) {
        reject('Edge targetNodeId must be a non-empty identifier.', ['edges', index, 'targetNodeId']);
      }
      if (isStableId(edge.id)) {
        if (edgeIds.has(edge.id)) reject(`Duplicate edge id: ${edge.id}.`, ['edges', index, 'id']);
        edgeIds.add(edge.id);
      }
      if (isStableId(edge.physicalExitId)) {
        if (physicalExitIds.has(edge.physicalExitId)) {
          reject(`Duplicate physical exit id: ${edge.physicalExitId}.`, ['edges', index, 'physicalExitId']);
        }
        physicalExitIds.add(edge.physicalExitId);
      }
      if (isStableId(edge.exitSlotId)) {
        if (exitSlotIds.has(edge.exitSlotId)) {
          reject(`Duplicate exit slot id: ${edge.exitSlotId}.`, ['edges', index, 'exitSlotId']);
        }
        exitSlotIds.add(edge.exitSlotId);
      }
      edges.push(edge);
    });
    if (!valid) return { ok: false, code: 'invalid-request' };

    const manifestExitIds = new Set<string>();
    for (const exit of stage.manifest.exits) {
      if (!isRecord(exit) || !isStableId(exit.id) || !isAnchor(exit.anchor)) {
        reject('Stage manifest exit must declare a stable id and a valid anchor.',
          ['stage', 'manifest', 'exits']);
        break;
      }
      if (manifestExitIds.has(exit.id)) {
        reject(`Duplicate stage exit id: ${exit.id}.`, ['stage', 'manifest', 'exits']);
        break;
      }
      manifestExitIds.add(exit.id);
    }
    if (!valid) return { ok: false, code: 'invalid-request' };

    const reachable = reachableFrom(level, spawn, bounds);
    const reserved = this.collectReserved(stage, level, spawns, bounds);
    const explicit = this.collectExplicit(stage, level, spawn, bounds);
    const digest = levelDigest(stage, level);
    const sortedEdges = [...edges].sort((left, right) => compareStrings(left.id, right.id));
    return {
      ok: true,
      input: {
        node,
        edges: sortedEdges,
        stage,
        level,
        bounds,
        spawn,
        reachable,
        reserved,
        explicit,
        digest,
      },
    };
  }

  private validTileMap(level: LevelDefinition): boolean {
    if (!Array.isArray(level.tileMap) || level.tileMap.length === 0) return false;
    const width = level.tileMap[0]?.length ?? 0;
    if (width === 0) return false;
    return level.tileMap.every(row => Array.isArray(row) && row.length === width &&
      row.every(tile => Number.isInteger(tile) && tile >= TileKind.Floor && tile <= TileKind.Boss));
  }

  private collectReserved(
    stage: LoadedStage,
    level: LevelDefinition,
    spawns: readonly Point[],
    bounds: Bounds,
  ): ReadonlySet<string> {
    const reserved = new Set<string>();
    const add = (point: Point): void => {
      if (inBounds(point, bounds)) reserved.add(pointKey(point));
    };
    spawns.forEach(add);

    const enemies = [
      ...(Array.isArray(level.enemies) ? level.enemies : []),
      ...(Array.isArray(level.ambush) ? level.ambush : []),
      ...(Array.isArray(level.waves) ? level.waves.flatMap(wave =>
        Array.isArray(wave.enemies) ? wave.enemies : []) : []),
    ];
    for (const enemy of enemies) {
      add(enemy);
      if (Array.isArray(enemy.patrol)) enemy.patrol.forEach(add);
    }
    (Array.isArray(level.items) ? level.items : []).forEach(add);
    (Array.isArray(level.decorations) ? level.decorations : []).forEach(add);
    if (Array.isArray(level.exits)) {
      level.exits.forEach(exit => {
        add({ x: exit.x, y: exit.y });
        add({ x: exit.spawnX, y: exit.spawnY });
      });
    }

    const spawn = spawns[0];
    const mapExits = [...findTiles(level, TileKind.Exit), ...findTiles(level, TileKind.Boss)];
    for (const npc of Array.isArray(stage.npcs) ? stage.npcs : []) {
      if (!isAnchor(npc.spawn)) continue;
      if (npc.spawn.kind === 'tile') {
        add({ x: npc.spawn.x, y: npc.spawn.y });
      } else if (npc.spawn.kind === 'player-spawn') {
        add({
          x: spawn.x + (npc.spawn.offsetX ?? 0),
          y: spawn.y + (npc.spawn.offsetY ?? 0),
        });
      } else {
        mapExits.forEach(add);
      }
    }
    return reserved;
  }

  private collectExplicit(
    stage: LoadedStage,
    level: LevelDefinition,
    spawn: Point,
    bounds: Bounds,
  ): readonly ExplicitCandidate[] {
    const candidates: ExplicitCandidate[] = [];
    const exits = [...stage.manifest.exits].sort((left, right) => compareStrings(left.id, right.id));
    for (const exit of exits) {
      const points = anchorPoints(exit.anchor, spawn, level, bounds);
      if (points.length > 0) {
        candidates.push({ stageExitId: exit.id, points });
      }
    }
    return candidates;
  }

  private failure(
    code: PhysicalExitFailureCode,
    diagnostics: PhysicalExitDiagnostic[],
  ): PhysicalExitResult {
    return { ok: false, error: { code, diagnostics: sortDiagnostics(diagnostics) } };
  }
}
