import {
  CAMPAIGN_RUN_SAVE_STORAGE_KEY,
  COMPOSED_CAMPAIGN_RUN_STORAGE_KEY,
  CampaignRouter,
  CampaignRunSaveService,
  GameSessionService,
  canonicalCampaignRunState,
  createCampaignRunState,
} from '../application/stages';
import {
  CampaignExitBinder,
  CampaignGraphValidator,
  PhysicalExitResolver,
  StageCatalogService,
  StageLoader,
  StageRegistry,
  createFixedNineCompositionRequest,
  CampaignCompositionService,
  type ChapterManifest,
  type StageCampaignCatalogMetadata,
  type StageExitDefinition,
  type StageModule,
} from '../stages';
import { MemorySaveStorage } from '../narrative';

const COMPLETE = 'campaign.complete' as const;
const CHAPTER = 'chapter.integration.cycle';
const SEED = 'seed.integration.nine-phase';
const milestoneActs = new Map([[3, 'act-1'], [6, 'act-2'], [9, 'act-3']]);

const stageId = (index: number): string =>
  `stage.integration.${String(index).padStart(2, '0')}`;

function metadata(index: number): StageCampaignCatalogMetadata {
  const act = milestoneActs.get(index);
  return Object.freeze({
    availability: 'available' as const,
    participation: act ? 'narrative-milestone' as const : 'candidate' as const,
    role: act ? 'milestone' as const : 'standard' as const,
    regionIds: Object.freeze([`region.integration.${(index % 3) + 1}`]),
    biomeIds: Object.freeze(['crypt']),
    difficulty: Object.freeze({ minimum: 1, maximum: 9 }),
    allowedActIds: Object.freeze(act ? [act] : ['act-1', 'act-2', 'act-3']),
    maximumPhysicalExits: 2 as const,
    revisit: 'checkpoint' as const,
    providesBeatIds: Object.freeze(act ? [`beat.${act}`] : []),
  });
}

function exits(id: string, targets: readonly string[]): readonly StageExitDefinition[] {
  return Object.freeze([...new Set(targets)].filter(target => target !== id).sort()
    .map(target => Object.freeze({
      id: `exit.${id}.${target}`,
      anchor: Object.freeze({ kind: 'map-exit' as const }),
      targetStageId: target,
    })));
}

function stage(index: number, targets: readonly string[]): StageModule {
  const id = stageId(index);
  return Object.freeze({
    manifest: Object.freeze({
      schemaVersion: 1 as const,
      id,
      revision: 1,
      chapterId: CHAPTER,
      order: index - 1,
      title: `Integration phase ${index}`,
      summary: 'Integration-cycle fixture reusing the legacy playable map.',
      layout: Object.freeze({ kind: 'legacy' as const, levelId: 'verse_01_atrium' }),
      exits: exits(id, targets),
      campaignCatalog: metadata(index),
    }),
  });
}

/** 35 composable definitions; every phase reuses the fully playable legacy map. */
function catalogStages(count = 35): readonly StageModule[] {
  const ids = Array.from({ length: count }, (_, index) => stageId(index + 1));
  return Object.freeze(ids.map((_, index) => stage(index + 1,
    [...ids.filter(id => id !== stageId(index + 1)), COMPLETE])));
}

function registry(stages: readonly StageModule[], reverse = false): StageRegistry {
  const ordered = reverse ? [...stages].reverse() : [...stages];
  const normalized = ordered.map((item, index) => Object.freeze({
    ...item,
    manifest: Object.freeze({ ...item.manifest, order: index }),
  }));
  const chapter: ChapterManifest = Object.freeze({
    schemaVersion: 1 as const,
    id: CHAPTER,
    revision: 1,
    title: 'Integration cycle',
    stageIds: Object.freeze(normalized.map(item => item.manifest.id)),
    entryStageId: normalized[0].manifest.id,
  });
  const result = new StageRegistry();
  result.registerChapter(chapter, normalized);
  return result;
}

function startRandom(storage: MemorySaveStorage, seed = SEED, reverse = false) {
  const started = new GameSessionService({
    registry: registry(catalogStages(), reverse),
    storage,
  }).startRandomCampaign(seed);
  if (!started.ok) throw new Error(JSON.stringify(started.error));
  return started.value;
}

describe('dynamic campaign integration cycle', () => {
  it('runs, persists, reloads, resumes and completes all nine phases', () => {
    const storage = new MemorySaveStorage();
    let session = startRandom(storage);
    const compositionId = session.snapshot.compositionId;
    const visited: string[] = [session.navigation.snapshot.currentStageId];
    const transitionIds: string[] = [];

    for (let step = 0; step < 9 && session.router.state().status !== 'completed'; step += 1) {
      const inspected = session.router.inspect();
      expect(inspected.ok).toBe(true);
      if (!inspected.ok) return;
      const available = inspected.value.snapshot.destinations.filter(item => item.available);
      expect(available).toHaveLength(1);
      const prepared = session.router.prepare(available[0].physicalExitId);
      expect(prepared.ok).toBe(true);
      if (!prepared.ok) return;
      const confirmed = session.router.confirm(prepared.value.preparationId);
      expect(confirmed.ok).toBe(true);
      if (!confirmed.ok) return;
      transitionIds.push(confirmed.value.transition.transitionId);

      const reward = session.router.reward(confirmed.value.transition.transitionId);
      if (reward) {
        const claimed = session.router.claimReward(reward.transitionId);
        expect(claimed.ok).toBe(true);
        const acknowledged = session.router.acknowledgeReward(reward.transitionId);
        expect(acknowledged.ok).toBe(true);
      }
      if (confirmed.value.state.status === 'completed') break;

      visited.push(confirmed.value.transition.identity.stageId);
      session = startRandom(storage, SEED, step % 2 === 0);
      expect(session.persistence).toBe('restored');
      expect(session.snapshot.compositionId).toBe(compositionId);
      expect(session.navigation.snapshot.currentStageId).toBe(visited[visited.length - 1]);
      expect(session.router.state().status).toBe('active');
    }

    expect(session.router.state().status).toBe('completed');
    expect(visited).toHaveLength(9);
    expect(new Set(visited).size).toBe(9);
    expect(transitionIds).toHaveLength(9);
    expect(session.router.unsettledRewards()).toHaveLength(0);

    const finalAttempt = new GameSessionService({
      registry: registry(catalogStages(), true),
      storage,
    }).startRandomCampaign(SEED);
    expect(finalAttempt).toMatchObject({ ok: false, error: { code: 'run-completed' } });

    const stored = new CampaignRunSaveService({
      storage,
      storageKey: COMPOSED_CAMPAIGN_RUN_STORAGE_KEY,
    }).load();
    expect(stored.ok && stored.value.status).toBe('loaded');
    if (stored.ok && stored.value.status === 'loaded') {
      const state = stored.value.envelope.state;
      expect(state.status).toBe('completed');
      expect(state.composition?.compositionId).toBe(compositionId);
      expect(state.rewards[transitionIds[0]]?.status).toBe('applied');
    }
    expect(storage.read(CAMPAIGN_RUN_SAVE_STORAGE_KEY)).toBeUndefined();
    expect(storage.read(COMPOSED_CAMPAIGN_RUN_STORAGE_KEY)).toBeDefined();

    // A distinct seed starts a fresh run and overwrites only the composed key.
    const fresh = new GameSessionService({
      registry: registry(catalogStages(), true),
      storage,
    }).startRandomCampaign('seed.integration.after-completion');
    expect(fresh.ok).toBe(true);
    if (fresh.ok) {
      expect(fresh.value.persistence).toBe('created');
      expect(fresh.value.router.state().status).toBe('active');
    }
  });

  it('rejects duplicate confirms and double exit preparation without advancing twice', () => {
    const session = startRandom(new MemorySaveStorage());
    const inspected = session.router.inspect();
    expect(inspected.ok).toBe(true);
    if (!inspected.ok) return;
    const [destination] = inspected.value.snapshot.destinations;
    const prepared = session.router.prepare(destination.physicalExitId);
    expect(prepared.ok).toBe(true);
    if (!prepared.ok) return;
    expect(session.router.prepare(destination.physicalExitId))
      .toMatchObject({ ok: false, error: { code: 'transition-in-progress' } });
    const confirmed = session.router.confirm(prepared.value.preparationId);
    expect(confirmed.ok).toBe(true);
    if (!confirmed.ok) return;
    expect(session.router.confirm(prepared.value.preparationId))
      .toMatchObject({ ok: false, error: { code: 'transition-already-confirmed' } });
    // Linear fixed-nine topology has no return edge: the previous exit is gone.
    expect(session.router.prepare(destination.physicalExitId))
      .toMatchObject({ ok: false, error: { code: 'exit-not-found' } });
    expect(session.router.state().traversedEdgeIds).toHaveLength(1);
  });

  it('recovers a pending reward across reload without applying it twice', () => {
    const storage = new MemorySaveStorage();
    const seed = 'seed.integration.pending-reward';
    let session = startRandom(storage, seed);
    const inspected = session.router.inspect();
    expect(inspected.ok).toBe(true);
    if (!inspected.ok) return;
    const prepared = session.router.prepare(inspected.value.snapshot.destinations[0].physicalExitId);
    expect(prepared.ok).toBe(true);
    if (!prepared.ok) return;
    const confirmed = session.router.confirm(prepared.value.preparationId);
    expect(confirmed.ok).toBe(true);
    if (!confirmed.ok) return;
    const transitionId = confirmed.value.transition.transitionId;
    expect(session.router.reward(transitionId)?.status).toBe('pending');

    session = startRandom(storage, seed);
    expect(session.router.reward(transitionId)?.status).toBe('pending');
    expect(session.router.claimReward(transitionId).ok).toBe(true);
    expect(session.router.acknowledgeReward(transitionId).ok).toBe(true);

    session = startRandom(storage, seed);
    expect(session.router.reward(transitionId)?.status).toBe('applied');
    expect(session.router.claimReward(transitionId))
      .toMatchObject({ ok: false, error: { code: 'reward-already-applied' } });
  });

  it('accepts a persisted physical resolution whose keys were canonicalized by the save', () => {
    const session = startRandom(new MemorySaveStorage());
    const inspected = session.router.inspect();
    expect(inspected.ok).toBe(true);
    if (!inspected.ok) return;
    const state = session.router.state();
    const persisted = canonicalCampaignRunState({
      ...state,
      physicalExits: { [state.currentNodeId]: inspected.value.physicalExits },
    });
    const router = new CampaignRouter(persisted, {
      loader: new StageLoader(registry(catalogStages())),
      resolver: new PhysicalExitResolver(),
      binder: new CampaignExitBinder(),
    });
    const reinspected = router.inspect();
    expect(reinspected.ok).toBe(true);
  });

  it('keeps compositions, node identities and narrative scopes distinct across runs with the same phase definitions', () => {
    const storage = new MemorySaveStorage();
    const first = startRandom(storage, 'seed.integration.run-a');
    const second = startRandom(storage, 'seed.integration.run-b');
    const firstNodes = new Set(first.graph.nodes.map(node => node.id));
    expect(second.graph.nodes.some(node => firstNodes.has(node.id))).toBe(false);
    expect(second.snapshot.compositionId).not.toBe(first.snapshot.compositionId);
    expect(second.runId).not.toBe(first.runId);
    const sharedStage = first.snapshot.assignments
      .map(item => item.stageId)
      .find(id => second.snapshot.assignments.some(item => item.stageId === id));
    if (sharedStage) {
      const firstNode = first.graph.nodes.find(node => node.stageId === sharedStage);
      const secondNode = second.graph.nodes.find(node => node.stageId === sharedStage);
      expect(firstNode?.id).not.toBe(secondNode?.id);
    }
  });

  it('stops with a typed failure when the next stage cannot load, leaving the run unchanged', () => {
    const fullCatalog = StageCatalogService.create(registry(catalogStages()));
    expect(fullCatalog.ok).toBe(true);
    if (!fullCatalog.ok) return;
    const composedResult = new CampaignCompositionService(fullCatalog.value)
      .compose(createFixedNineCompositionRequest({
        campaignId: 'campaign.integration.cycle',
        campaignRevision: 1,
        runId: 'run.integration.missing-target',
        seed: SEED,
      }));
    expect(composedResult.ok).toBe(true);
    if (!composedResult.ok) return;
    expect(new CampaignGraphValidator().validate(composedResult.value.graph)).toEqual([]);

    const entryId = composedResult.value.snapshot.assignments[0].stageId;
    const targetId = composedResult.value.snapshot.assignments[1].stageId;
    const partialChapter: ChapterManifest = Object.freeze({
      schemaVersion: 1 as const,
      id: 'chapter.integration.partial',
      revision: 1,
      title: 'Partial integration',
      stageIds: Object.freeze([entryId, targetId]),
      entryStageId: entryId,
    });
    const partialModule = (id: string, order: number, target: string, levelId: string): StageModule =>
      Object.freeze({
        manifest: Object.freeze({
          schemaVersion: 1 as const,
          id,
          revision: 1,
          chapterId: partialChapter.id,
          order,
          title: id,
          summary: 'Partial integration fixture.',
          layout: Object.freeze({ kind: 'legacy' as const, levelId }),
          exits: Object.freeze([Object.freeze({
            id: `exit.${id}.${target}`,
            anchor: Object.freeze({ kind: 'map-exit' as const }),
            targetStageId: target,
          })]),
        }),
      });
    const partialRegistry = new StageRegistry();
    partialRegistry.registerChapter(partialChapter, [
      partialModule(entryId, 0, targetId, 'verse_01_atrium'),
      partialModule(targetId, 1, COMPLETE, 'missing.level'),
    ]);
    const router = new CampaignRouter(
      createCampaignRunState(composedResult.value.graph, composedResult.value.snapshot),
      {
        loader: new StageLoader(partialRegistry),
        resolver: new PhysicalExitResolver(),
        binder: new CampaignExitBinder(),
      },
    );
    const inspected = router.inspect();
    expect(inspected.ok).toBe(true);
    if (!inspected.ok) return;
    const before = JSON.stringify(router.state());
    const prepared = router.prepare(inspected.value.snapshot.destinations[0].physicalExitId);
    expect(prepared).toMatchObject({ ok: false, error: { code: 'target-stage-load-failed' } });
    expect(JSON.stringify(router.state())).toBe(before);
  });
});
