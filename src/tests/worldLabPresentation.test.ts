import {
  CampaignGraphGenerator,
  IGAPO_DAS_MEMORIAS_STAGE_ID,
  IGAPO_SOMBRIO_VARIANT_ID,
  StageRegistry,
  registerCampaignChapters,
  registerLegacyStages,
} from '../stages';
import { WorldLabDataService } from '../devtools/world-lab';
import { WORLD_LAB_FIXTURE_CATALOG } from '../devtools/world-lab/fixtures/fixtureCatalog';

function registry(): StageRegistry {
  const value = new StageRegistry();
  registerLegacyStages(value);
  registerCampaignChapters(value);
  return value;
}

function project(variantId?: string) {
  const generated = new CampaignGraphGenerator().generate({
    campaignId: 'world-lab.presentation',
    campaignRevision: 1,
    catalogRevision: 1,
    runId: 'world-lab.presentation.run',
    runSeed: 'world-lab.presentation.seed',
    templates: WORLD_LAB_FIXTURE_CATALOG,
    context: { flags: {}, completedEventIds: [], revealedBeatIds: [] },
  });
  if (!generated.ok) throw generated.error;
  const target = generated.value.nodes.find(node => node.depth === 8) ?? generated.value.nodes[0];
  const graph = {
    ...generated.value,
    nodes: generated.value.nodes.map(node => node.id === target.id
      ? { ...node, stageId: IGAPO_DAS_MEMORIAS_STAGE_ID }
      : node),
  };
  const result = new WorldLabDataService({
    registry: registry(),
    ...(variantId ? { presentationVariantId: variantId } : {}),
  }).generateGraph('world-lab.presentation.seed', graph);
  if (!result.ok) throw result.error;
  const stage = result.value.stages.find(item => item.nodeId === target.id);
  if (!stage) throw new Error('Projected Igapó stage is missing.');
  return { document: result.value, stage, service: new WorldLabDataService({ registry: registry() }) };
}

describe('World Lab visual presentation inspection', () => {
  it('exposes theme, tileset, frames, spritesheets, decorations and Puny origin', () => {
    const { stage } = project();
    const visual = stage.visualPresentation;
    expect(visual).toBeDefined();
    expect(visual?.variantId).toBeUndefined();
    expect(visual?.themeId).toBe('theme.aguas.igapo');
    expect(visual?.tilesetId).toBe('tileset.aguas.igapo-technical');
    expect(visual?.tiles?.find(tile => tile.logicalId === 'floor')?.frame).toBe(0);
    expect(visual?.spritesheets).toEqual(expect.arrayContaining([
      expect.objectContaining({
        textureKey: 'puny_world', frameWidth: 16, frameHeight: 16, frameCount: 1755,
      }),
      expect.objectContaining({
        textureKey: 'puny_warrior_128', frameWidth: 128, frameHeight: 114, frameCount: 12,
      }),
    ]));
    expect(visual?.assetOrigins).toEqual(expect.arrayContaining([
      expect.objectContaining({
        assetId: 'asset.puny.world', pack: 'Puny World (16x16)',
        author: 'Shade', license: 'CC0',
      }),
    ]));
    expect(visual?.decorations?.map(decoration => decoration.id)).toEqual(expect.arrayContaining([
      'igapo_landmark_canoe',
      'igapo_landmark_drowned_tree',
      'igapo_landmark_fallen_trunk',
      'igapo_landmark_old_arch',
      'igapo_landmark_palm_island',
      'igapo_waterweed',
    ]));
    expect(visual?.npcSprites?.[0]).toMatchObject({
      logicalId: 'environment.memory-vestige', textureKey: 'puny_mage',
      animations: ['puny_mage_idle'],
    });
    expect(visual?.artAssets).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'floor', category: 'tile', sourceDimensions: { width: 432, height: 1040 },
        frameDimensions: { width: 16, height: 16 }, renderedDimensions: { width: 32, height: 32 },
        compatibility: 'compatible',
      }),
      expect.objectContaining({
        id: 'igapo_emergent_tree', category: 'decoration', scaleClass: 'oversized',
        compatibility: 'compatible', warnings: [],
      }),
    ]));
  });

  it('projects the sombrio variant with different tiles and environment over the same map', () => {
    const { document, stage } = project(IGAPO_SOMBRIO_VARIANT_ID);
    const visual = stage.visualPresentation;
    expect(visual?.variantId).toBe(IGAPO_SOMBRIO_VARIANT_ID);
    expect(visual?.themeId).toBe('theme.aguas.igapo-sombrio');
    expect(visual?.tiles?.find(tile => tile.logicalId === 'water')?.frame).toBe(295);
    expect(visual?.environment?.fog?.opacity).toBe(0.12);
    expect(visual?.decorations?.map(decoration => decoration.id).sort())
      .toEqual(expect.arrayContaining([
        'igapo_landmark_canoe',
        'igapo_sombrio_cut_stump',
        'igapo_sombrio_reeds',
        'igapo_sombrio_stump_cluster',
        'igapo_sombrio_oil_slick',
        'igapo_sombrio_waste',
      ]));
    expect(visual?.decorationOverrides?.igapo_waterweed).toBe('igapo_sombrio_oil_slick');
    expect(visual?.effects?.map(effect => effect.id)).toContain('effect.aguas.sombrio.smoke');
    expect(document.stages.some(item => item.stageId === IGAPO_DAS_MEMORIAS_STAGE_ID)).toBe(true);
  });

  it('lists the available presentation variants from the injected registry', () => {
    expect(project().service.presentationVariants()).toEqual([
      'variant.aguas.igapo-ribeirinho',
      'variant.aguas.igapo-sombrio',
    ]);
  });

  it('lists registered stages and scopes variants to the selected stage', () => {
    const service = project().service;
    expect(service.stageOptions()).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: IGAPO_DAS_MEMORIAS_STAGE_ID,
        presentationVariantIds: [
          'variant.aguas.igapo-ribeirinho', 'variant.aguas.igapo-sombrio',
        ],
      }),
    ]));
    service.setFocusStageId(IGAPO_DAS_MEMORIAS_STAGE_ID);
    expect(service.presentationVariants()).toEqual([
      'variant.aguas.igapo-ribeirinho', 'variant.aguas.igapo-sombrio',
    ]);
  });

  it('focuses the Igapó stage for interactive World Lab inspection', () => {
    const service = new WorldLabDataService({
      registry: registry(),
      focusStageId: IGAPO_DAS_MEMORIAS_STAGE_ID,
      presentationVariantId: IGAPO_SOMBRIO_VARIANT_ID,
    });
    const generated = service.generate('world-lab.focus.seed');
    expect(generated.ok).toBe(true);
    if (!generated.ok) return;
    const stage = generated.value.stages.find(item =>
      item.stageId === IGAPO_DAS_MEMORIAS_STAGE_ID);
    expect(stage).toBeDefined();
    expect(stage?.nodeId).toBe(service.focusNodeId());
    expect(stage?.visualPresentation?.variantId).toBe(IGAPO_SOMBRIO_VARIANT_ID);
    expect(stage?.visualPresentation?.themeId).toBe('theme.aguas.igapo-sombrio');
  });
});
