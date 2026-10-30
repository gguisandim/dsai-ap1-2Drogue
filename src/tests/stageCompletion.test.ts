import { GameNarrativeSession } from '../application/stages';
import {
  CampaignSaveService,
  MemorySaveStorage,
  NarrativeState,
  StageDirector,
} from '../narrative';
import type { CampaignSaveIdentity, NarrativeContent, SaveStoragePort } from '../narrative';
import { narrativeContent, progression, saveIdentity } from './narrativeTestFixture';

const SAVE_KEY = 'test.stage-completion';

function contentWithCompletion(): NarrativeContent {
  const content = narrativeContent();
  return {
    ...content,
    events: content.events?.map(rule => rule.id === 'test.hunt-complete'
      ? { ...rule, commands: [...rule.commands, { type: 'stage.complete', exitId: 'test.exit' }] }
      : rule),
  };
}

function createSession(
  storage: SaveStoragePort,
  identity: CampaignSaveIdentity = saveIdentity({ stageInstanceId: 'test.node' }),
): GameNarrativeSession {
  const state = new NarrativeState();
  const saves = new CampaignSaveService(storage, SAVE_KEY);
  const restored = saves.loadAndRestore(identity, state);
  if (!restored.ok) throw restored.error;
  const director = StageDirector.create(contentWithCompletion(), state.snapshot(), progression, { identity });
  if (!director.ok) throw director.error;
  return new GameNarrativeSession(identity, director.value, saves);
}

function finish(session: GameNarrativeSession): void {
  const entered = session.enterStage();
  if (!entered.ok) throw entered.error;
  for (const id of ['completion.enemy.1', 'completion.enemy.2']) {
    const result = session.processGameplayEvent({
      id,
      signal: { type: 'enemy.defeated', enemyId: id, archetype: 'shade' },
    });
    if (!result.ok) throw result.error;
  }
}

describe('stage.complete narrative semantics', () => {
  it('records a valid scoped occurrence and unlocks its declared exit', () => {
    const session = createSession(new MemorySaveStorage());
    finish(session);
    const completions = session.stageCompletions();

    expect(completions).toHaveLength(1);
    expect(completions[0]).toMatchObject({ exitId: 'test.exit' });
    expect(completions[0].occurrenceId).toContain(
      'run.test.run-1.chapter.test.chapter.stage.test.stage.revision.3.instance.test.node.event.',
    );
    expect(session.director.snapshot().unlockedExitIds).toContain('test.exit');
  });

  it('does not complete the same causal occurrence repeatedly', () => {
    const session = createSession(new MemorySaveStorage());
    finish(session);
    session.processGameplayEvent({
      id: 'completion.enemy.2',
      signal: { type: 'enemy.defeated', enemyId: 'completion.enemy.2', archetype: 'shade' },
    });
    expect(session.stageCompletions()).toHaveLength(1);
  });

  it('restores completion after reload without re-running the command', () => {
    const storage = new MemorySaveStorage();
    const first = createSession(storage);
    finish(first);
    const before = first.stageCompletions();

    const restored = createSession(storage);
    expect(restored.stageCompletions()).toEqual(before);
    expect(restored.enterStage().ok).toBe(true);
    expect(restored.stageCompletions()).toEqual(before);
  });

  it('keeps completion distinct from exit requests and creates no implicit reward', () => {
    const session = createSession(new MemorySaveStorage());
    finish(session);
    const before = session.stageCompletions();

    expect(session.requestExit('test.exit').ok).toBe(true);
    expect(session.requestExit('test.exit').ok).toBe(true);
    expect(session.stageCompletions()).toEqual(before);
    expect(session.pendingRewardCommands()).toHaveLength(2);
  });

  it('accepts a legacy save v1 that predates completedStageOccurrences', () => {
    const storage = new MemorySaveStorage();
    const identity = saveIdentity({ stageInstanceId: 'test.node' });
    const state = new NarrativeState();
    const service = new CampaignSaveService(storage, SAVE_KEY);
    const envelope = service.createEnvelope(identity, state);
    if (!envelope.ok) throw envelope.error;
    const legacy = JSON.parse(JSON.stringify(envelope.value)) as Record<string, any>;
    delete legacy.narrative.completedStageOccurrences;
    storage.write(SAVE_KEY, JSON.stringify(legacy));

    const restored = createSession(storage, identity);
    expect(restored.stageCompletions()).toEqual([]);
  });
});
