import type { DecorationPlacement, StageModule } from '../../contracts';

type AuthoredLevelDefinition = NonNullable<StageModule['authoredLevel']>;

export const MINAS_CORROMPIDAS_STAGE_ID = 'stage.corrupted.minas';
export const MINAS_CORROMPIDAS_WIDTH = 164;
export const MINAS_CORROMPIDAS_HEIGHT = 48;
export const MINAS_CORROMPIDAS_SPAWN = Object.freeze({ x: 5, y: 14 });
export const MINAS_CORROMPIDAS_MAIRA = Object.freeze({ x: 30, y: 20 });
export const MINAS_CORROMPIDAS_NILO = Object.freeze({ x: 66, y: 27 });
export const MINAS_CORROMPIDAS_AQUIFER = Object.freeze({ x: 92, y: 32 });
export const MINAS_CORROMPIDAS_BOSS = Object.freeze({ x: 132, y: 30 });
export const MINAS_CORROMPIDAS_LEDGER = Object.freeze({ x: 148, y: 25 });
export const MINAS_CORROMPIDAS_EXIT = Object.freeze({ x: 158, y: 22 });

export const MINAS_CORROMPIDAS_REGIONS = Object.freeze({
  floresta: Object.freeze({ x: 8, y: 14 }),
  acampamento: Object.freeze({ x: 30, y: 20 }),
  galerias: Object.freeze({ x: 52, y: 24 }),
  cavernas: Object.freeze({ x: 76, y: 29 }),
  contaminadas: Object.freeze({ x: 104, y: 32 }),
  nucleo: Object.freeze({ x: 132, y: 30 }),
  revelacao: Object.freeze({ x: 150, y: 25 }),
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
  [5, 14], [13, 15], [22, 18], [30, 20], [39, 21], [48, 24],
  [58, 25], [68, 27], [78, 29], [88, 31], [98, 32], [108, 33],
  [118, 31], [128, 30], [138, 29], [148, 25], [158, 22],
] as const);

const BRANCHES = Object.freeze([
  [[18, 17], [21, 11], [30, 9], [37, 14]],
  [[48, 24], [53, 32], [61, 35], [69, 28]],
  [[76, 29], [79, 20], [88, 18], [96, 25]],
  [[104, 32], [109, 39], [119, 40], [124, 32]],
  [[138, 29], [141, 35], [150, 34], [153, 26]],
] as const);

const CLEARINGS = Object.freeze([
  [5, 14, 6, 5], [18, 17, 7, 5], [30, 20, 9, 7], [52, 24, 8, 6],
  [76, 29, 9, 7], [92, 32, 8, 6], [106, 32, 8, 6], [120, 31, 7, 6],
  [132, 30, 10, 8], [148, 25, 8, 7], [158, 22, 4, 4],
] as const);

const POOLS = Object.freeze([
  [32, 28, 5, 3], [83, 36, 6, 3], [99, 39, 5, 3], [145, 34, 5, 3],
] as const);

const PILLARS = Object.freeze([
  [42, 18], [45, 29], [57, 20], [61, 31], [72, 23], [84, 25],
  [101, 27], [111, 36], [118, 27], [125, 35], [138, 24],
] as const);

function unit(x: number, y: number, salt: string): number {
  let hash = 2166136261;
  for (const character of `${salt}:${x}:${y}`) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  hash ^= hash >>> 16;
  return (hash >>> 0) / 0xffffffff;
}

function ellipse(map: number[][], cx: number, cy: number, rx: number, ry: number, value: number): void {
  for (let y = Math.max(1, cy - ry - 1); y <= Math.min(MINAS_CORROMPIDAS_HEIGHT - 2, cy + ry + 1); y += 1) {
    for (let x = Math.max(1, cx - rx - 1); x <= Math.min(MINAS_CORROMPIDAS_WIDTH - 2, cx + rx + 1); x += 1) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1 + (unit(x, y, `ellipse-${value}`) - 0.5) * 0.24) map[y][x] = value;
    }
  }
}

function trail(map: number[][], points: readonly (readonly number[])[], radius: number, salt: string): void {
  for (let index = 0; index + 1 < points.length; index += 1) {
    const [ax, ay] = points[index];
    const [bx, by] = points[index + 1];
    const steps = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
    for (let step = 0; step <= steps; step += 1) {
      const ratio = steps === 0 ? 0 : step / steps;
      const cx = Math.round(ax + (bx - ax) * ratio);
      const cy = Math.round(ay + (by - ay) * ratio);
      for (let oy = -radius - 1; oy <= radius + 1; oy += 1) {
        for (let ox = -radius - 1; ox <= radius + 1; ox += 1) {
          const x = cx + ox;
          const y = cy + oy;
          if (x <= 0 || y <= 0 || x >= MINAS_CORROMPIDAS_WIDTH - 1 || y >= MINAS_CORROMPIDAS_HEIGHT - 1) continue;
          if (Math.hypot(ox, oy) <= radius + (unit(x, y, salt) - 0.5) * 0.9) map[y][x] = FLOOR;
        }
      }
    }
  }
}

export function createMinasCorrompidasMap(): number[][] {
  const map = Array.from({ length: MINAS_CORROMPIDAS_HEIGHT }, () =>
    Array.from({ length: MINAS_CORROMPIDAS_WIDTH }, () => WALL));
  CLEARINGS.forEach(([x, y, rx, ry]) => ellipse(map, x, y, rx, ry, FLOOR));
  POOLS.forEach(([x, y, rx, ry]) => ellipse(map, x, y, rx, ry, WATER));
  trail(map, MAIN_TRAIL, 3, 'mina-main');
  BRANCHES.forEach((points, index) => trail(map, points, 2, `mina-branch-${index}`));
  PILLARS.forEach(([x, y]) => { if (map[y][x] === FLOOR) map[y][x] = PILLAR; });
  [[36, 18], [61, 35], [93, 30], [119, 39]].forEach(([x, y]) => { map[y][x] = CHEST; });
  map[MINAS_CORROMPIDAS_SPAWN.y][MINAS_CORROMPIDAS_SPAWN.x] = SPAWN;
  map[MINAS_CORROMPIDAS_BOSS.y][MINAS_CORROMPIDAS_BOSS.x] = BOSS;
  for (let y = MINAS_CORROMPIDAS_EXIT.y - 1; y <= MINAS_CORROMPIDAS_EXIT.y + 1; y += 1) {
    for (let x = MINAS_CORROMPIDAS_EXIT.x - 1; x <= MINAS_CORROMPIDAS_EXIT.x + 1; x += 1) map[y][x] = FLOOR;
  }
  map[MINAS_CORROMPIDAS_EXIT.y][MINAS_CORROMPIDAS_EXIT.x] = EXIT;
  return map;
}

export function createMinasCorrompidasDecorations(): DecorationPlacement[] {
  return [
    { type: 'mina_panorama', x: 14, y: 13, scale: 0.34, depth: 1.4, layer: 'background' },
    { type: 'mina_roots', x: 9, y: 9, scale: 0.8, depth: 4.2 },
    { type: 'mina_rails', x: 18, y: 18, scale: 0.8, depth: 3.7 },
    { type: 'mina_timber', x: 27, y: 17, scale: 0.82, depth: 4.5 },
    { type: 'mina_seal', x: 34, y: 18, scale: 0.55, depth: 4.7 },
    { type: 'mina_panorama', x: 54, y: 23, scale: 0.34, depth: 1.4, layer: 'background' },
    { type: 'mina_timber', x: 48, y: 23, scale: 0.8, depth: 4.5 },
    { type: 'mina_rails', x: 56, y: 26, scale: 0.9, depth: 3.7 },
    { type: 'mina_crystals', x: 61, y: 22, scale: 0.72, depth: 4.1 },
    { type: 'mina_roots', x: 73, y: 26, scale: 1.05, depth: 4.25 },
    { type: 'mina_panorama', x: 88, y: 29, scale: 0.34, depth: 1.4, layer: 'background' },
    { type: 'mina_roots', x: 84, y: 27, scale: 0.92, flipX: true, depth: 4.25 },
    { type: 'mina_fungi', x: 92, y: 29, scale: 0.62, depth: 4.35 },
    { type: 'mina_crystals', x: 101, y: 30, scale: 0.82, depth: 4.1 },
    { type: 'mina_timber', x: 108, y: 30, scale: 0.82, flipX: true, depth: 4.5 },
    { type: 'mina_panorama', x: 123, y: 29, scale: 0.34, depth: 1.4, layer: 'background' },
    { type: 'mina_machinery', x: 119, y: 29, scale: 0.83, depth: 4.55 },
    { type: 'mina_crystals', x: 126, y: 27, scale: 0.8, depth: 4.1 },
    { type: 'mina_core', x: 132, y: 28, scale: 0.88, depth: 4.8 },
    { type: 'mina_roots', x: 137, y: 29, scale: 0.9, flipX: true, depth: 4.25 },
    { type: 'mina_panorama', x: 151, y: 23, scale: 0.34, depth: 1.4, layer: 'background' },
    { type: 'mina_seal', x: 148, y: 23, scale: 0.72, depth: 4.7 },
    { type: 'mina_rails', x: 154, y: 25, scale: 0.72, depth: 3.7 },
  ];
}

export function createMinasCorrompidasLevelDefinition(): AuthoredLevelDefinition {
  return {
    id: MINAS_CORROMPIDAS_STAGE_ID,
    name: 'Minas Corrompidas',
    description: 'Uma descida pela Mina Açu, onde água, raízes, trabalho e arumã foram convertidos em garantia.',
    theme: 'witches_crypt',
    music: 'ost_minas_corrompidas',
    ambientColor: 0x17292b,
    fogColor: 0x1b3437,
    fogDensity: 0.17,
    lightIntensity: 0.58,
    tileMap: createMinasCorrompidasMap(),
    enemies: [],
    items: [
      { type: 'health_herb', x: 22, y: 18, quantity: 1 },
      { type: 'potion', x: 36, y: 18, quantity: 1 },
      { type: 'mana_shard', x: 61, y: 35, quantity: 1 },
      { type: 'health_herb', x: 83, y: 27, quantity: 1 },
      { type: 'potion', x: 101, y: 32, quantity: 1 },
      { type: 'health_herb', x: 119, y: 39, quantity: 1 },
      { type: 'potion', x: 127, y: 33, quantity: 1 },
      { type: 'mana_shard', x: 144, y: 27, quantity: 1 },
    ],
    decorations: createMinasCorrompidasDecorations(),
    parTime: 960,
    difficulty: 7,
  };
}

