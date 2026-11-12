import { WorldLabDataService } from '../devtools/world-lab';
import { FLORES_ASSETS } from '../presentation/assets/floresAssetCatalog';
import {
  StageLoader,
  StageRegistry,
  VEILED_GARDENS_CORRUPTED_EFFECTS,
  VEILED_GARDENS_CORRUPTED_THEME_ID,
  VEILED_GARDENS_CORRUPTED_VARIANT_ID,
  VEILED_GARDENS_NATURAL_VARIANT_ID,
  VEILED_GARDENS_STAGE_ID,
  VEILED_GARDENS_THEME_ID,
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
    stageId: VEILED_GARDENS_STAGE_ID,
    runId: 'run.flores.variants',
    runSeed: 'seed.flores.variants',
    ...(variantId ? { presentationVariantId: variantId } : {}),
  });
  if (!result.ok) throw result.error;
  return result.value;
}

describe('Jardins das Flores Veladas Natural/Corrompida', () => {
  it('changes only presentation while preserving the logical stage and gameplay', () => {
    const natural = load(VEILED_GARDENS_NATURAL_VARIANT_ID);
    const corrupted = load(VEILED_GARDENS_CORRUPTED_VARIANT_ID);
    expect(corrupted.level).toEqual(natural.level);
    expect(corrupted.manifest).toEqual(natural.manifest);
    expect(corrupted.encounter).toEqual(natural.encounter);
    expect(corrupted.npcs).toEqual(natural.npcs);
    expect(corrupted.dialogues).toEqual(natural.dialogues);
    expect(corrupted.missions).toEqual(natural.missions);
    expect(corrupted.events).toEqual(natural.events);
    expect(corrupted.level.tileMap).toEqual(natural.level.tileMap);
    expect(corrupted.level.exits).toEqual(natural.level.exits);
  });

  it('resolves genuinely different tiles, silhouettes, atmosphere, audio and effects', () => {
    const natural = load(VEILED_GARDENS_NATURAL_VARIANT_ID);
    const corrupted = load(VEILED_GARDENS_CORRUPTED_VARIANT_ID);
    expect(natural.presentationVariantId).toBe(VEILED_GARDENS_NATURAL_VARIANT_ID);
    expect(corrupted.presentationVariantId).toBe(VEILED_GARDENS_CORRUPTED_VARIANT_ID);
    expect(natural.presentation?.themeId).toBe(VEILED_GARDENS_THEME_ID);
    expect(corrupted.presentation?.themeId).toBe(VEILED_GARDENS_CORRUPTED_THEME_ID);
    expect(corrupted.presentation?.tilesetId).not.toBe(natural.presentation?.tilesetId);
    expect([
      corrupted.presentation?.tiles.floor.frame,
      corrupted.presentation?.tiles.floor.tint,
    ]).not.toEqual([
      natural.presentation?.tiles.floor.frame,
      natural.presentation?.tiles.floor.tint,
    ]);
    expect(corrupted.presentation?.environment?.fog?.opacity)
      .toBeGreaterThan(natural.presentation?.environment?.fog?.opacity ?? 0);
    expect(corrupted.presentation?.audio?.id).not.toBe(natural.presentation?.audio?.id);
    expect(corrupted.presentation?.effects.map(effect => effect.id))
      .toEqual(VEILED_GARDENS_CORRUPTED_EFFECTS.map(effect => effect.id));
    expect(corrupted.presentation?.decorationOverrides).toMatchObject({
      flores_monumental_tree: 'flores_corrupted_tree',
      flores_pictorial_canopy: 'flores_corrupted_pictorial_canopy',
      flores_heart_bloom: 'flores_corrupted_heart_core',
    });
  });

  it('uses PNG compositions and SVG silhouettes in every mapped visual plane', () => {
    const natural = load(VEILED_GARDENS_NATURAL_VARIANT_ID);
    const corrupted = load(VEILED_GARDENS_CORRUPTED_VARIANT_ID);
    const placementTypes = natural.level.decorations.map(item => item.type);
    expect(placementTypes.filter(id => id === 'flores_pictorial_canopy')).toHaveLength(4);
    expect(placementTypes).toContain('flores_heart_bloom');
    expect(natural.presentation?.decorations.flores_pictorial_canopy).toMatchObject({
      textureKey: 'flores_natural_canopy', layer: 'background',
    });
    expect(natural.presentation?.decorations.flores_heart_bloom).toMatchObject({
      textureKey: 'flores_natural_heart_bloom', layer: 'terrain',
    });
    expect(corrupted.presentation?.decorations.flores_corrupted_pictorial_canopy)
      .toMatchObject({ textureKey: 'flores_corrupted_canopy', layer: 'background' });
    expect(corrupted.presentation?.decorations.flores_corrupted_heart_core)
      .toMatchObject({ textureKey: 'flores_corrupted_heart_core', layer: 'terrain' });
    expect(corrupted.presentation?.decorations.flores_corrupted_tree)
      .toMatchObject({ textureKey: 'flores_corrupted_tree' });
    expect(FLORES_ASSETS.filter(asset => asset.fileName.endsWith('.png'))).toHaveLength(4);
    expect(FLORES_ASSETS.filter(asset => asset.fileName.includes('corrupted-') && asset.fileName.endsWith('.svg')))
      .toHaveLength(7);
  });

  it('exposes both variants and the Corrupted projection in World Lab', () => {
    const service = new WorldLabDataService({
      registry: registry(),
      focusStageId: VEILED_GARDENS_STAGE_ID,
      presentationVariantId: VEILED_GARDENS_CORRUPTED_VARIANT_ID,
    });
    expect(service.stageOptions()).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: VEILED_GARDENS_STAGE_ID,
        presentationVariantIds: [
          VEILED_GARDENS_CORRUPTED_VARIANT_ID,
          VEILED_GARDENS_NATURAL_VARIANT_ID,
        ],
      }),
    ]));
    expect(service.presentationVariants()).toEqual([
      VEILED_GARDENS_CORRUPTED_VARIANT_ID,
      VEILED_GARDENS_NATURAL_VARIANT_ID,
    ]);
    const generated = service.generate('world-lab.flores-variants');
    expect(generated.ok).toBe(true);
    if (!generated.ok) return;
    const stage = generated.value.stages.find(item => item.stageId === VEILED_GARDENS_STAGE_ID);
    expect(stage?.visualPresentation).toMatchObject({
      variantId: VEILED_GARDENS_CORRUPTED_VARIANT_ID,
      themeId: VEILED_GARDENS_CORRUPTED_THEME_ID,
    });
    expect(stage?.visualPresentation?.decorationOverrides?.flores_heart_bloom)
      .toBe('flores_corrupted_heart_core');
    expect(stage?.visualPresentation?.assetOrigins).toEqual(expect.arrayContaining([
      expect.objectContaining({
        assetId: 'asset.floresta.flores.corrupted-heart',
        author: 'OpenAI ImageGen sob direção do projeto',
      }),
      expect.objectContaining({
        assetId: 'asset.floresta.flores.corrupted-tree',
        author: 'Autoria original do projeto',
      }),
    ]));
  });
});
