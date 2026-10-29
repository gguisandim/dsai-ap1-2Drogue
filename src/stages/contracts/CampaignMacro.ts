import type {
  DialogueId,
  MissionId,
  NpcId,
  StageId,
} from './StageManifest';
import type { NarrativeBeatId } from './CampaignGraph';

export type CampaignMacroId = string;
export type CampaignHubId = string;
export type CampaignRouteId = string;
export type CampaignRegionId = string;
export type CampaignMilestoneId = string;
export type CampaignMacroConnectionId = string;

export type CampaignDifficultyLayer = 0 | 1 | 2 | 3;

export interface CampaignMacroDiagnostic {
  readonly code: string;
  readonly message: string;
  readonly path: readonly (string | number)[];
  readonly referenceId?: string;
}

export type CampaignContentReference =
  | {
      readonly kind: 'stage';
      readonly stageId: StageId;
      readonly minimumManifestRevision: number;
      /** Explicitly marks a loadable legacy map used only as temporary campaign content. */
      readonly placeholder?: {
        readonly kind: 'legacy-map';
        readonly reason: string;
      };
    }
  | {
      readonly kind: 'planned';
      readonly contentId: string;
      readonly reason: string;
    };

export interface CampaignNarrativeHooks {
  readonly npcIds?: readonly NpcId[];
  readonly dialogueIds?: readonly DialogueId[];
  readonly missionIds?: readonly MissionId[];
  readonly eventIds?: readonly string[];
  readonly requiredBeatIds?: readonly NarrativeBeatId[];
  readonly providesBeatIds?: readonly NarrativeBeatId[];
}

export interface CampaignHubDefinition {
  readonly id: CampaignHubId;
  readonly title: string;
  readonly difficultyLayer: 0;
  readonly content: CampaignContentReference;
  readonly narrative?: CampaignNarrativeHooks;
}

export interface CampaignRegionDefinition {
  readonly id: CampaignRegionId;
  readonly title: string;
  readonly order: number;
  readonly difficultyLayer: CampaignDifficultyLayer;
  readonly allowsHubReturn: boolean;
  readonly content: CampaignContentReference;
  readonly narrative?: CampaignNarrativeHooks;
}

export interface CampaignRouteDefinition {
  readonly id: CampaignRouteId;
  readonly title: string;
  readonly regions: readonly CampaignRegionDefinition[];
  readonly completionMilestoneId: CampaignMilestoneId;
  readonly narrative?: CampaignNarrativeHooks;
}

export type CampaignMilestoneScope =
  | { readonly kind: 'route'; readonly routeId: CampaignRouteId }
  | { readonly kind: 'corrupted-layer' };

export interface CampaignMilestoneDefinition {
  readonly id: CampaignMilestoneId;
  readonly title: string;
  readonly scope: CampaignMilestoneScope;
  readonly requiredRegionIds: readonly CampaignRegionId[];
  /** Stable external operation; consumers must deduplicate it. */
  readonly completionOperationId: string;
  readonly narrative?: CampaignNarrativeHooks;
}

export type CampaignUnlockCondition =
  | { readonly type: 'always' }
  | { readonly type: 'routes.completed'; readonly routeIds: readonly CampaignRouteId[] }
  | { readonly type: 'milestone.completed'; readonly milestoneId: CampaignMilestoneId };

export interface CampaignCorruptedLayerDefinition {
  readonly id: string;
  readonly title: string;
  readonly difficultyLayer: 2;
  readonly regions: readonly CampaignRegionDefinition[];
  readonly completionMilestoneId: CampaignMilestoneId;
  readonly unlockCondition: CampaignUnlockCondition;
  readonly narrative?: CampaignNarrativeHooks;
}

export interface CampaignFinalDefinition {
  readonly id: string;
  readonly title: string;
  readonly difficultyLayer: 3;
  readonly content: CampaignContentReference;
  readonly unlockCondition: CampaignUnlockCondition;
  readonly narrative?: CampaignNarrativeHooks;
}

export interface CampaignMacroDefinition {
  readonly schemaVersion: 1;
  readonly id: CampaignMacroId;
  readonly revision: number;
  readonly title: string;
  readonly hub: CampaignHubDefinition;
  readonly routes: readonly CampaignRouteDefinition[];
  readonly milestones: readonly CampaignMilestoneDefinition[];
  readonly corruptedLayer: CampaignCorruptedLayerDefinition;
  readonly final: CampaignFinalDefinition;
}

export type CampaignRouteProgressStatus = 'not-started' | 'in-progress' | 'completed';

export interface CampaignRouteProgress {
  readonly routeId: CampaignRouteId;
  readonly status: CampaignRouteProgressStatus;
  readonly completedRegionIds: readonly CampaignRegionId[];
  readonly currentRegionId?: CampaignRegionId;
}

export type CampaignMacroLocation =
  | { readonly kind: 'hub'; readonly hubId: CampaignHubId }
  | {
      readonly kind: 'route';
      readonly routeId: CampaignRouteId;
      readonly regionId: CampaignRegionId;
    }
  | { readonly kind: 'corrupted'; readonly regionId: CampaignRegionId }
  | { readonly kind: 'final'; readonly finalId: string };

export interface CampaignCorruptedProgress {
  readonly status: 'locked' | 'available' | 'in-progress' | 'milestone-completed';
  readonly completedRegionIds: readonly CampaignRegionId[];
  readonly currentRegionId?: CampaignRegionId;
}

export interface CampaignMacroProgressState {
  readonly version: 1;
  readonly definitionId: CampaignMacroId;
  readonly definitionRevision: number;
  readonly currentLocation: CampaignMacroLocation;
  readonly routes: Readonly<Record<CampaignRouteId, CampaignRouteProgress>>;
  readonly completedMilestoneIds: readonly CampaignMilestoneId[];
  readonly corrupted: CampaignCorruptedProgress;
  readonly finalStatus: 'locked' | 'available' | 'entered';
  readonly processedOperationIds: readonly string[];
}
