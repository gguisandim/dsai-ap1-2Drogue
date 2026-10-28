import {
  DialogueEngine,
  NarrativeRegistry,
  NarrativeState,
} from '../narrative';
import type { DialogueTurn, NarrativeContent } from '../narrative';
import { narrativeContent, progression } from './narrativeTestFixture';

function engineFixture(options?: { maximumTransitions?: number }) {
  const registry = new NarrativeRegistry();
  expect(registry.register(narrativeContent()).ok).toBe(true);
  return { registry, engine: new DialogueEngine(registry, options), state: new NarrativeState() };
}

describe('DialogueEngine', () => {
  it('starts at the declared node and filters choices by conditions', () => {
    const { engine, state } = engineFixture();
    const first = engine.start('test.welcome', state, progression);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.value).toMatchObject({
      status: 'active',
      session: { dialogueId: 'test.welcome', nodeId: 'start', transitions: 0 },
      choices: [{ id: 'accept', text: 'Accept' }],
      commands: [{ type: 'flag.set', flag: 'test.seen', value: true }],
    });

    state.setFlag('test.secret', true);
    const withSecret = engine.start('test.welcome', state, progression);
    expect(withSecret.ok && withSecret.value.choices.map(choice => choice.id)).toEqual(['accept', 'secret']);
  });

  it('records a choice, transitions deterministically and completes once', () => {
    const { engine, state } = engineFixture();
    const started = engine.start('test.welcome', state, progression);
    if (!started.ok) throw started.error;
    const chosen = engine.choose(started.value.session, 'accept', state, progression);
    expect(chosen.ok).toBe(true);
    if (!chosen.ok) return;
    expect(chosen.value.session).toEqual({ dialogueId: 'test.welcome', nodeId: 'accepted', transitions: 1 });
    expect(chosen.value.commands).toEqual([{ type: 'mission.start', missionId: 'test.talk' }]);

    const ending = engine.continue(chosen.value.session, state, progression);
    expect(ending.ok && ending.value.status).toBe('active');
    const finalSession = (ending.ok ? ending.value : undefined) as DialogueTurn;
    const completed = engine.continue(finalSession.session, state, progression);
    expect(completed).toEqual({ ok: true, value: {
      status: 'completed', dialogueId: 'test.welcome', newlyCompleted: true, commands: [],
    } });
    const completedAgain = engine.continue(finalSession.session, state, progression);
    expect(completedAgain).toEqual({ ok: true, value: {
      status: 'completed', dialogueId: 'test.welcome', newlyCompleted: false, commands: [],
    } });
    expect(state.snapshot().choices).toEqual({ 'test.welcome': { start: 'accept' } });
    expect(state.snapshot().completedDialogueIds).toEqual(['test.welcome']);
  });

  it('returns typed failures for unavailable choices and invalid sessions', () => {
    const { engine, state } = engineFixture();
    const started = engine.start('test.welcome', state, progression);
    if (!started.ok) throw started.error;
    expect(engine.choose(started.value.session, 'secret', state, progression)).toMatchObject({
      ok: false, error: { code: 'choice-unavailable', referenceId: 'secret' },
    });
    expect(engine.continue(started.value.session, state, progression)).toMatchObject({
      ok: false, error: { code: 'invalid-transition' },
    });
    expect(engine.continue({ ...started.value.session, nodeId: 'missing' }, state, progression)).toMatchObject({
      ok: false, error: { code: 'dialogue-session-invalid' },
    });
  });

  it('caps user-driven cycles without recursion', () => {
    const content = narrativeContent() as unknown as Record<string, any>;
    content.dialogues[0] = {
      id: 'test.welcome', startNodeId: 'loop', nodes: [
        { id: 'loop', speakerId: 'narrator', text: 'Loop?', choices: [
          { id: 'again', text: 'Again', nextNodeId: 'loop' },
          { id: 'leave', text: 'Leave', nextNodeId: 'end' },
        ] },
        { id: 'end', speakerId: 'narrator', text: 'Done.' },
      ],
    };
    const registry = new NarrativeRegistry();
    expect(registry.register(content as NarrativeContent).ok).toBe(true);
    const engine = new DialogueEngine(registry, { maximumTransitions: 2 });
    const state = new NarrativeState();
    const started = engine.start('test.welcome', state, progression);
    if (!started.ok) throw started.error;
    const once = engine.choose(started.value.session, 'again', state, progression);
    if (!once.ok) throw once.error;
    const twice = engine.choose(once.value.session, 'again', state, progression);
    if (!twice.ok) throw twice.error;
    expect(engine.choose(twice.value.session, 'again', state, progression)).toMatchObject({
      ok: false, error: { code: 'transition-limit' },
    });
  });

  it('produces equal turns and snapshots for equal inputs', () => {
    const left = engineFixture();
    const right = engineFixture();
    const leftStart = left.engine.start('test.welcome', left.state, progression);
    const rightStart = right.engine.start('test.welcome', right.state, progression);
    expect(rightStart).toEqual(leftStart);
    if (!leftStart.ok || !rightStart.ok) return;
    expect(right.engine.choose(rightStart.value.session, 'accept', right.state, progression))
      .toEqual(left.engine.choose(leftStart.value.session, 'accept', left.state, progression));
    expect(right.state.snapshot()).toEqual(left.state.snapshot());
  });
});
