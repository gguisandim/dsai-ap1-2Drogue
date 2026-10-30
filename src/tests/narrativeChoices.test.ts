import {
  createChoiceFixtureSession,
  FIXTURE_DIALOGUE_ID,
  FIXTURE_FLAGS,
  FIXTURE_MISSION_ID,
  FIXTURE_MISSION_OBJECTIVE,
  FIXTURE_QUIET_DIALOGUE_ID,
} from './fixtures/narrativeChoiceFixture';
import { MemorySaveStorage, type SaveStoragePort } from '../narrative';
import type { DialogueTurn } from '../narrative';

class ToggleStorage implements SaveStoragePort {
  public failWrites = false;
  public readonly memory = new MemorySaveStorage();

  public read(key: string): string | undefined {
    return this.memory.read(key);
  }

  public write(key: string, value: string): void {
    if (this.failWrites) throw new Error('write disabled for rollback test');
    this.memory.write(key, value);
  }
}

function startTurn(session: ReturnType<typeof createChoiceFixtureSession>['session']): DialogueTurn {
  const started = session.startDialogue(FIXTURE_DIALOGUE_ID);
  if (!started.ok) throw started.error;
  if (started.value.status !== 'active') throw new Error('expected active turn');
  return started.value;
}

function chooseTurn(
  session: ReturnType<typeof createChoiceFixtureSession>['session'],
  turn: DialogueTurn,
  choiceId: string,
): DialogueTurn {
  const chosen = session.chooseDialogue(turn.session, choiceId);
  if (!chosen.ok) throw chosen.error;
  return chosen.value;
}

describe('narrative dialogue command execution', () => {
  it('loads the fixture and applies onEnter commands on start', () => {
    const { loaded, session } = createChoiceFixtureSession();
    expect(loaded.dialogues).toHaveLength(2);
    const turn = startTurn(session);
    expect(turn.nodeCommands?.map(command => command.type)).toEqual(['flag.set']);
    const applied = session.applyDialogueTurn(turn);
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;
    expect(applied.consequence.appliedCommandIds).toHaveLength(1);
    expect(applied.consequence.deferredCommands).toEqual([]);
    expect(session.director.snapshot().flags[FIXTURE_FLAGS.entered]).toBe(true);
  });

  it('applies only the selected choice commands, then the target node onEnter', () => {
    const { session } = createChoiceFixtureSession();
    const start = startTurn(session);
    session.applyDialogueTurn(start);
    const left = chooseTurn(session, start, 'left');
    expect(left.choiceCommands?.map(command => command.type)).toEqual(['flag.set']);
    expect(left.nodeCommands?.map(command => command.type)).toEqual([
      'mission.start', 'mission.advance', 'flag.set',
    ]);
    expect(left.commands.map(command => command.type)).toEqual([
      'flag.set', 'mission.start', 'mission.advance', 'flag.set',
    ]);
    const applied = session.applyDialogueTurn(left);
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;
    expect(applied.consequence.commands.map(command => command.type)).toEqual([
      'flag.set', 'mission.start', 'mission.advance', 'flag.set',
    ]);
    const snapshot = session.director.snapshot();
    expect(snapshot.flags[FIXTURE_FLAGS.left]).toBe(true);
    expect(snapshot.flags[FIXTURE_FLAGS.leftNode]).toBe(true);
    expect(snapshot.flags[FIXTURE_FLAGS.right]).toBe(false);
    expect(snapshot.flags[FIXTURE_FLAGS.rightNode]).toBe(false);
    expect(snapshot.missionStates[FIXTURE_MISSION_ID].status).toBe('active');
    expect(snapshot.missionStates[FIXTURE_MISSION_ID].objectives[FIXTURE_MISSION_OBJECTIVE]).toBe(1);
  });

  it('hides a blocked choice and rejects choosing it', () => {
    const { session } = createChoiceFixtureSession();
    const turn = startTurn(session);
    expect(turn.choices.map(choice => choice.id)).toEqual(['left', 'right']);
    const blocked = session.chooseDialogue(turn.session, 'blocked');
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.error.code).toBe('choice-unavailable');
  });

  it('rejects an unknown choice id', () => {
    const { session } = createChoiceFixtureSession();
    const turn = startTurn(session);
    const missing = session.chooseDialogue(turn.session, 'does-not-exist');
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.error.code).toBe('choice-not-found');
  });

  it('never applies the unselected alternative', () => {
    const { session } = createChoiceFixtureSession();
    const start = startTurn(session);
    session.applyDialogueTurn(start);
    const right = chooseTurn(session, start, 'right');
    session.applyDialogueTurn(right);
    const snapshot = session.director.snapshot();
    expect(snapshot.flags[FIXTURE_FLAGS.right]).toBe(true);
    expect(snapshot.flags[FIXTURE_FLAGS.rightNode]).toBe(true);
    expect(snapshot.flags[FIXTURE_FLAGS.left]).toBe(false);
    expect(snapshot.flags[FIXTURE_FLAGS.leftNode]).toBe(false);
    expect(snapshot.missionStates[FIXTURE_MISSION_ID].status).toBe('locked');
  });

  it('is deterministic for the same fixture and choices', () => {
    const run = (): unknown => {
      const { session } = createChoiceFixtureSession();
      const start = startTurn(session);
      session.applyDialogueTurn(start);
      session.applyDialogueTurn(chooseTurn(session, start, 'left'));
      return session.director.snapshot();
    };
    expect(run()).toEqual(run());
  });

  it('is idempotent when the same turn is applied again', () => {
    const { session } = createChoiceFixtureSession();
    const start = startTurn(session);
    session.applyDialogueTurn(start);
    const left = chooseTurn(session, start, 'left');
    const first = session.applyDialogueTurn(left);
    expect(first.ok).toBe(true);
    const before = session.director.snapshot();
    const second = session.applyDialogueTurn(left);
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.consequence.status).toBe('duplicate');
    expect(second.consequence.appliedCommandIds).toEqual([]);
    expect(second.consequence.skippedCommandIds).toHaveLength(4);
    const after = session.director.snapshot();
    expect(after).toEqual(before);
    // Non-idempotent command (mission.advance) did not advance a second time.
    expect(after.missionStates[FIXTURE_MISSION_ID].objectives[FIXTURE_MISSION_OBJECTIVE]).toBe(1);
  });

  it('restores flags and consequences after a reload', () => {
    const storage = new MemorySaveStorage();
    const first = createChoiceFixtureSession(storage);
    const start = startTurn(first.session);
    first.session.applyDialogueTurn(start);
    first.session.applyDialogueTurn(chooseTurn(first.session, start, 'left'));
    const before = first.session.director.snapshot();

    const reloaded = createChoiceFixtureSession(storage);
    const restored = reloaded.session.director.snapshot();
    expect(restored).toEqual(before);
    expect(restored.flags[FIXTURE_FLAGS.left]).toBe(true);
    expect(restored.flags[FIXTURE_FLAGS.leftNode]).toBe(true);

    // Replaying the same path after reload does not duplicate effects.
    const startAgain = startTurn(reloaded.session);
    const replayStart = reloaded.session.applyDialogueTurn(startAgain);
    expect(replayStart.ok).toBe(true);
    if (!replayStart.ok) return;
    expect(replayStart.consequence.appliedCommandIds).toEqual([]);
    const leftAgain = chooseTurn(reloaded.session, startAgain, 'left');
    const replayLeft = reloaded.session.applyDialogueTurn(leftAgain);
    expect(replayLeft.ok).toBe(true);
    if (!replayLeft.ok) return;
    expect(replayLeft.consequence.appliedCommandIds).toEqual([]);
    expect(reloaded.session.director.snapshot()).toEqual(before);
  });

  it('rolls back and reports failure when persistence fails', () => {
    const storage = new ToggleStorage();
    const { session } = createChoiceFixtureSession(storage);
    const turn = startTurn(session);
    const before = session.director.snapshot();
    storage.failWrites = true;
    const applied = session.applyDialogueTurn(turn);
    expect(applied.ok).toBe(false);
    expect(session.director.snapshot()).toEqual(before);
    expect(session.director.snapshot().flags[FIXTURE_FLAGS.entered]).toBe(false);
    expect(storage.read('umbra-trail-campaign-v1:run.test.narrative-choices:chapter.test.narrative:stage.test.narrative-choices'))
      .toBeUndefined();
  });

  it('rolls back the selected choice together with its commands when persistence fails', () => {
    const storage = new ToggleStorage();
    const { session } = createChoiceFixtureSession(storage);
    const start = startTurn(session);
    expect(session.applyDialogueTurn(start).ok).toBe(true);
    const beforeChoice = session.director.snapshot();
    const left = chooseTurn(session, start, 'left');

    // Resolving a choice must not mutate the integrated session before commit.
    expect(session.director.snapshot()).toEqual(beforeChoice);
    storage.failWrites = true;
    const failed = session.applyDialogueTurn(left);
    expect(failed.ok).toBe(false);
    expect(session.director.snapshot()).toEqual(beforeChoice);
    expect(session.director.snapshot().choices).toEqual({});
    expect(session.director.snapshot().flags[FIXTURE_FLAGS.left]).toBe(false);

    storage.failWrites = false;
    const retried = session.applyDialogueTurn(chooseTurn(session, start, 'left'));
    expect(retried.ok).toBe(true);
    expect(session.director.snapshot().choices).toEqual({
      [FIXTURE_DIALOGUE_ID]: { start: 'left' },
    });
  });

  it('applies completion consequences once via dialogue.completed', () => {
    const { session } = createChoiceFixtureSession();
    const start = startTurn(session);
    session.applyDialogueTurn(start);
    const left = chooseTurn(session, start, 'left');
    session.applyDialogueTurn(left);
    const completed = session.advanceDialogue(left.session);
    expect(completed.ok).toBe(true);
    if (!completed.ok || completed.value.status !== 'completed') return;
    const done = session.completeDialogue(completed.value.dialogueId);
    expect(done.ok).toBe(true);
    expect(session.director.snapshot().flags[FIXTURE_FLAGS.completed]).toBe(true);
    const again = session.completeDialogue(completed.value.dialogueId);
    expect(again.ok).toBe(true);
    expect(session.director.snapshot().flags[FIXTURE_FLAGS.completed]).toBe(true);
  });

  it('handles a dialogue with no commands without side effects', () => {
    const { session } = createChoiceFixtureSession();
    const before = session.director.snapshot();
    const started = session.startDialogue(FIXTURE_QUIET_DIALOGUE_ID);
    expect(started.ok).toBe(true);
    if (!started.ok) return;
    expect(started.value.commands).toEqual([]);
    const applied = session.applyDialogueTurn(started.value);
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;
    expect(applied.consequence.status).toBe('duplicate');
    expect(session.director.snapshot()).toEqual(before);
  });

  it('rejects a command type outside the contracts', () => {
    const { session } = createChoiceFixtureSession();
    const turn = startTurn(session);
    const before = session.director.snapshot();
    const fake: DialogueTurn = {
      ...turn,
      choiceCommands: [],
      nodeCommands: [{ type: 'bogus.command' } as unknown as DialogueTurn['commands'][number]],
      commands: [],
    };
    const applied = session.applyDialogueTurn(fake);
    expect(applied.ok).toBe(false);
    if (!applied.ok) expect(applied.error.code).toBe('invalid-command');
    expect(session.director.snapshot()).toEqual(before);
  });

  it('defers known commands owned by later stages', () => {
    const { session } = createChoiceFixtureSession();
    const turn = startTurn(session);
    const before = session.director.snapshot();
    const deferred: DialogueTurn = {
      ...turn,
      choiceCommands: [],
      nodeCommands: [{
        type: 'dialogue.start',
        dialogueId: FIXTURE_QUIET_DIALOGUE_ID,
      } as DialogueTurn['commands'][number]],
      commands: [],
    };
    const applied = session.applyDialogueTurn(deferred);
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;
    expect(applied.consequence.deferredCommands).toHaveLength(1);
    expect(applied.consequence.appliedCommandIds).toEqual([]);
    expect(session.director.snapshot()).toEqual(before);
  });
});
