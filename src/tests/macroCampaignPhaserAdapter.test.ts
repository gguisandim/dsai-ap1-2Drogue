import {
  GameStageCompositionRoot,
  UMBRA_ROUTE_SLICE_HUB_CONTEXT,
  UMBRA_ROUTE_SLICE_WATERS_CONTEXT,
} from '../application/stages';
import { MemorySaveStorage, type SaveStoragePort } from '../narrative';

const RUN_ID = 'run.macro-phaser-adapter';
const RUN_SEED = 'seed.macro-phaser-adapter';

class ToggleStorage implements SaveStoragePort {
  public failWrites = false;
  public readonly memory = new MemorySaveStorage();

  public read(key: string): string | undefined {
    return this.memory.read(key);
  }

  public write(key: string, value: string): void {
    if (this.failWrites) throw new Error('fixture write failure');
    this.memory.write(key, value);
  }
}

function create(storage: SaveStoragePort = new MemorySaveStorage()) {
  const result = new GameStageCompositionRoot({ campaignStorage: storage })
    .createMacroCampaign({ runId: RUN_ID, runSeed: RUN_SEED });
  if (!result.ok) throw result.error;
  return result.value;
}

function inspect(value: ReturnType<typeof create>) {
  const result = value.adapter.inspect();
  if (!result.ok) throw result.error;
  return result.value;
}

function navigate(value: ReturnType<typeof create>, physicalExitId: string) {
  const prepared = value.adapter.prepare(physicalExitId);
  if (!prepared.ok) throw prepared.error;
  const confirmed = value.adapter.confirm(prepared.value.preparationId);
  if (!confirmed.ok) throw confirmed.error;
  return { prepared: prepared.value, confirmed: confirmed.value };
}

describe('GameMacroCampaignAdapter', () => {
  it('projects only the loadable hub to Igapó physical connection', () => {
    const session = create();
    const view = inspect(session);

    expect(view.currentNode.stageId).toBe('verse_01_atrium');
    expect(view.snapshot.destinations).toHaveLength(1);
    expect(view.snapshot.destinations[0]).toMatchObject({
      sourceStageId: 'verse_01_atrium',
      targetStageId: 'verse_02_galeria',
      physicalExitId: expect.any(String),
      available: true,
    });
    expect(session.adapter.location()).toEqual(expect.objectContaining({
      regionName: 'Floresta das Raízes',
      isHub: true,
    }));
  });

  it('uses the physical id once and rejects a concurrent preparation', () => {
    const session = create();
    const destination = inspect(session).snapshot.destinations[0];
    const prepared = session.adapter.prepare(destination.physicalExitId);
    if (!prepared.ok) throw prepared.error;

    expect(session.adapter.prepare(destination.physicalExitId)).toMatchObject({
      ok: false,
      error: { code: 'transition-in-progress', recovery: 'unchanged' },
    });
    const confirmed = session.adapter.confirm(prepared.value.preparationId);
    expect(confirmed.ok).toBe(true);
    expect(session.adapter.confirm(prepared.value.preparationId)).toMatchObject({
      ok: false,
      error: { code: 'transition-not-prepared' },
    });
    expect(session.adapter.location()).toEqual(expect.objectContaining({
      routeName: 'Rota das Águas', regionName: 'Igapó', isHub: false,
    }));
  });

  it('persists hub, Igapó, hub and route resumption without losing context', () => {
    const storage = new MemorySaveStorage();
    const first = create(storage);
    const entered = navigate(first, inspect(first).snapshot.destinations[0].physicalExitId);
    const igapoNodeId = entered.confirmed.state.currentNodeId;
    expect(entered.confirmed.state.activeGraphContextId).toBe(UMBRA_ROUTE_SLICE_WATERS_CONTEXT);

    navigate(first, inspect(first).snapshot.destinations[0].physicalExitId);
    expect(first.adapter.state().activeGraphContextId).toBe(UMBRA_ROUTE_SLICE_HUB_CONTEXT);
    expect(first.adapter.state().parkedGraphContexts?.[UMBRA_ROUTE_SLICE_WATERS_CONTEXT]?.currentNodeId)
      .toBe(igapoNodeId);

    const restored = create(storage);
    expect(restored.persistence).toBe('restored');
    expect(restored.adapter.state().activeGraphContextId).toBe(UMBRA_ROUTE_SLICE_HUB_CONTEXT);
    navigate(restored, inspect(restored).snapshot.destinations[0].physicalExitId);
    expect(restored.adapter.state().currentNodeId).toBe(igapoNodeId);
    expect(restored.adapter.state().graph.runId).toBe(RUN_ID);
    expect(restored.adapter.state().graph.runSeed).toBe(RUN_SEED);
    expect(restored.adapter.state().confirmedTransitionIds).toHaveLength(3);
  });

  it('keeps planned destinations out of the Phaser projection', () => {
    const session = create();
    const view = inspect(session);
    expect(view.snapshot.destinations.map(destination => destination.targetStageId))
      .toEqual(['verse_02_galeria']);
    expect(view.bindings).toHaveLength(1);
    expect(view.physicalExits.exits).toHaveLength(1);
    expect(session.adapter.prepare('physical.planned.not-exposed')).toMatchObject({
      ok: false,
      error: { code: 'exit-not-found', recovery: 'unchanged' },
    });
  });

  it('enforces the existing traversal limit instead of enabling unlimited revisits', () => {
    const session = create();
    for (let index = 0; index < 4; index++) {
      const destination = inspect(session).snapshot.destinations[0];
      expect(destination.available).toBe(true);
      navigate(session, destination.physicalExitId);
    }
    const blocked = inspect(session).snapshot.destinations[0];
    expect(blocked.available).toBe(false);
    expect(session.adapter.prepare(blocked.physicalExitId)).toMatchObject({
      ok: false,
      error: { code: 'exit-blocked', recovery: 'unchanged' },
    });
  });

  it('rolls back when confirmation persistence fails', () => {
    const storage = new ToggleStorage();
    const session = create(storage);
    const before = session.adapter.state();
    const bytes = storage.read('umbra-trail-run-v1');
    const prepared = session.adapter.prepare(inspect(session).snapshot.destinations[0].physicalExitId);
    if (!prepared.ok) throw prepared.error;
    storage.failWrites = true;

    expect(session.adapter.confirm(prepared.value.preparationId)).toMatchObject({
      ok: false,
      error: { code: 'persistence-failed', recovery: 'rolled-back' },
    });
    expect(session.adapter.state()).toBe(before);
    expect(storage.read('umbra-trail-run-v1')).toBe(bytes);
  });

  it('persists the reward journal and keeps acknowledgement idempotent after reload', () => {
    const storage = new MemorySaveStorage();
    const session = create(storage);
    const transition = navigate(session, inspect(session).snapshot.destinations[0].physicalExitId);
    const transitionId = transition.prepared.transitionId;

    expect(session.adapter.reward(transitionId)?.status).toBe('pending');
    expect(session.adapter.claimReward(transitionId)).toMatchObject({
      ok: true, value: { reward: { status: 'claimed' } },
    });
    expect(session.adapter.acknowledgeReward(transitionId)).toMatchObject({
      ok: true, value: { reward: { status: 'applied' } },
    });
    expect(session.adapter.acknowledgeReward(transitionId)).toMatchObject({
      ok: true, value: { reward: { status: 'applied' }, persistence: 'skipped' },
    });

    const restored = create(storage);
    expect(restored.adapter.reward(transitionId)?.status).toBe('applied');
    expect(restored.adapter.unsettledRewards()).toHaveLength(0);
    expect(restored.adapter.claimReward(transitionId)).toMatchObject({
      ok: false, error: { code: 'reward-already-applied' },
    });
  });
});
