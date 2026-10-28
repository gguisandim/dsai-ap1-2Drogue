import {
  NarrativeState,
  StageDirector,
} from '../narrative';
import type { NarrativeContent, NarrativeDomainEvent, StageCommand } from '../narrative';
import { narrativeContent, progression } from './narrativeTestFixture';

function createDirector(content: NarrativeContent = narrativeContent(), options?: { maximumEvents?: number }) {
  const created = StageDirector.create(content, undefined, progression, options);
  if (!created.ok) throw created.error;
  return created.value;
}

function process(director: StageDirector, event: NarrativeDomainEvent): readonly StageCommand[] {
  const result = director.process(event);
  if (!result.ok) throw result.error;
  return result.value.commands;
}

describe('headless narrative integration', () => {
  it('processes typed signals, recursive mission completions and rewards deterministically', () => {
    const director = createDirector();
    expect(director.chapterId).toBe('test.chapter');
    expect(director.dialogues).toBeDefined();
    expect(process(director, { id: 'event.enter', signal: { type: 'stage.entered', stageId: 'test.stage' } }))
      .toEqual([{ type: 'mission.start', missionId: 'test.chain' }]);
    expect(process(director, { id: 'event.enemy.1', signal: { type: 'enemy.defeated', enemyId: 'one', archetype: 'shade' } }))
      .toEqual([]);
    const commands = process(director, {
      id: 'event.enemy.2', signal: { type: 'enemy.defeated', enemyId: 'two', archetype: 'shade' },
    });

    expect(commands.map(command => command.type)).toEqual([
      'reward.grant', 'reward.grant', 'reward.grant', 'exit.unlock',
    ]);
    expect(director.snapshot()).toMatchObject({
      flags: { 'test.hunt-rewarded': true, 'test.ready': false },
      missionStates: {
        'test.hunt': { status: 'completed' },
        'test.chain': { status: 'completed' },
      },
      unlockedExitIds: ['test.exit'],
      appliedOperationIds: [
        'mission.test.chain.reward.0',
        'mission.test.hunt.reward.0',
        'mission.test.hunt.reward.1',
      ],
    });
  });

  it('treats repeated event ids as no-ops', () => {
    const director = createDirector();
    const event = { id: 'event.enter', signal: { type: 'stage.entered', stageId: 'test.stage' } } as const;
    const first = director.process(event);
    const snapshot = director.snapshot();
    const second = director.process(event);
    expect(first).toMatchObject({ ok: true, value: { status: 'processed' } });
    expect(second).toEqual({ ok: true, value: {
      status: 'duplicate', eventId: 'event.enter', commands: [], generatedSignals: [], snapshot,
    } });
    expect(director.snapshot()).toEqual(snapshot);
  });

  it('deduplicates reward operation ids across distinct events and fires once rules once', () => {
    const director = createDirector();
    const firstReward = process(director, {
      id: 'event.relic.1', signal: { type: 'item.collected', itemId: 'relic.one', itemType: 'relic' },
    });
    const secondReward = process(director, {
      id: 'event.relic.2', signal: { type: 'item.collected', itemId: 'relic.two', itemType: 'relic' },
    });
    expect(firstReward).toHaveLength(1);
    expect(secondReward).toEqual([]);

    expect(process(director, {
      id: 'event.npc.1', signal: { type: 'npc.interacted', npcId: 'test.guide' },
    })).toEqual([{ type: 'dialogue.start', dialogueId: 'test.welcome' }]);
    expect(process(director, {
      id: 'event.npc.2', signal: { type: 'npc.interacted', npcId: 'test.guide' },
    })).toEqual([]);
  });

  it('rolls back the whole event when the derived-event limit is exceeded', () => {
    const director = createDirector(narrativeContent(), { maximumEvents: 1 });
    process(director, { id: 'event.enter', signal: { type: 'stage.entered', stageId: 'test.stage' } });
    process(director, { id: 'event.enemy.1', signal: { type: 'enemy.defeated', enemyId: 'one', archetype: 'shade' } });
    const before = director.snapshot();
    const result = director.process({
      id: 'event.enemy.2', signal: { type: 'enemy.defeated', enemyId: 'two', archetype: 'shade' },
    });
    expect(result).toMatchObject({ ok: false, error: { code: 'processing-limit' } });
    expect(director.snapshot()).toEqual(before);
  });

  it('evaluates progression conditions through an immutable projection', () => {
    const content = narrativeContent() as unknown as Record<string, any>;
    content.events.push({
      id: 'test.progression-gate',
      once: true,
      when: 'stage.entered',
      condition: { type: 'progression.unlocked', contentId: 'test.unlocked' },
      commands: [{ type: 'flag.set', flag: 'test.progression-seen', value: true }],
    });
    const director = createDirector(content as NarrativeContent);
    process(director, { id: 'event.enter', signal: { type: 'stage.entered', stageId: 'test.stage' } });
    expect(director.snapshot().flags['test.progression-seen']).toBe(true);
  });

  it('produces identical commands and snapshots for identical event sequences', () => {
    const left = createDirector();
    const right = createDirector();
    const events: NarrativeDomainEvent[] = [
      { id: 'event.enter', signal: { type: 'stage.entered', stageId: 'test.stage' } },
      { id: 'event.enemy.1', signal: { type: 'enemy.defeated', enemyId: 'one', archetype: 'shade' } },
      { id: 'event.enemy.2', signal: { type: 'enemy.defeated', enemyId: 'two', archetype: 'shade' } },
    ];
    const leftCommands = events.map(event => process(left, event));
    const rightCommands = events.map(event => process(right, event));
    expect(rightCommands).toEqual(leftCommands);
    expect(right.snapshot()).toEqual(left.snapshot());
  });

  it('keeps the state snapshot JSON-serializable without implementing storage', () => {
    const director = createDirector();
    process(director, { id: 'event.enter', signal: { type: 'stage.entered', stageId: 'test.stage' } });
    const json = JSON.stringify(director.snapshot());
    const restored = NarrativeState.fromSnapshot(JSON.parse(json));
    expect(restored.snapshot()).toEqual(director.snapshot());
    expect(Object.isFrozen(restored.snapshot())).toBe(true);
  });

  it('rejects empty occurrence ids without mutating state', () => {
    const director = createDirector();
    const before = director.snapshot();
    expect(director.process({ id: '', signal: { type: 'stage.entered', stageId: 'test.stage' } }))
      .toMatchObject({ ok: false, error: { code: 'invalid-event' } });
    expect(director.snapshot()).toEqual(before);
  });
});
