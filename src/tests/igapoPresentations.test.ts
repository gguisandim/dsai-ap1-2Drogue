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
import {
  IGAPO_CANOA_TEXTURE_ID,
  IGAPO_CANOA_TEXTURE_KEY,
  IGAPO_LANDMARK_DECORATION_IDS,
  IGAPO_SCENERY_IDS,
  IGAPO_SOMBRIO_EFFECTS,
} from '../stages/chapters/aguas/igapoVisuals';

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
  tint?: number;
  alpha?: number;
  displaySize?: readonly number[];
  setTint(value: number): this;
  setAlpha(value: number): this;
  setDepth(): this;
  setScale(): this;
  setRotation(): this;
  setOrigin(): this;
  setFlipX(): this;
  setFlipY(): this;
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
  const drawnTiles: { x: number; y: number; frame?: number; tint?: number }[] = [];
  const create = (x: number, y: number, textureKey: string, frame?: number): FakeVisual => {
    const visual: FakeVisual = {
      x, y, textureKey, frame,
      setTint(value) { this.tint = value; return this; },
      setAlpha(value) { this.alpha = value; return this; },
      setDepth() { return this; },
      setScale() { return this; },
      setRotation() { return this; },
      setOrigin() { return this; },
      setFlipX() { return this; },
      setFlipY() { return this; },
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
          const texture = create(x, y, 'render-texture');
          Object.assign(texture, {
            beginDraw() { return this; },
            batchDraw(brush: FakeVisual) {
              batchDrawCount += 1;
              drawnTiles.push({
                x: texture.x + brush.x,
                y: texture.y + brush.y,
                frame: brush.frame,
                tint: brush.tint,
              });
              return this;
            },
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
  return { result, obstacles, renderTextures, batchDrawCount, drawnTiles };
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

  it('composes deterministic vegetation clusters and registered landmarks outside gameplay clearings', () => {
    const ribeirinho = load(IGAPO_RIBEIRINHO_VARIANT_ID);
    const sombrio = load(IGAPO_SOMBRIO_VARIANT_ID);
    const placements = ribeirinho.level.decorations;
    const repeatedLoad = load(IGAPO_RIBEIRINHO_VARIANT_ID);
    const landmarkIds = Object.values(IGAPO_LANDMARK_DECORATION_IDS);
    const clearings = [
      [4, 17], [28, 16], [91, 16], [10, 18], [59, 12], [83, 19],
      [49, 16], [56, 16], [58, 12], [69, 16], [82, 15], [88, 19],
    ];

    expect(sombrio.level.decorations).toEqual(placements);
    expect(repeatedLoad.level.decorations).toEqual(placements);
    landmarkIds.forEach(id => {
      expect(placements.some(item => item.type === id)).toBe(true);
      expect(ribeirinho.presentation?.decorations[id]).toBeDefined();
      const resolvedId = sombrio.presentation?.decorationOverrides?.[id] ?? id;
      expect(sombrio.presentation?.decorations[resolvedId]).toBeDefined();
    });
    expect(placements.filter(item =>
      item.type === IGAPO_LANDMARK_DECORATION_IDS.stoneGarden)).toHaveLength(5);

    // The flooded-forest scenery is present in every depth plane.
    const scenery = [
      IGAPO_SCENERY_IDS.floodedTree,
      IGAPO_SCENERY_IDS.palmCluster,
      IGAPO_SCENERY_IDS.rootTangle,
      ...IGAPO_SCENERY_IDS.lily,
      ...IGAPO_SCENERY_IDS.shore,
      ...IGAPO_SCENERY_IDS.moss,
      IGAPO_SCENERY_IDS.canopyBough,
      IGAPO_SCENERY_IDS.lightShaft,
      IGAPO_SCENERY_IDS.canopyShadow,
    ];
    scenery.forEach(id => {
      expect(ribeirinho.presentation?.decorations[id]).toBeDefined();
      const resolvedId = sombrio.presentation?.decorationOverrides?.[id] ?? id;
      expect(sombrio.presentation?.decorations[resolvedId]).toBeDefined();
    });
    scenery.forEach(id => expect(placements.some(item => item.type === id)).toBe(true));

    const map = ribeirinho.level.tileMap;
    const flat = map.flat();
    expect(flat.filter(value => value === 3).length).toBeGreaterThan(1_300);
    const interior = map.slice(1, -1).flat();
    expect(interior.filter(value => value === 3).length / interior.length)
      .toBeGreaterThanOrEqual(0.5);
    expect(flat.filter(value => value === 2).length).toBeGreaterThan(20);

    expect(placements.some(item => item.type === 'igapo_waterweed')).toBe(true);
    const markedPollution = placements.filter(item =>
      item.type === 'igapo_waterweed' && item.scale === 3.1);
    expect(markedPollution).toHaveLength(4);
    markedPollution.forEach(item => {
      expect(map[item.y][item.x]).toBe(3);
    });
    expect(sombrio.presentation?.decorationOverrides?.igapo_waterweed)
      .toBe('igapo_sombrio_oil_slick');
    expect(IGAPO_SOMBRIO_EFFECTS.some(effect => effect.id === 'effect.aguas.sombrio.smoke'))
      .toBe(true);
    expect(placements.length).toBeLessThan(1_100);

    // Low ground cover and overlays may sit near a clearing; silhouettes that
    // could hide an actor or an interaction may not.
    const tallTypes = new Set([
      IGAPO_SCENERY_IDS.floodedTree,
      IGAPO_SCENERY_IDS.palmCluster,
      IGAPO_SCENERY_IDS.rootTangle,
      IGAPO_SCENERY_IDS.submergedTrunk,
      IGAPO_SCENERY_IDS.canopyShadow,
      IGAPO_SCENERY_IDS.canopyBough,
      IGAPO_SCENERY_IDS.stiltHut,
      IGAPO_SCENERY_IDS.memoryStela,
      'igapo_emergent_tree', 'igapo_emergent_tree_variant', 'igapo_emergent_tree_dark',
      'igapo_round_tree', 'igapo_broad_tree', 'igapo_palm', 'igapo_coconut_palm',
      'igapo_shrub',
      IGAPO_LANDMARK_DECORATION_IDS.drownedTree,
      IGAPO_LANDMARK_DECORATION_IDS.oldArch,
      IGAPO_LANDMARK_DECORATION_IDS.palmIsland,
      IGAPO_LANDMARK_DECORATION_IDS.fallenTrunk,
      IGAPO_LANDMARK_DECORATION_IDS.stiltHut,
      IGAPO_LANDMARK_DECORATION_IDS.memoryStela,
      IGAPO_LANDMARK_DECORATION_IDS.submergedTrunk,
      IGAPO_LANDMARK_DECORATION_IDS.emergentGiant,
    ]);
    placements.filter(item => tallTypes.has(item.type)).forEach(item => {
      expect(clearings.some(([x, y]) =>
        Math.abs(item.x - x) <= 4 && Math.abs(item.y - y) <= 4)).toBe(false);
    });
  });

  it('registers the original canoe texture and resolves its landmark in the visual theme', () => {
    const canoe = AGUAS_CHAPTER_MANIFEST.visualResources?.textures
      .find(texture => texture.id === IGAPO_CANOA_TEXTURE_ID);

    expect(canoe).toMatchObject({
      textureKey: IGAPO_CANOA_TEXTURE_KEY,
      sourceWidth: 48,
      sourceHeight: 16,
    });
    expect(load(IGAPO_RIBEIRINHO_VARIANT_ID).presentation?.decorations[
      IGAPO_LANDMARK_DECORATION_IDS.canoe
    ]?.textureKey).toBe(IGAPO_CANOA_TEXTURE_KEY);
  });

  it('renders shallow, mid and deep water plus wet banks without changing collision geometry', () => {
    const loaded = load(IGAPO_RIBEIRINHO_VARIANT_ID);
    const { level, presentation } = loaded;
    const map = level.tileMap;
    const tileWithin = (x: number, y: number, radius: number, value: number): boolean => {
      for (let offsetY = -radius; offsetY <= radius; offsetY += 1) {
        for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
          if (map[y + offsetY]?.[x + offsetX] === value) return true;
        }
      }
      return false;
    };
    let shallow: { x: number; y: number } | undefined;
    let mid: { x: number; y: number } | undefined;
    let deep: { x: number; y: number } | undefined;
    let wetBank: { x: number; y: number } | undefined;
    let dryBank: { x: number; y: number } | undefined;
    map.forEach((row, y) => row.forEach((tile, x) => {
      if (tile === 3) {
        if (tileWithin(x, y, 1, 0) && !shallow) shallow = { x, y };
        if (!tileWithin(x, y, 1, 0) && tileWithin(x, y, 3, 0) && !mid) mid = { x, y };
        if (!tileWithin(x, y, 3, 0) && !deep) deep = { x, y };
      }
      if (tile === 0) {
        if (tileWithin(x, y, 1, 3) && !wetBank) wetBank = { x, y };
        if (!tileWithin(x, y, 3, 3) && !dryBank) dryBank = { x, y };
      }
    }));
    if (!shallow || !mid || !deep || !wetBank || !dryBank || !presentation) {
      throw new Error('Igapó water/floor samples are missing.');
    }

    const logicalMap = map.map(row => [...row]);
    const rendered = renderSurface(level, presentation, true);
    const visualAt = (point: { x: number; y: number }) => {
      const tiles = rendered.drawnTiles
        .filter(item => item.x === point.x * 32 + 16 && item.y === point.y * 32 + 16);
      return tiles[tiles.length - 1];
    };
    expect(visualAt(shallow)?.frame).toBe(presentation.tiles.water.variants[0].frame);
    expect(visualAt(mid)?.frame).toBe(presentation.tiles.water.variants[1].frame);
    expect(visualAt(deep)?.frame).not.toBe(presentation.tiles.water.variants[0].frame);
    expect(visualAt(deep)?.frame).not.toBe(presentation.tiles.water.variants[1].frame);

    const wetFrames = new Set([
      presentation.tiles.floor.variants[2].frame,
      presentation.tiles.floor.variants[3].frame,
      presentation.tiles.floor.variants[4].frame,
    ]);
    const dryFrames = new Set([
      presentation.tiles.floor.frame,
      presentation.tiles.floor.variants[0].frame,
      presentation.tiles.floor.variants[1].frame,
    ]);
    expect(wetFrames.has(visualAt(wetBank)?.frame)).toBe(true);
    expect(dryFrames.has(visualAt(dryBank)?.frame)).toBe(true);

    expect(level.tileMap).toEqual(logicalMap);
    expect(rendered.result.pendingExitTiles).toEqual([{ x: 91 * 32 + 16, y: 16 * 32 + 16 }]);
  });

  it('batches a panoramic map into cullable chunks and exact collision runs', () => {
    const loaded = load(IGAPO_RIBEIRINHO_VARIANT_ID);
    const legacy = renderSurface(loaded.level, loaded.presentation!);
    const batched = renderSurface(loaded.level, loaded.presentation!, true);

    expect(batched.renderTextures).toHaveLength(12 * 4);
    expect(batched.result.pendingExitTiles).toEqual(legacy.result.pendingExitTiles);
    expect(batched.batchDrawCount).toBeGreaterThan(loaded.level.tileMap.length * loaded.level.tileMap[0].length);
    // Tile images collapse into 48 cullable render textures; decorations remain
    // individual display objects.
    expect(batched.result.images.length)
      .toBeLessThan(48 + loaded.level.decorations.length + 8);
    expect(legacy.result.images.length).toBeGreaterThan(2_000);
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
