import {
  CampaignSaveService,
  MemorySaveStorage,
  NarrativeState,
  StageDirector,
} from '../narrative';
import type { CampaignSaveIdentity, NarrativeContent } from '../narrative';
import { narrativeContent, progression, saveIdentity } from './narrativeTestFixture';

function directorWith(identity: CampaignSaveIdentity, content: NarrativeContent = narrativeContent()) {
  const created = StageDirector.create(content, undefined, progression, { identity });
  if (!created.ok) throw created.error;
  return created.value;
}

function completeMissions(director: StageDirector): void {
  director.process({ id: 'event.enter', signal: { type: 'stage.entered', stageId: director.stageId } });
  director.process({ id: 'event.enemy-1', signal: { type: 'enemy.defeated', enemyId: 'one', archetype: 'shade' } });
  director.process({ id: 'event.enemy-2', signal: { type: 'enemy.defeated', enemyId: 'two', archetype: 'shade' } });
}

describe('pending narrative reward operations', () => {
  it('scopes events, once rules and operations by run, chapter, stage and revision', () => {
    const identity = saveIdentity();
    const director = directorWith(identity);
    completeMissions(director);
    const snapshot = director.snapshot();
    const prefix = `run.${identity.runId}.chapter.${identity.chapterId}.stage.${identity.stageId}.revision.${identity.manifestRevision}`;

    expect(snapshot.processedEventIds.every(id => id.startsWith(`${prefix}.event.`))).toBe(true);
    expect(snapshot.firedRuleIds.every(id => id.startsWith(`${prefix}.rule.`))).toBe(true);
    expect(snapshot.appliedOperationIds.every(id => id.startsWith(`${prefix}.operation.`))).toBe(true);
    expect(snapshot.pendingOperations.map(item => item.reward.type)).toEqual([
      'progression.unlock',
      'progression.currency',
    ]);
  });

  it('keeps pending rewards across save/restore and removes them only after acknowledgement', () => {
    const identity = saveIdentity();
    const director = directorWith(identity);
    completeMissions(director);
    const storage = new MemorySaveStorage();
    const saves = new CampaignSaveService(storage);
    expect(saves.save(identity, director.state).ok).toBe(true);

    const restored = new NarrativeState();
    expect(saves.loadAndRestore(identity, restored).ok).toBe(true);
    const resumed = StageDirector.create(narrativeContent(), restored.snapshot(), progression, { identity });
    if (!resumed.ok) throw resumed.error;
    const pending = resumed.value.pendingRewardCommands();
    expect(pending).toHaveLength(2);

    const operationId = pending[0].type === 'reward.grant' ? pending[0].operationId : '';
    expect(resumed.value.acknowledgeOperation(operationId)).toEqual({ ok: true, value: undefined });
    expect(resumed.value.acknowledgeOperation(operationId)).toMatchObject({
      ok: false, error: { code: 'operation-not-pending' },
    });
    expect(resumed.value.pendingRewardCommands()).toHaveLength(1);
    expect(saves.save(identity, resumed.value.state).ok).toBe(true);
    const afterAcknowledgement = new NarrativeState();
    expect(saves.loadAndRestore(identity, afterAcknowledgement).ok).toBe(true);
    expect(afterAcknowledgement.getPendingOperations()).toHaveLength(1);
  });

  it('does not re-emit a duplicated event but keeps its unacknowledged operation recoverable', () => {
    const identity = saveIdentity();
    const director = directorWith(identity);
    const event = {
      id: 'event.relic-1',
      signal: { type: 'item.collected' as const, itemId: 'one', itemType: 'relic' },
    };
    const first = director.process(event);
    const repeated = director.process(event);
    expect(first).toMatchObject({ ok: true, value: { status: 'processed', commands: [{ type: 'reward.grant' }] } });
    expect(repeated).toMatchObject({ ok: true, value: { status: 'duplicate', commands: [] } });
    expect(director.pendingRewardCommands()).toHaveLength(1);
  });

  it('prevents collisions for identical local operation ids in different runs and stages', () => {
    const firstIdentity = saveIdentity({ runId: 'test.run-1' });
    const secondIdentity = saveIdentity({ runId: 'test.run-2' });
    const otherContent = narrativeContent() as unknown as Record<string, any>;
    otherContent.stageId = 'test.other-stage';
    const thirdIdentity = saveIdentity({ runId: 'test.run-1', stageId: 'test.other-stage' });

    const directors = [
      directorWith(firstIdentity),
      directorWith(secondIdentity),
      directorWith(thirdIdentity, otherContent as NarrativeContent),
    ];
    const operationIds = directors.map((director, index) => {
      const result = director.process({
        id: `event.relic-${index}`,
        signal: { type: 'item.collected', itemId: `relic.${index}`, itemType: 'relic' },
      });
      if (!result.ok || result.value.commands[0]?.type !== 'reward.grant') throw new Error('missing reward');
      return result.value.commands[0].operationId;
    });
    expect(new Set(operationIds).size).toBe(3);
  });

  it('rejects a pending operation missing from the deduplication journal', () => {
    const identity = saveIdentity();
    const director = directorWith(identity);
    director.process({
      id: 'event.relic',
      signal: { type: 'item.collected', itemId: 'relic.one', itemType: 'relic' },
    });
    const service = new CampaignSaveService(new MemorySaveStorage());
    const envelope = service.createEnvelope(identity, director.state);
    if (!envelope.ok) throw envelope.error;
    const corrupt = JSON.parse(JSON.stringify(envelope.value)) as Record<string, any>;
    corrupt.narrative.appliedOperationIds = [];
    const target = new NarrativeState({ flags: { 'test.original': true } });
    const before = target.snapshot();

    expect(service.restore(corrupt as any, target, identity)).toMatchObject({
      ok: false, error: { code: 'invalid-snapshot' },
    });
    expect(target.snapshot()).toEqual(before);
  });

  it('supports recoverable replay but relies on external operation-id deduplication after a crash', () => {
    const identity = saveIdentity();
    const director = directorWith(identity);
    director.process({
      id: 'event.relic',
      signal: { type: 'item.collected', itemId: 'relic.one', itemType: 'relic' },
    });
    const pendingBeforeCrash = director.pendingRewardCommands();
    const externallyApplied = new Set<string>();
    const operationId = pendingBeforeCrash[0].type === 'reward.grant'
      ? pendingBeforeCrash[0].operationId
      : '';
    externallyApplied.add(operationId);

    const storage = new MemorySaveStorage();
    const service = new CampaignSaveService(storage);
    service.save(identity, director.state);
    const restored = new NarrativeState();
    service.loadAndRestore(identity, restored);
    const afterCrash = StageDirector.create(narrativeContent(), restored.snapshot(), progression, { identity });
    if (!afterCrash.ok) throw afterCrash.error;
    const replayed = afterCrash.value.pendingRewardCommands();
    expect(replayed[0]).toEqual(pendingBeforeCrash[0]);
    expect(externallyApplied.has(operationId)).toBe(true);
  });
});
