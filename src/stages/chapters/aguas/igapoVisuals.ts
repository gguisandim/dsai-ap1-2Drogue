import type {
  ChapterVisualResources,
  StagePresentationDefinition,
} from '../../contracts';

export const IGAPO_RIBEIRINHO_VARIANT_ID = 'variant.aguas.igapo-ribeirinho';
export const IGAPO_SOMBRIO_VARIANT_ID = 'variant.aguas.igapo-sombrio';

export const IGAPO_VISUAL_THEME_ID = 'theme.aguas.igapo';
export const IGAPO_VISUAL_TILESET_ID = 'tileset.aguas.igapo-technical';
export const IGAPO_SOMBRIO_THEME_ID = 'theme.aguas.igapo-sombrio';
export const IGAPO_SOMBRIO_TILESET_ID = 'tileset.aguas.igapo-sombrio';

export const IGAPO_NPC_SPRITE_ID = 'sprite.aguas.memory-vestige';
export const IGAPO_AFFINITY_SPRITE_ID = 'sprite.aguas.affinity-forgotten';
export const IGAPO_APPLAUD_SPRITE_ID = 'sprite.aguas.applaud-forgotten';
export const IGAPO_SOMBRIO_NPC_SPRITE_ID = 'sprite.aguas.sombrio.memory-vestige';
export const IGAPO_SOMBRIO_AFFINITY_SPRITE_ID = 'sprite.aguas.sombrio.affinity';
export const IGAPO_SOMBRIO_APPLAUD_SPRITE_ID = 'sprite.aguas.sombrio.applaud';
export const IGAPO_AUDIO_PROFILE_ID = 'audio-profile.aguas.forgotten-waters';
export const IGAPO_SOMBRIO_AUDIO_PROFILE_ID = 'audio-profile.aguas.sombrio-waters';
export const IGAPO_ENVIRONMENT_ID = 'environment.aguas.forgotten-waters';
export const IGAPO_SOMBRIO_ENVIRONMENT_ID = 'environment.aguas.sombrio-waters';

const PUNY_WORLD_TEXTURE = 'texture.aguas.puny-world';
const PUNY_MAGE_TEXTURE = 'texture.aguas.puny-mage';
const PUNY_WARRIOR_TEXTURE = 'texture.aguas.puny-warrior';
const PUNY_ARCHER_TEXTURE = 'texture.aguas.puny-archer';

/** Frames selected from the 27-column Puny World overworld sheet. */
const WORLD_FRAME = Object.freeze({
  grass: 0,
  grassVariant: 1,
  grassDark: 27,
  grassLight: 54,
  dirt: 40,
  dirtVariant: 34,
  dirtLight: 7,
  treeCanopy: 190,
  treeCanopyVariant: 191,
  treeCanopyDense: 204,
  singleTree: 197,
  singleTreeVariant: 206,
  singleTreeLight: 224,
  water: 293,
  waterVariant: 294,
  waterDeep: 295,
  rock: 109,
  rockVariant: 110,
  rockEdge: 122,
  stump: 730,
  stumpVariant: 757,
  palm: 758,
  bush: 704,
  bushVariant: 705,
  arch: 714,
  chest: 815,
});

const punyWorld = (frame: number): { textureId: string; frame: number } => Object.freeze({
  textureId: PUNY_WORLD_TEXTURE,
  frame,
});

const worldVariant = (
  frame: number,
  extra: { readonly tint?: number; readonly alpha?: number } = {},
) => Object.freeze({
  textureId: PUNY_WORLD_TEXTURE,
  frame,
  ...extra,
});

const worldTile = (
  frame: number,
  extra: {
    readonly tint?: number;
    readonly alpha?: number;
    readonly variants?: readonly { readonly textureId: string; readonly frame: number;
      readonly tint?: number; readonly alpha?: number }[];
  } = {},
) => Object.freeze({
  ...punyWorld(frame),
  ...extra,
  ...(extra.variants ? { variants: Object.freeze(extra.variants) } : {}),
});

const enemyAnimations = (prefix: 'puny_warrior' | 'puny_archer') => Object.freeze({
  walk: `${prefix}_walk`,
  attack: `${prefix}_attack`,
  hurt: `${prefix}_hurt`,
});

const igapoRibeirinhoTileset = Object.freeze({
  id: IGAPO_VISUAL_TILESET_ID,
  revision: 2,
  tileSize: 32 as const,
  tiles: Object.freeze({
    floor: worldTile(WORLD_FRAME.grass, {
      variants: Object.freeze([
        worldVariant(WORLD_FRAME.grassVariant),
        worldVariant(WORLD_FRAME.grassDark),
        worldVariant(WORLD_FRAME.grassLight),
      ]),
    }),
    wall: worldTile(WORLD_FRAME.treeCanopy, {
      variants: Object.freeze([
        worldVariant(WORLD_FRAME.treeCanopyVariant),
        worldVariant(WORLD_FRAME.treeCanopyDense),
      ]),
    }),
    pillar: worldTile(WORLD_FRAME.singleTree, {
      variants: Object.freeze([
        worldVariant(WORLD_FRAME.singleTreeVariant),
        worldVariant(WORLD_FRAME.singleTreeLight),
      ]),
    }),
    water: worldTile(WORLD_FRAME.water, {
      variants: Object.freeze([
        worldVariant(WORLD_FRAME.waterVariant),
        worldVariant(WORLD_FRAME.waterDeep),
      ]),
    }),
    lava: worldTile(WORLD_FRAME.dirt, { tint: 0x6f7852 }),
    exit: worldTile(WORLD_FRAME.arch, { tint: 0xfff0b0 }),
    'locked-door': worldTile(WORLD_FRAME.treeCanopyVariant, { tint: 0x6f8f7a }),
    chest: worldTile(WORLD_FRAME.chest, { tint: 0xffe0a0 }),
    spawn: worldTile(WORLD_FRAME.grassVariant),
    boss: worldTile(WORLD_FRAME.dirt),
  }),
});

const igapoSombrioTileset = Object.freeze({
  id: IGAPO_SOMBRIO_TILESET_ID,
  revision: 1,
  tileSize: 32 as const,
  tiles: Object.freeze({
    floor: worldTile(WORLD_FRAME.dirt, {
      tint: 0x3f5f55,
      variants: Object.freeze([
        worldVariant(WORLD_FRAME.dirtVariant, { tint: 0x35534b }),
        worldVariant(WORLD_FRAME.dirtLight, { tint: 0x476a5e }),
      ]),
    }),
    wall: worldTile(WORLD_FRAME.rock, {
      tint: 0x2d3f46,
      variants: Object.freeze([
        worldVariant(WORLD_FRAME.rockVariant, { tint: 0x273840 }),
        worldVariant(WORLD_FRAME.rockEdge, { tint: 0x33474e }),
      ]),
    }),
    pillar: worldTile(WORLD_FRAME.stump, {
      tint: 0x4a3a2f,
      variants: Object.freeze([
        worldVariant(WORLD_FRAME.stumpVariant, { tint: 0x3f3730 }),
        worldVariant(WORLD_FRAME.rock, { tint: 0x2f3f46 }),
      ]),
    }),
    water: worldTile(WORLD_FRAME.waterDeep, {
      tint: 0x2f6f7a,
      alpha: 0.96,
      variants: Object.freeze([
        worldVariant(WORLD_FRAME.waterVariant, { tint: 0x28616d, alpha: 0.95 }),
        worldVariant(WORLD_FRAME.water, { tint: 0x245863, alpha: 0.97 }),
      ]),
    }),
    lava: worldTile(WORLD_FRAME.dirt, { tint: 0x4a4a2f }),
    exit: worldTile(WORLD_FRAME.arch, { tint: 0xa8d8e8 }),
    'locked-door': worldTile(WORLD_FRAME.rockVariant, { tint: 0x26363d }),
    chest: worldTile(WORLD_FRAME.chest, { tint: 0x6f8f8a }),
    spawn: worldTile(WORLD_FRAME.dirt, { tint: 0x476a5e }),
    boss: worldTile(WORLD_FRAME.dirt, { tint: 0x3a4a3a }),
  }),
});

const igapoRibeirinhoDecorations = Object.freeze([
  Object.freeze({
    id: 'igapo_emergent_tree',
    textureId: PUNY_WORLD_TEXTURE,
    frame: WORLD_FRAME.singleTree,
    layer: 'foreground' as const,
    depth: 5,
    defaultScale: 2.2,
  }),
  Object.freeze({
    id: 'igapo_fallen_trunk',
    textureId: PUNY_WORLD_TEXTURE,
    frame: WORLD_FRAME.stump,
    layer: 'terrain' as const,
    depth: 2,
    defaultScale: 1.8,
  }),
  Object.freeze({
    id: 'igapo_memory_reeds',
    textureId: PUNY_WORLD_TEXTURE,
    frame: WORLD_FRAME.bush,
    layer: 'foreground' as const,
    depth: 4,
    defaultScale: 1.5,
  }),
]);

const igapoSombrioDecorations = Object.freeze([
  Object.freeze({
    id: 'igapo_sombrio_dead_tree',
    textureId: PUNY_WORLD_TEXTURE,
    frame: WORLD_FRAME.bushVariant,
    layer: 'foreground' as const,
    depth: 5,
    defaultScale: 2.4,
  }),
  Object.freeze({
    id: 'igapo_sombrio_roots',
    textureId: PUNY_WORLD_TEXTURE,
    frame: WORLD_FRAME.stumpVariant,
    layer: 'terrain' as const,
    depth: 2,
    defaultScale: 2,
  }),
  Object.freeze({
    id: 'igapo_sombrio_reeds',
    textureId: PUNY_WORLD_TEXTURE,
    frame: WORLD_FRAME.palm,
    layer: 'foreground' as const,
    depth: 4,
    defaultScale: 1.6,
  }),
]);

export const AGUAS_VISUAL_RESOURCES: ChapterVisualResources = Object.freeze({
  textures: Object.freeze([
    Object.freeze({
      id: PUNY_WORLD_TEXTURE,
      textureKey: 'puny_world',
      frameWidth: 16,
      frameHeight: 16,
      frameCount: 27 * 65,
    }),
    Object.freeze({
      id: PUNY_MAGE_TEXTURE,
      textureKey: 'puny_mage',
      frameWidth: 32,
      frameHeight: 32,
      frameCount: 24 * 8,
    }),
    Object.freeze({
      id: PUNY_WARRIOR_TEXTURE,
      textureKey: 'puny_warrior_128',
      frameWidth: 128,
      frameHeight: 114,
      frameCount: 12,
    }),
    Object.freeze({
      id: PUNY_ARCHER_TEXTURE,
      textureKey: 'puny_archer_128',
      frameWidth: 128,
      frameHeight: 114,
      frameCount: 12,
    }),
  ]),
  tilesets: Object.freeze([igapoRibeirinhoTileset, igapoSombrioTileset]),
  decorations: Object.freeze([
    ...igapoRibeirinhoDecorations,
    ...igapoSombrioDecorations,
  ]),
  sprites: Object.freeze([
    Object.freeze({
      id: IGAPO_NPC_SPRITE_ID,
      textureId: PUNY_MAGE_TEXTURE,
      animations: Object.freeze({ idle: 'puny_mage_idle' }),
      tint: 0xb8fff0,
      scale: 1.7,
      depth: 6,
    }),
    Object.freeze({
      id: IGAPO_AFFINITY_SPRITE_ID,
      textureId: PUNY_WARRIOR_TEXTURE,
      animations: enemyAnimations('puny_warrior'),
      tint: 0x9fe0b8,
      scale: 1,
      depth: 5,
    }),
    Object.freeze({
      id: IGAPO_APPLAUD_SPRITE_ID,
      textureId: PUNY_ARCHER_TEXTURE,
      animations: enemyAnimations('puny_archer'),
      tint: 0x9fd8e8,
      scale: 1,
      depth: 5,
    }),
    Object.freeze({
      id: IGAPO_SOMBRIO_NPC_SPRITE_ID,
      textureId: PUNY_MAGE_TEXTURE,
      animations: Object.freeze({ idle: 'puny_mage_idle' }),
      tint: 0x6fae9f,
      scale: 1.7,
      depth: 6,
    }),
    Object.freeze({
      id: IGAPO_SOMBRIO_AFFINITY_SPRITE_ID,
      textureId: PUNY_WARRIOR_TEXTURE,
      animations: enemyAnimations('puny_warrior'),
      tint: 0x6f9f8f,
      scale: 1,
      depth: 5,
    }),
    Object.freeze({
      id: IGAPO_SOMBRIO_APPLAUD_SPRITE_ID,
      textureId: PUNY_ARCHER_TEXTURE,
      animations: enemyAnimations('puny_archer'),
      tint: 0x6f8fa8,
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
    Object.freeze({
      id: 'sound.aguas.sombrio-current', kind: 'synth' as const,
      waveform: 'sine' as const, frequency: 55, volume: 0.07,
    }),
    Object.freeze({
      id: 'sound.aguas.sombrio-canopy', kind: 'synth' as const,
      waveform: 'sawtooth' as const, frequency: 73.42, volume: 0.018,
    }),
    Object.freeze({
      id: 'sound.aguas.sombrio-echo', kind: 'synth' as const,
      waveform: 'triangle' as const, frequency: 220, volume: 0.06,
    }),
    Object.freeze({
      id: 'sound.aguas.sombrio-broken', kind: 'synth' as const,
      waveform: 'sine' as const, frequency: 82.41, volume: 0.05,
    }),
  ]),
  audioProfiles: Object.freeze([
    Object.freeze({
      id: IGAPO_AUDIO_PROFILE_ID,
      musicSoundId: 'sound.aguas.memory-current',
      ambientSoundId: 'sound.aguas.flooded-canopy',
      eventSoundIds: Object.freeze({
        'stage.entered': 'sound.aguas.echo-touched',
        'npc.interacted': 'sound.aguas.echo-touched',
        'enemy.defeated': 'sound.aguas.memory-broken',
      }),
      masterVolume: 0.7,
    }),
    Object.freeze({
      id: IGAPO_SOMBRIO_AUDIO_PROFILE_ID,
      musicSoundId: 'sound.aguas.sombrio-current',
      ambientSoundId: 'sound.aguas.sombrio-canopy',
      eventSoundIds: Object.freeze({
        'stage.entered': 'sound.aguas.sombrio-echo',
        'npc.interacted': 'sound.aguas.sombrio-echo',
        'enemy.defeated': 'sound.aguas.sombrio-broken',
      }),
      masterVolume: 0.62,
    }),
  ]),
  environments: Object.freeze([
    Object.freeze({
      id: IGAPO_ENVIRONMENT_ID,
      ambientColor: 0x1d4a3f,
      lightIntensity: 0.72,
      fog: Object.freeze({ color: 0x1b4f4a, opacity: 0.1, depth: 4 }),
    }),
    Object.freeze({
      id: IGAPO_SOMBRIO_ENVIRONMENT_ID,
      ambientColor: 0x14343a,
      lightIntensity: 0.55,
      fog: Object.freeze({ color: 0x0a2026, opacity: 0.18, depth: 4 }),
    }),
  ]),
  themes: Object.freeze([
    Object.freeze({
      id: IGAPO_VISUAL_THEME_ID,
      revision: 2,
      tilesetId: IGAPO_VISUAL_TILESET_ID,
      decorationIds: Object.freeze([
        'igapo_emergent_tree', 'igapo_fallen_trunk', 'igapo_memory_reeds',
      ]),
    }),
    Object.freeze({
      id: IGAPO_SOMBRIO_THEME_ID,
      revision: 1,
      tilesetId: IGAPO_SOMBRIO_TILESET_ID,
      decorationIds: Object.freeze([
        'igapo_sombrio_dead_tree', 'igapo_sombrio_roots', 'igapo_sombrio_reeds',
      ]),
      decorationOverrides: Object.freeze({
        igapo_emergent_tree: 'igapo_sombrio_dead_tree',
        igapo_fallen_trunk: 'igapo_sombrio_roots',
        igapo_memory_reeds: 'igapo_sombrio_reeds',
      }),
    }),
  ]),
});

export const AGUAS_RIBEIRINHO_PRESENTATION: StagePresentationDefinition = Object.freeze({
  themeId: IGAPO_VISUAL_THEME_ID,
  tilesetId: IGAPO_VISUAL_TILESET_ID,
  npcSprites: Object.freeze({
    'environment.memory-vestige': IGAPO_NPC_SPRITE_ID,
  }),
  enemySprites: Object.freeze({
    affinity: IGAPO_AFFINITY_SPRITE_ID,
    applaud: IGAPO_APPLAUD_SPRITE_ID,
  }),
  audioProfileId: IGAPO_AUDIO_PROFILE_ID,
  environmentId: IGAPO_ENVIRONMENT_ID,
});

export const AGUAS_SOMBRIO_PRESENTATION: StagePresentationDefinition = Object.freeze({
  themeId: IGAPO_SOMBRIO_THEME_ID,
  tilesetId: IGAPO_SOMBRIO_TILESET_ID,
  npcSprites: Object.freeze({
    'environment.memory-vestige': IGAPO_SOMBRIO_NPC_SPRITE_ID,
  }),
  enemySprites: Object.freeze({
    affinity: IGAPO_SOMBRIO_AFFINITY_SPRITE_ID,
    applaud: IGAPO_SOMBRIO_APPLAUD_SPRITE_ID,
  }),
  audioProfileId: IGAPO_SOMBRIO_AUDIO_PROFILE_ID,
  environmentId: IGAPO_SOMBRIO_ENVIRONMENT_ID,
});

export const AGUAS_PRESENTATION_VARIANTS: Readonly<Record<string, StagePresentationDefinition>> =
  Object.freeze({
    [IGAPO_RIBEIRINHO_VARIANT_ID]: AGUAS_RIBEIRINHO_PRESENTATION,
    [IGAPO_SOMBRIO_VARIANT_ID]: AGUAS_SOMBRIO_PRESENTATION,
  });

export { WORLD_FRAME };
