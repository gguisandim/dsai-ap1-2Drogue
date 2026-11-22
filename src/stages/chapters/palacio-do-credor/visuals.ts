import type {
  ChapterVisualResources,
  StageEffectDefinition,
  StagePresentationDefinition,
} from '../../contracts';

export const PALACIO_THEME_ID = 'theme.final.palacio.decadencia';
export const PALACIO_TILESET_ID = 'tileset.final.palacio.decadencia';
export const PALACIO_ENVIRONMENT_ID = 'environment.final.palacio.decadencia';
export const PALACIO_AUDIO_PROFILE_ID = 'audio-profile.final.palacio.decadencia';
export const PALACIO_DECAYED_VARIANT_ID = 'variant.final.palacio.decadencia';
export const PALACIO_CORRUPTED_VARIANT_ID = 'variant.final.palacio.corrompido';
export const PALACIO_CORRUPTED_THEME_ID = 'theme.final.palacio.corrompido';
export const PALACIO_CORRUPTED_TILESET_ID = 'tileset.final.palacio.corrompido';
export const PALACIO_CORRUPTED_ENVIRONMENT_ID = 'environment.final.palacio.corrompido';
export const PALACIO_CORRUPTED_AUDIO_PROFILE_ID = 'audio-profile.final.palacio.corrompido';

const WORLD = 'texture.final.palacio.puny-world';
const FLOOR_DECAYED = 'texture.final.palacio.floor-decayed';
const FLOOR_CORRUPTED = 'texture.final.palacio.floor-corrupted';
const MAGE = 'texture.final.palacio.puny-mage';
const WARRIOR = 'texture.final.palacio.puny-warrior';
const ARCHER = 'texture.final.palacio.puny-archer';
const CREDOR = 'texture.final.palacio.credor';
const GATE = 'texture.final.palacio.gate';
const TOWER = 'texture.final.palacio.tower';
const ARCADE = 'texture.final.palacio.arcade';
const DAIS = 'texture.final.palacio.dais';
const THRONE = 'texture.final.palacio.throne';
const CHAIN = 'texture.final.palacio.chain';
const SIGIL = 'texture.final.palacio.sigil';
const LEDGER = 'texture.final.palacio.ledger';
const STATUE = 'texture.final.palacio.statue';
const BANNER = 'texture.final.palacio.banner';
const CANOPY = 'texture.final.palacio.canopy';
const GLASS = 'texture.final.palacio.glass';
const ROOT_MASS = 'texture.final.palacio.root-mass';
const RUBBLE = 'texture.final.palacio.rubble';
const GATE_CORRUPTED = 'texture.final.palacio.gate-corrupted';
const TOWER_CORRUPTED = 'texture.final.palacio.tower-corrupted';
const ARCADE_CORRUPTED = 'texture.final.palacio.arcade-corrupted';
const THRONE_CORRUPTED = 'texture.final.palacio.throne-corrupted';
const SIGIL_CORRUPTED = 'texture.final.palacio.sigil-corrupted';

const ORIGINAL_ORIGIN = 'origin.final.palacio.original';
const GENERATED_ORIGIN = 'origin.final.palacio.generated';

const frame = (value: number, extra: { readonly tint?: number; readonly alpha?: number } = {}) =>
  Object.freeze({ textureId: WORLD, frame: value, ...extra });
const tile = (value: number, variants: readonly ReturnType<typeof frame>[] = [], extra: { readonly tint?: number; readonly alpha?: number } = {}) =>
  Object.freeze({ ...frame(value, extra), variants: Object.freeze(variants) });
const enemyAnimations = (prefix: 'puny_warrior' | 'puny_archer') => Object.freeze({
  walk: `${prefix}_walk`, attack: `${prefix}_attack`, hurt: `${prefix}_hurt`,
});
const credorAnimations = Object.freeze({
  walk: 'palacio_credor_walk', attack: 'palacio_credor_attack', hurt: 'palacio_credor_hurt',
});

export const PALACIO_DECAYED_EFFECTS: readonly StageEffectDefinition[] = Object.freeze([
  Object.freeze({ id: 'effect.final.palacio.fireflies', kind: 'fireflies' as const, color: 0xe8c987, alpha: 0.6, depth: 8.2, durationMs: 3600, x: 5, y: 17, width: 137, height: 24, count: 40, amplitude: 18 }),
  Object.freeze({ id: 'effect.final.palacio.mist', kind: 'mist' as const, color: 0xb8aac8, alpha: 0.08, depth: 4.1, durationMs: 9800, x: 8, y: 14, width: 132, height: 20, count: 8, amplitude: 64 }),
  Object.freeze({ id: 'effect.final.palacio.chamber-pulse', kind: 'pulse' as const, color: 0xe8c987, alpha: 0.14, depth: 7.5, durationMs: 2100, x: 104, y: 22, radius: 58, amplitude: 0.14 }),
  Object.freeze({ id: 'effect.final.palacio.gate-light', kind: 'local-light' as const, color: 0xf0d79a, alpha: 0.16, depth: 7.4, durationMs: 2600, x: 39, y: 18, radius: 70, amplitude: 0.08 }),
  Object.freeze({ id: 'effect.final.palacio.throne-light', kind: 'local-light' as const, color: 0xf0d79a, alpha: 0.2, depth: 7.45, durationMs: 2400, x: 132, y: 20, radius: 64, amplitude: 0.1 }),
  Object.freeze({ id: 'effect.final.palacio.water', kind: 'water-shimmer' as const, color: 0x9ec8d0, alpha: 0.14, depth: 2.4, durationMs: 2600, count: 24 }),
  Object.freeze({ id: 'effect.final.palacio.foliage', kind: 'foliage-sway' as const, color: 0x4f6a3a, alpha: 0.12, depth: 8, durationMs: 3800, amplitude: 1.2 }),
]);

export const PALACIO_CORRUPTED_EFFECTS: readonly StageEffectDefinition[] = Object.freeze([
  Object.freeze({ id: 'effect.final.palacio.corrupted-spores', kind: 'spirits' as const, color: 0xa6c44e, alpha: 0.5, depth: 8.4, durationMs: 4400, x: 60, y: 7, width: 70, height: 27, count: 46, amplitude: 30 }),
  Object.freeze({ id: 'effect.final.palacio.corrupted-fog', kind: 'mist' as const, color: 0x421a44, alpha: 0.26, depth: 4.1, durationMs: 7600, x: 40, y: 8, width: 110, height: 28, count: 14, amplitude: 76 }),
  Object.freeze({ id: 'effect.final.palacio.corrupted-arena', kind: 'pulse' as const, color: 0xb05070, alpha: 0.36, depth: 7.6, durationMs: 1300, x: 128, y: 23, radius: 90, amplitude: 0.32 }),
  Object.freeze({ id: 'effect.final.palacio.corrupted-chamber', kind: 'pulse' as const, color: 0xa6c44e, alpha: 0.24, depth: 7.5, durationMs: 1750, x: 104, y: 22, radius: 70, amplitude: 0.24 }),
  Object.freeze({ id: 'effect.final.palacio.corrupted-throne', kind: 'local-light' as const, color: 0xb05070, alpha: 0.26, depth: 7.45, durationMs: 1700, x: 132, y: 20, radius: 76, amplitude: 0.22 }),
  Object.freeze({ id: 'effect.final.palacio.corrupted-water', kind: 'water-shimmer' as const, color: 0x6f8f3a, alpha: 0.2, depth: 2.4, durationMs: 1900, count: 32 }),
  Object.freeze({ id: 'effect.final.palacio.corrupted-foliage', kind: 'foliage-sway' as const, color: 0x6b2f4a, alpha: 0.24, depth: 8.1, durationMs: 2200, amplitude: 2.6 }),
]);

export const PALACIO_VISUAL_RESOURCES: ChapterVisualResources = Object.freeze({
  textures: Object.freeze([
    Object.freeze({ id: WORLD, textureKey: 'puny_world', frameWidth: 16, frameHeight: 16, frameCount: 27 * 65 }),
    Object.freeze({ id: FLOOR_DECAYED, textureKey: 'palacio_floor_decayed', frameWidth: 32, frameHeight: 32, frameCount: 4, sourceWidth: 128, sourceHeight: 32, pixelArt: true, originId: ORIGINAL_ORIGIN }),
    Object.freeze({ id: FLOOR_CORRUPTED, textureKey: 'palacio_floor_corrupted', frameWidth: 32, frameHeight: 32, frameCount: 4, sourceWidth: 128, sourceHeight: 32, pixelArt: true, originId: ORIGINAL_ORIGIN }),
    Object.freeze({ id: MAGE, textureKey: 'puny_mage', frameWidth: 32, frameHeight: 32, frameCount: 24 * 8 }),
    Object.freeze({ id: WARRIOR, textureKey: 'puny_warrior_128', frameWidth: 128, frameHeight: 114, frameCount: 12 }),
    Object.freeze({ id: ARCHER, textureKey: 'puny_archer_128', frameWidth: 128, frameHeight: 114, frameCount: 12 }),
    Object.freeze({ id: CREDOR, textureKey: 'palacio_credor', frameWidth: 128, frameHeight: 114, frameCount: 12, sourceWidth: 512, sourceHeight: 342, perspective: 'top-down' as const, originId: GENERATED_ORIGIN }),
    Object.freeze({ id: GATE, textureKey: 'palacio_gate', sourceWidth: 320, sourceHeight: 256, perspective: 'top-down' as const, originId: ORIGINAL_ORIGIN }),
    Object.freeze({ id: TOWER, textureKey: 'palacio_tower', sourceWidth: 192, sourceHeight: 288, perspective: 'top-down' as const, originId: ORIGINAL_ORIGIN }),
    Object.freeze({ id: ARCADE, textureKey: 'palacio_arcade', sourceWidth: 288, sourceHeight: 176, perspective: 'top-down' as const, originId: ORIGINAL_ORIGIN }),
    Object.freeze({ id: DAIS, textureKey: 'palacio_dais', sourceWidth: 224, sourceHeight: 160, perspective: 'top-down' as const, originId: ORIGINAL_ORIGIN }),
    Object.freeze({ id: THRONE, textureKey: 'palacio_throne', sourceWidth: 160, sourceHeight: 224, perspective: 'top-down' as const, originId: ORIGINAL_ORIGIN }),
    Object.freeze({ id: CHAIN, textureKey: 'palacio_chain', sourceWidth: 96, sourceHeight: 256, perspective: 'neutral' as const, originId: ORIGINAL_ORIGIN }),
    Object.freeze({ id: SIGIL, textureKey: 'palacio_sigil', sourceWidth: 96, sourceHeight: 96, perspective: 'top-down' as const, originId: ORIGINAL_ORIGIN }),
    Object.freeze({ id: LEDGER, textureKey: 'palacio_ledger', sourceWidth: 160, sourceHeight: 112, perspective: 'top-down' as const, originId: ORIGINAL_ORIGIN }),
    Object.freeze({ id: STATUE, textureKey: 'palacio_statue', sourceWidth: 96, sourceHeight: 176, perspective: 'top-down' as const, originId: ORIGINAL_ORIGIN }),
    Object.freeze({ id: BANNER, textureKey: 'palacio_banner', sourceWidth: 96, sourceHeight: 176, perspective: 'neutral' as const, originId: ORIGINAL_ORIGIN }),
    Object.freeze({ id: CANOPY, textureKey: 'palacio_canopy', sourceWidth: 256, sourceHeight: 160, perspective: 'top-down' as const, originId: ORIGINAL_ORIGIN }),
    Object.freeze({ id: GLASS, textureKey: 'palacio_glass', sourceWidth: 128, sourceHeight: 192, perspective: 'top-down' as const, originId: ORIGINAL_ORIGIN }),
    Object.freeze({ id: ROOT_MASS, textureKey: 'palacio_root_mass', sourceWidth: 224, sourceHeight: 176, perspective: 'top-down' as const, originId: ORIGINAL_ORIGIN }),
    Object.freeze({ id: RUBBLE, textureKey: 'palacio_rubble', sourceWidth: 224, sourceHeight: 176, perspective: 'top-down' as const, originId: ORIGINAL_ORIGIN }),
    Object.freeze({ id: GATE_CORRUPTED, textureKey: 'palacio_gate_corrupted', sourceWidth: 320, sourceHeight: 256, perspective: 'top-down' as const, originId: ORIGINAL_ORIGIN }),
    Object.freeze({ id: TOWER_CORRUPTED, textureKey: 'palacio_tower_corrupted', sourceWidth: 192, sourceHeight: 288, perspective: 'top-down' as const, originId: ORIGINAL_ORIGIN }),
    Object.freeze({ id: ARCADE_CORRUPTED, textureKey: 'palacio_arcade_corrupted', sourceWidth: 288, sourceHeight: 176, perspective: 'top-down' as const, originId: ORIGINAL_ORIGIN }),
    Object.freeze({ id: THRONE_CORRUPTED, textureKey: 'palacio_throne_corrupted', sourceWidth: 160, sourceHeight: 224, perspective: 'top-down' as const, originId: ORIGINAL_ORIGIN }),
    Object.freeze({ id: SIGIL_CORRUPTED, textureKey: 'palacio_sigil_corrupted', sourceWidth: 96, sourceHeight: 96, perspective: 'top-down' as const, originId: ORIGINAL_ORIGIN }),
  ]),
  tilesets: Object.freeze([
    Object.freeze({
      id: PALACIO_TILESET_ID, revision: 1, tileSize: 32 as const,
      tiles: Object.freeze({
        floor: Object.freeze({ textureId: FLOOR_DECAYED, frame: 0, variants: Object.freeze([1, 2, 3].map(value => Object.freeze({ textureId: FLOOR_DECAYED, frame: value }))) }),
        wall: tile(190, [frame(191, { tint: 0x3a2f4a }), frame(204, { tint: 0x31283f })], { tint: 0x3a2f4a }),
        pillar: tile(197, [frame(206, { tint: 0x6a5b7e })], { tint: 0x6a5b7e }),
        water: tile(293, [frame(294, { tint: 0x3b6b74 }), frame(295, { tint: 0x2f565e })], { tint: 0x3b6b74, alpha: 0.92 }),
        lava: tile(40, [], { tint: 0x6a4636 }),
        exit: tile(714, [], { tint: 0xf0d79a }),
        'locked-door': tile(190, [], { tint: 0x4a3a5e }),
        chest: tile(815, [], { tint: 0xe0bf7c }),
        spawn: tile(1, [], { tint: 0x9a86b0 }),
        boss: tile(810, [], { tint: 0xc9a35a }),
      }),
    }),
    Object.freeze({
      id: PALACIO_CORRUPTED_TILESET_ID, revision: 1, tileSize: 32 as const,
      tiles: Object.freeze({
        floor: Object.freeze({ textureId: FLOOR_CORRUPTED, frame: 0, variants: Object.freeze([1, 2, 3].map(value => Object.freeze({ textureId: FLOOR_CORRUPTED, frame: value }))) }),
        wall: tile(204, [frame(190, { tint: 0x221a26 }), frame(783, { tint: 0x482737 })], { tint: 0x221a26 }),
        pillar: tile(783, [frame(810, { tint: 0x51405e })], { tint: 0x5c3548 }),
        water: tile(321, [frame(323, { tint: 0x3d4a2a }), frame(295, { tint: 0x5a3a4a })], { tint: 0x4a5a2e, alpha: 0.88 }),
        lava: tile(40, [], { tint: 0x7b3a2a }),
        exit: tile(714, [], { tint: 0xb8d05a }),
        'locked-door': tile(204, [], { tint: 0x3b273f }),
        chest: tile(815, [], { tint: 0xa55b74 }),
        spawn: tile(2, [], { tint: 0x6f8f3a }),
        boss: tile(810, [], { tint: 0x9a3a4a }),
      }),
    }),
  ]),
  decorations: Object.freeze([
    // Silhuetas da Decadência.
    Object.freeze({ id: 'palacio_gate', textureId: GATE, layer: 'terrain' as const, depth: 5.2, defaultScale: 1, scaleClass: 'oversized' as const }),
    Object.freeze({ id: 'palacio_tower', textureId: TOWER, layer: 'terrain' as const, depth: 4.9, defaultScale: 1, scaleClass: 'oversized' as const }),
    Object.freeze({ id: 'palacio_arcade', textureId: ARCADE, layer: 'terrain' as const, depth: 4.85, defaultScale: 1, scaleClass: 'oversized' as const }),
    Object.freeze({ id: 'palacio_dais', textureId: DAIS, layer: 'terrain' as const, depth: 3.6, defaultScale: 1, scaleClass: 'oversized' as const }),
    Object.freeze({ id: 'palacio_throne', textureId: THRONE, layer: 'terrain' as const, depth: 4.9, defaultScale: 1, scaleClass: 'oversized' as const }),
    Object.freeze({ id: 'palacio_chain', textureId: CHAIN, layer: 'terrain' as const, depth: 4.4, defaultScale: 1, scaleClass: 'oversized' as const }),
    Object.freeze({ id: 'palacio_sigil', textureId: SIGIL, layer: 'terrain' as const, depth: 3.35, defaultScale: 0.8, scaleClass: 'prop' as const }),
    Object.freeze({ id: 'palacio_ledger', textureId: LEDGER, layer: 'terrain' as const, depth: 4.25, defaultScale: 0.95, scaleClass: 'prop' as const }),
    Object.freeze({ id: 'palacio_statue', textureId: STATUE, layer: 'terrain' as const, depth: 4.3, defaultScale: 0.95, scaleClass: 'oversized' as const }),
    Object.freeze({ id: 'palacio_banner', textureId: BANNER, layer: 'foreground' as const, depth: 4.4, defaultScale: 0.9, scaleClass: 'prop' as const }),
    Object.freeze({ id: 'palacio_canopy', textureId: CANOPY, layer: 'background' as const, depth: 2.1, defaultScale: 1.1, scaleClass: 'oversized' as const }),
    Object.freeze({ id: 'palacio_glass', textureId: GLASS, layer: 'background' as const, depth: 3.2, defaultScale: 0.9, scaleClass: 'oversized' as const }),
    Object.freeze({ id: 'palacio_root_mass', textureId: ROOT_MASS, layer: 'terrain' as const, depth: 4.35, defaultScale: 0.9, scaleClass: 'oversized' as const }),
    Object.freeze({ id: 'palacio_rubble', textureId: RUBBLE, layer: 'terrain' as const, depth: 4.2, defaultScale: 0.8, scaleClass: 'oversized' as const }),
    // Silhuetas próprias da Corrupção.
    Object.freeze({ id: 'palacio_gate_corrupted', textureId: GATE_CORRUPTED, layer: 'terrain' as const, depth: 5.2, defaultScale: 1, scaleClass: 'oversized' as const }),
    Object.freeze({ id: 'palacio_tower_corrupted', textureId: TOWER_CORRUPTED, layer: 'terrain' as const, depth: 4.9, defaultScale: 1, scaleClass: 'oversized' as const }),
    Object.freeze({ id: 'palacio_arcade_corrupted', textureId: ARCADE_CORRUPTED, layer: 'terrain' as const, depth: 4.85, defaultScale: 1, scaleClass: 'oversized' as const }),
    Object.freeze({ id: 'palacio_throne_corrupted', textureId: THRONE_CORRUPTED, layer: 'terrain' as const, depth: 4.9, defaultScale: 1, scaleClass: 'oversized' as const }),
    Object.freeze({ id: 'palacio_sigil_corrupted', textureId: SIGIL_CORRUPTED, layer: 'terrain' as const, depth: 3.35, defaultScale: 0.8, scaleClass: 'prop' as const }),
    Object.freeze({ id: 'palacio_dais_corrupted', textureId: DAIS, layer: 'terrain' as const, depth: 3.6, defaultScale: 1, scaleClass: 'oversized' as const, tint: 0x5a2a3a }),
    Object.freeze({ id: 'palacio_chain_corrupted', textureId: CHAIN, layer: 'terrain' as const, depth: 4.4, defaultScale: 1, scaleClass: 'oversized' as const, tint: 0x7f9440 }),
    Object.freeze({ id: 'palacio_ledger_corrupted', textureId: LEDGER, layer: 'terrain' as const, depth: 4.25, defaultScale: 0.95, scaleClass: 'prop' as const, tint: 0x8a7a6a }),
    Object.freeze({ id: 'palacio_statue_corrupted', textureId: STATUE, layer: 'terrain' as const, depth: 4.3, defaultScale: 0.95, scaleClass: 'oversized' as const, tint: 0x7a8a5a }),
    Object.freeze({ id: 'palacio_banner_corrupted', textureId: BANNER, layer: 'foreground' as const, depth: 4.4, defaultScale: 0.9, scaleClass: 'prop' as const, tint: 0x8a3a4a }),
    Object.freeze({ id: 'palacio_canopy_corrupted', textureId: CANOPY, layer: 'background' as const, depth: 2.1, defaultScale: 1.1, scaleClass: 'oversized' as const, tint: 0x4a2a3e }),
    Object.freeze({ id: 'palacio_glass_corrupted', textureId: GLASS, layer: 'background' as const, depth: 3.2, defaultScale: 0.9, scaleClass: 'oversized' as const, tint: 0x6a3a5a }),
  ]),
  sprites: Object.freeze([
    Object.freeze({ id: 'sprite.final.palacio.lacaio', textureId: WARRIOR, animations: enemyAnimations('puny_warrior'), tint: 0x9a86b0, scale: 1, depth: 5 }),
    Object.freeze({ id: 'sprite.final.palacio.arqueiro', textureId: ARCHER, animations: enemyAnimations('puny_archer'), tint: 0xb6a4c8, scale: 1, depth: 5 }),
    Object.freeze({ id: 'sprite.final.palacio.miniboss', textureId: WARRIOR, animations: enemyAnimations('puny_warrior'), tint: 0xd8b06a, scale: 1, depth: 5 }),
    Object.freeze({ id: 'sprite.final.palacio.credor', textureId: CREDOR, animations: credorAnimations, tint: 0xd8c8a8, scale: 1, depth: 5 }),
    Object.freeze({ id: 'sprite.final.palacio.arua', textureId: MAGE, animations: Object.freeze({ idle: 'puny_mage_idle' }), tint: 0xe7dcc4, scale: 1.5, depth: 6 }),
    Object.freeze({ id: 'sprite.final.palacio.eco', textureId: SIGIL, tint: 0x9ec8d0, scale: 0.9, depth: 6 }),
    Object.freeze({ id: 'sprite.final.palacio.sentinela', textureId: STATUE, tint: 0xb0a090, scale: 0.9, depth: 6 }),
    Object.freeze({ id: 'sprite.final.palacio.corrupted.lacaio', textureId: WARRIOR, animations: enemyAnimations('puny_warrior'), tint: 0x8f4e62, scale: 1, depth: 5 }),
    Object.freeze({ id: 'sprite.final.palacio.corrupted.arqueiro', textureId: ARCHER, animations: enemyAnimations('puny_archer'), tint: 0xb1cf55, scale: 1, depth: 5 }),
    Object.freeze({ id: 'sprite.final.palacio.corrupted.miniboss', textureId: WARRIOR, animations: enemyAnimations('puny_warrior'), tint: 0xb05070, scale: 1, depth: 5 }),
    Object.freeze({ id: 'sprite.final.palacio.corrupted.credor', textureId: CREDOR, animations: credorAnimations, tint: 0x9a6a5a, scale: 1, depth: 5 }),
    Object.freeze({ id: 'sprite.final.palacio.corrupted.arua', textureId: MAGE, animations: Object.freeze({ idle: 'puny_mage_idle' }), tint: 0xc18bb9, scale: 1.5, depth: 6 }),
    Object.freeze({ id: 'sprite.final.palacio.corrupted.eco', textureId: SIGIL_CORRUPTED, tint: 0xb05070, scale: 0.9, depth: 6 }),
    Object.freeze({ id: 'sprite.final.palacio.corrupted.sentinela', textureId: STATUE, tint: 0x7a8a5a, scale: 0.9, depth: 6 }),
  ]),
  sounds: Object.freeze([
    Object.freeze({ id: 'sound.final.palacio.hum', kind: 'synth' as const, waveform: 'sine' as const, frequency: 110, volume: 0.024 }),
    Object.freeze({ id: 'sound.final.palacio.stone', kind: 'synth' as const, waveform: 'triangle' as const, frequency: 55, volume: 0.016 }),
    Object.freeze({ id: 'sound.final.palacio.chime', kind: 'synth' as const, waveform: 'sine' as const, frequency: 440, volume: 0.05 }),
    Object.freeze({ id: 'sound.final.palacio.corrupted-drone', kind: 'synth' as const, waveform: 'sawtooth' as const, frequency: 49, volume: 0.02 }),
    Object.freeze({ id: 'sound.final.palacio.whisper', kind: 'synth' as const, waveform: 'square' as const, frequency: 82, volume: 0.012 }),
    Object.freeze({ id: 'sound.final.palacio.corrupted-chime', kind: 'synth' as const, waveform: 'triangle' as const, frequency: 233, volume: 0.045 }),
  ]),
  audioProfiles: Object.freeze([
    Object.freeze({ id: PALACIO_AUDIO_PROFILE_ID, musicSoundId: 'sound.final.palacio.hum', ambientSoundId: 'sound.final.palacio.stone', eventSoundIds: Object.freeze({ 'stage.entered': 'sound.final.palacio.chime', 'npc.interacted': 'sound.final.palacio.chime' }), masterVolume: 0.58 }),
    Object.freeze({ id: PALACIO_CORRUPTED_AUDIO_PROFILE_ID, musicSoundId: 'sound.final.palacio.corrupted-drone', ambientSoundId: 'sound.final.palacio.whisper', eventSoundIds: Object.freeze({ 'stage.entered': 'sound.final.palacio.corrupted-chime', 'npc.interacted': 'sound.final.palacio.corrupted-chime', 'enemy.defeated': 'sound.final.palacio.corrupted-chime' }), masterVolume: 0.5 }),
  ]),
  environments: Object.freeze([
    Object.freeze({ id: PALACIO_ENVIRONMENT_ID, ambientColor: 0x1d1826, lightIntensity: 0.62, fog: Object.freeze({ color: 0x211a2c, opacity: 0.08, depth: 3.5 }) }),
    Object.freeze({ id: PALACIO_CORRUPTED_ENVIRONMENT_ID, ambientColor: 0x1a1020, lightIntensity: 0.38, fog: Object.freeze({ color: 0x2a1430, opacity: 0.26, depth: 3.55 }) }),
  ]),
  themes: Object.freeze([
    Object.freeze({
      id: PALACIO_THEME_ID, revision: 2, tilesetId: PALACIO_TILESET_ID,
      decorationIds: Object.freeze([
        'palacio_gate', 'palacio_tower', 'palacio_arcade', 'palacio_dais', 'palacio_throne',
        'palacio_chain', 'palacio_sigil', 'palacio_ledger', 'palacio_statue', 'palacio_banner',
        'palacio_canopy', 'palacio_glass', 'palacio_rubble',
      ]),
      decorationOverrides: Object.freeze({ palacio_root_mass: 'palacio_rubble' }),
    }),
    Object.freeze({
      id: PALACIO_CORRUPTED_THEME_ID, revision: 1, tilesetId: PALACIO_CORRUPTED_TILESET_ID,
      decorationIds: Object.freeze([
        'palacio_gate_corrupted', 'palacio_tower_corrupted', 'palacio_arcade_corrupted',
        'palacio_dais_corrupted', 'palacio_throne_corrupted', 'palacio_chain_corrupted',
        'palacio_sigil_corrupted', 'palacio_ledger_corrupted', 'palacio_statue_corrupted',
        'palacio_banner_corrupted', 'palacio_canopy_corrupted', 'palacio_glass_corrupted',
        'palacio_root_mass',
      ]),
      decorationOverrides: Object.freeze({
        palacio_gate: 'palacio_gate_corrupted',
        palacio_tower: 'palacio_tower_corrupted',
        palacio_arcade: 'palacio_arcade_corrupted',
        palacio_dais: 'palacio_dais_corrupted',
        palacio_throne: 'palacio_throne_corrupted',
        palacio_chain: 'palacio_chain_corrupted',
        palacio_sigil: 'palacio_sigil_corrupted',
        palacio_ledger: 'palacio_ledger_corrupted',
        palacio_statue: 'palacio_statue_corrupted',
        palacio_banner: 'palacio_banner_corrupted',
        palacio_canopy: 'palacio_canopy_corrupted',
        palacio_glass: 'palacio_glass_corrupted',
        palacio_rubble: 'palacio_root_mass',
      }),
    }),
  ]),
});

export const PALACIO_DECAYED_PRESENTATION: StagePresentationDefinition = Object.freeze({
  themeId: PALACIO_THEME_ID,
  tilesetId: PALACIO_TILESET_ID,
  npcSprites: Object.freeze({
    'environment.final.palacio.arua': 'sprite.final.palacio.arua',
    'environment.final.palacio.eco': 'sprite.final.palacio.eco',
    'environment.final.palacio.sentinela': 'sprite.final.palacio.sentinela',
  }),
  enemySprites: Object.freeze({
    affinity: 'sprite.final.palacio.lacaio',
    applaud: 'sprite.final.palacio.arqueiro',
    miniboss: 'sprite.final.palacio.miniboss',
    boss: 'sprite.final.palacio.credor',
  }),
  audioProfileId: PALACIO_AUDIO_PROFILE_ID,
  environmentId: PALACIO_ENVIRONMENT_ID,
  effects: PALACIO_DECAYED_EFFECTS,
});

export const PALACIO_CORRUPTED_PRESENTATION: StagePresentationDefinition = Object.freeze({
  themeId: PALACIO_CORRUPTED_THEME_ID,
  tilesetId: PALACIO_CORRUPTED_TILESET_ID,
  npcSprites: Object.freeze({
    'environment.final.palacio.arua': 'sprite.final.palacio.corrupted.arua',
    'environment.final.palacio.eco': 'sprite.final.palacio.corrupted.eco',
    'environment.final.palacio.sentinela': 'sprite.final.palacio.corrupted.sentinela',
  }),
  enemySprites: Object.freeze({
    affinity: 'sprite.final.palacio.corrupted.lacaio',
    applaud: 'sprite.final.palacio.corrupted.arqueiro',
    miniboss: 'sprite.final.palacio.corrupted.miniboss',
    boss: 'sprite.final.palacio.corrupted.credor',
  }),
  audioProfileId: PALACIO_CORRUPTED_AUDIO_PROFILE_ID,
  environmentId: PALACIO_CORRUPTED_ENVIRONMENT_ID,
  effects: PALACIO_CORRUPTED_EFFECTS,
});

/** The Decadência presentation remains the default. */
export const PALACIO_PRESENTATION = PALACIO_DECAYED_PRESENTATION;

export const PALACIO_PRESENTATION_VARIANTS: Readonly<Record<string, StagePresentationDefinition>> =
  Object.freeze({
    [PALACIO_DECAYED_VARIANT_ID]: PALACIO_DECAYED_PRESENTATION,
    [PALACIO_CORRUPTED_VARIANT_ID]: PALACIO_CORRUPTED_PRESENTATION,
  });
