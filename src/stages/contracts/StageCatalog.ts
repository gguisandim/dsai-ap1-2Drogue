import type { ChapterDependency, StageCapabilityRequirement } from './StageCapabilities';

export type StageCampaignAvailability = 'available' | 'planned';
export type StageCampaignParticipation = 'candidate' | 'individual-only' | 'narrative-milestone';
export type StageCampaignRole = 'standard' | 'milestone' | 'special';

export interface StageCampaignDifficultyRange {
  readonly minimum: number;
  readonly maximum: number;
}

/**
 * Optional composition metadata owned by a stage definition. It never
 * identifies a campaign instance, graph node or visit.
 */
export interface StageCampaignCatalogMetadata {
  readonly availability: StageCampaignAvailability;
  readonly participation: StageCampaignParticipation;
  readonly role: StageCampaignRole;
  readonly regionIds?: readonly string[];
  readonly biomeIds?: readonly string[];
  readonly difficulty?: StageCampaignDifficultyRange;
  readonly allowedActIds?: readonly string[];
  readonly maximumPhysicalExits?: 1 | 2 | 3;
  readonly revisit?: 'forbidden' | 'checkpoint' | 'repeatable';
  readonly requiredEventIds?: readonly string[];
  readonly requiredBeatIds?: readonly string[];
  readonly providesBeatIds?: readonly string[];
}

export type StageCatalogLoadability =
  | 'loadable'
  | 'planned'
  | 'capability-incompatible'
  | 'dependency-blocked';

export type StageCatalogEligibility =
  | 'campaign-eligible'
  | 'individual-only'
  | 'narrative-reserved'
  | 'planned'
  | 'capability-incompatible'
  | 'dependency-blocked';

export interface StageCatalogDiagnostic {
  readonly code: string;
  readonly severity: 'warning' | 'error';
  readonly message: string;
  readonly path: readonly (string | number)[];
  readonly stageId?: string;
  readonly chapterId?: string;
  readonly referenceId?: string;
}

export interface StageCatalogExitReference {
  readonly id: string;
  readonly targetStageId: string | 'campaign.complete';
}

export interface StageCatalogEntry {
  readonly stageId: string;
  readonly chapterId: string;
  readonly manifestRevision: number;
  readonly chapterRevision: number;
  readonly title: string;
  readonly summary: string;
  readonly layoutKind: 'authored' | 'legacy' | 'procedural';
  readonly availability: StageCampaignAvailability;
  readonly participation: StageCampaignParticipation;
  readonly role: StageCampaignRole;
  readonly regionIds: readonly string[];
  readonly biomeIds: readonly string[];
  readonly difficulty?: StageCampaignDifficultyRange;
  readonly allowedActIds: readonly string[];
  readonly maximumPhysicalExits: 1 | 2 | 3;
  readonly revisit: 'forbidden' | 'checkpoint' | 'repeatable';
  readonly requiredEventIds: readonly string[];
  readonly requiredBeatIds: readonly string[];
  readonly providesBeatIds: readonly string[];
  readonly capabilityRequirements: readonly StageCapabilityRequirement[];
  readonly chapterDependencies: readonly ChapterDependency[];
  readonly entryDialogueId?: string;
  readonly completionMissionId?: string;
  readonly exitIds: readonly string[];
  readonly targetStageIds: readonly string[];
  readonly exits: readonly StageCatalogExitReference[];
  readonly loadability: StageCatalogLoadability;
  readonly eligibility: StageCatalogEligibility;
  readonly exclusionDiagnostics: readonly StageCatalogDiagnostic[];
}

/** Canonical input for a future composer. No selection policy is encoded. */
export interface StageCatalogCandidate {
  readonly stageId: string;
  readonly chapterId: string;
  readonly manifestRevision: number;
  readonly chapterRevision: number;
  readonly role: StageCampaignRole;
  readonly regionIds: readonly string[];
  readonly biomeIds: readonly string[];
  readonly difficulty?: StageCampaignDifficultyRange;
  readonly allowedActIds: readonly string[];
  readonly maximumPhysicalExits: 1 | 2 | 3;
  readonly revisit: 'forbidden' | 'checkpoint' | 'repeatable';
  readonly requiredEventIds: readonly string[];
  readonly requiredBeatIds: readonly string[];
  readonly providesBeatIds: readonly string[];
  readonly exits: readonly StageCatalogExitReference[];
}

export interface StageCatalogQuery {
  readonly chapterId?: string;
  readonly regionId?: string;
  readonly biomeId?: string;
  readonly role?: StageCampaignRole;
  /** Matches ranges containing this difficulty. */
  readonly difficulty?: number;
  readonly loadability?: StageCatalogLoadability;
  readonly eligibility?: StageCatalogEligibility;
}
