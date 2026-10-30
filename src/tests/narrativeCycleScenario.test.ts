import { NarrativeRewardSettlementService } from '../application/rewards';
import {
  CampaignNarrativeAccessBinder,
  StageSignalAdapter,
  GameStageCompositionRoot,
} from '../application/stages';
import { MemorySaveStorage } from '../narrative';
import { MemoryProgressionStorage, ProgressionService } from '../progression';
import { StageRegistry, registerCampaignChapters } from '../stages';
import {
  NARRATIVE_CYCLE_CAMPAIGN_ID,
  NARRATIVE_CYCLE_CHAPTER,
  NARRATIVE_CYCLE_DESTINATION_ID,
  NARRATIVE_CYCLE_DESTINATION_STAGE,
  NARRATIVE_CYCLE_DIALOGUE_ID,
  NARRATIVE_CYCLE_FLAGS,
  NARRATIVE_CYCLE_MISSION_ID,
  NARRATIVE_CYCLE_REWARD_UNLOCK,
  NARRATIVE_CYCLE_RUN_ID,
  NARRATIVE_CYCLE_SEED,
  NARRATIVE_CYCLE_STAGE_ID,
  NARRATIVE_CYCLE_TRIAL_STAGE,
  createNarrativeCycleScenario,
} from '../devtools/narrative-cycle';

function acceptMission(session: NonNullable<ReturnType<typeof createSession>>): void {
  const started = session.startDialogue(NARRATIVE_CYCLE_DIALOGUE_ID);
  if (!started.ok || started.value.status !== 'active') throw new Error('dialogue did not start');
  const initial = session.applyDialogueTurn(started.value);
  if (!initial.ok) throw initial.error;
  const chosen = session.chooseDialogue(started.value.session, 'accept');
  if (!chosen.ok) throw chosen.error;
  const applied = session.applyDialogueTurn(chosen.value);
  if (!applied.ok) throw applied.error;
}

function createSession() {
  const scenario = createNarrativeCycleScenario();
  const node = scenario.runtime.navigation.currentNode;
  const created = scenario.runtime.composition.createNarrativeSession(
    scenario.runtime.navigation.loadedStage,
    {
      campaignId: NARRATIVE_CYCLE_CAMPAIGN_ID,
      runId: NARRATIVE_CYCLE_RUN_ID,
      runSeed: NARRATIVE_CYCLE_SEED,
      stageInstanceId: node.id,
    },
    { level: 1, unlockedContent: [] },
  );
  if (!created.ok) throw created.error;
  return created.session;
}

describe('isolated narrative-cycle development scenario', () => {
  it('validates its authored modules without registering them in the normal campaign', () => {
    const registry = new StageRegistry();
    registry.registerChapter(NARRATIVE_CYCLE_CHAPTER, [
      NARRATIVE_CYCLE_TRIAL_STAGE,
      NARRATIVE_CYCLE_DESTINATION_STAGE,
    ]);
    expect(registry.validate()).toEqual([]);
    expect(registry.require(NARRATIVE_CYCLE_STAGE_ID).manifest.completionMissionId)
      .toBe(NARRATIVE_CYCLE_MISSION_ID);

    const production = new StageRegistry();
    registerCampaignChapters(production);
    expect(production.get(NARRATIVE_CYCLE_STAGE_ID)).toBeUndefined();
  });

  it('integrates choice, gameplay signals, reward, completion and canonical transition', () => {
    const scenario = createNarrativeCycleScenario();
    const runtime = scenario.runtime;
    const session = createSession();
    const progression = new ProgressionService({ storage: new MemoryProgressionStorage() });
    const access = new CampaignNarrativeAccessBinder();

    const initially = access.synchronize(runtime.router, session);
    expect(initially.ok).toBe(true);
    if (!initially.ok) return;
    const initialDestination = initially.value.snapshot.destinations.find(item =>
      item.stageExitId === 'exit.dev.narrative-cycle.destination');
    expect(initialDestination).toMatchObject({
      available: false,
      blockedReason: 'edge-condition-unmet',
      targetStageId: NARRATIVE_CYCLE_DESTINATION_ID,
    });

    acceptMission(session);
    const afterChoice = session.director.snapshot();
    expect(afterChoice.flags[NARRATIVE_CYCLE_FLAGS.accepted]).toBe(true);
    expect(afterChoice.flags[NARRATIVE_CYCLE_FLAGS.deferred]).toBe(false);
    expect(afterChoice.missionStates[NARRATIVE_CYCLE_MISSION_ID].status).toBe('active');

    const signals = new StageSignalAdapter(session);
    expect(signals.dispatch({
      type: 'enemy.defeated',
      occurrenceId: 'visit-1.enemy-1',
      enemyId: 'enemy-1',
      archetype: 'affinity',
    }).ok).toBe(true);
    expect(signals.dispatch({
      type: 'item.collected',
      occurrenceId: 'visit-1.item-1',
      itemId: 'item-1',
      itemType: 'item_key',
    }).ok).toBe(true);
    expect(signals.dispatch({
      type: 'encounter.completed',
      occurrenceId: 'visit-1.encounter',
      encounterId: `encounter.${NARRATIVE_CYCLE_STAGE_ID}`,
    }).ok).toBe(true);

    const completed = session.director.snapshot();
    expect(completed.missionStates[NARRATIVE_CYCLE_MISSION_ID]).toMatchObject({
      status: 'completed',
      objectives: { combat: 1, collection: 1 },
    });
    expect(completed.flags[NARRATIVE_CYCLE_FLAGS.completed]).toBe(true);
    expect(session.stageCompletions()).toHaveLength(1);
    expect(session.pendingRewardCommands()).toHaveLength(2);

    const settlement = new NarrativeRewardSettlementService(session, progression);
    const first = settlement.settlePending();
    const second = settlement.settlePending();
    expect(first.ok).toBe(true);
    expect(first.settlements).toHaveLength(2);
    expect(second).toEqual({ ok: true, settlements: [] });
    expect(progression.snapshot()).toMatchObject({
      currency: 37,
      unlockedContent: expect.arrayContaining([NARRATIVE_CYCLE_REWARD_UNLOCK]),
    });

    // Replayed gameplay facts and dialogue consequences remain idempotent.
    expect(signals.dispatch({
      type: 'enemy.defeated',
      occurrenceId: 'visit-1.enemy-1',
      enemyId: 'enemy-1',
      archetype: 'affinity',
    }).ok).toBe(true);
    acceptMission(session);
    expect(session.stageCompletions()).toHaveLength(1);
    expect(progression.snapshot().currency).toBe(37);

    const unlocked = access.synchronize(runtime.router, session);
    expect(unlocked.ok).toBe(true);
    if (!unlocked.ok) return;
    const destination = unlocked.value.snapshot.destinations.find(item =>
      item.stageExitId === 'exit.dev.narrative-cycle.destination');
    if (!destination) throw new Error('expected the authored destination exit');
    expect(unlocked.value.snapshot.destinations.filter(item => item.available)).toEqual([destination]);
    expect(destination).toMatchObject({
      available: true,
      stageExitId: 'exit.dev.narrative-cycle.destination',
      targetStageId: NARRATIVE_CYCLE_DESTINATION_ID,
    });
    expect(signals.dispatch({
      type: 'stage.exit.requested',
      occurrenceId: 'visit-1.exit',
      exitId: destination.stageExitId,
    }).ok).toBe(true);
    const prepared = runtime.router.prepare(destination.physicalExitId);
    if (!prepared.ok) throw new Error(JSON.stringify(prepared.error));
    const confirmed = runtime.router.confirm(prepared.value.preparationId);
    expect(confirmed.ok).toBe(true);
    expect(runtime.router.state().currentNodeId).toBe(prepared.value.targetNodeId);
    expect(prepared.value.destinationStage?.manifest.id).toBe(NARRATIVE_CYCLE_DESTINATION_ID);
  });

  it('restores a selected choice and partial objectives from the existing save contract', () => {
    const storage = new MemorySaveStorage();
    const registry = new StageRegistry();
    registry.registerChapter(NARRATIVE_CYCLE_CHAPTER, [
      NARRATIVE_CYCLE_TRIAL_STAGE,
      NARRATIVE_CYCLE_DESTINATION_STAGE,
    ]);
    const composition = new GameStageCompositionRoot({ registry, campaignStorage: storage });
    const loaded = composition.loader.load({
      stageId: NARRATIVE_CYCLE_STAGE_ID,
      runId: NARRATIVE_CYCLE_RUN_ID,
      runSeed: NARRATIVE_CYCLE_SEED,
    });
    if (!loaded.ok) throw loaded.error;
    const identity = {
      campaignId: NARRATIVE_CYCLE_CAMPAIGN_ID,
      runId: NARRATIVE_CYCLE_RUN_ID,
      runSeed: NARRATIVE_CYCLE_SEED,
      stageInstanceId: 'dev.narrative-cycle.reload-node',
    };
    const first = composition.createNarrativeSession(
      loaded.value,
      identity,
      { level: 1, unlockedContent: [] },
      'test.narrative-cycle.reload',
    );
    if (!first.ok) throw first.error;
    acceptMission(first.session);
    const signals = new StageSignalAdapter(first.session);
    signals.dispatch({
      type: 'enemy.defeated',
      occurrenceId: 'reload.enemy-1',
      enemyId: 'enemy-1',
      archetype: 'affinity',
    });

    const restored = composition.createNarrativeSession(
      loaded.value,
      identity,
      { level: 1, unlockedContent: [] },
      'test.narrative-cycle.reload',
    );
    if (!restored.ok) throw restored.error;
    expect(restored.session.director.snapshot()).toMatchObject({
      flags: { [NARRATIVE_CYCLE_FLAGS.accepted]: true },
      missionStates: {
        [NARRATIVE_CYCLE_MISSION_ID]: {
          status: 'active',
          objectives: { combat: 1, collection: 0 },
        },
      },
    });
  });
});
