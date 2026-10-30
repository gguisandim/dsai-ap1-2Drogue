import type { LevelDefinition } from '../../data/LevelData';
import type { Result } from '../../simulation';
import type { StageDiagnostic } from './StageDiagnostic';
import type { MissionId, StageId, StageManifest } from './StageManifest';
import type {
  DialogueDefinition,
  MissionDefinition,
  MissionState,
  NarrativeDefinition,
  NpcDefinition,
  StageEventRule,
} from './StageModule';
import type { ResolvedStagePresentation } from './StagePresentation';

export interface StageResumeState {
  readonly stageId: StageId;
  readonly manifestRevision: number;
  /** Optional on v1 legacy resumes; compared when present. */
  readonly chapterRevision?: number;
  /** Optional only for resume snapshots created before the Stage 2 run binding. */
  readonly runId?: string;
  /** Optional only for resume snapshots created before the Stage 2 run binding. */
  readonly runSeed?: string | number;
  readonly flags: Readonly<Record<string, boolean | number | string>>;
  readonly missionStates: Readonly<Record<MissionId, MissionState>>;
  readonly collectedEntityIds: readonly string[];
  readonly appliedOperationIds: readonly string[];
}

export interface StageLoadRequest {
  readonly stageId: StageId;
  readonly runId: string;
  readonly runSeed: string | number;
  readonly resume?: StageResumeState;
}

export interface LoadedStage {
  readonly manifest: StageManifest;
  readonly level: LevelDefinition;
  readonly narrative: NarrativeDefinition;
  readonly npcs: readonly NpcDefinition[];
  readonly dialogues: readonly DialogueDefinition[];
  readonly missions: readonly MissionDefinition[];
  readonly events: readonly StageEventRule[];
  /** Always resolved by StageLoader; optional only for pre-9.5B.1 compatible fixtures/adapters. */
  readonly presentation?: ResolvedStagePresentation;
  readonly diagnostics: readonly StageDiagnostic[];
}

export type StageLoadFailureCode =
  | 'invalid-request'
  | 'stage-not-found'
  | 'invalid-manifest'
  | 'invalid-reference'
  | 'generation-failed'
  | 'invalid-level'
  | 'incompatible-save'
  | 'load-failed';

export interface StageLoadFailure {
  readonly code: StageLoadFailureCode;
  readonly stageId: StageId;
  readonly diagnostics: readonly StageDiagnostic[];
}

export type StageLoadResult = Result<LoadedStage, StageLoadFailure>;
