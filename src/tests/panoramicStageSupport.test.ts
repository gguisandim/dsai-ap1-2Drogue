import type { ChapterManifest, StageModule } from '../stages';
import { StageLoader, StageRegistry } from '../stages';

const WIDTH = 84;
const HEIGHT = 26;
const WALKABLE = new Set([0, 5, 6, 7, 8, 9]);

function panoramicMap(): number[][] {
  const map: number[][] = Array.from({ length: HEIGHT }, (_, y) =>
    Array.from({ length: WIDTH }, (_, x) =>
      x === 0 || y === 0 || x === WIDTH - 1 || y === HEIGHT - 1 ? 1 : 3));
  const fill = (x1: number, y1: number, x2: number, y2: number): void => {
    for (let y = y1; y <= y2; y += 1) {
      for (let x = x1; x <= x2; x += 1) map[y][x] = 0;
    }
  };
  fill(2, 11, 25, 15);
  fill(22, 6, 48, 10);
  fill(22, 16, 48, 20);
  fill(24, 9, 27, 17);
  fill(46, 8, 50, 18);
  fill(48, 11, 81, 15);
  map[13][4] = 8;
  map[13][79] = 5;
  map[8][34] = 2;
  map[18][38] = 2;
  return map;
}

const MODULE: StageModule = Object.freeze({
  manifest: Object.freeze({
    schemaVersion: 1 as const,
    id: 'test.panorama.contract-proof',
    revision: 1,
    chapterId: 'test.panorama',
    order: 0,
    title: 'Panorama Contract Proof',
    summary: 'Wide authored map used only to prove the current public contracts.',
    layout: Object.freeze({ kind: 'authored' as const }),
    exits: Object.freeze([Object.freeze({
      id: 'test.panorama.complete',
      anchor: Object.freeze({ kind: 'tile' as const, x: 79, y: 13 }),
      targetStageId: 'campaign.complete' as const,
    })]),
  }),
  authoredLevel: Object.freeze({
    id: 'test.panorama.contract-proof',
    name: 'Panorama Contract Proof',
    description: 'A wide four-direction traversal fixture.',
    theme: 'witches_crypt' as const,
    music: 'ost_vestibule',
    ambientColor: 0x112233,
    fogColor: 0x071015,
    fogDensity: 0.2,
    lightIntensity: 0.7,
    tileMap: panoramicMap(),
    enemies: [{ type: 'affinity', x: 55, y: 13, level: 1 }],
    items: [{ type: 'health_herb', x: 34, y: 7, quantity: 1 }],
    decorations: [{ type: 'roots', x: 38, y: 18 }],
    parTime: 180,
    difficulty: 1,
  }),
});

const CHAPTER: ChapterManifest = Object.freeze({
  schemaVersion: 1 as const,
  id: 'test.panorama',
  revision: 1,
  title: 'Panorama Contract Proof',
  stageIds: Object.freeze([MODULE.manifest.id]),
  entryStageId: MODULE.manifest.id,
});

function reachable(
  map: readonly (readonly number[])[],
  start: { readonly x: number; readonly y: number },
): ReadonlySet<string> {
  const visited = new Set<string>();
  const queue = [start];
  while (queue.length > 0) {
    const point = queue.shift()!;
    const key = `${point.x},${point.y}`;
    if (visited.has(key) || !WALKABLE.has(map[point.y]?.[point.x])) continue;
    visited.add(key);
    queue.push(
      { x: point.x + 1, y: point.y },
      { x: point.x - 1, y: point.y },
      { x: point.x, y: point.y + 1 },
      { x: point.x, y: point.y - 1 },
    );
  }
  return visited;
}

describe('panoramic authored stage proof', () => {
  it('loads an 80+ tile map through the existing contracts with connected side routes', () => {
    const registry = new StageRegistry();
    registry.registerChapter(CHAPTER, [MODULE]);
    const loaded = new StageLoader(registry).load({
      stageId: MODULE.manifest.id,
      runId: 'run.panorama-proof',
      runSeed: 'seed.panorama-proof',
    });
    if (!loaded.ok) throw loaded.error;

    expect(loaded.value.level.tileMap).toHaveLength(HEIGHT);
    expect(loaded.value.level.tileMap.every(row => row.length === WIDTH)).toBe(true);
    expect(WIDTH * 32).toBeGreaterThan(1280);
    const connected = reachable(loaded.value.level.tileMap, { x: 4, y: 13 });
    expect(connected.has('79,13')).toBe(true);
    expect(connected.has('34,7')).toBe(true);
    expect(connected.has('37,18')).toBe(true);
    expect(loaded.value.diagnostics.filter(item => item.severity === 'error')).toEqual([]);
  });
});
