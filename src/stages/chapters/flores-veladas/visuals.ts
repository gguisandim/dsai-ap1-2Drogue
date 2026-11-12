import type {
  ChapterVisualResources,
  StageEffectDefinition,
  StagePresentationDefinition,
} from '../../contracts';

export const VEILED_GARDENS_THEME_ID = 'theme.floresta.flores-veladas';
export const VEILED_GARDENS_TILESET_ID = 'tileset.floresta.flores-veladas';
export const VEILED_GARDENS_ENVIRONMENT_ID = 'environment.floresta.flores-veladas';
export const VEILED_GARDENS_AUDIO_PROFILE_ID = 'audio-profile.floresta.flores-veladas';
export const VEILED_GARDENS_NATURAL_VARIANT_ID = 'variant.floresta.flores-veladas.natural';
export const VEILED_GARDENS_CORRUPTED_VARIANT_ID = 'variant.floresta.flores-veladas.corrupted';
export const VEILED_GARDENS_CORRUPTED_THEME_ID = 'theme.floresta.flores-veladas.corrupted';
export const VEILED_GARDENS_CORRUPTED_TILESET_ID = 'tileset.floresta.flores-veladas.corrupted';
export const VEILED_GARDENS_CORRUPTED_ENVIRONMENT_ID = 'environment.floresta.flores-veladas.corrupted';
export const VEILED_GARDENS_CORRUPTED_AUDIO_PROFILE_ID = 'audio-profile.floresta.flores-veladas.corrupted';

const WORLD = 'texture.floresta.flores.puny-world';
const FLOOR = 'texture.floresta.flores.floor';
const MAGE = 'texture.floresta.flores.puny-mage';
const WARRIOR = 'texture.floresta.flores.puny-warrior';
const ARCHER = 'texture.floresta.flores.puny-archer';
const TREE = 'texture.floresta.flores.tree';
const BROMELIAD = 'texture.floresta.flores.bromeliad';
const HELICONIA = 'texture.floresta.flores.heliconia';
const ORCHID = 'texture.floresta.flores.orchid';
const NEST = 'texture.floresta.flores.nest';
const BOUGH = 'texture.floresta.flores.bough';
const LIGHT = 'texture.floresta.flores.light';
const NATURAL_CANOPY = 'texture.floresta.flores.natural-canopy';
const NATURAL_HEART = 'texture.floresta.flores.natural-heart';
const CORRUPTED_CANOPY = 'texture.floresta.flores.corrupted-canopy';
const CORRUPTED_HEART = 'texture.floresta.flores.corrupted-heart';
const CORRUPTED_TREE = 'texture.floresta.flores.corrupted-tree';
const CORRUPTED_BROMELIAD = 'texture.floresta.flores.corrupted-bromeliad';
const CORRUPTED_ARCH = 'texture.floresta.flores.corrupted-arch';
const CORRUPTED_ORCHID = 'texture.floresta.flores.corrupted-orchid';
const CORRUPTED_NEST = 'texture.floresta.flores.corrupted-nest';
const CORRUPTED_BOUGH = 'texture.floresta.flores.corrupted-bough';
const CORRUPTED_SPORES = 'texture.floresta.flores.corrupted-spores';

const ORIGINAL_ORIGIN = 'origin.floresta.flores-veladas-original';
const IMAGEGEN_ORIGIN = 'origin.floresta.flores-veladas-imagegen';

const frame = (value: number, extra: { readonly tint?: number; readonly alpha?: number } = {}) =>
  Object.freeze({ textureId: WORLD, frame: value, ...extra });
const tile = (value: number, variants: readonly ReturnType<typeof frame>[] = [], extra: { readonly tint?: number; readonly alpha?: number } = {}) =>
  Object.freeze({ ...frame(value, extra), variants: Object.freeze(variants) });
const enemyAnimations = (prefix: 'puny_warrior' | 'puny_archer') => Object.freeze({
  walk: `${prefix}_walk`, attack: `${prefix}_attack`, hurt: `${prefix}_hurt`,
});

export const VEILED_GARDENS_EFFECTS: readonly StageEffectDefinition[] = Object.freeze([
  Object.freeze({ id: 'effect.floresta.flores.fireflies', kind: 'fireflies' as const, color: 0xc8ff8a, alpha: 0.72, depth: 8.2, durationMs: 3200, x: 7, y: 7, width: 106, height: 24, count: 34, amplitude: 20 }),
  Object.freeze({ id: 'effect.floresta.flores.mist', kind: 'mist' as const, color: 0xb5d9c5, alpha: 0.08, depth: 4.1, durationMs: 9800, x: 8, y: 11, width: 106, height: 18, count: 7, amplitude: 64 }),
  Object.freeze({ id: 'effect.floresta.flores.clear-pulse', kind: 'pulse' as const, color: 0xf1a7d6, alpha: 0.18, depth: 7.5, durationMs: 1900, x: 84, y: 18, radius: 54, amplitude: 0.16 }),
  Object.freeze({ id: 'effect.floresta.flores.tree-light', kind: 'local-light' as const, color: 0x9fffe0, alpha: 0.2, depth: 7.4, durationMs: 2400, x: 100, y: 12, radius: 72, amplitude: 0.1 }),
  Object.freeze({ id: 'effect.floresta.flores.water', kind: 'water-shimmer' as const, color: 0xb0f4dc, alpha: 0.16, depth: 2.4, durationMs: 2500, count: 28 }),
  Object.freeze({ id: 'effect.floresta.flores.foliage', kind: 'foliage-sway' as const, color: 0x5c8b55, alpha: 0.15, depth: 8, durationMs: 3500, amplitude: 1.6 }),
]);

export const VEILED_GARDENS_CORRUPTED_EFFECTS: readonly StageEffectDefinition[] = Object.freeze([
  Object.freeze({ id: 'effect.floresta.flores.corrupted-spores', kind: 'spirits' as const, color: 0xb8de4b, alpha: 0.48, depth: 8.4, durationMs: 4200, x: 58, y: 7, width: 55, height: 25, count: 38, amplitude: 31 }),
  Object.freeze({ id: 'effect.floresta.flores.corrupted-fog', kind: 'mist' as const, color: 0x4d274f, alpha: 0.24, depth: 4.1, durationMs: 7600, x: 47, y: 8, width: 68, height: 24, count: 12, amplitude: 72 }),
  Object.freeze({ id: 'effect.floresta.flores.corrupted-heart', kind: 'pulse' as const, color: 0xc95162, alpha: 0.38, depth: 7.6, durationMs: 1250, x: 84, y: 18, radius: 88, amplitude: 0.3 }),
  Object.freeze({ id: 'effect.floresta.flores.corrupted-vein', kind: 'local-light' as const, color: 0xb5dc48, alpha: 0.26, depth: 7.45, durationMs: 1750, x: 100, y: 12, radius: 74, amplitude: 0.22 }),
  Object.freeze({ id: 'effect.floresta.flores.corrupted-water', kind: 'water-shimmer' as const, color: 0x78a858, alpha: 0.2, depth: 2.4, durationMs: 1800, count: 34 }),
  Object.freeze({ id: 'effect.floresta.flores.corrupted-foliage', kind: 'foliage-sway' as const, color: 0x6c354f, alpha: 0.26, depth: 8.1, durationMs: 2100, amplitude: 2.9 }),
]);

export const VEILED_GARDENS_VISUAL_RESOURCES: ChapterVisualResources = Object.freeze({
  textures: Object.freeze([
    Object.freeze({ id: WORLD, textureKey: 'puny_world', frameWidth: 16, frameHeight: 16, frameCount: 27 * 65 }),
    Object.freeze({ id: FLOOR, textureKey: 'flores_forest_floor', frameWidth: 32, frameHeight: 32, frameCount: 4, sourceWidth: 128, sourceHeight: 32, pixelArt: true }),
    Object.freeze({ id: MAGE, textureKey: 'puny_mage', frameWidth: 32, frameHeight: 32, frameCount: 24 * 8 }),
    Object.freeze({ id: WARRIOR, textureKey: 'puny_warrior_128', frameWidth: 128, frameHeight: 114, frameCount: 12 }),
    Object.freeze({ id: ARCHER, textureKey: 'puny_archer_128', frameWidth: 128, frameHeight: 114, frameCount: 12 }),
    Object.freeze({ id: TREE, textureKey: 'flores_monumental_tree', sourceWidth: 192, sourceHeight: 224, perspective: 'top-down' as const, originId: ORIGINAL_ORIGIN }),
    Object.freeze({ id: BROMELIAD, textureKey: 'flores_bromeliad_cluster', sourceWidth: 96, sourceHeight: 64, perspective: 'top-down' as const, originId: ORIGINAL_ORIGIN }),
    Object.freeze({ id: HELICONIA, textureKey: 'flores_heliconia_arch', sourceWidth: 160, sourceHeight: 128, perspective: 'neutral' as const, originId: ORIGINAL_ORIGIN }),
    Object.freeze({ id: ORCHID, textureKey: 'flores_orchid_veil', sourceWidth: 128, sourceHeight: 96, perspective: 'neutral' as const, originId: ORIGINAL_ORIGIN }),
    Object.freeze({ id: NEST, textureKey: 'flores_pollinator_nest', sourceWidth: 128, sourceHeight: 96, perspective: 'top-down' as const, originId: ORIGINAL_ORIGIN }),
    Object.freeze({ id: BOUGH, textureKey: 'flores_canopy_bough', sourceWidth: 224, sourceHeight: 80, perspective: 'neutral' as const, originId: ORIGINAL_ORIGIN }),
    Object.freeze({ id: LIGHT, textureKey: 'flores_light_shaft', sourceWidth: 112, sourceHeight: 224, perspective: 'neutral' as const, originId: ORIGINAL_ORIGIN }),
    Object.freeze({ id: NATURAL_CANOPY, textureKey: 'flores_natural_canopy', sourceWidth: 1024, sourceHeight: 512, perspective: 'top-down' as const, originId: IMAGEGEN_ORIGIN }),
    Object.freeze({ id: NATURAL_HEART, textureKey: 'flores_natural_heart_bloom', sourceWidth: 768, sourceHeight: 702, perspective: 'top-down' as const, originId: IMAGEGEN_ORIGIN }),
    Object.freeze({ id: CORRUPTED_CANOPY, textureKey: 'flores_corrupted_canopy', sourceWidth: 1024, sourceHeight: 512, perspective: 'top-down' as const, originId: IMAGEGEN_ORIGIN }),
    Object.freeze({ id: CORRUPTED_HEART, textureKey: 'flores_corrupted_heart_core', sourceWidth: 768, sourceHeight: 512, perspective: 'top-down' as const, originId: IMAGEGEN_ORIGIN }),
    Object.freeze({ id: CORRUPTED_TREE, textureKey: 'flores_corrupted_tree', sourceWidth: 192, sourceHeight: 224, perspective: 'top-down' as const, originId: ORIGINAL_ORIGIN }),
    Object.freeze({ id: CORRUPTED_BROMELIAD, textureKey: 'flores_corrupted_bromeliad', sourceWidth: 96, sourceHeight: 64, perspective: 'top-down' as const, originId: ORIGINAL_ORIGIN }),
    Object.freeze({ id: CORRUPTED_ARCH, textureKey: 'flores_corrupted_thorn_arch', sourceWidth: 160, sourceHeight: 128, perspective: 'neutral' as const, originId: ORIGINAL_ORIGIN }),
    Object.freeze({ id: CORRUPTED_ORCHID, textureKey: 'flores_corrupted_orchid_veil', sourceWidth: 128, sourceHeight: 96, perspective: 'neutral' as const, originId: ORIGINAL_ORIGIN }),
    Object.freeze({ id: CORRUPTED_NEST, textureKey: 'flores_corrupted_nest', sourceWidth: 128, sourceHeight: 96, perspective: 'top-down' as const, originId: ORIGINAL_ORIGIN }),
    Object.freeze({ id: CORRUPTED_BOUGH, textureKey: 'flores_corrupted_bough', sourceWidth: 224, sourceHeight: 80, perspective: 'neutral' as const, originId: ORIGINAL_ORIGIN }),
    Object.freeze({ id: CORRUPTED_SPORES, textureKey: 'flores_corrupted_spore_column', sourceWidth: 112, sourceHeight: 224, perspective: 'neutral' as const, originId: ORIGINAL_ORIGIN }),
  ]),
  tilesets: Object.freeze([Object.freeze({
    id: VEILED_GARDENS_TILESET_ID, revision: 1, tileSize: 32 as const,
    tiles: Object.freeze({
      floor: Object.freeze({ textureId: FLOOR, frame: 0, variants: Object.freeze([1, 2, 3].map(value => Object.freeze({ textureId: FLOOR, frame: value }))) }),
      wall: tile(190, [frame(191, { tint: 0x285f3c }), frame(204, { tint: 0x204c35 })], { tint: 0x2d6842 }),
      pillar: tile(197, [frame(206, { tint: 0x4e7950 })], { tint: 0x5b8152 }),
      water: tile(293, [frame(294, { tint: 0x4d8e7c }), frame(295, { tint: 0x397264 })], { tint: 0x64a48b, alpha: 0.9 }),
      lava: tile(40, [], { tint: 0x68523f }),
      exit: tile(714, [], { tint: 0xd5f2a4 }),
      'locked-door': tile(190, [], { tint: 0x4c3b61 }),
      chest: tile(815, [], { tint: 0xf0b9d9 }),
      spawn: tile(1, [], { tint: 0xc6e8a1 }),
      boss: tile(40, [], { tint: 0x79536f }),
    }),
  }), Object.freeze({
    id: VEILED_GARDENS_CORRUPTED_TILESET_ID, revision: 1, tileSize: 32 as const,
    tiles: Object.freeze({
      floor: Object.freeze({ textureId: FLOOR, frame: 3, tint: 0x68705a, variants: Object.freeze([
        Object.freeze({ textureId: FLOOR, frame: 1, tint: 0x555d52 }),
        Object.freeze({ textureId: FLOOR, frame: 2, tint: 0x715260 }),
      ]) }),
      wall: tile(204, [frame(190, { tint: 0x202932 }), frame(783, { tint: 0x482737 })], { tint: 0x28243a }),
      pillar: tile(783, [frame(810, { tint: 0x51405e })], { tint: 0x5c3548 }),
      water: tile(321, [frame(323, { tint: 0x4a6250 }), frame(295, { tint: 0x66506a })], { tint: 0x65724e, alpha: 0.86 }),
      lava: tile(40, [], { tint: 0x7b4236 }),
      exit: tile(714, [], { tint: 0xc4da54 }),
      'locked-door': tile(204, [], { tint: 0x3b273f }),
      chest: tile(815, [], { tint: 0xa55b74 }),
      spawn: tile(2, [], { tint: 0x839458 }),
      boss: tile(40, [], { tint: 0x873e4b }),
    }),
  })]),
  decorations: Object.freeze([
    Object.freeze({ id: 'flores_monumental_tree', textureId: TREE, layer: 'terrain' as const, depth: 4.8, defaultScale: 1.2, scaleClass: 'oversized' as const }),
    Object.freeze({ id: 'flores_bromeliad_cluster', textureId: BROMELIAD, layer: 'foreground' as const, depth: 4.4, defaultScale: 1, scaleClass: 'prop' as const }),
    Object.freeze({ id: 'flores_heliconia_arch', textureId: HELICONIA, layer: 'terrain' as const, depth: 4.1, defaultScale: 1, scaleClass: 'oversized' as const }),
    Object.freeze({ id: 'flores_orchid_veil', textureId: ORCHID, layer: 'foreground' as const, depth: 7.7, defaultScale: 1, scaleClass: 'oversized' as const }),
    Object.freeze({ id: 'flores_pollinator_nest', textureId: NEST, layer: 'terrain' as const, depth: 4.2, defaultScale: 1, scaleClass: 'prop' as const }),
    Object.freeze({ id: 'flores_canopy_bough', textureId: BOUGH, layer: 'foreground' as const, depth: 8.3, defaultScale: 1, scaleClass: 'oversized' as const }),
    Object.freeze({ id: 'flores_light_shaft', textureId: LIGHT, layer: 'background' as const, depth: 2.9, defaultScale: 1, scaleClass: 'oversized' as const }),
    Object.freeze({ id: 'flores_canopy', textureId: WORLD, frame: 190, layer: 'background' as const, depth: 2.1, defaultScale: 3.4, scaleClass: 'oversized' as const }),
    Object.freeze({ id: 'flores_pictorial_canopy', textureId: NATURAL_CANOPY, layer: 'background' as const, depth: 2.18, defaultScale: 0.42, scaleClass: 'oversized' as const }),
    Object.freeze({ id: 'flores_heart_bloom', textureId: NATURAL_HEART, layer: 'terrain' as const, depth: 3.15, defaultScale: 0.43, scaleClass: 'oversized' as const }),
    Object.freeze({ id: 'flores_corrupted_tree', textureId: CORRUPTED_TREE, layer: 'terrain' as const, depth: 4.9, defaultScale: 1.28, scaleClass: 'oversized' as const }),
    Object.freeze({ id: 'flores_corrupted_bromeliad', textureId: CORRUPTED_BROMELIAD, layer: 'foreground' as const, depth: 4.55, defaultScale: 1.12, scaleClass: 'prop' as const }),
    Object.freeze({ id: 'flores_corrupted_thorn_arch', textureId: CORRUPTED_ARCH, layer: 'terrain' as const, depth: 4.18, defaultScale: 1.08, scaleClass: 'oversized' as const }),
    Object.freeze({ id: 'flores_corrupted_orchid_veil', textureId: CORRUPTED_ORCHID, layer: 'foreground' as const, depth: 7.85, defaultScale: 1.08, scaleClass: 'oversized' as const }),
    Object.freeze({ id: 'flores_corrupted_nest', textureId: CORRUPTED_NEST, layer: 'terrain' as const, depth: 4.28, defaultScale: 1.12, scaleClass: 'prop' as const }),
    Object.freeze({ id: 'flores_corrupted_bough', textureId: CORRUPTED_BOUGH, layer: 'foreground' as const, depth: 8.4, defaultScale: 1.1, scaleClass: 'oversized' as const }),
    Object.freeze({ id: 'flores_corrupted_spore_column', textureId: CORRUPTED_SPORES, layer: 'background' as const, depth: 3.05, defaultScale: 1.18, scaleClass: 'oversized' as const }),
    Object.freeze({ id: 'flores_corrupted_canopy_tile', textureId: WORLD, frame: 204, tint: 0x3d2941, layer: 'background' as const, depth: 2.16, defaultScale: 3.8, scaleClass: 'oversized' as const }),
    Object.freeze({ id: 'flores_corrupted_pictorial_canopy', textureId: CORRUPTED_CANOPY, layer: 'background' as const, depth: 2.2, defaultScale: 0.46, scaleClass: 'oversized' as const }),
    Object.freeze({ id: 'flores_corrupted_heart_core', textureId: CORRUPTED_HEART, layer: 'terrain' as const, depth: 3.2, defaultScale: 0.52, scaleClass: 'oversized' as const }),
  ]),
  sprites: Object.freeze([
    Object.freeze({ id: 'sprite.floresta.flores.iarai', textureId: MAGE, animations: Object.freeze({ idle: 'puny_mage_idle' }), tint: 0xffb9dc, scale: 1.7, depth: 6 }),
    Object.freeze({ id: 'sprite.floresta.flores.tucum', textureId: ARCHER, animations: enemyAnimations('puny_archer'), tint: 0xc7e69b, scale: 1, depth: 6 }),
    Object.freeze({ id: 'sprite.floresta.flores.guardian', textureId: WARRIOR, animations: enemyAnimations('puny_warrior'), tint: 0x8fcf75, scale: 1, depth: 5 }),
    Object.freeze({ id: 'sprite.floresta.flores.pollinator', textureId: ARCHER, animations: enemyAnimations('puny_archer'), tint: 0xe49bc9, scale: 1, depth: 5 }),
    Object.freeze({ id: 'sprite.floresta.flores.corrupted.iarai', textureId: MAGE, animations: Object.freeze({ idle: 'puny_mage_idle' }), tint: 0xc18bb9, scale: 1.7, depth: 6 }),
    Object.freeze({ id: 'sprite.floresta.flores.corrupted.tucum', textureId: ARCHER, animations: enemyAnimations('puny_archer'), tint: 0x94a45d, scale: 1, depth: 6 }),
    Object.freeze({ id: 'sprite.floresta.flores.corrupted.guardian', textureId: WARRIOR, animations: enemyAnimations('puny_warrior'), tint: 0x8f4e62, scale: 1.06, depth: 5 }),
    Object.freeze({ id: 'sprite.floresta.flores.corrupted.pollinator', textureId: ARCHER, animations: enemyAnimations('puny_archer'), tint: 0xb1cf55, scale: 1.05, depth: 5 }),
  ]),
  sounds: Object.freeze([
    Object.freeze({ id: 'sound.floresta.flores.hum', kind: 'synth' as const, waveform: 'sine' as const, frequency: 146.83, volume: 0.025 }),
    Object.freeze({ id: 'sound.floresta.flores.leaves', kind: 'synth' as const, waveform: 'triangle' as const, frequency: 73.42, volume: 0.018 }),
    Object.freeze({ id: 'sound.floresta.flores.chime', kind: 'synth' as const, waveform: 'sine' as const, frequency: 587.33, volume: 0.06 }),
    Object.freeze({ id: 'sound.floresta.flores.corrupted-drone', kind: 'synth' as const, waveform: 'sawtooth' as const, frequency: 61.74, volume: 0.018 }),
    Object.freeze({ id: 'sound.floresta.flores.corrupted-spores', kind: 'synth' as const, waveform: 'square' as const, frequency: 92.5, volume: 0.012 }),
    Object.freeze({ id: 'sound.floresta.flores.corrupted-chime', kind: 'synth' as const, waveform: 'triangle' as const, frequency: 277.18, volume: 0.045 }),
  ]),
  audioProfiles: Object.freeze([
    Object.freeze({ id: VEILED_GARDENS_AUDIO_PROFILE_ID, musicSoundId: 'sound.floresta.flores.hum', ambientSoundId: 'sound.floresta.flores.leaves', eventSoundIds: Object.freeze({ 'stage.entered': 'sound.floresta.flores.chime', 'npc.interacted': 'sound.floresta.flores.chime' }), masterVolume: 0.6 }),
    Object.freeze({ id: VEILED_GARDENS_CORRUPTED_AUDIO_PROFILE_ID, musicSoundId: 'sound.floresta.flores.corrupted-drone', ambientSoundId: 'sound.floresta.flores.corrupted-spores', eventSoundIds: Object.freeze({ 'stage.entered': 'sound.floresta.flores.corrupted-chime', 'npc.interacted': 'sound.floresta.flores.corrupted-chime', 'enemy.defeated': 'sound.floresta.flores.corrupted-chime' }), masterVolume: 0.52 }),
  ]),
  environments: Object.freeze([
    Object.freeze({ id: VEILED_GARDENS_ENVIRONMENT_ID, ambientColor: 0x234936, lightIntensity: 0.7, fog: Object.freeze({ color: 0x304840, opacity: 0.07, depth: 3.5 }) }),
    Object.freeze({ id: VEILED_GARDENS_CORRUPTED_ENVIRONMENT_ID, ambientColor: 0x281f35, lightIntensity: 0.42, fog: Object.freeze({ color: 0x3f2548, opacity: 0.25, depth: 3.55 }) }),
  ]),
  themes: Object.freeze([
    Object.freeze({ id: VEILED_GARDENS_THEME_ID, revision: 2, tilesetId: VEILED_GARDENS_TILESET_ID, decorationIds: Object.freeze(['flores_monumental_tree', 'flores_bromeliad_cluster', 'flores_heliconia_arch', 'flores_orchid_veil', 'flores_pollinator_nest', 'flores_canopy_bough', 'flores_light_shaft', 'flores_canopy', 'flores_pictorial_canopy', 'flores_heart_bloom']) }),
    Object.freeze({
      id: VEILED_GARDENS_CORRUPTED_THEME_ID,
      revision: 1,
      tilesetId: VEILED_GARDENS_CORRUPTED_TILESET_ID,
      decorationIds: Object.freeze(['flores_corrupted_tree', 'flores_corrupted_bromeliad', 'flores_corrupted_thorn_arch', 'flores_corrupted_orchid_veil', 'flores_corrupted_nest', 'flores_corrupted_bough', 'flores_corrupted_spore_column', 'flores_corrupted_canopy_tile', 'flores_corrupted_pictorial_canopy', 'flores_corrupted_heart_core']),
      decorationOverrides: Object.freeze({
        flores_monumental_tree: 'flores_corrupted_tree',
        flores_bromeliad_cluster: 'flores_corrupted_bromeliad',
        flores_heliconia_arch: 'flores_corrupted_thorn_arch',
        flores_orchid_veil: 'flores_corrupted_orchid_veil',
        flores_pollinator_nest: 'flores_corrupted_nest',
        flores_canopy_bough: 'flores_corrupted_bough',
        flores_light_shaft: 'flores_corrupted_spore_column',
        flores_canopy: 'flores_corrupted_canopy_tile',
        flores_pictorial_canopy: 'flores_corrupted_pictorial_canopy',
        flores_heart_bloom: 'flores_corrupted_heart_core',
      }),
    }),
  ]),
});

export const VEILED_GARDENS_NATURAL_PRESENTATION: StagePresentationDefinition = Object.freeze({
  themeId: VEILED_GARDENS_THEME_ID,
  tilesetId: VEILED_GARDENS_TILESET_ID,
  npcSprites: Object.freeze({ 'environment.floresta.flores.iarai': 'sprite.floresta.flores.iarai', 'environment.floresta.flores.tucum': 'sprite.floresta.flores.tucum' }),
  enemySprites: Object.freeze({ affinity: 'sprite.floresta.flores.guardian', applaud: 'sprite.floresta.flores.pollinator' }),
  audioProfileId: VEILED_GARDENS_AUDIO_PROFILE_ID,
  environmentId: VEILED_GARDENS_ENVIRONMENT_ID,
  effects: VEILED_GARDENS_EFFECTS,
});

export const VEILED_GARDENS_CORRUPTED_PRESENTATION: StagePresentationDefinition = Object.freeze({
  themeId: VEILED_GARDENS_CORRUPTED_THEME_ID,
  tilesetId: VEILED_GARDENS_CORRUPTED_TILESET_ID,
  npcSprites: Object.freeze({ 'environment.floresta.flores.iarai': 'sprite.floresta.flores.corrupted.iarai', 'environment.floresta.flores.tucum': 'sprite.floresta.flores.corrupted.tucum' }),
  enemySprites: Object.freeze({ affinity: 'sprite.floresta.flores.corrupted.guardian', applaud: 'sprite.floresta.flores.corrupted.pollinator' }),
  audioProfileId: VEILED_GARDENS_CORRUPTED_AUDIO_PROFILE_ID,
  environmentId: VEILED_GARDENS_CORRUPTED_ENVIRONMENT_ID,
  effects: VEILED_GARDENS_CORRUPTED_EFFECTS,
});

/** Compatibility name: the Natural presentation remains the default. */
export const VEILED_GARDENS_PRESENTATION = VEILED_GARDENS_NATURAL_PRESENTATION;

export const VEILED_GARDENS_PRESENTATION_VARIANTS: Readonly<Record<string, StagePresentationDefinition>> =
  Object.freeze({
    [VEILED_GARDENS_NATURAL_VARIANT_ID]: VEILED_GARDENS_NATURAL_PRESENTATION,
    [VEILED_GARDENS_CORRUPTED_VARIANT_ID]: VEILED_GARDENS_CORRUPTED_PRESENTATION,
  });
