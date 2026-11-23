import type { DecorationPlacement, StageModule } from '../../contracts';

type AuthoredLevelDefinition = NonNullable<StageModule['authoredLevel']>;

export const PALACIO_DO_CREDOR_STAGE_ID = 'stage.final.palacio-do-credor';
export const PALACIO_DO_CREDOR_WIDTH = 148;
export const PALACIO_DO_CREDOR_HEIGHT = 46;
export const PALACIO_DO_CREDOR_SPAWN = Object.freeze({ x: 5, y: 23 });
export const PALACIO_DO_CREDOR_ARUA = Object.freeze({ x: 104, y: 22 });
export const PALACIO_DO_CREDOR_ECO = Object.freeze({ x: 54, y: 24 });
export const PALACIO_DO_CREDOR_SENTINELA = Object.freeze({ x: 118, y: 21 });
export const PALACIO_DO_CREDOR_BOSS = Object.freeze({ x: 128, y: 23 });
export const PALACIO_DO_CREDOR_EXIT = Object.freeze({ x: 142, y: 22 });

export const PALACIO_DO_CREDOR_REGIONS = Object.freeze({
  aproximacao: Object.freeze({ x: 14, y: 23 }),
  entrada: Object.freeze({ x: 39, y: 23 }),
  jardinsExternos: Object.freeze({ x: 54, y: 24 }),
  galerias: Object.freeze({ x: 84, y: 20 }),
  camaraRevelacao: Object.freeze({ x: 104, y: 22 }),
  antessala: Object.freeze({ x: 118, y: 22 }),
  arena: Object.freeze({ x: 128, y: 23 }),
  resolucao: Object.freeze({ x: 142, y: 22 }),
});

const FLOOR = 0;
const WALL = 1;
const PILLAR = 2;
const WATER = 3;
const EXIT = 5;
const CHEST = 7;
const SPAWN = 8;
const BOSS = 9;

const MAIN_TRAIL = Object.freeze([
  [5, 23], [14, 22], [24, 23], [32, 22], [39, 23], [48, 25], [56, 22],
  [64, 20], [72, 22], [80, 24], [88, 20], [96, 22], [104, 22], [112, 22],
  [120, 22], [128, 22], [136, 22], [143, 22],
] as const);

const BRANCH_TRAILS = Object.freeze([
  [[64, 20], [70, 16], [78, 14], [86, 16]],
  [[64, 20], [68, 28], [76, 32], [84, 31]],
  [[96, 22], [100, 17], [106, 18], [110, 21]],
  [[112, 22], [114, 27], [120, 26], [120, 22]],
] as const);

const CLEARINGS = Object.freeze([
  [5, 23, 6, 5], [22, 22, 7, 6], [39, 23, 7, 7], [54, 24, 8, 7],
  [84, 16, 9, 6], [84, 31, 8, 6], [104, 22, 8, 7], [118, 22, 6, 5],
  [128, 23, 9, 8], [142, 22, 5, 5],
] as const);

const WATER_POOLS = Object.freeze([
  [49, 31, 4, 3], [91, 10, 4, 3], [111, 31, 4, 3], [137, 30, 4, 3],
] as const);

const PILLARS = Object.freeze([
  [37, 19], [43, 27], [78, 18], [82, 14], [86, 26], [90, 30],
  [102, 18], [106, 26], [116, 19], [120, 26], [125, 18], [131, 29],
] as const);

const CHESTS = Object.freeze([
  [24, 20], [56, 27], [104, 19],
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
  for (let y = Math.max(1, centerY - radiusY - 1); y <= Math.min(PALACIO_DO_CREDOR_HEIGHT - 2, centerY + radiusY + 1); y += 1) {
    for (let x = Math.max(1, centerX - radiusX - 1); x <= Math.min(PALACIO_DO_CREDOR_WIDTH - 2, centerX + radiusX + 1); x += 1) {
      const dx = (x - centerX) / radiusX;
      const dy = (y - centerY) / radiusY;
      if (dx * dx + dy * dy <= 1 + (unit(x, y, `ellipse-${value}`) - 0.5) * 0.2) map[y][x] = value;
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
          if (x <= 0 || y <= 0 || x >= PALACIO_DO_CREDOR_WIDTH - 1 || y >= PALACIO_DO_CREDOR_HEIGHT - 1) continue;
          const edge = (unit(x, y, salt) - 0.5) * 0.9;
          if (Math.hypot(offsetX, offsetY) <= radius + edge) map[y][x] = value;
        }
      }
    }
  }
}

export function createPalacioDoCredorMap(): number[][] {
  const map = Array.from({ length: PALACIO_DO_CREDOR_HEIGHT }, () =>
    Array.from({ length: PALACIO_DO_CREDOR_WIDTH }, () => WALL));
  CLEARINGS.forEach(([x, y, rx, ry]) => paintEllipse(map, x, y, rx, ry, FLOOR));
  WATER_POOLS.forEach(([x, y, rx, ry]) => paintEllipse(map, x, y, rx, ry, WATER));
  paintLine(map, MAIN_TRAIL, 4, FLOOR, 'palacio-main-trail');
  BRANCH_TRAILS.forEach((points, index) => paintLine(map, points, 3, FLOOR, `palacio-branch-${index}`));
  PILLARS.forEach(([x, y]) => { map[y][x] = PILLAR; });
  CHESTS.forEach(([x, y]) => { map[y][x] = CHEST; });

  map[PALACIO_DO_CREDOR_SPAWN.y][PALACIO_DO_CREDOR_SPAWN.x] = SPAWN;
  map[PALACIO_DO_CREDOR_BOSS.y][PALACIO_DO_CREDOR_BOSS.x] = BOSS;

  for (let y = PALACIO_DO_CREDOR_EXIT.y - 1; y <= PALACIO_DO_CREDOR_EXIT.y + 1; y += 1) {
    for (let x = PALACIO_DO_CREDOR_EXIT.x - 1; x <= PALACIO_DO_CREDOR_EXIT.x + 1; x += 1) {
      map[y][x] = FLOOR;
    }
  }
  map[PALACIO_DO_CREDOR_EXIT.y][PALACIO_DO_CREDOR_EXIT.x] = EXIT;
  return map;
}

export function createPalacioDoCredorDecorations(): DecorationPlacement[] {
  const placements: DecorationPlacement[] = [
    // Aproximação: a floresta termina diante do portão.
    { type: 'palacio_canopy', x: 7, y: 18, scale: 1.15, depth: 2.1, layer: 'background' },
    { type: 'palacio_canopy', x: 24, y: 27, scale: 1.05, flipX: true, depth: 2.1, layer: 'background' },
    { type: 'palacio_root_mass', x: 17, y: 28, scale: 0.9, depth: 4.3 },
    { type: 'palacio_rubble', x: 29, y: 29, scale: 0.7, depth: 4.2 },

    // Entrada monumental.
    { type: 'palacio_tower', x: 34, y: 18, scale: 0.9, depth: 4.9 },
    { type: 'palacio_tower', x: 45, y: 18, scale: 0.9, flipX: true, depth: 4.9 },
    { type: 'palacio_gate', x: 39, y: 17, scale: 1, depth: 5.2 },
    { type: 'palacio_banner', x: 36, y: 25, scale: 0.95, depth: 4.4 },
    { type: 'palacio_banner', x: 43, y: 25, scale: 0.95, flipX: true, depth: 4.4 },
    { type: 'palacio_sigil', x: 39, y: 27, scale: 0.72, depth: 3.3 },

    // Jardins e estruturas externas abandonadas.
    { type: 'palacio_canopy', x: 50, y: 17, scale: 1.2, depth: 2.12, layer: 'background' },
    { type: 'palacio_arcade', x: 58, y: 18, scale: 1, depth: 4.8 },
    { type: 'palacio_statue', x: 48, y: 22, scale: 0.9, depth: 4.3 },
    { type: 'palacio_statue', x: 61, y: 22, scale: 0.9, flipX: true, depth: 4.3 },
    { type: 'palacio_chain', x: 44, y: 30, scale: 0.85, depth: 4.4 },
    { type: 'palacio_ledger', x: 54, y: 27, scale: 0.9, depth: 4.2 },
    { type: 'palacio_rubble', x: 52, y: 19, scale: 0.7, depth: 4.2 },

    // Galerias internas.
    { type: 'palacio_canopy', x: 74, y: 12, scale: 1.1, depth: 2.08, layer: 'background' },
    { type: 'palacio_arcade', x: 76, y: 14, scale: 1.05, depth: 4.85 },
    { type: 'palacio_glass', x: 78, y: 10, scale: 0.8, depth: 3.2, layer: 'background' },
    { type: 'palacio_arcade', x: 88, y: 30, scale: 1, flipX: true, depth: 4.85 },
    { type: 'palacio_chain', x: 66, y: 26, scale: 1, depth: 4.4 },
    { type: 'palacio_chain', x: 93, y: 24, scale: 1.1, flipX: true, depth: 4.4 },
    { type: 'palacio_statue', x: 82, y: 24, scale: 0.95, depth: 4.3 },
    { type: 'palacio_rubble', x: 80, y: 34, scale: 0.8, depth: 4.2 },
    { type: 'palacio_sigil', x: 90, y: 18, scale: 0.6, depth: 3.3 },

    // Câmara de revelação.
    { type: 'palacio_glass', x: 101, y: 20, scale: 0.9, depth: 3.2, layer: 'background' },
    { type: 'palacio_glass', x: 107, y: 20, scale: 0.9, flipX: true, depth: 3.2, layer: 'background' },
    { type: 'palacio_ledger', x: 104, y: 19, scale: 1.05, depth: 4.25 },
    { type: 'palacio_banner', x: 99, y: 25, scale: 0.9, depth: 4.4 },
    { type: 'palacio_banner', x: 109, y: 25, scale: 0.9, flipX: true, depth: 4.4 },
    { type: 'palacio_sigil', x: 104, y: 26, scale: 0.8, depth: 3.35 },

    // Antessala.
    { type: 'palacio_statue', x: 115, y: 25, scale: 0.95, depth: 4.3 },
    { type: 'palacio_statue', x: 121, y: 25, scale: 0.95, flipX: true, depth: 4.3 },
    { type: 'palacio_chain', x: 114, y: 18, scale: 0.9, depth: 4.4 },
    { type: 'palacio_banner', x: 118, y: 18, scale: 0.85, depth: 4.4 },

    // Arena do Credor.
    { type: 'palacio_dais', x: 128, y: 23, scale: 1.15, depth: 3.6 },
    { type: 'palacio_throne', x: 132, y: 19, scale: 1.05, depth: 4.9 },
    { type: 'palacio_canopy', x: 128, y: 14, scale: 1.3, depth: 2.05, layer: 'background' },
    { type: 'palacio_chain', x: 121, y: 19, scale: 1.1, depth: 4.4 },
    { type: 'palacio_chain', x: 135, y: 19, scale: 1.1, flipX: true, depth: 4.4 },
    { type: 'palacio_root_mass', x: 124, y: 30, scale: 0.9, depth: 4.35 },
    { type: 'palacio_sigil', x: 128, y: 28, scale: 0.9, depth: 3.4 },

    // Resolução e saída.
    { type: 'palacio_canopy', x: 140, y: 18, scale: 1.05, depth: 2.12, layer: 'background' },
    { type: 'palacio_rubble', x: 138, y: 28, scale: 0.75, depth: 4.2 },
  ];
  return placements;
}

export function createPalacioDoCredorLevelDefinition(): AuthoredLevelDefinition {
  return {
    id: PALACIO_DO_CREDOR_STAGE_ID,
    name: 'Palácio do Credor',
    description: 'Uma casa de registros onde a floresta, o rio e o território foram convertidos em dívida.',
    theme: 'roman_ruins',
    music: 'ost_palacio',
    ambientColor: 0x1d1826,
    fogColor: 0x211a2c,
    fogDensity: 0.18,
    lightIntensity: 0.62,
    tileMap: createPalacioDoCredorMap(),
    enemies: [],
    items: [
      { type: 'health_herb', x: 24, y: 20, quantity: 1 },
      { type: 'potion', x: 36, y: 22, quantity: 1 },
      { type: 'mana_shard', x: 56, y: 27, quantity: 1 },
      { type: 'potion', x: 66, y: 20, quantity: 1 },
      { type: 'potion', x: 96, y: 22, quantity: 1 },
      { type: 'potion', x: 104, y: 19, quantity: 1 },
      { type: 'health_herb', x: 118, y: 25, quantity: 1 },
      { type: 'potion', x: 122, y: 22, quantity: 1 },
      { type: 'potion', x: 126, y: 26, quantity: 1 },
      { type: 'potion', x: 130, y: 20, quantity: 1 },
      { type: 'mana_shard', x: 136, y: 22, quantity: 1 },
    ],
    decorations: createPalacioDoCredorDecorations(),
    parTime: 900,
    difficulty: 8,
  };
}
