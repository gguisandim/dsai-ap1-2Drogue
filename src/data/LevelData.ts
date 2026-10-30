// src/data/LevelData.ts
// Hand-crafted level definitions for the Bayonetta-inspired roguelike.
// Each level has a tile map (40 wide × 25 tall), enemy placements, item placements,
// decorations, and metadata.
//
// Tile Legend:
//   0 = Floor (walkable)
//   1 = Wall (stone)
//   2 = Pillar (destructible)
//   3 = Water/Pit (hazard)
//   4 = Lava (damage)
//   5 = Stairs/Exit
//   6 = Door (locked)
//   7 = Chest location
//   8 = Spawn point
//   9 = Boss spawn

export interface SectionExit {
  /** Tile coords of the door */
  x: number;
  y: number;
  /** Index of the target section */
  to: number;
  /** Where the player appears in the target section (tile coords) */
  spawnX: number;
  spawnY: number;
}

export interface EnemyPlacement {
  type: string;
  x: number;
  y: number;
  level: number;
  patrol?: { x: number; y: number }[];
  dropTable?: { itemId: string; chance: number }[];
}

export interface ItemPlacement {
  type: string;
  x: number;
  y: number;
  quantity?: number;
}

export interface DecorationPlacement {
  type: string;
  x: number;
  y: number;
  scale?: number;
  rotation?: number;
  tint?: number;
  layer?: 'background' | 'terrain' | 'foreground';
  depth?: number;
  visible?: boolean;
}

export interface LevelDefinition {
  id: string;
  name: string;
  description: string;
  theme: 'gothic_cathedral' | 'inferno_pit' | 'celestial_tower' | 'venetian_streets' |
         'roman_ruins' | 'paradiso_garden' | 'witches_crypt' | 'clocktower' |
         'colosseum' | 'limbo_void';
  music: string;
  ambientColor: number;
  fogColor: number;
  fogDensity: number;
  lightIntensity: number;
  tileMap: number[][];
  enemies: EnemyPlacement[];
  items: ItemPlacement[];
  decorations: DecorationPlacement[];
  exits?: SectionExit[];
  ambush?: EnemyPlacement[];
  waves?: { delay: number; enemies: EnemyPlacement[] }[];
  bossId?: string;
  unlockCondition?: string;
  parTime: number; // seconds
  difficulty: number; // 1-10
}

// ═══════════════════════════════════════════════════════════════════
// LEVEL 1 — THE VESTIBULE (Tutorial)
// ═══════════════════════════════════════════════════════════════════
export const LEVEL_01_VESTIBULE: LevelDefinition = {
  id: 'level_01_vestibule',
  name: 'The Vestibule',
  description: 'The entrance hall of Vigrid Cathedral. A place of fading holiness, now corrupted by angelic zealots.',
  theme: 'gothic_cathedral',
  music: 'ost_vestibule',
  ambientColor: 0x332244,
  fogColor: 0x1a0a2e,
  fogDensity: 0.3,
  lightIntensity: 0.6,
  tileMap: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,7,0,0,0,0,0,0,0,0,0,0,0,0,7,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
  enemies: [
    { type: 'affinity', x: 15, y: 6, level: 1, dropTable: [{ itemId: 'halos_small', chance: 0.5 }] },
    { type: 'affinity', x: 25, y: 6, level: 1, dropTable: [{ itemId: 'halos_small', chance: 0.5 }] },
    { type: 'affinity', x: 20, y: 12, level: 1, dropTable: [{ itemId: 'health_herb', chance: 0.3 }] },
    { type: 'dear_and_decorations', x: 30, y: 15, level: 2, patrol: [{ x: 30, y: 15 }, { x: 35, y: 15 }] },
  ],
  items: [
    { type: 'health_herb', x: 13, y: 7, quantity: 1 },
    { type: 'halos_medium', x: 26, y: 7, quantity: 50 },
  ],
  decorations: [
    { type: 'candelabra', x: 5, y: 3, scale: 1.0 },
    { type: 'candelabra', x: 35, y: 3, scale: 1.0 },
    { type: 'broken_pew', x: 10, y: 8, scale: 0.8, rotation: 0.1 },
    { type: 'broken_pew', x: 12, y: 9, scale: 0.9, rotation: -0.05 },
    { type: 'stained_glass_shard', x: 20, y: 2, scale: 1.2, tint: 0xff3366 },
    { type: 'stained_glass_shard', x: 22, y: 2, scale: 1.1, tint: 0x3366ff },
    { type: 'gargoyle_statue', x: 5, y: 10, scale: 1.0 },
    { type: 'gargoyle_statue', x: 35, y: 10, scale: 1.0 },
    { type: 'blood_stain', x: 18, y: 14, scale: 0.7 },
    { type: 'blood_stain', x: 22, y: 14, scale: 0.6 },
    { type: 'torch_sconce', x: 1, y: 5, scale: 1.0 },
    { type: 'torch_sconce', x: 1, y: 15, scale: 1.0 },
    { type: 'torch_sconce', x: 39, y: 5, scale: 1.0 },
    { type: 'torch_sconce', x: 39, y: 15, scale: 1.0 },
  ],
  waves: [
    {
      delay: 5000,
      enemies: [
        { type: 'affinity', x: 10, y: 18, level: 1 },
        { type: 'affinity', x: 30, y: 18, level: 1 },
      ],
    },
    {
      delay: 12000,
      enemies: [
        { type: 'dear_and_decorations', x: 20, y: 4, level: 2 },
        { type: 'affinity', x: 15, y: 20, level: 2 },
        { type: 'affinity', x: 25, y: 20, level: 2 },
      ],
    },
  ],
  parTime: 120,
  difficulty: 1,
};

// ═══════════════════════════════════════════════════════════════════
// LEVEL 2 — THE NAVE
// ═══════════════════════════════════════════════════════════════════
export const LEVEL_02_NAVE: LevelDefinition = {
  id: 'level_02_nave',
  name: 'The Nave',
  description: 'The grand central hall of Vigrid Cathedral. Rows of shattered pews line the blood-stained marble floor.',
  theme: 'gothic_cathedral',
  music: 'ost_nave',
  ambientColor: 0x221133,
  fogColor: 0x110822,
  fogDensity: 0.4,
  lightIntensity: 0.5,
  tileMap: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1],
    [1,0,0,8,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1],
    [1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,7,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,2,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,2,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,0,0,0,0,0,0,2,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,2,0,0,0,0,0,0,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,2,0,0,2,0,0,0,0,0,0,3,3,0,0,0,0,0,0,2,0,0,2,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3,3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3,3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,2,0,0,2,0,0,0,0,0,0,3,3,0,0,0,0,0,0,2,0,0,2,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,0,0,0,0,0,0,2,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,2,0,0,0,0,0,0,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,2,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,2,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
  enemies: [
    { type: 'affinity', x: 15, y: 5, level: 2, dropTable: [{ itemId: 'halos_small', chance: 0.6 }] },
    { type: 'affinity', x: 25, y: 5, level: 2, dropTable: [{ itemId: 'halos_small', chance: 0.6 }] },
    { type: 'affinity', x: 20, y: 9, level: 2, dropTable: [{ itemId: 'health_herb', chance: 0.2 }] },
    { type: 'dear_and_decorations', x: 10, y: 15, level: 3, patrol: [{ x: 10, y: 15 }, { x: 10, y: 20 }] },
    { type: 'dear_and_decorations', x: 30, y: 15, level: 3, patrol: [{ x: 30, y: 15 }, { x: 30, y: 20 }] },
    { type: 'applaud', x: 20, y: 18, level: 3, dropTable: [{ itemId: 'halos_medium', chance: 0.4 }] },
  ],
  items: [
    { type: 'health_herb', x: 36, y: 3, quantity: 1 },
    { type: 'mana_shard', x: 5, y: 18, quantity: 1 },
    { type: 'halos_medium', x: 20, y: 6, quantity: 100 },
  ],
  decorations: [
    { type: 'grand_chandelier', x: 20, y: 4, scale: 2.0 },
    { type: 'broken_pew', x: 9, y: 5, scale: 0.9 },
    { type: 'broken_pew', x: 9, y: 8, scale: 0.9 },
    { type: 'broken_pew', x: 9, y: 11, scale: 0.9 },
    { type: 'broken_pew', x: 9, y: 14, scale: 0.9 },
    { type: 'broken_pew', x: 9, y: 17, scale: 0.9 },
    { type: 'broken_pew', x: 9, y: 20, scale: 0.9 },
    { type: 'broken_pew', x: 12, y: 5, scale: 0.9 },
    { type: 'broken_pew', x: 12, y: 8, scale: 0.9 },
    { type: 'broken_pew', x: 12, y: 11, scale: 0.9 },
    { type: 'broken_pew', x: 12, y: 14, scale: 0.9 },
    { type: 'broken_pew', x: 12, y: 17, scale: 0.9 },
    { type: 'broken_pew', x: 12, y: 20, scale: 0.9 },
    { type: 'broken_pew', x: 27, y: 5, scale: 0.9 },
    { type: 'broken_pew', x: 27, y: 8, scale: 0.9 },
    { type: 'broken_pew', x: 27, y: 11, scale: 0.9 },
    { type: 'broken_pew', x: 27, y: 14, scale: 0.9 },
    { type: 'broken_pew', x: 27, y: 17, scale: 0.9 },
    { type: 'broken_pew', x: 27, y: 20, scale: 0.9 },
    { type: 'broken_pew', x: 30, y: 5, scale: 0.9 },
    { type: 'broken_pew', x: 30, y: 8, scale: 0.9 },
    { type: 'broken_pew', x: 30, y: 11, scale: 0.9 },
    { type: 'broken_pew', x: 30, y: 14, scale: 0.9 },
    { type: 'broken_pew', x: 30, y: 17, scale: 0.9 },
    { type: 'broken_pew', x: 30, y: 20, scale: 0.9 },
    { type: 'altar_of_light', x: 20, y: 22, scale: 1.5 },
    { type: 'holy_water_font', x: 3, y: 2, scale: 1.0 },
    { type: 'holy_water_font', x: 37, y: 2, scale: 1.0 },
    { type: 'torch_sconce', x: 1, y: 4, scale: 1.0 },
    { type: 'torch_sconce', x: 1, y: 12, scale: 1.0 },
    { type: 'torch_sconce', x: 1, y: 20, scale: 1.0 },
    { type: 'torch_sconce', x: 39, y: 4, scale: 1.0 },
    { type: 'torch_sconce', x: 39, y: 12, scale: 1.0 },
    { type: 'torch_sconce', x: 39, y: 20, scale: 1.0 },
    { type: 'blood_stain', x: 15, y: 10, scale: 1.2 },
    { type: 'blood_stain', x: 25, y: 16, scale: 0.8 },
  ],
  waves: [
    {
      delay: 8000,
      enemies: [
        { type: 'affinity', x: 5, y: 10, level: 2 },
        { type: 'affinity', x: 35, y: 10, level: 2 },
        { type: 'affinity', x: 5, y: 20, level: 2 },
        { type: 'affinity', x: 35, y: 20, level: 2 },
      ],
    },
    {
      delay: 18000,
      enemies: [
        { type: 'applaud', x: 10, y: 10, level: 3 },
        { type: 'applaud', x: 30, y: 10, level: 3 },
        { type: 'dear_and_decorations', x: 20, y: 15, level: 3 },
      ],
    },
    {
      delay: 30000,
      enemies: [
        { type: 'enchant', x: 20, y: 8, level: 4, dropTable: [{ itemId: 'witch_heart_fragment', chance: 0.15 }] },
      ],
    },
  ],
  parTime: 180,
  difficulty: 2,
};

// ═══════════════════════════════════════════════════════════════════
// LEVEL 3 — VIGRID STREETS
// ═══════════════════════════════════════════════════════════════════
export const LEVEL_03_VIGRID_STREETS: LevelDefinition = {
  id: 'level_03_vigrid_streets',
  name: 'Vigrid Streets',
  description: 'The cobblestone streets of the ancient Italian city of Vigrid, where angels descend from golden portals.',
  theme: 'venetian_streets',
  music: 'ost_vigrid_streets',
  ambientColor: 0x445566,
  fogColor: 0x223344,
  fogDensity: 0.2,
  lightIntensity: 0.8,
  tileMap: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,8,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,7,0,1,0,0,0,0,1,0,7,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1,1,0,0,0,0,1,1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,5,5,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,5,5,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
  enemies: [
    { type: 'affinity', x: 5, y: 5, level: 3 },
    { type: 'affinity', x: 35, y: 5, level: 3 },
    { type: 'dear_and_decorations', x: 20, y: 9, level: 3, patrol: [{ x: 15, y: 9 }, { x: 25, y: 9 }] },
    { type: 'applaud', x: 8, y: 13, level: 4 },
    { type: 'applaud', x: 32, y: 13, level: 4 },
    { type: 'enchant', x: 20, y: 17, level: 4, dropTable: [{ itemId: 'rosemary_charm', chance: 0.2 }] },
    { type: 'grace_and_glory', x: 20, y: 13, level: 5, dropTable: [{ itemId: 'witch_heart_fragment', chance: 0.1 }] },
  ],
  items: [
    { type: 'health_herb', x: 15, y: 4, quantity: 1 },
    { type: 'health_herb', x: 24, y: 4, quantity: 1 },
    { type: 'mana_shard', x: 3, y: 12, quantity: 1 },
    { type: 'halos_large', x: 37, y: 12, quantity: 200 },
  ],
  decorations: [
    { type: 'fountain', x: 20, y: 9, scale: 1.5 },
    { type: 'street_lamp', x: 5, y: 1, scale: 1.0 },
    { type: 'street_lamp', x: 35, y: 1, scale: 1.0 },
    { type: 'street_lamp', x: 5, y: 23, scale: 1.0 },
    { type: 'street_lamp', x: 35, y: 23, scale: 1.0 },
    { type: 'flower_pot', x: 13, y: 2, scale: 0.7 },
    { type: 'flower_pot', x: 17, y: 2, scale: 0.7 },
    { type: 'flower_pot', x: 22, y: 2, scale: 0.7 },
    { type: 'flower_pot', x: 27, y: 2, scale: 0.7 },
    { type: 'cobblestone_crack', x: 10, y: 8, scale: 1.0 },
    { type: 'cobblestone_crack', x: 30, y: 14, scale: 0.8 },
    { type: 'market_stall_broken', x: 6, y: 18, scale: 1.0, rotation: 0.1 },
    { type: 'market_stall_broken', x: 34, y: 18, scale: 1.0, rotation: -0.1 },
    { type: 'ivy_wall', x: 10, y: 10, scale: 1.0 },
    { type: 'ivy_wall', x: 10, y: 16, scale: 1.0 },
    { type: 'ivy_wall', x: 29, y: 10, scale: 1.0 },
    { type: 'ivy_wall', x: 29, y: 16, scale: 1.0 },
    { type: 'italian_flag_banner', x: 20, y: 1, scale: 1.2, tint: 0x009246 },
    { type: 'pigeon_flock', x: 18, y: 7, scale: 0.5 },
  ],
  waves: [
    {
      delay: 6000,
      enemies: [
        { type: 'affinity', x: 3, y: 7, level: 3 },
        { type: 'affinity', x: 37, y: 7, level: 3 },
        { type: 'affinity', x: 3, y: 17, level: 3 },
        { type: 'affinity', x: 37, y: 17, level: 3 },
      ],
    },
    {
      delay: 15000,
      enemies: [
        { type: 'dear_and_decorations', x: 10, y: 5, level: 4 },
        { type: 'dear_and_decorations', x: 30, y: 5, level: 4 },
        { type: 'applaud', x: 20, y: 20, level: 4 },
      ],
    },
    {
      delay: 25000,
      enemies: [
        { type: 'grace_and_glory', x: 15, y: 12, level: 5 },
        { type: 'grace_and_glory', x: 25, y: 12, level: 5 },
      ],
    },
  ],
  parTime: 200,
  difficulty: 3,
};

// ═══════════════════════════════════════════════════════════════════
// LEVEL 4 — THE COLOSSEUM RUINS
// ═══════════════════════════════════════════════════════════════════
export const LEVEL_04_COLOSSEUM: LevelDefinition = {
  id: 'level_04_colosseum',
  name: 'The Colosseum Ruins',
  description: 'An ancient Roman arena consumed by time and demonic energy. The sand still thirsts for blood.',
  theme: 'colosseum',
  music: 'ost_colosseum',
  ambientColor: 0x664422,
  fogColor: 0x332211,
  fogDensity: 0.15,
  lightIntensity: 0.9,
  tileMap: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1],
    [1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1],
    [1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,4,4,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,4,4,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
    [1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
    [1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1],
    [1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1],
    [1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
  enemies: [
    { type: 'affinity', x: 10, y: 5, level: 4 },
    { type: 'affinity', x: 30, y: 5, level: 4 },
    { type: 'affinity', x: 10, y: 18, level: 4 },
    { type: 'affinity', x: 30, y: 18, level: 4 },
    { type: 'dear_and_decorations', x: 6, y: 8, level: 4, patrol: [{ x: 6, y: 5 }, { x: 6, y: 18 }] },
    { type: 'dear_and_decorations', x: 34, y: 8, level: 4, patrol: [{ x: 34, y: 5 }, { x: 34, y: 18 }] },
    { type: 'applaud', x: 15, y: 8, level: 5 },
    { type: 'applaud', x: 25, y: 8, level: 5 },
    { type: 'grace_and_glory', x: 20, y: 5, level: 6, dropTable: [{ itemId: 'broken_witch_heart', chance: 0.1 }] },
    { type: 'enchant', x: 10, y: 12, level: 5 },
    { type: 'enchant', x: 30, y: 12, level: 5 },
  ],
  items: [
    { type: 'mega_health_herb', x: 20, y: 3, quantity: 1 },
    { type: 'mana_shard', x: 5, y: 12, quantity: 2 },
    { type: 'halos_large', x: 35, y: 12, quantity: 300 },
  ],
  decorations: [
    { type: 'broken_column', x: 11, y: 6, scale: 1.2 },
    { type: 'broken_column', x: 28, y: 6, scale: 1.2 },
    { type: 'broken_column', x: 11, y: 16, scale: 1.0 },
    { type: 'broken_column', x: 28, y: 16, scale: 1.0 },
    { type: 'gladiator_skeleton', x: 8, y: 10, scale: 0.8 },
    { type: 'gladiator_skeleton', x: 32, y: 14, scale: 0.8, rotation: 1.2 },
    { type: 'spectator_stands', x: 2, y: 4, scale: 2.0 },
    { type: 'spectator_stands', x: 38, y: 4, scale: 2.0 },
    { type: 'spectator_stands', x: 2, y: 20, scale: 2.0 },
    { type: 'spectator_stands', x: 38, y: 20, scale: 2.0 },
    { type: 'sand_pit', x: 20, y: 11, scale: 3.0 },
    { type: 'iron_gate', x: 20, y: 21, scale: 1.5 },
    { type: 'weapon_rack', x: 4, y: 8, scale: 1.0 },
    { type: 'weapon_rack', x: 36, y: 8, scale: 1.0 },
    { type: 'torch_brazier', x: 11, y: 1, scale: 1.0 },
    { type: 'torch_brazier', x: 28, y: 1, scale: 1.0 },
    { type: 'torch_brazier', x: 11, y: 23, scale: 1.0 },
    { type: 'torch_brazier', x: 28, y: 23, scale: 1.0 },
  ],
  waves: [
    {
      delay: 5000,
      enemies: [
        { type: 'affinity', x: 5, y: 5, level: 4 },
        { type: 'affinity', x: 35, y: 5, level: 4 },
        { type: 'affinity', x: 5, y: 18, level: 4 },
        { type: 'affinity', x: 35, y: 18, level: 4 },
        { type: 'affinity', x: 20, y: 15, level: 4 },
      ],
    },
    {
      delay: 15000,
      enemies: [
        { type: 'grace_and_glory', x: 10, y: 8, level: 6 },
        { type: 'grace_and_glory', x: 30, y: 8, level: 6 },
        { type: 'applaud', x: 20, y: 18, level: 5 },
        { type: 'applaud', x: 15, y: 15, level: 5 },
        { type: 'applaud', x: 25, y: 15, level: 5 },
      ],
    },
    {
      delay: 30000,
      enemies: [
        { type: 'fearless', x: 20, y: 8, level: 7, dropTable: [{ itemId: 'witch_heart_fragment', chance: 0.2 }] },
        { type: 'enchant', x: 10, y: 15, level: 6 },
        { type: 'enchant', x: 30, y: 15, level: 6 },
      ],
    },
  ],
  parTime: 240,
  difficulty: 4,
};

// ═══════════════════════════════════════════════════════════════════
// LEVEL 5 — THE CLOCKTOWER
// ═══════════════════════════════════════════════════════════════════
export const LEVEL_05_CLOCKTOWER: LevelDefinition = {
  id: 'level_05_clocktower',
  name: 'The Clocktower',
  description: 'Gears grind and pendulums swing in this towering mechanism. Angels lurk between the cogs of time itself.',
  theme: 'clocktower',
  music: 'ost_clocktower',
  ambientColor: 0x443322,
  fogColor: 0x221100,
  fogDensity: 0.35,
  lightIntensity: 0.4,
  tileMap: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,8,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,3,3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3,3,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,3,3,3,3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,3,3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3,3,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,7,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,3,3,3,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,3,3,3,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,3,3,3,3,3,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,3,3,3,3,3,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,3,3,3,0,0,0,0,0,1,0,0,0,5,5,0,0,0,1,0,0,0,0,0,3,3,3,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
  enemies: [
    { type: 'affinity', x: 5, y: 4, level: 5 },
    { type: 'affinity', x: 35, y: 4, level: 5 },
    { type: 'dear_and_decorations', x: 18, y: 2, level: 5 },
    { type: 'dear_and_decorations', x: 22, y: 2, level: 5 },
    { type: 'enchant', x: 5, y: 12, level: 6, patrol: [{ x: 5, y: 12 }, { x: 5, y: 18 }] },
    { type: 'enchant', x: 35, y: 12, level: 6, patrol: [{ x: 35, y: 12 }, { x: 35, y: 18 }] },
    { type: 'grace_and_glory', x: 20, y: 12, level: 6 },
    { type: 'fearless', x: 20, y: 18, level: 7 },
    { type: 'applaud', x: 10, y: 15, level: 5 },
    { type: 'applaud', x: 30, y: 15, level: 5 },
  ],
  items: [
    { type: 'mega_health_herb', x: 19, y: 15, quantity: 1 },
    { type: 'mana_crystal', x: 3, y: 11, quantity: 1 },
    { type: 'halos_large', x: 37, y: 11, quantity: 400 },
  ],
  decorations: [
    { type: 'giant_gear', x: 8, y: 6, scale: 3.0, rotation: 0.5 },
    { type: 'giant_gear', x: 32, y: 6, scale: 3.0, rotation: -0.3 },
    { type: 'giant_gear', x: 8, y: 20, scale: 3.0, rotation: 1.2 },
    { type: 'giant_gear', x: 32, y: 20, scale: 3.0, rotation: -1.0 },
    { type: 'pendulum', x: 20, y: 6, scale: 2.0 },
    { type: 'clock_face', x: 20, y: 1, scale: 2.5 },
    { type: 'small_gear', x: 15, y: 1, scale: 1.0, rotation: 0.8 },
    { type: 'small_gear', x: 25, y: 1, scale: 1.0, rotation: -0.4 },
    { type: 'small_gear', x: 15, y: 23, scale: 1.0, rotation: 1.5 },
    { type: 'small_gear', x: 25, y: 23, scale: 1.0, rotation: -1.2 },
    { type: 'chain', x: 3, y: 5, scale: 1.5 },
    { type: 'chain', x: 37, y: 5, scale: 1.5 },
    { type: 'chain', x: 3, y: 19, scale: 1.5 },
    { type: 'chain', x: 37, y: 19, scale: 1.5 },
    { type: 'oil_stain', x: 12, y: 8, scale: 0.8 },
    { type: 'oil_stain', x: 28, y: 16, scale: 0.6 },
    { type: 'brass_pipe', x: 15, y: 8, scale: 1.0 },
    { type: 'brass_pipe', x: 24, y: 8, scale: 1.0 },
  ],
  waves: [
    {
      delay: 6000,
      enemies: [
        { type: 'affinity', x: 3, y: 4, level: 5 },
        { type: 'affinity', x: 37, y: 4, level: 5 },
        { type: 'affinity', x: 3, y: 22, level: 5 },
        { type: 'affinity', x: 37, y: 22, level: 5 },
      ],
    },
    {
      delay: 18000,
      enemies: [
        { type: 'grace_and_glory', x: 10, y: 12, level: 7 },
        { type: 'grace_and_glory', x: 30, y: 12, level: 7 },
        { type: 'enchant', x: 20, y: 6, level: 6 },
      ],
    },
    {
      delay: 35000,
      enemies: [
        { type: 'fearless', x: 15, y: 10, level: 8 },
        { type: 'fearless', x: 25, y: 10, level: 8 },
        { type: 'fairness', x: 20, y: 15, level: 8, dropTable: [{ itemId: 'moon_pearl', chance: 0.15 }] },
      ],
    },
  ],
  parTime: 300,
  difficulty: 5,
};

// ═══════════════════════════════════════════════════════════════════
// LEVEL 6 — THE INFERNO DESCENT
// ═══════════════════════════════════════════════════════════════════
export const LEVEL_06_INFERNO: LevelDefinition = {
  id: 'level_06_inferno',
  name: 'The Inferno Descent',
  description: 'A fiery chasm where demons reign. Rivers of molten rock flow beneath crumbling obsidian bridges.',
  theme: 'inferno_pit',
  music: 'ost_inferno',
  ambientColor: 0x881100,
  fogColor: 0x440800,
  fogDensity: 0.5,
  lightIntensity: 0.7,
  tileMap: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,1],
    [1,4,4,0,0,0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,4,4,1],
    [1,4,4,0,8,0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,4,4,1],
    [1,4,4,0,0,0,0,0,0,0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,0,0,4,4,1],
    [1,4,4,4,4,4,0,0,0,0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0,4,4,4,4,4,1],
    [1,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,4,4,4,4,4,4,4,4,1],
    [1,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,4,4,4,4,4,4,4,4,1],
    [1,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,4,4,4,4,4,4,4,4,4,1],
    [1,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,4,4,4,4,4,4,4,4,4,1],
    [1,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,1],
    [1,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,1],
    [1,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,1],
    [1,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,4,4,4,4,4,4,4,4,4,1],
    [1,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,4,4,4,4,4,4,4,4,4,1],
    [1,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,4,4,4,4,4,4,4,4,1],
    [1,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,4,4,4,4,4,4,4,4,1],
    [1,4,4,4,4,4,0,0,0,0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0,4,4,4,4,4,1],
    [1,4,4,0,0,0,0,0,0,0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,0,0,4,4,1],
    [1,4,4,0,0,0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,4,4,1],
    [1,4,4,0,0,0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,4,4,1],
    [1,4,4,0,0,0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,5,5,0,4,4,1],
    [1,4,4,0,0,7,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,5,5,0,4,4,1],
    [1,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
  enemies: [
    { type: 'affinity', x: 4, y: 3, level: 6 },
    { type: 'affinity', x: 35, y: 3, level: 6 },
    { type: 'dear_and_decorations', x: 20, y: 9, level: 7 },
    { type: 'dear_and_decorations', x: 20, y: 13, level: 7 },
    { type: 'enchant', x: 14, y: 7, level: 7, patrol: [{ x: 12, y: 7 }, { x: 16, y: 7 }] },
    { type: 'enchant', x: 26, y: 7, level: 7, patrol: [{ x: 24, y: 7 }, { x: 28, y: 7 }] },
    { type: 'grace_and_glory', x: 14, y: 14, level: 7 },
    { type: 'grace_and_glory', x: 26, y: 14, level: 7 },
    { type: 'fearless', x: 20, y: 11, level: 8 },
    { type: 'fairness', x: 4, y: 19, level: 8 },
    { type: 'harmony', x: 35, y: 19, level: 8 },
  ],
  items: [
    { type: 'mega_health_herb', x: 5, y: 22, quantity: 1 },
    { type: 'lollipop_purple', x: 20, y: 8, quantity: 1 },
    { type: 'halos_large', x: 20, y: 13, quantity: 500 },
  ],
  decorations: [
    { type: 'lava_geyser', x: 7, y: 1, scale: 1.5 },
    { type: 'lava_geyser', x: 33, y: 1, scale: 1.5 },
    { type: 'lava_geyser', x: 7, y: 23, scale: 1.5 },
    { type: 'lava_geyser', x: 33, y: 23, scale: 1.5 },
    { type: 'obsidian_bridge', x: 11, y: 8, scale: 2.0 },
    { type: 'obsidian_bridge', x: 28, y: 8, scale: 2.0 },
    { type: 'obsidian_bridge', x: 11, y: 14, scale: 2.0 },
    { type: 'obsidian_bridge', x: 28, y: 14, scale: 2.0 },
    { type: 'demon_skull', x: 20, y: 10, scale: 2.0, tint: 0xff2200 },
    { type: 'bone_pile', x: 15, y: 11, scale: 0.8 },
    { type: 'bone_pile', x: 25, y: 11, scale: 0.8 },
    { type: 'flame_pillar', x: 15, y: 8, scale: 1.5 },
    { type: 'flame_pillar', x: 24, y: 8, scale: 1.5 },
    { type: 'flame_pillar', x: 15, y: 14, scale: 1.5 },
    { type: 'flame_pillar', x: 24, y: 14, scale: 1.5 },
    { type: 'cracked_ground', x: 20, y: 5, scale: 1.0 },
    { type: 'cracked_ground', x: 20, y: 18, scale: 1.0 },
    { type: 'infernal_chain', x: 3, y: 10, scale: 1.5 },
    { type: 'infernal_chain', x: 37, y: 10, scale: 1.5 },
  ],
  waves: [
    {
      delay: 4000,
      enemies: [
        { type: 'affinity', x: 10, y: 8, level: 6 },
        { type: 'affinity', x: 26, y: 8, level: 6 },
        { type: 'affinity', x: 14, y: 14, level: 6 },
        { type: 'affinity', x: 26, y: 14, level: 6 },
      ],
    },
    {
      delay: 12000,
      enemies: [
        { type: 'grace_and_glory', x: 18, y: 8, level: 8 },
        { type: 'grace_and_glory', x: 22, y: 8, level: 8 },
        { type: 'fearless', x: 20, y: 14, level: 8 },
      ],
    },
    {
      delay: 25000,
      enemies: [
        { type: 'harmony', x: 16, y: 11, level: 9 },
        { type: 'harmony', x: 24, y: 11, level: 9 },
        { type: 'fairness', x: 20, y: 8, level: 9, dropTable: [{ itemId: 'witch_heart', chance: 0.1 }] },
      ],
    },
  ],
  parTime: 300,
  difficulty: 6,
};

// ═══════════════════════════════════════════════════════════════════
// LEVEL 7 — THE WITCHES' CRYPT
// ═══════════════════════════════════════════════════════════════════
export const LEVEL_07_WITCHES_CRYPT: LevelDefinition = {
  id: 'level_07_witches_crypt',
  name: "The Witches' Crypt",
  description: 'A hidden underground mausoleum where the Umbra Witches once laid their dead. Dark magic still pulses through the stone.',
  theme: 'witches_crypt',
  music: 'ost_crypt',
  ambientColor: 0x112233,
  fogColor: 0x0a1122,
  fogDensity: 0.6,
  lightIntensity: 0.3,
  tileMap: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,8,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,7,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,2,0,0,0,2,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,2,0,0,0,2,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,7,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,5,5,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,5,5,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
  enemies: [
    { type: 'affinity', x: 15, y: 4, level: 7 },
    { type: 'affinity', x: 25, y: 4, level: 7 },
    { type: 'enchant', x: 5, y: 10, level: 8, patrol: [{ x: 3, y: 10 }, { x: 8, y: 10 }] },
    { type: 'enchant', x: 35, y: 10, level: 8, patrol: [{ x: 32, y: 10 }, { x: 37, y: 10 }] },
    { type: 'grace_and_glory', x: 20, y: 10, level: 8 },
    { type: 'fearless', x: 15, y: 13, level: 8 },
    { type: 'fearless', x: 25, y: 13, level: 8 },
    { type: 'fairness', x: 5, y: 18, level: 9 },
    { type: 'harmony', x: 35, y: 18, level: 9 },
    { type: 'joy', x: 20, y: 18, level: 9, dropTable: [{ itemId: 'umbran_tears', chance: 0.1 }] },
  ],
  items: [
    { type: 'mega_health_herb', x: 36, y: 3, quantity: 1 },
    { type: 'mana_crystal', x: 3, y: 20, quantity: 1 },
    { type: 'halos_large', x: 20, y: 6, quantity: 600 },
  ],
  decorations: [
    { type: 'sarcophagus', x: 5, y: 2, scale: 1.2 },
    { type: 'sarcophagus', x: 5, y: 6, scale: 1.2 },
    { type: 'sarcophagus', x: 35, y: 2, scale: 1.2 },
    { type: 'sarcophagus', x: 35, y: 6, scale: 1.2 },
    { type: 'sarcophagus', x: 5, y: 20, scale: 1.2 },
    { type: 'sarcophagus', x: 35, y: 20, scale: 1.2 },
    { type: 'umbra_symbol', x: 20, y: 12, scale: 3.0, tint: 0x6600cc },
    { type: 'witch_coffin', x: 16, y: 11, scale: 1.0 },
    { type: 'witch_coffin', x: 23, y: 11, scale: 1.0 },
    { type: 'magic_circle', x: 20, y: 6, scale: 2.0, tint: 0x9933ff },
    { type: 'candelabra', x: 11, y: 2, scale: 1.0 },
    { type: 'candelabra', x: 29, y: 2, scale: 1.0 },
    { type: 'candelabra', x: 11, y: 22, scale: 1.0 },
    { type: 'candelabra', x: 29, y: 22, scale: 1.0 },
    { type: 'cobweb', x: 1, y: 1, scale: 1.5 },
    { type: 'cobweb', x: 39, y: 1, scale: 1.5 },
    { type: 'cobweb', x: 1, y: 24, scale: 1.5 },
    { type: 'cobweb', x: 39, y: 24, scale: 1.5 },
    { type: 'dust_mote', x: 10, y: 5, scale: 0.3 },
    { type: 'dust_mote', x: 30, y: 15, scale: 0.3 },
  ],
  waves: [
    {
      delay: 5000,
      enemies: [
        { type: 'affinity', x: 3, y: 4, level: 7 },
        { type: 'affinity', x: 37, y: 4, level: 7 },
        { type: 'enchant', x: 20, y: 4, level: 8 },
      ],
    },
    {
      delay: 15000,
      enemies: [
        { type: 'fearless', x: 10, y: 13, level: 9 },
        { type: 'fearless', x: 30, y: 13, level: 9 },
        { type: 'grace_and_glory', x: 20, y: 17, level: 9 },
      ],
    },
    {
      delay: 30000,
      enemies: [
        { type: 'joy', x: 15, y: 10, level: 10 },
        { type: 'joy', x: 25, y: 10, level: 10 },
        { type: 'harmony', x: 20, y: 13, level: 10, dropTable: [{ itemId: 'moon_pearl', chance: 0.2 }] },
      ],
    },
  ],
  parTime: 360,
  difficulty: 7,
};

// ═══════════════════════════════════════════════════════════════════
// LEVEL 8 — PARADISO GARDENS (Boss: Fortitudo)
// ═══════════════════════════════════════════════════════════════════
export const LEVEL_08_PARADISO: LevelDefinition = {
  id: 'level_08_paradiso',
  name: 'Paradiso Gardens',
  description: 'The celestial gardens of Paradiso, a realm of blinding light and divine cruelty. Fortitudo awaits.',
  theme: 'paradiso_garden',
  music: 'ost_paradiso',
  ambientColor: 0xffeedd,
  fogColor: 0xffffee,
  fogDensity: 0.2,
  lightIntensity: 1.0,
  tileMap: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,3,3,3,3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,0,0,0,0,1],
    [1,0,0,0,0,3,3,3,3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,0,0,0,0,1],
    [1,0,0,0,0,3,3,3,3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,3,3,3,3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,0,0,0,0,1],
    [1,0,0,0,0,3,3,3,3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,0,0,0,0,1],
    [1,0,0,0,0,3,3,3,3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
  enemies: [],
  items: [
    { type: 'mega_health_herb', x: 5, y: 20, quantity: 2 },
    { type: 'mega_health_herb', x: 35, y: 20, quantity: 2 },
    { type: 'lollipop_purple', x: 3, y: 3, quantity: 1 },
    { type: 'lollipop_green', x: 37, y: 3, quantity: 1 },
  ],
  decorations: [
    { type: 'golden_tree', x: 7, y: 6, scale: 2.5 },
    { type: 'golden_tree', x: 33, y: 6, scale: 2.5 },
    { type: 'golden_tree', x: 7, y: 16, scale: 2.5 },
    { type: 'golden_tree', x: 33, y: 16, scale: 2.5 },
    { type: 'heavenly_fountain', x: 20, y: 12, scale: 3.0 },
    { type: 'marble_arch', x: 20, y: 3, scale: 2.0 },
    { type: 'marble_arch', x: 20, y: 21, scale: 2.0 },
    { type: 'divine_light_beam', x: 12, y: 10, scale: 1.0 },
    { type: 'divine_light_beam', x: 28, y: 10, scale: 1.0 },
    { type: 'divine_light_beam', x: 12, y: 14, scale: 1.0 },
    { type: 'divine_light_beam', x: 28, y: 14, scale: 1.0 },
    { type: 'cloud_platform', x: 5, y: 12, scale: 2.0 },
    { type: 'cloud_platform', x: 35, y: 12, scale: 2.0 },
    { type: 'angelic_statue', x: 15, y: 3, scale: 1.5 },
    { type: 'angelic_statue', x: 25, y: 3, scale: 1.5 },
    { type: 'angelic_statue', x: 15, y: 21, scale: 1.5 },
    { type: 'angelic_statue', x: 25, y: 21, scale: 1.5 },
    { type: 'rose_petals', x: 20, y: 8, scale: 0.5 },
    { type: 'rose_petals', x: 20, y: 15, scale: 0.5 },
  ],
  bossId: 'fortitudo',
  parTime: 600,
  difficulty: 8,
};

// ═══════════════════════════════════════════════════════════════════
// LEVEL 9 — LIMBO CROSSING
// ═══════════════════════════════════════════════════════════════════
export const LEVEL_09_LIMBO: LevelDefinition = {
  id: 'level_09_limbo',
  name: 'Limbo Crossing',
  description: 'The space between realms. Reality fractures and warps. Nothing is what it seems in this distorted void.',
  theme: 'limbo_void',
  music: 'ost_limbo',
  ambientColor: 0x220044,
  fogColor: 0x110022,
  fogDensity: 0.7,
  lightIntensity: 0.35,
  tileMap: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,1],
    [1,3,3,0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0,0,3,3,1],
    [1,3,3,0,8,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0,0,3,3,1],
    [1,3,3,0,0,0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0,0,0,0,0,0,0,3,3,1],
    [1,3,3,0,0,0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0,0,0,0,0,0,0,3,3,1],
    [1,3,3,3,3,3,3,3,0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0,0,3,3,3,3,3,3,3,1],
    [1,3,3,3,3,3,3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,3,3,1],
    [1,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,1],
    [1,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,1],
    [1,3,3,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,3,3,1],
    [1,3,3,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,3,3,1],
    [1,3,3,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,3,3,1],
    [1,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,1],
    [1,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,1],
    [1,3,3,3,3,3,3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,3,3,1],
    [1,3,3,3,3,3,3,3,0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0,0,3,3,3,3,3,3,3,1],
    [1,3,3,0,0,0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0,0,0,0,0,0,0,3,3,1],
    [1,3,3,0,0,0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0,0,0,0,0,0,0,3,3,1],
    [1,3,3,0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0,0,3,3,1],
    [1,3,3,0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,5,5,3,3,1],
    [1,3,3,0,0,7,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,5,5,3,3,1],
    [1,3,3,0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0,0,3,3,1],
    [1,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
  enemies: [
    { type: 'joy', x: 20, y: 8, level: 10 },
    { type: 'joy', x: 15, y: 11, level: 10 },
    { type: 'joy', x: 25, y: 11, level: 10 },
    { type: 'grace_and_glory', x: 18, y: 14, level: 9 },
    { type: 'grace_and_glory', x: 22, y: 14, level: 9 },
    { type: 'fearless', x: 12, y: 8, level: 9 },
    { type: 'fearless', x: 28, y: 8, level: 9 },
    { type: 'harmony', x: 20, y: 7, level: 10, dropTable: [{ itemId: 'umbran_tears', chance: 0.15 }] },
    { type: 'fairness', x: 5, y: 4, level: 9 },
    { type: 'fairness', x: 35, y: 4, level: 9 },
  ],
  items: [
    { type: 'mega_health_herb', x: 5, y: 21, quantity: 2 },
    { type: 'lollipop_purple', x: 20, y: 10, quantity: 1 },
    { type: 'halos_large', x: 35, y: 20, quantity: 800 },
  ],
  decorations: [
    { type: 'void_crack', x: 10, y: 3, scale: 2.0, tint: 0x9900ff },
    { type: 'void_crack', x: 30, y: 3, scale: 2.0, tint: 0x9900ff },
    { type: 'void_crack', x: 10, y: 20, scale: 2.0, tint: 0x9900ff },
    { type: 'void_crack', x: 30, y: 20, scale: 2.0, tint: 0x9900ff },
    { type: 'floating_debris', x: 15, y: 7, scale: 1.0 },
    { type: 'floating_debris', x: 25, y: 7, scale: 1.0 },
    { type: 'floating_debris', x: 15, y: 15, scale: 1.0 },
    { type: 'floating_debris', x: 25, y: 15, scale: 1.0 },
    { type: 'reality_distortion', x: 20, y: 10, scale: 4.0, tint: 0xff00ff },
    { type: 'void_portal', x: 5, y: 12, scale: 2.0 },
    { type: 'void_portal', x: 35, y: 12, scale: 2.0 },
    { type: 'eye_of_the_void', x: 20, y: 1, scale: 3.0, tint: 0xcc00ff },
    { type: 'distorted_clock', x: 8, y: 7, scale: 1.5, rotation: 0.8 },
    { type: 'distorted_clock', x: 32, y: 15, scale: 1.5, rotation: -0.5 },
  ],
  waves: [
    {
      delay: 3000,
      enemies: [
        { type: 'joy', x: 14, y: 8, level: 10 },
        { type: 'joy', x: 26, y: 8, level: 10 },
      ],
    },
    {
      delay: 12000,
      enemies: [
        { type: 'harmony', x: 18, y: 13, level: 10 },
        { type: 'harmony', x: 22, y: 13, level: 10 },
        { type: 'fairness', x: 20, y: 8, level: 10 },
      ],
    },
    {
      delay: 25000,
      enemies: [
        { type: 'inspired', x: 20, y: 10, level: 11, dropTable: [{ itemId: 'witch_heart', chance: 0.2 }] },
        { type: 'joy', x: 15, y: 14, level: 11 },
        { type: 'joy', x: 25, y: 14, level: 11 },
      ],
    },
  ],
  parTime: 360,
  difficulty: 9,
};

// ═══════════════════════════════════════════════════════════════════
// LEVEL 10 — ITHAVOLL TOWER (Final Boss: Jubileus)
// ═══════════════════════════════════════════════════════════════════
export const LEVEL_10_ITHAVOLL: LevelDefinition = {
  id: 'level_10_ithavoll',
  name: 'Ithavoll Tower',
  description: 'The summit of Ithavoll, where the Creator sleeps. The final battle between light and dark is upon you.',
  theme: 'celestial_tower',
  music: 'ost_final_battle',
  ambientColor: 0xffffff,
  fogColor: 0xeeeeff,
  fogDensity: 0.1,
  lightIntensity: 1.0,
  tileMap: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
  enemies: [],
  items: [
    { type: 'mega_health_herb', x: 5, y: 15, quantity: 3 },
    { type: 'mega_health_herb', x: 35, y: 15, quantity: 3 },
    { type: 'lollipop_purple', x: 5, y: 20, quantity: 2 },
    { type: 'lollipop_green', x: 35, y: 20, quantity: 2 },
    { type: 'mana_crystal', x: 20, y: 20, quantity: 3 },
  ],
  decorations: [
    { type: 'celestial_pillar', x: 5, y: 5, scale: 3.0 },
    { type: 'celestial_pillar', x: 35, y: 5, scale: 3.0 },
    { type: 'celestial_pillar', x: 5, y: 19, scale: 3.0 },
    { type: 'celestial_pillar', x: 35, y: 19, scale: 3.0 },
    { type: 'celestial_pillar', x: 10, y: 3, scale: 2.5 },
    { type: 'celestial_pillar', x: 30, y: 3, scale: 2.5 },
    { type: 'celestial_pillar', x: 10, y: 21, scale: 2.5 },
    { type: 'celestial_pillar', x: 30, y: 21, scale: 2.5 },
    { type: 'divine_light_beam', x: 20, y: 5, scale: 5.0 },
    { type: 'divine_light_beam', x: 15, y: 8, scale: 3.0 },
    { type: 'divine_light_beam', x: 25, y: 8, scale: 3.0 },
    { type: 'divine_light_beam', x: 15, y: 14, scale: 3.0 },
    { type: 'divine_light_beam', x: 25, y: 14, scale: 3.0 },
    { type: 'ithavoll_seal', x: 20, y: 12, scale: 6.0, tint: 0xffdd00 },
    { type: 'star_field', x: 20, y: 1, scale: 10.0 },
    { type: 'angelic_chorus', x: 10, y: 10, scale: 2.0 },
    { type: 'angelic_chorus', x: 30, y: 10, scale: 2.0 },
  ],
  bossId: 'jubileus',
  parTime: 900,
  difficulty: 10,
};

// ═══════════════════════════════════════════════════════════════════
// COMPLETE LEVEL INDEX
// ═══════════════════════════════════════════════════════════════════
export const ALL_LEVELS: LevelDefinition[] = [
  LEVEL_01_VESTIBULE,
  LEVEL_02_NAVE,
  LEVEL_03_VIGRID_STREETS,
  LEVEL_04_COLOSSEUM,
  LEVEL_05_CLOCKTOWER,
  LEVEL_06_INFERNO,
  LEVEL_07_WITCHES_CRYPT,
  LEVEL_08_PARADISO,
  LEVEL_09_LIMBO,
  LEVEL_10_ITHAVOLL,
];

export function getLevelById(id: string): LevelDefinition | undefined {
  return ALL_LEVELS.find((l) => l.id === id);
}

export function getLevelByIndex(index: number): LevelDefinition | undefined {
  return ALL_LEVELS[index];
}

export function getNextLevel(currentId: string): LevelDefinition | undefined {
  const idx = ALL_LEVELS.findIndex((l) => l.id === currentId);
  if (idx >= 0 && idx < ALL_LEVELS.length - 1) {
    return ALL_LEVELS[idx + 1];
  }
  return undefined;
}
