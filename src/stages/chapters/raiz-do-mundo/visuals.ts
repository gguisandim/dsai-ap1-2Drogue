import type {
  ChapterVisualResources,
  StageEffectDefinition,
  StagePresentationDefinition,
} from '../../contracts';

export const WORLD_ROOT_THEME_ID = 'theme.raiz-do-mundo.sanctuary';
export const WORLD_ROOT_TILESET_ID = 'tileset.raiz-do-mundo.sanctuary';
export const WORLD_ROOT_ENVIRONMENT_ID = 'environment.raiz-do-mundo.sanctuary';
export const WORLD_ROOT_AUDIO_PROFILE_ID = 'audio-profile.raiz-do-mundo.sanctuary';

const WORLD_TEXTURE = 'texture.raiz-do-mundo.puny-world';
const SANCTUARY_TEXTURE = 'texture.raiz-do-mundo.sanctuary';
const GROUND_TEXTURE = 'texture.raiz-do-mundo.ground';
const STONE_TEXTURE = 'texture.raiz-do-mundo.stone';
const CANOPY_TEXTURE = 'texture.raiz-do-mundo.canopy';
const TRAIL_TEXTURE = 'texture.raiz-do-mundo.trail-composition';
const APPROACH_TEXTURE = 'texture.raiz-do-mundo.sanctuary-approach';
const STREAM_TEXTURE = 'texture.raiz-do-mundo.stream';
const GROVE_TEXTURE = 'texture.raiz-do-mundo.grove';
const ENTRANCE_TEXTURE = 'texture.raiz-do-mundo.entrance';
const PASSAGE_TEXTURE = 'texture.raiz-do-mundo.passage';
const MAGE_TEXTURE = 'texture.raiz-do-mundo.puny-mage';
const WARRIOR_TEXTURE = 'texture.raiz-do-mundo.puny-warrior';
const ARCHER_TEXTURE = 'texture.raiz-do-mundo.puny-archer';

const frame = (value: number, extra: { readonly tint?: number; readonly alpha?: number } = {}) =>
  Object.freeze({ textureId: WORLD_TEXTURE, frame: value, ...extra });

const tile = (
  value: number,
  variants: readonly ReturnType<typeof frame>[] = [],
  extra: { readonly tint?: number; readonly alpha?: number } = {},
) => Object.freeze({ ...frame(value, extra), variants: Object.freeze(variants) });

const groundFrame = (value: number) => Object.freeze({
  textureId: GROUND_TEXTURE,
  frame: value,
});

const enemyAnimations = (prefix: 'puny_warrior' | 'puny_archer') => Object.freeze({
  walk: `${prefix}_walk`, attack: `${prefix}_attack`, hurt: `${prefix}_hurt`,
});

export const WORLD_ROOT_EFFECTS: readonly StageEffectDefinition[] = Object.freeze([
  Object.freeze({
    id: 'effect.raiz-do-mundo.fireflies', kind: 'fireflies' as const,
    color: 0xffd76a, alpha: 0.78, depth: 8.5, durationMs: 3100,
    x: 8, y: 7, width: 99, height: 22, count: 30, amplitude: 18,
  }),
  Object.freeze({
    id: 'effect.raiz-do-mundo.mist', kind: 'mist' as const,
    color: 0x7fb9a8, alpha: 0.1, depth: 4.4, durationMs: 9200,
    x: 6, y: 10, width: 104, height: 17, count: 7, amplitude: 72,
  }),
  Object.freeze({
    id: 'effect.raiz-do-mundo.altar-pulse', kind: 'pulse' as const,
    color: 0xffc86b, alpha: 0.2, depth: 8, durationMs: 1800,
    x: 80, y: 18, radius: 58, amplitude: 0.16,
  }),
  Object.freeze({
    id: 'effect.raiz-do-mundo.spirits', kind: 'spirits' as const,
    color: 0x91f7e5, alpha: 0.68, depth: 8.4, durationMs: 4300,
    x: 74, y: 5, width: 13, height: 17, count: 14, amplitude: 22,
  }),
  ...Object.freeze([
    [73, 12], [87, 12], [74, 24], [86, 24],
  ]).map(([x, y], index) => Object.freeze({
    id: `effect.raiz-do-mundo.monolith-${index + 1}`, kind: 'local-light' as const,
    color: 0x70e8d1, alpha: 0.14, depth: 7.4, durationMs: 2200 + index * 170,
    x, y, radius: 38, amplitude: 0.08,
  })),
  Object.freeze({
    id: 'effect.raiz-do-mundo.water', kind: 'water-shimmer' as const,
    color: 0x8ae9da, alpha: 0.18, depth: 2.45, durationMs: 2400, count: 26,
  }),
  Object.freeze({
    id: 'effect.raiz-do-mundo.foliage', kind: 'foliage-sway' as const,
    color: 0x4f8c63, alpha: 0.15, depth: 8, durationMs: 3600, amplitude: 1.4,
  }),
]);

export const WORLD_ROOT_VISUAL_RESOURCES: ChapterVisualResources = Object.freeze({
  textures: Object.freeze([
    Object.freeze({ id: WORLD_TEXTURE, textureKey: 'puny_world', frameWidth: 16, frameHeight: 16, frameCount: 27 * 65 }),
    Object.freeze({ id: SANCTUARY_TEXTURE, textureKey: 'world_root_sanctuary' }),
    Object.freeze({
      id: GROUND_TEXTURE, textureKey: 'world_root_ground',
      frameWidth: 32, frameHeight: 32, frameCount: 4,
    }),
    Object.freeze({ id: STONE_TEXTURE, textureKey: 'world_root_stone' }),
    Object.freeze({ id: CANOPY_TEXTURE, textureKey: 'world_root_canopy' }),
    Object.freeze({ id: TRAIL_TEXTURE, textureKey: 'world_root_trail_composition' }),
    Object.freeze({ id: APPROACH_TEXTURE, textureKey: 'world_root_sanctuary_approach' }),
    Object.freeze({ id: STREAM_TEXTURE, textureKey: 'world_root_stream' }),
    Object.freeze({ id: GROVE_TEXTURE, textureKey: 'world_root_grove' }),
    Object.freeze({ id: ENTRANCE_TEXTURE, textureKey: 'world_root_entrance' }),
    Object.freeze({ id: PASSAGE_TEXTURE, textureKey: 'world_root_passage' }),
    Object.freeze({ id: MAGE_TEXTURE, textureKey: 'puny_mage', frameWidth: 32, frameHeight: 32, frameCount: 24 * 8 }),
    Object.freeze({ id: WARRIOR_TEXTURE, textureKey: 'puny_warrior_128', frameWidth: 128, frameHeight: 114, frameCount: 12 }),
    Object.freeze({ id: ARCHER_TEXTURE, textureKey: 'puny_archer_128', frameWidth: 128, frameHeight: 114, frameCount: 12 }),
  ]),
  tilesets: Object.freeze([Object.freeze({
    id: WORLD_ROOT_TILESET_ID, revision: 1, tileSize: 32 as const,
    tiles: Object.freeze({
      floor: Object.freeze({
        ...groundFrame(0),
        variants: Object.freeze([groundFrame(1), groundFrame(2), groundFrame(3)]),
      }),
      wall: Object.freeze({ textureId: CANOPY_TEXTURE, frame: 0 }),
      pillar: Object.freeze({ textureId: STONE_TEXTURE, frame: 0 }),
      water: tile(
        293,
        [frame(294, { tint: 0x668b7d }), frame(295, { tint: 0x577e73 })],
        { tint: 0x628679, alpha: 0.9 },
      ),
      lava: tile(40, [], { tint: 0x5b6d4b }),
      exit: tile(714, [], { tint: 0xe8d28b }),
      'locked-door': tile(190, [], { tint: 0x2c4b39 }),
      chest: tile(815, [], { tint: 0x9de7d5 }),
      spawn: tile(1, [], { tint: 0xa8c486 }),
      boss: tile(40, [], { tint: 0x73835b }),
    }),
  })]),
  decorations: Object.freeze([
    Object.freeze({
      id: 'raiz_do_mundo_trail_composition', textureId: TRAIL_TEXTURE,
      layer: 'terrain' as const, depth: -1.25, defaultScale: 0.62,
    }),
    Object.freeze({
      id: 'raiz_do_mundo_entrance_composition', textureId: ENTRANCE_TEXTURE,
      layer: 'terrain' as const, depth: -1.27, defaultScale: 0.62,
    }),
    Object.freeze({
      id: 'raiz_do_mundo_passage_composition', textureId: PASSAGE_TEXTURE,
      layer: 'terrain' as const, depth: -1.26, defaultScale: 0.62,
    }),
    Object.freeze({
      id: 'raiz_do_mundo_sanctuary_approach', textureId: APPROACH_TEXTURE,
      layer: 'terrain' as const, depth: 0.7, defaultScale: 0.62,
    }),
    Object.freeze({
      id: 'raiz_do_mundo_stream', textureId: STREAM_TEXTURE,
      layer: 'terrain' as const, depth: 2.3, defaultScale: 0.34,
    }),
    Object.freeze({
      id: 'raiz_do_mundo_grove', textureId: GROVE_TEXTURE,
      layer: 'terrain' as const, depth: 2.2, defaultScale: 0.38,
    }),
    Object.freeze({
      id: 'raiz_do_mundo_sanctuary', textureId: SANCTUARY_TEXTURE,
      layer: 'terrain' as const, depth: 4, defaultScale: 0.56,
    }),
    Object.freeze({
      id: 'raiz_do_mundo_monolith', textureId: WORLD_TEXTURE, frame: 714,
      layer: 'terrain' as const, depth: 4.2, defaultScale: 2.7,
    }),
    Object.freeze({
      id: 'raiz_do_mundo_canopy', textureId: WORLD_TEXTURE, frame: 190,
      layer: 'background' as const, depth: 2.2, defaultScale: 4.2,
    }),
    Object.freeze({
      id: 'raiz_do_mundo_roots', textureId: WORLD_TEXTURE, frame: 730,
      layer: 'terrain' as const, depth: 3.8, defaultScale: 2.3,
    }),
    Object.freeze({
      id: 'raiz_do_mundo_undergrowth', textureId: WORLD_TEXTURE, frame: 704,
      layer: 'foreground' as const, depth: 8, defaultScale: 2.15,
    }),
    Object.freeze({
      id: 'raiz_do_mundo_vines', textureId: WORLD_TEXTURE, frame: 758,
      layer: 'foreground' as const, depth: 8.2, defaultScale: 2.35,
    }),
    Object.freeze({
      id: 'raiz_do_mundo_biolume', textureId: WORLD_TEXTURE, frame: 705,
      layer: 'foreground' as const, depth: 7.8, defaultScale: 1.55,
    }),
    Object.freeze({
      id: 'raiz_do_mundo_ruin', textureId: WORLD_TEXTURE, frame: 714,
      layer: 'terrain' as const, depth: 3.9, defaultScale: 2.4,
    }),
    Object.freeze({
      id: 'raiz_do_mundo_fern', textureId: WORLD_TEXTURE, frame: 704,
      layer: 'foreground' as const, depth: 7.9, defaultScale: 1.8,
    }),
    Object.freeze({
      id: 'raiz_do_mundo_palm', textureId: WORLD_TEXTURE, frame: 190,
      layer: 'background' as const, depth: 2.1, defaultScale: 3.7,
    }),
    Object.freeze({
      id: 'raiz_do_mundo_fallen_trunk', textureId: WORLD_TEXTURE, frame: 730,
      layer: 'terrain' as const, depth: 3.7, defaultScale: 2.3,
    }),
  ]),
  sprites: Object.freeze([
    Object.freeze({
      id: 'sprite.raiz-do-mundo.keeper', textureId: MAGE_TEXTURE,
      animations: Object.freeze({ idle: 'puny_mage_idle' }), tint: 0xb9fff0, scale: 1.7, depth: 6,
    }),
    Object.freeze({
      id: 'sprite.raiz-do-mundo.guardian', textureId: WARRIOR_TEXTURE,
      animations: enemyAnimations('puny_warrior'), tint: 0x9bc88d, scale: 1, depth: 5,
    }),
    Object.freeze({
      id: 'sprite.raiz-do-mundo.archer', textureId: ARCHER_TEXTURE,
      animations: enemyAnimations('puny_archer'), tint: 0x89d7c8, scale: 1, depth: 5,
    }),
  ]),
  sounds: Object.freeze([
    Object.freeze({ id: 'sound.raiz-do-mundo.heartbeat', kind: 'synth' as const, waveform: 'sine' as const, frequency: 65.41, volume: 0.055 }),
    Object.freeze({ id: 'sound.raiz-do-mundo.canopy', kind: 'synth' as const, waveform: 'triangle' as const, frequency: 130.81, volume: 0.02 }),
    Object.freeze({ id: 'sound.raiz-do-mundo.chime', kind: 'synth' as const, waveform: 'sine' as const, frequency: 523.25, volume: 0.07 }),
  ]),
  audioProfiles: Object.freeze([Object.freeze({
    id: WORLD_ROOT_AUDIO_PROFILE_ID,
    musicSoundId: 'sound.raiz-do-mundo.heartbeat',
    ambientSoundId: 'sound.raiz-do-mundo.canopy',
    eventSoundIds: Object.freeze({
      'stage.entered': 'sound.raiz-do-mundo.chime',
      'npc.interacted': 'sound.raiz-do-mundo.chime',
    }),
    masterVolume: 0.62,
  })]),
  environments: Object.freeze([Object.freeze({
    id: WORLD_ROOT_ENVIRONMENT_ID,
    ambientColor: 0x173d32,
    lightIntensity: 0.66,
    fog: Object.freeze({ color: 0x173f38, opacity: 0.08, depth: 3.6 }),
  })]),
  themes: Object.freeze([Object.freeze({
    id: WORLD_ROOT_THEME_ID,
    revision: 1,
    tilesetId: WORLD_ROOT_TILESET_ID,
    decorationIds: Object.freeze([
      'raiz_do_mundo_entrance_composition', 'raiz_do_mundo_trail_composition',
      'raiz_do_mundo_sanctuary_approach', 'raiz_do_mundo_passage_composition',
      'raiz_do_mundo_stream', 'raiz_do_mundo_grove',
      'raiz_do_mundo_sanctuary', 'raiz_do_mundo_monolith', 'raiz_do_mundo_canopy',
      'raiz_do_mundo_roots', 'raiz_do_mundo_undergrowth', 'raiz_do_mundo_vines',
      'raiz_do_mundo_biolume', 'raiz_do_mundo_ruin', 'raiz_do_mundo_fern',
      'raiz_do_mundo_palm', 'raiz_do_mundo_fallen_trunk',
    ]),
  })]),
});

export const WORLD_ROOT_PRESENTATION: StagePresentationDefinition = Object.freeze({
  themeId: WORLD_ROOT_THEME_ID,
  tilesetId: WORLD_ROOT_TILESET_ID,
  npcSprites: Object.freeze({ 'environment.world-root-keeper': 'sprite.raiz-do-mundo.keeper' }),
  enemySprites: Object.freeze({
    affinity: 'sprite.raiz-do-mundo.guardian',
    applaud: 'sprite.raiz-do-mundo.archer',
  }),
  audioProfileId: WORLD_ROOT_AUDIO_PROFILE_ID,
  environmentId: WORLD_ROOT_ENVIRONMENT_ID,
  effects: WORLD_ROOT_EFFECTS,
});
