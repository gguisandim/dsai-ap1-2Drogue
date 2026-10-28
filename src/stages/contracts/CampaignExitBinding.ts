import type {
  CampaignEdge,
  CampaignEdgeId,
  CampaignGraph,
  CampaignNodeId,
  PhysicalExit,
  PhysicalExitDiagnostic,
  PhysicalExitFailureCode,
  PhysicalExitId,
  PhysicalExitResult,
} from './CampaignGraph';
import type { StageDiagnostic } from './StageDiagnostic';
import type { LoadedStage } from './StageLoad';
import type { StageExitDefinition, StageId } from './StageManifest';

export type CampaignExitAssociation = 'manifest-exit' | 'synthetic-slot';

export interface CampaignExitBindingRequest {
  readonly graph: CampaignGraph;
  readonly sourceNodeId: CampaignNodeId;
  readonly stage: LoadedStage;
  readonly physicalExitResult: PhysicalExitResult;
}

export interface CampaignExitBinding {
  readonly edgeId: CampaignEdgeId;
  readonly sourceNodeId: CampaignNodeId;
  readonly targetNodeId: CampaignNodeId | 'campaign.complete';
  readonly targetStageId: StageId | 'campaign.complete';
  readonly exitSlotId: string;
  readonly stageExitId: string;
  readonly physicalExitId: PhysicalExitId;
  readonly association: CampaignExitAssociation;
  readonly edge: CampaignEdge;
  readonly manifestExit?: StageExitDefinition;
  readonly physicalExit: PhysicalExit;
}

export interface CampaignExitBindingResolution {
  readonly sourceNodeId: CampaignNodeId;
  readonly stageId: StageId;
  readonly levelDigest: string;
  readonly bindings: readonly CampaignExitBinding[];
}

export type CampaignExitBindingFailureCode =
  | 'invalid-request'
  | 'physical-resolution-failed'
  | 'graph-reference-invalid'
  | 'physical-exit-mismatch'
  | 'manifest-exit-mismatch'
  | 'destination-mismatch';

export type CampaignExitBindingDiagnosticCode =
  | 'campaign-exit.request-invalid'
  | 'campaign-exit.physical-resolution-failed'
  | 'campaign-exit.source-node-invalid'
  | 'campaign-exit.source-stage-mismatch'
  | 'campaign-exit.edge-duplicate'
  | 'campaign-exit.edge-reference-invalid'
  | 'campaign-exit.destination-invalid'
  | 'campaign-exit.physical-exit-missing'
  | 'campaign-exit.physical-exit-unexpected'
  | 'campaign-exit.physical-exit-duplicate'
  | 'campaign-exit.physical-exit-incompatible'
  | 'campaign-exit.physical-tile-duplicate'
  | 'campaign-exit.manifest-exit-duplicate'
  | 'campaign-exit.manifest-exit-reused'
  | 'campaign-exit.manifest-exit-missing'
  | 'campaign-exit.manifest-anchor-mismatch'
  | 'campaign-exit.destination-mismatch'
  | 'campaign-exit.binding-cardinality';

export interface CampaignExitBindingDiagnostic extends StageDiagnostic {
  readonly code: CampaignExitBindingDiagnosticCode;
}

export interface CampaignExitBindingFailure {
  readonly code: CampaignExitBindingFailureCode;
  readonly diagnostics: readonly CampaignExitBindingDiagnostic[];
  readonly physicalExitFailure?: {
    readonly code: PhysicalExitFailureCode;
    readonly diagnostics: readonly PhysicalExitDiagnostic[];
  };
}

export type CampaignExitBindingResult =
  | { readonly ok: true; readonly value: CampaignExitBindingResolution }
  | { readonly ok: false; readonly error: CampaignExitBindingFailure };
