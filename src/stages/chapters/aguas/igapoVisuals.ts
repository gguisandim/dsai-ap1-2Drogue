import type { ChapterVisualResources } from '../../contracts';

export const IGAPO_VISUAL_THEME_ID = 'theme.aguas.igapo';
export const IGAPO_VISUAL_TILESET_ID = 'tileset.aguas.igapo-technical';

export const AGUAS_VISUAL_RESOURCES: ChapterVisualResources = Object.freeze({
  textures: Object.freeze([
    Object.freeze({ id: 'texture.aguas.floor', textureKey: 'tile_floor' }),
    Object.freeze({ id: 'texture.aguas.wall', textureKey: 'tile_wall' }),
    Object.freeze({ id: 'texture.aguas.root', textureKey: 'tile_pillar' }),
    Object.freeze({ id: 'texture.aguas.water', textureKey: 'tile_water' }),
    Object.freeze({ id: 'texture.aguas.lava', textureKey: 'tile_lava' }),
    Object.freeze({ id: 'texture.aguas.exit', textureKey: 'tile_stairs' }),
    Object.freeze({ id: 'texture.aguas.chest', textureKey: 'item_chest' }),
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
  themes: Object.freeze([Object.freeze({
    id: IGAPO_VISUAL_THEME_ID,
    revision: 1,
    tilesetId: IGAPO_VISUAL_TILESET_ID,
    decorationIds: Object.freeze([
      'igapo_emergent_tree', 'igapo_fallen_trunk', 'igapo_memory_reeds',
    ]),
  })]),
});
