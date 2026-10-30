import type { ChapterVisualResources } from '../../contracts';

export const IGAPO_VISUAL_THEME_ID = 'theme.aguas.igapo';
export const IGAPO_VISUAL_TILESET_ID = 'tileset.aguas.igapo-technical';
export const IGAPO_NPC_SPRITE_ID = 'sprite.aguas.memory-vestige';
export const IGAPO_AFFINITY_SPRITE_ID = 'sprite.aguas.affinity-forgotten';
export const IGAPO_APPLAUD_SPRITE_ID = 'sprite.aguas.applaud-forgotten';
export const IGAPO_AUDIO_PROFILE_ID = 'audio-profile.aguas.forgotten-waters';
export const IGAPO_ENVIRONMENT_ID = 'environment.aguas.forgotten-waters';

export const AGUAS_VISUAL_RESOURCES: ChapterVisualResources = Object.freeze({
  textures: Object.freeze([
    Object.freeze({ id: 'texture.aguas.floor', textureKey: 'tile_floor' }),
    Object.freeze({ id: 'texture.aguas.wall', textureKey: 'tile_wall' }),
    Object.freeze({ id: 'texture.aguas.root', textureKey: 'tile_pillar' }),
    Object.freeze({ id: 'texture.aguas.water', textureKey: 'tile_water' }),
    Object.freeze({ id: 'texture.aguas.lava', textureKey: 'tile_lava' }),
    Object.freeze({ id: 'texture.aguas.exit', textureKey: 'tile_stairs' }),
    Object.freeze({ id: 'texture.aguas.chest', textureKey: 'item_chest' }),
    Object.freeze({ id: 'texture.aguas.npc-memory', textureKey: 'enemy_ranged_anim' }),
    Object.freeze({ id: 'texture.aguas.enemy-melee', textureKey: 'enemy_melee_anim' }),
    Object.freeze({ id: 'texture.aguas.enemy-ranged', textureKey: 'enemy_ranged_anim' }),
  ]),
  tilesets: Object.freeze([Object.freeze({
    id: IGAPO_VISUAL_TILESET_ID,
    revision: 1,
    tileSize: 32 as const,
    tiles: Object.freeze({
      floor: Object.freeze({
        textureId: 'texture.aguas.floor', tint: 0x496b58,
        variants: Object.freeze([Object.freeze({ textureId: 'texture.aguas.floor', tint: 0x3f604f })]),
      }),
      wall: Object.freeze({ textureId: 'texture.aguas.wall', tint: 0x183b32 }),
      pillar: Object.freeze({ textureId: 'texture.aguas.root', tint: 0x5d4c35 }),
      water: Object.freeze({
        textureId: 'texture.aguas.water', tint: 0x17434a, alpha: 0.94,
        variants: Object.freeze([Object.freeze({ textureId: 'texture.aguas.water', tint: 0x12363d, alpha: 0.9 })]),
      }),
      lava: Object.freeze({ textureId: 'texture.aguas.lava', tint: 0x6f7852 }),
      exit: Object.freeze({ textureId: 'texture.aguas.exit', tint: 0x8dc6a8 }),
      'locked-door': Object.freeze({ textureId: 'texture.aguas.wall', tint: 0x29483c }),
      chest: Object.freeze({ textureId: 'texture.aguas.chest', tint: 0x7bb09c }),
      spawn: Object.freeze({ textureId: 'texture.aguas.floor', tint: 0x62836d }),
      boss: Object.freeze({ textureId: 'texture.aguas.floor', tint: 0x355747 }),
    }),
  })]),
  decorations: Object.freeze([
    Object.freeze({
      id: 'igapo_emergent_tree', textureId: 'texture.aguas.root',
      layer: 'foreground' as const, depth: 5, defaultScale: 1,
    }),
    Object.freeze({
      id: 'igapo_fallen_trunk', textureId: 'texture.aguas.wall',
      layer: 'terrain' as const, depth: 2, defaultScale: 1,
    }),
    Object.freeze({
      id: 'igapo_memory_reeds', textureId: 'texture.aguas.water',
      layer: 'foreground' as const, depth: 4, defaultScale: 0.8,
    }),
  ]),
  sprites: Object.freeze([
    Object.freeze({
      id: IGAPO_NPC_SPRITE_ID,
      textureId: 'texture.aguas.npc-memory',
      animations: Object.freeze({ idle: 'enemy_ranged_anim_walk' }),
      tint: 0x78d8bb,
      scale: 0.48,
      depth: 6,
    }),
    Object.freeze({
      id: IGAPO_AFFINITY_SPRITE_ID,
      textureId: 'texture.aguas.enemy-melee',
      animations: Object.freeze({
        walk: 'enemy_melee_anim_walk', attack: 'enemy_melee_anim_attack', hurt: 'enemy_melee_anim_hurt',
      }),
      tint: 0x57a878,
      scale: 1,
      depth: 5,
    }),
    Object.freeze({
      id: IGAPO_APPLAUD_SPRITE_ID,
      textureId: 'texture.aguas.enemy-ranged',
      animations: Object.freeze({
        walk: 'enemy_ranged_anim_walk', attack: 'enemy_ranged_anim_attack', hurt: 'enemy_ranged_anim_hurt',
      }),
      tint: 0x59b8c0,
      scale: 1,
      depth: 5,
    }),
  ]),
  sounds: Object.freeze([
    Object.freeze({
      id: 'sound.aguas.memory-current', kind: 'synth' as const,
      waveform: 'sine' as const, frequency: 82.41, volume: 0.08,
    }),
    Object.freeze({
      id: 'sound.aguas.flooded-canopy', kind: 'synth' as const,
      waveform: 'triangle' as const, frequency: 164.81, volume: 0.025,
    }),
    Object.freeze({
      id: 'sound.aguas.echo-touched', kind: 'synth' as const,
      waveform: 'sine' as const, frequency: 392, volume: 0.08,
    }),
    Object.freeze({
      id: 'sound.aguas.memory-broken', kind: 'synth' as const,
      waveform: 'triangle' as const, frequency: 110, volume: 0.06,
    }),
  ]),
  audioProfiles: Object.freeze([Object.freeze({
    id: IGAPO_AUDIO_PROFILE_ID,
    musicSoundId: 'sound.aguas.memory-current',
    ambientSoundId: 'sound.aguas.flooded-canopy',
    eventSoundIds: Object.freeze({
      'stage.entered': 'sound.aguas.echo-touched',
      'npc.interacted': 'sound.aguas.echo-touched',
      'enemy.defeated': 'sound.aguas.memory-broken',
    }),
    masterVolume: 0.7,
  })]),
  environments: Object.freeze([Object.freeze({
    id: IGAPO_ENVIRONMENT_ID,
    ambientColor: 0x153e39,
    lightIntensity: 0.62,
    fog: Object.freeze({ color: 0x123d42, opacity: 0.16, depth: 4 }),
  })]),
  themes: Object.freeze([Object.freeze({
    id: IGAPO_VISUAL_THEME_ID,
    revision: 1,
    tilesetId: IGAPO_VISUAL_TILESET_ID,
    decorationIds: Object.freeze([
      'igapo_emergent_tree', 'igapo_fallen_trunk', 'igapo_memory_reeds',
    ]),
  })]),
});
