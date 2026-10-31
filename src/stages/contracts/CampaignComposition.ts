import type {
  CampaignActId,
  CampaignGraph,
  CampaignGraphGenerationContext,
  CampaignNodeKind,
} from './CampaignGraph';
import type {
  StageCampaignRole,
  StageCatalogEntry,
  StageCatalogExitReference,
} from './StageCatalog';

export const CAMPAIGN_COMPOSITION_SNAPSHOT_SCHEMA = 'umbra-campaign-composition' as const;
export const FIXED_NINE_COMPOSITION_POLICY_ID = 'umbra.fixed-nine.v1' as const;

export type CampaignCompositionPolicyId = typeof FIXED_NINE_COMPOSITION_POLICY_ID;
export type CampaignCompositionRepetitionPolicy = 'forbid' | 'allow-repeatable';

/**
 * Narrow read-only view the composer needs. `StageCatalogService` satisfies it
 * structurally; tests may supply an equivalent immutable projection.
 */
export interface CampaignCompositionCatalog {
  list(): readonly StageCatalogEntry[];
}

export interface CampaignCompositionActRule {
  readonly actId: CampaignActId;
  readonly stageCount: number;
  readonly difficulty: { readonly minimum: number; readonly maximum: number };
  readonly allowedRegionIds?: readonly string[];
  readonly allowedBiomeIds?: readonly string[];
}

export interface CampaignCompositionMilestoneRequirement {
  readonly slotId: string;
  readonly stageId?: string;
  readonly requiredBeatIds: readonly string[];
}

/** Explicit manual selection: one stable definition per canonical slot. */
export interface CampaignCompositionSlotSelection {
  readonly slotId: string;
  readonly stageId: string;
}

export interface CampaignCompositionRequest {
  readonly policyId: CampaignCompositionPolicyId;
  readonly campaignId: string;
  readonly campaignRevision: number;
  readonly runId: string;
  readonly seed: string | number;
  readonly desiredStageCount: number;
  /** Optional allow-list over the definitions exposed by StageCatalogService. */
  readonly candidateStageIds?: readonly string[];
  readonly acts: readonly CampaignCompositionActRule[];
  readonly mandatoryMilestones: readonly CampaignCompositionMilestoneRequirement[];
  readonly requiredStageIds?: readonly string[];
  readonly entryStageId?: string;
  readonly allowedRegionIds?: readonly string[];
  readonly allowedBiomeIds?: readonly string[];
  readonly minimumPhysicalExitsBySlot?: Readonly<Record<string, 1 | 2 | 3>>;
  readonly repetitionPolicy: CampaignCompositionRepetitionPolicy;
  /** Optional explicit selection; when present the same search validates it. */
  readonly manualAssignments?: readonly CampaignCompositionSlotSelection[];
  readonly context: CampaignGraphGenerationContext;
}

export interface CampaignCompositionAssignment {
  readonly slotId: string;
  readonly actId: CampaignActId;
  readonly depth: number;
  readonly kind: CampaignNodeKind;
  readonly stageId: string;
  readonly chapterId: string;
  readonly manifestRevision: number;
  readonly chapterRevision: number;
  readonly stageInstanceId: string;
  readonly role: StageCampaignRole;
  readonly regionId: string;
  readonly biomeId: string;
  readonly difficulty: number;
  readonly maximumPhysicalExits: 1 | 2 | 3;
  readonly revisit: 'forbidden' | 'checkpoint' | 'repeatable';
  readonly requiredEventIds: readonly string[];
  readonly requiredBeatIds: readonly string[];
  readonly providesBeatIds: readonly string[];
  /** Declared `exitId -> targetStageId` associations, sorted by exit id. */
  readonly declaredExits: readonly StageCatalogExitReference[];
}

export interface CampaignCompositionSnapshot {
  readonly schema: typeof CAMPAIGN_COMPOSITION_SNAPSHOT_SCHEMA;
  readonly version: 1;
  readonly policyId: CampaignCompositionPolicyId;
  readonly policyVersion: 1;
  readonly compositionId: string;
  readonly catalogDigest: string;
  readonly campaignId: string;
  readonly campaignRevision: number;
  readonly runId: string;
  readonly seed: string;
  readonly desiredStageCount: number;
  readonly repetitionPolicy: CampaignCompositionRepetitionPolicy;
  readonly acts: readonly CampaignCompositionActRule[];
  readonly mandatoryMilestones: readonly CampaignCompositionMilestoneRequirement[];
  readonly requiredStageIds: readonly string[];
  readonly allowedRegionIds: readonly string[];
  readonly allowedBiomeIds: readonly string[];
  readonly minimumPhysicalExitsBySlot: Readonly<Record<string, 1 | 2 | 3>>;
  readonly context: CampaignGraphGenerationContext;
  readonly assignments: readonly CampaignCompositionAssignment[];
}

export type CampaignCompositionDiagnosticCode =
  | 'composition.request.invalid'
  | 'composition.quantity.invalid'
  | 'composition.policy.unsupported'
  | 'composition.topology.incompatible'
  | 'composition.candidate.reference-missing'
  | 'composition.candidate.ineligible'
  | 'composition.candidates.insufficient'
  | 'composition.milestone.unavailable'
  | 'composition.act.incompatible'
  | 'composition.difficulty.incompatible'
  | 'composition.narrative-dependency.impossible'
  | 'composition.exit-capacity.insufficient'
  | 'composition.destination.incompatible'
  | 'composition.manual-selection.invalid'
  | 'composition.assignment.impossible'
  | 'composition.snapshot.invalid'
  | 'composition.stage.missing'
  | 'composition.revision.incompatible'
  | 'composition.graph.generation-failed'
  | 'composition.graph.incompatible'
  | 'composition.restore.failed'
  | 'composition.candidate.not-selected';

export interface CampaignCompositionDiagnostic {
  readonly code: CampaignCompositionDiagnosticCode;
  readonly severity: 'info' | 'warning' | 'error';
  readonly message: string;
  readonly path: readonly (string | number)[];
  readonly stageId?: string;
  readonly slotId?: string;
  readonly referenceId?: string;
}

export type CampaignCompositionFailureCode =
  | 'invalid-request'
  | 'invalid-quantity'
  | 'unsupported-policy'
  | 'topology-incompatible'
  | 'stage-reference-missing'
  | 'candidates-insufficient'
  | 'milestone-unavailable'
  | 'act-incompatible'
  | 'difficulty-incompatible'
  | 'narrative-dependency-impossible'
  | 'exit-capacity-insufficient'
  | 'destination-incompatible'
  | 'manual-selection-invalid'
  | 'composition-impossible'
  | 'persisted-composition-invalid'
  | 'stage-revision-incompatible'
  | 'graph-generation-failed'
  | 'restore-failed';

export interface CampaignCompositionValue {
  readonly snapshot: CampaignCompositionSnapshot;
  readonly graph: CampaignGraph;
  readonly diagnostics: readonly CampaignCompositionDiagnostic[];
}

export type CampaignCompositionResult =
  | { readonly ok: true; readonly value: CampaignCompositionValue }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: CampaignCompositionFailureCode;
        readonly diagnostics: readonly CampaignCompositionDiagnostic[];
      };
    };
