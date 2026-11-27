import { LevelDefinition } from './LevelData';
import { composeEnvironmentalDecorations } from './composeEnvironmentalDecorations';

function createMap(): number[][] {
  const map = Array.from({ length: 25 }, () => Array<number>(40).fill(1));
  const carve = (x1: number, y1: number, x2: number, y2: number) => {
    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) map[y][x] = 0;
    }
  };

  carve(2, 3, 10, 10);
  carve(10, 6, 18, 8);
  carve(17, 3, 28, 12);
  carve(22, 12, 24, 18);
  carve(15, 17, 31, 23);
  carve(31, 19, 36, 21);
  carve(35, 15, 38, 23);

  map[6][4] = 8;
  map[19][37] = 5;
  map[5][21] = 2;
  map[10][25] = 2;
  map[19][19] = 2;
  map[21][27] = 2;
  return map;
}

const corridor: LevelDefinition = {
  id: 'level_01_forgotten_passage',
  name: 'A Passagem Esquecida',
  description: 'Abra caminho pelas câmaras seladas e alcance o portal.',
  theme: 'witches_crypt',
  music: 'ost_vestibule',
  ambientColor: 0x332244,
  fogColor: 0x120d1b,
  fogDensity: 0.35,
  lightIntensity: 0.65,
  tileMap: createMap(),
  enemies: [
    { type: 'affinity', x: 7, y: 7, level: 1 },
    { type: 'affinity', x: 4, y: 4, level: 1 },
    { type: 'affinity', x: 9, y: 9, level: 1 },
    { type: 'applaud', x: 14, y: 7, level: 1 },
    { type: 'affinity', x: 19, y: 6, level: 1 },
    { type: 'applaud', x: 26, y: 9, level: 2 },
    { type: 'affinity', x: 21, y: 4, level: 2 },
    { type: 'affinity', x: 25, y: 11, level: 2 },
    { type: 'affinity', x: 20, y: 20, level: 2 },
    { type: 'applaud', x: 29, y: 20, level: 2 },
    { type: 'affinity', x: 17, y: 19, level: 2 },
    { type: 'affinity', x: 23, y: 15, level: 2 },
    { type: 'applaud', x: 23, y: 18, level: 3 },
    { type: 'affinity', x: 36, y: 17, level: 3 },
    { type: 'affinity', x: 34, y: 20, level: 3 },
    { type: 'applaud', x: 37, y: 21, level: 3 },
    { type: 'affinity', x: 28, y: 19, level: 3 },
  ],
  items: [
    { type: 'health_herb', x: 18, y: 10 },
    { type: 'mana_shard', x: 17, y: 21 },
    { type: 'halos_medium', x: 36, y: 22 },
  ],
  decorations: [],
  parTime: 180,
  difficulty: 2,
};

const moss = { type: 'passage.moss', layer: 'terrain', depth: 2.1 } as const;
const brazier = { type: 'passage.brazier', layer: 'foreground', depth: 4.1 } as const;
const plinth = { type: 'passage.plinth', layer: 'terrain', depth: 3.1 } as const;

export const CORRIDOR_LEVEL: LevelDefinition = {
  ...corridor,
  decorations: composeEnvironmentalDecorations(corridor.tileMap, [
    { id: 'passage.entry', bounds: [2, 3, 10, 10], tiles: [0], props: [moss, plinth] },
    { id: 'passage.threshold', bounds: [11, 5, 16, 5], tiles: [1], props: [brazier] },
    { id: 'passage.crypt', bounds: [17, 3, 28, 12], tiles: [0], props: [plinth, moss, { ...moss, flipX: true }] },
    { id: 'passage.crossing', bounds: [21, 13, 21, 16], tiles: [1], props: [brazier] },
    { id: 'passage.gallery', bounds: [15, 17, 31, 23], tiles: [0], props: [moss, plinth, { ...plinth, flipX: true }] },
    { id: 'passage.exit', bounds: [35, 15, 38, 23], tiles: [0], props: [brazier, { ...moss, flipX: true }] },
  ], [...corridor.enemies, ...corridor.items]),
};
