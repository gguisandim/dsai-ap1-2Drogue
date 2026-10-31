import type { StageEnemyArchetype } from './StagePresentation';

export type StageEncounterStart = 'stage-ready';
export type StageEncounterCompletion = 'all-waves-defeated';
export type StageEncounterScaling = 'stage-difficulty-floor';

export interface StageEncounterEnemyPlacement {
  readonly type: StageEnemyArchetype;
  readonly x: number;
  readonly y: number;
  readonly level: number;
  readonly patrol?: readonly Readonly<{ x: number; y: number }>[];
  readonly dropTable?: readonly Readonly<{ itemId: string; chance: number }>[];
}

export interface StageEncounterWaveDefinition {
  readonly id: string;
  /** Delay after the previous wave is cleared. The first wave must use zero. */
  readonly delayBeforeMs: number;
  readonly enemies: readonly StageEncounterEnemyPlacement[];
}

export type StageEncounterSource =
  | {
      readonly kind: 'authored-waves';
      readonly waves: readonly StageEncounterWaveDefinition[];
    }
  | {
      /** Deterministically chunks the enemies produced by the resolved map. */
      readonly kind: 'resolved-level-enemies';
      readonly maximumEnemiesPerWave: number;
      readonly delayBeforeWaveMs: number;
      /** Explicit compatibility mapping for generator-owned logical ids. */
      readonly archetypeMapping?: Readonly<Record<string, StageEnemyArchetype>>;
    };

export interface StageEncounterDefinition {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly start: StageEncounterStart;
  readonly completion: StageEncounterCompletion;
  readonly scaling: StageEncounterScaling;
  readonly source: StageEncounterSource;
}

export interface ResolvedStageEncounterWave {
  readonly id: string;
  readonly delayBeforeMs: number;
  readonly enemies: readonly StageEncounterEnemyPlacement[];
}

export interface ResolvedStageEncounter {
  readonly id: string;
  readonly start: StageEncounterStart;
  readonly completion: StageEncounterCompletion;
  readonly scaling: StageEncounterScaling;
  readonly source: 'declarative' | 'legacy-fallback';
  readonly waves: readonly ResolvedStageEncounterWave[];
}
