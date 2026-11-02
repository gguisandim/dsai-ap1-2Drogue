import type Phaser from 'phaser';
import { StageMapRenderer } from '../presentation/stages/StageMapRenderer';
import {
  AGUAS_CHAPTER_MANIFEST,
  IGAPO_DAS_MEMORIAS_STAGE_ID,
  IGAPO_RIBEIRINHO_VARIANT_ID,
  IGAPO_SOMBRIO_THEME_ID,
  IGAPO_SOMBRIO_VARIANT_ID,
  IGAPO_VISUAL_THEME_ID,
  StageLoader,
  StageRegistry,
  registerCampaignChapters,
  registerLegacyStages,
} from '../stages';

function registry(): StageRegistry {
  const value = new StageRegistry();
  registerLegacyStages(value);
  registerCampaignChapters(value);
  return value;
}

function load(variantId?: string) {
  const result = new StageLoader(registry()).load({
    stageId: IGAPO_DAS_MEMORIAS_STAGE_ID,
    runId: 'run.igapo-presentations',
    runSeed: 'seed.igapo-presentations',
    ...(variantId ? { presentationVariantId: variantId } : {}),
  });
  if (!result.ok) throw result.error;
  return result.value;
}

interface FakeVisual {
  x: number;
  y: number;
  textureKey: string;
  frame?: number;
  displaySize?: readonly number[];
  setTint(): this;
  setAlpha(): this;
  setDepth(): this;
  setScale(): this;
  setRotation(): this;
  setOrigin(): this;
  setPosition(x: number, y: number): this;
  setTexture(textureKey: string, frame?: number): this;
  clearTint(): this;
  setVisible(): this;
  setScrollFactor(): this;
  setDisplaySize(width: number, height: number): this;
  refreshBody(): this;
  once(): this;
  destroy(): void;
}

function renderSurface(level: Parameters<StageMapRenderer['render']>[1],
  presentation: NonNullable<ReturnType<typeof load>['presentation']>,
  batching = false) {
  const create = (x: number, y: number, textureKey: string, frame?: number): FakeVisual => {
    const visual: FakeVisual = {
      x, y, textureKey, frame,
      setTint() { return this; },
      setAlpha() { return this; },
      setDepth() { return this; },
      setScale() { return this; },
      setRotation() { return this; },
      setOrigin() { return this; },
      setPosition(nextX, nextY) { this.x = nextX; this.y = nextY; return this; },
      setTexture(nextTextureKey, nextFrame) {
        this.textureKey = nextTextureKey; this.frame = nextFrame; return this;
      },
      clearTint() { return this; },
      setVisible() { return this; },
      setScrollFactor() { return this; },
      setDisplaySize(width, height) { this.displaySize = [width, height]; return this; },
      refreshBody() { return this; },
      once() { return this; },
      destroy() { return undefined; },
    };
    return visual;
  };
  const obstacles: FakeVisual[] = [];
  const renderTextures: FakeVisual[] = [];
  let batchDrawCount = 0;
  const scene = {
    textures: { exists: () => true, getFrame: () => ({}) },
    anims: { exists: () => true },
    cameras: { main: { width: 1280, height: 720 } },
    add: {
      image: (x: number, y: number, key: string, frame?: number) => create(x, y, key, frame),
      rectangle: (x: number, y: number, key: string) => create(x, y, key),
      circle: (x: number, y: number) => create(x, y, 'circle'),
      ellipse: (x: number, y: number) => create(x, y, 'ellipse'),
      ...(batching ? {
        renderTexture: (x: number, y: number) => {
          const texture = Object.assign(create(x, y, 'render-texture'), {
            beginDraw() { return this; },
            batchDraw() { batchDrawCount += 1; return this; },
            endDraw() { return this; },
          });
          renderTextures.push(texture);
          return texture;
        },
      } : {}),
    },
    ...(batching ? { make: { image: () => create(0, 0, 'brush') } } : {}),
    tweens: { add: () => ({ stop: () => undefined, remove: () => undefined }) },
  } as unknown as Phaser.Scene;
  const group = {
    create: (x: number, y: number, key: string, frame?: number) => {
      const obstacle = create(x, y, key, frame);
      obstacles.push(obstacle);
      return obstacle;
    },
  } as unknown as Phaser.Physics.Arcade.StaticGroup;
  const result = new StageMapRenderer().render(scene, level, presentation, group, true);
  return { result, obstacles, renderTextures, batchDrawCount };
}

describe('Igapó A/B presentations over one logical stage', () => {
  it('keeps map, topology, spawns, exits, NPCs, encounter and narrative identical', () => {
    const ribeirinho = load();
    const sombrio = load(IGAPO_SOMBRIO_VARIANT_ID);
    expect(sombrio.level).toEqual(ribeirinho.level);
    expect(sombrio.manifest).toEqual(ribeirinho.manifest);
    expect(sombrio.encounter).toEqual(ribeirinho.encounter);
    expect(sombrio.npcs).toEqual(ribeirinho.npcs);
    expect(sombrio.dialogues).toEqual(ribeirinho.dialogues);
    expect(sombrio.missions).toEqual(ribeirinho.missions);
    expect(sombrio.events).toEqual(ribeirinho.events);
    expect(ribeirinho.presentationVariantId).toBeUndefined();
    expect(sombrio.presentationVariantId).toBe(IGAPO_SOMBRIO_VARIANT_ID);
  });

  it('produces the same collision tiles and exits while changing real visual resources', () => {
    const ribeirinho = load(IGAPO_RIBEIRINHO_VARIANT_ID);
    const sombrio = load(IGAPO_SOMBRIO_VARIANT_ID);
    expect(ribeirinho.presentation?.themeId).toBe(IGAPO_VISUAL_THEME_ID);
    expect(sombrio.presentation?.themeId).toBe(IGAPO_SOMBRIO_THEME_ID);
    expect(sombrio.presentation?.tilesetId).not.toBe(ribeirinho.presentation?.tilesetId);
    expect(sombrio.presentation?.tiles.floor.textureKey)
      .toBe(ribeirinho.presentation?.tiles.floor.textureKey);
    expect([
      sombrio.presentation?.tiles.floor.frame,
      sombrio.presentation?.tiles.floor.tint,
    ]).not.toEqual([
      ribeirinho.presentation?.tiles.floor.frame,
      ribeirinho.presentation?.tiles.floor.tint,
    ]);
    expect(sombrio.presentation?.tiles.water.frame)
      .not.toBe(ribeirinho.presentation?.tiles.water.frame);
    expect(Object.keys(sombrio.presentation?.decorations ?? {}).sort())
      .not.toEqual(Object.keys(ribeirinho.presentation?.decorations ?? {}).sort());
    expect(sombrio.presentation?.environment?.fog?.opacity)
      .toBeGreaterThan(ribeirinho.presentation?.environment?.fog?.opacity ?? 0);
    expect(sombrio.presentation?.audio?.id).not.toBe(ribeirinho.presentation?.audio?.id);

    const first = renderSurface(ribeirinho.level, ribeirinho.presentation!);
    const second = renderSurface(sombrio.level, sombrio.presentation!);
    expect(second.obstacles.map(item => [item.x, item.y]))
      .toEqual(first.obstacles.map(item => [item.x, item.y]));
    expect(second.result.pendingExitTiles).toEqual(first.result.pendingExitTiles);
    expect(second.obstacles.map(item => [item.textureKey, item.frame]))
      .not.toEqual(first.obstacles.map(item => [item.textureKey, item.frame]));
    expect(second.obstacles.every(item => item.displaySize?.[0] === 32 && item.displaySize?.[1] === 32))
      .toBe(true);
  });

  it('batches a panoramic map into cullable chunks and exact collision runs', () => {
    const loaded = load(IGAPO_RIBEIRINHO_VARIANT_ID);
    const legacy = renderSurface(loaded.level, loaded.presentation!);
    const batched = renderSurface(loaded.level, loaded.presentation!, true);

    expect(batched.renderTextures).toHaveLength(12 * 4);
    expect(batched.result.pendingExitTiles).toEqual(legacy.result.pendingExitTiles);
    expect(batched.batchDrawCount).toBeGreaterThan(loaded.level.tileMap.length * loaded.level.tileMap[0].length);
    expect(batched.result.images.length).toBeLessThan(legacy.result.images.length / 4);
    expect(batched.obstacles.length).toBeLessThan(legacy.obstacles.length / 4);
    expect(batched.obstacles.every(item => item.displaySize?.[1] === 32)).toBe(true);
    const covered = new Set<string>();
    batched.obstacles.forEach(item => {
      const width = item.displaySize?.[0] ?? 0;
      const startX = Math.round((item.x - width / 2) / 32);
      const y = Math.round((item.y - 16) / 32);
      for (let offset = 0; offset < width / 32; offset += 1) {
        covered.add(`${startX + offset},${y}`);
      }
    });
    const expected = new Set<string>();
    loaded.level.tileMap.forEach((row, y) => row.forEach((tile, x) => {
      if (tile >= 1 && tile <= 3) expected.add(`${x},${y}`);
    }));
    expect(covered).toEqual(expected);
  });

  it('is deterministic and never consults Math.random', () => {
    const random = jest.spyOn(Math, 'random');
    try {
      const first = load(IGAPO_SOMBRIO_VARIANT_ID);
      const second = load(IGAPO_SOMBRIO_VARIANT_ID);
      expect(second.presentation).toEqual(first.presentation);
      expect(second.level.tileMap).toEqual(first.level.tileMap);
      expect(random).not.toHaveBeenCalled();
    } finally {
      random.mockRestore();
    }
  });

  it('validates every variant presentation during registry validation', () => {
    const diagnostics = registry().validate();
    expect(diagnostics.filter(item =>
      item.severity === 'error' && item.code.startsWith('stage.visual.'))).toEqual([]);
    expect(AGUAS_CHAPTER_MANIFEST.visualResources?.themes.map(theme => theme.id).sort())
      .toEqual([IGAPO_VISUAL_THEME_ID, IGAPO_SOMBRIO_THEME_ID].sort());
  });

  it('fails with a typed diagnostic for an unknown variant', () => {
    const result = new StageLoader(registry()).load({
      stageId: IGAPO_DAS_MEMORIAS_STAGE_ID,
      runId: 'run.igapo-missing-variant',
      runSeed: 'seed.igapo-missing-variant',
      presentationVariantId: 'variant.aguas.missing',
    });
    expect(result).toMatchObject({
      ok: false,
      error: {
        code: 'invalid-reference',
        diagnostics: expect.arrayContaining([
          expect.objectContaining({
            code: 'stage.visual.variant.unknown',
            referenceId: 'variant.aguas.missing',
          }),
        ]),
      },
    });
  });
});
