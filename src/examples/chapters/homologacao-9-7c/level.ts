import type { LevelDefinition } from '../../../data/LevelData';
import type { ChapterTemplateIds } from './ids';

export const TEMPLATE_MAP_WIDTH = 19;
export const TEMPLATE_MAP_HEIGHT = 11;

export const TEMPLATE_SPAWN = Object.freeze({ x: 3, y: 5 });
export const TEMPLATE_NPC_POSITION = Object.freeze({ x: 5, y: 5 });
export const TEMPLATE_EXIT_POSITION = Object.freeze({ x: 16, y: 5 });
export const TEMPLATE_DECORATION_POSITION = Object.freeze({ x: 4, y: 4 });
export const TEMPLATE_ITEM_POSITION = Object.freeze({ x: 8, y: 7 });
export const TEMPLATE_ENEMY_POSITIONS = Object.freeze([
  Object.freeze({ x: 10, y: 4 }),
  Object.freeze({ x: 13, y: 6 }),
]);

const FLOOR = 0;
const WALL = 1;
const PILLAR = 2;
const EXIT = 5;
const CHEST = 7;
const SPAWN = 8;

/**
 * Small authored room. The border is closed, the spawn and the exit tile are in
 * the same walkable area, and the two encounter positions stay on open floor.
 */
export function createTemplateTileMap(): number[][] {
  const map: number[][] = Array.from({ length: TEMPLATE_MAP_HEIGHT }, (_, y) =>
    Array.from({ length: TEMPLATE_MAP_WIDTH }, (_, x) =>
      x === 0 || y === 0 || x === TEMPLATE_MAP_WIDTH - 1 || y === TEMPLATE_MAP_HEIGHT - 1
        ? WALL : FLOOR));
  map[3][7] = PILLAR;
  map[8][12] = PILLAR;
  map[TEMPLATE_ITEM_POSITION.y][TEMPLATE_ITEM_POSITION.x] = CHEST;
  map[TEMPLATE_SPAWN.y][TEMPLATE_SPAWN.x] = SPAWN;
  map[TEMPLATE_EXIT_POSITION.y][TEMPLATE_EXIT_POSITION.x] = EXIT;
  return map;
}

export interface TemplateLevelOptions {
  readonly stageId: string;
  readonly name: string;
  readonly description: string;
  readonly ids: ChapterTemplateIds;
}

export function createTemplateLevel(options: TemplateLevelOptions): LevelDefinition {
  return Object.freeze({
    id: options.stageId,
    name: options.name,
    description: options.description,
    theme: 'witches_crypt' as const,
    music: 'ost_vestibule',
    ambientColor: 0x243a47,
    fogColor: 0x0b1720,
    fogDensity: 0.22,
    lightIntensity: 0.7,
    tileMap: createTemplateTileMap(),
    enemies: [],
    items: [{
      type: 'health_herb',
      x: TEMPLATE_ITEM_POSITION.x,
      y: TEMPLATE_ITEM_POSITION.y,
      quantity: 1,
    }],
    decorations: [{
      type: options.ids.visual.decorationId,
      x: TEMPLATE_DECORATION_POSITION.x,
      y: TEMPLATE_DECORATION_POSITION.y,
      scale: 1,
      tint: 0x8fd6ff,
      layer: 'terrain' as const,
      depth: 2,
    }],
    waves: [],
    parTime: 90,
    difficulty: 1,
  });
}
