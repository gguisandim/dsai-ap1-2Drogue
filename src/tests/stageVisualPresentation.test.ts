import type Phaser from 'phaser';
import { StageMapRenderError, StageMapRenderer } from '../presentation/stages/StageMapRenderer';
import {
  AGUAS_CHAPTER_MANIFEST,
  AGUAS_VISUAL_RESOURCES,
  IGAPO_DAS_MEMORIAS_STAGE_ID,
  IGAPO_DAS_MEMORIAS_STAGE,
  IGAPO_VISUAL_THEME_ID,
  IGAPO_VISUAL_TILESET_ID,
  LEGACY_RESOLVED_STAGE_PRESENTATION,
  StageLoader,
  StageRegistry,
  StageVisualRegistry,
  registerCampaignChapters,
  registerLegacyStages,
} from '../stages';
import type { ChapterManifest, StageModule } from '../stages';

class FakeImage {
  public tint?: number;
  public alpha?: number;
  public depth?: number;
  public scale?: number;
  public rotation?: number;
  public refreshes = 0;

  public constructor(
    public readonly x: number,
    public readonly y: number,
    public readonly textureKey: string,
  ) {}

  public setTint(value: number): this { this.tint = value; return this; }
  public setAlpha(value: number): this { this.alpha = value; return this; }
  public setDepth(value: number): this { this.depth = value; return this; }
  public setScale(value: number): this { this.scale = value; return this; }
  public setRotation(value: number): this { this.rotation = value; return this; }
  public refreshBody(): this { this.refreshes += 1; return this; }
}

function loadIgapo() {
  const registry = new StageRegistry();
  registerLegacyStages(registry);
  registerCampaignChapters(registry);
  const result = new StageLoader(registry).load({
    stageId: IGAPO_DAS_MEMORIAS_STAGE_ID,
    runId: 'run.visual-tests',
    runSeed: 'seed.visual-tests',
  });
  if (!result.ok) throw result.error;
  if (!result.value.presentation) throw new Error('StageLoader did not resolve presentation.');
  return result.value as typeof result.value & { presentation: NonNullable<typeof result.value.presentation> };
}

function fakeRenderingSurface(missingTexture?: string) {
  const images: FakeImage[] = [];
  const obstacles: FakeImage[] = [];
  const scene = {
    textures: { exists: (key: string) => key !== missingTexture },
    add: { image: (x: number, y: number, key: string) => {
      const image = new FakeImage(x, y, key);
      images.push(image);
      return image;
    } },
  } as unknown as Phaser.Scene;
  const group = {
    create: (x: number, y: number, key: string) => {
      const image = new FakeImage(x, y, key);
      obstacles.push(image);
      return image;
    },
  } as unknown as Phaser.Physics.Arcade.StaticGroup;
  return { scene, group, images, obstacles };
}

describe('declarative stage visual presentation', () => {
  it('loads Igapó with stable theme, tileset, resources and decoration metadata', () => {
    const loaded = loadIgapo();
    expect(loaded.presentation).toMatchObject({
      themeId: IGAPO_VISUAL_THEME_ID,
      tilesetId: IGAPO_VISUAL_TILESET_ID,
      tileSize: 32,
    });
    expect(Object.keys(loaded.presentation.decorations).sort()).toEqual([
      'igapo_emergent_tree', 'igapo_fallen_trunk', 'igapo_memory_reeds',
    ]);
    expect(loaded.presentation.decorations.igapo_emergent_tree).toMatchObject({
      layer: 'foreground', depth: 5,
    });
  });

  it('preserves logical topology while resolving the same map with visibly distinct themes', () => {
    const loaded = loadIgapo();
    const before = JSON.stringify(loaded.level.tileMap);
    expect(loaded.presentation.tiles.floor).not.toEqual(LEGACY_RESOLVED_STAGE_PRESENTATION.tiles.floor);
    expect(loaded.presentation.tiles.water).not.toEqual(LEGACY_RESOLVED_STAGE_PRESENTATION.tiles.water);
    const customSurface = fakeRenderingSurface();
    const legacySurface = fakeRenderingSurface();
    const renderer = new StageMapRenderer();
    renderer.render(customSurface.scene, loaded.level, loaded.presentation, customSurface.group, false);
    renderer.render(legacySurface.scene, loaded.level, LEGACY_RESOLVED_STAGE_PRESENTATION, legacySurface.group, false);
    expect(customSurface.images[0].tint).not.toBe(legacySurface.images[0].tint);
    expect(customSurface.obstacles.map(item => [item.x, item.y])).toEqual(
      legacySurface.obstacles.map(item => [item.x, item.y]),
    );
    expect(JSON.stringify(loaded.level.tileMap)).toBe(before);
  });

  it('rejects unknown themes, tilesets, texture references and decorations deterministically', () => {
    const visuals = new StageVisualRegistry();
    visuals.registerChapter(AGUAS_CHAPTER_MANIFEST);
    const loaded = loadIgapo();
    const unknownTheme = visuals.resolve({
      ...loaded.manifest,
      presentation: { themeId: 'theme.missing' },
    }, loaded.level);
    expect(unknownTheme.ok).toBe(false);
    if (!unknownTheme.ok) expect(unknownTheme.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'stage.visual.theme.unknown', referenceId: 'theme.missing' }),
    ]));

    const badChapter: ChapterManifest = {
      ...AGUAS_CHAPTER_MANIFEST,
      id: 'chapter.visual.invalid',
      stageIds: [],
      entryStageId: 'stage.visual.invalid',
      visualResources: {
        ...AGUAS_VISUAL_RESOURCES,
        tilesets: [{
          ...AGUAS_VISUAL_RESOURCES.tilesets[0],
          id: 'tileset.visual.invalid',
          tiles: {
            ...AGUAS_VISUAL_RESOURCES.tilesets[0].tiles,
            floor: { textureId: 'texture.visual.missing' },
          },
        }],
        themes: [{ id: 'theme.visual.invalid', revision: 1, tilesetId: 'tileset.visual.invalid' }],
      },
    };
    const invalid = new StageVisualRegistry();
    invalid.registerChapter(badChapter);
    expect(invalid.diagnostics()).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'stage.visual.texture.unknown', referenceId: 'texture.visual.missing' }),
    ]));

    const unknownDecoration = visuals.resolve(loaded.manifest, {
      ...loaded.level,
      decorations: [{ type: 'igapo_unknown', x: 2, y: 2 }],
    });
    expect(unknownDecoration.ok).toBe(false);
    if (!unknownDecoration.ok) expect(unknownDecoration.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'stage.visual.decoration.unknown', referenceId: 'igapo_unknown' }),
    ]));

    const badModule: StageModule = {
      ...IGAPO_DAS_MEMORIAS_STAGE,
      manifest: {
        ...IGAPO_DAS_MEMORIAS_STAGE.manifest,
        presentation: { themeId: 'theme.missing' },
        exits: [{ id: 'exit.visual.complete', anchor: { kind: 'map-exit' }, targetStageId: 'campaign.complete' }],
      },
    };
    const badRegistry = new StageRegistry();
    badRegistry.registerChapter({
      ...AGUAS_CHAPTER_MANIFEST,
      dependencies: [],
    }, [badModule]);
    const badLoad = new StageLoader(badRegistry).load({
      stageId: badModule.manifest.id, runId: 'run.bad-visual', runSeed: 'seed.bad-visual',
    });
    expect(badLoad).toMatchObject({
      ok: false,
      error: {
        code: 'invalid-reference',
        diagnostics: expect.arrayContaining([
          expect.objectContaining({ code: 'stage.visual.theme.unknown', referenceId: 'theme.missing' }),
        ]),
      },
    });
  });

  it('uses the real renderer with deterministic variants, unchanged collision semantics and visual-only decorations', () => {
    const loaded = loadIgapo();
    const first = fakeRenderingSurface();
    const second = fakeRenderingSurface();
    const renderer = new StageMapRenderer();
    const firstResult = renderer.render(first.scene, loaded.level, loaded.presentation, first.group, true);
    const secondResult = renderer.render(second.scene, loaded.level, loaded.presentation, second.group, true);

    expect(first.images.map(image => [image.textureKey, (image as unknown as FakeImage).tint]))
      .toEqual(second.images.map(image => [image.textureKey, (image as unknown as FakeImage).tint]));
    const collisionCount = loaded.level.tileMap.flat().filter(tile => tile === 1 || tile === 2 || tile === 3).length;
    expect(first.obstacles).toHaveLength(collisionCount);
    expect(firstResult.decorationImages).toHaveLength(3);
    expect(firstResult.pendingExitTiles).toHaveLength(1);
    expect(firstResult.decorationImages.every(image =>
      !first.obstacles.includes(image as unknown as FakeImage))).toBe(true);
    expect(firstResult.decorationImages.map(image => (image as unknown as FakeImage).depth)).toEqual([5, 2, 4]);
  });

  it('fails before partial rendering when a resolved texture is absent from Phaser', () => {
    const loaded = loadIgapo();
    const surface = fakeRenderingSurface('tile_water');
    expect(() => new StageMapRenderer().render(
      surface.scene, loaded.level, loaded.presentation, surface.group, true,
    )).toThrow(expect.objectContaining<Partial<StageMapRenderError>>({
      code: 'stage.visual.texture.runtime-missing', referenceId: 'tile_water',
    }));
    expect(surface.images).toHaveLength(0);
    expect(surface.obstacles).toHaveLength(0);
  });

  it('honors decoration visibility, layer depth and per-placement overrides without physics bodies', () => {
    const loaded = loadIgapo();
    const surface = fakeRenderingSurface();
    const level = {
      ...loaded.level,
      decorations: [
        { type: 'igapo_emergent_tree', x: 2, y: 2, visible: false },
        { type: 'igapo_memory_reeds', x: 3, y: 3, layer: 'background' as const },
        { type: 'igapo_fallen_trunk', x: 4, y: 4, depth: 9, scale: 1.4, rotation: 0.3 },
      ],
    };
    const rendered = new StageMapRenderer().render(
      surface.scene, level, loaded.presentation, surface.group, false,
    );
    expect(rendered.decorationImages).toHaveLength(2);
    expect(rendered.decorationImages.map(image => (image as unknown as FakeImage).depth)).toEqual([-3, 9]);
    expect((rendered.decorationImages[1] as unknown as FakeImage)).toMatchObject({
      scale: 1.4, rotation: 0.3,
    });
    expect(surface.obstacles).toHaveLength(level.tileMap.flat().filter(tile => [1, 2, 3].includes(tile)).length);
  });

  it('keeps the built-in legacy renderer contract available without chapter presentation data', () => {
    expect(LEGACY_RESOLVED_STAGE_PRESENTATION).toMatchObject({
      themeId: 'theme.legacy.default',
      tilesetId: 'tileset.legacy.default',
      tiles: { floor: { textureKey: 'tile_floor' }, exit: { textureKey: 'tile_stairs' } },
    });
  });

  it('resolves custom visuals after procedural generation without changing seeded topology', () => {
    const proceduralDecorations = [
      'candelabra', 'broken_pew', 'stained_glass_shard', 'gargoyle_statue', 'torch_sconce',
    ];
    const module: StageModule = {
      manifest: {
        schemaVersion: 1,
        id: 'stage.visual.procedural',
        revision: 1,
        chapterId: 'chapter.visual.procedural',
        order: 0,
        title: 'Procedural visual fixture',
        summary: 'Seeded topology with a declarative presentation.',
        layout: { kind: 'procedural', preset: 'cathedral-intro', seed: 'run' },
        exits: [{ id: 'exit.visual.complete', anchor: { kind: 'map-exit' }, targetStageId: 'campaign.complete' }],
        presentation: { themeId: IGAPO_VISUAL_THEME_ID, tilesetId: IGAPO_VISUAL_TILESET_ID },
      },
    };
    const decorations = [
      ...(AGUAS_VISUAL_RESOURCES.decorations ?? []),
      ...proceduralDecorations.map(id => ({
        id, textureId: 'texture.aguas.root', layer: 'foreground' as const, depth: 4,
      })),
    ];
    const chapter: ChapterManifest = {
      schemaVersion: 1,
      id: module.manifest.chapterId,
      revision: 1,
      title: 'Procedural visual fixture',
      stageIds: [module.manifest.id],
      entryStageId: module.manifest.id,
      visualResources: {
        ...AGUAS_VISUAL_RESOURCES,
        decorations,
        themes: [{
          ...AGUAS_VISUAL_RESOURCES.themes[0],
          decorationIds: [
            ...(AGUAS_VISUAL_RESOURCES.themes[0].decorationIds ?? []),
            ...proceduralDecorations,
          ],
        }],
      },
    };
    const registry = new StageRegistry();
    registry.registerChapter(chapter, [module]);
    const loader = new StageLoader(registry);
    const request = { stageId: module.manifest.id, runId: 'run.visual.procedural', runSeed: 'seed-17' };
    const first = loader.load(request);
    const second = loader.load(request);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(second.value.level.tileMap).toEqual(first.value.level.tileMap);
    expect(second.value.presentation).toEqual(first.value.presentation);
    expect(first.value.presentation?.themeId).toBe(IGAPO_VISUAL_THEME_ID);
  });
});
