/** Stable capability families understood by the stage authoring boundary. */
export type StageCapabilityCategory =
  | 'tile'
  | 'theme'
  | 'biome'
  | 'enemy'
  | 'item'
  | 'audio'
  | 'lighting'
  | 'effect'
  | 'npc'
  | 'interaction'
  | 'narrative'
  | 'navigation';

export type StageCapabilityRequirementKind = 'required' | 'optional';

/** A content-owned dependency. It does not imply runtime support. */
export interface StageCapabilityRequirement {
  readonly id: string;
  readonly category: StageCapabilityCategory;
  readonly minimumVersion: number;
  readonly requirement: StageCapabilityRequirementKind;
}

export type StageRuntimeCapabilityStatus = 'supported' | 'planned';

/** A runtime-owned statement of implementation status. */
export interface StageRuntimeCapability {
  readonly id: string;
  readonly category: StageCapabilityCategory;
  readonly version: number;
  readonly status: StageRuntimeCapabilityStatus;
}

export interface StageRuntimeCapabilityProfile {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly revision: number;
  readonly capabilities: readonly StageRuntimeCapability[];
}

export interface ChapterDependency {
  readonly chapterId: string;
  readonly minimumRevision: number;
  readonly optional?: boolean;
}
