import {
  BRANCHING_CAMPAIGN_PILOT_ID,
  CampaignRunSaveService,
  GameStageCompositionRoot,
} from '../application/stages';
import { MemorySaveStorage } from '../narrative';

function createRoot(storage = new MemorySaveStorage()) {
  const root = new GameStageCompositionRoot({ campaignStorage: storage });
  const result = root.createBranchingCampaign({
    runId: 'pilot.test-run',
    runSeed: 'pilot-seed-731',
  });
  if (!result.ok) throw result.error;
  return { root, storage, session: result.value };
}

function prepareBranch(session: ReturnType<typeof createRoot>['session'], branchId: 'route-a' | 'route-b') {
  const destination = session.initialNavigation.snapshot.destinations.find(item => {
    const node = session.router.state().graph.nodes.find(candidate => candidate.id === item.targetNodeId);
    return node?.branchId === branchId;
  });
  if (!destination) throw new Error(`Missing ${branchId}.`);
  const prepared = session.router.prepare(destination.physicalExitId);
  if (!prepared.ok) throw prepared.error;
  return prepared.value;
}

describe('BranchingCampaignPilotFactory', () => {
  it('builds a valid persisted pilot from exactly the three legacy verse templates', () => {
    const { storage, session } = createRoot();
    const graph = session.router.state().graph;

    expect(graph.campaignId).toBe(BRANCHING_CAMPAIGN_PILOT_ID);
    expect(graph.nodes.length).toBeGreaterThanOrEqual(9);
    expect(new Set(graph.nodes.map(node => node.stageId))).toEqual(new Set([
      'verse_01_atrium', 'verse_02_galeria', 'verse_03_santuario',
    ]));
    expect(session.initialNavigation.snapshot.destinations).toHaveLength(2);
    expect(session.persistence).toBe('created');
    expect(storage.read('umbra-trail-run-v1')).toEqual(expect.any(String));
  });

  it.each(['route-a', 'route-b'] as const)(
    'selects %s by physical id, restores it and rejoins the main path',
    branchId => {
      const storage = new MemorySaveStorage({
        'umbra-trail-campaign-v1': 'narrative-save-must-not-change',
      });
      const first = createRoot(storage).session;
      const branch = prepareBranch(first, branchId);
      const branchConfirmation = first.router.confirm(branch.preparationId);
      expect(branchConfirmation.ok).toBe(true);
      const branchNodeId = first.router.state().currentNodeId;

      const restored = createRoot(storage).session;
      expect(restored.persistence).toBe('restored');
      expect(restored.router.state().currentNodeId).toBe(branchNodeId);
      const view = restored.router.inspect();
      if (!view.ok) throw view.error;
      const rejoinDestination = view.value.snapshot.destinations.find(item => item.available);
      if (!rejoinDestination) throw new Error('Missing rejoin destination.');
      const rejoin = restored.router.prepare(rejoinDestination.physicalExitId);
      if (!rejoin.ok) throw rejoin.error;
      expect(restored.router.confirm(rejoin.value.preparationId).ok).toBe(true);
      const current = restored.router.state().graph.nodes.find(node =>
        node.id === restored.router.state().currentNodeId);

      expect(current?.branchId).toBe('main');
      expect(restored.router.state().traversedEdgeIds).toEqual([branch.edgeId, rejoin.value.edgeId]);
      expect(storage.read('umbra-trail-campaign-v1')).toBe('narrative-save-must-not-change');
    },
  );

  it('is deterministic and does not overwrite an incompatible or corrupt run save', () => {
    const first = createRoot(new MemorySaveStorage()).session;
    const second = createRoot(new MemorySaveStorage()).session;
    expect(second.router.state().graph).toEqual(first.router.state().graph);
    expect(second.initialNavigation.snapshot).toEqual(first.initialNavigation.snapshot);

    const storage = new MemorySaveStorage({ 'umbra-trail-run-v1': '{corrupt' });
    const result = new GameStageCompositionRoot({ campaignStorage: storage })
      .createBranchingCampaign({ runId: 'pilot.test-run', runSeed: 'pilot-seed-731' });
    expect(result).toMatchObject({
      ok: false,
      error: { code: 'run-persistence-failed', error: { code: 'invalid-json' } },
    });
    expect(storage.read('umbra-trail-run-v1')).toBe('{corrupt');
  });

  it('does not create a partial run save when initial stage validation fails', () => {
    const storage = new MemorySaveStorage();
    const root = new GameStageCompositionRoot({
      campaignStorage: storage,
      loader: {
        load: request => ({
          ok: false,
          error: {
            code: 'load-failed',
            stageId: request.stageId,
            diagnostics: [{
              code: 'pilot.load.failed', severity: 'error', message: 'fixture failure',
              path: ['stage'], stageId: request.stageId,
            }],
          },
        }),
      },
    });

    const result = root.createBranchingCampaign({
      runId: 'pilot.failed-run',
      runSeed: 'pilot-seed-731',
    });

    expect(result).toMatchObject({
      ok: false,
      error: { code: 'initial-navigation-failed', error: { code: 'current-stage-load-failed' } },
    });
    expect(storage.read('umbra-trail-run-v1')).toBeUndefined();
  });

  it('loads the state saved by the public run service without resampling its graph', () => {
    const { storage, session } = createRoot();
    const loaded = new CampaignRunSaveService({ storage }).load({
      campaignId: session.router.state().graph.campaignId,
      campaignRevision: 1,
      runId: 'pilot.test-run',
      runSeed: 'pilot-seed-731',
      graphId: session.router.state().graph.id,
    });
    expect(loaded).toMatchObject({ ok: true, value: { status: 'loaded' } });
  });

  it('restores and exposes a pending reward after a crash between confirm and claim', () => {
    const storage = new MemorySaveStorage();
    const first = createRoot(storage).session;
    const branch = prepareBranch(first, 'route-a');
    expect(first.router.confirm(branch.preparationId).ok).toBe(true);

    const restored = createRoot(storage).session;

    expect(restored.router.pendingRewards().map(reward => reward.transitionId))
      .toEqual([branch.transitionId]);
    expect(restored.router.claimReward(branch.transitionId).ok).toBe(true);
    expect(restored.router.pendingRewards()).toEqual([]);
  });
});
