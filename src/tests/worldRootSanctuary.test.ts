import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import type Phaser from 'phaser';
import { StageMapRenderer } from '../presentation/stages/StageMapRenderer';
import { WORLD_ROOT_TEXTURE_ASSET } from '../presentation/assets/worldRootAssetCatalog';
import {
  StageCatalogService,
  StageLoader,
  StageRegistry,
  StageVisualRegistry,
  WORLD_ROOT_CHAPTER_MANIFEST,
  WORLD_ROOT_EFFECTS,
  WORLD_ROOT_EXIT,
  WORLD_ROOT_MONOLITHS,
  WORLD_ROOT_SPAWN,
  WORLD_ROOT_STAGE,
  WORLD_ROOT_STAGE_ID,
  registerCampaignChapters,
  registerLegacyStages,
} from '../stages';
import { WorldLabDataService } from '../devtools/world-lab';

function registry(): StageRegistry {
  const value = new StageRegistry();
  registerLegacyStages(value);
  registerCampaignChapters(value);
  return value;
}

function loadWorldRoot() {
  const result = new StageLoader(registry()).load({
    stageId: WORLD_ROOT_STAGE_ID,
    runId: 'run.world-root.test',
    runSeed: 'seed.world-root.test',
  });
  if (!result.ok) throw result.error;
  if (!result.value.presentation) throw new Error('World Root presentation was not resolved.');
  return result.value as typeof result.value & { presentation: NonNullable<typeof result.value.presentation> };
}

class FakeVisual {
  public alpha = 1;
  public depth = 0;
  public rotation = 0;
  private destroyListener?: () => void;

  public constructor(public x = 0, public y = 0, public readonly key = 'shape') {}
  public setTint(): this { return this; }
  public setAlpha(value: number): this { this.alpha = value; return this; }
  public setDepth(value: number): this { this.depth = value; return this; }
  public setScale(): this { return this; }
  public setDisplaySize(): this { return this; }
  public setRotation(value: number): this { this.rotation = value; return this; }
  public setScrollFactor(): this { return this; }
  public refreshBody(): this { return this; }
  public once(_event: string, callback: () => void): this { this.destroyListener = callback; return this; }
  public destroy(): void { this.destroyListener?.(); this.destroyListener = undefined; }
}

describe('Raiz do Mundo', () => {
  it('keeps the generated monumental asset local, transparent-sized and traceable', () => {
    const path = join(__dirname, '..', 'assets', 'world-root', WORLD_ROOT_TEXTURE_ASSET.fileName);
    const bytes = readFileSync(path);
    expect(bytes.subarray(1, 4).toString('ascii')).toBe('PNG');
    expect(bytes.readUInt32BE(16)).toBe(WORLD_ROOT_TEXTURE_ASSET.width);
    expect(bytes.readUInt32BE(20)).toBe(WORLD_ROOT_TEXTURE_ASSET.height);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(WORLD_ROOT_TEXTURE_ASSET.sha256);
    expect(readFileSync(join(__dirname, '..', 'assets', 'world-root', 'README.md'), 'utf8'))
      .toContain(WORLD_ROOT_TEXTURE_ASSET.sha256);
  });

  it('registers as a loadable individual-only stage without becoming a campaign candidate', () => {
    const value = registry();
    const catalog = StageCatalogService.create(value);
    expect(catalog.ok).toBe(true);
    if (!catalog.ok) return;
    expect(catalog.value.get(WORLD_ROOT_STAGE_ID)).toMatchObject({
      eligibility: 'individual-only', loadability: 'loadable', participation: 'individual-only',
    });
    expect(catalog.value.candidates().some(item => item.stageId === WORLD_ROOT_STAGE_ID)).toBe(false);
    expect(loadWorldRoot()).toMatchObject({
      manifest: { id: WORLD_ROOT_STAGE_ID },
      encounter: { id: 'encounter.raiz-do-mundo.guardians' },
      presentation: { effects: expect.any(Array) },
    });
  });

  it('has fixed geometry, one spawn, four monoliths and a reachable completion exit', () => {
    const map = WORLD_ROOT_STAGE.authoredLevel!.tileMap;
    expect(map).toHaveLength(25);
    expect(map.every(row => row.length === 40)).toBe(true);
    expect(map[WORLD_ROOT_SPAWN.y][WORLD_ROOT_SPAWN.x]).toBe(8);
    expect(map[WORLD_ROOT_EXIT.y][WORLD_ROOT_EXIT.x]).toBe(5);
    expect(map.flat().filter(tile => tile === 8)).toHaveLength(1);
    expect(WORLD_ROOT_MONOLITHS).toHaveLength(4);
    expect(WORLD_ROOT_MONOLITHS.every(point => map[point.y][point.x] === 2)).toBe(true);
    expect(map[0].every(tile => tile === 1)).toBe(true);
    expect(map[map.length - 1].every(tile => tile === 1)).toBe(true);

    const queue: Array<{ x: number; y: number }> = [WORLD_ROOT_SPAWN];
    const visited = new Set([`${WORLD_ROOT_SPAWN.x},${WORLD_ROOT_SPAWN.y}`]);
    while (queue.length) {
      const point = queue.shift()!;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const x = point.x + dx;
        const y = point.y + dy;
        if (x < 0 || y < 0 || y >= map.length || x >= map[y].length || [1, 2, 3].includes(map[y][x])) continue;
        const key = `${x},${y}`;
        if (!visited.has(key)) { visited.add(key); queue.push({ x, y }); }
      }
    }
    expect(visited.has(`${WORLD_ROOT_EXIT.x},${WORLD_ROOT_EXIT.y}`)).toBe(true);
    expect(WORLD_ROOT_STAGE.manifest.exits[0]).toMatchObject({ targetStageId: 'campaign.complete' });
  });

  it('declares the full art composition and all active VFX groups', () => {
    const decorations = WORLD_ROOT_STAGE.authoredLevel!.decorations;
    expect(decorations.filter(item => item.type === 'raiz_do_mundo_sanctuary')).toHaveLength(1);
    expect(decorations.filter(item => item.type === 'raiz_do_mundo_monolith')).toHaveLength(4);
    expect(decorations.some(item => item.type === 'raiz_do_mundo_roots')).toBe(true);
    expect(decorations.some(item => item.type === 'raiz_do_mundo_undergrowth')).toBe(true);
    expect(decorations.some(item => item.type === 'raiz_do_mundo_vines')).toBe(true);
    expect(decorations.filter(item => item.type === 'raiz_do_mundo_biolume')).toHaveLength(4);
    expect(new Set(WORLD_ROOT_EFFECTS.map(effect => effect.kind))).toEqual(new Set([
      'fireflies', 'mist', 'pulse', 'spirits', 'local-light', 'water-shimmer', 'foliage-sway',
    ]));
  });

  it('validates malformed or excessive VFX before rendering', () => {
    const visuals = new StageVisualRegistry();
    visuals.registerChapter(WORLD_ROOT_CHAPTER_MANIFEST);
    const diagnostics = visuals.validateManifest({
      ...WORLD_ROOT_STAGE.manifest,
      presentation: {
        ...WORLD_ROOT_STAGE.manifest.presentation!,
        effects: [{
          id: 'effect.raiz-do-mundo.invalid', kind: 'fireflies', color: 0xffffff,
          alpha: 1, depth: 4, durationMs: 100, x: 2, y: 2, width: 0, height: 1, count: 99,
        }],
      },
    }, WORLD_ROOT_STAGE.npcs);
    expect(diagnostics.map(item => item.code)).toEqual(expect.arrayContaining([
      'stage.visual.effect.alpha-invalid', 'stage.visual.effect.duration-invalid',
      'stage.visual.effect.area-invalid', 'stage.visual.effect.count-invalid',
    ]));
  });

  it('creates animated Phaser objects and removes every tween when their targets are destroyed', () => {
    const loaded = loadWorldRoot();
    const visuals: FakeVisual[] = [];
    const tweenRecords: Array<{ stopped: boolean; removed: boolean; config: Record<string, unknown> }> = [];
    const make = (x = 0, y = 0, key = 'shape') => {
      const visual = new FakeVisual(x, y, key);
      visuals.push(visual);
      return visual;
    };
    const scene = {
      textures: { exists: () => true, getFrame: () => ({}) },
      anims: { exists: () => true },
      cameras: { main: { width: 1280, height: 720 } },
      add: {
        image: (x: number, y: number, key: string) => make(x, y, key),
        rectangle: (x: number, y: number) => make(x, y, 'rectangle'),
        circle: (x: number, y: number) => make(x, y, 'circle'),
        ellipse: (x: number, y: number) => make(x, y, 'ellipse'),
      },
      tweens: { add: (config: Record<string, unknown>) => {
        const record = { stopped: false, removed: false, config };
        tweenRecords.push(record);
        return {
          stop: () => { record.stopped = true; },
          remove: () => { record.removed = true; },
        };
      } },
    } as unknown as Phaser.Scene;
    const collisionGroup = {
      create: (x: number, y: number, key: string) => make(x, y, key),
    } as any as Phaser.Physics.Arcade.StaticGroup;
    const rendered = new StageMapRenderer().render(
      scene, loaded.level, loaded.presentation, collisionGroup, true,
    );

    expect(rendered.environmentObjects.length).toBeGreaterThan(50);
    expect(tweenRecords.length).toBeGreaterThan(50);
    expect(tweenRecords.every(record => record.config.repeat === -1)).toBe(true);
    [...rendered.environmentObjects, ...rendered.decorationImages]
      .forEach(object => (object as unknown as FakeVisual).destroy());
    expect(tweenRecords.every(record => record.stopped && record.removed)).toBe(true);
  });

  it('projects VFX and original/Puny provenance in the World Lab', () => {
    const service = new WorldLabDataService({ registry: registry(), focusStageId: WORLD_ROOT_STAGE_ID });
    const result = service.generate('world-root.world-lab.seed');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const stage = result.value.stages.find(item => item.stageId === WORLD_ROOT_STAGE_ID);
    expect(stage?.visualPresentation?.effects?.map(effect => effect.kind)).toEqual(expect.arrayContaining([
      'fireflies', 'mist', 'spirits', 'water-shimmer', 'foliage-sway',
    ]));
    expect(stage?.visualPresentation?.assetOrigins).toEqual(expect.arrayContaining([
      expect.objectContaining({ assetId: 'asset.world-root.sanctuary' }),
      expect.objectContaining({ assetId: 'asset.puny.world', license: 'CC0' }),
    ]));
  });
});

