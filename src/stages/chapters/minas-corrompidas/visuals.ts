import type {
  ChapterVisualResources,
  StageEffectDefinition,
  StagePresentationDefinition,
} from '../../contracts';

export const MINAS_ABANDONED_VARIANT_ID = 'variant.corrupted.minas.abandoned';
export const MINAS_CORRUPTED_VARIANT_ID = 'variant.corrupted.minas.corrupted';
export const MINAS_ABANDONED_THEME_ID = 'theme.corrupted.minas.abandoned';
export const MINAS_CORRUPTED_THEME_ID = 'theme.corrupted.minas.corrupted';
export const MINAS_ABANDONED_TILESET_ID = 'tileset.corrupted.minas.abandoned';
export const MINAS_CORRUPTED_TILESET_ID = 'tileset.corrupted.minas.corrupted';
export const MINAS_ABANDONED_ENVIRONMENT_ID = 'environment.corrupted.minas.abandoned';
export const MINAS_CORRUPTED_ENVIRONMENT_ID = 'environment.corrupted.minas.corrupted';
export const MINAS_ABANDONED_AUDIO_ID = 'audio-profile.corrupted.minas.abandoned';
export const MINAS_CORRUPTED_AUDIO_ID = 'audio-profile.corrupted.minas.corrupted';

const WORLD = 'texture.corrupted.minas.puny-world';
const FLOOR_ABANDONED = 'texture.corrupted.minas.floor-abandoned';
const FLOOR_CORRUPTED = 'texture.corrupted.minas.floor-corrupted';
const PANORAMA_ABANDONED = 'texture.corrupted.minas.panorama-abandoned';
const PANORAMA_CORRUPTED = 'texture.corrupted.minas.panorama-corrupted';
const TIMBER = 'texture.corrupted.minas.timber';
const TIMBER_CORRUPTED = 'texture.corrupted.minas.timber-corrupted';
const RAILS = 'texture.corrupted.minas.rails';
const ROOTS = 'texture.corrupted.minas.roots';
const ROOTS_CORRUPTED = 'texture.corrupted.minas.roots-corrupted';
const CRYSTALS = 'texture.corrupted.minas.crystals';
const CRYSTALS_CORRUPTED = 'texture.corrupted.minas.crystals-corrupted';
const FUNGI = 'texture.corrupted.minas.fungi';
const MACHINERY = 'texture.corrupted.minas.machinery';
const CORE = 'texture.corrupted.minas.core';
const SEAL = 'texture.corrupted.minas.seal';
const MAIRA = 'texture.corrupted.minas.maira';
const NILO = 'texture.corrupted.minas.nilo';
const EVIDENCE = 'texture.corrupted.minas.evidence';
const LEDGER = 'texture.corrupted.minas.ledger';
const MOLE = 'texture.corrupted.minas.mole';
const ROOTLING = 'texture.corrupted.minas.rootling';
const GUARDIAN = 'texture.corrupted.minas.guardian';
const HEART = 'texture.corrupted.minas.heart';
const ORIGINAL_ORIGIN = 'origin.corrupted.minas.original';
const IMAGEGEN_ORIGIN = 'origin.corrupted.minas.imagegen';

const frame = (value: number, extra: { readonly tint?: number; readonly alpha?: number } = {}) =>
  Object.freeze({ textureId: WORLD, frame: value, ...extra });
const tile = (value: number, variants: readonly ReturnType<typeof frame>[] = [], extra: { readonly tint?: number; readonly alpha?: number } = {}) =>
  Object.freeze({ ...frame(value, extra), variants: Object.freeze(variants) });

export const MINAS_ABANDONED_EFFECTS: readonly StageEffectDefinition[] = Object.freeze([
  Object.freeze({ id: 'effect.corrupted.minas.abandoned-mist', kind: 'mist' as const, color: 0x8fb7b5, alpha: 0.1, depth: 3.4, durationMs: 9200, x: 20, y: 10, width: 135, height: 29, count: 9, amplitude: 70 }),
  Object.freeze({ id: 'effect.corrupted.minas.water', kind: 'water-shimmer' as const, color: 0x64b5b0, alpha: 0.2, depth: 2.5, durationMs: 2800, count: 30 }),
  Object.freeze({ id: 'effect.corrupted.minas.roots', kind: 'foliage-sway' as const, color: 0x597d45, alpha: 0.14, depth: 7.8, durationMs: 4100, amplitude: 1.3 }),
  Object.freeze({ id: 'effect.corrupted.minas.aruma', kind: 'local-light' as const, color: 0xd4ad65, alpha: 0.18, depth: 7.4, durationMs: 2600, x: 63, y: 24, radius: 58, amplitude: 0.08 }),
]);

export const MINAS_CORRUPTED_EFFECTS: readonly StageEffectDefinition[] = Object.freeze([
  Object.freeze({ id: 'effect.corrupted.minas.spores', kind: 'spirits' as const, color: 0x66d7c2, alpha: 0.5, depth: 8.5, durationMs: 3900, x: 72, y: 10, width: 80, height: 30, count: 54, amplitude: 28 }),
  Object.freeze({ id: 'effect.corrupted.minas.oppressive-fog', kind: 'mist' as const, color: 0x281b31, alpha: 0.3, depth: 3.5, durationMs: 7200, x: 55, y: 8, width: 108, height: 34, count: 16, amplitude: 82 }),
  Object.freeze({ id: 'effect.corrupted.minas.core-pulse', kind: 'pulse' as const, color: 0x43c7b3, alpha: 0.42, depth: 7.7, durationMs: 1250, x: 132, y: 30, radius: 96, amplitude: 0.34 }),
  Object.freeze({ id: 'effect.corrupted.minas.mineral-light', kind: 'local-light' as const, color: 0xd07150, alpha: 0.3, depth: 7.5, durationMs: 1700, x: 106, y: 32, radius: 74, amplitude: 0.23 }),
  Object.freeze({ id: 'effect.corrupted.minas.polluted-water', kind: 'water-shimmer' as const, color: 0x329c94, alpha: 0.25, depth: 2.5, durationMs: 1800, count: 38 }),
]);

const texture = (id: string, textureKey: string, sourceWidth: number, sourceHeight: number, originId = ORIGINAL_ORIGIN) =>
  Object.freeze({ id, textureKey, sourceWidth, sourceHeight, perspective: 'side-view' as const, originId });
const staticAnimations = (prefix: string) => Object.freeze({
  walk: `${prefix}_walk`, attack: `${prefix}_attack`, hurt: `${prefix}_hurt`,
});

export const MINAS_VISUAL_RESOURCES: ChapterVisualResources = Object.freeze({
  textures: Object.freeze([
    Object.freeze({ id: WORLD, textureKey: 'puny_world', frameWidth: 16, frameHeight: 16, frameCount: 27 * 65 }),
    Object.freeze({ id: FLOOR_ABANDONED, textureKey: 'minas_floor_abandoned', frameWidth: 32, frameHeight: 32, frameCount: 4, sourceWidth: 128, sourceHeight: 32, pixelArt: true, originId: ORIGINAL_ORIGIN }),
    Object.freeze({ id: FLOOR_CORRUPTED, textureKey: 'minas_floor_corrupted', frameWidth: 32, frameHeight: 32, frameCount: 4, sourceWidth: 128, sourceHeight: 32, pixelArt: true, originId: ORIGINAL_ORIGIN }),
    texture(PANORAMA_ABANDONED, 'minas_panorama_abandoned', 2172, 724, IMAGEGEN_ORIGIN),
    texture(PANORAMA_CORRUPTED, 'minas_panorama_corrupted', 2172, 724, IMAGEGEN_ORIGIN),
    texture(TIMBER, 'minas_timber', 224, 176),
    texture(TIMBER_CORRUPTED, 'minas_timber_corrupted', 224, 176),
    texture(RAILS, 'minas_rails', 256, 96),
    texture(ROOTS, 'minas_roots', 256, 192),
    texture(ROOTS_CORRUPTED, 'minas_roots_corrupted', 256, 192),
    texture(CRYSTALS, 'minas_crystals', 160, 144),
    texture(CRYSTALS_CORRUPTED, 'minas_crystals_corrupted', 192, 176),
    texture(FUNGI, 'minas_fungi', 192, 144),
    texture(MACHINERY, 'minas_machinery', 288, 224),
    texture(CORE, 'minas_core', 320, 256),
    texture(SEAL, 'minas_seal', 128, 128),
    texture(MAIRA, 'minas_maira', 64, 80),
    texture(NILO, 'minas_nilo', 64, 80),
    texture(EVIDENCE, 'minas_evidence', 80, 80),
    texture(LEDGER, 'minas_ledger', 96, 72),
    texture(MOLE, 'minas_mole', 80, 64),
    texture(ROOTLING, 'minas_rootling', 80, 80),
    texture(GUARDIAN, 'minas_guardian', 96, 96),
    texture(HEART, 'minas_heart', 128, 128),
  ]),
  tilesets: Object.freeze([
    Object.freeze({
      id: MINAS_ABANDONED_TILESET_ID, revision: 1, tileSize: 32 as const,
      tiles: Object.freeze({
        floor: Object.freeze({ textureId: FLOOR_ABANDONED, frame: 0, variants: Object.freeze([1, 2, 3].map(value => Object.freeze({ textureId: FLOOR_ABANDONED, frame: value }))) }),
        wall: tile(204, [frame(190, { tint: 0x26373b }), frame(191, { tint: 0x31464a })], { tint: 0x26373b }),
        pillar: tile(197, [frame(206, { tint: 0x60432c })], { tint: 0x60432c }),
        water: tile(293, [frame(294, { tint: 0x397c7b }), frame(295, { tint: 0x4a9490 })], { tint: 0x397c7b, alpha: 0.92 }),
        lava: tile(40, [], { tint: 0x8d6a38 }),
        exit: tile(714, [], { tint: 0xd4b06a }),
        'locked-door': tile(190, [], { tint: 0x3b3027 }),
        chest: tile(815, [], { tint: 0x9c713d }),
        spawn: tile(1, [], { tint: 0x608a68 }),
        boss: tile(810, [], { tint: 0xb88a48 }),
      }),
    }),
    Object.freeze({
      id: MINAS_CORRUPTED_TILESET_ID, revision: 1, tileSize: 32 as const,
      tiles: Object.freeze({
        floor: Object.freeze({ textureId: FLOOR_CORRUPTED, frame: 0, variants: Object.freeze([1, 2, 3].map(value => Object.freeze({ textureId: FLOOR_CORRUPTED, frame: value }))) }),
        wall: tile(204, [frame(783, { tint: 0x213636 }), frame(190, { tint: 0x281c2b })], { tint: 0x172729 }),
        pillar: tile(783, [frame(810, { tint: 0x4a2738 })], { tint: 0x294c49 }),
        water: tile(321, [frame(323, { tint: 0x267f79 }), frame(295, { tint: 0x513348 })], { tint: 0x267f79, alpha: 0.86 }),
        lava: tile(40, [], { tint: 0xb55c3d }),
        exit: tile(714, [], { tint: 0x54d4bd }),
        'locked-door': tile(204, [], { tint: 0x311f33 }),
        chest: tile(815, [], { tint: 0xc16a4a }),
        spawn: tile(2, [], { tint: 0x45a99a }),
        boss: tile(810, [], { tint: 0xc25268 }),
      }),
    }),
  ]),
  decorations: Object.freeze([
    Object.freeze({ id: 'mina_panorama', textureId: PANORAMA_ABANDONED, layer: 'background' as const, depth: 1.4, defaultScale: 0.34, scaleClass: 'oversized' as const }),
    Object.freeze({ id: 'mina_panorama_corrupted', textureId: PANORAMA_CORRUPTED, layer: 'background' as const, depth: 1.4, defaultScale: 0.34, scaleClass: 'oversized' as const }),
    Object.freeze({ id: 'mina_timber', textureId: TIMBER, layer: 'terrain' as const, depth: 4.5, defaultScale: 0.82, scaleClass: 'oversized' as const }),
    Object.freeze({ id: 'mina_timber_corrupted', textureId: TIMBER_CORRUPTED, layer: 'terrain' as const, depth: 4.5, defaultScale: 0.82, scaleClass: 'oversized' as const }),
    Object.freeze({ id: 'mina_rails', textureId: RAILS, layer: 'terrain' as const, depth: 3.7, defaultScale: 0.8, scaleClass: 'oversized' as const }),
    Object.freeze({ id: 'mina_rails_corrupted', textureId: RAILS, layer: 'terrain' as const, depth: 3.7, defaultScale: 0.8, scaleClass: 'oversized' as const, tint: 0x5f8f86 }),
    Object.freeze({ id: 'mina_roots', textureId: ROOTS, layer: 'terrain' as const, depth: 4.25, defaultScale: 0.9, scaleClass: 'oversized' as const }),
    Object.freeze({ id: 'mina_roots_corrupted', textureId: ROOTS_CORRUPTED, layer: 'terrain' as const, depth: 4.25, defaultScale: 0.9, scaleClass: 'oversized' as const }),
    Object.freeze({ id: 'mina_crystals', textureId: CRYSTALS, layer: 'terrain' as const, depth: 4.1, defaultScale: 0.75, scaleClass: 'oversized' as const }),
    Object.freeze({ id: 'mina_crystals_corrupted', textureId: CRYSTALS_CORRUPTED, layer: 'terrain' as const, depth: 4.1, defaultScale: 0.8, scaleClass: 'oversized' as const }),
    Object.freeze({ id: 'mina_fungi', textureId: FUNGI, layer: 'foreground' as const, depth: 4.35, defaultScale: 0.62, scaleClass: 'oversized' as const }),
    Object.freeze({ id: 'mina_fungi_corrupted', textureId: FUNGI, layer: 'foreground' as const, depth: 4.35, defaultScale: 0.62, scaleClass: 'oversized' as const, tint: 0x9ae6cf }),
    Object.freeze({ id: 'mina_machinery', textureId: MACHINERY, layer: 'terrain' as const, depth: 4.55, defaultScale: 0.83, scaleClass: 'oversized' as const }),
    Object.freeze({ id: 'mina_machinery_corrupted', textureId: MACHINERY, layer: 'terrain' as const, depth: 4.55, defaultScale: 0.83, scaleClass: 'oversized' as const, tint: 0x5e8b80 }),
    Object.freeze({ id: 'mina_core', textureId: CORE, layer: 'terrain' as const, depth: 4.8, defaultScale: 0.88, scaleClass: 'oversized' as const }),
    Object.freeze({ id: 'mina_seal', textureId: SEAL, layer: 'terrain' as const, depth: 4.7, defaultScale: 0.65, scaleClass: 'prop' as const }),
    Object.freeze({ id: 'mina_seal_corrupted', textureId: SEAL, layer: 'terrain' as const, depth: 4.7, defaultScale: 0.72, scaleClass: 'prop' as const, tint: 0x68c9b7 }),
  ]),
  sprites: Object.freeze([
    Object.freeze({ id: 'sprite.corrupted.minas.maira', textureId: MAIRA, scale: 0.9, depth: 6, scaleClass: 'character' as const }),
    Object.freeze({ id: 'sprite.corrupted.minas.nilo', textureId: NILO, scale: 0.9, depth: 6, scaleClass: 'character' as const }),
    Object.freeze({ id: 'sprite.corrupted.minas.aquifer', textureId: EVIDENCE, scale: 0.8, depth: 6, scaleClass: 'prop' as const }),
    Object.freeze({ id: 'sprite.corrupted.minas.ledger', textureId: LEDGER, scale: 0.8, depth: 6, scaleClass: 'prop' as const }),
    Object.freeze({ id: 'sprite.corrupted.minas.mole', textureId: MOLE, animations: staticAnimations('minas_mole'), scale: 0.78, depth: 5, scaleClass: 'character' as const }),
    Object.freeze({ id: 'sprite.corrupted.minas.rootling', textureId: ROOTLING, animations: staticAnimations('minas_rootling'), scale: 0.76, depth: 5, scaleClass: 'character' as const }),
    Object.freeze({ id: 'sprite.corrupted.minas.guardian', textureId: GUARDIAN, animations: staticAnimations('minas_guardian'), scale: 0.82, depth: 5, scaleClass: 'character' as const }),
    Object.freeze({ id: 'sprite.corrupted.minas.heart', textureId: HEART, animations: staticAnimations('minas_heart'), scale: 0.9, depth: 5, scaleClass: 'character' as const }),
    Object.freeze({ id: 'sprite.corrupted.minas.corrupted-mole', textureId: MOLE, animations: staticAnimations('minas_mole'), tint: 0x52c7b4, scale: 0.82, depth: 5, scaleClass: 'character' as const }),
    Object.freeze({ id: 'sprite.corrupted.minas.corrupted-rootling', textureId: ROOTLING, animations: staticAnimations('minas_rootling'), tint: 0xd06d54, scale: 0.82, depth: 5, scaleClass: 'character' as const }),
  ]),
  sounds: Object.freeze([
    Object.freeze({ id: 'sound.corrupted.minas.drip', kind: 'synth' as const, waveform: 'sine' as const, frequency: 174, volume: 0.018 }),
    Object.freeze({ id: 'sound.corrupted.minas.timbers', kind: 'synth' as const, waveform: 'triangle' as const, frequency: 58, volume: 0.018 }),
    Object.freeze({ id: 'sound.corrupted.minas.chime', kind: 'synth' as const, waveform: 'sine' as const, frequency: 392, volume: 0.046 }),
    Object.freeze({ id: 'sound.corrupted.minas.core-drone', kind: 'synth' as const, waveform: 'sawtooth' as const, frequency: 46, volume: 0.021 }),
    Object.freeze({ id: 'sound.corrupted.minas.spores', kind: 'synth' as const, waveform: 'square' as const, frequency: 73, volume: 0.011 }),
    Object.freeze({ id: 'sound.corrupted.minas.pulse', kind: 'synth' as const, waveform: 'triangle' as const, frequency: 220, volume: 0.05 }),
  ]),
  audioProfiles: Object.freeze([
    Object.freeze({ id: MINAS_ABANDONED_AUDIO_ID, musicSoundId: 'sound.corrupted.minas.timbers', ambientSoundId: 'sound.corrupted.minas.drip', eventSoundIds: Object.freeze({ 'stage.entered': 'sound.corrupted.minas.chime', 'npc.interacted': 'sound.corrupted.minas.chime' }), masterVolume: 0.55 }),
    Object.freeze({ id: MINAS_CORRUPTED_AUDIO_ID, musicSoundId: 'sound.corrupted.minas.core-drone', ambientSoundId: 'sound.corrupted.minas.spores', eventSoundIds: Object.freeze({ 'stage.entered': 'sound.corrupted.minas.pulse', 'npc.interacted': 'sound.corrupted.minas.pulse', 'enemy.defeated': 'sound.corrupted.minas.pulse' }), masterVolume: 0.49 }),
  ]),
  environments: Object.freeze([
    Object.freeze({ id: MINAS_ABANDONED_ENVIRONMENT_ID, ambientColor: 0x17292b, lightIntensity: 0.58, fog: Object.freeze({ color: 0x1b3437, opacity: 0.1, depth: 3.45 }) }),
    Object.freeze({ id: MINAS_CORRUPTED_ENVIRONMENT_ID, ambientColor: 0x111d20, lightIntensity: 0.36, fog: Object.freeze({ color: 0x24182b, opacity: 0.3, depth: 3.5 }) }),
  ]),
  themes: Object.freeze([
    Object.freeze({
      id: MINAS_ABANDONED_THEME_ID, revision: 1, tilesetId: MINAS_ABANDONED_TILESET_ID,
      decorationIds: Object.freeze(['mina_panorama', 'mina_timber', 'mina_rails', 'mina_roots', 'mina_crystals', 'mina_fungi', 'mina_machinery', 'mina_seal']),
      decorationOverrides: Object.freeze({ mina_core: 'mina_machinery' }),
    }),
    Object.freeze({
      id: MINAS_CORRUPTED_THEME_ID, revision: 1, tilesetId: MINAS_CORRUPTED_TILESET_ID,
      decorationIds: Object.freeze(['mina_panorama_corrupted', 'mina_timber_corrupted', 'mina_rails_corrupted', 'mina_roots_corrupted', 'mina_crystals_corrupted', 'mina_fungi_corrupted', 'mina_machinery_corrupted', 'mina_core', 'mina_seal_corrupted']),
      decorationOverrides: Object.freeze({
        mina_panorama: 'mina_panorama_corrupted',
        mina_timber: 'mina_timber_corrupted',
        mina_rails: 'mina_rails_corrupted',
        mina_roots: 'mina_roots_corrupted',
        mina_crystals: 'mina_crystals_corrupted',
        mina_fungi: 'mina_fungi_corrupted',
        mina_machinery: 'mina_machinery_corrupted',
        mina_seal: 'mina_seal_corrupted',
      }),
    }),
  ]),
});

export const MINAS_ABANDONED_PRESENTATION: StagePresentationDefinition = Object.freeze({
  themeId: MINAS_ABANDONED_THEME_ID,
  tilesetId: MINAS_ABANDONED_TILESET_ID,
  npcSprites: Object.freeze({
    'environment.corrupted.minas.maira': 'sprite.corrupted.minas.maira',
    'environment.corrupted.minas.nilo': 'sprite.corrupted.minas.nilo',
    'environment.corrupted.minas.aquifer': 'sprite.corrupted.minas.aquifer',
    'environment.corrupted.minas.ledger': 'sprite.corrupted.minas.ledger',
  }),
  enemySprites: Object.freeze({
    affinity: 'sprite.corrupted.minas.mole',
    applaud: 'sprite.corrupted.minas.rootling',
    ranged: 'sprite.corrupted.minas.rootling',
    miniboss: 'sprite.corrupted.minas.guardian',
    boss: 'sprite.corrupted.minas.heart',
  }),
  audioProfileId: MINAS_ABANDONED_AUDIO_ID,
  environmentId: MINAS_ABANDONED_ENVIRONMENT_ID,
  effects: MINAS_ABANDONED_EFFECTS,
});

export const MINAS_CORRUPTED_PRESENTATION: StagePresentationDefinition = Object.freeze({
  themeId: MINAS_CORRUPTED_THEME_ID,
  tilesetId: MINAS_CORRUPTED_TILESET_ID,
  npcSprites: MINAS_ABANDONED_PRESENTATION.npcSprites,
  enemySprites: Object.freeze({
    affinity: 'sprite.corrupted.minas.corrupted-mole',
    applaud: 'sprite.corrupted.minas.corrupted-rootling',
    ranged: 'sprite.corrupted.minas.corrupted-rootling',
    miniboss: 'sprite.corrupted.minas.guardian',
    boss: 'sprite.corrupted.minas.heart',
  }),
  audioProfileId: MINAS_CORRUPTED_AUDIO_ID,
  environmentId: MINAS_CORRUPTED_ENVIRONMENT_ID,
  effects: MINAS_CORRUPTED_EFFECTS,
});

export const MINAS_PRESENTATION = MINAS_ABANDONED_PRESENTATION;
export const MINAS_PRESENTATION_VARIANTS: Readonly<Record<string, StagePresentationDefinition>> =
  Object.freeze({
    [MINAS_ABANDONED_VARIANT_ID]: MINAS_ABANDONED_PRESENTATION,
    [MINAS_CORRUPTED_VARIANT_ID]: MINAS_CORRUPTED_PRESENTATION,
  });

