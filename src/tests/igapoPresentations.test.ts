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
  setScrollFactor(): this;
  setDisplaySize(width: number, height: number): this;
  refreshBody(): this;
}

function renderSurface(level: Parameters<StageMapRenderer['render']>[1],
  presentation: NonNullable<ReturnType<typeof load>['presentation']>) {
  const create = (x: number, y: number, textureKey: string, frame?: number): FakeVisual => {
    const visual: FakeVisual = {
      x, y, textureKey, frame,
      setTint() { return this; },
      setAlpha() { return this; },
      setDepth() { return this; },
      setScale() { return this; },
      setRotation() { return this; },
      setScrollFactor() { return this; },
      setDisplaySize(width, height) { this.displaySize = [width, height]; return this; },
      refreshBody() { return this; },
    };
    return visual;
  };
  const obstacles: FakeVisual[] = [];
  const scene = {
    textures: { exists: () => true, getFrame: () => ({}) },
    anims: { exists: () => true },
    cameras: { main: { width: 1280, height: 720 } },
    add: {
      image: (x: number, y: number, key: string, frame?: number) => create(x, y, key, frame),
      rectangle: (x: number, y: number, key: string) => create(x, y, key),
    },
  } as unknown as Phaser.Scene;
  const group = {
    create: (x: number, y: number, key: string, frame?: number) => {
      const obstacle = create(x, y, key, frame);
      obstacles.push(obstacle);
      return obstacle;
    },
  } as unknown as Phaser.Physics.Arcade.StaticGroup;
  const result = new StageMapRenderer().render(scene, level, presentation, group, true);
  return { result, obstacles };
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
