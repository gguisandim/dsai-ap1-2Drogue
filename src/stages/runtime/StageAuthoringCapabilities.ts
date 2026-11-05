import { GENERATION_PRESETS } from '../../procedural';
import type {
  StageAuthoringCapabilities,
  StageAuthoringCapabilityEntry,
  StageAuthoringCapabilitiesReport,
  StageAuthoringDynamicResource,
  StageAuthoringLimitation,
  StageAuthoringNamedCapabilityEntry,
  StageAuthoringRule,
  StageAuthoringTileEntry,
  StageCapabilityCategory,
  StageRuntimeCapability,
  StageRuntimeCapabilityProfile,
  StageRuntimeCapabilityStatus,
} from '../contracts';
import {
  DEFAULT_STAGE_RUNTIME_CAPABILITIES,
  enemyCapabilityId,
  itemCapabilityId,
  tileCapabilityId,
} from './StageRuntimeCapabilities';
import {
  STAGE_ANCHOR_KINDS,
  STAGE_AUDIO_EVENTS,
  STAGE_CATALOG_AVAILABILITIES,
  STAGE_CATALOG_MAXIMUM_PHYSICAL_EXITS,
  STAGE_CATALOG_MINIMUM_DIFFICULTY,
  STAGE_CATALOG_PARTICIPATIONS,
  STAGE_CATALOG_REVISITS,
  STAGE_CATALOG_ROLES,
  STAGE_COMMAND_TYPES,
  STAGE_CONDITION_TYPES,
  STAGE_DIALOGUE_BUILTIN_SPEAKERS,
  STAGE_EFFECT_KINDS,
  STAGE_ENCOUNTER_COMPLETION_MODES,
  STAGE_ENCOUNTER_ENEMY_LEVEL_RANGE,
  STAGE_ENCOUNTER_MAX_ENEMIES_PER_WAVE,
  STAGE_ENCOUNTER_SCALING_MODES,
  STAGE_ENCOUNTER_SOURCE_KINDS,
  STAGE_ENCOUNTER_START_MODES,
  STAGE_ENEMY_ARCHETYPES,
  STAGE_LAYOUT_KINDS,
  STAGE_LOGICAL_TILE_IDS,
  STAGE_MISSION_SCOPES,
  STAGE_MISSION_START_MODES,
  STAGE_MISSION_STATUSES,
  STAGE_NPC_ROLES,
  STAGE_REWARD_TYPES,
  STAGE_SIGNAL_FILTER_FIELDS,
  STAGE_SIGNAL_TYPES,
  STAGE_SOUND_WAVEFORMS,
  STAGE_TILE_SIZE,
  STAGE_VISUAL_LAYERS,
  STAGE_VISUAL_PERSPECTIVES,
  STAGE_VISUAL_SCALE_CLASSES,
} from './StageAuthoringVocabulary';

export const STAGE_AUTHORING_CAPABILITIES_KIND = 'umbra.stage-authoring.capabilities' as const;
export const STAGE_AUTHORING_CAPABILITIES_SCHEMA_VERSION = 1 as const;
export const STAGE_AUTHORING_CAPABILITIES_REVISION = 1 as const;

function compareIds(left: { readonly id: string }, right: { readonly id: string }): number {
  return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
}

function capabilityMap(
  profile: StageRuntimeCapabilityProfile,
): ReadonlyMap<string, StageRuntimeCapability> {
  return new Map(profile.capabilities.map(capability => [capability.id, capability]));
}

function requireCapability(
  capabilities: ReadonlyMap<string, StageRuntimeCapability>,
  id: string,
): StageRuntimeCapability {
  const capability = capabilities.get(id);
  if (!capability) {
    throw new Error(
      `Authoring vocabulary references capability ${id}, which is absent from the runtime profile.`,
    );
  }
  return capability;
}

function status(
  capabilities: ReadonlyMap<string, StageRuntimeCapability>,
  id: string,
): StageRuntimeCapabilityStatus {
  return requireCapability(capabilities, id).status;
}

function byCategory(
  profile: StageRuntimeCapabilityProfile,
  category: StageCapabilityCategory,
): readonly StageRuntimeCapability[] {
  return Object.freeze(profile.capabilities
    .filter(capability => capability.category === category)
    .sort((left, right) => (left.id < right.id ? -1 : left.id > right.id ? 1 : 0)));
}

function namedEntries(
  capabilities: ReadonlyMap<string, StageRuntimeCapability>,
  values: readonly StageRuntimeCapability[],
  id: (capability: StageRuntimeCapability) => string,
): readonly StageAuthoringNamedCapabilityEntry[] {
  return Object.freeze(values
    .map(capability => Object.freeze({
      id: id(capability),
      capabilityId: capability.id,
      status: capabilities.get(capability.id)!.status,
    }))
    .sort(compareIds));
}

function authoringVocabulary(
  profile: StageRuntimeCapabilityProfile,
  capabilities: ReadonlyMap<string, StageRuntimeCapability>,
): StageAuthoringCapabilities {
  const tiles: readonly StageAuthoringTileEntry[] = Object.freeze(
    STAGE_LOGICAL_TILE_IDS.map((name, value) => {
      const id = tileCapabilityId(value);
      if (!id) throw new Error(`Logical tile ${name} has no capability id.`);
      return Object.freeze({
        id,
        name,
        value,
        status: status(capabilities, id),
      });
    }),
  );

  const enemies = Object.freeze(STAGE_ENEMY_ARCHETYPES
    .map(archetype => {
      const capabilityId = enemyCapabilityId(archetype);
      return Object.freeze({
        id: archetype,
        capabilityId,
        status: status(capabilities, capabilityId),
      });
    })
    .sort(compareIds));

  const items = Object.freeze(byCategory(profile, 'item')
    .map(capability => Object.freeze({
      type: capability.id.slice('item.'.length).replace(/-/g, '_'),
      capabilityId: capability.id,
      status: capabilities.get(capability.id)!.status,
    }))
    .filter(item => itemCapabilityId(item.type) === item.capabilityId)
    .sort((left, right) => (left.capabilityId < right.capabilityId ? -1 : 1)));

  const biomes = namedEntries(
    capabilities,
    byCategory(profile, 'biome'),
    capability => capability.id.slice('biome.'.length),
  );

  const themes = namedEntries(
    capabilities,
    byCategory(profile, 'theme'),
    capability => capability.id,
  );

  return Object.freeze({
    tiles,
    enemies,
    items,
    biomes,
    themes,
    proceduralPresets: Object.freeze(GENERATION_PRESETS
      .map(preset => Object.freeze({
        id: preset.id,
        biome: preset.biome,
        algorithm: preset.algorithm,
      }))
      .sort(compareIds)),
    narrative: Object.freeze({
      conditionTypes: STAGE_CONDITION_TYPES,
      missionStatuses: STAGE_MISSION_STATUSES,
      missionScopes: STAGE_MISSION_SCOPES,
      missionStartModes: STAGE_MISSION_START_MODES,
      npcRoles: STAGE_NPC_ROLES,
      dialogueBuiltinSpeakers: STAGE_DIALOGUE_BUILTIN_SPEAKERS,
      signalTypes: STAGE_SIGNAL_TYPES,
      signalFilterFields: STAGE_SIGNAL_FILTER_FIELDS,
      commandTypes: STAGE_COMMAND_TYPES,
      rewardTypes: STAGE_REWARD_TYPES,
      flags: Object.freeze({
        declaredIn: 'narrative.flags' as const,
        valueTypes: Object.freeze(['boolean', 'number', 'string'] as const),
      }),
    }),
    encounters: Object.freeze({
      startModes: STAGE_ENCOUNTER_START_MODES,
      completionModes: STAGE_ENCOUNTER_COMPLETION_MODES,
      scalingModes: STAGE_ENCOUNTER_SCALING_MODES,
      sourceKinds: STAGE_ENCOUNTER_SOURCE_KINDS,
      maximumEnemiesPerWave: STAGE_ENCOUNTER_MAX_ENEMIES_PER_WAVE,
      enemyLevelRange: STAGE_ENCOUNTER_ENEMY_LEVEL_RANGE,
    }),
    transitions: Object.freeze({
      layoutKinds: STAGE_LAYOUT_KINDS,
      anchorKinds: STAGE_ANCHOR_KINDS,
      exitTargetKinds: Object.freeze(['stage', 'campaign.complete'] as const),
    }),
    visual: Object.freeze({
      tileSize: STAGE_TILE_SIZE,
      layers: STAGE_VISUAL_LAYERS,
      perspectives: STAGE_VISUAL_PERSPECTIVES,
      scaleClasses: STAGE_VISUAL_SCALE_CLASSES,
      effectKinds: STAGE_EFFECT_KINDS,
      soundWaveforms: STAGE_SOUND_WAVEFORMS,
      audioEvents: STAGE_AUDIO_EVENTS,
      presentationVariants: Object.freeze({
        supported: true as const,
        field: 'manifest.presentationVariants' as const,
      }),
    }),
    campaignCatalog: Object.freeze({
      availabilities: STAGE_CATALOG_AVAILABILITIES,
      participations: STAGE_CATALOG_PARTICIPATIONS,
      roles: STAGE_CATALOG_ROLES,
      revisits: STAGE_CATALOG_REVISITS,
      maximumPhysicalExits: STAGE_CATALOG_MAXIMUM_PHYSICAL_EXITS,
      minimumDifficulty: STAGE_CATALOG_MINIMUM_DIFFICULTY,
    }),
  });
}

const DYNAMIC_RESOURCES: readonly StageAuthoringDynamicResource[] = Object.freeze([
  Object.freeze({
    id: 'visualResources.textures',
    kind: 'texture',
    note: 'Declared by each chapter; textureKey must exist in the Phaser asset pipeline.',
  }),
  Object.freeze({
    id: 'visualResources.tilesets',
    kind: 'tileset',
    note: 'Declared by each chapter; must cover the ten logical tiles.',
  }),
  Object.freeze({
    id: 'visualResources.themes',
    kind: 'theme',
    note: 'Declared by each chapter and referenced by manifest.presentation.themeId.',
  }),
  Object.freeze({
    id: 'visualResources.decorations',
    kind: 'decoration',
    note: 'Declared by each chapter and allowed by the selected visual theme.',
  }),
  Object.freeze({
    id: 'visualResources.sprites',
    kind: 'sprite',
    note: 'Declared by each chapter and mapped from NPC presentation ids and enemy archetypes.',
  }),
  Object.freeze({
    id: 'visualResources.sounds',
    kind: 'sound',
    note: 'Local synth resources declared by each chapter.',
  }),
  Object.freeze({
    id: 'visualResources.audioProfiles',
    kind: 'audio-profile',
    note: 'Declared by each chapter and referenced by manifest.presentation.audioProfileId.',
  }),
  Object.freeze({
    id: 'visualResources.environments',
    kind: 'environment',
    note: 'Declared by each chapter and referenced by manifest.presentation.environmentId.',
  }),
]);

const RULES: readonly StageAuthoringRule[] = Object.freeze([
  Object.freeze({
    id: 'capability.unknown',
    severity: 'error' as const,
    message: 'A capability id absent from the runtime profile is an error; there is no fallback.',
  }),
  Object.freeze({
    id: 'capability.unavailable.required',
    severity: 'error' as const,
    message: 'A required capability that is planned or below minimumVersion blocks loading.',
  }),
  Object.freeze({
    id: 'capability.unavailable.optional',
    severity: 'warning' as const,
    message: 'An optional capability that is planned or below minimumVersion produces a warning.',
  }),
  Object.freeze({
    id: 'capability.category.mismatch',
    severity: 'error' as const,
    message: 'A capability declared under a category different from the runtime profile is an error.',
  }),
  Object.freeze({
    id: 'capability.id.duplicate',
    severity: 'error' as const,
    message: 'Declaring the same capability id twice in one manifest is an error.',
  }),
]);

function limitations(profile: StageRuntimeCapabilityProfile): readonly StageAuthoringLimitation[] {
  const planned = profile.capabilities
    .filter(capability => capability.status === 'planned')
    .map(capability => capability.id)
    .sort();
  const values: StageAuthoringLimitation[] = [
    Object.freeze({
      id: 'runtime.planned-capabilities',
      severity: 'warning' as const,
      message: planned.length === 0
        ? 'The runtime profile declares no planned capability.'
        : `These capabilities are declared but not implemented: ${planned.join(', ')}.`,
      relatedCapabilityIds: Object.freeze(planned),
    }),
    Object.freeze({
      id: 'visual-resources.chapter-scoped',
      severity: 'info' as const,
      message: 'Texture, tileset, theme, decoration, sprite, sound, audio profile and environment ids ' +
        'belong to chapter manifests and are not enumerated globally by this command.',
      relatedCapabilityIds: Object.freeze([]),
    }),
    Object.freeze({
      id: 'visual-resources.phaser-not-executed',
      severity: 'info' as const,
      message: 'The command does not start Phaser; textureKey existence is verified only at runtime or preview.',
      relatedCapabilityIds: Object.freeze([]),
    }),
    Object.freeze({
      id: 'authoring.headless-cli',
      severity: 'info' as const,
      message: 'validate, inspect and preview are headless; preview --visual only prepares a browser URL.',
      relatedCapabilityIds: Object.freeze([]),
    }),
    Object.freeze({
      id: 'authoring.procedural-seed',
      severity: 'info' as const,
      message: 'Procedural layouts must use seed "run"; overrides cannot replace the run seed.',
      relatedCapabilityIds: Object.freeze(['navigation.procedural-seed']),
    }),
    Object.freeze({
      id: 'authoring.remote-assets',
      severity: 'info' as const,
      message: 'There is no remote asset loading, asset discovery, plugin system, RAG index or MCP server.',
      relatedCapabilityIds: Object.freeze([]),
    }),
    Object.freeze({
      id: 'authoring.engine-boundaries',
      severity: 'info' as const,
      message: 'Chapter authors use public contracts; GameScene, combat, procedural, simulation and ' +
        'progression internals are outside the authoring boundary.',
      relatedCapabilityIds: Object.freeze([]),
    }),
    Object.freeze({
      id: 'authoring.promotion-manual',
      severity: 'info' as const,
      message: 'Moving a generated chapter from src/examples/chapters/ to src/stages/chapters/ is manual.',
      relatedCapabilityIds: Object.freeze([]),
    }),
  ];
  return Object.freeze(values);
}

function discovery() {
  return Object.freeze({
    automatic: Object.freeze([
      'runtimeProfile.capabilities',
      'authoring.tiles',
      'authoring.enemies',
      'authoring.items',
      'authoring.biomes',
      'authoring.themes',
      'authoring.proceduralPresets',
      'authoring.narrative',
      'authoring.encounters',
      'authoring.transitions',
      'authoring.visual',
      'authoring.campaignCatalog',
    ]),
    dynamic: Object.freeze([
      'chapter.visualResources',
      'stage.manifest.presentation',
      'stage.manifest.presentationVariants',
      'npc, dialogue, mission, event and flag ids',
    ]),
    unavailable: Object.freeze([
      'Phaser texture and animation existence',
      'remote asset catalogs',
      'runtime combat behaviour',
      'assets that a chapter has not declared',
    ]),
  });
}

/**
 * Builds the deterministic, read-only authoring report used by
 * `npm run chapter -- capabilities`.
 */
export function createStageAuthoringCapabilities(
  profile: StageRuntimeCapabilityProfile = DEFAULT_STAGE_RUNTIME_CAPABILITIES,
): StageAuthoringCapabilitiesReport {
  const capabilities = capabilityMap(profile);
  const entries: readonly StageAuthoringCapabilityEntry[] = Object.freeze([...profile.capabilities]
    .sort(compareIds)
    .map(capability => Object.freeze({
      id: capability.id,
      category: capability.category,
      version: capability.version,
      status: capability.status,
    })));
  const supported = entries.filter(capability => capability.status === 'supported').length;
  return Object.freeze({
    schemaVersion: STAGE_AUTHORING_CAPABILITIES_SCHEMA_VERSION,
    kind: STAGE_AUTHORING_CAPABILITIES_KIND,
    revision: STAGE_AUTHORING_CAPABILITIES_REVISION,
    runtimeProfile: Object.freeze({
      id: profile.id,
      revision: profile.revision,
      schemaVersion: profile.schemaVersion,
      capabilities: entries,
      counts: Object.freeze({
        total: entries.length,
        supported,
        planned: entries.length - supported,
      }),
    }),
    authoring: authoringVocabulary(profile, capabilities),
    dynamicResources: DYNAMIC_RESOURCES,
    rules: RULES,
    limitations: limitations(profile),
    discovery: discovery(),
  });
}
