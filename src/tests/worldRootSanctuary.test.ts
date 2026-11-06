import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import type Phaser from 'phaser';
import { StageMapRenderer } from '../presentation/stages/StageMapRenderer';
import {
  WORLD_ROOT_APPROACH_ASSET,
  WORLD_ROOT_CANOPY_ASSET,
  WORLD_ROOT_COMPOSITION_ASSETS,
  WORLD_ROOT_ENTRANCE_ASSET,
  WORLD_ROOT_GROUND_ASSET,
  WORLD_ROOT_GROVE_ASSET,
  WORLD_ROOT_PASSAGE_ASSET,
  WORLD_ROOT_STONE_ASSET,
  WORLD_ROOT_STREAM_ASSET,
  WORLD_ROOT_TEXTURE_ASSET,
  WORLD_ROOT_TRAIL_ASSET,
} from '../presentation/assets/worldRootAssetCatalog';
import {
  StageCatalogService,
  StageLoader,
  StageRegistry,
  StageVisualRegistry,
  WORLD_ROOT_CHAPTER_MANIFEST,
  WORLD_ROOT_EFFECTS,
  WORLD_ROOT_EXIT,
  WORLD_ROOT_MAP_HEIGHT,
  WORLD_ROOT_MAP_WIDTH,
  WORLD_ROOT_MISSION_ID,
  WORLD_ROOT_MONOLITHS,
  WORLD_ROOT_NPC_ANCHOR,
  WORLD_ROOT_PASSAGE_FLAG,
  WORLD_ROOT_RUINS,
  WORLD_ROOT_SPAWN,
  WORLD_ROOT_STAGE,
  WORLD_ROOT_STAGE_ID,
  createWorldRootDecorations,
  createWorldRootMap,
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
  public setFlipX(): this { return this; }
  public setFlipY(): this { return this; }
  public setOrigin(): this { return this; }
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

    const groundPath = join(__dirname, '..', 'assets', 'world-root', WORLD_ROOT_GROUND_ASSET.fileName);
    const groundSource = readFileSync(groundPath, 'utf8');
    expect(createHash('sha256').update(groundSource).digest('hex')).toBe(WORLD_ROOT_GROUND_ASSET.sha256);
    expect(groundSource).toContain(`width="${WORLD_ROOT_GROUND_ASSET.width}" height="${WORLD_ROOT_GROUND_ASSET.height}"`);
    expect(groundSource.match(/<g(?:\s|>)/g)).toHaveLength(WORLD_ROOT_GROUND_ASSET.frameCount);
    expect(readFileSync(join(__dirname, '..', 'assets', 'world-root', 'README.md'), 'utf8'))
      .toContain(WORLD_ROOT_GROUND_ASSET.sha256);

    for (const asset of [WORLD_ROOT_STONE_ASSET, WORLD_ROOT_CANOPY_ASSET]) {
      const source = readFileSync(join(__dirname, '..', 'assets', 'world-root', asset.fileName), 'utf8');
      expect(createHash('sha256').update(source).digest('hex')).toBe(asset.sha256);
      expect(source).toContain(`width="${asset.width}" height="${asset.height}"`);
      expect(readFileSync(join(__dirname, '..', 'assets', 'world-root', 'README.md'), 'utf8'))
        .toContain(asset.sha256);
    }

    for (const asset of WORLD_ROOT_COMPOSITION_ASSETS) {
      const assetPath = join(__dirname, '..', 'assets', 'world-root', asset.fileName);
      const assetBytes = readFileSync(assetPath);
      expect(assetBytes.subarray(1, 4).toString('ascii')).toBe('PNG');
      expect(assetBytes.readUInt32BE(16)).toBe(asset.width);
      expect(assetBytes.readUInt32BE(20)).toBe(asset.height);
      expect(createHash('sha256').update(assetBytes).digest('hex')).toBe(asset.sha256);
      expect(readFileSync(join(__dirname, '..', 'assets', 'world-root', 'README.md'), 'utf8'))
        .toContain(asset.sha256);
    }
  });

  it('registers as the loadable narrative milestone without becoming a procedural candidate', () => {
    const value = registry();
    const catalog = StageCatalogService.create(value);
    expect(catalog.ok).toBe(true);
    if (!catalog.ok) return;
    expect(catalog.value.get(WORLD_ROOT_STAGE_ID)).toMatchObject({
      eligibility: 'narrative-reserved', loadability: 'loadable', participation: 'narrative-milestone',
      completionMissionId: WORLD_ROOT_MISSION_ID,
    });
    expect(catalog.value.candidates().some(item => item.stageId === WORLD_ROOT_STAGE_ID)).toBe(false);
    expect(loadWorldRoot()).toMatchObject({
      manifest: { id: WORLD_ROOT_STAGE_ID },
      encounter: { id: 'encounter.raiz-do-mundo.guardians' },
      presentation: { effects: expect.any(Array) },
    });
  });

  it('has panoramic fixed geometry, one spawn, rooted ruins and a reachable Igapó exit', () => {
    const map = WORLD_ROOT_STAGE.authoredLevel!.tileMap;
    expect(map).toHaveLength(WORLD_ROOT_MAP_HEIGHT);
    expect(map.every(row => row.length === WORLD_ROOT_MAP_WIDTH)).toBe(true);
    expect(WORLD_ROOT_MAP_WIDTH / WORLD_ROOT_MAP_HEIGHT).toBeGreaterThan(3);
    expect(map[WORLD_ROOT_SPAWN.y][WORLD_ROOT_SPAWN.x]).toBe(8);
    expect(map[WORLD_ROOT_EXIT.y][WORLD_ROOT_EXIT.x]).toBe(5);
    expect(map.flat().filter(tile => tile === 8)).toHaveLength(1);
    expect(WORLD_ROOT_MONOLITHS).toHaveLength(4);
    expect(WORLD_ROOT_MONOLITHS.every(point => map[point.y][point.x] === 2)).toBe(true);
    expect(WORLD_ROOT_RUINS.every(point => map[point.y][point.x] === 2)).toBe(true);
    expect(map[WORLD_ROOT_NPC_ANCHOR.y][WORLD_ROOT_NPC_ANCHOR.x]).toBe(0);
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
    expect(WORLD_ROOT_EXIT.x - WORLD_ROOT_SPAWN.x).toBeGreaterThan(100);
    expect(WORLD_ROOT_STAGE.manifest.exits[0]).toMatchObject({
      targetStageId: 'stage.aguas.igapo-das-memorias',
      condition: { type: 'flag.equals', flag: WORLD_ROOT_PASSAGE_FLAG, value: true },
    });
  });

  it('creates deterministic authored compositions without changing traversable map cells', () => {
    const map = createWorldRootMap();
    const originalMap = map.map(row => [...row]);
    const decorations = createWorldRootDecorations(map);
    expect(decorations.filter(item => item.type === 'raiz_do_mundo_trail_composition')).toHaveLength(2);
    expect(decorations.filter(item => item.type === 'raiz_do_mundo_entrance_composition')).toHaveLength(1);
    expect(decorations.filter(item => item.type === 'raiz_do_mundo_passage_composition')).toHaveLength(1);
    expect(decorations.filter(item => item.type === 'raiz_do_mundo_sanctuary_approach')).toHaveLength(1);
    expect(decorations.filter(item => item.type === 'raiz_do_mundo_stream')).toHaveLength(15);
    expect(decorations.filter(item => item.type === 'raiz_do_mundo_grove')).toHaveLength(38);
    expect(decorations.filter(item => item.layer === 'foreground')).toHaveLength(4);
    expect(decorations.some(item => item.flipX === true)).toBe(true);
    expect(decorations.every(item => item.depth !== undefined)).toBe(true);
    expect(loadWorldRoot().presentation.tiles.floor.variants.map(variant => variant.frame))
      .toEqual([1, 2, 3]);
    expect(loadWorldRoot().presentation.tiles.floor.variants.every(
      variant => variant.textureKey === 'world_root_ground',
    )).toBe(true);
    expect(createWorldRootMap()).toEqual(map);
    expect(createWorldRootDecorations(map)).toEqual(decorations);
    expect(map).toEqual(originalMap);
    expect(map[WORLD_ROOT_SPAWN.y][WORLD_ROOT_SPAWN.x]).toBe(8);
    expect(map[WORLD_ROOT_EXIT.y][WORLD_ROOT_EXIT.x]).toBe(5);
  });

  it('declares the full art composition and all active VFX groups', () => {
    const decorations = WORLD_ROOT_STAGE.authoredLevel!.decorations;
    expect(decorations.filter(item => item.type === 'raiz_do_mundo_sanctuary')).toHaveLength(1);
    expect(decorations).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'raiz_do_mundo_entrance_composition', depth: -1.28 }),
      expect.objectContaining({ type: 'raiz_do_mundo_trail_composition', depth: -1.26 }),
      expect.objectContaining({ type: 'raiz_do_mundo_sanctuary_approach', depth: 0.7 }),
      expect.objectContaining({ type: 'raiz_do_mundo_passage_composition', depth: -1.24 }),
      expect.objectContaining({ type: 'raiz_do_mundo_stream' }),
      expect.objectContaining({ type: 'raiz_do_mundo_grove', layer: 'foreground' }),
    ]));
    expect([
      WORLD_ROOT_TRAIL_ASSET.textureKey,
      WORLD_ROOT_APPROACH_ASSET.textureKey,
      WORLD_ROOT_STREAM_ASSET.textureKey,
      WORLD_ROOT_GROVE_ASSET.textureKey,
      WORLD_ROOT_ENTRANCE_ASSET.textureKey,
      WORLD_ROOT_PASSAGE_ASSET.textureKey,
    ].every(key => Object.values(loadWorldRoot().presentation.decorations)
      .some(decoration => decoration.textureKey === key))).toBe(true);
    expect(new Set(WORLD_ROOT_EFFECTS.map(effect => effect.kind))).toEqual(new Set([
      'fireflies', 'mist', 'pulse', 'spirits', 'local-light', 'water-shimmer', 'foliage-sway',
    ]));
  });

  it('declares a completable introductory mission and progressive 1-to-2 combat waves', () => {
    expect(WORLD_ROOT_STAGE.missions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: WORLD_ROOT_MISSION_ID,
        start: 'stage-enter',
        objectives: expect.arrayContaining([
          expect.objectContaining({ signal: 'npc.interacted', target: 1 }),
          expect.objectContaining({ signal: 'encounter.completed', target: 1 }),
        ]),
      }),
    ]));
    const source = WORLD_ROOT_STAGE.encounter!.source;
    expect(source.kind).toBe('authored-waves');
    if (source.kind !== 'authored-waves') return;
    expect(source.waves.map(wave => wave.enemies.length)).toEqual([1, 2]);
    expect(source.waves[0].enemies[0].x - WORLD_ROOT_SPAWN.x).toBeGreaterThan(30);
    expect(WORLD_ROOT_STAGE.events).toEqual(expect.arrayContaining([
      expect.objectContaining({
        when: 'mission.completed',
        commands: expect.arrayContaining([
          expect.objectContaining({ type: 'exit.unlock', exitId: 'exit.raiz-do-mundo.to-igapo' }),
          expect.objectContaining({ type: 'stage.complete', exitId: 'exit.raiz-do-mundo.to-igapo' }),
        ]),
      }),
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
      expect.objectContaining({ assetId: WORLD_ROOT_TRAIL_ASSET.id }),
      expect.objectContaining({ assetId: WORLD_ROOT_APPROACH_ASSET.id }),
      expect.objectContaining({ assetId: WORLD_ROOT_STREAM_ASSET.id }),
      expect.objectContaining({ assetId: WORLD_ROOT_GROVE_ASSET.id }),
      expect.objectContaining({
        assetId: WORLD_ROOT_GROUND_ASSET.id,
        license: 'asset original do projeto; sem licença de terceiro',
      }),
      expect.objectContaining({ assetId: 'asset.puny.world', license: 'CC0' }),
    ]));
  });
});
