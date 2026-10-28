import type { BiomeId, PresetId } from '../../procedural';
import type { StageDiagnostic } from './StageDiagnostic';
import type { LoadedStage } from './StageLoad';
import type { StageCondition, StageId } from './StageManifest';

export type CampaignGraphId = string;
export type CampaignNodeId = string;
export type CampaignEdgeId = string;
export type CampaignActId = string;
export type CampaignSlotId = string;
export type RegionTemplateId = string;
export type PhysicalExitId = string;
export type NarrativeBeatId = string;

export type CampaignBranchId = 'main' | 'route-a' | 'route-b';
export type CampaignEdgeKind = 'forward' | 'branch' | 'rejoin' | 'return';
export type CampaignNodeKind = 'intermediate' | 'milestone';

export interface RegionTemplate {
  readonly id: RegionTemplateId;
  readonly revision: number;
  readonly stageId: StageId;
  readonly allowedActIds: readonly CampaignActId[];
  readonly allowedBiomeIds: readonly BiomeId[];
  readonly presetIds?: readonly PresetId[];
  readonly difficulty: {
    readonly minimum: number;
    readonly maximum: number;
  };
  readonly weight: number;
  readonly maximumPhysicalExits: 1 | 2 | 3;
  readonly tags: readonly string[];
  readonly requiredFlags?: readonly StageCondition[];
  readonly requiredEventIds?: readonly string[];
  readonly requiredBeatIds?: readonly NarrativeBeatId[];
  readonly providesBeatIds?: readonly NarrativeBeatId[];
  readonly revisit: 'forbidden' | 'checkpoint' | 'repeatable';
}

export interface CampaignGraphGenerationContext {
  readonly flags: Readonly<Record<string, boolean | number | string>>;
  readonly completedEventIds: readonly string[];
  readonly revealedBeatIds: readonly NarrativeBeatId[];
}

export interface CampaignGraphRequest {
  readonly campaignId: string;
  readonly campaignRevision: number;
  readonly catalogRevision: number;
  readonly runId: string;
  readonly runSeed: string | number;
  readonly templates: readonly RegionTemplate[];
  readonly context: CampaignGraphGenerationContext;
}

export type CampaignGraphFailureCode =
  | 'invalid-request'
  | 'invalid-template'
  | 'duplicate-id'
  | 'insufficient-eligible-regions'
  | 'milestone-unavailable'
  | 'invalid-topology'
  | 'narrative-beat-unreachable'
  | 'exit-capacity-insufficient';

export type CampaignGraphResult =
  | { readonly ok: true; readonly value: CampaignGraph }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: CampaignGraphFailureCode;
        readonly diagnostics: readonly StageDiagnostic[];
      };
    };

export interface CampaignNode {
  readonly id: CampaignNodeId;
  readonly slotId: CampaignSlotId;
  readonly templateId: RegionTemplateId;
  readonly templateRevision: number;
  readonly stageId: StageId;
  readonly stageSeed: string;
  readonly actId: CampaignActId;
  readonly depth: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  readonly branchId: CampaignBranchId;
  readonly kind: CampaignNodeKind;
  readonly biomeId: BiomeId;
  readonly difficulty: number;
  readonly providesBeatIds: readonly NarrativeBeatId[];
  readonly maximumPhysicalExits: 1 | 2 | 3;
}

export interface CampaignEdge {
  readonly id: CampaignEdgeId;
  readonly sourceNodeId: CampaignNodeId;
  readonly targetNodeId: CampaignNodeId | 'campaign.complete';
  readonly exitSlotId: string;
  readonly physicalExitId: PhysicalExitId;
  readonly kind: CampaignEdgeKind;
  readonly condition?: StageCondition;
  readonly traversalLimit: 1 | 2;
}

export interface CampaignAct {
  readonly id: CampaignActId;
  readonly ordinal: 1 | 2 | 3;
  readonly depthRange: readonly [number, number];
  readonly milestoneNodeId: CampaignNodeId;
  readonly requiredBeatIds: readonly NarrativeBeatId[];
}

export interface CampaignGraph {
  readonly schemaVersion: 1;
  readonly generatorVersion: 1;
  readonly id: CampaignGraphId;
  readonly campaignId: string;
  readonly campaignRevision: number;
  readonly catalogRevision: number;
  readonly runId: string;
  readonly runSeed: string;
  readonly generationContextDigest: string;
  readonly entryNodeId: CampaignNodeId;
  readonly acts: readonly CampaignAct[];
  readonly nodes: readonly CampaignNode[];
  readonly edges: readonly CampaignEdge[];
  readonly mandatoryBeatIds: readonly NarrativeBeatId[];
}

export interface PhysicalExit {
  readonly id: PhysicalExitId;
  readonly edgeId: CampaignEdgeId;
  readonly sourceNodeId: CampaignNodeId;
  readonly targetNodeId: CampaignNodeId | 'campaign.complete';
  readonly stageExitId: string;
  readonly tile: { readonly x: number; readonly y: number };
  readonly placementAttempt: 0 | 1 | 2 | 3;
}

export interface PhysicalExitResolution {
  readonly nodeId: CampaignNodeId;
  readonly stageId: StageId;
  readonly levelDigest: string;
  readonly exits: readonly PhysicalExit[];
}

export interface PhysicalExitRequest {
  readonly node: CampaignNode;
  readonly edges: readonly CampaignEdge[];
  readonly stage: LoadedStage;
}

export type PhysicalExitFailureCode =
  | 'invalid-request'
  | 'entry-unreachable'
  | 'insufficient-exit-space'
  | 'exit-tile-blocked'
  | 'exit-tile-unreachable'
  | 'exit-tile-duplicated'
  | 'saved-placement-incompatible';

export type PhysicalExitDiagnosticCode =
  | 'physical-exit.request-invalid'
  | 'physical-exit.capacity-exceeded'
  | 'physical-exit.entry-missing'
  | 'physical-exit.entry-unreachable'
  | 'physical-exit.explicit-anchor-invalid'
  | 'physical-exit.explicit-anchor-unreachable'
  | 'physical-exit.insufficient-space'
  | 'physical-exit.path-invalid'
  | 'physical-exit.tile-duplicated'
  | 'physical-exit.placement-invalid';

export interface PhysicalExitDiagnostic extends StageDiagnostic {
  readonly code: PhysicalExitDiagnosticCode;
}

export type PhysicalExitResult =
  | { readonly ok: true; readonly value: PhysicalExitResolution }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: PhysicalExitFailureCode;
        readonly diagnostics: readonly PhysicalExitDiagnostic[];
      };
    };

export type CampaignGraphDiagnosticCode =
  | 'campaign.graph.header-invalid'
  | 'campaign.graph.act-set-invalid'
  | 'campaign.graph.act-invalid'
  | 'campaign.graph.act-duplicate'
  | 'campaign.graph.node-invalid'
  | 'campaign.graph.node-duplicate'
  | 'campaign.graph.node-act-mismatch'
  | 'campaign.graph.node-depth'
  | 'campaign.graph.node-branch'
  | 'campaign.graph.node-milestone'
  | 'campaign.graph.milestone-invalid'
  | 'campaign.graph.milestone-beat'
  | 'campaign.graph.beat-unreachable'
  | 'campaign.graph.entry-invalid'
  | 'campaign.graph.edge-invalid'
  | 'campaign.graph.edge-duplicate'
  | 'campaign.graph.edge-reference'
  | 'campaign.graph.edge-depth'
  | 'campaign.graph.edge-kind'
  | 'campaign.graph.edge-return'
  | 'campaign.graph.edge-completion'
  | 'campaign.graph.topology-invalid'
  | 'campaign.graph.fork-width'
  | 'campaign.graph.fork-rejoin'
  | 'campaign.graph.instance-collision'
  | 'campaign.graph.cycle'
  | 'campaign.graph.unreachable'
  | 'campaign.graph.softlock';

export interface CampaignGraphDiagnostic extends StageDiagnostic {
  readonly code: CampaignGraphDiagnosticCode;
  readonly nodeId?: CampaignNodeId;
  readonly edgeId?: CampaignEdgeId;
}
