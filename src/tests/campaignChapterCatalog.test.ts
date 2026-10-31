import {
  IGAPO_DAS_MEMORIAS_STAGE_ID,
  StageCatalogService,
  StageLoader,
  StageRegistry,
  applyCampaignRegionBindings,
  campaignRegionBindings,
  registerCampaignChapters,
  registerLegacyStages,
} from '../stages';
import type {
  ChapterManifest,
  StageModule,
} from '../stages';
import type { LevelDefinition } from '../data/LevelData';
import { CAMPAIGN_CHAPTER_CATALOG } from '../stages/chapters/CampaignChapterCatalog';
import { UMBRA_CAMPAIGN_ROUTE_SLICE } from '../application/stages';

const TEST_CHAPTER: ChapterManifest = {
  schemaVersion: 1,
  id: 'chapter.test',
  revision: 1,
  title: 'Test chapter',
  stageIds: ['stage.test.catalog'],
  entryStageId: 'stage.test.catalog',
};

const TEST_LEVEL: LevelDefinition = {
  id: 'stage.test.catalog',
  name: 'Catalog test',
  description: 'Small authored stage used by the catalog test.',
  theme: 'witches_crypt',
  music: 'ost_vestibule',
  ambientColor: 0x000000,
  fogColor: 0x000000,
  fogDensity: 0,
  lightIntensity: 0,
  tileMap: [[1, 1, 1], [1, 8, 1], [1, 1, 1]],
  enemies: [],
  items: [],
  decorations: [],
  waves: [],
  parTime: 10,
  difficulty: 1,
};

const TEST_STAGE: StageModule = {
  manifest: {
    schemaVersion: 1,
    id: 'stage.test.catalog',
    revision: 1,
    chapterId: 'chapter.test',
    order: 0,
    title: 'Catalog test',
    summary: 'Catalog test stage.',
    layout: { kind: 'authored' },
    exits: [{ id: 'test.exit', anchor: { kind: 'map-exit' }, targetStageId: 'campaign.complete' }],
  },
  authoredLevel: TEST_LEVEL,
  dialogues: [{
    id: 'dialogue.test.mangues',
    startNodeId: 'start',
    nodes: [{ id: 'start', speakerId: 'narrator', text: 'Mangues.' }],
  }],
  events: [{
    id: 'event.test.mangues', once: true, when: 'stage.entered',
    commands: [{ type: 'flag.set', flag: 'flag.test.mangues', value: true }],
  }],
};

function registry(): StageRegistry {
  const registry = new StageRegistry();
  registerLegacyStages(registry);
  return registry;
}

describe('campaign chapter catalog', () => {
  it('registers an extra catalog entry without editing central files', () => {
    const reg = registry();
    registerCampaignChapters(reg, [
      ...CAMPAIGN_CHAPTER_CATALOG,
      { chapter: TEST_CHAPTER, stages: [TEST_STAGE], regions: [] },
    ]);
    expect(reg.getChapter('chapter.test')).toMatchObject({
      id: 'chapter.test',
      stageIds: ['stage.test.catalog'],
    });
    expect(reg.getChapter('chapter.aguas')).toBeDefined();
    const discovered = StageCatalogService.create(reg);
    expect(discovered.ok).toBe(true);
    if (discovered.ok) expect(discovered.value.get('stage.test.catalog')).toMatchObject({
      chapterId: 'chapter.test',
      eligibility: 'individual-only',
    });
  });

  it('still registers the real Igapó chapter through the same catalog function', () => {
    const reg = registry();
    registerCampaignChapters(reg);
    const loader = new StageLoader(reg);
    const loaded = loader.load({
      stageId: IGAPO_DAS_MEMORIAS_STAGE_ID,
      runId: 'run.catalog',
      runSeed: 'seed.catalog',
    });
    expect(loaded.ok).toBe(true);
  });

  it('applies region bindings generically and leaves unbound regions planned', () => {
    const catalog = [
      ...CAMPAIGN_CHAPTER_CATALOG,
      {
        chapter: TEST_CHAPTER,
        stages: [TEST_STAGE],
        regions: [{
          regionId: 'region.aguas.mangues',
          stageId: 'stage.test.catalog',
          minimumManifestRevision: 1,
          title: 'Mangues',
          dialogueIds: ['dialogue.test.mangues'],
          eventIds: ['event.test.mangues'],
        }],
      },
    ];
    expect(campaignRegionBindings(catalog).has('region.aguas.mangues')).toBe(true);
    const applied = applyCampaignRegionBindings(UMBRA_CAMPAIGN_ROUTE_SLICE, catalog);
    const regions = applied.routes.flatMap(route => route.regions);
    expect(regions.find(region => region.id === 'region.aguas.mangues')?.content).toMatchObject({
      kind: 'stage',
      stageId: 'stage.test.catalog',
    });
    expect(regions.find(region => region.id === 'region.aguas.mangues')?.narrative?.dialogueIds)
      .toEqual(['dialogue.test.mangues']);
    const porto = regions.find(region => region.id === 'region.aguas.porto');
    expect(porto?.content.kind).toBe('planned');
    expect(porto?.narrative?.dialogueIds).toBeUndefined();
    expect(porto?.narrative?.eventIds).toBeUndefined();
    expect(regions.find(region => region.id === 'region.aguas.igapo')?.content).toMatchObject({
      kind: 'stage',
      stageId: IGAPO_DAS_MEMORIAS_STAGE_ID,
    });
  });

  it('does not invent content for regions without a binding', () => {
    const applied = applyCampaignRegionBindings(UMBRA_CAMPAIGN_ROUTE_SLICE, []);
    expect(applied).toBe(UMBRA_CAMPAIGN_ROUTE_SLICE);
  });
});
