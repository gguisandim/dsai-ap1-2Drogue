export const WORLD_LAB_SNAPSHOT_SCHEMA = 'umbra-world-lab/v1' as const;

export type WorldLabDiagnosticOrigin =
  | 'campaign-generator'
  | 'stage-loader'
  | 'physical-exit-resolver'
  | 'campaign-exit-binder'
  | 'integration'
  | 'snapshot';

export interface WorldLabDiagnostic {
  readonly code: string;
  readonly severity: 'info' | 'warning' | 'error';
  readonly origin: WorldLabDiagnosticOrigin;
  readonly message: string;
  readonly nodeId?: string;
  readonly edgeId?: string;
  readonly stageId?: string;
  readonly path?: readonly (string | number)[];
}

export interface WorldLabGraphNodeView {
  readonly id: string;
  readonly stageId: string;
  readonly templateId: string;
  readonly actId: string;
  readonly depth: number;
  readonly branchId: string;
  readonly kind: 'intermediate' | 'milestone';
  readonly biomeId: string;
  readonly difficulty: number;
  readonly maximumPhysicalExits: number;
  readonly incomingCount: number;
  readonly outgoingCount: number;
  readonly entry: boolean;
  readonly presentation?: WorldLabThemePresentation;
}

export type WorldLabBindingStatus = 'bound' | 'unavailable' | 'failed';

export interface WorldLabGraphEdgeView {
  readonly id: string;
  readonly sourceNodeId: string;
  readonly targetNodeId: string | 'campaign.complete';
  readonly kind: 'forward' | 'branch' | 'rejoin' | 'return';
  readonly exitSlotId: string;
  readonly physicalExitId: string;
  readonly bindingStatus: WorldLabBindingStatus;
  readonly stageExitId?: string;
  readonly association?: 'manifest-exit' | 'synthetic-slot';
  readonly tile?: { readonly x: number; readonly y: number };
}

export type WorldLabMarkerKind =
  | 'spawn'
  | 'enemy'
  | 'boss'
  | 'item'
  | 'npc'
  | 'anchor'
  | 'section-exit'
  | 'physical-exit'
  | 'decoration';

export interface WorldLabStageMarker {
  readonly id: string;
  readonly kind: WorldLabMarkerKind;
  readonly x: number;
  readonly y: number;
  readonly label: string;
  readonly edgeId?: string;
  readonly physicalExitId?: string;
}

export interface WorldLabStageView {
  readonly nodeId: string;
  readonly stageId: string;
  readonly title: string;
  readonly theme: string;
  readonly width: number;
  readonly height: number;
  readonly tiles: readonly (readonly number[])[];
  readonly markers: readonly WorldLabStageMarker[];
  readonly physicalExitIds: readonly string[];
  readonly visualPresentation?: WorldLabStageVisualPresentation;
}

export interface WorldLabStageVisualPresentation {
  readonly themeId: string;
  readonly tilesetId: string;
  readonly textureKeys: readonly string[];
  readonly decorationIds: readonly string[];
  readonly missingResourceIds: readonly string[];
  readonly diagnostics: readonly string[];
}

export interface WorldLabThemePresentation {
  readonly id: string;
  readonly label: string;
  readonly accent: string;
  readonly surface: string;
}

export interface WorldLabDocument {
  readonly seed: string;
  readonly source: 'fixture-real-headless-pipeline' | 'snapshot';
  readonly graphId: string;
  readonly nodes: readonly WorldLabGraphNodeView[];
  readonly edges: readonly WorldLabGraphEdgeView[];
  readonly stages: readonly WorldLabStageView[];
  readonly diagnostics: readonly WorldLabDiagnostic[];
}

export interface WorldLabSnapshot {
  readonly schema: typeof WORLD_LAB_SNAPSHOT_SCHEMA;
  readonly document: WorldLabDocument;
}

export type WorldLabSnapshotFailureCode =
  | 'invalid-json'
  | 'unsupported-version'
  | 'invalid-structure'
  | 'duplicate-id'
  | 'invalid-reference';

export interface WorldLabSnapshotFailure {
  readonly code: WorldLabSnapshotFailureCode;
  readonly diagnostics: readonly WorldLabDiagnostic[];
}

export type WorldLabSnapshotResult =
  | { readonly ok: true; readonly value: WorldLabSnapshot }
  | { readonly ok: false; readonly error: WorldLabSnapshotFailure };

export interface WorldLabSelection {
  readonly nodeId?: string;
  readonly edgeId?: string;
  readonly tile?: { readonly x: number; readonly y: number };
  readonly diagnosticCode?: string;
}

export interface WorldLabFilters {
  readonly showGrid: boolean;
  readonly showOverlays: boolean;
}

export interface WorldLabSessionState {
  readonly seed: string;
  readonly generation: number;
  readonly document?: WorldLabDocument;
  readonly diagnostics: readonly WorldLabDiagnostic[];
  readonly selection: WorldLabSelection;
  readonly filters: WorldLabFilters;
}

export type WorldLabGenerationResult =
  | { readonly ok: true; readonly value: WorldLabDocument }
  | {
      readonly ok: false;
      readonly error: { readonly diagnostics: readonly WorldLabDiagnostic[] };
    };

export interface WorldLabMacroConnectionView {
  readonly connectionId: string;
  readonly sourceKind: 'hub' | 'route' | 'corrupted' | 'final';
  readonly targetKind: 'hub' | 'route' | 'corrupted' | 'final';
  readonly contentKind: 'stage' | 'planned';
  readonly stageId?: string;
  readonly status: 'bound' | 'blocked' | 'unavailable';
  readonly edgeId?: string;
  readonly physicalExitId?: string;
  readonly blockedReason?: string;
}

export type WorldLabMacroNodeKind = 'hub' | 'region' | 'milestone' | 'final';
export type WorldLabMacroProgressState = 'current' | 'completed' | 'available' | 'blocked';
export type WorldLabMacroContentState = 'loadable' | 'planned' | 'none';

export interface WorldLabMacroNodeView {
  readonly id: string;
  readonly title: string;
  readonly kind: WorldLabMacroNodeKind;
  readonly layer: 0 | 1 | 2 | 3;
  readonly routeId?: string;
  readonly routeTitle?: string;
  readonly order?: number;
  readonly progressState: WorldLabMacroProgressState;
  readonly contentState: WorldLabMacroContentState;
  readonly navigationStatus?: WorldLabMacroConnectionView['status'];
  readonly stageId?: string;
  readonly stageNodeId?: string;
  readonly templateId?: string;
  readonly legacyPlaceholder: boolean;
  readonly mapMessage?: string;
  readonly accessRequirementIds: readonly string[];
  readonly incomingConnectionIds: readonly string[];
  readonly outgoingConnectionIds: readonly string[];
}

export interface WorldLabMacroEdgeView {
  readonly id: string;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly kind: 'progression' | 'return' | 'unlock';
  readonly state: 'completed' | 'available' | 'blocked';
  readonly connectionId?: string;
  readonly navigationStatus?: WorldLabMacroConnectionView['status'];
}

export interface WorldLabMacroProgressView {
  readonly fixture: true;
  readonly currentLocationId: string;
  readonly routes: readonly {
    readonly id: string;
    readonly title: string;
    readonly status: 'not-started' | 'in-progress' | 'completed';
    readonly completedRegionIds: readonly string[];
  }[];
  readonly completedMilestoneIds: readonly string[];
  readonly corruptedStatus: 'locked' | 'available' | 'in-progress' | 'milestone-completed';
  readonly finalStatus: 'locked' | 'available' | 'entered';
}

export interface WorldLabMacroRouteView {
  readonly definitionId: string;
  readonly definitionRevision: number;
  readonly activeGraphContextId: string;
  readonly currentLocationKind: 'hub' | 'route' | 'corrupted' | 'final';
  readonly nodes: readonly WorldLabMacroNodeView[];
  readonly edges: readonly WorldLabMacroEdgeView[];
  readonly progress: WorldLabMacroProgressView;
  readonly connections: readonly WorldLabMacroConnectionView[];
  readonly graph: WorldLabDocument;
}

export type WorldLabMacroRouteResult =
  | { readonly ok: true; readonly value: WorldLabMacroRouteView }
  | { readonly ok: false; readonly error: { readonly diagnostics: readonly WorldLabDiagnostic[] } };

