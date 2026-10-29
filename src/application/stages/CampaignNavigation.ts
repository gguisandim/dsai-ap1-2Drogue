import type {
  CampaignEdgeId,
  CampaignMacroProgressState,
  CampaignExitBinding,
  CampaignExitBindingFailure,
  CampaignGraph,
  CampaignNode,
  CampaignNodeId,
  LoadedStage,
  PhysicalExitFailureCode,
  PhysicalExitId,
  PhysicalExitResolution,
  StageLoadFailure,
  StageLoadRequest,
  StageLoadResult,
  PhysicalExitRequest,
  PhysicalExitResult,
  CampaignExitBindingRequest,
  CampaignExitBindingResult,
  StageResumeState,
} from '../../stages';
import type { SaveStoragePort } from '../../narrative';

export const CAMPAIGN_RUN_SAVE_SCHEMA = 'umbra-trail-run-save' as const;
export const CAMPAIGN_RUN_SAVE_STORAGE_KEY = 'umbra-trail-run-v1';

export interface CampaignRunState {
  readonly version: 1;
  readonly graph: CampaignGraph;
  readonly status: 'active' | 'completed';
  readonly currentNodeId: CampaignNodeId;
  readonly visitedNodeIds: readonly CampaignNodeId[];
  readonly traversedEdgeIds: readonly CampaignEdgeId[];
  readonly revealedEdgeIds: readonly CampaignEdgeId[];
  readonly revisitCounts: Readonly<Record<CampaignNodeId, number>>;
  readonly physicalExits: Readonly<Record<CampaignNodeId, PhysicalExitResolution>>;
  readonly nodeResumes: Readonly<Record<CampaignNodeId, StageResumeState>>;
  readonly confirmedTransitionIds: readonly string[];
  /**
   * Durable reward journal keyed by transitionId. Older saves omit it and are
   * canonicalized to an empty record.
   */
  readonly rewards: Readonly<Record<string, CampaignRewardRecord>>;
  /** Optional additive macro campaign progress. Legacy and pilot saves omit it. */
  readonly macroProgress?: CampaignMacroProgressState;
  /** Stable identity of the graph context materialized in the legacy fields above. */
  readonly activeGraphContextId?: string;
  /** Inactive route contexts. Macro progress is intentionally not copied here. */
  readonly parkedGraphContexts?: Readonly<Record<string, CampaignGraphContextState>>;
}

export interface CampaignGraphContextState {
  readonly graph: CampaignGraph;
  readonly status: 'active' | 'completed';
  readonly currentNodeId: CampaignNodeId;
  readonly visitedNodeIds: readonly CampaignNodeId[];
  readonly traversedEdgeIds: readonly CampaignEdgeId[];
  readonly revealedEdgeIds: readonly CampaignEdgeId[];
  readonly revisitCounts: Readonly<Record<CampaignNodeId, number>>;
  readonly physicalExits: Readonly<Record<CampaignNodeId, PhysicalExitResolution>>;
  readonly nodeResumes: Readonly<Record<CampaignNodeId, StageResumeState>>;
  readonly confirmedTransitionIds: readonly string[];
  readonly rewards: Readonly<Record<string, CampaignRewardRecord>>;
}

export type CampaignRewardStatus = 'pending' | 'claimed' | 'applied';

export interface CampaignRewardRecord {
  readonly transitionId: string;
  /** Campaign node occurrence that produced the stage-completion reward. */
  readonly stageInstanceId: CampaignNodeId;
  readonly stageId: string;
  readonly difficulty: number;
  readonly parSeconds: number;
  readonly status: CampaignRewardStatus;
}

export interface CampaignRewardClaim {
  readonly reward: CampaignRewardRecord;
  readonly persistence: 'saved' | 'verified-after-error' | 'skipped';
}

export interface CampaignRunSaveEnvelope {
  readonly schema: typeof CAMPAIGN_RUN_SAVE_SCHEMA;
  readonly version: 1;
  readonly state: CampaignRunState;
}

export interface CampaignRunSaveIdentity {
  readonly campaignId: string;
  readonly campaignRevision: number;
  readonly runId: string;
  readonly runSeed: string;
  readonly graphId?: string;
}

export interface CampaignRunDiagnostic {
  readonly code: string;
  readonly message: string;
  readonly path: readonly (string | number)[];
  readonly referenceId?: string;
}

export type CampaignRunSaveFailureCode =
  | 'storage-read-failed'
  | 'storage-write-failed'
  | 'storage-conflict'
  | 'storage-state-unknown'
  | 'invalid-json'
  | 'invalid-envelope'
  | 'unsupported-version'
  | 'identity-mismatch'
  | 'invalid-state';

export interface CampaignRunSaveFailure {
  readonly code: CampaignRunSaveFailureCode;
  readonly message: string;
  readonly diagnostics: readonly CampaignRunDiagnostic[];
  readonly recovery: 'previous-preserved' | 'candidate-verified' | 'storage-state-unknown';
}

export interface CampaignRunSaveReceipt {
  readonly envelope: CampaignRunSaveEnvelope;
  readonly persistence: 'written' | 'verified-after-error';
}

export type CampaignRunSaveResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: CampaignRunSaveFailure };

export type CampaignRunLoadOutcome =
  | { readonly status: 'empty' }
  | { readonly status: 'loaded'; readonly envelope: CampaignRunSaveEnvelope };

export interface CampaignRouteAccess {
  /** Edge conditions are evaluated by the narrative/application authority. */
  readonly eligibleEdgeIds: readonly CampaignEdgeId[];
  /** Exit unlocks come from NarrativeStateSnapshot.unlockedExitIds. */
  readonly unlockedStageExitIds: readonly string[];
}

export type CampaignRouteBlockedReason =
  | 'edge-not-revealed'
  | 'traversal-limit-reached'
  | 'edge-condition-unmet'
  | 'stage-exit-locked';

export interface CampaignRouteDestination {
  readonly edgeId: CampaignEdgeId;
  readonly physicalExitId: PhysicalExitId;
  readonly stageExitId: string;
  readonly sourceNodeId: CampaignNodeId;
  readonly sourceStageId: string;
  readonly targetNodeId: CampaignNodeId | 'campaign.complete';
  readonly targetStageId: string | 'campaign.complete';
  readonly tile: { readonly x: number; readonly y: number };
  readonly available: boolean;
  readonly blockedReason?: CampaignRouteBlockedReason;
}

export interface CampaignNavigationSnapshot {
  readonly runId: string;
  readonly runSeed: string;
  readonly graphId: string;
  readonly status: CampaignRunState['status'];
  readonly currentNodeId: CampaignNodeId;
  readonly stageInstanceId: CampaignNodeId;
  readonly currentStageId: string;
  readonly destinations: readonly CampaignRouteDestination[];
}

export interface CampaignNavigationView {
  readonly snapshot: CampaignNavigationSnapshot;
  readonly currentNode: CampaignNode;
  readonly loadedStage: LoadedStage;
  readonly physicalExits: PhysicalExitResolution;
  readonly bindings: readonly CampaignExitBinding[];
}

export interface CampaignTransitionIdentity {
  readonly campaignId: string;
  readonly runId: string;
  readonly runSeed: string;
  readonly stageInstanceId: CampaignNodeId;
  readonly stageId: string;
  readonly stageSeed: string;
}

export interface CampaignPreparedTransition {
  readonly preparationId: string;
  readonly transitionId: string;
  readonly edgeId: CampaignEdgeId;
  readonly physicalExitId: PhysicalExitId;
  readonly stageExitId: string;
  readonly sourceNodeId: CampaignNodeId;
  readonly targetNodeId: CampaignNodeId | 'campaign.complete';
  readonly targetStageId: string | 'campaign.complete';
  readonly identity: CampaignTransitionIdentity;
  readonly destinationStage?: LoadedStage;
  readonly navigation: CampaignNavigationSnapshot;
}

export interface CampaignConfirmedTransition {
  readonly status: 'confirmed';
  readonly transition: CampaignPreparedTransition;
  readonly state: CampaignRunState;
  readonly persistence: 'saved' | 'verified-after-error' | 'skipped';
}

export type CampaignRouterFailureCode =
  | 'invalid-run'
  | 'run-completed'
  | 'current-stage-load-failed'
  | 'physical-resolution-failed'
  | 'binding-failed'
  | 'exit-not-found'
  | 'exit-blocked'
  | 'target-node-invalid'
  | 'target-stage-load-failed'
  | 'target-navigation-failed'
  | 'target-has-no-exits'
  | 'transition-in-progress'
  | 'transition-not-prepared'
  | 'transition-already-confirmed'
  | 'persistence-failed'
  | 'reward-not-found'
  | 'reward-not-claimable'
  | 'reward-already-claimed'
  | 'reward-already-applied';

export interface CampaignRouterFailure {
  readonly code: CampaignRouterFailureCode;
  readonly message: string;
  readonly referenceId?: string;
  readonly stageLoadFailure?: StageLoadFailure;
  readonly physicalExitFailure?: {
    readonly code: PhysicalExitFailureCode;
    readonly diagnostics: readonly CampaignRunDiagnostic[];
  };
  readonly bindingFailure?: CampaignExitBindingFailure;
  readonly persistenceFailure?: CampaignRunSaveFailure;
  readonly targetFailureCode?: CampaignRouterFailureCode;
  readonly recovery: 'unchanged' | 'rolled-back' | 'storage-state-unknown';
}

export type CampaignNavigationResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: CampaignRouterFailure };

export interface CampaignRunSavePort {
  save(
    state: CampaignRunState,
    expectedPrevious?: CampaignRunState,
  ): CampaignRunSaveResult<CampaignRunSaveReceipt>;
}

export interface CampaignRouterDependencies {
  readonly loader: { load(request: StageLoadRequest): StageLoadResult };
  readonly resolver: { resolve(request: PhysicalExitRequest): PhysicalExitResult };
  readonly binder: { bind(request: CampaignExitBindingRequest): CampaignExitBindingResult };
  readonly saves?: CampaignRunSavePort;
}

export interface CampaignRunSaveServiceOptions {
  readonly storage: SaveStoragePort;
  readonly storageKey?: string;
}

