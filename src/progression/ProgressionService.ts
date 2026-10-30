import { ExperienceCurve, LevelProgress } from './ExperienceCurve';
import { GeneratedContentDirector } from './generated';
import { LocalProgressionStorage } from './ProgressionStorage';
import {
  EnemyDefeatProgress,
  ProgressionDiscipline,
  ProgressionNodePreview,
  ProgressionOperationResult,
  ProgressionReward,
  ProgressionRewardOperation,
  ProgressionSnapshot,
  ProgressionState,
  ProgressionStorage,
  ProgressionUpdate,
  StageCompletionProgress,
  cloneProgressionState,
  createProgressionState,
} from './types';

export interface ProgressionServiceOptions {
  storage?: ProgressionStorage;
  curve?: ExperienceCurve;
  content?: GeneratedContentDirector;
  now?: () => number;
}

export class ProgressionService {
  private readonly storage: ProgressionStorage;
  private readonly curve: ExperienceCurve;
  private readonly content: GeneratedContentDirector;
  private readonly now: () => number;
  private state: ProgressionState;
  private readonly uncertainOperationIds = new Set<string>();

  public constructor(options: ProgressionServiceOptions = {}) {
    this.storage = options.storage ?? new LocalProgressionStorage();
    this.curve = options.curve ?? new ExperienceCurve();
    this.content = options.content ?? new GeneratedContentDirector();
    this.now = options.now ?? (() => Date.now());
    this.state = this.storage.load() ?? createProgressionState(this.now());
    this.reconcile();
  }

  public snapshot(): ProgressionSnapshot {
    return cloneProgressionState(this.state);
  }

  public levelProgress(): LevelProgress {
    return this.curve.progress(this.state.experience);
  }

  public recordEnemyDefeat(input: EnemyDefeatProgress): ProgressionUpdate {
    const previousLevel = this.state.level;
    const roleMultiplier = input.role === 'boss' ? 5 : input.role === 'ranged' ? 1.35 : 1;
    const vitalityMultiplier = 1 + Math.min(4, Math.max(0, input.maximumHealth) / 800);
    const difficultyMultiplier = 1 + Math.max(0, input.difficulty - 1) * 0.12;
    const rawExperience = Math.round(10 * roleMultiplier * vitalityMultiplier * difficultyMultiplier);
    const rawCurrency = Math.round(8 * roleMultiplier * difficultyMultiplier);
    const experienceAwarded = Math.max(1, Math.round(rawExperience * this.state.modifiers.experienceMultiplier));
    const currencyAwarded = Math.max(0, Math.round(rawCurrency * this.state.modifiers.haloMultiplier));

    this.state.counters.totalKills++;
    if (input.role === 'melee') this.state.counters.meleeKills++;
    if (input.role === 'ranged') this.state.counters.rangedKills++;
    if (input.role === 'boss') this.state.counters.bossKills++;
    this.state.mastery[input.role] += Math.max(1, Math.round(rawExperience * 0.45));
    this.addExperience(experienceAwarded);
    this.state.currency += currencyAwarded;

    const completedQuests = this.advanceDefeatQuests(input);
    const levelReward = this.resolveLevelUps(previousLevel);
    const unlocked = this.content.autoUnlock(this.state, Math.max(0, levelReward.levelsGained));
    const contentLevelReward = this.resolveLevelUps(previousLevel + levelReward.levelsGained);
    this.reconcile();
    this.persist();
    return {
      experienceAwarded,
      currencyAwarded,
      levelsGained: levelReward.levelsGained + contentLevelReward.levelsGained,
      skillPointsAwarded: levelReward.skillPointsAwarded + contentLevelReward.skillPointsAwarded,
      unlocked,
      completedQuests,
      previousLevel,
      currentLevel: this.state.level,
    };
  }

  public recordStageCompleted(input: StageCompletionProgress): ProgressionUpdate {
    const result = this.applyStageCompletion(input, false);
    if (!result.ok) throw new Error(result.error.message);
    return result.value.update;
  }

  /**
   * Applies a stage-completion reward with an optional durable operation id.
   * When the id is supplied, the reward and the id are written to the same
   * progression state; a repeated call is deduplicated. A failed write rolls
   * back the in-memory state and is reported, never silently confirmed.
   */
  public recordStageCompletedIdempotent(
    input: StageCompletionProgress,
  ): ProgressionOperationResult {
    return this.applyStageCompletion(input, true);
  }

  /**
   * Durably applies an external progression reward under the shared operation
   * ledger. The API is intentionally limited to currency and content unlocks;
   * narrative content cannot mint arbitrary progression mutations.
   */
  public grantRewardIdempotent(
    input: ProgressionRewardOperation,
  ): ProgressionOperationResult {
    const operationFailure = this.validateOperationId(input.operationId);
    if (operationFailure) return operationFailure;
    const rewardFailure = this.validateExternalReward(input.reward);
    if (rewardFailure) return rewardFailure;
    const known = this.resolveKnownOperation(input.operationId);
    if (known) return known;

    const before = cloneProgressionState(this.state);
    const update = this.mutateExternalReward(input.reward);
    this.recordOperation(input.operationId);
    if (!this.persistOperation(input.operationId)) {
      this.state = before;
      this.uncertainOperationIds.add(input.operationId);
      return this.persistenceFailure();
    }
    this.uncertainOperationIds.delete(input.operationId);
    return { ok: true, value: { status: 'applied', update } };
  }

  private applyStageCompletion(
    input: StageCompletionProgress,
    durable: boolean,
  ): ProgressionOperationResult {
    const operationId = input.operationId;
    if (durable && operationId !== undefined) {
      const operationFailure = this.validateOperationId(operationId);
      if (operationFailure) return operationFailure;
      const known = this.resolveKnownOperation(operationId);
      if (known) return known;
    }

    const before = durable ? cloneProgressionState(this.state) : undefined;
    const update = this.mutateStageCompletion(input);
    if (durable && operationId !== undefined) {
      this.recordOperation(operationId);
      if (!this.persistOperation(operationId)) {
        if (before) this.state = before;
        this.uncertainOperationIds.add(operationId);
        return this.persistenceFailure();
      }
      this.uncertainOperationIds.delete(operationId);
      return { ok: true, value: { status: 'applied', update } };
    }
    this.persist();
    return { ok: true, value: { status: 'applied', update } };
  }

  private mutateStageCompletion(input: StageCompletionProgress): ProgressionUpdate {
    const previousLevel = this.state.level;
    this.state.counters.stagesCompleted++;
    this.state.chapter = Math.max(this.state.chapter, this.state.counters.stagesCompleted + 1);
    this.state.mastery.exploration += 20 + input.difficulty * 8;
    const parBonus = input.elapsedSeconds !== undefined && input.parSeconds !== undefined && input.elapsedSeconds <= input.parSeconds ? 1.35 : 1;
    const experienceAwarded = Math.round((70 + input.difficulty * 24) * parBonus * this.state.modifiers.experienceMultiplier);
    const currencyAwarded = Math.round((45 + input.difficulty * 18) * parBonus * this.state.modifiers.haloMultiplier);
    this.addExperience(experienceAwarded);
    this.state.currency += currencyAwarded;
    this.unlockContent(`stage-${input.stageId}`);
    this.unlockContent(`chapter-${this.state.chapter}`);
    const completedQuests = this.advanceQuest('quest-stage-clearer', 1, 3 + Math.floor(this.state.chapter / 2));
    const levelReward = this.resolveLevelUps(previousLevel);
    const unlocked = this.content.autoUnlock(this.state, Math.max(1, levelReward.levelsGained));
    const contentLevelReward = this.resolveLevelUps(previousLevel + levelReward.levelsGained);
    this.reconcile();
    return {
      experienceAwarded,
      currencyAwarded,
      levelsGained: levelReward.levelsGained + contentLevelReward.levelsGained,
      skillPointsAwarded: levelReward.skillPointsAwarded + contentLevelReward.skillPointsAwarded,
      unlocked,
      completedQuests,
      previousLevel,
      currentLevel: this.state.level,
    };
  }

  private emptyUpdate(): ProgressionUpdate {
    return {
      experienceAwarded: 0,
      currencyAwarded: 0,
      levelsGained: 0,
      skillPointsAwarded: 0,
      unlocked: [],
      completedQuests: [],
      previousLevel: this.state.level,
      currentLevel: this.state.level,
    };
  }

  private validateOperationId(operationId: string): ProgressionOperationResult | undefined {
    if (typeof operationId === 'string' && operationId.trim().length > 0) return undefined;
    return {
      ok: false,
      error: {
        code: 'invalid-operation-id',
        message: 'operationId must be a non-empty string.',
      },
    };
  }

  private validateExternalReward(reward: ProgressionReward): ProgressionOperationResult | undefined {
    if (!reward || typeof reward !== 'object') {
      return this.invalidReward('Reward must be an object.');
    }
    const keys = Object.keys(reward);
    if (keys.length === 0 || keys.some(key => key !== 'currency' && key !== 'unlocks')) {
      return this.invalidReward('Only currency and content unlocks are supported.');
    }
    if (reward.currency !== undefined &&
      (!Number.isSafeInteger(reward.currency) || reward.currency <= 0)) {
      return this.invalidReward('Currency reward must be a positive safe integer.');
    }
    if (reward.unlocks !== undefined && (!Array.isArray(reward.unlocks) ||
      reward.unlocks.length === 0 || reward.unlocks.some(id =>
        typeof id !== 'string' || id.length === 0 || id.trim() !== id))) {
      return this.invalidReward('Unlock rewards require normalized non-empty content ids.');
    }
    return undefined;
  }

  private invalidReward(message: string): ProgressionOperationResult {
    return { ok: false, error: { code: 'invalid-reward', message } };
  }

  private persistenceFailure(): ProgressionOperationResult {
    return {
      ok: false,
      error: {
        code: 'persistence-failed',
        message: 'Progression reward was not durably recorded.',
      },
    };
  }

  private resolveKnownOperation(operationId: string): ProgressionOperationResult | undefined {
    if (this.state.operationLedger?.applied?.includes(operationId)) {
      return { ok: true, value: { status: 'deduplicated', update: this.emptyUpdate() } };
    }
    if (!this.uncertainOperationIds.has(operationId)) return undefined;
    let persisted: ProgressionState | undefined;
    try {
      persisted = this.storage.load();
    } catch {
      return this.persistenceFailure();
    }
    if (persisted?.operationLedger?.applied?.includes(operationId)) {
      this.state = cloneProgressionState(persisted);
      this.uncertainOperationIds.delete(operationId);
      return { ok: true, value: { status: 'deduplicated', update: this.emptyUpdate() } };
    }
    this.uncertainOperationIds.delete(operationId);
    return undefined;
  }

  private recordOperation(operationId: string): void {
    const applied = [...(this.state.operationLedger?.applied ?? [])];
    if (!applied.includes(operationId)) applied.push(operationId);
    this.state.operationLedger = { version: 1, applied };
  }

  private mutateExternalReward(reward: ProgressionReward): ProgressionUpdate {
    const previousLevel = this.state.level;
    const currencyAwarded = reward.currency ?? 0;
    this.state.currency += currencyAwarded;
    const unlocked: string[] = [];
    for (const contentId of reward.unlocks ?? []) {
      if (!this.state.unlockedContent.includes(contentId)) {
        this.unlockContent(contentId);
        unlocked.push(contentId);
      }
    }
    this.reconcile();
    return {
      ...this.emptyUpdate(),
      currencyAwarded,
      unlocked,
      previousLevel,
      currentLevel: this.state.level,
    };
  }

  private persistOperation(operationId: string): boolean {
    try {
      this.storage.save(this.state);
    } catch {
      return false;
    }
    try {
      const persisted = this.storage.load();
      return persisted?.operationLedger?.applied?.includes(operationId) === true;
    } catch {
      return false;
    }
  }

  public recordDamageDealt(amount: number): void {
    const safe = Math.max(0, Math.round(amount));
    this.state.counters.damageDealt += safe;
    this.advanceQuest('quest-damage-dealer', safe, 2500 + this.state.level * 500);
    this.touch();
  }

  public recordDamageTaken(amount: number): void {
    const safe = Math.max(0, Math.round(amount));
    this.state.counters.damageTaken += safe;
    this.state.mastery.survival += Math.max(1, Math.round(safe * 0.3));
    this.touch();
  }

  public recordItemCollected(itemId: string): void {
    this.state.counters.itemsCollected++;
    if (itemId.includes('key') || itemId.includes('secret')) this.state.counters.secretsFound++;
    this.advanceQuest('quest-collector', 1, 15 + this.state.chapter * 3);
    this.touch();
  }

  public availableNodes(): ProgressionNodePreview[] {
    return this.content.available(this.state);
  }

  public upcomingNodes(limit = 12): ProgressionNodePreview[] {
    return this.content.upcoming(this.state, limit);
  }

  public recommendNode(preferred?: ProgressionDiscipline): ProgressionNodePreview | undefined {
    return this.content.recommend(this.state, preferred);
  }

  public unlockNode(id: string): void {
    const previousLevel = this.state.level;
    this.content.unlock(this.state, id);
    this.resolveLevelUps(previousLevel);
    this.reconcile();
    this.persist();
  }

  public reset(): void {
    this.state = createProgressionState(this.now());
    this.storage.clear();
    this.persist();
  }

  private addExperience(amount: number): void {
    const safe = Math.max(0, Math.round(amount));
    this.state.experience += safe;
    this.state.lifetimeExperience += safe;
  }

  private resolveLevelUps(previousLevel: number): { levelsGained: number; skillPointsAwarded: number } {
    const resolvedLevel = this.curve.levelForTotalExperience(this.state.experience);
    let skillPointsAwarded = 0;
    for (let level = previousLevel + 1; level <= resolvedLevel; level++) {
      const reward = this.curve.rewardsForLevel(level);
      skillPointsAwarded += reward.skillPoints;
      this.state.skillPoints += reward.skillPoints;
      this.state.currency += reward.currency;
      this.unlockContent(`level-${level}`);
      if (level % 10 === 0) this.unlockContent(`milestone-${level}`);
    }
    this.state.level = resolvedLevel;
    return { levelsGained: Math.max(0, resolvedLevel - previousLevel), skillPointsAwarded };
  }

  private advanceDefeatQuests(input: EnemyDefeatProgress): string[] {
    const completed = new Set<string>();
    for (const id of this.advanceQuest('quest-hunter', 1, 20 + this.state.chapter * 5)) completed.add(id);
    for (const id of this.advanceQuest(`quest-hunter-${input.role}`, 1, input.role === 'boss' ? 1 : 10 + this.state.chapter * 2)) completed.add(id);
    if (input.difficulty >= 8) {
      for (const id of this.advanceQuest('quest-high-difficulty', 1, 8)) completed.add(id);
    }
    return [...completed];
  }

  private advanceQuest(id: string, amount: number, target: number): string[] {
    const current = this.state.quests[id] ?? { id, progress: 0, target, completed: false, claimed: false };
    if (current.claimed) return [];
    current.target = Math.max(current.target, target);
    current.progress = Math.min(current.target, current.progress + Math.max(0, amount));
    if (current.progress >= current.target && !current.completed) {
      current.completed = true;
      current.claimed = true;
      const questTier = 1 + Object.values(this.state.quests).filter((quest) => quest.completed).length;
      const experience = 40 + questTier * 12;
      const currency = 60 + questTier * 20;
      this.addExperience(experience);
      this.state.currency += currency;
      this.state.skillPoints += questTier % 3 === 0 ? 1 : 0;
      this.unlockContent(`quest-reward-${id}-${questTier}`);
      this.state.quests[id] = current;
      return [id];
    }
    this.state.quests[id] = current;
    return [];
  }

  private unlockContent(id: string): void {
    if (!this.state.unlockedContent.includes(id)) this.state.unlockedContent.push(id);
  }

  private reconcile(): void {
    this.state.level = this.curve.levelForTotalExperience(this.state.experience);
    this.state.currency = Math.max(0, Math.floor(this.state.currency));
    this.state.skillPoints = Math.max(0, Math.floor(this.state.skillPoints));
    this.state.modifiers.damageMultiplier = Math.max(0.1, this.state.modifiers.damageMultiplier);
    this.state.modifiers.defenseMultiplier = Math.max(0.1, this.state.modifiers.defenseMultiplier);
    this.state.modifiers.movementMultiplier = Math.max(0.25, this.state.modifiers.movementMultiplier);
    this.state.modifiers.cooldownMultiplier = Math.max(0.2, this.state.modifiers.cooldownMultiplier);
    this.state.modifiers.haloMultiplier = Math.max(0, this.state.modifiers.haloMultiplier);
    this.state.modifiers.experienceMultiplier = Math.max(0, this.state.modifiers.experienceMultiplier);
    this.state.updatedAt = this.now();
  }

  private touch(): void {
    this.state.updatedAt = this.now();
    this.persist();
  }

  private persist(): void {
    this.storage.save(this.state);
  }
}
