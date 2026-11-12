import type { DecorationPlacement, StageModule } from '../../contracts';

type AuthoredLevelDefinition = NonNullable<StageModule['authoredLevel']>;

export const VEILED_GARDENS_STAGE_ID = 'level_08_paradiso';
export const VEILED_GARDENS_WIDTH = 120;
export const VEILED_GARDENS_HEIGHT = 38;
export const VEILED_GARDENS_SPAWN = Object.freeze({ x: 4, y: 19 });
export const VEILED_GARDENS_IARAI = Object.freeze({ x: 24, y: 14 });
export const VEILED_GARDENS_TUCUM = Object.freeze({ x: 51, y: 25 });
export const VEILED_GARDENS_FIRST_ENCOUNTER = Object.freeze({ x: 66, y: 19 });
export const VEILED_GARDENS_CLEARING = Object.freeze({ x: 84, y: 18 });
export const VEILED_GARDENS_TREE = Object.freeze({ x: 100, y: 11 });
export const VEILED_GARDENS_EXIT = Object.freeze({ x: 116, y: 19 });

const FLOOR = 0;
const WALL = 1;
const PILLAR = 2;
const WATER = 3;
const EXIT = 5;
const CHEST = 7;
const SPAWN = 8;

const MAIN_TRAIL = Object.freeze([
  [4, 19], [13, 18], [23, 15], [34, 18], [45, 21], [55, 24],
  [66, 19], [76, 16], [85, 18], [95, 15], [105, 17], [116, 19],
] as const);

const BRANCH_TRAILS = Object.freeze([
  [[18, 17], [19, 10], [27, 8], [31, 14]],
  [[43, 21], [45, 28], [53, 31], [57, 25]],
  [[72, 17], [74, 8], [82, 6], [87, 15]],
  [[93, 15], [98, 11], [105, 9], [108, 17]],
] as const);

const CLEARINGS = Object.freeze([
  [5, 19, 6, 6], [24, 14, 10, 7], [40, 20, 8, 6], [52, 25, 9, 6],
  [66, 19, 9, 7], [84, 18, 12, 9], [100, 14, 12, 10], [115, 19, 6, 6],
  [27, 8, 6, 4], [53, 31, 7, 4], [81, 7, 7, 4],
] as const);

const WATERWAYS = Object.freeze([
  [[1, 5, 2], [14, 7, 2], [29, 5, 2], [43, 8, 2], [57, 6, 2], [71, 9, 2]],
  [[1, 33, 2], [15, 30, 2], [30, 33, 2], [46, 29, 2], [63, 33, 2], [79, 29, 2]],
  [[91, 31, 2], [103, 28, 2], [118, 31, 2]],
] as const);

function unit(x: number, y: number, salt: string): number {
  let hash = 2166136261;
  const value = `${salt}:${x}:${y}`;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  hash ^= hash >>> 16;
  return (hash >>> 0) / 0xffffffff;
}

function paintEllipse(
  map: number[][],
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number,
  value: number,
): void {
  for (let y = Math.max(1, centerY - radiusY - 1); y <= Math.min(VEILED_GARDENS_HEIGHT - 2, centerY + radiusY + 1); y += 1) {
    for (let x = Math.max(1, centerX - radiusX - 1); x <= Math.min(VEILED_GARDENS_WIDTH - 2, centerX + radiusX + 1); x += 1) {
      const dx = (x - centerX) / radiusX;
      const dy = (y - centerY) / radiusY;
      if (dx * dx + dy * dy <= 1 + (unit(x, y, `ellipse-${value}`) - 0.5) * 0.18) map[y][x] = value;
    }
  }
}

function paintLine(
  map: number[][],
  points: readonly (readonly number[])[],
  radius: number,
  value: number,
  salt: string,
): void {
  for (let index = 0; index + 1 < points.length; index += 1) {
    const [fromX, fromY] = points[index];
    const [toX, toY] = points[index + 1];
    const steps = Math.max(Math.abs(toX - fromX), Math.abs(toY - fromY));
    for (let step = 0; step <= steps; step += 1) {
      const ratio = steps === 0 ? 0 : step / steps;
      const centerX = Math.round(fromX + (toX - fromX) * ratio);
      const centerY = Math.round(fromY + (toY - fromY) * ratio);
      for (let offsetY = -radius - 1; offsetY <= radius + 1; offsetY += 1) {
        for (let offsetX = -radius - 1; offsetX <= radius + 1; offsetX += 1) {
          const x = centerX + offsetX;
          const y = centerY + offsetY;
          if (x <= 0 || y <= 0 || x >= VEILED_GARDENS_WIDTH - 1 || y >= VEILED_GARDENS_HEIGHT - 1) continue;
          const edge = (unit(x, y, salt) - 0.5) * 0.9;
          if (Math.hypot(offsetX, offsetY) <= radius + edge) map[y][x] = value;
        }
      }
    }
  }
}

export function createVeiledGardensMap(): number[][] {
  const map = Array.from({ length: VEILED_GARDENS_HEIGHT }, () =>
    Array.from({ length: VEILED_GARDENS_WIDTH }, () => WALL));
  CLEARINGS.forEach(([x, y, rx, ry]) => paintEllipse(map, x, y, rx, ry, FLOOR));
  WATERWAYS.forEach((points, index) => paintLine(map, points, 2, WATER, `water-${index}`));
  paintLine(map, MAIN_TRAIL, 3, FLOOR, 'main-trail');
  BRANCH_TRAILS.forEach((points, index) => paintLine(map, points, 2, FLOOR, `branch-${index}`));
  [[30, 9], [49, 29], [79, 8], [104, 12]].forEach(([x, y]) => { map[y][x] = PILLAR; });
  [[27, 8], [53, 31], [81, 7]].forEach(([x, y]) => { map[y][x] = CHEST; });
  map[VEILED_GARDENS_SPAWN.y][VEILED_GARDENS_SPAWN.x] = SPAWN;
  for (let y = VEILED_GARDENS_EXIT.y - 1; y <= VEILED_GARDENS_EXIT.y + 1; y += 1) {
    for (let x = VEILED_GARDENS_EXIT.x - 1; x <= VEILED_GARDENS_EXIT.x + 1; x += 1) map[y][x] = FLOOR;
  }
  map[VEILED_GARDENS_EXIT.y][VEILED_GARDENS_EXIT.x] = EXIT;
  return map;
}

export function createVeiledGardensDecorations(): DecorationPlacement[] {
  const placements: DecorationPlacement[] = [
    { type: 'flores_pictorial_canopy', x: 14, y: 20, scale: 0.5, depth: 2.18, layer: 'background' },
    { type: 'flores_pictorial_canopy', x: 42, y: 19, scale: 0.46, flipX: true, depth: 2.18, layer: 'background' },
    { type: 'flores_pictorial_canopy', x: 73, y: 17, scale: 0.46, flipX: true, depth: 2.18, layer: 'background' },
    { type: 'flores_pictorial_canopy', x: 108, y: 20, scale: 0.44, depth: 2.18, layer: 'background' },
    { type: 'flores_heart_bloom', x: 84, y: 18, scale: 0.43, depth: 3.15, layer: 'background' },
    { type: 'flores_heliconia_arch', x: 19, y: 16, scale: 0.92, depth: 4.1 },
    { type: 'flores_bromeliad_cluster', x: 23, y: 11, scale: 1.05, depth: 4.4 },
    { type: 'flores_orchid_veil', x: 31, y: 13, scale: 0.9, depth: 7.7, layer: 'foreground' },
    { type: 'flores_pollinator_nest', x: 57, y: 20, scale: 1.05, depth: 4.2 },
    { type: 'flores_heliconia_arch', x: 73, y: 16, scale: 1, flipX: true, depth: 4.1 },
    { type: 'flores_bromeliad_cluster', x: 82, y: 23, scale: 1.18, depth: 4.5 },
    { type: 'flores_monumental_tree', ...VEILED_GARDENS_TREE, scale: 1.28, depth: 4.8 },
    { type: 'flores_orchid_veil', x: 100, y: 15, scale: 1.1, depth: 7.8, layer: 'foreground' },
    { type: 'flores_light_shaft', x: 85, y: 12, scale: 1.15, depth: 2.9, alpha: 0.72 },
    { type: 'flores_light_shaft', x: 101, y: 8, scale: 1.25, depth: 2.9, alpha: 0.68 },
  ];
  [9, 17, 35, 44, 62, 78, 91, 110].forEach((x, index) => placements.push({
    type: 'flores_canopy_bough', x, y: index % 2 === 0 ? 3 : 34,
    scale: 0.9 + (index % 3) * 0.08, flipX: index % 2 === 1,
    flipY: index % 2 === 1, layer: 'foreground', depth: 8.3,
  }));
  [12, 28, 39, 48, 69, 88, 107, 114].forEach((x, index) => placements.push({
    type: index % 3 === 0 ? 'flores_orchid_veil' : 'flores_bromeliad_cluster',
    x, y: index % 2 === 0 ? 11 : 27, scale: 0.72 + (index % 4) * 0.08,
    flipX: index % 2 === 0, depth: 4.2 + index * 0.01,
  }));
  [16, 33, 46, 60, 76, 93, 108].forEach((x, index) => placements.push({
    type: 'flores_canopy', x, y: index % 2 === 0 ? 7 : 31,
    scale: 3.2 + (index % 3) * 0.25, tint: index % 2 === 0 ? 0x2d6842 : 0x24583a,
    layer: 'background', depth: 2.1,
  }));
  return placements;
}

export function createVeiledGardensLevelDefinition(): AuthoredLevelDefinition {
  return {
    id: VEILED_GARDENS_STAGE_ID,
    name: 'Jardins das Flores Veladas',
    description: 'Uma trilha amazônica onde flores, som e polinizadores sustentam o pulso secreto da floresta.',
    theme: 'paradiso_garden',
    music: 'ost_paradiso',
    ambientColor: 0x234936,
    fogColor: 0x243a38,
    fogDensity: 0.16,
    lightIntensity: 0.7,
    tileMap: createVeiledGardensMap(),
    enemies: [],
    items: [
      { type: 'health_herb', x: 27, y: 8, quantity: 1 },
      { type: 'mana_shard', x: 53, y: 31, quantity: 1 },
      { type: 'potion', x: 81, y: 7, quantity: 1 },
      { type: 'health_herb', x: 108, y: 18, quantity: 1 },
    ],
    decorations: createVeiledGardensDecorations(),
    parTime: 720,
    difficulty: 5,
  };
}
