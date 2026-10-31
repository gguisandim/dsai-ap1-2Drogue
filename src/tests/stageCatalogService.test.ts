import { readFileSync } from 'fs';
import { join } from 'path';
import {
  DEFAULT_STAGE_RUNTIME_CAPABILITIES,
  IGAPO_DAS_MEMORIAS_STAGE_ID,
  StageCatalogService,
  StageRegistry,
  registerCampaignChapters,
  registerLegacyStages,
  type ChapterManifest,
  type StageCampaignCatalogMetadata,
  type StageModule,
} from '../stages';
import { createUmbraCampaignRouteSliceGraph } from '../application/stages';

function module(
  id: string,
  chapterId: string,
  campaignCatalog?: StageCampaignCatalogMetadata,
  targetStageId: string | 'campaign.complete' = 'campaign.complete',
  capabilities?: StageModule['manifest']['capabilities'],
): StageModule {
  return Object.freeze({
    manifest: Object.freeze({
      schemaVersion: 1 as const,
      id,
      revision: 1,
      chapterId,
      order: 0,
      title: id,
      summary: `Synthetic definition for ${id}.`,
      layout: Object.freeze({ kind: 'legacy' as const, levelId: 'verse_01_atrium' }),
      exits: Object.freeze([Object.freeze({
        id: `exit.${id}`,
        anchor: Object.freeze({ kind: 'map-exit' as const }),
        targetStageId,
      })]),
      ...(campaignCatalog ? { campaignCatalog } : {}),
      ...(capabilities ? { capabilities } : {}),
    }),
  });
}

function metadata(
  participation: StageCampaignCatalogMetadata['participation'] = 'candidate',
  availability: StageCampaignCatalogMetadata['availability'] = 'available',
): StageCampaignCatalogMetadata {
  return Object.freeze({
    availability,
    participation,
    role: participation === 'narrative-milestone' ? 'milestone' as const : 'standard' as const,
    regionIds: Object.freeze(['region.test']),
    biomeIds: Object.freeze(['crypt']),
    difficulty: Object.freeze({ minimum: 2, maximum: 4 }),
    allowedActIds: Object.freeze(['act-1', 'act-2']),
    maximumPhysicalExits: 2 as const,
    revisit: 'checkpoint' as const,
    requiredEventIds: Object.freeze(['event.test.required']),
    requiredBeatIds: Object.freeze(['beat.test.required']),
    providesBeatIds: Object.freeze(['beat.test.provided']),
  });
}

function chapter(
  id: string,
  stages: readonly StageModule[],
  dependencies?: ChapterManifest['dependencies'],
): ChapterManifest {
  return Object.freeze({
    schemaVersion: 1 as const,
    id,
    revision: 1,
    title: id,
    stageIds: Object.freeze(stages.map(value => value.manifest.id)),
    entryStageId: stages[0].manifest.id,
    ...(dependencies ? { dependencies } : {}),
  });
}

function registered(...groups: readonly [ChapterManifest, readonly StageModule[]][]): StageRegistry {
  const registry = new StageRegistry();
  groups.forEach(([manifest, stages]) => {
    const normalized = stages.map((stage, index) => Object.freeze({
      ...stage,
      manifest: Object.freeze({
        ...stage.manifest,
        order: index,
        exits: Object.freeze(stage.manifest.exits.map(exit => Object.freeze({
          ...exit,
          targetStageId: exit.targetStageId === 'campaign.complete' && stages[index + 1]
            ? stages[index + 1].manifest.id
            : exit.targetStageId,
        }))),
      }),
    }));
    registry.registerChapter(manifest, normalized);
  });
  return registry;
}

function catalog(registry: StageRegistry) {
  const result = StageCatalogService.create(registry);
  if (!result.ok) throw new Error(JSON.stringify(result.error.diagnostics));
  expect(result.ok).toBe(true);
  return result.value;
}

describe('StageCatalogService', () => {
  test('accepts an empty catalog', () => {
    const value = catalog(new StageRegistry());
    expect(value.list()).toEqual([]);
    expect(value.candidates()).toEqual([]);
    expect(value.diagnostics()).toEqual([]);
  });

  test('discovers one or multiple stages from a registered chapter', () => {
    const one = module('stage.test.one', 'chapter.test');
    const two = module('stage.test.two', 'chapter.test');
    const value = catalog(registered([chapter('chapter.test', [one, two]), [one, two]]));
    expect(value.list().map(item => item.stageId)).toEqual(['stage.test.one', 'stage.test.two']);
    expect(value.listByChapter('chapter.test')).toHaveLength(2);
    expect(value.get('stage.test.two')?.chapterId).toBe('chapter.test');
  });

  test('discovers multiple chapters in canonical order', () => {
    const beta = module('stage.beta.one', 'chapter.beta');
    const alpha = module('stage.alpha.one', 'chapter.alpha');
    const value = catalog(registered(
      [chapter('chapter.beta', [beta]), [beta]],
      [chapter('chapter.alpha', [alpha]), [alpha]],
    ));
    expect(value.list().map(item => item.stageId)).toEqual(['stage.alpha.one', 'stage.beta.one']);
  });

  test('rejects duplicate IDs atomically', () => {
    const stage = module('stage.duplicate', 'chapter.duplicate');
    const owner = chapter('chapter.duplicate', [stage]);
    const result = StageCatalogService.create({
      listChapters: () => [owner, owner],
      listModules: () => [stage, stage],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.diagnostics.map(item => item.code)).toEqual(expect.arrayContaining([
      'stage-catalog.chapter-id.duplicate',
      'stage-catalog.stage-id.duplicate',
    ]));
  });

  test('rejects an unknown stage reference before publication', () => {
    const stage = module('stage.reference.source', 'chapter.reference', undefined, 'stage.reference.missing');
    const result = StageCatalogService.create({
      listChapters: () => [chapter('chapter.reference', [stage])],
      listModules: () => [stage],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.diagnostics.some(item => item.code === 'stage.exit.target-missing')).toBe(true);
  });

  test('rejects incomplete candidate metadata before publication', () => {
    const stage = module('stage.metadata.invalid', 'chapter.metadata', Object.freeze({
      availability: 'available' as const,
      participation: 'candidate' as const,
      role: 'standard' as const,
    }));
    const result = StageCatalogService.create({
      listChapters: () => [chapter('chapter.metadata', [stage])],
      listModules: () => [stage],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.diagnostics.map(item => item.code)).toEqual(expect.arrayContaining([
      'stage.catalog.candidate.difficulty-required',
      'stage.catalog.candidate.acts-required',
      'stage.catalog.candidate.exit-capacity-required',
    ]));
  });

  test('classifies capability incompatibility without changing the logical stage', () => {
    const stage = module(
      'stage.capability', 'chapter.capability', metadata(), 'campaign.complete',
      Object.freeze([Object.freeze({
        id: 'theme.gothic-cathedral', category: 'theme' as const,
        minimumVersion: 1, requirement: 'required' as const,
      })]),
    );
    const value = catalog(registered([chapter('chapter.capability', [stage]), [stage]]));
    expect(value.get(stage.manifest.id)).toMatchObject({
      stageId: stage.manifest.id,
      loadability: 'capability-incompatible',
      eligibility: 'capability-incompatible',
    });
    expect(value.incompatible().map(item => item.stageId)).toEqual([stage.manifest.id]);
  });

  test('classifies a missing required chapter dependency', () => {
    const stage = module('stage.dependency', 'chapter.dependency', metadata());
    const owner = chapter('chapter.dependency', [stage], Object.freeze([Object.freeze({
      chapterId: 'chapter.missing', minimumRevision: 1,
    })]));
    const value = catalog(registered([owner, [stage]]));
    expect(value.get(stage.manifest.id)?.eligibility).toBe('dependency-blocked');
    expect(value.diagnostics(stage.manifest.id).some(item =>
      item.code === 'chapter.dependency.missing')).toBe(true);
  });

  test('separates planned, eligible, individual and narrative-reserved stages', () => {
    const stages = [
      module('stage.classification.eligible', 'chapter.classification', metadata()),
      module('stage.classification.individual', 'chapter.classification'),
      module('stage.classification.milestone', 'chapter.classification', metadata('narrative-milestone')),
      module('stage.classification.planned', 'chapter.classification', metadata('candidate', 'planned')),
    ];
    const value = catalog(registered([chapter('chapter.classification', stages), stages]));
    expect(Object.fromEntries(value.list().map(item => [item.stageId, item.eligibility]))).toEqual({
      'stage.classification.eligible': 'campaign-eligible',
      'stage.classification.individual': 'individual-only',
      'stage.classification.milestone': 'narrative-reserved',
      'stage.classification.planned': 'planned',
    });
    expect(value.eligible().map(item => item.stageId)).toEqual(['stage.classification.eligible']);
  });

  test('filters by chapter, region, biome, role and difficulty deterministically', () => {
    const stage = module('stage.filters', 'chapter.filters', metadata());
    const value = catalog(registered([chapter('chapter.filters', [stage]), [stage]]));
    expect(value.query({ chapterId: 'chapter.filters' })).toHaveLength(1);
    expect(value.query({ regionId: 'region.test' })).toHaveLength(1);
    expect(value.query({ biomeId: 'crypt' })).toHaveLength(1);
    expect(value.query({ role: 'standard', difficulty: 3 })).toHaveLength(1);
    expect(value.query({ difficulty: 5 })).toEqual([]);
    expect(value.query({ eligibility: 'campaign-eligible' })).toEqual(value.query({
      eligibility: 'campaign-eligible',
    }));
  });

  test('is independent from registration order', () => {
    const alpha = module('stage.order.alpha', 'chapter.order.alpha', metadata());
    const beta = module('stage.order.beta', 'chapter.order.beta', metadata());
    const chapters = [chapter('chapter.order.alpha', [alpha]), chapter('chapter.order.beta', [beta])];
    const sourceA = { listChapters: () => chapters, listModules: () => [alpha, beta] };
    const sourceB = { listChapters: () => [...chapters].reverse(), listModules: () => [beta, alpha] };
    const first = StageCatalogService.create(sourceA);
    const second = StageCatalogService.create(sourceB);
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(first.value.list()).toEqual(second.value.list());
    expect(first.value.candidates()).toEqual(second.value.candidates());
    expect(first.value.diagnostics()).toEqual(second.value.diagnostics());
  });

  test('automatically includes a newly registered stage without an engine list', () => {
    const first = module('stage.dynamic.first', 'chapter.dynamic', metadata());
    const second = module('stage.dynamic.second', 'chapter.dynamic', metadata());
    const value = catalog(registered([chapter('chapter.dynamic', [first, second]), [first, second]]));
    expect(value.candidates().map(item => item.stageId)).toEqual([
      'stage.dynamic.first', 'stage.dynamic.second',
    ]);
  });

  test('discovers Igapó as an eligible registered definition without changing macro IDs', () => {
    const registry = new StageRegistry();
    registerLegacyStages(registry);
    registerCampaignChapters(registry);
    const value = catalog(registry);
    expect(value.get(IGAPO_DAS_MEMORIAS_STAGE_ID)).toMatchObject({
      chapterId: 'chapter.aguas',
      manifestRevision: 1,
      eligibility: 'campaign-eligible',
    });
    expect(value.get('verse_01_atrium')?.eligibility).toBe('individual-only');
    const graph = createUmbraCampaignRouteSliceGraph('run.catalog.compatibility', 'seed.catalog.compatibility');
    expect(graph.ok).toBe(true);
    if (graph.ok) expect(graph.value.nodes.some(item => item.stageId === IGAPO_DAS_MEMORIAS_STAGE_ID)).toBe(true);
  });

  test('preserves stable definition IDs used by saves and exposes no occurrence identity', () => {
    const registry = new StageRegistry();
    registerLegacyStages(registry);
    registerCampaignChapters(registry);
    const entry = catalog(registry).get(IGAPO_DAS_MEMORIAS_STAGE_ID);
    expect(entry?.stageId).toBe(IGAPO_DAS_MEMORIAS_STAGE_ID);
    expect(entry).not.toHaveProperty('nodeId');
    expect(entry).not.toHaveProperty('stageInstanceId');
    expect(entry).not.toHaveProperty('visitId');
  });

  test('catalogs 35 synthetic definitions without selecting nine', () => {
    const stages = Array.from({ length: 35 }, (_, index) => module(
      `stage.scale.${String(index + 1).padStart(2, '0')}`,
      'chapter.scale',
      metadata(),
    ));
    const value = catalog(registered([chapter('chapter.scale', stages), stages]));
    expect(value.list()).toHaveLength(35);
    expect(value.candidates()).toHaveLength(35);
    expect(value.list()[0].stageId).toBe('stage.scale.01');
    expect(value.list()[34].stageId).toBe('stage.scale.35');
  });

  test('headless service has no Phaser, DOM, UI or storage dependency', () => {
    const source = readFileSync(join(__dirname, '..', 'stages', 'runtime', 'StageCatalogService.ts'), 'utf8');
    expect(source).not.toMatch(/from ['"]phaser['"]/i);
    expect(source).not.toMatch(/devtools|scenes|localStorage|sessionStorage|document\.|window\./);
  });

  test('uses the real runtime capability profile', () => {
    expect(DEFAULT_STAGE_RUNTIME_CAPABILITIES.capabilities.length).toBeGreaterThan(0);
  });
});
