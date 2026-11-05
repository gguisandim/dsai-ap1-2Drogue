import type { LevelDefinition } from '../../data/LevelData';
import type { ChapterTemplateIds } from './ids';
import type { TemplateGeometry } from './geometry';

export {
  TEMPLATE_DECORATION_POSITION,
  TEMPLATE_ENEMY_POSITIONS,
  TEMPLATE_EXIT_POSITION,
  TEMPLATE_ITEM_POSITION,
  TEMPLATE_MAP_HEIGHT,
  TEMPLATE_MAP_WIDTH,
  TEMPLATE_NPC_POSITION,
  TEMPLATE_SPAWN,
  createTemplateGeometry,
} from './geometry';

export interface TemplateLevelOptions {
  readonly stageId: string;
  readonly name: string;
  readonly description: string;
  readonly ids: ChapterTemplateIds;
  readonly geometry: TemplateGeometry;
}

export function createTemplateLevel(options: TemplateLevelOptions): LevelDefinition {
  const geometry = options.geometry;
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
    tileMap: geometry.tileMap,
    enemies: [],
    items: [{
      type: 'health_herb',
      x: geometry.item.x,
      y: geometry.item.y,
      quantity: 1,
    }],
    decorations: [{
      type: options.ids.visual.decorationId,
      x: geometry.decoration.x,
      y: geometry.decoration.y,
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
