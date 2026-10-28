import type { BiomeId } from '../../procedural';
import type { StageDiagnostic } from './StageDiagnostic';
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
