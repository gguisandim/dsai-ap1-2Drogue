import {
  CampaignRunSaveService,
  CampaignRouter,
  createCampaignRunState,
  type CampaignRunState,
} from '../application/stages';
import {
  CampaignExitBinder,
  CampaignGraphGenerator,
  PhysicalExitResolver,
  type CampaignExitBindingResult,
  type CampaignGraph,
  type LoadedStage,
  type PhysicalExitResult,
  type RegionTemplate,
  type StageLoadRequest,
  type StageLoadResult,
} from '../stages';
import { MemorySaveStorage, type SaveStoragePort } from '../narrative';
import type { LevelDefinition } from '../data/LevelData';

function template(id: string): RegionTemplate {
  return {
    id: `router.region.${id}`,
    revision: 1,
    stageId: `router.stage.${id}`,
    allowedActIds: ['act-1', 'act-2', 'act-3'],
    allowedBiomeIds: ['cathedral'],
    difficulty: { minimum: 1, maximum: 9 },
    weight: 1,
    maximumPhysicalExits: 3,
    tags: [],
    providesBeatIds: ['beat.act-1', 'beat.act-2', 'beat.act-3'],
    revisit: 'repeatable',
  };
}

const CATALOG = ['a', 'b', 'c', 'd', 'e', 'f'].map(template);

function graph(seed = 'router-seed'): CampaignGraph {
  const result = new CampaignGraphGenerator().generate({
    campaignId: 'campaign.router-test',
    campaignRevision: 1,
    catalogRevision: 1,
    runId: 'run.router-test',
    runSeed: seed,
    templates: CATALOG,
    context: { flags: {}, completedEventIds: [], revealedBeatIds: [] },
  });
  if (!result.ok) throw result.error;
  return result.value;
}

const ROOM = [
  [1, 1, 1, 1, 1, 1, 1],
  [1, 8, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1],
];

function level(stageId: string): LevelDefinition {
  return {
    id: stageId,
    name: stageId,
    description: 'Campaign router test stage.',
    theme: 'gothic_cathedral',
    music: 'none',
    ambientColor: 0,
    fogColor: 0,
    fogDensity: 0,
    lightIntensity: 1,
    tileMap: ROOM.map(row => [...row]),
    enemies: [],
    items: [],
    decorations: [],
    parTime: 30,
    difficulty: 1,
  };
}

function loadedStage(stageId: string): LoadedStage {
  return {
    manifest: {
      schemaVersion: 1,
      id: stageId,
      revision: 1,
      chapterId: 'chapter.router-test',
      order: 0,
      title: stageId,
      summary: 'Router fixture',
      layout: { kind: 'authored' },
      exits: [],
    },
    level: level(stageId),
    narrative: {},
    npcs: [],
    dialogues: [],
    missions: [],
    events: [],
    diagnostics: [],
  };
}

class RecordingLoader {
  public readonly requests: StageLoadRequest[] = [];
  public readonly levelOverrides = new Map<string, LevelDefinition>();
  public failStageId?: string;

  public load(request: StageLoadRequest): StageLoadResult {
    this.requests.push(request);
    if (request.stageId === this.failStageId) return {
      ok: false,
      error: {
        code: 'stage-not-found',
        stageId: request.stageId,
        diagnostics: [{
          code: 'stage.load.not-found', severity: 'error', message: 'Missing stage.',
          path: ['request', 'stageId'], stageId: request.stageId,
        }],
      },
    };
    const stage = loadedStage(request.stageId);
    const override = this.levelOverrides.get(request.stageId);
    return { ok: true, value: override ? { ...stage, level: override } : stage };
  }
}

function dependencies(loader: RecordingLoader, saves?: CampaignRunSaveService) {
  return {
    loader,
    resolver: new PhysicalExitResolver(),
    binder: new CampaignExitBinder(),
    ...(saves ? { saves } : {}),
  };
}

function persistedRouter(run: CampaignRunState, loader = new RecordingLoader()) {
  const storage = new MemorySaveStorage();
  const saves = new CampaignRunSaveService({ storage });
  const initial = saves.save(run);
  if (!initial.ok) throw initial.error;
  return { router: new CampaignRouter(run, dependencies(loader, saves)), loader, storage, saves };
}

function prepareAvailable(router: CampaignRouter, branchId?: string) {
  const inspected = router.inspect();
  if (!inspected.ok) throw inspected.error;
  const destination = branchId
    ? inspected.value.snapshot.destinations.find(item => {
        const target = inspected.value.currentNode.id === item.targetNodeId
          ? undefined
          : inspected.value.loadedStage && router.state().graph.nodes
            .find(node => node.id === item.targetNodeId);
        return target?.branchId === branchId;
      })
    : inspected.value.snapshot.destinations.find(item => item.available);
  if (!destination) throw new Error('Expected an available destination.');
  const prepared = router.prepare(destination.physicalExitId);
  if (!prepared.ok) throw prepared.error;
  return prepared.value;
}

describe('CampaignRouter', () => {
  it('navigates a selected physical exit through a branch and its rejoin', () => {
    const run = createCampaignRunState(graph());
    const { router } = persistedRouter(run);
    const branch = prepareAvailable(router, 'route-a');

    expect(router.state()).toEqual(run);
    expect(branch.targetNodeId).not.toBe('campaign.complete');
    expect(branch.identity).toMatchObject({
      runId: run.graph.runId,
      runSeed: run.graph.runSeed,
      stageInstanceId: branch.targetNodeId,
    });
    const confirmedBranch = router.confirm(branch.preparationId);
    expect(confirmedBranch.ok).toBe(true);
    if (!confirmedBranch.ok) return;
    expect(router.state().currentNodeId).toBe(branch.targetNodeId);

    const rejoin = prepareAvailable(router);
    const confirmedRejoin = router.confirm(rejoin.preparationId);
    expect(confirmedRejoin.ok).toBe(true);
    expect(router.state().traversedEdgeIds).toEqual([branch.edgeId, rejoin.edgeId]);
    expect(router.state().visitedNodeIds).toEqual(expect.arrayContaining([
      run.graph.entryNodeId,
      branch.targetNodeId,
      rejoin.targetNodeId,
    ]));
    const target = router.state().graph.nodes.find(node => node.id === rejoin.targetNodeId);
    expect(target?.branchId).toBe('main');
  });

  it('selects exits only by physicalExitId and rejects unknown or blocked exits', () => {
    const base = createCampaignRunState(graph());
    const router = new CampaignRouter(base, dependencies(new RecordingLoader()));
    const before = router.state();

    const unknown = router.prepare('physical.unknown');
    expect(unknown.ok).toBe(false);
    if (!unknown.ok) expect(unknown.error.code).toBe('exit-not-found');
    expect(router.state()).toBe(before);

    const inspected = router.inspect();
    if (!inspected.ok) throw inspected.error;
    const blockedDestination = inspected.value.snapshot.destinations[1];
    const blockedRun: CampaignRunState = {
      ...base,
      revealedEdgeIds: [inspected.value.snapshot.destinations[0].edgeId],
    };
    const blockedRouter = new CampaignRouter(blockedRun, dependencies(new RecordingLoader()));
    const blocked = blockedRouter.prepare(blockedDestination.physicalExitId);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.error.code).toBe('exit-blocked');
      expect(blocked.error.message).toContain('edge-not-revealed');
    }
  });

  it('delegates edge-condition eligibility to the supplied access view', () => {
    const generated = graph();
    const edge = generated.edges.find(item => item.sourceNodeId === generated.entryNodeId);
    if (!edge) throw new Error('Entry edge missing.');
    const conditioned: CampaignGraph = {
      ...generated,
      edges: generated.edges.map(item => item.id === edge.id
        ? { ...item, condition: { type: 'flag.equals', flag: 'route.open', value: true } }
        : item),
    };
    const run = createCampaignRunState(conditioned);
    const router = new CampaignRouter(run, dependencies(new RecordingLoader()));
    const blocked = router.inspect();
    if (!blocked.ok) throw blocked.error;
    expect(blocked.value.snapshot.destinations.find(item => item.edgeId === edge.id))
      .toMatchObject({ available: false, blockedReason: 'edge-condition-unmet' });

    router.setAccess({ eligibleEdgeIds: [edge.id], unlockedStageExitIds: [] });
    const available = router.inspect();
    if (!available.ok) throw available.error;
    expect(available.value.snapshot.destinations.find(item => item.edgeId === edge.id))
      .toMatchObject({ available: true });
  });

  it('prepares the target with node seed and resume before changing state', () => {
    const base = createCampaignRunState(graph());
    const probe = new CampaignRouter(base, dependencies(new RecordingLoader()));
    const inspected = probe.inspect();
    if (!inspected.ok) throw inspected.error;
    const destination = inspected.value.snapshot.destinations[0];
    const target = base.graph.nodes.find(node => node.id === destination.targetNodeId);
    if (!target) throw new Error('Target missing.');
    const resume = {
      stageId: target.stageId,
      manifestRevision: 1,
      runId: base.graph.runId,
      runSeed: target.stageSeed,
      flags: {}, missionStates: {}, collectedEntityIds: [], appliedOperationIds: [],
    };
    const run: CampaignRunState = { ...base, nodeResumes: { [target.id]: resume } };
    const loader = new RecordingLoader();
    const router = new CampaignRouter(run, dependencies(loader));
    const before = router.state();

    const prepared = router.prepare(destination.physicalExitId);

    expect(prepared.ok).toBe(true);
    expect(router.state()).toBe(before);
    expect(loader.requests.at(-1)).toEqual({
      stageId: target.stageId,
      runId: run.graph.runId,
      runSeed: target.stageSeed,
      resume,
    });
  });

  it('prevents concurrent preparation and repeated confirmation', () => {
    const router = new CampaignRouter(createCampaignRunState(graph()), dependencies(new RecordingLoader()));
    const prepared = prepareAvailable(router);

    const concurrent = router.prepare(prepared.physicalExitId);
    expect(concurrent.ok).toBe(false);
    if (!concurrent.ok) expect(concurrent.error.code).toBe('transition-in-progress');

    expect(router.confirm(prepared.preparationId).ok).toBe(true);
    const repeated = router.confirm(prepared.preparationId);
    expect(repeated.ok).toBe(false);
    if (!repeated.ok) expect(repeated.error.code).toBe('transition-already-confirmed');
  });

  it('preserves state and save when target loading fails', () => {
    const run = createCampaignRunState(graph());
    const loader = new RecordingLoader();
    const { router, storage } = persistedRouter(run, loader);
    const inspected = router.inspect();
    if (!inspected.ok) throw inspected.error;
    const destination = inspected.value.snapshot.destinations[0];
    const target = run.graph.nodes.find(node => node.id === destination.targetNodeId);
    if (!target) throw new Error('Target missing.');
    loader.failStageId = target.stageId;
    const beforeState = router.state();
    const beforeStorage = storage.snapshot();

    const prepared = router.prepare(destination.physicalExitId);

    expect(prepared.ok).toBe(false);
    if (!prepared.ok) expect(prepared.error.code).toBe('target-stage-load-failed');
    expect(router.state()).toBe(beforeState);
    expect(storage.snapshot()).toEqual(beforeStorage);
  });

  it('preserves state for current load, resolver and binder failures', () => {
    const run = createCampaignRunState(graph());
    const loader = new RecordingLoader();
    loader.failStageId = run.graph.nodes.find(node => node.id === run.currentNodeId)?.stageId;
    const loadRouter = new CampaignRouter(run, dependencies(loader));
    const loadFailure = loadRouter.inspect();
    expect(loadFailure.ok).toBe(false);
    if (!loadFailure.ok) expect(loadFailure.error.code).toBe('current-stage-load-failed');

    const physicalFailure: PhysicalExitResult = {
      ok: false,
      error: {
        code: 'insufficient-exit-space',
        diagnostics: [{
          code: 'physical-exit.insufficient-space', severity: 'error', message: 'No space.', path: ['level'],
        }],
      },
    };
    const resolverRouter = new CampaignRouter(run, {
      ...dependencies(new RecordingLoader()),
      resolver: { resolve: () => physicalFailure },
    });
    const resolverFailure = resolverRouter.inspect();
    expect(resolverFailure.ok).toBe(false);
    if (!resolverFailure.ok) expect(resolverFailure.error.code).toBe('physical-resolution-failed');

    const bindingFailure: CampaignExitBindingResult = {
      ok: false,
      error: {
        code: 'physical-exit-mismatch',
        diagnostics: [{
          code: 'campaign-exit.physical-exit-incompatible', severity: 'error',
          message: 'Mismatch.', path: ['binding'],
        }],
      },
    };
    const binderRouter = new CampaignRouter(run, {
      ...dependencies(new RecordingLoader()),
      binder: { bind: () => bindingFailure },
    });
    const binderFailureResult = binderRouter.inspect();
    expect(binderFailureResult.ok).toBe(false);
    if (!binderFailureResult.ok) expect(binderFailureResult.error.code).toBe('binding-failed');
    expect(loadRouter.state()).toEqual(run);
    expect(resolverRouter.state()).toEqual(run);
    expect(binderRouter.state()).toEqual(run);
  });

  it('rolls memory and storage back when persistence fails before writing', () => {
    const run = createCampaignRunState(graph());
    const initialStorage = new MemorySaveStorage();
    const initialService = new CampaignRunSaveService({ storage: initialStorage });
    if (!initialService.save(run).ok) throw new Error('Initial save failed.');
    const bytes = initialStorage.snapshot()['umbra-trail-run-v1'];
    const storage: SaveStoragePort = {
      read: () => bytes,
      write: () => { throw new Error('disk full'); },
    };
    const saves = new CampaignRunSaveService({ storage });
    const router = new CampaignRouter(run, dependencies(new RecordingLoader(), saves));
    const before = router.state();
    const prepared = prepareAvailable(router);

    const confirmed = router.confirm(prepared.preparationId);

    expect(confirmed.ok).toBe(false);
    if (!confirmed.ok) {
      expect(confirmed.error.code).toBe('persistence-failed');
      expect(confirmed.error.recovery).toBe('rolled-back');
    }
    expect(router.state()).toBe(before);
  });

  it('accepts a write that threw only after candidate bytes became durable', () => {
    const run = createCampaignRunState(graph());
    const values = new Map<string, string>();
    const seed = new CampaignRunSaveService({
      storage: { read: key => values.get(key), write: (key, value) => values.set(key, value) },
    });
    if (!seed.save(run).ok) throw new Error('Initial save failed.');
    const storage: SaveStoragePort = {
      read: key => values.get(key),
      write: (key, value) => { values.set(key, value); throw new Error('late acknowledgement'); },
    };
    const router = new CampaignRouter(run, dependencies(
      new RecordingLoader(), new CampaignRunSaveService({ storage }),
    ));
    const prepared = prepareAvailable(router);

    const confirmed = router.confirm(prepared.preparationId);

    expect(confirmed.ok).toBe(true);
    if (confirmed.ok) expect(confirmed.value.persistence).toBe('verified-after-error');
    expect(router.state().currentNodeId).toBe(prepared.targetNodeId);
  });

  it('reports unknown storage state without claiming cross-key atomicity', () => {
    const run = createCampaignRunState(graph());
    const values = new Map<string, string>();
    const seed = new CampaignRunSaveService({
      storage: { read: key => values.get(key), write: (key, value) => values.set(key, value) },
    });
    if (!seed.save(run).ok) throw new Error('Initial save failed.');
    const storage: SaveStoragePort = {
      read: key => values.get(key),
      write: key => { values.set(key, '{unknown'); throw new Error('partial write'); },
    };
    const router = new CampaignRouter(run, dependencies(
      new RecordingLoader(), new CampaignRunSaveService({ storage }),
    ));
    const prepared = prepareAvailable(router);

    const confirmed = router.confirm(prepared.preparationId);

    expect(confirmed.ok).toBe(false);
    if (!confirmed.ok) {
      expect(confirmed.error.recovery).toBe('storage-state-unknown');
      expect(confirmed.error.persistenceFailure?.code).toBe('storage-state-unknown');
    }
    expect(router.state()).toEqual(run);
  });

  it('restores a persisted run with graph, cursor, history and placements intact', () => {
    const run = createCampaignRunState(graph());
    const { router, saves } = persistedRouter(run);
    const prepared = prepareAvailable(router);
    const confirmed = router.confirm(prepared.preparationId);
    if (!confirmed.ok) throw confirmed.error;

    const restored = saves.load({
      campaignId: run.graph.campaignId,
      campaignRevision: run.graph.campaignRevision,
      runId: run.graph.runId,
      runSeed: run.graph.runSeed,
      graphId: run.graph.id,
    });

    expect(restored.ok).toBe(true);
    if (!restored.ok || restored.value.status === 'empty') return;
    expect(restored.value.envelope.state).toEqual(router.state());
    expect(restored.value.envelope.state.physicalExits[run.currentNodeId]).toBeDefined();
  });

  it('does not read or overwrite the independent narrative save key', () => {
    const run = createCampaignRunState(graph());
    const storage = new MemorySaveStorage({
      'umbra-trail-campaign-v1': 'narrative-bytes-must-remain-unchanged',
    });
    const saves = new CampaignRunSaveService({ storage });
    if (!saves.save(run).ok) throw new Error('Initial run save failed.');
    const router = new CampaignRouter(run, dependencies(new RecordingLoader(), saves));
    const prepared = prepareAvailable(router);
    const confirmed = router.confirm(prepared.preparationId);

    expect(confirmed.ok).toBe(true);
    expect(storage.snapshot()['umbra-trail-campaign-v1'])
      .toBe('narrative-bytes-must-remain-unchanged');
  });

  it('rejects a persisted physical placement incompatible with deterministic regeneration', () => {
    const base = createCampaignRunState(graph());
    const probe = new CampaignRouter(base, dependencies(new RecordingLoader()));
    const inspected = probe.inspect();
    if (!inspected.ok) throw inspected.error;
    const incompatible = {
      ...inspected.value.physicalExits,
      exits: inspected.value.physicalExits.exits.map((exit, index) => index === 0
        ? { ...exit, tile: { x: exit.tile.x + 1, y: exit.tile.y } }
        : exit),
    };
    const run: CampaignRunState = {
      ...base,
      physicalExits: { [base.currentNodeId]: incompatible },
    };
    const router = new CampaignRouter(run, dependencies(new RecordingLoader()));

    const result = router.inspect();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('physical-resolution-failed');
      expect(result.error.physicalExitFailure?.code).toBe('saved-placement-incompatible');
    }
    expect(router.state().currentNodeId).toBe(base.currentNodeId);
  });

  it('preserves unknown or corrupt save bytes and rejects incompatible identity', () => {
    const run = createCampaignRunState(graph());
    const corrupt = new MemorySaveStorage({ 'umbra-trail-run-v1': '{broken' });
    const corruptService = new CampaignRunSaveService({ storage: corrupt });
    expect(corruptService.load().ok).toBe(false);
    expect(corruptService.save(run).ok).toBe(false);
    expect(corrupt.snapshot()['umbra-trail-run-v1']).toBe('{broken');

    const storage = new MemorySaveStorage();
    const saves = new CampaignRunSaveService({ storage });
    if (!saves.save(run).ok) throw new Error('Initial save failed.');
    const incompatible = saves.load({
      campaignId: run.graph.campaignId,
      campaignRevision: run.graph.campaignRevision,
      runId: 'run.other',
      runSeed: run.graph.runSeed,
    });
    expect(incompatible.ok).toBe(false);
    if (!incompatible.ok) expect(incompatible.error.code).toBe('identity-mismatch');
  });

  it('produces deterministic public navigation snapshots and preparation ids', () => {
    const run = createCampaignRunState(graph());
    const first = new CampaignRouter(run, dependencies(new RecordingLoader()));
    const second = new CampaignRouter(run, dependencies(new RecordingLoader()));
    const firstView = first.inspect();
    const secondView = second.inspect();
    expect(secondView).toEqual(firstView);
    if (!firstView.ok || !secondView.ok) return;

    const physicalExitId = firstView.value.snapshot.destinations[0].physicalExitId;
    const firstPrepared = first.prepare(physicalExitId);
    const secondPrepared = second.prepare(physicalExitId);
    expect(secondPrepared).toEqual(firstPrepared);
  });

  it('confirms campaign completion without inventing another stage cursor', () => {
    const run = createCampaignRunState(graph());
    const router = new CampaignRouter(run, dependencies(new RecordingLoader()));
    let lastNodeId = router.state().currentNodeId;
    for (let step = 0; step < 9 && router.state().status === 'active'; step += 1) {
      const prepared = prepareAvailable(router);
      lastNodeId = router.state().currentNodeId;
      const confirmed = router.confirm(prepared.preparationId);
      if (!confirmed.ok) throw confirmed.error;
    }

    expect(router.state().status).toBe('completed');
    expect(router.state().currentNodeId).toBe(lastNodeId);
    const lastEdge = router.state().graph.edges.find(item =>
      item.id === router.state().traversedEdgeIds.at(-1));
    expect(lastEdge?.targetNodeId).toBe('campaign.complete');
    const after = router.prepare('physical.any');
    expect(after.ok).toBe(false);
    if (!after.ok) expect(after.error.code).toBe('run-completed');
  });

  it('journals a reward with the confirmed transition and settles it once', () => {
    const run = createCampaignRunState(graph());
    const { router, storage, saves } = persistedRouter(run);
    const prepared = prepareAvailable(router);
    const sourceNodeId = router.state().currentNodeId;
    const sourceStageId = run.graph.nodes.find(node => node.id === sourceNodeId)?.stageId;

    const confirmed = router.confirm(prepared.preparationId);
    if (!confirmed.ok) throw confirmed.error;

    const record = router.rewards()[0];
    expect(record).toMatchObject({
      transitionId: prepared.transitionId,
      stageInstanceId: sourceNodeId,
      stageId: sourceStageId,
      difficulty: 1,
      parSeconds: 30,
      status: 'pending',
    });
    expect(router.pendingRewards()).toEqual([record]);

    const claimed = router.claimReward(prepared.transitionId);
    expect(claimed).toMatchObject({
      ok: true,
      value: { persistence: expect.stringMatching(/saved|verified-after-error/), reward: { status: 'claimed' } },
    });
    expect(router.pendingRewards()).toEqual([]);
    expect(router.claimReward(prepared.transitionId)).toMatchObject({
      ok: false, error: { code: 'reward-already-claimed' },
    });

    expect(router.acknowledgeReward(prepared.transitionId)).toMatchObject({
      ok: true, value: { reward: { status: 'applied' } },
    });
    expect(router.acknowledgeReward(prepared.transitionId)).toMatchObject({ ok: true });

    const loaded = saves.load({
      campaignId: run.graph.campaignId,
      campaignRevision: run.graph.campaignRevision,
      runId: run.graph.runId,
      runSeed: run.graph.runSeed,
      graphId: run.graph.id,
    });
    if (!loaded.ok || loaded.value.status !== 'loaded') throw new Error('Expected a loaded run.');
    expect(loaded.value.envelope.state.rewards[prepared.transitionId].status).toBe('applied');
    expect(storage.read('umbra-trail-run-v1')).toEqual(expect.any(String));
  });

  it('exposes a pending reward after a crash between confirmation and claim', () => {
    const run = createCampaignRunState(graph());
    const { router, storage, saves } = persistedRouter(run);
    const prepared = prepareAvailable(router);
    const confirmed = router.confirm(prepared.preparationId);
    if (!confirmed.ok) throw confirmed.error;

    const loaded = new CampaignRunSaveService({ storage }).load({
      campaignId: run.graph.campaignId,
      campaignRevision: run.graph.campaignRevision,
      runId: run.graph.runId,
      runSeed: run.graph.runSeed,
      graphId: run.graph.id,
    });
    if (!loaded.ok || loaded.value.status !== 'loaded') throw new Error('Expected a loaded run.');
    const restored = new CampaignRouter(
      loaded.value.envelope.state,
      dependencies(new RecordingLoader(), saves),
    );

    expect(restored.pendingRewards().map(reward => reward.transitionId))
      .toEqual([prepared.transitionId]);
    expect(restored.claimReward(prepared.transitionId).ok).toBe(true);
    expect(restored.acknowledgeReward(prepared.transitionId).ok).toBe(true);
  });

  it('does not expose a claimed reward as pending after restart', () => {
    const run = createCampaignRunState(graph());
    const { router, storage, saves } = persistedRouter(run);
    const prepared = prepareAvailable(router);
    const confirmed = router.confirm(prepared.preparationId);
    if (!confirmed.ok) throw confirmed.error;
    expect(router.claimReward(prepared.transitionId).ok).toBe(true);

    const loaded = new CampaignRunSaveService({ storage }).load({
      campaignId: run.graph.campaignId,
      campaignRevision: run.graph.campaignRevision,
      runId: run.graph.runId,
      runSeed: run.graph.runSeed,
      graphId: run.graph.id,
    });
    if (!loaded.ok || loaded.value.status !== 'loaded') throw new Error('Expected a loaded run.');
    const restored = new CampaignRouter(
      loaded.value.envelope.state,
      dependencies(new RecordingLoader(), saves),
    );

    expect(restored.pendingRewards()).toEqual([]);
    expect(restored.unsettledRewards().map(reward => reward.transitionId))
      .toEqual([prepared.transitionId]);
    expect(restored.reward(prepared.transitionId)).toMatchObject({ status: 'claimed' });
    expect(restored.claimReward(prepared.transitionId)).toMatchObject({
      ok: false, error: { code: 'reward-already-claimed' },
    });
  });

  it('keeps a reward pending when the claim write is rolled back', () => {
    const run = createCampaignRunState(graph());
    const save = jest.fn();
    const router = new CampaignRouter(run, {
      loader: new RecordingLoader(),
      resolver: new PhysicalExitResolver(),
      binder: new CampaignExitBinder(),
      saves: { save } as never,
    });
    const prepared = prepareAvailable(router);
    save.mockReturnValue({ ok: true, value: { envelope: {}, persistence: 'written' } });
    const confirmed = router.confirm(prepared.preparationId);
    if (!confirmed.ok) throw confirmed.error;
    const before = router.state();
    save.mockReturnValueOnce({
      ok: false,
      error: {
        code: 'storage-write-failed',
        message: 'fixture failure',
        diagnostics: [],
        recovery: 'previous-preserved',
      },
    });

    const claimed = router.claimReward(prepared.transitionId);

    expect(claimed).toMatchObject({
      ok: false, error: { code: 'persistence-failed', recovery: 'rolled-back' },
    });
    expect(router.state()).toBe(before);
    expect(router.pendingRewards().map(reward => reward.transitionId))
      .toEqual([prepared.transitionId]);
  });

  it('refuses to prepare a target stage without usable exits before persisting', () => {
    const run = createCampaignRunState(graph());
    const loader = new RecordingLoader();
    const { router, storage } = persistedRouter(run, loader);
    const inspected = router.inspect();
    if (!inspected.ok) throw inspected.error;
    const currentStageId = inspected.value.currentNode.stageId;
    const destination = inspected.value.snapshot.destinations.find(item => {
      const target = run.graph.nodes.find(node => node.id === item.targetNodeId);
      return target && target.stageId !== currentStageId;
    });
    if (!destination) throw new Error('Expected a destination in another stage.');
    const target = run.graph.nodes.find(node => node.id === destination.targetNodeId);
    if (!target) throw new Error('Target missing.');
    const sealed = level(target.stageId);
    sealed.tileMap = [
      [1, 1, 1],
      [1, 8, 1],
      [1, 1, 1],
    ];
    loader.levelOverrides.set(target.stageId, sealed);
    const beforeState = router.state();
    const beforeStorage = storage.snapshot();

    const prepared = router.prepare(destination.physicalExitId);

    expect(prepared.ok).toBe(false);
    if (!prepared.ok) {
      expect(prepared.error.code).toBe('target-navigation-failed');
      expect(prepared.error.targetFailureCode).toBe('physical-resolution-failed');
    }
    expect(router.state()).toBe(beforeState);
    expect(storage.snapshot()).toEqual(beforeStorage);
  });

  it('loads a legacy run save without a reward journal', () => {
    const run = createCampaignRunState(graph());
    const storage = new MemorySaveStorage();
    const saves = new CampaignRunSaveService({ storage });
    expect(saves.save(run).ok).toBe(true);
    const raw = JSON.parse(storage.read('umbra-trail-run-v1') as string);
    delete raw.state.rewards;
    storage.write('umbra-trail-run-v1', JSON.stringify(raw));

    const loaded = saves.load({
      campaignId: run.graph.campaignId,
      campaignRevision: run.graph.campaignRevision,
      runId: run.graph.runId,
      runSeed: run.graph.runSeed,
      graphId: run.graph.id,
    });

    expect(loaded.ok).toBe(true);
    if (!loaded.ok || loaded.value.status !== 'loaded') throw new Error('Expected a loaded run.');
    expect(loaded.value.envelope.state.rewards).toEqual({});
  });
});

