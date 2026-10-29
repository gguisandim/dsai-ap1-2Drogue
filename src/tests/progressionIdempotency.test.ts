import {
  LocalProgressionStorage,
  MemoryProgressionStorage,
  ProgressionService,
  cloneProgressionState,
  createProgressionState,
} from '../progression';
import type { ProgressionState, ProgressionStorage } from '../progression';

class FlakyStorage implements ProgressionStorage {
  private state?: ProgressionState;
  public failNextWrite = false;

  public load(): ProgressionState | undefined {
    return this.state ? cloneProgressionState(this.state) : undefined;
  }

  public save(state: ProgressionState): void {
    if (this.failNextWrite) throw new Error('fixture write failure');
    this.state = cloneProgressionState(state);
  }

  public clear(): void {
    this.state = undefined;
  }
}

class SilentStorage implements ProgressionStorage {
  private state = createProgressionState(1);

  public load(): ProgressionState | undefined {
    return cloneProgressionState(this.state);
  }

  public save(): void {
    // Deliberately drops the write, like a storage that fails silently.
  }

  public clear(): void {
    this.state = createProgressionState(1);
  }
}

function service(storage: ProgressionStorage, now = 1000): ProgressionService {
  return new ProgressionService({ storage, now: () => now });
}

describe('durable progression reward idempotency', () => {
  it('applies an operation once and deduplicates it after restart', () => {
    const storage = new MemoryProgressionStorage();
    const first = service(storage);
    const applied = first.recordStageCompletedIdempotent({
      stageId: 'verse_01_atrium',
      difficulty: 2,
      parSeconds: 60,
      operationId: 'transition.one',
    });

    expect(applied).toMatchObject({ ok: true, value: { status: 'applied' } });
    if (!applied.ok) return;
    expect(applied.value.update.currencyAwarded).toBeGreaterThan(0);
    const afterApply = first.snapshot();
    expect(afterApply.operationLedger.applied).toEqual(['transition.one']);
    expect(storage.load()).toEqual(afterApply);

    const duplicate = first.recordStageCompletedIdempotent({
      stageId: 'verse_01_atrium',
      difficulty: 2,
      parSeconds: 60,
      operationId: 'transition.one',
    });
    expect(duplicate).toMatchObject({
      ok: true,
      value: { status: 'deduplicated', update: { currencyAwarded: 0, experienceAwarded: 0 } },
    });
    expect(first.snapshot()).toEqual(afterApply);

    const restarted = service(storage);
    const afterRestart = restarted.recordStageCompletedIdempotent({
      stageId: 'verse_01_atrium',
      difficulty: 2,
      parSeconds: 60,
      operationId: 'transition.one',
    });
    expect(afterRestart).toMatchObject({ ok: true, value: { status: 'deduplicated' } });
    expect(restarted.snapshot()).toEqual(afterApply);
  });

  it('rolls back memory and reports a thrown write without confirming the operation', () => {
    const storage = new FlakyStorage();
    const progression = service(storage);
    const before = progression.snapshot();
    storage.failNextWrite = true;

    const failed = progression.recordStageCompletedIdempotent({
      stageId: 'verse_01_atrium',
      difficulty: 2,
      parSeconds: 60,
      operationId: 'transition.fail',
    });

    expect(failed).toMatchObject({ ok: false, error: { code: 'persistence-failed' } });
    expect(progression.snapshot()).toEqual(before);
    expect(progression.snapshot().operationLedger.applied).toEqual([]);

    storage.failNextWrite = false;
    const retried = progression.recordStageCompletedIdempotent({
      stageId: 'verse_01_atrium',
      difficulty: 2,
      parSeconds: 60,
      operationId: 'transition.fail',
    });
    expect(retried).toMatchObject({ ok: true, value: { status: 'applied' } });
    expect(progression.snapshot().operationLedger.applied).toEqual(['transition.fail']);
    expect(progression.snapshot().counters.stagesCompleted).toBe(1);
  });

  it('detects a silent write failure by reading the ledger back', () => {
    const progression = service(new SilentStorage());
    const before = progression.snapshot();

    const failed = progression.recordStageCompletedIdempotent({
      stageId: 'verse_01_atrium',
      difficulty: 2,
      parSeconds: 60,
      operationId: 'transition.silent',
    });

    expect(failed).toMatchObject({ ok: false, error: { code: 'persistence-failed' } });
    expect(progression.snapshot()).toEqual(before);
  });

  it('preserves legacy reward values and applies new operations once', () => {
    const legacy = service(new MemoryProgressionStorage());
    const idempotent = service(new MemoryProgressionStorage());
    const legacyUpdate = legacy.recordStageCompleted({
      stageId: 'verse_01_atrium',
      difficulty: 3,
      parSeconds: 60,
      elapsedSeconds: 40,
    });
    const idempotentResult = idempotent.recordStageCompletedIdempotent({
      stageId: 'verse_01_atrium',
      difficulty: 3,
      parSeconds: 60,
      elapsedSeconds: 40,
      operationId: 'transition.legacy-equivalence',
    });
    if (!idempotentResult.ok) throw idempotentResult.error;
    expect(idempotentResult.value.status).toBe('applied');
    expect(idempotentResult.value.update).toEqual(legacyUpdate);
    expect(idempotent.snapshot().currency).toBe(legacy.snapshot().currency);
    expect(idempotent.snapshot().counters).toEqual(legacy.snapshot().counters);
  });

  it('accepts a legacy state without a ledger and adds one on the next operation', () => {
    const legacy = createProgressionState(10) as unknown as Record<string, unknown>;
    delete legacy.operationLedger;
    const storage = new MemoryProgressionStorage(legacy as unknown as ProgressionState);
    const progression = service(storage);

    expect(progression.snapshot().operationLedger).toEqual({ version: 1, applied: [] });
    const result = progression.recordStageCompletedIdempotent({
      stageId: 'verse_01_atrium',
      difficulty: 1,
      parSeconds: 30,
      operationId: 'transition.upgraded-save',
    });
    expect(result).toMatchObject({ ok: true, value: { status: 'applied' } });
    expect(storage.load()?.operationLedger.applied).toEqual(['transition.upgraded-save']);
  });

  it('rejects an empty operation id without mutating progress', () => {
    const progression = service(new MemoryProgressionStorage());
    const before = progression.snapshot();

    const result = progression.recordStageCompletedIdempotent({
      stageId: 'verse_01_atrium',
      difficulty: 1,
      parSeconds: 30,
      operationId: '   ',
    });

    expect(result).toMatchObject({ ok: false, error: { code: 'invalid-operation-id' } });
    expect(progression.snapshot()).toEqual(before);
  });

  it('persists the ledger through the local storage sanitizer', () => {
    const values = new Map<string, string>();
    const fakeStorage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
      removeItem: (key: string) => { values.delete(key); },
    };
    const scope = globalThis as any;
    const previous = scope.localStorage;
    scope.localStorage = fakeStorage;
    try {
      const progression = service(new LocalProgressionStorage('test-progression-ledger'));
      const result = progression.recordStageCompletedIdempotent({
        stageId: 'verse_01_atrium',
        difficulty: 1,
        parSeconds: 30,
        operationId: 'transition.local-storage',
      });
      expect(result).toMatchObject({ ok: true, value: { status: 'applied' } });

      const restarted = service(new LocalProgressionStorage('test-progression-ledger'));
      expect(restarted.snapshot().operationLedger.applied).toContain('transition.local-storage');
      expect(restarted.recordStageCompletedIdempotent({
        stageId: 'verse_01_atrium',
        difficulty: 1,
        parSeconds: 30,
        operationId: 'transition.local-storage',
      })).toMatchObject({ ok: true, value: { status: 'deduplicated' } });
    } finally {
      if (previous === undefined) delete scope.localStorage;
      else scope.localStorage = previous;
    }
  });
});
