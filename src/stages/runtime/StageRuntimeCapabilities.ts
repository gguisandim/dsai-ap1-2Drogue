import type {
  StageCapabilityCategory,
  StageRuntimeCapability,
  StageRuntimeCapabilityProfile,
} from '../contracts';

function capability(
  id: string,
  category: StageCapabilityCategory,
  status: StageRuntimeCapability['status'] = 'supported',
): StageRuntimeCapability {
  return Object.freeze({ id, category, version: 1, status });
}

const TILE_NAMES = Object.freeze([
  'floor', 'wall', 'pillar', 'water', 'lava', 'exit', 'locked-door', 'chest', 'spawn', 'boss',
]);

const BIOMES = Object.freeze([
  'cathedral', 'inferno', 'celestial', 'streets', 'ruins',
  'garden', 'crypt', 'clocktower', 'colosseum', 'void',
]);

const THEMES = Object.freeze([
  'gothic-cathedral', 'inferno-pit', 'celestial-tower', 'venetian-streets', 'roman-ruins',
  'paradiso-garden', 'witches-crypt', 'clocktower', 'colosseum', 'limbo-void',
]);

/**
 * Compatibility profile for the current runtime. `planned` means a data field
 * exists but is not an independent authoring extension point yet.
 */
export const DEFAULT_STAGE_RUNTIME_CAPABILITIES: StageRuntimeCapabilityProfile = Object.freeze({
  schemaVersion: 1 as const,
  id: 'runtime.umbra-trail.stage-capabilities',
  revision: 1,
  capabilities: Object.freeze([
    ...TILE_NAMES.map(name => capability(`tile.${name}`, 'tile')),
    capability('tile.custom-tileset', 'tile'),
    ...BIOMES.map(name => capability(`biome.${name}`, 'biome')),
    ...THEMES.map(name => capability(`theme.${name}`, 'theme', 'planned')),
    capability('theme.legacy.default', 'theme'),
    capability('theme.aguas.igapo', 'theme'),
    ...['affinity', 'applaud', 'fortitudo', 'ranged', 'boss', 'miniboss']
      .map(name => capability(`enemy.${name}`, 'enemy')),
    ...['key', 'potion', 'health-herb', 'mana-shard']
      .map(name => capability(`item.${name}`, 'item')),
    capability('audio.level-music', 'audio', 'planned'),
    capability('lighting.level-ambience', 'lighting', 'planned'),
    capability('effect.level-decoration', 'effect'),
    capability('npc.authored', 'npc'),
    capability('interaction.npc-dialogue', 'interaction'),
    capability('narrative.dialogue', 'narrative'),
    capability('narrative.mission', 'narrative'),
    capability('narrative.event', 'narrative'),
    capability('narrative.condition', 'narrative'),
    capability('navigation.authored-map', 'navigation'),
    capability('navigation.physical-exit', 'navigation'),
    capability('navigation.procedural-seed', 'navigation'),
  ]),
});

export function tileCapabilityId(tile: number): string | undefined {
  const name = TILE_NAMES[tile];
  return name ? `tile.${name}` : undefined;
}

export function enemyCapabilityId(archetype: string): string {
  return `enemy.${archetype}`;
}

export function itemCapabilityId(itemType: string): string {
  return `item.${itemType.replace(/_/g, '-')}`;
}
