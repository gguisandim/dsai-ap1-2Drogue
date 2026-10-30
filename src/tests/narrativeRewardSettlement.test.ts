import { NarrativeRewardSettlementService } from '../application/rewards';
import { GameNarrativeSession } from '../application/stages';
import {
  CampaignSaveService,
  MemorySaveStorage,
  NarrativeState,
  StageDirector,
} from '../narrative';
import type {
  CampaignSaveIdentity,
  NarrativeContent,
  SaveStoragePort,
  StageCommand,
} from '../narrative';
import {
  MemoryProgressionStorage,
  ProgressionService,
  type ProgressionState,
  type ProgressionStorage,
  cloneProgressionState,
} from '../progression';
import { narrativeContent, progression, saveIdentity } from './narrativeTestFixture';

const SAVE_KEY = 'test.reward-settlement';

class ToggleNarrativeStorage implements SaveStoragePort {
  private readonly values = new Map<string, string>();
  public failWrites = false;

  public read(key: string): string | undefined {
    return this.values.get(key);
  }

  public write(key: string, value: string): void {
    if (this.failWrites) throw new Error('narrative write denied');
    this.values.set(key, value);
  }
}

class ToggleProgressionStorage implements ProgressionStorage {
  private state?: ProgressionState;
  public failWrites = false;

  public load(): ProgressionState | undefined {
    return this.state ? cloneProgressionState(this.state) : undefined;
  }

  public save(state: ProgressionState): void {
    if (this.failWrites) throw new Error('progression write denied');
    this.state = cloneProgressionState(state);
  }

  public clear(): void {
    this.state = undefined;
  }
}

class VerificationFailureStorage implements ProgressionStorage {
  private state?: ProgressionState;
  private failNextLoad = false;

  public load(): ProgressionState | undefined {
    if (this.failNextLoad) {
      this.failNextLoad = false;
      throw new Error('verification read denied');
    }
    return this.state ? cloneProgressionState(this.state) : undefined;
  }

  public save(state: ProgressionState): void {
    this.state = cloneProgressionState(state);
    this.failNextLoad = true;
  }

  public clear(): void {
    this.state = undefined;
  }
}

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
  content: NarrativeContent = narrativeContent(),
): GameNarrativeSession {
  const state = new NarrativeState();
  const saves = new CampaignSaveService(storage, SAVE_KEY);
  const restored = saves.loadAndRestore(identity, state);
  if (!restored.ok) throw restored.error;
  const created = StageDirector.create(content, state.snapshot(), progression, { identity });
  if (!created.ok) throw created.error;
  return new GameNarrativeSession(identity, created.value, saves);
}

function collectRelic(session: GameNarrativeSession, occurrence = 'gameplay.relic.1'): void {
  const result = session.processGameplayEvent({
    id: occurrence,
    signal: { type: 'item.collected', itemId: occurrence, itemType: 'relic' },
  });
  if (!result.ok) throw result.error;
}

function completeHunt(session: GameNarrativeSession): void {
  const entered = session.enterStage();
  if (!entered.ok) throw entered.error;
  for (const id of ['gameplay.enemy.1', 'gameplay.enemy.2']) {
    const result = session.processGameplayEvent({
      id,
      signal: { type: 'enemy.defeated', enemyId: id, archetype: 'shade' },
    });
    if (!result.ok) throw result.error;
  }
}

describe('NarrativeRewardSettlementService', () => {
  it('durably grants a simple reward and only then confirms the narrative operation', () => {
    const narrativeStorage = new MemorySaveStorage();
    const progressionStorage = new MemoryProgressionStorage();
    const session = createSession(narrativeStorage);
    collectRelic(session);

    const result = new NarrativeRewardSettlementService(
      session,
      new ProgressionService({ storage: progressionStorage, now: () => 10 }),
    ).settlePending();

    expect(result).toMatchObject({ ok: true, settlements: [{ status: 'applied' }] });
    expect(progressionStorage.load()?.currency).toBe(3);
    expect(session.pendingRewardCommands()).toEqual([]);
  });

  it('settles two distinct mission rewards without merging their operation ids', () => {
    const progressionStorage = new MemoryProgressionStorage();
    const session = createSession(new MemorySaveStorage());
    completeHunt(session);
    expect(session.pendingRewardCommands()).toHaveLength(2);

    const result = new NarrativeRewardSettlementService(
      session,
      new ProgressionService({ storage: progressionStorage }),
    ).settlePending();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(new Set(result.settlements.map(item => item.operationId)).size).toBe(2);
    expect(progressionStorage.load()).toMatchObject({
      currency: 10,
      unlockedContent: expect.arrayContaining(['test.chain-unlock']),
    });
  });

  it('does not grant or confirm the same operation twice', () => {
    const progressionService = new ProgressionService({ storage: new MemoryProgressionStorage() });
    const session = createSession(new MemorySaveStorage());
    collectRelic(session);
    const settlement = new NarrativeRewardSettlementService(session, progressionService);

    expect(settlement.settlePending().ok).toBe(true);
    expect(settlement.settlePending()).toEqual({ ok: true, settlements: [] });
    expect(progressionService.snapshot().currency).toBe(3);
  });

  it('restores after a completed grant with no pending replay', () => {
    const narrativeStorage = new MemorySaveStorage();
    const progressionStorage = new MemoryProgressionStorage();
    const session = createSession(narrativeStorage);
    collectRelic(session);
    expect(new NarrativeRewardSettlementService(
      session,
      new ProgressionService({ storage: progressionStorage }),
    ).settlePending().ok).toBe(true);

    const restoredSession = createSession(narrativeStorage);
    const restoredProgression = new ProgressionService({ storage: progressionStorage });
    expect(restoredSession.pendingRewardCommands()).toEqual([]);
    expect(restoredProgression.snapshot().currency).toBe(3);
  });

  it('reconciles reload between durable grant and narrative confirmation', () => {
    const narrativeStorage = new ToggleNarrativeStorage();
    const progressionStorage = new MemoryProgressionStorage();
    const session = createSession(narrativeStorage);
    collectRelic(session);
    narrativeStorage.failWrites = true;
    const failed = new NarrativeRewardSettlementService(
      session,
      new ProgressionService({ storage: progressionStorage }),
    ).settlePending();
    expect(failed).toMatchObject({
      ok: false,
      error: { code: 'narrative-confirmation-failed', progressionStatus: 'applied' },
    });
    expect(progressionStorage.load()?.currency).toBe(3);
    expect(session.pendingRewardCommands()).toHaveLength(1);

    narrativeStorage.failWrites = false;
    const restored = createSession(narrativeStorage);
    const retried = new NarrativeRewardSettlementService(
      restored,
      new ProgressionService({ storage: progressionStorage }),
    ).settlePending();
    expect(retried).toMatchObject({ ok: true, settlements: [{ status: 'reconciled' }] });
    expect(progressionStorage.load()?.currency).toBe(3);
    expect(restored.pendingRewardCommands()).toEqual([]);
  });

  it('keeps the narrative pending and rolls progression back when persistence fails', () => {
    const progressionStorage = new ToggleProgressionStorage();
    const progressionService = new ProgressionService({ storage: progressionStorage });
    const session = createSession(new MemorySaveStorage());
    collectRelic(session);
    progressionStorage.failWrites = true;
    const settlement = new NarrativeRewardSettlementService(session, progressionService);

    expect(settlement.settlePending()).toMatchObject({
      ok: false,
      error: { code: 'progression-failed', causeCode: 'persistence-failed' },
    });
    expect(progressionService.snapshot().currency).toBe(0);
    expect(session.pendingRewardCommands()).toHaveLength(1);

    progressionStorage.failWrites = false;
    expect(settlement.settlePending()).toMatchObject({ ok: true, settlements: [{ status: 'applied' }] });
    expect(progressionService.snapshot().currency).toBe(3);
  });

  it('recovers a failed confirmation by deduplicating progression on retry', () => {
    const narrativeStorage = new ToggleNarrativeStorage();
    const progressionService = new ProgressionService({ storage: new MemoryProgressionStorage() });
    const session = createSession(narrativeStorage);
    collectRelic(session);
    narrativeStorage.failWrites = true;
    const settlement = new NarrativeRewardSettlementService(session, progressionService);
    expect(settlement.settlePending().ok).toBe(false);
    narrativeStorage.failWrites = false;

    expect(settlement.settlePending()).toMatchObject({
      ok: true,
      settlements: [{ status: 'reconciled' }],
    });
    expect(progressionService.snapshot().currency).toBe(3);
  });

  it('reconciles a grant written before its verification read failed', () => {
    const progressionService = new ProgressionService({ storage: new VerificationFailureStorage() });
    const session = createSession(new MemorySaveStorage());
    collectRelic(session);
    const settlement = new NarrativeRewardSettlementService(session, progressionService);

    expect(settlement.settlePending()).toMatchObject({
      ok: false,
      error: { code: 'progression-failed', causeCode: 'persistence-failed' },
    });
    expect(settlement.settlePending()).toMatchObject({
      ok: true,
      settlements: [{ status: 'reconciled' }],
    });
    expect(progressionService.snapshot().currency).toBe(3);
  });

  it('does not recreate the reward when the same stage instance is revisited', () => {
    const narrativeStorage = new MemorySaveStorage();
    const progressionStorage = new MemoryProgressionStorage();
    const first = createSession(narrativeStorage);
    collectRelic(first);
    new NarrativeRewardSettlementService(
      first,
      new ProgressionService({ storage: progressionStorage }),
    ).settlePending();

    const revisit = createSession(narrativeStorage);
    expect(revisit.enterStage().ok).toBe(true);
    expect(revisit.pendingRewardCommands()).toEqual([]);
    expect(new ProgressionService({ storage: progressionStorage }).snapshot().currency).toBe(3);
  });

  it.each([
    [
      'invalid command',
      { type: 'flag.set', flag: 'test.flag', value: true } as StageCommand,
      'invalid-command',
    ],
    [
      'invalid currency',
      { type: 'reward.grant', operationId: 'test.invalid', reward: {
        type: 'progression.currency', amount: 0,
      } } as StageCommand,
      'invalid-reward',
    ],
    [
      'unsupported stage-local reward',
      { type: 'reward.grant', operationId: 'test.unsupported', reward: {
        type: 'stage.flag', flag: 'test.flag', value: true,
      } } as StageCommand,
      'unsupported-reward',
    ],
  ])('rejects %s before progression or confirmation', (_label, command, code) => {
    const confirmOperation = jest.fn();
    const grantRewardIdempotent = jest.fn();
    const service = new NarrativeRewardSettlementService(
      { pendingRewardCommands: () => [], confirmOperation },
      { grantRewardIdempotent },
    );

    expect(service.settle(command)).toMatchObject({ ok: false, error: { code } });
    expect(grantRewardIdempotent).not.toHaveBeenCalled();
    expect(confirmOperation).not.toHaveBeenCalled();
  });

  it('retains operation ids beyond the former 256-entry window', () => {
    const progressionService = new ProgressionService({ storage: new MemoryProgressionStorage() });
    for (let index = 0; index < 300; index += 1) {
      expect(progressionService.grantRewardIdempotent({
        operationId: `test.reward.${index}`,
        reward: { currency: 1 },
      }).ok).toBe(true);
    }
    expect(progressionService.grantRewardIdempotent({
      operationId: 'test.reward.0',
      reward: { currency: 1 },
    })).toMatchObject({ ok: true, value: { status: 'deduplicated' } });
    expect(progressionService.snapshot().currency).toBe(300);
    expect(progressionService.snapshot().operationLedger.applied).toHaveLength(300);
  });

  it('runs the full headless objective, reward, completion and reload scenario', () => {
    const narrativeStorage = new MemorySaveStorage();
    const progressionStorage = new MemoryProgressionStorage();
    const first = createSession(
      narrativeStorage,
      saveIdentity({ stageInstanceId: 'test.node' }),
      contentWithCompletion(),
    );
    completeHunt(first);
    expect(first.stageCompletions()).toHaveLength(1);

    const settled = new NarrativeRewardSettlementService(
      first,
      new ProgressionService({ storage: progressionStorage }),
    ).settlePending();
    expect(settled).toMatchObject({ ok: true, settlements: [{}, {}] });

    const restored = createSession(
      narrativeStorage,
      saveIdentity({ stageInstanceId: 'test.node' }),
      contentWithCompletion(),
    );
    const restoredProgression = new ProgressionService({ storage: progressionStorage });
    expect(restored.stageCompletions()).toHaveLength(1);
    expect(restored.pendingRewardCommands()).toEqual([]);
    expect(restoredProgression.snapshot()).toMatchObject({
      currency: 10,
      unlockedContent: expect.arrayContaining(['test.chain-unlock']),
    });
    expect(restored.enterStage().ok).toBe(true);
    expect(new NarrativeRewardSettlementService(
      restored,
      restoredProgression,
    ).settlePending()).toEqual({ ok: true, settlements: [] });
    expect(restoredProgression.snapshot().currency).toBe(10);
  });
});
