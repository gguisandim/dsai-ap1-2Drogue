import {
  ProgressionOperationLedger,
  ProgressionState,
  ProgressionStorage,
  cloneProgressionState,
  createProgressionState,
} from './types';

export class MemoryProgressionStorage implements ProgressionStorage {
  private state?: ProgressionState;

  public constructor(initial?: ProgressionState) {
    this.state = initial ? cloneProgressionState(initial) : undefined;
  }

  public load(): ProgressionState | undefined {
    return this.state ? cloneProgressionState(this.state) : undefined;
  }

  public save(state: ProgressionState): void {
    this.state = cloneProgressionState(state);
  }

  public clear(): void {
    this.state = undefined;
  }
}

export class LocalProgressionStorage implements ProgressionStorage {
  public constructor(private readonly key = 'vigrid-progression-v1') {}

  public load(): ProgressionState | undefined {
    if (typeof localStorage === 'undefined') return undefined;
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return undefined;
      return this.sanitize(JSON.parse(raw) as Partial<ProgressionState>);
    } catch {
      return undefined;
    }
  }

  public save(state: ProgressionState): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(this.key, JSON.stringify(state));
    } catch {
      // Storage may be unavailable in privacy mode. Progression remains alive
      // for the current session instead of interrupting gameplay.
    }
  }

  public clear(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.removeItem(this.key);
    } catch {
      // Ignore unavailable storage.
    }
  }

  private sanitize(input: Partial<ProgressionState>): ProgressionState {
    const base = createProgressionState();
    return {
      ...base,
      ...input,
      level: this.number(input.level, base.level, 1),
      experience: this.number(input.experience, base.experience, 0),
      lifetimeExperience: this.number(input.lifetimeExperience, base.lifetimeExperience, 0),
      currency: this.number(input.currency, base.currency, 0),
      skillPoints: this.number(input.skillPoints, base.skillPoints, 0),
      chapter: this.number(input.chapter, base.chapter, 1),
      unlockedNodes: { ...base.unlockedNodes, ...(input.unlockedNodes ?? {}) },
      unlockedContent: Array.isArray(input.unlockedContent) ? [...new Set(input.unlockedContent.filter((item): item is string => typeof item === 'string'))] : base.unlockedContent,
      mastery: { ...base.mastery, ...(input.mastery ?? {}) },
      counters: { ...base.counters, ...(input.counters ?? {}) },
      quests: { ...base.quests, ...(input.quests ?? {}) },
      modifiers: { ...base.modifiers, ...(input.modifiers ?? {}) },
      operationLedger: this.operationLedger(input.operationLedger),
      updatedAt: this.number(input.updatedAt, base.updatedAt, 0),
    };
  }

  private operationLedger(value: unknown): ProgressionOperationLedger {
    const fallback: ProgressionOperationLedger = { version: 1, applied: [] };
    if (!value || typeof value !== 'object') return fallback;
    const candidate = value as { version?: unknown; applied?: unknown };
    if (candidate.version !== 1 || !Array.isArray(candidate.applied)) return fallback;
    const applied = [...new Set(candidate.applied.filter(
      (item): item is string => typeof item === 'string' && item.trim().length > 0,
    ))];
    return { version: 1, applied: applied.slice(-256) };
  }

  private number(value: unknown, fallback: number, minimum: number): number {
    return typeof value === 'number' && Number.isFinite(value) ? Math.max(minimum, value) : fallback;
  }
}
