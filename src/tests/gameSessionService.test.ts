import { readFileSync } from 'fs';
import { join } from 'path';
import {
  CAMPAIGN_RUN_SAVE_STORAGE_KEY,
  COMPOSED_CAMPAIGN_ID,
  COMPOSED_CAMPAIGN_RUN_STORAGE_KEY,
  CampaignRunSaveService,
  GameSessionService,
  campaignStageNarrativeSaveKey,
  composedCampaignRunId,
  createCampaignRunState,
  legacyComposedCampaignRunId,
} from '../application/stages';
import {
  CampaignCompositionService,
  FIXED_NINE_COMPOSITION_SLOTS,
  IGAPO_DAS_MEMORIAS_STAGE_ID,
  StageCatalogService,
  StageRegistry,
  createFixedNineCompositionRequest,
  type ChapterManifest,
  type StageCampaignCatalogMetadata,
  type StageExitDefinition,
  type StageModule,
} from '../stages';
import { MemorySaveStorage } from '../narrative';

const CAMPAIGN_COMPLETE = 'campaign.complete' as const;
const SESSION_CHAPTER = 'chapter.session.fixture';
const milestoneActs = new Map([[3, 'act-1'], [6, 'act-2'], [9, 'act-3']]);

const sessionStageId = (index: number): string =>
  `stage.session.${String(index).padStart(2, '0')}`;

function sessionMetadata(index: number): StageCampaignCatalogMetadata {
  const act = milestoneActs.get(index);
  return Object.freeze({
    availability: 'available' as const,
    participation: act ? 'narrative-milestone' as const : 'candidate' as const,
    role: act ? 'milestone' as const : 'standard' as const,
    regionIds: Object.freeze([`region.session.${(index % 3) + 1}`]),
    biomeIds: Object.freeze(['crypt']),
    difficulty: Object.freeze({ minimum: 1, maximum: 9 }),
    allowedActIds: Object.freeze(act ? [act] : ['act-1', 'act-2', 'act-3']),
    maximumPhysicalExits: index % 5 === 0 ? 3 as const : 2 as const,
    revisit: 'checkpoint' as const,
    providesBeatIds: Object.freeze(act ? [`beat.${act}`] : []),
  });
}

function exitsTo(
  id: string,
  targets: readonly string[],
): readonly StageExitDefinition[] {
  return Object.freeze([...new Set(targets)]
    .filter(target => target !== id)
    .sort()
    .map(target => Object.freeze({
      id: `exit.${id}.${target}`,
      anchor: Object.freeze({ kind: 'map-exit' as const }),
      targetStageId: target,
    })));
}

function sessionStage(
  index: number,
  targets: readonly string[],
  chapterId = SESSION_CHAPTER,
  revision = 1,
  metadata = sessionMetadata(index),
): StageModule {
  const id = sessionStageId(index);
  return Object.freeze({
    manifest: Object.freeze({
      schemaVersion: 1 as const,
      id,
      revision,
      chapterId,
      order: index - 1,
      title: `Session fixture ${index}`,
      summary: 'Synthetic session fixture.',
      layout: Object.freeze({ kind: 'legacy' as const, levelId: 'verse_01_atrium' }),
      exits: exitsTo(id, targets),
      campaignCatalog: metadata,
    }),
  });
}

/** Every stage can lead to every other stage, keeping the chapter graph valid. */
function fanOutStages(count = 35, chapterId = SESSION_CHAPTER): readonly StageModule[] {
  const ids = Array.from({ length: count }, (_, index) => sessionStageId(index + 1));
  return Object.freeze(ids.map((_, index) => sessionStage(
    index + 1,
    [...ids.filter(id => id !== sessionStageId(index + 1)), CAMPAIGN_COMPLETE],
    chapterId,
  )));
}

function chainStageIds(): readonly string[] {
  return Array.from({ length: 9 }, (_, index) => sessionStageId(index + 1));
}

function chainStages(breakFirstDestination = false): readonly StageModule[] {
  return Object.freeze(chainStageIds().map((_, offset) => {
    const index = offset + 1;
    const actId = index <= 3 ? 'act-1' : index <= 6 ? 'act-2' : 'act-3';
    const targets = breakFirstDestination && index === 1
      ? [sessionStageId(9)]
      : breakFirstDestination && index === 9
        ? [sessionStageId(2), CAMPAIGN_COMPLETE]
        : [index < 9 ? sessionStageId(index + 1) : CAMPAIGN_COMPLETE];
    return sessionStage(index, targets, SESSION_CHAPTER, 1, Object.freeze({
      ...sessionMetadata(index),
      allowedActIds: Object.freeze([actId]),
      difficulty: Object.freeze({ minimum: index, maximum: index }),
      maximumPhysicalExits: 1 as const,
    }));
  }));
}

function registryFor(stages: readonly StageModule[], reverse = false): StageRegistry {
  const ordered = reverse ? [...stages].reverse() : [...stages];
  const normalized = ordered.map((item, index) => Object.freeze({
    ...item,
    manifest: Object.freeze({ ...item.manifest, order: index }),
  }));
  const chapter: ChapterManifest = Object.freeze({
    schemaVersion: 1 as const,
    id: normalized[0].manifest.chapterId,
    revision: 1,
    title: 'Session fixture',
    stageIds: Object.freeze(normalized.map(item => item.manifest.id)),
    entryStageId: normalized[0].manifest.id,
  });
  const registry = new StageRegistry();
  registry.registerChapter(chapter, normalized);
  return registry;
}

function withRevision(
  stages: readonly StageModule[],
  stageId: string,
  revision: number,
): readonly StageModule[] {
  return stages.map(item => item.manifest.id === stageId
    ? Object.freeze({ ...item, manifest: Object.freeze({ ...item.manifest, revision }) })
    : item);
}

function withoutStage(
  stages: readonly StageModule[],
  removedStageId: string,
): readonly StageModule[] {
  return stages.filter(item => item.manifest.id !== removedStageId).map(item => Object.freeze({
    ...item,
    manifest: Object.freeze({
      ...item.manifest,
      exits: exitsTo(item.manifest.id, item.manifest.exits
        .map(exit => exit.targetStageId)
        .filter(target => target !== removedStageId)),
    }),
  }));
}

class FailingWriteStorage extends MemorySaveStorage {
  public override write(): void {
    throw new Error('write blocked');
  }
}

function manualSelections(stageIds: readonly string[]) {
  return Object.freeze(FIXED_NINE_COMPOSITION_SLOTS.map((slot, index) => Object.freeze({
    slotId: slot.slotId,
    stageId: stageIds[index],
  })));
}

function startFixture(service: GameSessionService, seed: string) {
  const result = service.startRandomCampaign(seed);
  if (!result.ok) throw new Error(JSON.stringify(result.error));
  return result.value;
}

describe('GameSessionService', () => {
  it('reports the real catalog as insufficient for random/custom while keeping classic and individual', () => {
    const service = new GameSessionService();
    const state = service.menuState();
    const mode = (id: string) => state.modes.find(item => item.mode === id);

    expect(state.catalogReady).toBe(true);
    expect(state.randomCampaignAvailable).toBe(false);
    expect(state.candidateStageCount).toBeLessThan(state.requiredStageCount);
    expect(mode('campaign-random')?.enabled).toBe(false);
    expect(mode('campaign-custom')?.enabled).toBe(false);
    expect(mode('campaign-random')?.reason).toBeTruthy();
    expect(mode('campaign-classic')?.enabled).toBe(true);
    expect(mode('stage-individual')?.enabled).toBe(true);
    expect(state.individualStages.some(item =>
      item.stageId === IGAPO_DAS_MEMORIAS_STAGE_ID && item.enabled)).toBe(true);
    expect(state.compositionDiagnostics.length).toBeGreaterThan(0);
  });

  it('composes nine of 35 with the default request and is deterministic per seed', () => {
    const service = new GameSessionService({ registry: registryFor(fanOutStages()) });
    const state = service.menuState();
    expect(state.randomCampaignAvailable).toBe(true);
    expect(state.candidateStageCount).toBe(35);

    const first = startFixture(service, 'seed.session.same');
    const repeated = startFixture(service, 'seed.session.same');
    const other = startFixture(service, 'seed.session.other');
    expect(first.snapshot.assignments).toHaveLength(9);
    expect(first.graph.nodes).toHaveLength(9);
    expect(first.navigation.snapshot.destinations.length).toBeGreaterThan(0);
    expect(repeated.snapshot).toEqual(first.snapshot);
    expect(other.snapshot.assignments.map(item => item.stageId))
      .not.toEqual(first.snapshot.assignments.map(item => item.stageId));
  });

  it('persists the composed snapshot under its own key and restores it without recomposition', () => {
    const registry = registryFor(fanOutStages());
    const storage = new MemorySaveStorage();
    const service = new GameSessionService({ registry, storage });
    const created = startFixture(service, 'seed.session.persisted');
    expect(created.persistence).toBe('created');
    expect(storage.read(COMPOSED_CAMPAIGN_RUN_STORAGE_KEY)).toBeDefined();
    expect(storage.read(CAMPAIGN_RUN_SAVE_STORAGE_KEY)).toBeUndefined();

    const resumedService = new GameSessionService({
      registry: registryFor(fanOutStages(), true),
      storage,
    });
    const resumed = startFixture(resumedService, 'seed.session.persisted');
    expect(resumed.persistence).toBe('restored');
    expect(resumed.runId).toBe(created.runId);
    expect(resumed.snapshot).toEqual(created.snapshot);
    expect(resumed.graph).toEqual(created.graph);
    expect(resumedService.menuState().savedCampaign?.seed).toBe('seed.session.persisted');
    expect(resumedService.menuState().savedCampaign?.assignments).toHaveLength(9);
    expect(resumedService.menuState().savedCampaign?.assignments.map(item => item.slotId))
      .toEqual(FIXED_NINE_COMPOSITION_SLOTS.map(slot => slot.slotId));
  });

  it('rejects an incompatible stored revision without overwriting the save', () => {
    const registry = registryFor(fanOutStages());
    const storage = new MemorySaveStorage();
    const created = startFixture(new GameSessionService({ registry, storage }), 'seed.session.revision');
    const bytes = storage.read(COMPOSED_CAMPAIGN_RUN_STORAGE_KEY);

    const selected = created.snapshot.assignments[0].stageId;
    const changed = new GameSessionService({
      registry: registryFor(withRevision(fanOutStages(), selected, 2)),
      storage,
    });
    const rejected = changed.startRandomCampaign('seed.session.revision');
    expect(rejected).toMatchObject({
      ok: false,
      error: { code: 'composition-failed', composition: { code: 'stage-revision-incompatible' } },
    });
    expect(storage.read(COMPOSED_CAMPAIGN_RUN_STORAGE_KEY)).toBe(bytes);
  });

  it('preserves an invalid stored save and exposes the diagnostic', () => {
    const storage = new MemorySaveStorage({ [COMPOSED_CAMPAIGN_RUN_STORAGE_KEY]: '{invalid' });
    const service = new GameSessionService({ registry: registryFor(fanOutStages()), storage });
    expect(service.menuState().savedCampaignError).toBeTruthy();
    expect(service.startRandomCampaign('seed.session.broken'))
      .toMatchObject({ ok: false, error: { code: 'save-failed' } });
    expect(storage.read(COMPOSED_CAMPAIGN_RUN_STORAGE_KEY)).toBe('{invalid');
  });

  it('fails atomically when the composed save cannot be written', () => {
    const storage = new FailingWriteStorage();
    const result = new GameSessionService({ registry: registryFor(fanOutStages()), storage })
      .startRandomCampaign('seed.session.write-failure');
    expect(result).toMatchObject({ ok: false, error: { code: 'save-failed' } });
    expect(storage.read(COMPOSED_CAMPAIGN_RUN_STORAGE_KEY)).toBeUndefined();
  });

  it('rejects a persisted run whose selected stage disappeared and preserves the save', () => {
    const stages = fanOutStages();
    const storage = new MemorySaveStorage();
    const seed = 'seed.session.removed-stage';
    const created = startFixture(
      new GameSessionService({ registry: registryFor(stages), storage }),
      seed,
    );
    const bytes = storage.read(COMPOSED_CAMPAIGN_RUN_STORAGE_KEY);
    const removed = created.snapshot.assignments[2].stageId;
    const reduced = new GameSessionService({
      registry: registryFor(withoutStage(stages, removed)),
      storage,
    });
    const rejected = reduced.startRandomCampaign(seed);
    expect(rejected).toMatchObject({
      ok: false,
      error: { code: 'composition-failed', composition: { code: expect.stringMatching(
        /stage-reference-missing|stage-revision-incompatible/,
      ) } },
    });
    expect(storage.read(COMPOSED_CAMPAIGN_RUN_STORAGE_KEY)).toBe(bytes);
  });

  it('treats a valid run without a composition as a fresh composed campaign', () => {
    const stages = fanOutStages();
    const storage = new MemorySaveStorage();
    const registry = registryFor(stages);
    const catalog = StageCatalogService.create(registry);
    if (!catalog.ok) throw new Error(JSON.stringify(catalog.error));
    const legacyRunId = 'run.composed.legacy-without-composition';
    const composed = new CampaignCompositionService(catalog.value).compose(
      createFixedNineCompositionRequest({
        campaignId: COMPOSED_CAMPAIGN_ID,
        campaignRevision: 1,
        runId: legacyRunId,
        seed: 'seed.session.no-snapshot',
      }),
    );
    if (!composed.ok) throw new Error(JSON.stringify(composed.error));
    const saves = new CampaignRunSaveService({
      storage,
      storageKey: COMPOSED_CAMPAIGN_RUN_STORAGE_KEY,
    });
    expect(saves.save(createCampaignRunState(composed.value.graph)).ok).toBe(true);

    const started = new GameSessionService({ registry, storage })
      .startRandomCampaign('seed.session.no-snapshot');
    expect(started.ok).toBe(true);
    if (!started.ok) return;
    expect(started.value.persistence).toBe('created');
    expect(started.value.router.state().composition).toBeDefined();
  });

  it('validates manual selections through the same composer', () => {
    const registry = registryFor(fanOutStages());
    const storage = new MemorySaveStorage();
    const service = new GameSessionService({ registry, storage });
    const preview = service.previewRandomCampaign('seed.session.manual');
    expect(preview.ok).toBe(true);
    if (!preview.ok) return;
    const selections = preview.value.snapshot.assignments.map(assignment => Object.freeze({
      slotId: assignment.slotId,
      stageId: assignment.stageId,
    }));

    const started = service.startCustomCampaign(selections, 'seed.session.manual');
    expect(started.ok).toBe(true);
    if (!started.ok) return;
    expect(started.value.snapshot.assignments.map(item => item.stageId))
      .toEqual(preview.value.snapshot.assignments.map(item => item.stageId));

    const incomplete = service.startCustomCampaign(selections.slice(0, 8), 'seed.session.manual');
    expect(incomplete).toMatchObject({
      ok: false,
      error: { code: 'composition-failed', composition: { code: 'manual-selection-invalid' } },
    });

    const duplicated = [...selections];
    duplicated[8] = Object.freeze({
      slotId: duplicated[8].slotId,
      stageId: duplicated[0].stageId,
    });
    expect(service.startCustomCampaign(duplicated, 'seed.session.manual')).toMatchObject({
      ok: false,
      error: { composition: { code: 'manual-selection-invalid' } },
    });
  });

  it('rejects a manual chain whose explicit destination contradicts its successor', () => {
    const service = new GameSessionService({ registry: registryFor(chainStages(true)) });
    const result = service.startCustomCampaign(manualSelections(chainStageIds()), 'seed.session.chain');
    expect(result).toMatchObject({
      ok: false,
      error: { code: 'composition-failed', composition: { code: 'destination-incompatible' } },
    });
  });

  it('derives a stable run id from seed and manual selection', () => {
    const selections = manualSelections(chainStageIds());
    const reversed = [...selections].reverse();
    expect(composedCampaignRunId('seed.x', selections)).toBe(composedCampaignRunId('seed.x', reversed));
    expect(composedCampaignRunId('seed.x', selections)).not.toBe(composedCampaignRunId('seed.x'));
    expect(composedCampaignRunId('seed.x', selections))
      .not.toBe(composedCampaignRunId('seed.y', selections));
    expect(composedCampaignRunId('seed.x', selections)).toMatch(/^run\.composed\.[0-9a-f]{16}$/);
    expect(legacyComposedCampaignRunId('seed.x', selections))
      .toMatch(/^run\.composed\.[0-9a-f]{8}$/);
    expect(composedCampaignRunId('seed.x', selections))
      .not.toBe(legacyComposedCampaignRunId('seed.x', selections));
  });

  it('resumes a legacy 32-bit run identity without recomposing', () => {
    const registry = registryFor(fanOutStages());
    const storage = new MemorySaveStorage();
    const seed = 'seed.session.legacy';
    const legacyRunId = legacyComposedCampaignRunId(seed);
    const catalog = StageCatalogService.create(registry);
    if (!catalog.ok) throw new Error(JSON.stringify(catalog.error));
    const composed = new CampaignCompositionService(catalog.value).compose(
      createFixedNineCompositionRequest({
        campaignId: COMPOSED_CAMPAIGN_ID,
        campaignRevision: 1,
        runId: legacyRunId,
        seed,
      }),
    );
    if (!composed.ok) throw new Error(JSON.stringify(composed.error));
    const saves = new CampaignRunSaveService({
      storage,
      storageKey: COMPOSED_CAMPAIGN_RUN_STORAGE_KEY,
    });
    expect(saves.save(createCampaignRunState(composed.value.graph, composed.value.snapshot)).ok)
      .toBe(true);

    const resumed = new GameSessionService({ registry, storage }).startRandomCampaign(seed);
    expect(resumed.ok).toBe(true);
    if (!resumed.ok) return;
    expect(resumed.value.persistence).toBe('restored');
    expect(resumed.value.runId).toBe(legacyRunId);
    expect(resumed.value.snapshot).toEqual(composed.value.snapshot);
  });

  it('scopes composed narrative saves by node occurrence and preserves legacy keys', () => {
    const legacy = campaignStageNarrativeSaveKey('run.x', 'chapter.x', 'stage.x');
    const first = campaignStageNarrativeSaveKey('run.x', 'chapter.x', 'stage.x', 'node.x.1');
    const second = campaignStageNarrativeSaveKey('run.x', 'chapter.x', 'stage.x', 'node.x.2');
    expect(first).toBe(campaignStageNarrativeSaveKey('run.x', 'chapter.x', 'stage.x', 'node.x.1'));
    expect(first).not.toBe(second);
    expect(legacy).not.toBe(first);
    expect(campaignStageNarrativeSaveKey('run.a', 'chapter.x', 'stage.x', 'node.x.1'))
      .not.toBe(campaignStageNarrativeSaveKey('run.b', 'chapter.x', 'stage.x', 'node.x.1'));
  });

  it('starts an individual stage without writing any campaign save', () => {
    const storage = new MemorySaveStorage();
    const service = new GameSessionService({ storage });
    const started = service.startIndividualStage(IGAPO_DAS_MEMORIAS_STAGE_ID);
    expect(started.ok).toBe(true);
    if (!started.ok) return;
    expect(started.value.loadedStage.manifest.id).toBe(IGAPO_DAS_MEMORIAS_STAGE_ID);
    expect(started.value.loadedStage.level.id).toBeDefined();
    expect(storage.read(COMPOSED_CAMPAIGN_RUN_STORAGE_KEY)).toBeUndefined();
    expect(storage.read(CAMPAIGN_RUN_SAVE_STORAGE_KEY)).toBeUndefined();
  });

  it('refuses unknown, planned and dependency-blocked individual stages with typed failures', () => {
    const plannedMetadata: StageCampaignCatalogMetadata = Object.freeze({
      ...sessionMetadata(36),
      availability: 'planned' as const,
    });
    const planned = sessionStage(36, [CAMPAIGN_COMPLETE], 'chapter.session.planned', 1, plannedMetadata);
    const plannedRegistry = registryFor([planned]);
    const plannedService = new GameSessionService({ registry: plannedRegistry });
    const view = plannedService.menuState().individualStages[0];
    expect(view.enabled).toBe(false);
    expect(view.reason).toContain('planned');
    expect(plannedService.startIndividualStage(planned.manifest.id))
      .toMatchObject({ ok: false, error: { code: 'stage-incompatible' } });

    const real = new GameSessionService();
    expect(real.startIndividualStage('stage.missing'))
      .toMatchObject({ ok: false, error: { code: 'stage-not-found' } });
  });

  it('keeps the classic save key untouched across composed and individual sessions', () => {
    const storage = new MemorySaveStorage({
      [CAMPAIGN_RUN_SAVE_STORAGE_KEY]: '{"schema":"legacy-placeholder"}',
    });
    const service = new GameSessionService({ registry: registryFor(fanOutStages()), storage });
    startFixture(service, 'seed.session.classic-key');
    service.startIndividualStage(IGAPO_DAS_MEMORIAS_STAGE_ID);
    expect(storage.read(CAMPAIGN_RUN_SAVE_STORAGE_KEY)).toBe('{"schema":"legacy-placeholder"}');
  });

  it('is headless: the session service has no Phaser, scene, DOM or concrete storage import', () => {
    const source = readFileSync(join(
      __dirname, '..', 'application', 'stages', 'GameSessionService.ts',
    ), 'utf8');
    expect(source).not.toMatch(/from ['"]phaser['"]|GameScene|localStorage|window\.|document\./);
    expect(source).not.toMatch(/BrowserCampaignSaveStorage/);
  });
});
