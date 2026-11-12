import type {
  ChapterVisualResources,
  StageEffectDefinition,
  StagePresentationDefinition,
} from '../../contracts';

export const VEILED_GARDENS_THEME_ID = 'theme.floresta.flores-veladas';
export const VEILED_GARDENS_TILESET_ID = 'tileset.floresta.flores-veladas';
export const VEILED_GARDENS_ENVIRONMENT_ID = 'environment.floresta.flores-veladas';
export const VEILED_GARDENS_AUDIO_PROFILE_ID = 'audio-profile.floresta.flores-veladas';

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

export const VEILED_GARDENS_VISUAL_RESOURCES: ChapterVisualResources = Object.freeze({
  textures: Object.freeze([
    Object.freeze({ id: WORLD, textureKey: 'puny_world', frameWidth: 16, frameHeight: 16, frameCount: 27 * 65 }),
    Object.freeze({ id: FLOOR, textureKey: 'flores_forest_floor', frameWidth: 32, frameHeight: 32, frameCount: 4, sourceWidth: 128, sourceHeight: 32, pixelArt: true }),
    Object.freeze({ id: MAGE, textureKey: 'puny_mage', frameWidth: 32, frameHeight: 32, frameCount: 24 * 8 }),
    Object.freeze({ id: WARRIOR, textureKey: 'puny_warrior_128', frameWidth: 128, frameHeight: 114, frameCount: 12 }),
    Object.freeze({ id: ARCHER, textureKey: 'puny_archer_128', frameWidth: 128, frameHeight: 114, frameCount: 12 }),
    Object.freeze({ id: TREE, textureKey: 'flores_monumental_tree', sourceWidth: 192, sourceHeight: 224, perspective: 'top-down' as const }),
    Object.freeze({ id: BROMELIAD, textureKey: 'flores_bromeliad_cluster', sourceWidth: 96, sourceHeight: 64, perspective: 'top-down' as const }),
    Object.freeze({ id: HELICONIA, textureKey: 'flores_heliconia_arch', sourceWidth: 160, sourceHeight: 128, perspective: 'neutral' as const }),
    Object.freeze({ id: ORCHID, textureKey: 'flores_orchid_veil', sourceWidth: 128, sourceHeight: 96, perspective: 'neutral' as const }),
    Object.freeze({ id: NEST, textureKey: 'flores_pollinator_nest', sourceWidth: 128, sourceHeight: 96, perspective: 'top-down' as const }),
    Object.freeze({ id: BOUGH, textureKey: 'flores_canopy_bough', sourceWidth: 224, sourceHeight: 80, perspective: 'neutral' as const }),
    Object.freeze({ id: LIGHT, textureKey: 'flores_light_shaft', sourceWidth: 112, sourceHeight: 224, perspective: 'neutral' as const }),
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
  ]),
  sprites: Object.freeze([
    Object.freeze({ id: 'sprite.floresta.flores.iarai', textureId: MAGE, animations: Object.freeze({ idle: 'puny_mage_idle' }), tint: 0xffb9dc, scale: 1.7, depth: 6 }),
    Object.freeze({ id: 'sprite.floresta.flores.tucum', textureId: ARCHER, animations: enemyAnimations('puny_archer'), tint: 0xc7e69b, scale: 1, depth: 6 }),
    Object.freeze({ id: 'sprite.floresta.flores.guardian', textureId: WARRIOR, animations: enemyAnimations('puny_warrior'), tint: 0x8fcf75, scale: 1, depth: 5 }),
    Object.freeze({ id: 'sprite.floresta.flores.pollinator', textureId: ARCHER, animations: enemyAnimations('puny_archer'), tint: 0xe49bc9, scale: 1, depth: 5 }),
  ]),
  sounds: Object.freeze([
    Object.freeze({ id: 'sound.floresta.flores.hum', kind: 'synth' as const, waveform: 'sine' as const, frequency: 146.83, volume: 0.025 }),
    Object.freeze({ id: 'sound.floresta.flores.leaves', kind: 'synth' as const, waveform: 'triangle' as const, frequency: 73.42, volume: 0.018 }),
    Object.freeze({ id: 'sound.floresta.flores.chime', kind: 'synth' as const, waveform: 'sine' as const, frequency: 587.33, volume: 0.06 }),
  ]),
  audioProfiles: Object.freeze([Object.freeze({ id: VEILED_GARDENS_AUDIO_PROFILE_ID, musicSoundId: 'sound.floresta.flores.hum', ambientSoundId: 'sound.floresta.flores.leaves', eventSoundIds: Object.freeze({ 'stage.entered': 'sound.floresta.flores.chime', 'npc.interacted': 'sound.floresta.flores.chime' }), masterVolume: 0.6 })]),
  environments: Object.freeze([Object.freeze({ id: VEILED_GARDENS_ENVIRONMENT_ID, ambientColor: 0x234936, lightIntensity: 0.7, fog: Object.freeze({ color: 0x304840, opacity: 0.07, depth: 3.5 }) })]),
  themes: Object.freeze([Object.freeze({ id: VEILED_GARDENS_THEME_ID, revision: 1, tilesetId: VEILED_GARDENS_TILESET_ID, decorationIds: Object.freeze(['flores_monumental_tree', 'flores_bromeliad_cluster', 'flores_heliconia_arch', 'flores_orchid_veil', 'flores_pollinator_nest', 'flores_canopy_bough', 'flores_light_shaft', 'flores_canopy']) })]),
});

export const VEILED_GARDENS_PRESENTATION: StagePresentationDefinition = Object.freeze({
  themeId: VEILED_GARDENS_THEME_ID,
  tilesetId: VEILED_GARDENS_TILESET_ID,
  npcSprites: Object.freeze({ 'environment.floresta.flores.iarai': 'sprite.floresta.flores.iarai', 'environment.floresta.flores.tucum': 'sprite.floresta.flores.tucum' }),
  enemySprites: Object.freeze({ affinity: 'sprite.floresta.flores.guardian', applaud: 'sprite.floresta.flores.pollinator' }),
  audioProfileId: VEILED_GARDENS_AUDIO_PROFILE_ID,
  environmentId: VEILED_GARDENS_ENVIRONMENT_ID,
  effects: VEILED_GARDENS_EFFECTS,
});
