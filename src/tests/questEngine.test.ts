import { NarrativeRegistry, NarrativeState, QuestEngine } from '../narrative';
import { narrativeContent } from './narrativeTestFixture';

function questFixture() {
  const registry = new NarrativeRegistry();
  expect(registry.register(narrativeContent()).ok).toBe(true);
  const state = new NarrativeState();
  const engine = new QuestEngine(registry, 'test.stage');
  engine.initialize(state);
  return { registry, state, engine };
}

describe('QuestEngine', () => {
  it('initializes stage-enter missions as available and event missions as locked', () => {
    const { state } = questFixture();
    expect(state.getMissionState('test.hunt')?.status).toBe('available');
    expect(state.getMissionState('test.chain')?.status).toBe('locked');
    expect(state.getMissionState('test.talk')?.objectives).toEqual({ 'complete.welcome': 0 });
  });

  it('starts stage-enter missions and advances only matching filtered objectives', () => {
    const { state, engine } = questFixture();
    const entered = engine.handleSignal({ type: 'stage.entered', stageId: 'test.stage' }, state);
    expect(entered.ok).toBe(true);
    expect(state.getMissionState('test.hunt')?.status).toBe('active');

    engine.handleSignal({ type: 'enemy.defeated', enemyId: 'one', archetype: 'other' }, state);
    expect(state.getMissionState('test.hunt')?.objectives['defeat.shades']).toBe(0);
    engine.handleSignal({ type: 'enemy.defeated', enemyId: 'two', archetype: 'shade' }, state);
    expect(state.getMissionState('test.hunt')?.objectives['defeat.shades']).toBe(1);
  });

  it('completes on required objectives, ignores optional objectives and emits deterministic rewards once', () => {
    const { state, engine } = questFixture();
    engine.handleSignal({ type: 'stage.entered', stageId: 'test.stage' }, state);
    engine.handleSignal({ type: 'enemy.defeated', enemyId: 'one', archetype: 'shade' }, state);
    const completed = engine.handleSignal({ type: 'enemy.defeated', enemyId: 'two', archetype: 'shade' }, state);
    expect(completed.ok).toBe(true);
    if (!completed.ok) return;
    expect(state.getMissionState('test.hunt')).toMatchObject({ status: 'completed', objectives: {
      'defeat.shades': 2, 'find.relic': 0,
    } });
    expect(completed.value.commands.map(command => command.type)).toEqual(['reward.grant', 'reward.grant']);
    expect(completed.value.commands).toEqual(expect.arrayContaining([
      expect.objectContaining({ operationId: 'mission.test.hunt.reward.0' }),
      expect.objectContaining({ operationId: 'mission.test.hunt.reward.1' }),
    ]));
    const repeated = engine.handleSignal({ type: 'enemy.defeated', enemyId: 'three', archetype: 'shade' }, state);
    expect(repeated.ok && repeated.value.commands).toEqual([]);
  });

  it('supports explicit start, advance and fail transitions with typed failures', () => {
    const { state, engine } = questFixture();
    expect(engine.start('test.talk', state)).toMatchObject({ ok: true, value: { status: 'active' } });
    expect(engine.advance('test.talk', 'missing', 1, state)).toMatchObject({ ok: false, error: { code: 'objective-not-found' } });
    expect(engine.advance('test.talk', 'complete.welcome', 0, state)).toMatchObject({ ok: false, error: { code: 'invalid-amount' } });
    expect(engine.fail('test.talk', state)).toMatchObject({ ok: true, value: { status: 'failed' } });
    expect(engine.start('test.talk', state)).toMatchObject({ ok: false, error: { code: 'invalid-transition' } });
  });

  it('does not emit completion twice when an explicit advance is repeated', () => {
    const { state, engine } = questFixture();
    engine.start('test.talk', state);
    const first = engine.advance('test.talk', 'complete.welcome', 1, state);
    const second = engine.advance('test.talk', 'complete.welcome', 1, state);
    expect(first).toMatchObject({ ok: true, value: { completed: true, changed: true } });
    expect(second).toMatchObject({ ok: true, value: { completed: false, changed: false } });
  });
});
