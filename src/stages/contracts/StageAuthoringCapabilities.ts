import type {
  StageCapabilityCategory,
  StageRuntimeCapabilityStatus,
} from './StageCapabilities';

/** One runtime capability as published to stage authors. */
export interface StageAuthoringCapabilityEntry {
  readonly id: string;
  readonly category: StageCapabilityCategory;
  readonly version: number;
  readonly status: StageRuntimeCapabilityStatus;
}

export interface StageAuthoringTileEntry {
  readonly id: string;
  readonly name: string;
  readonly value: number;
  readonly status: StageRuntimeCapabilityStatus;
}

export interface StageAuthoringEnemyEntry {
  readonly id: string;
  readonly capabilityId: string;
  readonly status: StageRuntimeCapabilityStatus;
}

export interface StageAuthoringItemEntry {
  /** Logical `LevelDefinition.items[].type` value. */
  readonly type: string;
  readonly capabilityId: string;
  readonly status: StageRuntimeCapabilityStatus;
}

export interface StageAuthoringNamedCapabilityEntry {
  readonly id: string;
  readonly capabilityId: string;
  readonly status: StageRuntimeCapabilityStatus;
}

export interface StageAuthoringProceduralPreset {
  readonly id: string;
  readonly biome: string;
  readonly algorithm: string;
}

export interface StageAuthoringFlagVocabulary {
  readonly declaredIn: 'narrative.flags';
  readonly valueTypes: readonly ('boolean' | 'number' | 'string')[];
}

export interface StageAuthoringNarrativeVocabulary {
  readonly conditionTypes: readonly string[];
  readonly missionStatuses: readonly string[];
  readonly missionScopes: readonly string[];
  readonly missionStartModes: readonly string[];
  readonly npcRoles: readonly string[];
  readonly dialogueBuiltinSpeakers: readonly string[];
  readonly signalTypes: readonly string[];
  readonly signalFilterFields: readonly string[];
  readonly commandTypes: readonly string[];
  readonly rewardTypes: readonly string[];
  readonly flags: StageAuthoringFlagVocabulary;
}

export interface StageAuthoringEncounterVocabulary {
  readonly startModes: readonly string[];
  readonly completionModes: readonly string[];
  readonly scalingModes: readonly string[];
  readonly sourceKinds: readonly string[];
  readonly maximumEnemiesPerWave: number;
  readonly enemyLevelRange: Readonly<{ minimum: number; maximum: number }>;
}

export interface StageAuthoringTransitionVocabulary {
  readonly layoutKinds: readonly string[];
  readonly anchorKinds: readonly string[];
  readonly exitTargetKinds: readonly string[];
}

export interface StageAuthoringVisualVocabulary {
  readonly tileSize: number;
  readonly layers: readonly string[];
  readonly perspectives: readonly string[];
  readonly scaleClasses: readonly string[];
  readonly effectKinds: readonly string[];
  readonly soundWaveforms: readonly string[];
  readonly audioEvents: readonly string[];
  readonly presentationVariants: Readonly<{
    readonly supported: true;
    readonly field: 'manifest.presentationVariants';
  }>;
}

export interface StageAuthoringCampaignCatalogVocabulary {
  readonly availabilities: readonly string[];
  readonly participations: readonly string[];
  readonly roles: readonly string[];
  readonly revisits: readonly string[];
  readonly maximumPhysicalExits: readonly number[];
  readonly minimumDifficulty: number;
}

export interface StageAuthoringCapabilities {
  readonly tiles: readonly StageAuthoringTileEntry[];
  readonly enemies: readonly StageAuthoringEnemyEntry[];
  readonly items: readonly StageAuthoringItemEntry[];
  readonly biomes: readonly StageAuthoringNamedCapabilityEntry[];
  readonly themes: readonly StageAuthoringNamedCapabilityEntry[];
  readonly proceduralPresets: readonly StageAuthoringProceduralPreset[];
  readonly narrative: StageAuthoringNarrativeVocabulary;
  readonly encounters: StageAuthoringEncounterVocabulary;
  readonly transitions: StageAuthoringTransitionVocabulary;
  readonly visual: StageAuthoringVisualVocabulary;
  readonly campaignCatalog: StageAuthoringCampaignCatalogVocabulary;
}

export interface StageAuthoringDynamicResource {
  readonly id: string;
  readonly kind: string;
  readonly note: string;
}

export interface StageAuthoringRule {
  readonly id: string;
  readonly severity: 'error' | 'warning';
  readonly message: string;
}

export interface StageAuthoringLimitation {
  readonly id: string;
  readonly severity: 'info' | 'warning';
  readonly message: string;
  readonly relatedCapabilityIds: readonly string[];
}

export interface StageAuthoringDiscovery {
  readonly automatic: readonly string[];
  readonly dynamic: readonly string[];
  readonly unavailable: readonly string[];
}

/**
 * Read-only projection of authoring knowledge. It never enables content that
 * the runtime validators would reject.
 */
export interface StageAuthoringCapabilitiesReport {
  readonly schemaVersion: 1;
  readonly kind: 'umbra.stage-authoring.capabilities';
  readonly revision: 1;
  readonly runtimeProfile: Readonly<{
    readonly id: string;
    readonly revision: number;
    readonly schemaVersion: 1;
    readonly capabilities: readonly StageAuthoringCapabilityEntry[];
    readonly counts: Readonly<{ total: number; supported: number; planned: number }>;
  }>;
  readonly authoring: StageAuthoringCapabilities;
  readonly dynamicResources: readonly StageAuthoringDynamicResource[];
  readonly rules: readonly StageAuthoringRule[];
  readonly limitations: readonly StageAuthoringLimitation[];
  readonly discovery: StageAuthoringDiscovery;
}
