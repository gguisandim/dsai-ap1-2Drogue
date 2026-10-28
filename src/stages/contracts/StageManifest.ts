import type { GeneratorOptions, PresetId } from '../../procedural';

export type ChapterId = string;
export type StageId = string;
export type NpcId = string;
export type DialogueId = string;
export type MissionId = string;
export type StageFlag = string;

export type StageAnchor =
  | { readonly kind: 'tile'; readonly x: number; readonly y: number }
  | { readonly kind: 'player-spawn'; readonly offsetX?: number; readonly offsetY?: number }
  | { readonly kind: 'map-exit' };

export type StageCondition =
  | { readonly type: 'flag.equals'; readonly flag: StageFlag; readonly value: boolean | number | string }
  | {
      readonly type: 'mission.status';
      readonly missionId: MissionId;
      readonly status: 'locked' | 'active' | 'completed' | 'failed';
    }
  | { readonly type: 'progression.unlocked'; readonly contentId: string }
  | { readonly type: 'all'; readonly conditions: readonly StageCondition[] }
  | { readonly type: 'any'; readonly conditions: readonly StageCondition[] }
  | { readonly type: 'not'; readonly condition: StageCondition };

export interface ChapterManifest {
  readonly schemaVersion: 1;
  readonly id: ChapterId;
  readonly revision: number;
  readonly title: string;
  readonly stageIds: readonly StageId[];
  readonly entryStageId: StageId;
  readonly tags?: readonly string[];
}

export type StageLayoutSource =
  | { readonly kind: 'authored' }
  | { readonly kind: 'legacy'; readonly levelId: string }
  | {
      readonly kind: 'procedural';
      readonly preset: PresetId;
      readonly seed: 'run';
      readonly overrides?: Readonly<Partial<Omit<GeneratorOptions, 'seed'>>>;
    };

export interface StageExitDefinition {
  readonly id: string;
  readonly anchor: StageAnchor;
  readonly targetStageId: StageId | 'campaign.complete';
  readonly condition?: StageCondition;
}

export interface StageManifest {
  readonly schemaVersion: 1;
  readonly id: StageId;
  readonly revision: number;
  readonly chapterId: ChapterId;
  readonly order: number;
  readonly title: string;
  readonly summary: string;
  readonly layout: StageLayoutSource;
  readonly exits: readonly StageExitDefinition[];
  readonly entryDialogueId?: DialogueId;
  readonly completionMissionId?: MissionId;
  readonly tags?: readonly string[];
}
