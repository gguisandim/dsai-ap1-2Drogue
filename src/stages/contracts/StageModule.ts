import type { LevelDefinition } from '../../data/LevelData';
import type {
  DialogueId,
  MissionId,
  NpcId,
  StageAnchor,
  StageCondition,
  StageFlag,
  StageId,
  StageManifest,
} from './StageManifest';

export interface NarrativeDefinition {
  readonly entryDialogueId?: DialogueId;
  readonly flags?: Readonly<Record<StageFlag, boolean | number | string>>;
}

export interface NpcDefinition {
  readonly id: NpcId;
  readonly displayName: string;
  readonly role: 'story' | 'quest' | 'merchant' | 'ambient';
  readonly presentationId: string;
  readonly spawn: StageAnchor;
  readonly interactionDialogueId?: DialogueId;
  readonly condition?: StageCondition;
}

export interface DialogueDefinition {
  readonly id: DialogueId;
  readonly startNodeId: string;
  readonly nodes: readonly DialogueNode[];
}

export interface DialogueNode {
  readonly id: string;
  readonly speakerId: NpcId | 'player' | 'narrator';
  readonly text: string;
  readonly choices?: readonly DialogueChoice[];
  readonly nextNodeId?: string;
  readonly onEnter?: readonly StageCommand[];
}

export interface DialogueChoice {
  readonly id: string;
  readonly text: string;
  readonly condition?: StageCondition;
  readonly nextNodeId: string;
  readonly commands?: readonly StageCommand[];
}

export interface MissionDefinition {
  readonly id: MissionId;
  readonly title: string;
  readonly description: string;
  readonly scope: 'stage' | 'chapter' | 'campaign';
  readonly start: 'stage-enter' | 'dialogue' | 'event';
  readonly objectives: readonly MissionObjective[];
  readonly rewards?: readonly StageReward[];
}

export interface StageSignalFilter {
  readonly field: 'stageId' | 'enemyId' | 'archetype' | 'itemId' | 'itemType' |
    'encounterId' | 'npcId' | 'dialogueId' | 'missionId' | 'exitId';
  readonly equals: string;
}

export interface MissionObjective {
  readonly id: string;
  readonly description: string;
  readonly signal: StageSignal['type'];
  readonly target: number;
  readonly filter?: StageSignalFilter;
  readonly optional?: boolean;
}

export interface MissionState {
  readonly status: 'locked' | 'available' | 'active' | 'completed' | 'failed';
  readonly objectives: Readonly<Record<string, number>>;
}

export type StageReward =
  | { readonly type: 'progression.unlock'; readonly contentId: string }
  | { readonly type: 'progression.currency'; readonly amount: number }
  | { readonly type: 'stage.flag'; readonly flag: StageFlag; readonly value: boolean | number | string };

export type StageSignal =
  | { readonly type: 'stage.entered'; readonly stageId: StageId }
  | { readonly type: 'enemy.defeated'; readonly enemyId: string; readonly archetype: string }
  | { readonly type: 'item.collected'; readonly itemId: string; readonly itemType: string }
  | { readonly type: 'encounter.completed'; readonly encounterId: string }
  | { readonly type: 'npc.interacted'; readonly npcId: NpcId }
  | { readonly type: 'dialogue.completed'; readonly dialogueId: DialogueId }
  | { readonly type: 'mission.completed'; readonly missionId: MissionId }
  | { readonly type: 'stage.exit.requested'; readonly exitId: string };

export interface StageEventRule {
  readonly id: string;
  readonly once: boolean;
  readonly when: StageSignal['type'];
  readonly filter?: StageSignalFilter;
  readonly condition?: StageCondition;
  readonly commands: readonly StageCommand[];
}

export type StageCommand =
  | { readonly type: 'dialogue.start'; readonly dialogueId: DialogueId }
  | { readonly type: 'mission.start'; readonly missionId: MissionId }
  | {
      readonly type: 'mission.advance';
      readonly missionId: MissionId;
      readonly objectiveId: string;
      readonly amount: number;
    }
  | { readonly type: 'flag.set'; readonly flag: StageFlag; readonly value: boolean | number | string }
  | { readonly type: 'exit.unlock'; readonly exitId: string }
  | { readonly type: 'stage.complete'; readonly exitId: string }
  | { readonly type: 'reward.grant'; readonly reward: StageReward; readonly operationId: string };

export interface StageModule {
  readonly manifest: StageManifest;
  readonly authoredLevel?: LevelDefinition;
  readonly narrative?: NarrativeDefinition;
  readonly npcs?: readonly NpcDefinition[];
  readonly dialogues?: readonly DialogueDefinition[];
  readonly missions?: readonly MissionDefinition[];
  readonly events?: readonly StageEventRule[];
}
