import type {
  CampaignNodeId,
  ChapterId,
  DialogueDefinition,
  DialogueId,
  DialogueNode,
  MissionDefinition,
  MissionId,
  MissionState,
  NarrativeDefinition,
  NpcDefinition,
  StageCommand,
  StageCondition,
  StageEventRule,
  StageId,
  StageReward,
  StageSignal,
} from '../../stages/contracts';

export type NarrativeResult<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export interface NarrativeContent {
  readonly chapterId: ChapterId;
  readonly stageId: StageId;
  readonly definition?: NarrativeDefinition;
  readonly npcs?: readonly NpcDefinition[];
  readonly dialogues?: readonly DialogueDefinition[];
  readonly missions?: readonly MissionDefinition[];
  readonly events?: readonly StageEventRule[];
  readonly exitIds?: readonly string[];
}

export interface NarrativeDiagnostic {
  readonly code: string;
  readonly message: string;
  readonly path: readonly (string | number)[];
  readonly referenceId?: string;
}

export type NarrativeRegistryFailureCode = 'invalid-content' | 'duplicate-id';

export interface NarrativeRegistryFailure {
  readonly code: NarrativeRegistryFailureCode;
  readonly diagnostics: readonly NarrativeDiagnostic[];
}

export interface NarrativeProgressionView {
  readonly level: number;
  readonly unlockedContent: readonly string[];
}

export interface NarrativeIdentityScope {
  readonly runId: string;
  readonly chapterId: ChapterId;
  readonly stageId: StageId;
  readonly manifestRevision: number;
  /**
   * Identity of a campaign node occurrence. Legacy stage-scoped saves omit it;
   * campaign saves require it so two occurrences of the same template do not
   * share events, rules, operations or checkpoints.
   */
  readonly stageInstanceId?: CampaignNodeId;
}

export interface PendingRewardOperation {
  readonly operationId: string;
  readonly reward: Exclude<StageReward, { readonly type: 'stage.flag' }>;
}

export interface NarrativeStateSnapshot {
  readonly version: 1;
  readonly flags: Readonly<Record<string, boolean | number | string>>;
  readonly choices: Readonly<Record<DialogueId, Readonly<Record<string, string>>>>;
  readonly completedDialogueIds: readonly DialogueId[];
  readonly missionStates: Readonly<Record<MissionId, MissionState>>;
  readonly processedEventIds: readonly string[];
  readonly firedRuleIds: readonly string[];
  readonly appliedOperationIds: readonly string[];
  readonly pendingOperations: readonly PendingRewardOperation[];
  readonly unlockedExitIds: readonly string[];
}

export interface DialogueSession {
  readonly dialogueId: DialogueId;
  readonly nodeId: string;
  readonly transitions: number;
}

export interface DialogueChoiceView {
  readonly id: string;
  readonly text: string;
}

export interface DialogueTurn {
  readonly status: 'active';
  readonly session: DialogueSession;
  readonly node: DialogueNode;
  readonly choices: readonly DialogueChoiceView[];
  readonly commands: readonly StageCommand[];
}

export interface DialogueCompletion {
  readonly status: 'completed';
  readonly dialogueId: DialogueId;
  readonly newlyCompleted: boolean;
  readonly commands: readonly StageCommand[];
}

export type DialogueResult = DialogueTurn | DialogueCompletion;

export type NarrativeOperationFailureCode =
  | 'dialogue-not-found'
  | 'dialogue-session-invalid'
  | 'choice-not-found'
  | 'choice-unavailable'
  | 'transition-limit'
  | 'mission-not-found'
  | 'objective-not-found'
  | 'invalid-event'
  | 'invalid-transition'
  | 'invalid-amount'
  | 'operation-not-pending'
  | 'processing-limit';

export interface NarrativeOperationFailure {
  readonly code: NarrativeOperationFailureCode;
  readonly message: string;
  readonly referenceId?: string;
}

export interface QuestTransition {
  readonly missionId: MissionId;
  readonly previousStatus: MissionState['status'];
  readonly status: MissionState['status'];
  readonly changed: boolean;
  readonly completed: boolean;
  readonly commands: readonly StageCommand[];
}

export interface QuestSignalResult {
  readonly transitions: readonly QuestTransition[];
  readonly commands: readonly StageCommand[];
  readonly completedMissionIds: readonly MissionId[];
}

export interface NarrativeDomainEvent {
  readonly id: string;
  readonly signal: StageSignal;
}

export interface NarrativeEventProcessingResult {
  readonly status: 'processed' | 'duplicate';
  readonly eventId: string;
  readonly commands: readonly StageCommand[];
  readonly generatedSignals: readonly StageSignal[];
  readonly snapshot: NarrativeStateSnapshot;
}

export interface NarrativeProcessorOptions {
  readonly maximumEvents?: number;
  readonly maximumCommands?: number;
  readonly identity?: NarrativeIdentityScope;
}

export interface DialogueEngineOptions {
  readonly maximumTransitions?: number;
}

export type {
  ChapterId,
  DialogueDefinition,
  DialogueId,
  MissionDefinition,
  MissionId,
  MissionState,
  NarrativeDefinition,
  NpcDefinition,
  StageCommand,
  StageCondition,
  StageEventRule,
  StageId,
  StageReward,
  StageSignal,
};
