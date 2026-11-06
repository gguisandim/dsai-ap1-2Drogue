import type { PlaytestPlanView } from '../../stages';

export const WORLD_LAB_SNAPSHOT_SCHEMA = 'umbra-world-lab/v1' as const;

export type WorldLabDiagnosticOrigin =
  | 'campaign-generator'
  | 'campaign-composer'
  | 'stage-loader'
  | 'physical-exit-resolver'
  | 'campaign-exit-binder'
  | 'stage-catalog'
  | 'integration'
  | 'playtest-static'
  | 'playtest-runtime'
  | 'snapshot';

export type WorldLabValidationStatus = 'PASS' | 'FAIL' | 'UNKNOWN';
export type WorldLabEvidenceSource = 'static-analysis' | 'phaser-runtime';

export interface WorldLabValidationPoint {
  readonly x: number;
  readonly y: number;
}

export interface WorldLabValidationCheck {
  readonly id: string;
  readonly code: string;
  readonly status: WorldLabValidationStatus;
  readonly required: boolean;
  readonly message: string;
  readonly suggestion?: string;
  readonly referenceId?: string;
  readonly location?: WorldLabValidationPoint;
  readonly regionId?: string;
  readonly evidence: WorldLabEvidenceSource;
}

export interface WorldLabValidationRegion {
  readonly id: string;
  readonly title: string;
  readonly role: string;
  readonly anchor?: WorldLabValidationPoint;
  readonly status: WorldLabValidationStatus;
  readonly required: boolean;
  readonly code: string;
  readonly message: string;
}

export interface WorldLabValidationSummary {
  readonly checks: number;
  readonly passed: number;
  readonly failed: number;
  readonly unknown: number;
  readonly requiredFailed: number;
  readonly requiredUnknown: number;
}

export interface WorldLabValidationRoutes {
  readonly main: readonly WorldLabValidationPoint[];
  readonly branch?: readonly WorldLabValidationPoint[];
}

export interface WorldLabStageValidation {
  readonly stageId: string;
  readonly seed: number | null;
  readonly result: WorldLabValidationStatus;
  readonly evidence: WorldLabEvidenceSource;
  readonly checks: readonly WorldLabValidationCheck[];
  readonly regions: readonly WorldLabValidationRegion[];
  readonly summary: WorldLabValidationSummary;
  readonly plan: {
    readonly source: 'file' | 'generated' | 'none';
    readonly planId: string | null;
  };
  readonly routes?: WorldLabValidationRoutes;
}

export interface WorldLabRuntimeValidation {
  readonly schemaVersion: 1;
  readonly kind: 'umbra.stage-homologation.report';
  readonly stageId: string;
  readonly chapterId?: string;
  readonly title?: string;
  readonly variantId?: string;
  readonly scenario?: string;
  readonly seed?: number | null;
  readonly manifestRevision?: number;
  readonly result: WorldLabValidationStatus;
  readonly checks: readonly WorldLabValidationCheck[];
  readonly observations?: readonly unknown[];
  readonly evidence?: {
    readonly screenshots?: readonly string[];
    readonly browser?: string;
    readonly durationMs?: number;
    readonly generatedAt?: string;
  };
  readonly generatedAt?: string;
}

export interface WorldLabCampaignTransitionView {
  readonly role: string;
  readonly originStageId: string | null;
  readonly physicalExitId: string | null;
  readonly stageExitId: string | null;
  readonly edgeId: string | null;
  readonly targetNodeId: string | null;
  readonly destinationStageId: string | null;
  readonly expectedDestination: string | null;
  readonly available: boolean;
  readonly loadedDestinationStageId: string | null;
  readonly loaded: boolean;
  readonly reason: string | null;
  readonly stateBefore: Readonly<Record<string, unknown>> | null;
  readonly stateAfter: Readonly<Record<string, unknown>> | null;
  readonly events: readonly string[];
}

export interface WorldLabCampaignRuntimeValidation {
  readonly schemaVersion: 1;
  readonly kind: 'umbra.campaign-homologation.report';
  readonly campaignId: string | null;
  readonly runId: string | null;
  readonly runSeed: string | number | null;
  readonly originStageId: string;
  readonly destinationStageId: string;
  readonly variantId?: string;
  readonly manifestRevision?: number;
  readonly destinationManifestRevision?: number;
  readonly result: WorldLabValidationStatus;
  readonly checks: readonly WorldLabValidationCheck[];
  readonly transitions: readonly WorldLabCampaignTransitionView[];
  readonly stages?: readonly Readonly<Record<string, unknown>>[];
  readonly persistence?: Readonly<Record<string, unknown>> | null;
  readonly observations?: readonly unknown[];
  readonly evidence?: {
    readonly screenshots?: readonly string[];
    readonly browser?: string;
    readonly durationMs?: number;
    readonly generatedAt?: string;
  };
  readonly generatedAt?: string;
}

export type WorldLabRuntimeReport = WorldLabRuntimeValidation | WorldLabCampaignRuntimeValidation;

export interface WorldLabLocalReports {
  readonly reports: readonly WorldLabRuntimeReport[];
  readonly generatedAt?: string;
  readonly error?: string;
}

export type WorldLabReportLoader = () => Promise<WorldLabLocalReports>;

export interface WorldLabDiagnostic {
  readonly code: string;
  readonly severity: 'info' | 'warning' | 'error';
  readonly origin: WorldLabDiagnosticOrigin;
  readonly message: string;
  readonly nodeId?: string;
  readonly edgeId?: string;
  readonly stageId?: string;
  readonly path?: readonly (string | number)[];
  /** Optional playtest metadata; ignored by older snapshot consumers. */
  readonly status?: WorldLabValidationStatus;
  readonly evidence?: WorldLabEvidenceSource;
  readonly location?: WorldLabValidationPoint;
  readonly regionId?: string;
  readonly checkId?: string;
  readonly suggestion?: string;
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
  readonly stageInstanceId?: string;
  readonly visitCount?: number;
  readonly current?: boolean;
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
  readonly traversalLimit: 1 | 2;
  readonly traversalCount?: number;
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
  readonly manifestRevision?: number;
  readonly themeRevision?: number;
  readonly visualPresentation?: WorldLabStageVisualPresentation;
  /** Static playtest projection (9.12) for this stage. */
  readonly validation?: WorldLabStageValidation;
}

export interface WorldLabStageVisualPresentation {
  readonly themeId: string;
  readonly tilesetId: string;
  readonly variantId?: string;
  readonly textureKeys: readonly string[];
  readonly decorationIds: readonly string[];
  readonly missingResourceIds: readonly string[];
  readonly diagnostics: readonly string[];
  readonly tiles?: readonly WorldLabTilePresentation[];
  readonly spritesheets?: readonly WorldLabSpritesheetPresentation[];
  readonly assetOrigins?: readonly WorldLabAssetOrigin[];
  readonly decorations?: readonly WorldLabDecorationPresentation[];
  readonly decorationOverrides?: Readonly<Record<string, string>>;
  readonly npcSprites?: readonly WorldLabSpritePresentation[];
  readonly enemySprites?: readonly WorldLabSpritePresentation[];
  readonly effects?: readonly WorldLabEffectPresentation[];
  readonly artAssets?: readonly WorldLabArtAssetPresentation[];
  readonly audio?: {
    readonly profileId: string;
    readonly musicSoundId?: string;
    readonly ambientSoundId?: string;
    readonly eventSoundIds: Readonly<Record<string, string>>;
  };
  readonly environment?: {
    readonly id: string;
    readonly ambientColor: number;
    readonly lightIntensity: number;
    readonly fog?: { readonly color: number; readonly opacity: number; readonly depth: number };
  };
}

export interface WorldLabArtAssetPresentation {
  readonly id: string;
  readonly category: 'tile' | 'decoration' | 'npc' | 'enemy';
  readonly textureKey: string;
  readonly frame?: number;
  readonly sourceDimensions?: { readonly width: number; readonly height: number };
  readonly frameDimensions?: { readonly width: number; readonly height: number };
  readonly visibleDimensions?: { readonly width: number; readonly height: number };
  readonly renderedDimensions?: { readonly width: number; readonly height: number };
  readonly scale: number;
  readonly anchor?: { readonly x: number; readonly y: number };
  readonly scaleClass?: 'tile' | 'character' | 'prop' | 'oversized';
  readonly layer: string;
  readonly originId?: string;
  readonly perspective?: string;
  readonly collision?: {
    readonly width: number;
    readonly height: number;
    readonly offsetX: number;
    readonly offsetY: number;
  };
  readonly compatibility: 'compatible' | 'review' | 'incomplete';
  readonly warnings: readonly string[];
}

export interface WorldLabEffectPresentation {
  readonly id: string;
  readonly kind: string;
  readonly color: number;
  readonly alpha: number;
  readonly depth: number;
  readonly count?: number;
}

export interface WorldLabSpritePresentation {
  readonly logicalId: string;
  readonly spriteId: string;
  readonly textureKey: string;
  readonly frame?: number;
  readonly animations: readonly string[];
}

export interface WorldLabTileVariantPresentation {
  readonly textureId: string;
  readonly textureKey: string;
  readonly frame?: number;
  readonly tint?: number;
  readonly alpha?: number;
}

export interface WorldLabTilePresentation extends WorldLabTileVariantPresentation {
  readonly logicalId: string;
  readonly variants: readonly WorldLabTileVariantPresentation[];
}

export interface WorldLabSpritesheetPresentation {
  readonly textureKey: string;
  readonly frameWidth?: number;
  readonly frameHeight?: number;
  readonly frameCount?: number;
}

export interface WorldLabDecorationPresentation {
  readonly id: string;
  readonly textureKey: string;
  readonly frame?: number;
  readonly layer: string;
  readonly depth: number;
  readonly scale: number;
}

export interface WorldLabAssetOrigin {
  readonly assetId: string;
  readonly textureKey: string;
  readonly pack: string;
  readonly author: string;
  readonly license: string;
  readonly sourceUrl: string;
  readonly modifications: readonly string[];
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
  readonly topologyPolicyId?: string;
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
  readonly validationCheckId?: string;
  readonly regionId?: string;
}

export interface WorldLabFilters {
  readonly showGrid: boolean;
  readonly showOverlays: boolean;
  readonly showEntities: boolean;
  readonly showDecorations: boolean;
  readonly showExits: boolean;
}

export interface WorldLabSessionState {
  readonly seed: string;
  readonly generation: number;
  readonly document?: WorldLabDocument;
  readonly diagnostics: readonly WorldLabDiagnostic[];
  readonly selection: WorldLabSelection;
  readonly filters: WorldLabFilters;
  /** Runtime homologation reports imported by the developer, keyed by stageId/variant. */
  readonly runtimeValidations?: Readonly<Record<string, WorldLabRuntimeValidation>>;
  /** Campaign runtime reports, keyed by origin/destination/run. */
  readonly campaignValidations?: Readonly<Record<string, WorldLabCampaignRuntimeValidation>>;
}

export interface WorldLabPlanSource {
  readonly plan: PlaytestPlanView;
  readonly source: 'file' | 'generated';
}

/** Optional adapters that provide authoring plans and runtime evidence to the World Lab. */
export interface WorldLabValidationSource {
  planForStage?(stageId: string): WorldLabPlanSource | undefined;
  routesForStage?(stageId: string): {
    readonly main: readonly WorldLabValidationPoint[];
    readonly branch?: readonly WorldLabValidationPoint[];
  } | undefined;
  seedForStage?(stageId: string): number | null;
  runtimeForStage?(stageId: string): WorldLabRuntimeValidation | undefined;
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
  readonly catalog: WorldLabStageCatalogView;
  readonly composition: WorldLabCampaignCompositionView;
  readonly graph: WorldLabDocument;
}

export interface WorldLabCampaignCompositionAssignmentView {
  readonly slotId: string;
  readonly actId: string;
  readonly depth: number;
  readonly kind: 'intermediate' | 'milestone';
  readonly stageId: string;
  readonly stageInstanceId: string;
  readonly chapterId: string;
  readonly manifestRevision: number;
  readonly chapterRevision: number;
  readonly regionId: string;
  readonly biomeId: string;
  readonly maximumPhysicalExits: number;
}

export interface WorldLabCampaignCompositionView {
  readonly status: 'composed' | 'failed';
  readonly seed: string;
  readonly policyId: string;
  readonly requestedStageCount: number;
  readonly selectedStageCount: number;
  readonly availableStageIds: readonly string[];
  readonly requiredMilestoneSlotIds: readonly string[];
  readonly restrictionLabels: readonly string[];
  readonly compositionId?: string;
  readonly graphId?: string;
  readonly assignments: readonly WorldLabCampaignCompositionAssignmentView[];
  readonly connections: readonly {
    readonly edgeId: string;
    readonly sourceNodeId: string;
    readonly targetNodeId: string;
  }[];
  readonly diagnostics: readonly WorldLabDiagnostic[];
}

export interface WorldLabStageCatalogEntryView {
  readonly stageId: string;
  readonly chapterId: string;
  readonly manifestRevision: number;
  readonly chapterRevision: number;
  readonly title: string;
  readonly role: 'standard' | 'milestone' | 'special';
  readonly regionIds: readonly string[];
  readonly biomeIds: readonly string[];
  readonly loadability: string;
  readonly eligibility: string;
  readonly capabilityIds: readonly string[];
  readonly dependencyChapterIds: readonly string[];
  readonly diagnosticCodes: readonly string[];
}

export interface WorldLabStageCatalogView {
  readonly entries: readonly WorldLabStageCatalogEntryView[];
  readonly eligibleStageIds: readonly string[];
  readonly incompatibleStageIds: readonly string[];
  readonly diagnostics: readonly WorldLabDiagnostic[];
}

export type WorldLabMacroRouteResult =
  | { readonly ok: true; readonly value: WorldLabMacroRouteView }
  | { readonly ok: false; readonly error: { readonly diagnostics: readonly WorldLabDiagnostic[] } };

