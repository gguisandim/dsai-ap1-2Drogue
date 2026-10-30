import type { SaveStoragePort } from '../narrative';
import {
  GAMEPLAY_COLLECT_OBJECTIVE,
  GAMEPLAY_DEFEAT_OBJECTIVE,
  GAMEPLAY_DIALOGUE_ID,
  GAMEPLAY_FLAGS,
  GAMEPLAY_MISSION_ID,
  createGameplayNarrativeFixture,
} from './fixtures/gameplayNarrativeFixture';

class ToggleStorage implements SaveStoragePort {
  private value?: string;
  public failWrites = false;

  public read(): string | undefined {
    return this.value;
  }

  public write(_key: string, value: string): void {
    if (this.failWrites) throw new Error('write denied');
    this.value = value;
  }
}

function startFixture(storage?: SaveStoragePort) {
  const fixture = createGameplayNarrativeFixture(storage);
  expect(fixture.session.enterStage().ok).toBe(true);
  return fixture;
}

function shade(occurrenceId: string) {
  return {
    type: 'enemy.defeated' as const,
    occurrenceId,
    enemyId: occurrenceId,
    archetype: 'shade',
  };
}

describe('StageSignalAdapter gameplay integration', () => {
  it('advances a mission from a confirmed common-enemy defeat exactly once', () => {
    const { session, adapter } = startFixture();
    const occurrence = shade('node.test.visit.1.wave.0.enemy.0');
    expect(adapter.dispatch(occurrence).ok).toBe(true);
    expect(adapter.dispatch(occurrence).ok).toBe(true);
    expect(session.director.snapshot().missionStates[GAMEPLAY_MISSION_ID]
      .objectives[GAMEPLAY_DEFEAT_OBJECTIVE]).toBe(1);
  });

  it('processes a confirmed boss through the same adapter without changing combat', () => {
    const { session, adapter } = startFixture();
    expect(adapter.dispatch({
      type: 'enemy.defeated',
      occurrenceId: 'node.test.visit.1.wave.2.enemy.0',
      enemyId: 'node.test.visit.1.wave.2.enemy.0',
      archetype: 'boss',
    }).ok).toBe(true);
    expect(session.director.snapshot().flags[GAMEPLAY_FLAGS.boss]).toBe(true);
    expect(session.director.snapshot().missionStates[GAMEPLAY_MISSION_ID]
      .objectives[GAMEPLAY_DEFEAT_OBJECTIVE]).toBe(0);
  });

  it('completes a declarative defeat-and-collection mission from gameplay facts', () => {
    const { session, adapter } = startFixture();
    adapter.dispatch(shade('node.test.visit.1.wave.0.enemy.0'));
    adapter.dispatch(shade('node.test.visit.1.wave.0.enemy.1'));
    expect(adapter.dispatch({
      type: 'item.collected',
      occurrenceId: 'node.test.visit.1.item.authored.0',
      itemId: 'node.test.visit.1.item.authored.0',
      itemType: 'relic',
    }).ok).toBe(true);
    expect(session.director.snapshot().missionStates[GAMEPLAY_MISSION_ID]).toEqual({
      status: 'completed',
      objectives: {
        [GAMEPLAY_COLLECT_OBJECTIVE]: 1,
        [GAMEPLAY_DEFEAT_OBJECTIVE]: 2,
      },
    });
  });

  it('processes wave and full-encounter completion as distinct occurrences', () => {
    const { session, adapter } = startFixture();
    adapter.dispatch({
      type: 'encounter.completed',
      occurrenceId: 'node.test.visit.1.wave.0.completed',
      encounterId: 'wave.1',
    });
    adapter.dispatch({
      type: 'encounter.completed',
      occurrenceId: 'node.test.visit.1.encounter.completed',
      encounterId: 'encounter.stage.test',
    });
    const snapshot = session.director.snapshot();
    expect(snapshot.flags[GAMEPLAY_FLAGS.wave]).toBe(true);
    expect(snapshot.flags[GAMEPLAY_FLAGS.encounter]).toBe(true);
  });

  it('processes a canonical stage exit request once', () => {
    const { session, adapter } = startFixture();
    const request = {
      type: 'stage.exit.requested' as const,
      occurrenceId: 'node.test.visit.1.exit.exit.test.return',
      exitId: 'exit.test.return',
    };
    expect(adapter.dispatch(request).ok).toBe(true);
    expect(adapter.dispatch(request).ok).toBe(true);
    expect(session.director.snapshot().flags[GAMEPLAY_FLAGS.exit]).toBe(true);
  });

  it('keeps processed state in memory on save failure and retries persistence idempotently', () => {
    const storage = new ToggleStorage();
    const { session, adapter } = startFixture(storage);
    storage.failWrites = true;
    const occurrence = shade('node.test.visit.1.wave.0.enemy.0');
    expect(adapter.dispatch(occurrence)).toMatchObject({
      ok: false,
      error: { code: 'storage-write-failed' },
    });
    expect(session.director.snapshot().missionStates[GAMEPLAY_MISSION_ID]
      .objectives[GAMEPLAY_DEFEAT_OBJECTIVE]).toBe(1);

    storage.failWrites = false;
    expect(adapter.dispatch(occurrence).ok).toBe(true);
    const reloaded = createGameplayNarrativeFixture(storage);
    expect(reloaded.session.director.snapshot().missionStates[GAMEPLAY_MISSION_ID]
      .objectives[GAMEPLAY_DEFEAT_OBJECTIVE]).toBe(1);
  });

  it('treats the same spawn in a new visit as a new logical occurrence', () => {
    const { session, adapter } = startFixture();
    adapter.dispatch(shade('node.test.visit.1.wave.0.enemy.0'));
    adapter.dispatch(shade('node.test.visit.2.wave.0.enemy.0'));
    expect(session.director.snapshot().missionStates[GAMEPLAY_MISSION_ID]
      .objectives[GAMEPLAY_DEFEAT_OBJECTIVE]).toBe(2);
  });

  it('accepts enemies and items without matching rules without changing objectives', () => {
    const { session, adapter } = startFixture();
    adapter.dispatch({
      type: 'enemy.defeated',
      occurrenceId: 'node.test.visit.1.wave.0.enemy.9',
      enemyId: 'node.test.visit.1.wave.0.enemy.9',
      archetype: 'unrelated',
    });
    adapter.dispatch({
      type: 'item.collected',
      occurrenceId: 'node.test.visit.1.item.authored.9',
      itemId: 'node.test.visit.1.item.authored.9',
      itemType: 'unrelated',
    });
    expect(session.director.snapshot().missionStates[GAMEPLAY_MISSION_ID].objectives).toEqual({
      [GAMEPLAY_COLLECT_OBJECTIVE]: 0,
      [GAMEPLAY_DEFEAT_OBJECTIVE]: 0,
    });
  });

  it('rejects unstable occurrence ids before reaching the narrative runtime', () => {
    const { session, adapter } = startFixture();
    const before = session.director.snapshot();
    expect(adapter.dispatch(shade('Enemy with spaces'))).toMatchObject({
      ok: false,
      error: { code: 'invalid-event' },
    });
    expect(session.director.snapshot()).toEqual(before);
  });

  it('remains compatible with the choice transaction introduced in 9.4A', () => {
    const { session, adapter } = startFixture();
    adapter.dispatch(shade('node.test.visit.1.wave.0.enemy.0'));
    const started = session.startDialogue(GAMEPLAY_DIALOGUE_ID);
    if (!started.ok) throw started.error;
    expect(session.applyDialogueTurn(started.value).ok).toBe(true);
    const chosen = session.chooseDialogue(started.value.session, 'follow');
    if (!chosen.ok) throw chosen.error;
    expect(session.applyDialogueTurn(chosen.value).ok).toBe(true);
    expect(session.director.snapshot().flags[GAMEPLAY_FLAGS.dialogue]).toBe(true);
    expect(session.director.snapshot().missionStates[GAMEPLAY_MISSION_ID]
      .objectives[GAMEPLAY_DEFEAT_OBJECTIVE]).toBe(1);
  });
});
