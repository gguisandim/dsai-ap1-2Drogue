import { UmbraCampaignRouteSliceFactory } from '../application/stages';
import { MemorySaveStorage } from '../narrative';
import { MemoryProgressionStorage, ProgressionService } from '../progression';
import {
  StageLoader,
  StageRegistry,
  registerCampaignChapters,
  registerLegacyStages,
} from '../stages';

const HUB_TO_WATERS = 'connection.hub.floresta-das-raizes.route.aguas';
const IGAPO_TO_HUB = 'connection.region.aguas.igapo.hub.floresta-das-raizes';

function create() {
  const registry = new StageRegistry();
  registerLegacyStages(registry);
  registerCampaignChapters(registry);
  const result = new UmbraCampaignRouteSliceFactory(
    new StageLoader(registry),
    new MemorySaveStorage(),
  ).create({ runId: 'run.revisit-test', runSeed: 'seed.revisit-test' });
  if (!result.ok) throw result.error;
  return result.value;
}

function grantNarrativeAccess(binder: ReturnType<typeof create>['binder']): void {
  const inspected = binder.inspect();
  if (!inspected.ok) throw inspected.error;
  const state = binder.state();
  binder.setAccess({
    eligibleEdgeIds: state.graph.edges
      .filter(edge => edge.sourceNodeId === state.currentNodeId)
      .map(edge => edge.id)
      .sort(),
    unlockedStageExitIds: inspected.value.navigation.snapshot.destinations
      .map(destination => destination.stageExitId)
      .sort(),
  });
}

function navigate(binder: ReturnType<typeof create>['binder'], connectionId: string) {
  grantNarrativeAccess(binder);
  const prepared = binder.prepare(connectionId);
  if (!prepared.ok) throw new Error(JSON.stringify(prepared.error));
  const confirmed = binder.confirm(prepared.value.preparation.preparationId);
  if (!confirmed.ok) throw new Error(JSON.stringify(confirmed.error));
  return confirmed.value;
}

function navigateInternal(binder: ReturnType<typeof create>['binder']) {
  grantNarrativeAccess(binder);
  const inspected = binder.inspect();
  if (!inspected.ok) throw inspected.error;
  const macroEdgeIds = new Set(inspected.value.choices.flatMap(choice =>
    choice.edgeId ? [choice.edgeId] : []));
  const destination = inspected.value.navigation.snapshot.destinations.find(item =>
    item.available && !macroEdgeIds.has(item.edgeId));
  if (!destination) throw new Error('Internal route destination is unavailable.');
  const prepared = binder.prepareInternal(destination.physicalExitId);
  if (!prepared.ok) throw prepared.error;
  const confirmed = binder.confirmInternal(prepared.value.preparationId);
  if (!confirmed.ok) throw confirmed.error;
  return confirmed.value;
}

describe('revisit reward characterization', () => {
  it('grants one distinct reward operation per confirmed transition occurrence', () => {
    const { binder } = create();
    navigate(binder, HUB_TO_WATERS);
    navigateInternal(binder);
    navigate(binder, IGAPO_TO_HUB);
    navigate(binder, HUB_TO_WATERS);

    const rewards = binder.rewards();
    expect(rewards).toHaveLength(4);
    expect(new Set(rewards.map(reward => reward.transitionId)).size).toBe(4);
    expect(rewards.every(reward => reward.status === 'pending')).toBe(true);

    // Distinct transition occurrences map to distinct progression completions.
    const progression = new ProgressionService({ storage: new MemoryProgressionStorage() });
    const before = progression.snapshot().counters.stagesCompleted;
    for (const reward of rewards) {
      const applied = progression.recordStageCompletedIdempotent({
        stageId: reward.stageId,
        difficulty: reward.difficulty,
        parSeconds: reward.parSeconds,
        operationId: reward.transitionId,
      });
      expect(applied.ok).toBe(true);
    }
    expect(progression.snapshot().counters.stagesCompleted).toBe(before + 4);

    // The same transition operation is never applied twice.
    const repeat = progression.recordStageCompletedIdempotent({
      stageId: rewards[0].stageId,
      difficulty: rewards[0].difficulty,
      parSeconds: rewards[0].parSeconds,
      operationId: rewards[0].transitionId,
    });
    expect(repeat.ok && repeat.value.status).toBe('deduplicated');
    expect(progression.snapshot().counters.stagesCompleted).toBe(before + 4);
  });

  it('stops offering the edge once its traversal limit is reached', () => {
    const { binder } = create();
    navigate(binder, HUB_TO_WATERS);
    navigateInternal(binder);
    navigate(binder, IGAPO_TO_HUB);
    // Re-entering the waters context resumes at the Coração Corrompido, so the
    // return edge is available without another internal transition.
    navigate(binder, HUB_TO_WATERS);
    navigate(binder, IGAPO_TO_HUB);
    // Hub -> Igapó was traversed twice already (limit 2), so it is now blocked.
    expect(() => navigate(binder, HUB_TO_WATERS)).toThrow();
  });

  it('claims each reward once and rejects a second claim', () => {
    const { binder } = create();
    navigate(binder, HUB_TO_WATERS);
    const reward = binder.rewards()[0];
    const first = binder.claimReward(reward.transitionId);
    expect(first.ok).toBe(true);
    const second = binder.claimReward(reward.transitionId);
    expect(second.ok).toBe(false);
  });
});
