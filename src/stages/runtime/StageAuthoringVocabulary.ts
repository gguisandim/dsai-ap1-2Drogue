import type {
  MissionDefinition,
  NpcDefinition,
  StageAnchor,
  StageAudioEvent,
  StageCapabilityCategory,
  StageCommand,
  StageCondition,
  StageEffectKind,
  StageEncounterCompletion,
  StageEncounterScaling,
  StageEncounterSource,
  StageEncounterStart,
  StageEnemyArchetype,
  StageLayoutSource,
  StageLogicalTileId,
  StageMissionStatus,
  StageReward,
  StageSignal,
  StageSignalFilter,
  StageSoundWaveform,
  StageVisualLayer,
  StageVisualPerspective,
  StageVisualScaleClass,
} from '../contracts';

/**
 * Enumerated authoring vocabulary shared by validators, the capabilities
 * command and tests. TypeScript unions remain the compile-time contract; these
 * arrays are the only runtime enumeration of them.
 */
export const STAGE_LOGICAL_TILE_IDS: readonly StageLogicalTileId[] = Object.freeze([
  'floor', 'wall', 'pillar', 'water', 'lava', 'exit', 'locked-door', 'chest', 'spawn', 'boss',
]);

export const STAGE_ENEMY_ARCHETYPES: readonly StageEnemyArchetype[] = Object.freeze([
  'affinity', 'applaud', 'fortitudo', 'ranged', 'boss', 'miniboss',
]);

export const STAGE_EFFECT_KINDS: readonly StageEffectKind[] = Object.freeze([
  'fireflies', 'mist', 'pulse', 'spirits', 'local-light', 'water-shimmer', 'foliage-sway',
]);

export const STAGE_AUDIO_EVENTS: readonly StageAudioEvent[] = Object.freeze([
  'stage.entered', 'npc.interacted', 'enemy.defeated',
]);

export const STAGE_SOUND_WAVEFORMS: readonly StageSoundWaveform[] = Object.freeze([
  'sine', 'triangle', 'square', 'sawtooth',
]);

export const STAGE_VISUAL_LAYERS: readonly StageVisualLayer[] = Object.freeze([
  'background', 'terrain', 'foreground',
]);

export const STAGE_VISUAL_PERSPECTIVES: readonly StageVisualPerspective[] = Object.freeze([
  'top-down', 'neutral', 'side-view', 'isometric',
]);

export const STAGE_VISUAL_SCALE_CLASSES: readonly StageVisualScaleClass[] = Object.freeze([
  'tile', 'character', 'prop', 'oversized',
]);

export const STAGE_LAYOUT_KINDS: readonly StageLayoutSource['kind'][] = Object.freeze([
  'authored', 'legacy', 'procedural',
]);

export const STAGE_ANCHOR_KINDS: readonly StageAnchor['kind'][] = Object.freeze([
  'tile', 'player-spawn', 'map-exit',
]);

export const STAGE_CONDITION_TYPES: readonly StageCondition['type'][] = Object.freeze([
  'flag.equals', 'mission.status', 'progression.unlocked', 'all', 'any', 'not',
]);

export const STAGE_MISSION_STATUSES: readonly StageMissionStatus[] = Object.freeze([
  'locked', 'available', 'active', 'completed', 'failed',
]);

export const STAGE_MISSION_SCOPES: readonly MissionDefinition['scope'][] = Object.freeze([
  'stage', 'chapter', 'campaign',
]);

export const STAGE_MISSION_START_MODES: readonly MissionDefinition['start'][] = Object.freeze([
  'stage-enter', 'dialogue', 'event',
]);

export const STAGE_NPC_ROLES: readonly NpcDefinition['role'][] = Object.freeze([
  'story', 'quest', 'merchant', 'ambient',
]);

/** Built-in speaker ids. Every other speaker must be a chapter-owned NPC id. */
export const STAGE_DIALOGUE_BUILTIN_SPEAKERS = Object.freeze(['player', 'narrator'] as const);

export const STAGE_SIGNAL_TYPES: readonly StageSignal['type'][] = Object.freeze([
  'stage.entered', 'enemy.defeated', 'item.collected', 'encounter.completed',
  'npc.interacted', 'dialogue.completed', 'mission.completed', 'stage.exit.requested',
]);

export const STAGE_SIGNAL_FILTER_FIELDS: readonly StageSignalFilter['field'][] = Object.freeze([
  'stageId', 'enemyId', 'archetype', 'itemId', 'itemType', 'encounterId',
  'npcId', 'dialogueId', 'missionId', 'exitId',
]);

export const STAGE_COMMAND_TYPES: readonly StageCommand['type'][] = Object.freeze([
  'dialogue.start', 'mission.start', 'mission.advance', 'flag.set',
  'exit.unlock', 'stage.complete', 'reward.grant',
]);

export const STAGE_REWARD_TYPES: readonly StageReward['type'][] = Object.freeze([
  'progression.unlock', 'progression.currency', 'stage.flag',
]);

export const STAGE_ENCOUNTER_START_MODES: readonly StageEncounterStart[] = Object.freeze([
  'stage-ready',
]);

export const STAGE_ENCOUNTER_COMPLETION_MODES: readonly StageEncounterCompletion[] = Object.freeze([
  'all-waves-defeated',
]);

export const STAGE_ENCOUNTER_SCALING_MODES: readonly StageEncounterScaling[] = Object.freeze([
  'stage-difficulty-floor',
]);

export const STAGE_ENCOUNTER_SOURCE_KINDS: readonly StageEncounterSource['kind'][] = Object.freeze([
  'authored-waves', 'resolved-level-enemies',
]);

export const STAGE_CAPABILITY_CATEGORIES: readonly StageCapabilityCategory[] = Object.freeze([
  'tile', 'theme', 'biome', 'enemy', 'encounter', 'item', 'audio', 'lighting',
  'effect', 'npc', 'interaction', 'narrative', 'navigation',
]);

export const STAGE_CATALOG_AVAILABILITIES = Object.freeze(['available', 'planned'] as const);
export const STAGE_CATALOG_PARTICIPATIONS = Object.freeze([
  'candidate', 'individual-only', 'narrative-milestone',
] as const);
export const STAGE_CATALOG_ROLES = Object.freeze(['standard', 'milestone', 'special'] as const);
export const STAGE_CATALOG_REVISITS = Object.freeze([
  'forbidden', 'checkpoint', 'repeatable',
] as const);
export const STAGE_CATALOG_MAXIMUM_PHYSICAL_EXITS = Object.freeze([1, 2, 3] as const);

export const STAGE_TILE_SIZE = 32;
export const STAGE_ENCOUNTER_MAX_ENEMIES_PER_WAVE = 64;
export const STAGE_ENCOUNTER_ENEMY_LEVEL_RANGE = Object.freeze({ minimum: 1, maximum: 10 });
export const STAGE_CATALOG_MINIMUM_DIFFICULTY = 1;
