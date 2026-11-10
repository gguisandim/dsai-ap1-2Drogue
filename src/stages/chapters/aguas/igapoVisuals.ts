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
  stiltHut: 'igapo_landmark_stilt_hut',
  memoryStela: 'igapo_landmark_memory_stela',
  submergedTrunk: 'igapo_landmark_submerged_trunk',
  emergentGiant: 'igapo_landmark_emergent_giant',
});

export const IGAPO_ORIGINAL_TEXTURE_IDS = Object.freeze({
  forestFloor: 'texture.aguas.igapo-forest-floor',
  emergentTree: 'texture.aguas.igapo-emergent-tree',
  palmCluster: 'texture.aguas.igapo-palm-cluster',
  rootTangle: 'texture.aguas.igapo-root-tangle',
  submergedTrunk: 'texture.aguas.igapo-submerged-trunk',
  waterLily: 'texture.aguas.igapo-water-lily',
  shoreFringe: 'texture.aguas.igapo-shore-fringe',
  groundMoss: 'texture.aguas.igapo-ground-moss',
  stiltHut: 'texture.aguas.igapo-stilt-hut',
  memoryStela: 'texture.aguas.igapo-memory-stela',
  canopyBough: 'texture.aguas.igapo-canopy-bough',
  lightShaft: 'texture.aguas.igapo-light-shaft',
  canopyShadow: 'texture.aguas.igapo-canopy-shadow',
});

/** Stable scenery ids used by the authored Igapó composition. */
export const IGAPO_SCENERY_IDS = Object.freeze({
  floodedTree: 'igapo_flooded_emergent_tree',
  palmCluster: 'igapo_flooded_palm_cluster',
  rootTangle: 'igapo_flooded_root_tangle',
  submergedTrunk: 'igapo_flooded_submerged_trunk',
  lily: Object.freeze([
    'igapo_flooded_lily_0', 'igapo_flooded_lily_1',
    'igapo_flooded_lily_2', 'igapo_flooded_lily_3',
  ]),
  shore: Object.freeze([
    'igapo_flooded_shore_0', 'igapo_flooded_shore_1',
    'igapo_flooded_shore_2', 'igapo_flooded_shore_3',
  ]),
  moss: Object.freeze([
    'igapo_flooded_moss_0', 'igapo_flooded_moss_1',
    'igapo_flooded_moss_2', 'igapo_flooded_moss_3',
  ]),
  stiltHut: 'igapo_flooded_stilt_hut',
  memoryStela: 'igapo_flooded_memory_stela',
  canopyBough: 'igapo_flooded_canopy_bough',
  lightShaft: 'igapo_flooded_light_shaft',
  canopyShadow: 'igapo_flooded_canopy_shadow',
});

const PUNY_WORLD_TEXTURE = 'texture.aguas.puny-world';
const PUNY_MAGE_TEXTURE = 'texture.aguas.puny-mage';
const PUNY_WARRIOR_TEXTURE = 'texture.aguas.puny-warrior';
const PUNY_ARCHER_TEXTURE = 'texture.aguas.puny-archer';

const IGAPO_ASSET_ORIGIN_ID = 'origin.aguas.igapo-original';

/**
 * Frames selected from the 27-column Puny World overworld sheet. The names
 * describe what the frame actually shows. New flooded-forest scenery is drawn
 * by original SVG assets; these frames remain for accents and ground cover.
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

/**
 * Natural flooded forest. Floor variants 0–2 are dry bank; 3–5 are wet mud and
 * leaf litter chosen by the renderer only for tiles that touch water. Water
 * variants 0/1 are the shallow and mid bands; the base plus 2–4 form the deep
 * channel. All bands share the same collision.
 */
const igapoRibeirinhoTileset = Object.freeze({
  id: IGAPO_VISUAL_TILESET_ID,
  revision: 4,
  tileSize: 32 as const,
  tiles: Object.freeze({
    floor: Object.freeze({
      textureId: IGAPO_ORIGINAL_TEXTURE_IDS.forestFloor,
      frame: 0,
      variants: Object.freeze([0, 0, 1, 1, 1].map(frame => Object.freeze({
        textureId: IGAPO_ORIGINAL_TEXTURE_IDS.forestFloor,
        frame,
      }))),
    }),
    wall: worldTile(WORLD_FRAME.canopy, {
      tint: 0x21492f,
      variants: Object.freeze([
        worldVariant(WORLD_FRAME.canopyVariant, { tint: 0x1d422b }),
        worldVariant(WORLD_FRAME.canopyDense, { tint: 0x193c27 }),
        worldVariant(WORLD_FRAME.canopyEdge, { tint: 0x265238 }),
        worldVariant(WORLD_FRAME.canopyEdgeVariant, { tint: 0x204830 }),
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
    water: worldTile(WORLD_FRAME.waterStillDeep, {
      tint: 0x3f6b63,
      alpha: 0.95,
      variants: Object.freeze([
        worldVariant(WORLD_FRAME.waterShallow, { tint: 0x76a085, alpha: 0.82 }),
        worldVariant(WORLD_FRAME.water, { tint: 0x5d8978, alpha: 0.9 }),
        worldVariant(WORLD_FRAME.waterVariant, { tint: 0x3c6862, alpha: 0.94 }),
        worldVariant(WORLD_FRAME.waterStill, { tint: 0x3c6862, alpha: 0.94 }),
        worldVariant(WORLD_FRAME.waterStillVariant, { tint: 0x3c6862, alpha: 0.94 }),
        worldVariant(WORLD_FRAME.waterStillDark, { tint: 0x3c6862, alpha: 0.94 }),
        worldVariant(WORLD_FRAME.waterStillAlt, { tint: 0x3c6862, alpha: 0.94 }),
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
  revision: 4,
  tileSize: 32 as const,
  tiles: Object.freeze({
    floor: Object.freeze({
      textureId: IGAPO_ORIGINAL_TEXTURE_IDS.forestFloor,
      frame: 0,
      tint: 0xb4c4b8,
      variants: Object.freeze([0, 0, 1, 1, 1].map(frame => Object.freeze({
        textureId: IGAPO_ORIGINAL_TEXTURE_IDS.forestFloor,
        frame,
        tint: 0xb4c4b8,
      }))),
    }),
    wall: worldTile(WORLD_FRAME.canopyDense, {
      tint: 0x334d45,
      variants: Object.freeze([
        worldVariant(WORLD_FRAME.canopy, { tint: 0x2c453e }),
        worldVariant(WORLD_FRAME.canopyVariant, { tint: 0x38544b }),
        worldVariant(WORLD_FRAME.canopyEdge, { tint: 0x3d5a51 }),
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
      tint: 0x30595e,
      alpha: 0.96,
      variants: Object.freeze([
        worldVariant(WORLD_FRAME.waterShallow, { tint: 0x5d817a, alpha: 0.86 }),
        worldVariant(WORLD_FRAME.water, { tint: 0x4a7371, alpha: 0.92 }),
        worldVariant(WORLD_FRAME.waterVariant, { tint: 0x345f63, alpha: 0.95 }),
        worldVariant(WORLD_FRAME.waterStillDeep, { tint: 0x345f63, alpha: 0.95 }),
        worldVariant(WORLD_FRAME.waterStillAlt, { tint: 0x345f63, alpha: 0.95 }),
        worldVariant(WORLD_FRAME.waterStillDark, { tint: 0x345f63, alpha: 0.95 }),
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
  readonly tint?: number;
}

const originalTexture = (id: string) => id;

const naturalDecorations: readonly DecorationSpec[] = [
  // Existing Puny tree accents, kept for midground variation.
  {
    id: 'igapo_emergent_tree',
    frame: WORLD_FRAME.tree,
    layer: 'foreground' as const,
    depth: 4.2,
    defaultScale: 3.4,
    scaleClass: 'oversized' as const,
  },
  {
    id: 'igapo_emergent_tree_variant',
    frame: WORLD_FRAME.treeVariant,
    layer: 'foreground' as const,
    depth: 4.3,
    defaultScale: 3.1,
    scaleClass: 'oversized' as const,
  },
  {
    id: 'igapo_emergent_tree_dark',
    frame: WORLD_FRAME.treeDark,
    layer: 'foreground' as const,
    depth: 4.4,
    defaultScale: 3.2,
    scaleClass: 'oversized' as const,
  },
  {
    id: 'igapo_round_tree',
    frame: WORLD_FRAME.roundTree,
    layer: 'foreground' as const,
    depth: 4.1,
    defaultScale: 3.2,
    scaleClass: 'oversized' as const,
  },
  {
    id: 'igapo_broad_tree',
    frame: WORLD_FRAME.broadPalm,
    layer: 'foreground' as const,
    depth: 4.4,
    defaultScale: 3.2,
    scaleClass: 'oversized' as const,
  },
  {
    id: 'igapo_palm',
    frame: WORLD_FRAME.palm,
    layer: 'foreground' as const,
    depth: 4.5,
    defaultScale: 2.9,
    scaleClass: 'oversized' as const,
  },
  {
    id: 'igapo_coconut_palm',
    frame: WORLD_FRAME.coconutPalm,
    layer: 'foreground' as const,
    depth: 4.6,
    defaultScale: 2.7,
    scaleClass: 'oversized' as const,
  },
  {
    id: 'igapo_fruit_tree',
    frame: WORLD_FRAME.fruitTree,
    layer: 'foreground' as const,
    depth: 3.9,
    defaultScale: 2.3,
    scaleClass: 'prop' as const,
  },
  {
    id: 'igapo_fallen_trunk',
    frame: WORLD_FRAME.fallenTrunk,
    layer: 'terrain' as const,
    depth: 1.7,
    defaultScale: 2.3,
    scaleClass: 'prop' as const,
  },
  {
    id: 'igapo_reeds',
    frame: WORLD_FRAME.reeds,
    layer: 'terrain' as const,
    depth: 1.95,
    defaultScale: 1.9,
    scaleClass: 'prop' as const,
  },
  {
    id: 'igapo_shrub',
    frame: WORLD_FRAME.shrub,
    layer: 'foreground' as const,
    depth: 3.6,
    defaultScale: 1.9,
    scaleClass: 'prop' as const,
  },
  {
    id: 'igapo_stone',
    frame: WORLD_FRAME.stone,
    layer: 'terrain' as const,
    depth: 1.6,
    defaultScale: 1.9,
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
    defaultScale: 2,
    scaleClass: 'prop' as const,
  },
  {
    id: 'igapo_canopy_shadow',
    frame: WORLD_FRAME.roundTree,
    layer: 'terrain' as const,
    depth: 1.3,
    defaultScale: 3.4,
    scaleClass: 'oversized' as const,
  },
  {
    id: 'igapo_canopy_high',
    frame: WORLD_FRAME.canopy,
    layer: 'terrain' as const,
    depth: 6.35,
    defaultScale: 4.4,
    scaleClass: 'oversized' as const,
  },
  // Original flooded-forest scenery.
  {
    id: IGAPO_SCENERY_IDS.floodedTree,
    textureId: originalTexture(IGAPO_ORIGINAL_TEXTURE_IDS.emergentTree),
    layer: 'foreground' as const,
    depth: 4.35,
    defaultScale: 1.35,
    scaleClass: 'oversized' as const,
  },
  {
    id: IGAPO_SCENERY_IDS.palmCluster,
    textureId: originalTexture(IGAPO_ORIGINAL_TEXTURE_IDS.palmCluster),
    layer: 'foreground' as const,
    depth: 4.4,
    defaultScale: 1.2,
    scaleClass: 'oversized' as const,
  },
  {
    id: IGAPO_SCENERY_IDS.rootTangle,
    textureId: originalTexture(IGAPO_ORIGINAL_TEXTURE_IDS.rootTangle),
    layer: 'terrain' as const,
    depth: 1.55,
    defaultScale: 1,
    scaleClass: 'oversized' as const,
  },
  {
    id: IGAPO_SCENERY_IDS.submergedTrunk,
    textureId: originalTexture(IGAPO_ORIGINAL_TEXTURE_IDS.submergedTrunk),
    layer: 'terrain' as const,
    depth: 2.02,
    defaultScale: 0.95,
    scaleClass: 'oversized' as const,
  },
  ...[0, 1, 2, 3].map(frameIndex => ({
    id: IGAPO_SCENERY_IDS.lily[frameIndex],
    textureId: originalTexture(IGAPO_ORIGINAL_TEXTURE_IDS.waterLily),
    frame: frameIndex,
    layer: 'terrain' as const,
    depth: 1.86,
    defaultScale: 1,
    scaleClass: 'prop' as const,
  })),
  ...[0, 1, 2, 3].map(frameIndex => ({
    id: IGAPO_SCENERY_IDS.shore[frameIndex],
    textureId: originalTexture(IGAPO_ORIGINAL_TEXTURE_IDS.shoreFringe),
    frame: frameIndex,
    layer: 'terrain' as const,
    depth: 1.94,
    defaultScale: 1,
    scaleClass: 'prop' as const,
  })),
  ...[0, 1, 2, 3].map(frameIndex => ({
    id: IGAPO_SCENERY_IDS.moss[frameIndex],
    textureId: originalTexture(IGAPO_ORIGINAL_TEXTURE_IDS.groundMoss),
    frame: frameIndex,
    layer: 'terrain' as const,
    depth: 0.78,
    defaultScale: 1,
    scaleClass: 'prop' as const,
  })),
  {
    id: IGAPO_SCENERY_IDS.stiltHut,
    textureId: originalTexture(IGAPO_ORIGINAL_TEXTURE_IDS.stiltHut),
    layer: 'terrain' as const,
    depth: 4.55,
    defaultScale: 1.05,
    scaleClass: 'oversized' as const,
  },
  {
    id: IGAPO_SCENERY_IDS.memoryStela,
    textureId: originalTexture(IGAPO_ORIGINAL_TEXTURE_IDS.memoryStela),
    layer: 'terrain' as const,
    depth: 3.95,
    defaultScale: 1,
    scaleClass: 'oversized' as const,
  },
  {
    id: IGAPO_SCENERY_IDS.canopyBough,
    textureId: originalTexture(IGAPO_ORIGINAL_TEXTURE_IDS.canopyBough),
    layer: 'foreground' as const,
    depth: 7.15,
    defaultScale: 1,
    scaleClass: 'oversized' as const,
  },
  {
    id: IGAPO_SCENERY_IDS.lightShaft,
    textureId: originalTexture(IGAPO_ORIGINAL_TEXTURE_IDS.lightShaft),
    layer: 'terrain' as const,
    depth: 7.1,
    defaultScale: 1.35,
    scaleClass: 'oversized' as const,
  },
  {
    id: IGAPO_SCENERY_IDS.canopyShadow,
    textureId: originalTexture(IGAPO_ORIGINAL_TEXTURE_IDS.canopyShadow),
    layer: 'terrain' as const,
    depth: 1.28,
    defaultScale: 1.35,
    scaleClass: 'oversized' as const,
  },
  // Landmarks.
  {
    id: IGAPO_LANDMARK_DECORATION_IDS.drownedTree,
    textureId: originalTexture(IGAPO_ORIGINAL_TEXTURE_IDS.emergentTree),
    layer: 'foreground' as const,
    depth: 4.75,
    defaultScale: 1.9,
    scaleClass: 'oversized' as const,
  },
  {
    id: IGAPO_LANDMARK_DECORATION_IDS.oldArch,
    frame: WORLD_FRAME.arch,
    layer: 'terrain' as const,
    depth: 4,
    defaultScale: 4.5,
    scaleClass: 'oversized' as const,
  },
  {
    id: IGAPO_LANDMARK_DECORATION_IDS.palmIsland,
    textureId: originalTexture(IGAPO_ORIGINAL_TEXTURE_IDS.palmCluster),
    layer: 'foreground' as const,
    depth: 4.8,
    defaultScale: 1.55,
    scaleClass: 'oversized' as const,
  },
  {
    id: IGAPO_LANDMARK_DECORATION_IDS.fallenTrunk,
    textureId: originalTexture(IGAPO_ORIGINAL_TEXTURE_IDS.submergedTrunk),
    layer: 'terrain' as const,
    depth: 2.05,
    defaultScale: 1.05,
    scaleClass: 'oversized' as const,
  },
  {
    id: IGAPO_LANDMARK_DECORATION_IDS.canoe,
    textureId: IGAPO_CANOA_TEXTURE_ID,
    layer: 'terrain' as const,
    depth: 1.2,
    defaultScale: 1.3,
    scaleClass: 'oversized' as const,
  },
  {
    id: IGAPO_LANDMARK_DECORATION_IDS.stiltHut,
    textureId: originalTexture(IGAPO_ORIGINAL_TEXTURE_IDS.stiltHut),
    layer: 'terrain' as const,
    depth: 4.62,
    defaultScale: 1.15,
    scaleClass: 'oversized' as const,
  },
  {
    id: IGAPO_LANDMARK_DECORATION_IDS.memoryStela,
    textureId: originalTexture(IGAPO_ORIGINAL_TEXTURE_IDS.memoryStela),
    layer: 'terrain' as const,
    depth: 4.05,
    defaultScale: 1.15,
    scaleClass: 'oversized' as const,
  },
  {
    id: IGAPO_LANDMARK_DECORATION_IDS.submergedTrunk,
    textureId: originalTexture(IGAPO_ORIGINAL_TEXTURE_IDS.submergedTrunk),
    layer: 'terrain' as const,
    depth: 2.08,
    defaultScale: 1.15,
    scaleClass: 'oversized' as const,
  },
  {
    id: IGAPO_LANDMARK_DECORATION_IDS.emergentGiant,
    textureId: originalTexture(IGAPO_ORIGINAL_TEXTURE_IDS.emergentTree),
    layer: 'foreground' as const,
    depth: 4.85,
    defaultScale: 2.35,
    scaleClass: 'oversized' as const,
  },
  // Water flora and underwater traces.
  {
    id: 'igapo_waterweed',
    frame: WORLD_FRAME.reeds,
    layer: 'terrain' as const,
    depth: 0.85,
    defaultScale: 1.7,
    scaleClass: 'prop' as const,
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

const sombrioTint = Object.freeze({
  tree: 0x6d8577,
  palm: 0x687f70,
  roots: 0x625f52,
  trunk: 0x5b6a62,
  waterPlant: 0x748a72,
  shore: 0x5e6d5e,
  moss: 0x5d6a52,
  hut: 0x60706a,
  stela: 0x74857f,
  bough: 0x4f655a,
  light: 0x21423d,
  shadow: 0x1a2c28,
});

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
    layer: 'terrain' as const,
    depth: 6.35,
    defaultScale: 4.4,
    scaleClass: 'oversized' as const,
  },
  // Dark reuse of the original silhouettes. The tint is declared on the
  // definition so placements stay shared between both presentations.
  {
    id: 'igapo_sombrio_flooded_tree',
    textureId: originalTexture(IGAPO_ORIGINAL_TEXTURE_IDS.emergentTree),
    layer: 'foreground' as const,
    depth: 4.35,
    defaultScale: 1.35,
    scaleClass: 'oversized' as const,
    tint: sombrioTint.tree,
  },
  {
    id: 'igapo_sombrio_palm_cluster',
    textureId: originalTexture(IGAPO_ORIGINAL_TEXTURE_IDS.palmCluster),
    layer: 'foreground' as const,
    depth: 4.4,
    defaultScale: 1.2,
    scaleClass: 'oversized' as const,
    tint: sombrioTint.palm,
  },
  {
    id: 'igapo_sombrio_root_tangle',
    textureId: originalTexture(IGAPO_ORIGINAL_TEXTURE_IDS.rootTangle),
    layer: 'terrain' as const,
    depth: 1.55,
    defaultScale: 1,
    scaleClass: 'oversized' as const,
    tint: sombrioTint.roots,
  },
  {
    id: 'igapo_sombrio_submerged_trunk',
    textureId: originalTexture(IGAPO_ORIGINAL_TEXTURE_IDS.submergedTrunk),
    layer: 'terrain' as const,
    depth: 2.02,
    defaultScale: 0.95,
    scaleClass: 'oversized' as const,
    tint: sombrioTint.trunk,
  },
  ...[0, 1, 2, 3].map(frameIndex => ({
    id: `igapo_sombrio_lily_${frameIndex}`,
    textureId: originalTexture(IGAPO_ORIGINAL_TEXTURE_IDS.waterLily),
    frame: frameIndex,
    layer: 'terrain' as const,
    depth: 1.86,
    defaultScale: 1,
    scaleClass: 'prop' as const,
    tint: sombrioTint.waterPlant,
  })),
  ...[0, 1, 2, 3].map(frameIndex => ({
    id: `igapo_sombrio_shore_${frameIndex}`,
    textureId: originalTexture(IGAPO_ORIGINAL_TEXTURE_IDS.shoreFringe),
    frame: frameIndex,
    layer: 'terrain' as const,
    depth: 1.94,
    defaultScale: 1,
    scaleClass: 'prop' as const,
    tint: sombrioTint.shore,
  })),
  ...[0, 1, 2, 3].map(frameIndex => ({
    id: `igapo_sombrio_moss_${frameIndex}`,
    textureId: originalTexture(IGAPO_ORIGINAL_TEXTURE_IDS.groundMoss),
    frame: frameIndex,
    layer: 'terrain' as const,
    depth: 0.78,
    defaultScale: 1,
    scaleClass: 'prop' as const,
    tint: sombrioTint.moss,
  })),
  {
    id: 'igapo_sombrio_stilt_hut',
    textureId: originalTexture(IGAPO_ORIGINAL_TEXTURE_IDS.stiltHut),
    layer: 'terrain' as const,
    depth: 4.55,
    defaultScale: 1.05,
    scaleClass: 'oversized' as const,
    tint: sombrioTint.hut,
  },
  {
    id: 'igapo_sombrio_memory_stela',
    textureId: originalTexture(IGAPO_ORIGINAL_TEXTURE_IDS.memoryStela),
    layer: 'terrain' as const,
    depth: 3.95,
    defaultScale: 1,
    scaleClass: 'oversized' as const,
    tint: sombrioTint.stela,
  },
  {
    id: 'igapo_sombrio_canopy_bough',
    textureId: originalTexture(IGAPO_ORIGINAL_TEXTURE_IDS.canopyBough),
    layer: 'foreground' as const,
    depth: 7.15,
    defaultScale: 1,
    scaleClass: 'oversized' as const,
    tint: sombrioTint.bough,
  },
  {
    id: 'igapo_sombrio_light_shaft',
    textureId: originalTexture(IGAPO_ORIGINAL_TEXTURE_IDS.lightShaft),
    layer: 'terrain' as const,
    depth: 7.1,
    defaultScale: 1.35,
    scaleClass: 'oversized' as const,
    tint: sombrioTint.light,
  },
  {
    id: 'igapo_sombrio_canopy_shade',
    textureId: originalTexture(IGAPO_ORIGINAL_TEXTURE_IDS.canopyShadow),
    layer: 'terrain' as const,
    depth: 1.28,
    defaultScale: 1.35,
    scaleClass: 'oversized' as const,
    tint: sombrioTint.shadow,
  },
  // Landmark counterparts.
  {
    id: 'igapo_sombrio_landmark_drowned_tree',
    textureId: originalTexture(IGAPO_ORIGINAL_TEXTURE_IDS.emergentTree),
    layer: 'foreground' as const,
    depth: 4.75,
    defaultScale: 1.9,
    scaleClass: 'oversized' as const,
    tint: sombrioTint.tree,
  },
  {
    id: 'igapo_sombrio_landmark_palm_island',
    textureId: originalTexture(IGAPO_ORIGINAL_TEXTURE_IDS.palmCluster),
    layer: 'foreground' as const,
    depth: 4.8,
    defaultScale: 1.55,
    scaleClass: 'oversized' as const,
    tint: sombrioTint.palm,
  },
  {
    id: 'igapo_sombrio_landmark_fallen_trunk',
    textureId: originalTexture(IGAPO_ORIGINAL_TEXTURE_IDS.submergedTrunk),
    layer: 'terrain' as const,
    depth: 2.05,
    defaultScale: 1.05,
    scaleClass: 'oversized' as const,
    tint: sombrioTint.trunk,
  },
  {
    id: 'igapo_sombrio_landmark_stilt_hut',
    textureId: originalTexture(IGAPO_ORIGINAL_TEXTURE_IDS.stiltHut),
    layer: 'terrain' as const,
    depth: 4.62,
    defaultScale: 1.15,
    scaleClass: 'oversized' as const,
    tint: sombrioTint.hut,
  },
  {
    id: 'igapo_sombrio_landmark_memory_stela',
    textureId: originalTexture(IGAPO_ORIGINAL_TEXTURE_IDS.memoryStela),
    layer: 'terrain' as const,
    depth: 4.05,
    defaultScale: 1.15,
    scaleClass: 'oversized' as const,
    tint: sombrioTint.stela,
  },
  {
    id: 'igapo_sombrio_landmark_submerged_trunk',
    textureId: originalTexture(IGAPO_ORIGINAL_TEXTURE_IDS.submergedTrunk),
    layer: 'terrain' as const,
    depth: 2.08,
    defaultScale: 1.15,
    scaleClass: 'oversized' as const,
    tint: sombrioTint.trunk,
  },
  {
    id: 'igapo_sombrio_landmark_emergent_giant',
    textureId: originalTexture(IGAPO_ORIGINAL_TEXTURE_IDS.emergentTree),
    layer: 'foreground' as const,
    depth: 4.85,
    defaultScale: 2.35,
    scaleClass: 'oversized' as const,
    tint: sombrioTint.tree,
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
  igapo_canopy_shadow: 'igapo_sombrio_canopy_shadow',
  igapo_canopy_high: 'igapo_sombrio_canopy_high',
  igapo_waterweed: 'igapo_sombrio_oil_slick',
  [IGAPO_LANDMARK_DECORATION_IDS.drownedTree]: 'igapo_sombrio_landmark_drowned_tree',
  [IGAPO_LANDMARK_DECORATION_IDS.oldArch]: 'igapo_sombrio_stone',
  [IGAPO_LANDMARK_DECORATION_IDS.palmIsland]: 'igapo_sombrio_landmark_palm_island',
  [IGAPO_LANDMARK_DECORATION_IDS.stoneGarden]: 'igapo_sombrio_waste',
  [IGAPO_LANDMARK_DECORATION_IDS.fallenTrunk]: 'igapo_sombrio_landmark_fallen_trunk',
  [IGAPO_LANDMARK_DECORATION_IDS.canoe]: IGAPO_LANDMARK_DECORATION_IDS.canoe,
  [IGAPO_LANDMARK_DECORATION_IDS.stiltHut]: 'igapo_sombrio_landmark_stilt_hut',
  [IGAPO_LANDMARK_DECORATION_IDS.memoryStela]: 'igapo_sombrio_landmark_memory_stela',
  [IGAPO_LANDMARK_DECORATION_IDS.submergedTrunk]: 'igapo_sombrio_landmark_submerged_trunk',
  [IGAPO_LANDMARK_DECORATION_IDS.emergentGiant]: 'igapo_sombrio_landmark_emergent_giant',
  [IGAPO_SCENERY_IDS.floodedTree]: 'igapo_sombrio_flooded_tree',
  [IGAPO_SCENERY_IDS.palmCluster]: 'igapo_sombrio_palm_cluster',
  [IGAPO_SCENERY_IDS.rootTangle]: 'igapo_sombrio_root_tangle',
  [IGAPO_SCENERY_IDS.submergedTrunk]: 'igapo_sombrio_submerged_trunk',
  [IGAPO_SCENERY_IDS.lily[0]]: 'igapo_sombrio_lily_0',
  [IGAPO_SCENERY_IDS.lily[1]]: 'igapo_sombrio_lily_1',
  [IGAPO_SCENERY_IDS.lily[2]]: 'igapo_sombrio_lily_2',
  [IGAPO_SCENERY_IDS.lily[3]]: 'igapo_sombrio_lily_3',
  [IGAPO_SCENERY_IDS.shore[0]]: 'igapo_sombrio_shore_0',
  [IGAPO_SCENERY_IDS.shore[1]]: 'igapo_sombrio_shore_1',
  [IGAPO_SCENERY_IDS.shore[2]]: 'igapo_sombrio_shore_2',
  [IGAPO_SCENERY_IDS.shore[3]]: 'igapo_sombrio_shore_3',
  [IGAPO_SCENERY_IDS.moss[0]]: 'igapo_sombrio_moss_0',
  [IGAPO_SCENERY_IDS.moss[1]]: 'igapo_sombrio_moss_1',
  [IGAPO_SCENERY_IDS.moss[2]]: 'igapo_sombrio_moss_2',
  [IGAPO_SCENERY_IDS.moss[3]]: 'igapo_sombrio_moss_3',
  [IGAPO_SCENERY_IDS.stiltHut]: 'igapo_sombrio_stilt_hut',
  [IGAPO_SCENERY_IDS.memoryStela]: 'igapo_sombrio_memory_stela',
  [IGAPO_SCENERY_IDS.canopyBough]: 'igapo_sombrio_canopy_bough',
  [IGAPO_SCENERY_IDS.lightShaft]: 'igapo_sombrio_light_shaft',
  [IGAPO_SCENERY_IDS.canopyShadow]: 'igapo_sombrio_canopy_shade',
});

export const IGAPO_NATURAL_EFFECTS: readonly StageEffectDefinition[] = Object.freeze([
  Object.freeze({
    id: 'effect.aguas.igapo.water-shimmer', kind: 'water-shimmer' as const,
    color: 0xa7e8cf, alpha: 0.13, depth: 2.04, durationMs: 2600, count: 48,
  }),
  Object.freeze({
    id: 'effect.aguas.igapo.water-shimmer-soft', kind: 'water-shimmer' as const,
    color: 0x8fc2ab, alpha: 0.06, depth: 1.99, durationMs: 4300, count: 44,
  }),
  Object.freeze({
    id: 'effect.aguas.igapo.mist', kind: 'mist' as const,
    color: 0x8fc9b4, alpha: 0.09, depth: 4.8, durationMs: 11000,
    x: 4, y: 5, width: 88, height: 18, count: 8, amplitude: 84,
  }),
  Object.freeze({
    id: 'effect.aguas.igapo.low-mist', kind: 'mist' as const,
    color: 0xbfe3cf, alpha: 0.06, depth: 2.25, durationMs: 9000,
    x: 10, y: 12, width: 76, height: 9, count: 6, amplitude: 60,
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
    id: 'effect.aguas.igapo.memory-spirits', kind: 'spirits' as const,
    color: 0x9be7d9, alpha: 0.42, depth: 8.3, durationMs: 5200,
    x: 24, y: 11, width: 18, height: 12, count: 12, amplitude: 18,
  }),
  Object.freeze({
    id: 'effect.aguas.igapo.foliage', kind: 'foliage-sway' as const,
    color: 0x4f8c63, alpha: 0.12, depth: 7.5, durationMs: 4200, amplitude: 1.1,
  }),
]);

export const IGAPO_SOMBRIO_EFFECTS: readonly StageEffectDefinition[] = Object.freeze([
  Object.freeze({
    id: 'effect.aguas.sombrio.water-shimmer', kind: 'water-shimmer' as const,
    color: 0xb7a66e, alpha: 0.1, depth: 2.04, durationMs: 3200, count: 64,
  }),
  Object.freeze({
    id: 'effect.aguas.sombrio.mist', kind: 'mist' as const,
    color: 0x19312e, alpha: 0.08, depth: 4.8, durationMs: 11000,
    x: 4, y: 5, width: 82, height: 18, count: 7, amplitude: 64,
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

const ORIGINAL_TEXTURE_METADATA = Object.freeze({
  [IGAPO_ORIGINAL_TEXTURE_IDS.forestFloor]: Object.freeze({
    frameWidth: 32, frameHeight: 32, frameCount: 2,
    sourceWidth: 64, sourceHeight: 32,
  }),
  [IGAPO_ORIGINAL_TEXTURE_IDS.emergentTree]: Object.freeze({
    frameWidth: 96, frameHeight: 128, frameCount: 1,
    sourceWidth: 96, sourceHeight: 128,
  }),
  [IGAPO_ORIGINAL_TEXTURE_IDS.palmCluster]: Object.freeze({
    frameWidth: 96, frameHeight: 112, frameCount: 1,
    sourceWidth: 96, sourceHeight: 112,
  }),
  [IGAPO_ORIGINAL_TEXTURE_IDS.rootTangle]: Object.freeze({
    frameWidth: 96, frameHeight: 64, frameCount: 1,
    sourceWidth: 96, sourceHeight: 64,
  }),
  [IGAPO_ORIGINAL_TEXTURE_IDS.submergedTrunk]: Object.freeze({
    frameWidth: 128, frameHeight: 64, frameCount: 1,
    sourceWidth: 128, sourceHeight: 64,
  }),
  [IGAPO_ORIGINAL_TEXTURE_IDS.waterLily]: Object.freeze({
    frameWidth: 32, frameHeight: 32, frameCount: 4,
    sourceWidth: 128, sourceHeight: 32,
  }),
  [IGAPO_ORIGINAL_TEXTURE_IDS.shoreFringe]: Object.freeze({
    frameWidth: 32, frameHeight: 32, frameCount: 4,
    sourceWidth: 128, sourceHeight: 32,
  }),
  [IGAPO_ORIGINAL_TEXTURE_IDS.groundMoss]: Object.freeze({
    frameWidth: 32, frameHeight: 32, frameCount: 4,
    sourceWidth: 128, sourceHeight: 32,
  }),
  [IGAPO_ORIGINAL_TEXTURE_IDS.stiltHut]: Object.freeze({
    frameWidth: 96, frameHeight: 80, frameCount: 1,
    sourceWidth: 96, sourceHeight: 80,
  }),
  [IGAPO_ORIGINAL_TEXTURE_IDS.memoryStela]: Object.freeze({
    frameWidth: 48, frameHeight: 80, frameCount: 1,
    sourceWidth: 48, sourceHeight: 80,
  }),
  [IGAPO_ORIGINAL_TEXTURE_IDS.canopyBough]: Object.freeze({
    frameWidth: 192, frameHeight: 64, frameCount: 1,
    sourceWidth: 192, sourceHeight: 64,
  }),
  [IGAPO_ORIGINAL_TEXTURE_IDS.lightShaft]: Object.freeze({
    frameWidth: 96, frameHeight: 192, frameCount: 1,
    sourceWidth: 96, sourceHeight: 192,
  }),
  [IGAPO_ORIGINAL_TEXTURE_IDS.canopyShadow]: Object.freeze({
    frameWidth: 96, frameHeight: 48, frameCount: 1,
    sourceWidth: 96, sourceHeight: 48,
  }),
});

const ORIGINAL_TEXTURE_KEYS: Readonly<Record<string, string>> = Object.freeze({
  [IGAPO_ORIGINAL_TEXTURE_IDS.forestFloor]: 'igapo_forest_floor_art',
  [IGAPO_ORIGINAL_TEXTURE_IDS.emergentTree]: 'igapo_emergent_tree_art',
  [IGAPO_ORIGINAL_TEXTURE_IDS.palmCluster]: 'igapo_palm_cluster_art',
  [IGAPO_ORIGINAL_TEXTURE_IDS.rootTangle]: 'igapo_root_tangle_art',
  [IGAPO_ORIGINAL_TEXTURE_IDS.submergedTrunk]: 'igapo_submerged_trunk_art',
  [IGAPO_ORIGINAL_TEXTURE_IDS.waterLily]: 'igapo_water_lily_art',
  [IGAPO_ORIGINAL_TEXTURE_IDS.shoreFringe]: 'igapo_shore_fringe_art',
  [IGAPO_ORIGINAL_TEXTURE_IDS.groundMoss]: 'igapo_ground_moss_art',
  [IGAPO_ORIGINAL_TEXTURE_IDS.stiltHut]: 'igapo_stilt_hut_art',
  [IGAPO_ORIGINAL_TEXTURE_IDS.memoryStela]: 'igapo_memory_stela_art',
  [IGAPO_ORIGINAL_TEXTURE_IDS.canopyBough]: 'igapo_canopy_bough_art',
  [IGAPO_ORIGINAL_TEXTURE_IDS.lightShaft]: 'igapo_light_shaft_art',
  [IGAPO_ORIGINAL_TEXTURE_IDS.canopyShadow]: 'igapo_canopy_shadow_art',
});

const originalTextures = Object.entries(ORIGINAL_TEXTURE_METADATA).map(([id, metadata]) =>
  Object.freeze({
    id,
    textureId: id,
    textureKey: ORIGINAL_TEXTURE_KEYS[id],
    pixelArt: true,
    perspective: 'top-down' as const,
    originId: IGAPO_ASSET_ORIGIN_ID,
    ...metadata,
  }));

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
      originId: IGAPO_ASSET_ORIGIN_ID,
    }),
    ...originalTextures,
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
      lightIntensity: 0.64,
      fog: Object.freeze({ color: 0x173f3c, opacity: 0.14, depth: 4 }),
    }),
    Object.freeze({
      id: IGAPO_SOMBRIO_ENVIRONMENT_ID,
      ambientColor: 0x163b3c,
      lightIntensity: 0.54,
      fog: Object.freeze({ color: 0x0a2026, opacity: 0.16, depth: 4 }),
    }),
  ]),
  themes: Object.freeze([
    Object.freeze({
      id: IGAPO_VISUAL_THEME_ID,
      revision: 4,
      tilesetId: IGAPO_VISUAL_TILESET_ID,
      decorationIds: Object.freeze(naturalDecorations.map(item => item.id)),
    }),
    Object.freeze({
      id: IGAPO_SOMBRIO_THEME_ID,
      revision: 4,
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
