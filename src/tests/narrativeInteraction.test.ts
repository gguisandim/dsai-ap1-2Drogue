import {
  ECO_DAS_AGUAS_DIALOGUE_ID,
  ECO_DAS_AGUAS_EVENT_ID,
  ECO_DAS_AGUAS_FLAG,
  ECO_DAS_AGUAS_NPC_ID,
  IGAPO_DAS_MEMORIAS_STAGE_ID,
} from '../stages';
import {
  GameStageCompositionRoot,
  campaignStageNarrativeSaveKey,
} from '../application/stages';
import { MemorySaveStorage } from '../narrative';

const RUN_ID = 'run.narrative-test';
const SEED = 'seed.narrative-test';
const STAGE_INSTANCE = 'node.test.main';

function setup(storage = new MemorySaveStorage()) {
  const composition = new GameStageCompositionRoot({ campaignStorage: storage });
  const loaded = composition.loader.load({
    stageId: IGAPO_DAS_MEMORIAS_STAGE_ID,
    runId: RUN_ID,
    runSeed: SEED,
  });
  if (!loaded.ok) throw loaded.error;
  const identity = {
    campaignId: 'campaign.test',
    runId: RUN_ID,
    runSeed: SEED,
    stageInstanceId: STAGE_INSTANCE,
  };
  const key = campaignStageNarrativeSaveKey(
    RUN_ID,
    loaded.value.manifest.chapterId,
    loaded.value.manifest.id,
  );
  const created = composition.createNarrativeSession(
    loaded.value,
    identity,
    { level: 1, unlockedContent: [] },
    key,
  );
  if (!created.ok) throw created.error;
  return { composition, loaded: loaded.value, identity, key, session: created.session };
}

describe('narrative interaction session', () => {
  it('fires the Eco once on stage entry and never duplicates operations', () => {
    const { session } = setup();
    expect(session.enterStage().ok).toBe(true);
    const first = session.director.snapshot();
    expect(first.flags[ECO_DAS_AGUAS_FLAG]).toBe(true);
    expect(first.firedRuleIds.some(id => id.includes(ECO_DAS_AGUAS_EVENT_ID))).toBe(true);

    expect(session.enterStage().ok).toBe(true);
    const second = session.director.snapshot();
    expect(second.firedRuleIds).toEqual(first.firedRuleIds);
    expect(second.appliedOperationIds).toEqual(first.appliedOperationIds);
  });

  it('opens, advances and completes the POI dialogue', () => {
    const { session } = setup();
    const started = session.startDialogue(ECO_DAS_AGUAS_DIALOGUE_ID);
    expect(started.ok).toBe(true);
    if (!started.ok) return;
    expect(started.value.status).toBe('active');
    const advanced = session.advanceDialogue(started.value.session);
    expect(advanced.ok).toBe(true);
    if (!advanced.ok) return;
    expect(advanced.value.status).toBe('active');
    if (advanced.value.status !== 'active') return;
    const completed = session.advanceDialogue(advanced.value.session);
    expect(completed.ok).toBe(true);
    if (!completed.ok) return;
    expect(completed.value.status).toBe('completed');
  });

  it('keeps repeated NPC interaction idempotent', () => {
    const { session } = setup();
    expect(session.interactNpc(ECO_DAS_AGUAS_NPC_ID).ok).toBe(true);
    const first = session.director.snapshot();
    expect(first.processedEventIds.some(id => id.includes(ECO_DAS_AGUAS_NPC_ID))).toBe(true);
    expect(session.interactNpc(ECO_DAS_AGUAS_NPC_ID).ok).toBe(true);
    const second = session.director.snapshot();
    expect(second.processedEventIds).toEqual(first.processedEventIds);
    expect(second.appliedOperationIds).toEqual(first.appliedOperationIds);
  });

  it('restores narrative state after a reload with the same stage identity', () => {
    const storage = new MemorySaveStorage();
    const first = setup(storage);
    expect(first.session.enterStage().ok).toBe(true);
    expect(first.session.interactNpc(ECO_DAS_AGUAS_NPC_ID).ok).toBe(true);
    const beforeReload = first.session.director.snapshot();

    const reloaded = setup(storage);
    const restored = reloaded.session.director.snapshot();
    expect(restored.flags[ECO_DAS_AGUAS_FLAG]).toBe(true);
    expect(restored.processedEventIds).toEqual(beforeReload.processedEventIds);

    // Re-entering after reload must not refire the once rule.
    expect(reloaded.session.enterStage().ok).toBe(true);
    expect(reloaded.session.director.snapshot().firedRuleIds).toEqual(beforeReload.firedRuleIds);
  });

  it('reopening the dialogue does not duplicate reward operations', () => {
    const { session } = setup();
    session.startDialogue(ECO_DAS_AGUAS_DIALOGUE_ID);
    const before = session.director.snapshot().appliedOperationIds;
    session.startDialogue(ECO_DAS_AGUAS_DIALOGUE_ID);
    expect(session.director.snapshot().appliedOperationIds).toEqual(before);
  });
});
