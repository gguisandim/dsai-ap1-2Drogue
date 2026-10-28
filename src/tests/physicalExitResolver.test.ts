import {
  PhysicalExitResolver,
} from '../stages';
import type {
  CampaignEdge,
  CampaignNode,
  LoadedStage,
  PhysicalExitResolution,
  PhysicalExitResult,
  StageAnchor,
  StageExitDefinition,
} from '../stages';
import type {
  DecorationPlacement,
  EnemyPlacement,
  ItemPlacement,
  LevelDefinition,
} from '../data/LevelData';

const WALL = 1;
const PILLAR = 2;
const PIT = 3;
const LAVA = 4;
const EXIT = 5;
const CHEST = 7;
const SPAWN = 8;

function makeLevel(
  tileMap: number[][],
  overrides: Partial<LevelDefinition> = {},
): LevelDefinition {
  return {
    id: 'level.test',
    name: 'Test Level',
    description: 'A headless physical exit fixture.',
    theme: 'gothic_cathedral',
    music: 'none',
    ambientColor: 0,
    fogColor: 0,
    fogDensity: 0,
    lightIntensity: 1,
    tileMap,
    enemies: [],
    items: [],
    decorations: [],
    parTime: 30,
    difficulty: 1,
    ...overrides,
  };
}

function makeStage(
  level: LevelDefinition,
  exits: readonly StageExitDefinition[] = [],
  npcs: LoadedStage['npcs'] = [],
): LoadedStage {
  return {
    manifest: {
      schemaVersion: 1,
      id: level.id,
      revision: 1,
      chapterId: 'chapter.test',
      order: 0,
      title: level.name,
      summary: level.description,
      layout: { kind: 'authored' },
      exits,
    },
    level,
    narrative: {},
    npcs,
    dialogues: [],
    missions: [],
    events: [],
    diagnostics: [],
  };
}

function makeNode(overrides: Partial<CampaignNode> = {}): CampaignNode {
  return {
    id: 'node.campaign.test.run.1.act-1.entry.main',
    slotId: 'act-1.entry',
    templateId: 'region.a',
    templateRevision: 1,
    stageId: 'level.test',
    stageSeed: 'stage.01234567',
    actId: 'act-1',
    depth: 0,
    branchId: 'main',
    kind: 'intermediate',
    biomeId: 'cathedral',
    difficulty: 1,
    providesBeatIds: [],
    maximumPhysicalExits: 3,
    ...overrides,
  };
}

function makeEdge(id: string, target: string, source?: string): CampaignEdge {
  return {
    id,
    sourceNodeId: source ?? 'node.campaign.test.run.1.act-1.entry.main',
    targetNodeId: target,
    exitSlotId: `exit.${id}`,
    physicalExitId: `physical.${id}`,
    kind: 'forward',
    traversalLimit: 1,
  };
}

function exitDefinition(id: string, anchor: StageAnchor): StageExitDefinition {
  return { id, anchor, targetStageId: 'campaign.complete' };
}

function resolve(
  node: CampaignNode,
  edges: readonly CampaignEdge[],
  stage: LoadedStage,
): PhysicalExitResult {
  return new PhysicalExitResolver().resolve({ node, edges, stage });
}

function expectResolution(result: PhysicalExitResult): PhysicalExitResolution {
  if (!result.ok) throw new Error(JSON.stringify(result.error));
  return result.value;
}

function tileMapCopy(tileMap: readonly (readonly number[])[]): number[][] {
  return tileMap.map(row => [...row]);
}

function reachable(level: LevelDefinition, start: { x: number; y: number }, target: { x: number; y: number }): boolean {
  const height = level.tileMap.length;
  const width = level.tileMap[0].length;
  const visited = new Set<string>([`${start.x},${start.y}`]);
  const queue = [start];
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const current = queue[cursor];
    const neighbors = [
      { x: current.x, y: current.y - 1 },
      { x: current.x + 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x - 1, y: current.y },
    ];
    for (const next of neighbors) {
      if (next.x < 0 || next.y < 0 || next.x >= width || next.y >= height) continue;
      const key = `${next.x},${next.y}`;
      if (visited.has(key)) continue;
      const tile = level.tileMap[next.y][next.x];
      if (tile !== 0 && tile !== 5 && tile !== 8 && tile !== 9 && tile !== 6 && tile !== 7) continue;
      if (next.x === target.x && next.y === target.y) return true;
      visited.add(key);
      queue.push(next);
    }
  }
  return start.x === target.x && start.y === target.y;
}

function pairwiseDistance(exits: PhysicalExitResolution['exits']): number {
  let minimum = Number.POSITIVE_INFINITY;
  for (let index = 0; index < exits.length; index += 1) {
    for (let other = index + 1; other < exits.length; other += 1) {
      minimum = Math.min(minimum, Math.max(
        Math.abs(exits[index].tile.x - exits[other].tile.x),
        Math.abs(exits[index].tile.y - exits[other].tile.y),
      ));
    }
  }
  return minimum;
}

const ROOM = [
  [WALL, WALL, WALL, WALL, WALL, WALL, WALL],
  [WALL, SPAWN, 0, 0, 0, 0, WALL],
  [WALL, 0, 0, 0, 0, 0, WALL],
  [WALL, 0, 0, 0, 0, 0, WALL],
  [WALL, 0, 0, 0, 0, 0, WALL],
  [WALL, WALL, WALL, WALL, WALL, WALL, WALL],
];

const TINY = [
  [WALL, WALL, WALL],
  [WALL, SPAWN, WALL],
  [WALL, WALL, WALL],
];

const SPLIT = [
  [WALL, WALL, WALL, WALL, WALL, WALL, WALL],
  [WALL, SPAWN, WALL, WALL, 0, 0, WALL],
  [WALL, WALL, WALL, WALL, 0, 0, WALL],
  [WALL, WALL, WALL, WALL, WALL, WALL, WALL],
];

const SMALL = [
  [WALL, WALL, WALL, WALL, WALL],
  [WALL, SPAWN, 0, 0, WALL],
  [WALL, 0, 0, 0, WALL],
  [WALL, 0, 0, 0, WALL],
  [WALL, WALL, WALL, WALL, WALL],
];

function enemy(x: number, y: number): EnemyPlacement {
  return { type: 'shade', x, y, level: 1 };
}

function item(x: number, y: number): ItemPlacement {
  return { type: 'relic', x, y };
}

describe('physical exit resolver', () => {
  it('places one distinct reachable exit per edge on clean floor', () => {
    const level = makeLevel(tileMapCopy(ROOM));
    const stage = makeStage(level);
    const node = makeNode();
    const edges = [makeEdge('edge.a', 'node.two'), makeEdge('edge.b', 'node.three')];

    const resolution = expectResolution(resolve(node, edges, stage));

    expect(resolution.nodeId).toBe(node.id);
    expect(resolution.stageId).toBe(node.stageId);
    expect(resolution.levelDigest).toMatch(/^level\.[0-9a-f]{8}$/);
    expect(resolution.exits).toHaveLength(2);
    expect(resolution.exits.map(exit => exit.edgeId).sort()).toEqual(['edge.a', 'edge.b']);

    for (const exit of resolution.exits) {
      const edge = edges.find(candidate => candidate.id === exit.edgeId) as CampaignEdge;
      expect(exit.id).toBe(edge.physicalExitId);
      expect(exit.sourceNodeId).toBe(node.id);
      expect(exit.targetNodeId).toBe(edge.targetNodeId);
      expect(exit.stageExitId).toBe(edge.exitSlotId);
      expect(level.tileMap[exit.tile.y][exit.tile.x]).toBe(0);
      expect(reachable(level, { x: 1, y: 1 }, exit.tile)).toBe(true);
      expect(exit.placementAttempt).toBe(0);
    }
    expect(new Set(resolution.exits.map(exit => `${exit.tile.x},${exit.tile.y}`)).size).toBe(2);
    expect(pairwiseDistance(resolution.exits)).toBeGreaterThanOrEqual(3);
  });

  it('reuses compatible explicit tile and map-exit anchors', () => {
    const level = makeLevel(tileMapCopy(ROOM));
    const stage = makeStage(level, [
      exitDefinition('legacy.exit-one', { kind: 'tile', x: 1, y: 4 }),
      exitDefinition('legacy.exit-two', { kind: 'tile', x: 5, y: 2 }),
    ]);
    const node = makeNode();
    const edges = [makeEdge('edge.a', 'node.two'), makeEdge('edge.b', 'node.three')];

    const explicit = expectResolution(resolve(node, edges, stage));
    expect(explicit.exits.map(exit => exit.stageExitId).sort())
      .toEqual(['legacy.exit-one', 'legacy.exit-two']);
    expect(explicit.exits.map(exit => `${exit.tile.x},${exit.tile.y}`).sort())
      .toEqual(['1,4', '5,2']);

    const mapExitLevel = makeLevel(tileMapCopy(ROOM));
    mapExitLevel.tileMap[1][5] = EXIT;
    mapExitLevel.tileMap[4][5] = EXIT;
    const mapExitStage = makeStage(mapExitLevel, [
      exitDefinition('map.exit-one', { kind: 'map-exit' }),
      exitDefinition('map.exit-two', { kind: 'map-exit' }),
    ]);
    const mapped = expectResolution(resolve(node, edges, mapExitStage));

    expect(mapped.exits.map(exit => exit.stageExitId).sort())
      .toEqual(['map.exit-one', 'map.exit-two']);
    expect(mapped.exits.map(exit => `${exit.tile.x},${exit.tile.y}`).sort())
      .toEqual(['5,1', '5,4']);
    expect(mapped.exits.every(exit =>
      mapExitLevel.tileMap[exit.tile.y][exit.tile.x] === EXIT)).toBe(true);
  });

  it('is deterministic for repeated calls and independent of edge order', () => {
    const level = makeLevel(tileMapCopy(ROOM));
    const stage = makeStage(level);
    const node = makeNode();
    const edges = [makeEdge('edge.a', 'node.two'), makeEdge('edge.b', 'node.three')];

    const first = expectResolution(resolve(node, edges, stage));
    const repeated = expectResolution(resolve(node, edges, stage));
    const reversed = expectResolution(resolve(node, [...edges].reverse(), stage));

    expect(repeated).toEqual(first);
    expect(reversed).toEqual(first);
  });

  it('uses the next deterministic attempt when separation cannot be met', () => {
    const level = makeLevel(tileMapCopy(SMALL), {
      enemies: [
        enemy(2, 1), enemy(3, 1), enemy(1, 2),
        enemy(3, 2), enemy(1, 3), enemy(2, 3),
      ],
    });
    const stage = makeStage(level);
    const node = makeNode();
    const edges = [makeEdge('edge.a', 'node.two'), makeEdge('edge.b', 'node.three')];

    const resolution = expectResolution(resolve(node, edges, stage));
    const tiles = resolution.exits.map(exit => `${exit.tile.x},${exit.tile.y}`).sort();

    expect(tiles).toEqual(['2,2', '3,3']);
    expect(resolution.exits.every(exit => exit.placementAttempt === 2)).toBe(true);
  });

  it('falls back to a free tile when an explicit anchor is blocked', () => {
    const level = makeLevel(tileMapCopy(ROOM));
    const stage = makeStage(level, [
      exitDefinition('blocked.exit', { kind: 'tile', x: 0, y: 0 }),
    ]);
    const node = makeNode();
    const [edge] = [makeEdge('edge.a', 'node.two')];

    const resolution = expectResolution(resolve(node, [edge], stage));

    expect(resolution.exits).toHaveLength(1);
    expect(resolution.exits[0].stageExitId).toBe(edge.exitSlotId);
    expect(resolution.exits[0].tile).not.toEqual({ x: 0, y: 0 });
    expect(level.tileMap[resolution.exits[0].tile.y][resolution.exits[0].tile.x]).toBe(0);
  });

  it('avoids walls, hazards, chests and locked doors', () => {
    const level = makeLevel([
      [WALL, WALL, WALL, WALL, WALL, WALL, WALL],
      [WALL, SPAWN, PIT, LAVA, 0, 0, WALL],
      [WALL, 0, CHEST, PIT, 0, 0, WALL],
      [WALL, 0, 6, LAVA, 0, 0, WALL],
      [WALL, WALL, WALL, WALL, WALL, WALL, WALL],
    ]);
    const stage = makeStage(level);
    const node = makeNode();
    const edges = [makeEdge('edge.a', 'node.two'), makeEdge('edge.b', 'node.three')];

    const resolution = expectResolution(resolve(node, edges, stage));

    for (const exit of resolution.exits) {
      expect(level.tileMap[exit.tile.y][exit.tile.x]).toBe(0);
      expect(reachable(level, { x: 1, y: 1 }, exit.tile)).toBe(true);
    }
  });

  it('reserves explicit entity and npc positions', () => {
    const level = makeLevel(tileMapCopy(SMALL), {
      items: [item(2, 1), item(3, 1)],
      decorations: [{ type: 'brazier', x: 1, y: 2 } as DecorationPlacement],
      enemies: [
        { ...enemy(1, 3), patrol: [{ x: 1, y: 2 }] },
        enemy(2, 3),
      ],
    });
    const npcs = [{
      id: 'npc.guide',
      displayName: 'Guide',
      role: 'story' as const,
      presentationId: 'portrait.guide',
      spawn: { kind: 'tile' as const, x: 3, y: 3 },
    }];
    const stage = makeStage(level, [], npcs);
    const node = makeNode();
    const edges = [makeEdge('edge.a', 'node.two'), makeEdge('edge.b', 'node.three')];

    const resolution = expectResolution(resolve(node, edges, stage));
    const tiles = resolution.exits.map(exit => `${exit.tile.x},${exit.tile.y}`).sort();

    expect(tiles).toEqual(['2,2', '3,2']);
  });

  it('fails explicitly when a small map has no free reachable tile', () => {
    const stage = makeStage(makeLevel(tileMapCopy(TINY)));
    const result = resolve(makeNode(), [makeEdge('edge.a', 'node.two')], stage);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('insufficient-exit-space');
    expect(result.error.diagnostics.length).toBeGreaterThan(0);
    expect(result.error.diagnostics.every(diagnostic => diagnostic.code.startsWith('physical-exit.')))
      .toBe(true);
  });

  it('never places exits in a disconnected area', () => {
    const stage = makeStage(makeLevel(tileMapCopy(SPLIT)));
    const result = resolve(makeNode(), [makeEdge('edge.a', 'node.two')], stage);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('insufficient-exit-space');
  });

  it('rejects more edges than the node physical capacity', () => {
    const stage = makeStage(makeLevel(tileMapCopy(ROOM)));
    const node = makeNode({ maximumPhysicalExits: 1 });
    const result = resolve(node, [
      makeEdge('edge.a', 'node.two'),
      makeEdge('edge.b', 'node.three'),
    ], stage);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('insufficient-exit-space');
    expect(result.error.diagnostics.map(diagnostic => diagnostic.code))
      .toContain('physical-exit.capacity-exceeded');
  });

  it('fails with entry-unreachable when the stage has no spawn', () => {
    const level = makeLevel([
      [WALL, WALL, WALL],
      [WALL, 0, WALL],
      [WALL, WALL, WALL],
    ]);
    const stage = makeStage(level);
    const result = resolve(makeNode(), [makeEdge('edge.a', 'node.two')], stage);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('entry-unreachable');
    expect(result.error.diagnostics.map(diagnostic => diagnostic.code))
      .toContain('physical-exit.entry-missing');
  });

  it('computes a stable level digest for the same geometry and entity set', () => {
    const levelA = makeLevel(tileMapCopy(ROOM), {
      enemies: [enemy(1, 2), enemy(2, 2)],
    });
    const levelB = makeLevel(tileMapCopy(ROOM), {
      enemies: [enemy(2, 2), enemy(1, 2)],
    });
    const node = makeNode();
    const edge = makeEdge('edge.a', 'node.two');

    const first = expectResolution(resolve(node, [edge], makeStage(levelA)));
    const reordered = expectResolution(resolve(node, [edge], makeStage(levelB)));

    expect(reordered.levelDigest).toBe(first.levelDigest);

    levelB.tileMap[2][2] = WALL;
    const changed = resolve(node, [edge], makeStage(levelB));
    if (!changed.ok) throw changed.error;
    expect(changed.value.levelDigest).not.toBe(first.levelDigest);
  });

  it('treats an edge with an unknown source node as an invalid request', () => {
    const stage = makeStage(makeLevel(tileMapCopy(ROOM)));
    const result = resolve(
      makeNode(),
      [makeEdge('edge.a', 'node.two', 'node.other')],
      stage,
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('invalid-request');
  });

  it('returns an empty resolution when the node has no outgoing edges', () => {
    const stage = makeStage(makeLevel(tileMapCopy(ROOM)));
    const result = expectResolution(resolve(makeNode(), [], stage));

    expect(result.exits).toEqual([]);
    expect(result.nodeId).toBe(makeNode().id);
  });
});
