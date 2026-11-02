import type {
  ChapterVisualResources,
  StageEffectDefinition,
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
export const IGAPO_CANOA_TEXTURE_ID = 'texture.aguas.igapo-canoa';
export const IGAPO_CANOA_TEXTURE_KEY = 'igapo_canoa';
export const IGAPO_LANDMARK_DECORATION_IDS = Object.freeze({
  drownedTree: 'igapo_landmark_drowned_tree',
  oldArch: 'igapo_landmark_old_arch',
  palmIsland: 'igapo_landmark_palm_island',
  stoneGarden: 'igapo_landmark_stone_garden',
  fallenTrunk: 'igapo_landmark_fallen_trunk',
  canoe: 'igapo_landmark_canoe',
});

const PUNY_WORLD_TEXTURE = 'texture.aguas.puny-world';
const PUNY_MAGE_TEXTURE = 'texture.aguas.puny-mage';
const PUNY_WARRIOR_TEXTURE = 'texture.aguas.puny-warrior';
const PUNY_ARCHER_TEXTURE = 'texture.aguas.puny-archer';

/**
 * Frames selected from the 27-column Puny World overworld sheet. The names
 * describe what the frame actually shows; earlier revisions pointed `stump`
 * and `palm` at pebbles and fruit trees, which produced the flat, generic
 * scenery this revision replaces.
 */
const WORLD_FRAME = Object.freeze({
  grass: 0,
  grassVariant: 1,
  grassAlt: 2,
  grassDark: 27,
  grassLight: 54,
  dirt: 40,
  dirtVariant: 34,
  dirtLight: 8,
  canopy: 190,
  canopyVariant: 191,
  canopyDense: 204,
  canopyEdge: 216,
  canopyEdgeVariant: 243,
  tree: 197,
  treeVariant: 206,
  treeAlt: 224,
  treeDark: 783,
  treeBlue: 810,
  water: 293,
  waterVariant: 294,
  waterDeep: 295,
  waterShallow: 296,
  waterStill: 319,
  waterStillVariant: 320,
  waterStillDeep: 321,
  waterStillAlt: 322,
  waterStillDark: 323,
  fruitTree: 704,
  roundTree: 705,
  broadPalm: 224,
  broadPalmLegacy: 758,
  palm: 759,
  coconutPalm: 837,
  reeds: 756,
  shrub: 705,
  shrubLegacy: 757,
  stone: 702,
  fallenTrunk: 730,
  pebble: 784,
  pebbleVariant: 784,
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

/** Natural flooded forest: warm bank, murky green water and layered canopy. */
const igapoRibeirinhoTileset = Object.freeze({
  id: IGAPO_VISUAL_TILESET_ID,
  revision: 3,
  tileSize: 32 as const,
  tiles: Object.freeze({
    floor: worldTile(WORLD_FRAME.grass, {
      tint: 0xa3b67c,
      variants: Object.freeze([
        worldVariant(WORLD_FRAME.grassVariant, { tint: 0x97aa72 }),
        worldVariant(WORLD_FRAME.grassAlt, { tint: 0x8c9f68 }),
        worldVariant(WORLD_FRAME.grassDark, { tint: 0x82955f }),
        worldVariant(WORLD_FRAME.grassLight, { tint: 0xacbe84 }),
        worldVariant(WORLD_FRAME.grass, { tint: 0x9cae75 }),
      ]),
    }),
    wall: worldTile(WORLD_FRAME.canopy, {
      tint: 0x2f6044,
      variants: Object.freeze([
        worldVariant(WORLD_FRAME.canopyVariant, { tint: 0x2a563c }),
        worldVariant(WORLD_FRAME.canopyDense, { tint: 0x285238 }),
        worldVariant(WORLD_FRAME.canopyEdge, { tint: 0x356746 }),
        worldVariant(WORLD_FRAME.canopyEdgeVariant, { tint: 0x2e5c40 }),
      ]),
    }),
    pillar: worldTile(WORLD_FRAME.tree, {
      tint: 0x3d6f4d,
      variants: Object.freeze([
        worldVariant(WORLD_FRAME.treeVariant, { tint: 0x366446 }),
        worldVariant(WORLD_FRAME.treeAlt, { tint: 0x457853 }),
        worldVariant(WORLD_FRAME.treeDark, { tint: 0x335d43 }),
      ]),
    }),
    water: worldTile(WORLD_FRAME.waterStillDark, {
      tint: 0x47776b,
      alpha: 0.82,
      variants: Object.freeze([
        worldVariant(WORLD_FRAME.waterShallow, { tint: 0x80a98c, alpha: 0.78 }),
        worldVariant(WORLD_FRAME.water, { tint: 0x5c8c7c, alpha: 0.8 }),
        worldVariant(WORLD_FRAME.waterVariant, { tint: 0x548477, alpha: 0.8 }),
        worldVariant(WORLD_FRAME.waterStill, { tint: 0x507d70, alpha: 0.8 }),
        worldVariant(WORLD_FRAME.waterStillVariant, { tint: 0x4d786c, alpha: 0.8 }),
        worldVariant(WORLD_FRAME.waterStillDeep, { tint: 0x426e65, alpha: 0.82 }),
        worldVariant(WORLD_FRAME.waterStillAlt, { tint: 0x5b8877, alpha: 0.8 }),
        worldVariant(WORLD_FRAME.waterStillDark, { tint: 0x3e695f, alpha: 0.84 }),
      ]),
    }),
    lava: worldTile(WORLD_FRAME.dirt, { tint: 0x87784f }),
    exit: worldTile(WORLD_FRAME.arch, { tint: 0xffe9a6 }),
    'locked-door': worldTile(WORLD_FRAME.canopyVariant, { tint: 0x5d8f70 }),
    chest: worldTile(WORLD_FRAME.chest, { tint: 0xffdf9a }),
    spawn: worldTile(WORLD_FRAME.grassVariant, { tint: 0xc9d79a }),
    boss: worldTile(WORLD_FRAME.dirt, { tint: 0x8f8054 }),
  }),
});

/** Corrupted flooded forest: cold water, decaying canopy and exposed ground. */
const igapoSombrioTileset = Object.freeze({
  id: IGAPO_SOMBRIO_TILESET_ID,
  revision: 3,
  tileSize: 32 as const,
  tiles: Object.freeze({
    floor: worldTile(WORLD_FRAME.grassDark, {
      tint: 0x7c8f86,
      variants: Object.freeze([
        worldVariant(WORLD_FRAME.grass, { tint: 0x71857c }),
        worldVariant(WORLD_FRAME.grassAlt, { tint: 0x687c74 }),
        worldVariant(WORLD_FRAME.dirt, { tint: 0x84796a }),
        worldVariant(WORLD_FRAME.grassLight, { tint: 0x889a8d }),
      ]),
    }),
    wall: worldTile(WORLD_FRAME.canopyDense, {
      tint: 0x3d5a52,
      variants: Object.freeze([
        worldVariant(WORLD_FRAME.canopy, { tint: 0x365149 }),
        worldVariant(WORLD_FRAME.canopyVariant, { tint: 0x415f56 }),
        worldVariant(WORLD_FRAME.canopyEdge, { tint: 0x46635a }),
      ]),
    }),
    pillar: worldTile(WORLD_FRAME.treeDark, {
      tint: 0x4a5f58,
      variants: Object.freeze([
        worldVariant(WORLD_FRAME.treeBlue, { tint: 0x40564f }),
        worldVariant(WORLD_FRAME.treeAlt, { tint: 0x52665d }),
      ]),
    }),
    water: worldTile(WORLD_FRAME.waterDeep, {
      tint: 0x426f70,
      alpha: 0.9,
      variants: Object.freeze([
        worldVariant(WORLD_FRAME.waterShallow, { tint: 0x739b91, alpha: 0.86 }),
        worldVariant(WORLD_FRAME.water, { tint: 0x598480, alpha: 0.88 }),
        worldVariant(WORLD_FRAME.waterVariant, { tint: 0x517c7b, alpha: 0.88 }),
        worldVariant(WORLD_FRAME.waterStillDeep, { tint: 0x3b686d, alpha: 0.92 }),
        worldVariant(WORLD_FRAME.waterStillAlt, { tint: 0x527c7e, alpha: 0.88 }),
      ]),
    }),
    lava: worldTile(WORLD_FRAME.dirtVariant, { tint: 0x726a57 }),
    exit: worldTile(WORLD_FRAME.arch, { tint: 0xa9d7cf }),
    'locked-door': worldTile(WORLD_FRAME.canopyVariant, { tint: 0x405a52 }),
    chest: worldTile(WORLD_FRAME.chest, { tint: 0x8aa49a }),
    spawn: worldTile(WORLD_FRAME.grassVariant, { tint: 0x84998d }),
    boss: worldTile(WORLD_FRAME.dirt, { tint: 0x7d6e58 }),
  }),
});

interface DecorationSpec {
  readonly id: string;
  readonly textureId?: string;
  readonly frame?: number;
  readonly layer: 'foreground' | 'terrain' | 'background';
  readonly depth: number;
  readonly defaultScale: number;
  readonly scaleClass: 'prop' | 'oversized' | 'character' | 'tile';
}

const naturalDecorations: readonly DecorationSpec[] = [
  {
    id: 'igapo_emergent_tree',
    frame: WORLD_FRAME.tree,
    layer: 'foreground' as const,
    depth: 4.2,
    defaultScale: 4.2,
    scaleClass: 'oversized' as const,
  },
  {
    id: 'igapo_emergent_tree_variant',
    frame: WORLD_FRAME.treeVariant,
    layer: 'foreground' as const,
    depth: 4.3,
    defaultScale: 3.8,
    scaleClass: 'oversized' as const,
  },
  {
    id: 'igapo_emergent_tree_dark',
    frame: WORLD_FRAME.treeDark,
    layer: 'foreground' as const,
    depth: 4.4,
    defaultScale: 4,
    scaleClass: 'oversized' as const,
  },
  {
    id: 'igapo_round_tree',
    frame: WORLD_FRAME.roundTree,
    layer: 'foreground' as const,
    depth: 4.1,
    defaultScale: 4,
    scaleClass: 'oversized' as const,
  },
  {
    id: 'igapo_broad_tree',
    frame: WORLD_FRAME.broadPalm,
    layer: 'foreground' as const,
    depth: 4.4,
    defaultScale: 4,
    scaleClass: 'oversized' as const,
  },
  {
    id: 'igapo_palm',
    frame: WORLD_FRAME.palm,
    layer: 'foreground' as const,
    depth: 4.5,
    defaultScale: 3.4,
    scaleClass: 'oversized' as const,
  },
  {
    id: 'igapo_coconut_palm',
    frame: WORLD_FRAME.coconutPalm,
    layer: 'foreground' as const,
    depth: 4.6,
    defaultScale: 3.2,
    scaleClass: 'oversized' as const,
  },
  {
    id: 'igapo_fruit_tree',
    frame: WORLD_FRAME.fruitTree,
    layer: 'foreground' as const,
    depth: 3.9,
    defaultScale: 2.5,
    scaleClass: 'prop' as const,
  },
  {
    id: 'igapo_fallen_trunk',
    frame: WORLD_FRAME.fallenTrunk,
    layer: 'terrain' as const,
    depth: 1.7,
    defaultScale: 2.5,
    scaleClass: 'prop' as const,
  },
  {
    id: 'igapo_reeds',
    frame: WORLD_FRAME.reeds,
    layer: 'foreground' as const,
    depth: 3.7,
    defaultScale: 2.2,
    scaleClass: 'prop' as const,
  },
  {
    id: 'igapo_shrub',
    frame: WORLD_FRAME.shrub,
    layer: 'foreground' as const,
    depth: 3.6,
    defaultScale: 2,
    scaleClass: 'prop' as const,
  },
  {
    id: 'igapo_stone',
    frame: WORLD_FRAME.stone,
    layer: 'terrain' as const,
    depth: 1.6,
    defaultScale: 2,
    scaleClass: 'prop' as const,
  },
  {
    id: 'igapo_pebble',
    frame: WORLD_FRAME.pebble,
    layer: 'terrain' as const,
    depth: 1.5,
    defaultScale: 1.2,
    scaleClass: 'prop' as const,
  },
  {
    id: 'igapo_mud',
    frame: WORLD_FRAME.dirt,
    layer: 'terrain' as const,
    depth: 0.8,
    defaultScale: 2.2,
    scaleClass: 'prop' as const,
  },
  {
    id: 'igapo_canopy_shadow',
    frame: WORLD_FRAME.roundTree,
    layer: 'terrain' as const,
    depth: 1.3,
    defaultScale: 3.8,
    scaleClass: 'oversized' as const,
  },
  {
    id: 'igapo_canopy_high',
    frame: WORLD_FRAME.canopy,
    layer: 'foreground' as const,
    depth: 6.4,
    defaultScale: 4.4,
    scaleClass: 'oversized' as const,
  },
  {
    id: IGAPO_LANDMARK_DECORATION_IDS.drownedTree,
    frame: WORLD_FRAME.tree,
    layer: 'foreground' as const,
    depth: 4.7,
    defaultScale: 5.1,
    scaleClass: 'oversized' as const,
  },
  {
    id: IGAPO_LANDMARK_DECORATION_IDS.oldArch,
    frame: WORLD_FRAME.arch,
    layer: 'foreground' as const,
    depth: 4,
    defaultScale: 4.5,
    scaleClass: 'oversized' as const,
  },
  {
    id: IGAPO_LANDMARK_DECORATION_IDS.palmIsland,
    frame: WORLD_FRAME.broadPalm,
    layer: 'foreground' as const,
    depth: 4.8,
    defaultScale: 4.4,
    scaleClass: 'oversized' as const,
  },
  {
    id: IGAPO_LANDMARK_DECORATION_IDS.fallenTrunk,
    frame: WORLD_FRAME.fallenTrunk,
    layer: 'terrain' as const,
    depth: 1.7,
    defaultScale: 3,
    scaleClass: 'prop' as const,
  },
  {
    id: 'igapo_waterweed',
    frame: WORLD_FRAME.reeds,
    layer: 'terrain' as const,
    depth: 0.8,
    defaultScale: 1.8,
    scaleClass: 'prop' as const,
  },
  {
    id: IGAPO_LANDMARK_DECORATION_IDS.canoe,
    textureId: IGAPO_CANOA_TEXTURE_ID,
    layer: 'terrain' as const,
    depth: 1.1,
    defaultScale: 1.3,
    scaleClass: 'oversized' as const,
  },
  {
    id: 'igapo_oil_slick',
    frame: WORLD_FRAME.waterStillDark,
    layer: 'terrain' as const,
    depth: 0.7,
    defaultScale: 2.2,
    scaleClass: 'prop' as const,
  },
  {
    id: 'igapo_waste',
    frame: WORLD_FRAME.pebbleVariant,
    layer: 'terrain' as const,
    depth: 1.3,
    defaultScale: 1.8,
    scaleClass: 'prop' as const,
  },
  {
    id: IGAPO_LANDMARK_DECORATION_IDS.stoneGarden,
    frame: WORLD_FRAME.stone,
    layer: 'terrain' as const,
    depth: 1.8,
    defaultScale: 1.8,
    scaleClass: 'prop' as const,
  },
];

const sombrioDecorations: readonly DecorationSpec[] = [
  {
    id: 'igapo_sombrio_dead_tree',
    frame: WORLD_FRAME.treeDark,
    layer: 'foreground' as const,
    depth: 4.2,
    defaultScale: 4.2,
    scaleClass: 'oversized' as const,
  },
  {
    id: 'igapo_sombrio_dead_tree_variant',
    frame: WORLD_FRAME.treeBlue,
    layer: 'foreground' as const,
    depth: 4.3,
    defaultScale: 3.8,
    scaleClass: 'oversized' as const,
  },
  {
    id: 'igapo_sombrio_round_tree',
    frame: WORLD_FRAME.roundTree,
    layer: 'foreground' as const,
    depth: 4.1,
    defaultScale: 4.2,
    scaleClass: 'oversized' as const,
  },
  {
    id: 'igapo_sombrio_cut_stump',
    frame: WORLD_FRAME.fallenTrunk,
    layer: 'foreground' as const,
    depth: 4.2,
    defaultScale: 4.2,
    scaleClass: 'oversized' as const,
  },
  {
    id: 'igapo_sombrio_stump_cluster',
    frame: WORLD_FRAME.pebbleVariant,
    layer: 'foreground' as const,
    depth: 4.3,
    defaultScale: 3.8,
    scaleClass: 'oversized' as const,
  },
  {
    id: 'igapo_sombrio_survivor_tree',
    frame: WORLD_FRAME.tree,
    layer: 'foreground' as const,
    depth: 4.1,
    defaultScale: 4.2,
    scaleClass: 'oversized' as const,
  },
  {
    id: 'igapo_sombrio_broad_tree',
    frame: WORLD_FRAME.broadPalmLegacy,
    layer: 'foreground' as const,
    depth: 4.4,
    defaultScale: 3,
    scaleClass: 'oversized' as const,
  },
  {
    id: 'igapo_sombrio_palm',
    frame: WORLD_FRAME.palm,
    layer: 'foreground' as const,
    depth: 4.5,
    defaultScale: 2.8,
    scaleClass: 'oversized' as const,
  },
  {
    id: 'igapo_sombrio_coconut_palm',
    frame: WORLD_FRAME.coconutPalm,
    layer: 'foreground' as const,
    depth: 4.6,
    defaultScale: 2.4,
    scaleClass: 'oversized' as const,
  },
  {
    id: 'igapo_sombrio_fruit_tree',
    frame: WORLD_FRAME.fruitTree,
    layer: 'foreground' as const,
    depth: 3.9,
    defaultScale: 2.4,
    scaleClass: 'prop' as const,
  },
  {
    id: 'igapo_sombrio_reeds',
    frame: WORLD_FRAME.reeds,
    layer: 'foreground' as const,
    depth: 3.7,
    defaultScale: 2.2,
    scaleClass: 'prop' as const,
  },
  {
    id: 'igapo_sombrio_shrub',
    frame: WORLD_FRAME.shrubLegacy,
    layer: 'foreground' as const,
    depth: 3.6,
    defaultScale: 2,
    scaleClass: 'prop' as const,
  },
  {
    id: 'igapo_sombrio_low_tree',
    frame: WORLD_FRAME.shrub,
    layer: 'foreground' as const,
    depth: 3.6,
    defaultScale: 2,
    scaleClass: 'prop' as const,
  },
  {
    id: 'igapo_sombrio_stone',
    frame: WORLD_FRAME.stone,
    layer: 'terrain' as const,
    depth: 1.6,
    defaultScale: 2.2,
    scaleClass: 'prop' as const,
  },
  {
    id: 'igapo_sombrio_pebble',
    frame: WORLD_FRAME.pebbleVariant,
    layer: 'terrain' as const,
    depth: 1.5,
    defaultScale: 1.2,
    scaleClass: 'prop' as const,
  },
  {
    id: 'igapo_sombrio_mud',
    frame: WORLD_FRAME.dirtVariant,
    layer: 'terrain' as const,
    depth: 0.8,
    defaultScale: 2.4,
    scaleClass: 'prop' as const,
  },
  {
    id: 'igapo_sombrio_canopy_shadow',
    frame: WORLD_FRAME.treeDark,
    layer: 'terrain' as const,
    depth: 1.3,
    defaultScale: 4,
    scaleClass: 'oversized' as const,
  },
  {
    id: 'igapo_sombrio_algae',
    frame: WORLD_FRAME.stone,
    layer: 'terrain' as const,
    depth: 1.2,
    defaultScale: 2.4,
    scaleClass: 'prop' as const,
  },
  {
    id: 'igapo_sombrio_oil_slick',
    frame: WORLD_FRAME.waterStillDark,
    layer: 'terrain' as const,
    depth: 0.7,
    defaultScale: 2.2,
    scaleClass: 'prop' as const,
  },
  {
    id: 'igapo_sombrio_waste',
    frame: WORLD_FRAME.pebbleVariant,
    layer: 'terrain' as const,
    depth: 1.3,
    defaultScale: 1.8,
    scaleClass: 'prop' as const,
  },
  {
    id: 'igapo_sombrio_canopy_high',
    frame: WORLD_FRAME.canopyVariant,
    layer: 'foreground' as const,
    depth: 6.4,
    defaultScale: 4.4,
    scaleClass: 'oversized' as const,
  },
];

const decoration = (value: DecorationSpec) => Object.freeze({
  textureId: PUNY_WORLD_TEXTURE,
  anchor: Object.freeze({ x: 0.5, y: 0.5 }),
  ...value,
});

const sombrioOverrides: Readonly<Record<string, string>> = Object.freeze({
  igapo_emergent_tree: 'igapo_sombrio_cut_stump',
  igapo_emergent_tree_variant: 'igapo_sombrio_stump_cluster',
  igapo_emergent_tree_dark: 'igapo_sombrio_stump_cluster',
  igapo_round_tree: 'igapo_sombrio_survivor_tree',
  igapo_broad_tree: 'igapo_sombrio_cut_stump',
  igapo_palm: 'igapo_sombrio_stump_cluster',
  igapo_coconut_palm: 'igapo_sombrio_cut_stump',
  igapo_fruit_tree: 'igapo_sombrio_stump_cluster',
  igapo_reeds: 'igapo_sombrio_reeds',
  igapo_shrub: 'igapo_sombrio_low_tree',
  igapo_stone: 'igapo_sombrio_waste',
  igapo_pebble: 'igapo_sombrio_waste',
  igapo_mud: 'igapo_sombrio_mud',
  igapo_fallen_trunk: 'igapo_sombrio_waste',
  [IGAPO_LANDMARK_DECORATION_IDS.drownedTree]: 'igapo_sombrio_cut_stump',
  [IGAPO_LANDMARK_DECORATION_IDS.palmIsland]: 'igapo_sombrio_stump_cluster',
  [IGAPO_LANDMARK_DECORATION_IDS.stoneGarden]: 'igapo_sombrio_waste',
  [IGAPO_LANDMARK_DECORATION_IDS.fallenTrunk]: 'igapo_sombrio_waste',
  igapo_waterweed: 'igapo_sombrio_oil_slick',
  igapo_canopy_shadow: 'igapo_sombrio_canopy_shadow',
  igapo_canopy_high: 'igapo_sombrio_canopy_high',
});

export const IGAPO_NATURAL_EFFECTS: readonly StageEffectDefinition[] = Object.freeze([
  Object.freeze({
    id: 'effect.aguas.igapo.water-shimmer', kind: 'water-shimmer' as const,
    color: 0xa7e8cf, alpha: 0.16, depth: 0.6, durationMs: 2600, count: 32,
  }),
  Object.freeze({
    id: 'effect.aguas.igapo.mist', kind: 'mist' as const,
    color: 0x8fc9b4, alpha: 0.08, depth: 4.8, durationMs: 11000,
    x: 4, y: 6, width: 86, height: 16, count: 7, amplitude: 80,
  }),
  Object.freeze({
    id: 'effect.aguas.igapo.fireflies', kind: 'fireflies' as const,
    color: 0xd8f28a, alpha: 0.6, depth: 8.5, durationMs: 3400,
    x: 6, y: 5, width: 82, height: 18, count: 30, amplitude: 20,
  }),
  Object.freeze({
    id: 'effect.aguas.igapo.vestige-light', kind: 'local-light' as const,
    color: 0xb8fff0, alpha: 0.12, depth: 7.2, durationMs: 2400,
    x: 28, y: 16, radius: 44, amplitude: 0.1,
  }),
  Object.freeze({
    id: 'effect.aguas.igapo.foliage', kind: 'foliage-sway' as const,
    color: 0x4f8c63, alpha: 0.12, depth: 7.5, durationMs: 4200, amplitude: 1.2,
  }),
]);

export const IGAPO_SOMBRIO_EFFECTS: readonly StageEffectDefinition[] = Object.freeze([
  Object.freeze({
    id: 'effect.aguas.sombrio.water-shimmer', kind: 'water-shimmer' as const,
    color: 0xb7a66e, alpha: 0.1, depth: 0.6, durationMs: 3200, count: 24,
  }),
  Object.freeze({
    id: 'effect.aguas.sombrio.mist', kind: 'mist' as const,
    color: 0x19312e, alpha: 0.08, depth: 4.8, durationMs: 11000,
    x: 4, y: 5, width: 80, height: 18, count: 7, amplitude: 64,
  }),
  Object.freeze({
    id: 'effect.aguas.sombrio.smoke', kind: 'mist' as const,
    color: 0x303a32, alpha: 0.12, depth: 5.2, durationMs: 13000,
    x: 46, y: 7, width: 24, height: 10, count: 4, amplitude: 36,
  }),
  Object.freeze({
    id: 'effect.aguas.sombrio.source-pulse', kind: 'pulse' as const,
    color: 0x8ee0c8, alpha: 0.18, depth: 7.8, durationMs: 2200,
    x: 76, y: 16, radius: 64, amplitude: 0.14,
  }),
  Object.freeze({
    id: 'effect.aguas.sombrio.spirits', kind: 'spirits' as const,
    color: 0x9be7d9, alpha: 0.5, depth: 8.4, durationMs: 5000,
    x: 60, y: 8, width: 20, height: 14, count: 14, amplitude: 20,
  }),
  Object.freeze({
    id: 'effect.aguas.sombrio.foliage', kind: 'foliage-sway' as const,
    color: 0x3f6b60, alpha: 0.1, depth: 7.5, durationMs: 5200, amplitude: 0.8,
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
      sourceWidth: 432,
      sourceHeight: 1040,
      visibleBounds: Object.freeze({ x: 0, y: 0, width: 16, height: 16 }),
      pixelArt: true,
      perspective: 'top-down' as const,
      originId: 'origin.puny-world',
    }),
    Object.freeze({
      id: PUNY_MAGE_TEXTURE,
      textureKey: 'puny_mage',
      frameWidth: 32,
      frameHeight: 32,
      frameCount: 24 * 8,
      sourceWidth: 768,
      sourceHeight: 256,
      pixelArt: true,
      perspective: 'top-down' as const,
      originId: 'origin.puny-characters',
    }),
    Object.freeze({
      id: IGAPO_CANOA_TEXTURE_ID,
      textureKey: IGAPO_CANOA_TEXTURE_KEY,
      frameWidth: 48,
      frameHeight: 16,
      frameCount: 1,
      sourceWidth: 48,
      sourceHeight: 16,
      pixelArt: true,
      perspective: 'top-down' as const,
    }),
    Object.freeze({
      id: PUNY_WARRIOR_TEXTURE,
      textureKey: 'puny_warrior_128',
      frameWidth: 128,
      frameHeight: 114,
      frameCount: 12,
      sourceWidth: 512,
      sourceHeight: 342,
      pixelArt: true,
      perspective: 'top-down' as const,
      originId: 'origin.puny-characters',
    }),
    Object.freeze({
      id: PUNY_ARCHER_TEXTURE,
      textureKey: 'puny_archer_128',
      frameWidth: 128,
      frameHeight: 114,
      frameCount: 12,
      sourceWidth: 512,
      sourceHeight: 342,
      pixelArt: true,
      perspective: 'top-down' as const,
      originId: 'origin.puny-characters',
    }),
  ]),
  tilesets: Object.freeze([igapoRibeirinhoTileset, igapoSombrioTileset]),
  decorations: Object.freeze([
    ...naturalDecorations.map(decoration),
    ...sombrioDecorations.map(decoration),
  ]),
  sprites: Object.freeze([
    Object.freeze({
      id: IGAPO_NPC_SPRITE_ID,
      textureId: PUNY_MAGE_TEXTURE,
      animations: Object.freeze({ idle: 'puny_mage_idle' }),
      tint: 0xb8fff0,
      scale: 1.7,
      depth: 6,
      anchor: Object.freeze({ x: 0.5, y: 0.5 }),
      scaleClass: 'character' as const,
    }),
    Object.freeze({
      id: IGAPO_AFFINITY_SPRITE_ID,
      textureId: PUNY_WARRIOR_TEXTURE,
      animations: enemyAnimations('puny_warrior'),
      tint: 0xa8e6c0,
      scale: 1,
      depth: 5,
      anchor: Object.freeze({ x: 0.5, y: 0.5 }),
      scaleClass: 'character' as const,
    }),
    Object.freeze({
      id: IGAPO_APPLAUD_SPRITE_ID,
      textureId: PUNY_ARCHER_TEXTURE,
      animations: enemyAnimations('puny_archer'),
      tint: 0xa8ddec,
      scale: 1,
      depth: 5,
      anchor: Object.freeze({ x: 0.5, y: 0.5 }),
      scaleClass: 'character' as const,
    }),
    Object.freeze({
      id: IGAPO_SOMBRIO_NPC_SPRITE_ID,
      textureId: PUNY_MAGE_TEXTURE,
      animations: Object.freeze({ idle: 'puny_mage_idle' }),
      tint: 0x83b9a9,
      scale: 1.7,
      depth: 6,
      anchor: Object.freeze({ x: 0.5, y: 0.5 }),
      scaleClass: 'character' as const,
    }),
    Object.freeze({
      id: IGAPO_SOMBRIO_AFFINITY_SPRITE_ID,
      textureId: PUNY_WARRIOR_TEXTURE,
      animations: enemyAnimations('puny_warrior'),
      tint: 0x86ac9d,
      scale: 1,
      depth: 5,
      anchor: Object.freeze({ x: 0.5, y: 0.5 }),
      scaleClass: 'character' as const,
    }),
    Object.freeze({
      id: IGAPO_SOMBRIO_APPLAUD_SPRITE_ID,
      textureId: PUNY_ARCHER_TEXTURE,
      animations: enemyAnimations('puny_archer'),
      tint: 0x7f9fb4,
      scale: 1,
      depth: 5,
      anchor: Object.freeze({ x: 0.5, y: 0.5 }),
      scaleClass: 'character' as const,
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
      ambientColor: 0x163b3c,
      lightIntensity: 0.62,
      fog: Object.freeze({ color: 0x0a2026, opacity: 0.12, depth: 4 }),
    }),
  ]),
  themes: Object.freeze([
    Object.freeze({
      id: IGAPO_VISUAL_THEME_ID,
      revision: 3,
      tilesetId: IGAPO_VISUAL_TILESET_ID,
      decorationIds: Object.freeze(naturalDecorations.map(item => item.id)),
    }),
    Object.freeze({
      id: IGAPO_SOMBRIO_THEME_ID,
      revision: 3,
      tilesetId: IGAPO_SOMBRIO_TILESET_ID,
      decorationIds: Object.freeze([
        ...naturalDecorations.map(item => item.id),
        ...sombrioDecorations.map(item => item.id),
      ]),
      decorationOverrides: sombrioOverrides,
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
  effects: IGAPO_NATURAL_EFFECTS,
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
  effects: IGAPO_SOMBRIO_EFFECTS,
});

export const AGUAS_PRESENTATION_VARIANTS: Readonly<Record<string, StagePresentationDefinition>> =
  Object.freeze({
    [IGAPO_RIBEIRINHO_VARIANT_ID]: AGUAS_RIBEIRINHO_PRESENTATION,
    [IGAPO_SOMBRIO_VARIANT_ID]: AGUAS_SOMBRIO_PRESENTATION,
  });

export { WORLD_FRAME };
