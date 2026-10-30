export type ProgressionDiscipline =
  | 'combat'
  | 'mobility'
  | 'defense'
  | 'arcane'
  | 'economy'
  | 'exploration';

export type ProgressionRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type MasteryTrack = 'melee' | 'ranged' | 'boss' | 'survival' | 'exploration';

export interface ProgressionModifiers {
  damageMultiplier: number;
  defenseMultiplier: number;
  movementMultiplier: number;
  cooldownMultiplier: number;
  haloMultiplier: number;
  experienceMultiplier: number;
  criticalChance: number;
  dodgeWindowBonus: number;
  maximumHealthBonus: number;
  maximumMagicBonus: number;
  lootLuck: number;
}

export interface ProgressionCounters {
  totalKills: number;
  meleeKills: number;
  rangedKills: number;
  bossKills: number;
  stagesCompleted: number;
  runsCompleted: number;
  damageDealt: number;
  damageTaken: number;
  itemsCollected: number;
  secretsFound: number;
}

export interface ProgressionQuestState {
  id: string;
  progress: number;
  target: number;
  completed: boolean;
  claimed: boolean;
}

export interface ProgressionState {
  version: number;
  level: number;
  experience: number;
  lifetimeExperience: number;
  currency: number;
  skillPoints: number;
  chapter: number;
  unlockedNodes: Record<string, number>;
  unlockedContent: string[];
  mastery: Record<MasteryTrack, number>;
  counters: ProgressionCounters;
  quests: Record<string, ProgressionQuestState>;
  modifiers: ProgressionModifiers;
  operationLedger: ProgressionOperationLedger;
  updatedAt: number;
}

export interface ProgressionOperationLedger {
  version: 1;
  applied: string[];
}

export interface ProgressionSnapshot extends ProgressionState {}

export interface ProgressionRequirementResult {
  met: boolean;
  missing: string[];
  progress: number;
}

export interface ProgressionReward {
  experience?: number;
  currency?: number;
  skillPoints?: number;
  unlocks?: string[];
  modifier?: Partial<ProgressionModifiers>;
}

export interface ProgressionNodePreview {
  id: string;
  title: string;
  description: string;
  discipline: ProgressionDiscipline;
  rarity: ProgressionRarity;
  tier: number;
  currentRank: number;
  maximumRank: number;
  cost: number;
  requirement: ProgressionRequirementResult;
  reward: ProgressionReward;
}

export interface ProgressionNode {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly discipline: ProgressionDiscipline;
  readonly rarity: ProgressionRarity;
  readonly tier: number;
  readonly maximumRank: number;
  requirement(snapshot: ProgressionSnapshot): ProgressionRequirementResult;
  cost(snapshot: ProgressionSnapshot): number;
  reward(snapshot: ProgressionSnapshot): ProgressionReward;
  preview(snapshot: ProgressionSnapshot): ProgressionNodePreview;
  apply(state: ProgressionState): ProgressionReward;
}

export interface EnemyDefeatProgress {
  role: 'melee' | 'ranged' | 'boss';
  enemyType: string;
  maximumHealth: number;
  difficulty: number;
}

export interface ProgressionUpdate {
  experienceAwarded: number;
  currencyAwarded: number;
  levelsGained: number;
  skillPointsAwarded: number;
  unlocked: string[];
  completedQuests: string[];
  previousLevel: number;
  currentLevel: number;
}

export interface StageCompletionProgress {
  stageId: string;
  difficulty: number;
  elapsedSeconds?: number;
  parSeconds?: number;
  /** Enables durable deduplication when supplied by a campaign transition. */
  operationId?: string;
}

export interface ProgressionRewardOperation {
  readonly operationId: string;
  readonly reward: ProgressionReward;
}

export type ProgressionOperationStatus = 'applied' | 'deduplicated';

export type ProgressionOperationFailureCode =
  | 'persistence-failed'
  | 'invalid-operation-id'
  | 'invalid-reward';

export interface ProgressionOperationFailure {
  code: ProgressionOperationFailureCode;
  message: string;
}

export type ProgressionOperationResult =
  | {
      ok: true;
      value: {
        status: ProgressionOperationStatus;
        update: ProgressionUpdate;
      };
    }
  | {
      ok: false;
      error: ProgressionOperationFailure;
    };

export interface ProgressionStorage {
  load(): ProgressionState | undefined;
  save(state: ProgressionState): void;
  clear(): void;
}

export const DEFAULT_PROGRESSION_MODIFIERS: ProgressionModifiers = {
  damageMultiplier: 1,
  defenseMultiplier: 1,
  movementMultiplier: 1,
  cooldownMultiplier: 1,
  haloMultiplier: 1,
  experienceMultiplier: 1,
  criticalChance: 0,
  dodgeWindowBonus: 0,
  maximumHealthBonus: 0,
  maximumMagicBonus: 0,
  lootLuck: 0,
};

export const DEFAULT_PROGRESSION_COUNTERS: ProgressionCounters = {
  totalKills: 0,
  meleeKills: 0,
  rangedKills: 0,
  bossKills: 0,
  stagesCompleted: 0,
  runsCompleted: 0,
  damageDealt: 0,
  damageTaken: 0,
  itemsCollected: 0,
  secretsFound: 0,
};

export function createProgressionState(now = Date.now()): ProgressionState {
  return {
    version: 1,
    level: 1,
    experience: 0,
    lifetimeExperience: 0,
    currency: 0,
    skillPoints: 0,
    chapter: 1,
    unlockedNodes: {},
    unlockedContent: ['chapter-1', 'discipline-combat'],
    mastery: { melee: 0, ranged: 0, boss: 0, survival: 0, exploration: 0 },
    counters: { ...DEFAULT_PROGRESSION_COUNTERS },
    quests: {},
    modifiers: { ...DEFAULT_PROGRESSION_MODIFIERS },
    operationLedger: { version: 1, applied: [] },
    updatedAt: now,
  };
}

export function cloneProgressionState(state: ProgressionState): ProgressionState {
  return {
    ...state,
    unlockedNodes: { ...state.unlockedNodes },
    unlockedContent: [...state.unlockedContent],
    mastery: { ...state.mastery },
    counters: { ...state.counters },
    quests: Object.fromEntries(Object.entries(state.quests).map(([key, quest]) => [key, { ...quest }])),
    modifiers: { ...state.modifiers },
    operationLedger: {
      version: 1,
      applied: [...(state.operationLedger?.applied ?? [])],
    },
  };
}

export function mergeModifier(
  target: ProgressionModifiers,
  modifier: Partial<ProgressionModifiers> | undefined,
): void {
  if (!modifier) return;
  for (const key of Object.keys(modifier) as Array<keyof ProgressionModifiers>) {
    const value = modifier[key];
    if (value !== undefined && Number.isFinite(value)) target[key] += value;
  }
}
