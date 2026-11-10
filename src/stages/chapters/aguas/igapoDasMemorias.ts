import type { DecorationPlacement, StageModule } from '../../contracts';
import {
  AGUAS_PRESENTATION_VARIANTS,
  AGUAS_RIBEIRINHO_PRESENTATION,
  IGAPO_LANDMARK_DECORATION_IDS,
  IGAPO_SCENERY_IDS,
  IGAPO_SOMBRIO_THEME_ID,
  IGAPO_VISUAL_THEME_ID,
} from './igapoVisuals';

export const IGAPO_DAS_MEMORIAS_STAGE_ID = 'stage.aguas.igapo-das-memorias';
export const IGAPO_DAS_MEMORIAS_CHAPTER_ID = 'chapter.aguas';
export const CORACAO_CORROMPIDO_STAGE_ID = 'stage.aguas.coracao-corrompido';
export const IGAPO_RETURN_EXIT_ID = 'exit.aguas.igapo.enter-corrupted-heart';
export const ECO_DAS_AGUAS_EVENT_ID = 'event.aguas.igapo.eco-das-aguas';
export const ECO_DAS_AGUAS_DIALOGUE_ID = 'dialogue.aguas.igapo.eco-das-aguas';
export const ECO_DAS_AGUAS_NPC_ID = 'npc.aguas.igapo.memory-vestige';
export const ECO_DAS_AGUAS_FLAG = 'flag.aguas.igapo.eco-das-aguas-seen';
export const IGAPO_DISCOVERY_MISSION_ID = 'mission.aguas.igapo.trace-corruption';
export const IGAPO_CORRUPTION_FOUND_FLAG = 'flag.aguas.igapo.corruption-found';
export const ECO_DAS_AGUAS_INTEREST = Object.freeze({ x: 28, y: 16 });
export const IGAPO_RETURN_ANCHOR = Object.freeze({ x: 91, y: 16 });

export const IGAPO_MAP_WIDTH = 96;
export const IGAPO_MAP_HEIGHT = 30;
const FLOOR = 0;
const WALL = 1;
const ROOT = 2;
const WATER = 3;
const EXIT = 5;
const CHEST = 7;
const SPAWN = 8;

type Point = readonly number[];

/**
 * The Igapó is an archipelago, not a green strip: broad irregular islands hold
 * the gameplay anchors while most of the interior remains water. The channels
 * below separate the islands before the authored causeways bridge them.
 */
const IGAPO_MASSES: readonly Point[] = Object.freeze([
  Object.freeze([8, 17, 8, 7.2]),
  Object.freeze([17, 7, 4.2, 2.8]),
  Object.freeze([27, 17, 7, 6.4]),
  Object.freeze([37, 6, 6, 2.8]),
  Object.freeze([40, 24, 7, 3.4]),
  Object.freeze([52, 16, 8.2, 5.8]),
  Object.freeze([58, 25, 5.8, 2.6]),
  Object.freeze([68, 17, 5.6, 5.2]),
  Object.freeze([77, 8, 4, 2.2]),
  Object.freeze([76, 24, 5, 2.6]),
  Object.freeze([85, 17, 7.6, 6.2]),
  Object.freeze([92, 6, 2.2, 1.6]),
  Object.freeze([14, 25, 4, 2]),
  Object.freeze([24, 7, 3.4, 1.8]),
]);

/** Long north-south water cuts that survive between the authored causeways. */
const IGAPO_WATER_CHANNELS: readonly (readonly Point[])[] = Object.freeze([
  Object.freeze([Object.freeze([20, 6]), Object.freeze([20, 12]),
    Object.freeze([19, 18]), Object.freeze([20, 24])]),
  Object.freeze([Object.freeze([45, 5]), Object.freeze([44, 11]),
    Object.freeze([45, 17]), Object.freeze([44, 23])]),
  Object.freeze([Object.freeze([62, 6]), Object.freeze([61, 12]),
    Object.freeze([62, 18]), Object.freeze([61, 24])]),
  Object.freeze([Object.freeze([75, 5]), Object.freeze([76, 11]),
    Object.freeze([75, 17]), Object.freeze([76, 23])]),
]);

/** Internal lagoons that break the larger islands into smaller silhouettes. */
const IGAPO_PONDS: readonly Point[] = Object.freeze([
  Object.freeze([12, 13, 1.5]),
  Object.freeze([31, 21, 1.5]),
  Object.freeze([47, 13, 1.4]),
  Object.freeze([55, 19, 1.3]),
  Object.freeze([66, 20, 1.3]),
  Object.freeze([86, 22, 1.5]),
  Object.freeze([22, 7, 1.2]),
  Object.freeze([46, 7, 1.2]),
  Object.freeze([73, 20, 1.2]),
  Object.freeze([28, 22, 1.2]),
  Object.freeze([19, 12, 1.4]),
  Object.freeze([36, 12, 1.3]),
  Object.freeze([43, 20, 1.3]),
  Object.freeze([62, 10, 1.2]),
  Object.freeze([63, 20, 1.2]),
  Object.freeze([88, 13, 1.2]),
  Object.freeze([14, 20, 1.2]),
  Object.freeze([49, 24, 1.2]),
]);

/**
 * West-to-east travel band. Every point of gameplay sits on or beside it, and
 * the bands are stamped after the water so the 42x58 body always has passage.
 */
const IGAPO_CORRIDORS: readonly (readonly Point[])[] = Object.freeze([
  Object.freeze([
    Object.freeze([2, 18]), Object.freeze([6, 18]), Object.freeze([10, 17]),
    Object.freeze([14, 15]), Object.freeze([18, 14]), Object.freeze([22, 16]),
    Object.freeze([26, 15]), Object.freeze([30, 17]), Object.freeze([34, 16]),
    Object.freeze([38, 18]), Object.freeze([42, 19]), Object.freeze([46, 17]),
    Object.freeze([50, 15]), Object.freeze([54, 16]), Object.freeze([58, 15]),
    Object.freeze([62, 17]), Object.freeze([66, 16]), Object.freeze([70, 17]),
    Object.freeze([74, 16]), Object.freeze([78, 17]), Object.freeze([82, 15]),
    Object.freeze([86, 16]), Object.freeze([90, 16]), Object.freeze([93, 16]),
  ]),
]);

/** Two reconnectable detours, one north and one south of the central island. */
const IGAPO_BRANCHES: readonly (readonly Point[])[] = Object.freeze([
  Object.freeze([Object.freeze([30, 11]), Object.freeze([33, 8]),
    Object.freeze([37, 6]), Object.freeze([41, 8]), Object.freeze([45, 10]),
    Object.freeze([48, 12]), Object.freeze([50, 15])]),
  Object.freeze([Object.freeze([30, 21]), Object.freeze([34, 24]),
    Object.freeze([40, 24]), Object.freeze([45, 22]), Object.freeze([48, 19])]),
  Object.freeze([Object.freeze([58, 12]), Object.freeze([61, 9]),
    Object.freeze([65, 8]), Object.freeze([69, 9]), Object.freeze([72, 12]),
    Object.freeze([72, 15])]),
  Object.freeze([Object.freeze([56, 20]), Object.freeze([59, 22]),
    Object.freeze([63, 24]), Object.freeze([67, 23]), Object.freeze([71, 21]),
    Object.freeze([72, 18])]),
  Object.freeze([Object.freeze([69, 14]), Object.freeze([73, 11]),
    Object.freeze([77, 9])]),
  Object.freeze([Object.freeze([80, 18]), Object.freeze([84, 19]),
    Object.freeze([88, 18]), Object.freeze([90, 16])]),
  Object.freeze([Object.freeze([10, 15]), Object.freeze([12, 11]),
    Object.freeze([15, 8]), Object.freeze([18, 7])]),
  Object.freeze([Object.freeze([12, 20]), Object.freeze([14, 23]),
    Object.freeze([17, 25])]),
]);

/** Root fields are deterministic clusters placed away from travel bands. */
const IGAPO_ROOT_CLUSTERS: readonly Point[] = Object.freeze([
  Object.freeze([16, 11]), Object.freeze([24, 10]), Object.freeze([33, 13]),
  Object.freeze([38, 15]), Object.freeze([44, 15]), Object.freeze([62, 12]),
  Object.freeze([65, 22]), Object.freeze([71, 20]), Object.freeze([80, 20]),
  Object.freeze([87, 13]), Object.freeze([20, 21]), Object.freeze([27, 8]),
  Object.freeze([36, 22]), Object.freeze([44, 25]), Object.freeze([58, 21]),
  Object.freeze([75, 15]), Object.freeze([82, 24]), Object.freeze([90, 20]),
  Object.freeze([13, 22]), Object.freeze([49, 9]), Object.freeze([55, 12]),
  Object.freeze([67, 9]), Object.freeze([74, 25]), Object.freeze([30, 18]),
  Object.freeze([22, 14]), Object.freeze([41, 11]), Object.freeze([53, 20]),
  Object.freeze([78, 12]), Object.freeze([85, 8]), Object.freeze([60, 8]),
  Object.freeze([18, 18]), Object.freeze([35, 9]), Object.freeze([48, 21]),
  Object.freeze([70, 13]), Object.freeze([89, 11]), Object.freeze([26, 23]),
  Object.freeze([52, 8]), Object.freeze([64, 15]), Object.freeze([84, 16]),
  Object.freeze([46, 18]), Object.freeze([31, 6]), Object.freeze([57, 8]),
  Object.freeze([73, 8]), Object.freeze([91, 24]), Object.freeze([12, 8]),
  Object.freeze([35, 13]), Object.freeze([45, 8]), Object.freeze([50, 20]),
  Object.freeze([56, 9]), Object.freeze([63, 9]), Object.freeze([79, 16]),
  Object.freeze([88, 17]), Object.freeze([10, 21]), Object.freeze([25, 20]),
  Object.freeze([42, 22]), Object.freeze([68, 24]), Object.freeze([81, 7]),
  Object.freeze([93, 13]), Object.freeze([16, 7]),
]);

const VEGETATION_CLUSTERS: readonly Point[] = Object.freeze([
  Object.freeze([10, 17, 6, 5]),
  Object.freeze([22, 18, 5, 4]),
  Object.freeze([30, 17, 5, 4]),
  Object.freeze([40, 20, 5, 4]),
  Object.freeze([50, 17, 5, 4]),
  Object.freeze([58, 20, 5, 4]),
  Object.freeze([68, 18, 5, 4]),
  Object.freeze([78, 18, 5, 4]),
  Object.freeze([86, 18, 6, 5]),
  Object.freeze([11, 11, 6, 3.4]),
  Object.freeze([20, 22, 6, 3]),
  Object.freeze([34, 5, 6, 2.6]),
  Object.freeze([37, 25, 6, 2.6]),
  Object.freeze([54, 8, 6, 2.8]),
  Object.freeze([60, 24, 6, 2.6]),
  Object.freeze([72, 6, 6, 2.6]),
  Object.freeze([75, 25, 6, 2.6]),
  Object.freeze([86, 9, 7, 3]),
  Object.freeze([89, 23, 6, 2.8]),
  Object.freeze([23, 9, 4, 2]),
  Object.freeze([66, 12, 4, 2.2]),
]);

const PALM_GROVES: readonly Point[] = Object.freeze([
  Object.freeze([18, 7]),
  Object.freeze([36, 26]),
  Object.freeze([73, 5]),
  Object.freeze([88, 24]),
  Object.freeze([80, 8]),
]);

const LANDMARKS: readonly (readonly [string, number, number, number, number])[] = Object.freeze([
  Object.freeze([IGAPO_LANDMARK_DECORATION_IDS.drownedTree, 14, 10, 1.7, 0xffffff] as const),
  Object.freeze([IGAPO_LANDMARK_DECORATION_IDS.oldArch, 38, 26, 4.2, 0x9bb7a0] as const),
  Object.freeze([IGAPO_LANDMARK_DECORATION_IDS.palmIsland, 72, 5, 1.55, 0xffffff] as const),
  Object.freeze([IGAPO_LANDMARK_DECORATION_IDS.fallenTrunk, 31, 5, 1.0, 0xffffff] as const),
  Object.freeze([IGAPO_LANDMARK_DECORATION_IDS.fallenTrunk, 52, 9, 1.0, 0xffffff] as const),
  Object.freeze([IGAPO_LANDMARK_DECORATION_IDS.submergedTrunk, 64, 6, 1.15, 0xffffff] as const),
  Object.freeze([IGAPO_LANDMARK_DECORATION_IDS.submergedTrunk, 86, 9, 1.0, 0xffffff] as const),
  Object.freeze([IGAPO_LANDMARK_DECORATION_IDS.canoe, 18, 10, 1.3, 0xffffff] as const),
  Object.freeze([IGAPO_LANDMARK_DECORATION_IDS.stiltHut, 33, 11, 1.15, 0xffffff] as const),
  Object.freeze([IGAPO_LANDMARK_DECORATION_IDS.stiltHut, 84, 10, 1.1, 0xffffff] as const),
  Object.freeze([IGAPO_LANDMARK_DECORATION_IDS.memoryStela, 22, 11, 1.1, 0xffffff] as const),
  Object.freeze([IGAPO_LANDMARK_DECORATION_IDS.memoryStela, 35, 19, 1.0, 0xffffff] as const),
  Object.freeze([IGAPO_LANDMARK_DECORATION_IDS.memoryStela, 88, 10, 1.15, 0xffffff] as const),
  Object.freeze([IGAPO_LANDMARK_DECORATION_IDS.emergentGiant, 50, 6, 2.35, 0xffffff] as const),
  Object.freeze([IGAPO_LANDMARK_DECORATION_IDS.emergentGiant, 79, 7, 2.2, 0xffffff] as const),
]);

const POLLUTION_NODES: readonly Point[] = Object.freeze([
  Object.freeze([52, 27]),
  Object.freeze([66, 27]),
  Object.freeze([77, 23]),
  Object.freeze([87, 24]),
]);

const ANCHOR_TILES: readonly Point[] = Object.freeze([
  Object.freeze([4, 17]),
  Object.freeze([28, 16]),
  Object.freeze([91, 16]),
  Object.freeze([10, 18]),
  Object.freeze([59, 12]),
  Object.freeze([83, 19]),
  Object.freeze([49, 16]),
  Object.freeze([56, 16]),
  Object.freeze([58, 12]),
  Object.freeze([69, 16]),
  Object.freeze([82, 15]),
  Object.freeze([88, 19]),
]);

const KEY_CLEARING: readonly Point[] = Object.freeze([
  Object.freeze([57, 12]), Object.freeze([59, 12]), Object.freeze([61, 12]),
]);

const LIGHT_SHAFT_POINTS: readonly Point[] = Object.freeze([
  Object.freeze([12, 7]),
  Object.freeze([25, 10]),
  Object.freeze([40, 8]),
  Object.freeze([54, 9]),
  Object.freeze([68, 8]),
  Object.freeze([82, 10]),
  Object.freeze([90, 7]),
]);

/** FNV-based decorrelated noise. It never consults Math.random. */
function detailNoise(x: number, y: number, salt: string): number {
  const text = `${salt}|${y}|${x}`;
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x7feb352d);
  hash ^= hash >>> 15;
  hash = Math.imul(hash, 0x846ca68b);
  hash ^= hash >>> 16;
  return (hash >>> 0) / 0xffffffff;
}

function insideMass(
  cx: number, cy: number, rx: number, ry: number, x: number, y: number,
): boolean {
  const dx = (x - cx) / rx;
  const dy = (y - cy) / ry;
  return dx * dx + dy * dy <= 1 + (detailNoise(x, y, 'mass-edge') - 0.5) * 0.28;
}

function paintLine(
  map: number[][],
  points: readonly Point[],
  radius: number,
  value: number,
  salt: string,
): void {
  const limit = Math.ceil(radius);
  for (let index = 0; index + 1 < points.length; index += 1) {
    const [fromX, fromY] = points[index];
    const [toX, toY] = points[index + 1];
    const steps = Math.max(Math.abs(toX - fromX), Math.abs(toY - fromY));
    for (let step = 0; step <= steps; step += 1) {
      const ratio = steps === 0 ? 0 : step / steps;
      const centerX = fromX + (toX - fromX) * ratio;
      const centerY = fromY + (toY - fromY) * ratio;
      for (let offsetY = -limit; offsetY <= limit; offsetY += 1) {
        for (let offsetX = -limit; offsetX <= limit; offsetX += 1) {
          const x = Math.round(centerX + offsetX);
          const y = Math.round(centerY + offsetY);
          if (x <= 0 || y <= 0 || x >= IGAPO_MAP_WIDTH - 1 || y >= IGAPO_MAP_HEIGHT - 1) continue;
          const edge = (detailNoise(x, y, salt) - 0.5) * 0.7;
          if (Math.hypot(offsetX, offsetY) <= radius + edge) map[y][x] = value;
        }
      }
    }
  }
}

function paintPond(map: number[][], centerX: number, centerY: number, radius: number): void {
  const limit = Math.ceil(radius) + 1;
  for (let offsetY = -limit; offsetY <= limit; offsetY += 1) {
    for (let offsetX = -limit; offsetX <= limit; offsetX += 1) {
      const x = centerX + offsetX;
      const y = centerY + offsetY;
      if (x <= 0 || y <= 0 || x >= IGAPO_MAP_WIDTH - 1 || y >= IGAPO_MAP_HEIGHT - 1) continue;
      const edge = (detailNoise(x, y, 'pond') - 0.5) * 0.5;
      if (Math.hypot(offsetX, offsetY) <= radius + edge) map[y][x] = WATER;
    }
  }
}

const ROUTE_SAMPLES: readonly Point[] = Object.freeze((() => {
  const samples: Point[] = [];
  [...IGAPO_CORRIDORS, ...IGAPO_BRANCHES].forEach(points => {
    for (let index = 0; index + 1 < points.length; index += 1) {
      const [fromX, fromY] = points[index];
      const [toX, toY] = points[index + 1];
      const steps = Math.max(Math.abs(toX - fromX), Math.abs(toY - fromY));
      for (let step = 0; step <= steps; step += 1) {
        const ratio = steps === 0 ? 0 : step / steps;
        samples.push(Object.freeze([
          fromX + (toX - fromX) * ratio,
          fromY + (toY - fromY) * ratio,
        ]));
      }
    }
  });
  return samples;
})());

function routeDistance(x: number, y: number): number {
  let minimum = Number.POSITIVE_INFINITY;
  for (const [routeX, routeY] of ROUTE_SAMPLES) {
    minimum = Math.min(minimum, Math.max(Math.abs(routeX - x), Math.abs(routeY - y)));
  }
  return minimum;
}

function nearAnchor(x: number, y: number, radius = 4): boolean {
  return ANCHOR_TILES.some(([anchorX, anchorY]) =>
    Math.abs(anchorX - x) <= radius && Math.abs(anchorY - y) <= radius);
}

function createIgapoMap(): number[][] {
  const map: number[][] = Array.from({ length: IGAPO_MAP_HEIGHT }, (_, y) =>
    Array.from({ length: IGAPO_MAP_WIDTH }, (_, x) =>
      x === 0 || y === 0 || x === IGAPO_MAP_WIDTH - 1 || y === IGAPO_MAP_HEIGHT - 1
        ? WALL : WATER));
  for (let y = 1; y < IGAPO_MAP_HEIGHT - 1; y += 1) {
    for (let x = 1; x < IGAPO_MAP_WIDTH - 1; x += 1) {
      if (IGAPO_MASSES.some(([cx, cy, rx, ry]) => insideMass(cx, cy, rx, ry, x, y))) {
        map[y][x] = FLOOR;
      }
    }
  }
  IGAPO_WATER_CHANNELS.forEach((channel, channelIndex) => {
    paintLine(map, channel, 1, WATER, `channel-${channelIndex}`);
  });
  IGAPO_PONDS.forEach(([centerX, centerY, radius]) => {
    paintPond(map, centerX, centerY, radius);
  });
  IGAPO_CORRIDORS.forEach((points, corridorIndex) => {
    paintLine(map, points, 1.6, FLOOR, `corridor-${corridorIndex}`);
  });
  IGAPO_BRANCHES.forEach((points, branchIndex) => {
    paintLine(map, points, 1.2, FLOOR, `branch-${branchIndex}`);
  });
  // The key item receives a wider landing so the 42x58 body can collect it.
  paintLine(map, KEY_CLEARING, 1.4, FLOOR, 'key-clearing');

  // Erode the islands around the authored band: water hugs the causeway and
  // the traversal reads as flooded forest instead of a field. The band itself
  // keeps more than two tiles of clearance for the 42x58 player body.
  for (let y = 1; y < IGAPO_MAP_HEIGHT - 1; y += 1) {
    for (let x = 1; x < IGAPO_MAP_WIDTH - 1; x += 1) {
      if (map[y][x] !== FLOOR) continue;
      const distance = routeDistance(x, y);
      if (distance < 2.2 || nearAnchor(x, y, 3)) continue;
      const strength = Math.min(1, (distance - 2.2) / 4);
      if (detailNoise(x, y, 'erosion') < 0.22 + strength * 0.36) map[y][x] = WATER;
    }
  }

  IGAPO_ROOT_CLUSTERS.forEach(([centerX, centerY]) => {
    for (let offset = 0; offset < 5; offset += 1) {
      const x = centerX + Math.floor(detailNoise(centerX + offset, centerY, 'root-x') * 3) - 1;
      const y = centerY + Math.floor(detailNoise(centerX, centerY + offset, 'root-y') * 3) - 1;
      if (x <= 0 || y <= 0 || x >= IGAPO_MAP_WIDTH - 1 || y >= IGAPO_MAP_HEIGHT - 1) continue;
      if (map[y][x] !== FLOOR) continue;
      if (nearAnchor(x, y, 3)) continue;
      if (routeDistance(x, y) < 2) continue;
      map[y][x] = ROOT;
    }
  });

  map[17][4] = SPAWN;
  map[ECO_DAS_AGUAS_INTEREST.y][ECO_DAS_AGUAS_INTEREST.x] = CHEST;
  map[IGAPO_RETURN_ANCHOR.y][IGAPO_RETURN_ANCHOR.x] = EXIT;
  return map;
}

function touchesTile(
  map: readonly (readonly number[])[],
  x: number,
  y: number,
  value: number,
): boolean {
  for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
      if (map[y + offsetY]?.[x + offsetX] === value) return true;
    }
  }
  return false;
}

function landDirection(
  map: readonly (readonly number[])[],
  x: number,
  y: number,
  salt: number,
): number | undefined {
  const options = [
    { present: map[y - 1]?.[x] === FLOOR, rotation: 0 },
    { present: map[y]?.[x + 1] === FLOOR, rotation: Math.PI / 2 },
    { present: map[y + 1]?.[x] === FLOOR, rotation: Math.PI },
    { present: map[y]?.[x - 1] === FLOOR, rotation: -Math.PI / 2 },
  ].filter(option => option.present);
  if (options.length === 0) return undefined;
  return options[Math.floor(detailNoise(x, y, `shore-${salt}`) * options.length)].rotation;
}

function clusterDensity(x: number, y: number): number {
  return VEGETATION_CLUSTERS.reduce((maximum, [centerX, centerY, radiusX, radiusY]) => {
    const dx = (x - centerX) / radiusX;
    const dy = (y - centerY) / radiusY;
    return Math.max(maximum, 1 - Math.sqrt(dx * dx + dy * dy));
  }, 0);
}

function createIgapoDecorations(map: readonly (readonly number[])[]): DecorationPlacement[] {
  const decorations: DecorationPlacement[] = [];
  const add = (
    type: string,
    x: number,
    y: number,
    options: {
      readonly scale?: number;
      readonly tint?: number;
      readonly rotation?: number;
      readonly alpha?: number;
      readonly layer?: 'background' | 'terrain' | 'foreground';
      readonly depth?: number;
      readonly flipX?: boolean;
      readonly flipY?: boolean;
      readonly originX?: number;
      readonly originY?: number;
    } = {},
  ): void => {
    decorations.push({ type, x, y, ...options });
  };
  const addShadow = (x: number, y: number, scale: number, alpha = 0.5): void => {
    add(IGAPO_SCENERY_IDS.canopyShadow, x, y, {
      scale, alpha, layer: 'terrain', rotation: (detailNoise(x, y, 'shadow') - 0.5) * 0.3,
    });
  };
  const addFloodedTree = (x: number, y: number, scale: number): void => {
    addShadow(x, y, scale * 1.15, 0.42);
    if (detailNoise(x, y, 'tree-kind') < 0.62) {
      add(IGAPO_SCENERY_IDS.floodedTree, x, y, {
        scale,
        rotation: (detailNoise(x, y, 'tree-angle') - 0.5) * 0.12,
        originY: 0.95,
        flipX: detailNoise(x, y, 'tree-flip') < 0.5,
        depth: 4.3 + detailNoise(x, y, 'tree-depth') * 0.2,
      });
    } else {
      add(IGAPO_SCENERY_IDS.palmCluster, x, y, {
        scale: scale * 0.92,
        rotation: (detailNoise(x, y, 'palm-angle') - 0.5) * 0.14,
        originY: 0.98,
        flipX: detailNoise(x, y, 'palm-flip') < 0.5,
        depth: 4.4 + detailNoise(x, y, 'palm-depth') * 0.16,
      });
    }
  };

  for (let y = 1; y < IGAPO_MAP_HEIGHT - 1; y += 1) {
    for (let x = 1; x < IGAPO_MAP_WIDTH - 1; x += 1) {
      const tile = map[y][x];
      const roll = detailNoise(x, y, 'scenery');
      const density = clusterDensity(x, y);
      const distanceToRoute = routeDistance(x, y);
      if (tile === WATER) {
        const shoreline = touchesTile(map, x, y, FLOOR);
        if (shoreline) {
          const rotation = landDirection(map, x, y, 0);
          if (rotation !== undefined) {
            const frame = Math.floor(detailNoise(x, y, 'shore-frame') * 4);
            if (detailNoise(x, y, 'shore-gap') > 0.6) add(IGAPO_SCENERY_IDS.shore[frame], x, y, {
              rotation: rotation + (detailNoise(x, y, 'shore-wobble') - 0.5) * 0.24,
              scale: 0.95 + detailNoise(x, y, 'shore-scale') * 0.3,
              flipX: detailNoise(x, y, 'shore-flip') < 0.5,
              layer: 'terrain',
              alpha: 0.96,
            });
          }
          if (roll < 0.05 && !nearAnchor(x, y, 4)) {
            add(IGAPO_SCENERY_IDS.rootTangle, x, y, {
              scale: 1.6 + detailNoise(x, y, 'shore-root-scale') * 0.7,
              rotation: (detailNoise(x, y, 'shore-root-angle') - 0.5) * 0.7,
              flipX: detailNoise(x, y, 'shore-root-flip') < 0.5,
              layer: 'terrain',
              depth: 1.7,
              alpha: 0.96,
            });
          }
          if (roll > 0.92) {
            add('igapo_reeds', x, y, {
              scale: 1.45 + detailNoise(x, y, 'reed-scale') * 0.55,
              rotation: (detailNoise(x, y, 'reed-angle') - 0.5) * 0.2,
              tint: 0x8dab7a,
              layer: 'terrain',
            });
          } else if (roll > 0.72) {
            add(IGAPO_SCENERY_IDS.lily[Math.floor(detailNoise(x, y, 'lily-frame') * 4)], x, y, {
              scale: 0.9 + detailNoise(x, y, 'lily-scale') * 0.3,
              rotation: (detailNoise(x, y, 'lily-angle') - 0.5) * 0.2,
              layer: 'terrain',
            });
          }
        } else if (roll < 0.06 && density > 0.05) {
          add(IGAPO_SCENERY_IDS.lily[Math.floor(detailNoise(x, y, 'lily-frame') * 4)], x, y, {
            scale: 0.9 + detailNoise(x, y, 'lily-scale') * 0.5,
            rotation: (detailNoise(x, y, 'lily-angle') - 0.5) * 0.25,
            layer: 'terrain',
          });
        } else if (roll > 0.975) {
          add('igapo_waterweed', x, y, {
            scale: 1.5 + detailNoise(x, y, 'weed') * 0.8,
            alpha: 0.8,
            layer: 'terrain',
          });
        }
        if (!shoreline && distanceToRoute > 3 && !nearAnchor(x, y, 4)) {
          const openNoise = detailNoise(x, y, 'open-water');
          if (openNoise > 0.965) {
            addFloodedTree(x, y, 1.35 + detailNoise(x, y, 'water-tree-scale') * 0.7);
          } else if (openNoise > 0.952) {
            add(IGAPO_SCENERY_IDS.submergedTrunk, x, y, {
              scale: 0.95 + detailNoise(x, y, 'snag-scale') * 0.35,
              rotation: (detailNoise(x, y, 'snag-angle') - 0.5) * 0.6,
              flipX: detailNoise(x, y, 'snag-flip') < 0.5,
              layer: 'terrain',
              alpha: 0.95,
            });
          } else if (openNoise < 0.026) {
            add('igapo_waterweed', x, y, {
              scale: 1.8 + detailNoise(x, y, 'open-weed') * 0.9,
              tint: 0x6f8a6a,
              alpha: 0.8,
              rotation: (detailNoise(x, y, 'open-weed-angle') - 0.5) * 0.4,
              layer: 'terrain',
            });
          }
        }
        if (y <= 5 || y >= IGAPO_MAP_HEIGHT - 6) {
          const borderNoise = detailNoise(x, y, 'border-tree');
          if (borderNoise < 0.075 && distanceToRoute > 2) {
            addFloodedTree(x, y, 1.35 + detailNoise(x, y, 'border-scale') * 0.65);
          } else if (borderNoise > 0.975) {
            add('igapo_canopy_high', x, y, {
              scale: 4.2 + detailNoise(x, y, 'canopy-scale') * 1.4,
              alpha: 0.55,
              depth: 6.34,
              layer: 'terrain',
            });
          }
        }
        continue;
      }
      if (tile !== FLOOR) continue;

      const shoreLand = touchesTile(map, x, y, WATER);
      if (!nearAnchor(x, y, 4) && detailNoise(x, y, 'shade-field') > 0.9) {
        add(IGAPO_SCENERY_IDS.canopyShadow, x, y, {
          scale: 2.5 + detailNoise(x, y, 'shade-field-scale') * 2,
          rotation: (detailNoise(x, y, 'shade-field-angle') - 0.5) * 0.8,
          alpha: 0.36 + detailNoise(x, y, 'shade-field-alpha') * 0.16,
          layer: 'terrain',
        });
      }
      if (!nearAnchor(x, y, 4)) {
        if (!shoreLand && roll < 0.1 && density > 0.08) {
          add(IGAPO_SCENERY_IDS.moss[Math.floor(detailNoise(x, y, 'moss-frame') * 4)], x, y, {
            scale: 1 + detailNoise(x, y, 'moss-scale') * 0.75,
            rotation: (detailNoise(x, y, 'moss-angle') - 0.5) * 0.4,
            alpha: 0.58 + detailNoise(x, y, 'moss-alpha') * 0.22,
            ...(detailNoise(x, y, 'moss-tint') < 0.34 ? { tint: 0x9a8a5f } : {}),
            flipX: detailNoise(x, y, 'moss-flip') < 0.5,
            layer: 'terrain',
          });
        } else if (shoreLand && roll < 0.2) {
          add(IGAPO_SCENERY_IDS.moss[Math.floor(detailNoise(x, y, 'moss-frame') * 4)], x, y, {
            scale: 1.2 + detailNoise(x, y, 'moss-scale') * 1.1,
            rotation: (detailNoise(x, y, 'moss-angle') - 0.5) * 0.4,
            alpha: 0.66 + detailNoise(x, y, 'moss-alpha') * 0.2,
            ...(detailNoise(x, y, 'moss-tint') < 0.4 ? { tint: 0x9a8a5f } : {}),
            layer: 'terrain',
          });
        }
      }

      if (distanceToRoute <= 2 && roll < 0.06) {
        add('igapo_reeds', x, y, {
          scale: 0.55 + detailNoise(x, y, 'tuft-scale') * 0.35,
          rotation: (detailNoise(x, y, 'tuft-angle') - 0.5) * 0.2,
          tint: 0x8fae7a,
          alpha: 0.88,
          layer: 'foreground',
        });
      }
      if (distanceToRoute <= 1 || nearAnchor(x, y, 4)) continue;

      if (shoreLand && roll < 0.16) {
        add('igapo_reeds', x, y, {
          scale: 1.5 + detailNoise(x, y, 'reed-scale') * 0.6,
          rotation: (detailNoise(x, y, 'reed-angle') - 0.5) * 0.18,
          tint: 0x93b07e,
          layer: 'foreground',
          alpha: 0.95,
        });
      }
      if (roll < 0.16 && density > 0.04) {
        add(IGAPO_SCENERY_IDS.rootTangle, x, y, {
          scale: 0.85 + detailNoise(x, y, 'root-scale') * 0.35,
          rotation: (detailNoise(x, y, 'root-angle') - 0.5) * 0.5,
          flipX: detailNoise(x, y, 'root-flip') < 0.5,
          layer: 'terrain',
        });
      } else if (detailNoise(x, y, 'root-field') > 0.86 && distanceToRoute > 2) {
        add(IGAPO_SCENERY_IDS.rootTangle, x, y, {
          scale: 0.8 + detailNoise(x, y, 'root-field-scale') * 0.45,
          rotation: (detailNoise(x, y, 'root-field-angle') - 0.5) * 0.6,
          flipX: detailNoise(x, y, 'root-field-flip') < 0.5,
          flipY: detailNoise(x, y, 'root-field-flip-y') < 0.5,
          layer: 'terrain',
        });
      }
      if (distanceToRoute > 2.5 && roll > 0.5 && roll < 0.52 + density * 0.34) {
        const treeScale = distanceToRoute < 4
          ? 1.1 + detailNoise(x, y, 'tree-scale') * 0.4
          : 1.45 + detailNoise(x, y, 'tree-scale') * 0.7;
        addFloodedTree(x, y, treeScale);
      } else if (roll > 0.68 && density > 0.1) {
        add('igapo_shrub', x, y, {
          scale: 1.5 + detailNoise(x, y, 'shrub-scale') * 0.7,
          rotation: (detailNoise(x, y, 'shrub-angle') - 0.5) * 0.16,
          tint: detailNoise(x, y, 'shrub-tint') < 0.5 ? 0x9db883 : 0x8faa78,
          layer: 'foreground',
        });
      } else if (roll < 0.08 && density > 0.2) {
        add('igapo_fruit_tree', x, y, {
          scale: 2 + detailNoise(x, y, 'fruit-scale') * 0.6,
          rotation: (detailNoise(x, y, 'fruit-angle') - 0.5) * 0.2,
          tint: 0xb3c99a,
          layer: 'foreground',
        });
      }
    }
  }

  PALM_GROVES.forEach(([centerX, centerY], groveIndex) => {
    [[-1, 0], [0, 0], [1, 1], [1, -1]].forEach(([offsetX, offsetY], palmIndex) => {
      const x = centerX + offsetX;
      const y = centerY + offsetY;
      if (outsideMap(map, x, y)) return;
      if (nearAnchor(x, y, 4)) return;
      add(IGAPO_SCENERY_IDS.palmCluster, x, y, {
        scale: 1.15 + detailNoise(x, y, 'palm-scale') * 0.5,
        rotation: (detailNoise(x, y, 'palm-angle') - 0.5) * 0.12,
        originY: 0.98,
        flipX: (groveIndex + palmIndex) % 2 === 0,
      });
    });
  });

  LANDMARKS.forEach(([type, x, y, scale, tint]) => {
    add(type, x, y, {
      scale,
      tint,
      ...(type === IGAPO_LANDMARK_DECORATION_IDS.oldArch
        ? {}
        : { originY: 0.97 }),
    });
  });

  POLLUTION_NODES.forEach(([x, y]) => {
    if (map[y]?.[x] !== WATER || nearAnchor(x, y, 4)) return;
    add('igapo_waterweed', x, y, { scale: 3.1, tint: 0x2a382a, layer: 'terrain' });
    add('igapo_pebble', x + 1, y, { scale: 1.5, tint: 0xc4a36a, layer: 'terrain' });
  });

  const stoneGarden = [16, 24] as const;
  [[-1, 0], [0, -1], [0, 0], [1, 0], [0, 1]].forEach(([offsetX, offsetY]) => {
    add(
      IGAPO_LANDMARK_DECORATION_IDS.stoneGarden,
      stoneGarden[0] + offsetX,
      stoneGarden[1] + offsetY,
      {
        scale: 1.2 + detailNoise(offsetX, offsetY, 'stone-garden') * 0.4,
        tint: 0x8fa898,
        layer: 'terrain',
      },
    );
  });

  // Screen-edge canopy frames: the authored bough asset covers the logical
  // wall band and adds true foreground depth without entering the route.
  for (let x = 3; x < IGAPO_MAP_WIDTH - 3; x += 11) {
    if (x + 6 <= IGAPO_MAP_WIDTH - 2) add(IGAPO_SCENERY_IDS.canopyBough, x + 6, 1, {
      scale: 0.95 + detailNoise(x, 7, 'bough-inner') * 0.2,
      rotation: (detailNoise(x, 8, 'bough-inner-angle') - 0.5) * 0.06,
      originY: 0,
      flipX: detailNoise(x, 9, 'bough-inner-flip') < 0.5,
      layer: 'foreground',
      depth: 7.18,
      alpha: 0.92,
    });
    add(IGAPO_SCENERY_IDS.canopyBough, x, 1, {
      scale: 1.15 + detailNoise(x, 1, 'bough-top') * 0.2,
      rotation: (detailNoise(x, 2, 'bough-top-angle') - 0.5) * 0.05,
      originY: 0,
      flipX: detailNoise(x, 3, 'bough-top-flip') < 0.5,
      layer: 'foreground',
      depth: 7.2,
      alpha: 0.98,
    });
    if (x + 5 <= IGAPO_MAP_WIDTH - 2) add(IGAPO_SCENERY_IDS.canopyBough, x + 5, IGAPO_MAP_HEIGHT - 2, {
      scale: 1.1 + detailNoise(x, 4, 'bough-bottom') * 0.2,
      rotation: (detailNoise(x, 5, 'bough-bottom-angle') - 0.5) * 0.05,
      originY: 1,
      flipY: true,
      flipX: detailNoise(x, 6, 'bough-bottom-flip') < 0.5,
      layer: 'foreground',
      depth: 7.22,
      alpha: 0.98,
    });
  }

  // Inland canopy overhangs create a near foreground plane in the middle of
  // the panorama without covering the authored travel band.
  const INLAND_BOUGHS: readonly Point[] = Object.freeze([
    Object.freeze([14, 8]), Object.freeze([34, 7]), Object.freeze([52, 9]),
    Object.freeze([70, 9]), Object.freeze([86, 8]),
    Object.freeze([20, 24]), Object.freeze([44, 22]), Object.freeze([62, 22]),
    Object.freeze([78, 23]),
  ]);
  INLAND_BOUGHS.forEach(([x, y], index) => {
    add(IGAPO_SCENERY_IDS.canopyBough, x, y, {
      scale: 0.9 + detailNoise(x, y, 'inland-bough') * 0.35,
      rotation: (detailNoise(x, y, 'inland-bough-angle') - 0.5) * 0.16,
      originY: 0.5,
      flipX: index % 2 === 1,
      layer: 'foreground',
      depth: 6.55,
      alpha: 0.94,
    });
  });

  LIGHT_SHAFT_POINTS.forEach(([x, y], index) => {
    add(IGAPO_SCENERY_IDS.lightShaft, x, y, {
      scale: 1.1 + detailNoise(x, y, 'shaft-scale') * 0.45,
      rotation: -0.16 - detailNoise(x, y, 'shaft-angle') * 0.06,
      alpha: 0.1 + (index % 3) * 0.02,
      depth: 7.08,
      layer: 'terrain',
    });
  });

  return decorations;
}

function outsideMap(
  map: readonly (readonly number[])[],
  x: number,
  y: number,
): boolean {
  return x <= 0 || y <= 0 || x >= IGAPO_MAP_WIDTH - 1 || y >= IGAPO_MAP_HEIGHT - 1 ||
    (map[y]?.[x] !== FLOOR && map[y]?.[x] !== WATER);
}

const IGAPO_LEVEL_MAP = createIgapoMap();
const IGAPO_LEVEL_DECORATIONS = createIgapoDecorations(IGAPO_LEVEL_MAP);

export const IGAPO_DAS_MEMORIAS_STAGE: StageModule = Object.freeze({
  manifest: Object.freeze({
    schemaVersion: 1 as const,
    id: IGAPO_DAS_MEMORIAS_STAGE_ID,
    revision: 2,
    chapterId: IGAPO_DAS_MEMORIAS_CHAPTER_ID,
    order: 0,
    title: 'Igapó das Memórias',
    summary: 'Uma travessia inundada acompanha memórias perdidas até a nascente da corrupção.',
    layout: Object.freeze({ kind: 'authored' as const }),
    presentation: AGUAS_RIBEIRINHO_PRESENTATION,
    presentationVariants: AGUAS_PRESENTATION_VARIANTS,
    campaignCatalog: Object.freeze({
      availability: 'available' as const,
      participation: 'candidate' as const,
      role: 'standard' as const,
      regionIds: Object.freeze(['region.aguas.igapo']),
      biomeIds: Object.freeze(['crypt']),
      difficulty: Object.freeze({ minimum: 1, maximum: 3 }),
      allowedActIds: Object.freeze(['act-1']),
      maximumPhysicalExits: 2 as const,
      revisit: 'checkpoint' as const,
      requiredEventIds: Object.freeze([]),
      requiredBeatIds: Object.freeze([]),
      providesBeatIds: Object.freeze(['beat.region.aguas.igapo']),
    }),
    exits: Object.freeze([Object.freeze({
      id: IGAPO_RETURN_EXIT_ID,
      anchor: Object.freeze({ kind: 'tile' as const, ...IGAPO_RETURN_ANCHOR }),
      targetStageId: CORACAO_CORROMPIDO_STAGE_ID,
      condition: Object.freeze({
        type: 'flag.equals' as const,
        flag: IGAPO_CORRUPTION_FOUND_FLAG,
        value: true,
      }),
    })]),
    entryDialogueId: ECO_DAS_AGUAS_DIALOGUE_ID,
    completionMissionId: IGAPO_DISCOVERY_MISSION_ID,
    capabilities: Object.freeze([
      Object.freeze({
        id: 'navigation.authored-map', category: 'navigation' as const,
        minimumVersion: 1, requirement: 'required' as const,
      }),
      Object.freeze({
        id: 'interaction.npc-dialogue', category: 'interaction' as const,
        minimumVersion: 1, requirement: 'required' as const,
      }),
      Object.freeze({
        id: 'audio.level-music', category: 'audio' as const,
        minimumVersion: 1, requirement: 'required' as const,
      }),
      Object.freeze({
        id: 'audio.level-ambience', category: 'audio' as const,
        minimumVersion: 1, requirement: 'required' as const,
      }),
      Object.freeze({
        id: 'audio.stage-event-sfx', category: 'audio' as const,
        minimumVersion: 1, requirement: 'required' as const,
      }),
      Object.freeze({
        id: 'lighting.level-ambience', category: 'lighting' as const,
        minimumVersion: 1, requirement: 'required' as const,
      }),
      Object.freeze({
        id: 'effect.level-fog', category: 'effect' as const,
        minimumVersion: 1, requirement: 'required' as const,
      }),
      Object.freeze({
        id: 'npc.custom-sprite', category: 'npc' as const,
        minimumVersion: 1, requirement: 'required' as const,
      }),
      Object.freeze({
        id: 'enemy.visual-variant', category: 'enemy' as const,
        minimumVersion: 1, requirement: 'required' as const,
      }),
      Object.freeze({
        id: 'encounter.declarative', category: 'encounter' as const,
        minimumVersion: 1, requirement: 'required' as const,
      }),
      Object.freeze({
        id: IGAPO_VISUAL_THEME_ID, category: 'theme' as const,
        minimumVersion: 1, requirement: 'required' as const,
      }),
      Object.freeze({
        id: IGAPO_SOMBRIO_THEME_ID, category: 'theme' as const,
        minimumVersion: 1, requirement: 'optional' as const,
      }),
      Object.freeze({
        id: 'tile.custom-tileset', category: 'tile' as const,
        minimumVersion: 1, requirement: 'required' as const,
      }),
      Object.freeze({
        id: 'effect.level-decoration', category: 'effect' as const,
        minimumVersion: 1, requirement: 'required' as const,
      }),
    ]),
    tags: Object.freeze(['amazon', 'aguas', 'igapo', 'authored']),
  }),
  authoredLevel: Object.freeze({
    id: IGAPO_DAS_MEMORIAS_STAGE_ID,
    name: 'Igapó das Memórias',
    description: 'Uma floresta inundada se estende para leste, onde a água perde cor e memória.',
    theme: 'witches_crypt' as const,
    music: 'ost_vestibule',
    ambientColor: 0x173b35,
    fogColor: 0x071b1d,
    fogDensity: 0.48,
    lightIntensity: 0.48,
    tileMap: IGAPO_LEVEL_MAP,
    enemies: [],
    items: [
      { type: 'health_herb', x: 10, y: 18, quantity: 1 },
      { type: 'key', x: 59, y: 12, quantity: 1 },
      { type: 'mana_shard', x: 83, y: 19, quantity: 1 },
    ],
    decorations: IGAPO_LEVEL_DECORATIONS,
    parTime: 420,
    difficulty: 3,
  }),
  encounter: Object.freeze({
    schemaVersion: 1 as const,
    id: `encounter.${IGAPO_DAS_MEMORIAS_STAGE_ID}`,
    start: 'stage-ready' as const,
    completion: 'all-waves-defeated' as const,
    scaling: 'stage-difficulty-floor' as const,
    source: Object.freeze({
      kind: 'authored-waves' as const,
      waves: Object.freeze([
        Object.freeze({
          id: 'wave.1',
          delayBeforeMs: 0,
          enemies: Object.freeze([
            Object.freeze({
              type: 'affinity' as const, x: 49, y: 16, level: 2,
              patrol: Object.freeze([{ x: 49, y: 16 }, { x: 56, y: 16 }]),
            }),
            Object.freeze({ type: 'applaud' as const, x: 58, y: 12, level: 2 }),
          ]),
        }),
        Object.freeze({
          id: 'wave.2',
          delayBeforeMs: 1200,
          enemies: Object.freeze([
            Object.freeze({ type: 'affinity' as const, x: 69, y: 16, level: 3 }),
            Object.freeze({ type: 'affinity' as const, x: 82, y: 15, level: 3 }),
            Object.freeze({ type: 'applaud' as const, x: 88, y: 19, level: 3 }),
          ]),
        }),
      ]),
    }),
  }),
  narrative: Object.freeze({
    flags: Object.freeze({
      [ECO_DAS_AGUAS_FLAG]: false,
      [IGAPO_CORRUPTION_FOUND_FLAG]: false,
    }),
  }),
  npcs: Object.freeze([Object.freeze({
    id: ECO_DAS_AGUAS_NPC_ID,
    displayName: 'Vestígio Submerso',
    role: 'ambient' as const,
    presentationId: 'environment.memory-vestige',
    spawn: Object.freeze({ kind: 'tile' as const, ...ECO_DAS_AGUAS_INTEREST }),
    interactionDialogueId: ECO_DAS_AGUAS_DIALOGUE_ID,
  })]),
  dialogues: Object.freeze([Object.freeze({
    id: ECO_DAS_AGUAS_DIALOGUE_ID,
    startNodeId: 'echo-rises',
    nodes: Object.freeze([
      Object.freeze({
        id: 'echo-rises',
        speakerId: 'narrator' as const,
        text: 'A água devolve um rosto sem nome. Quando a corrente muda, a lembrança se desfaz antes de alcançar a margem.',
        nextNodeId: 'waters-remember',
      }),
      Object.freeze({
        id: 'waters-remember',
        speakerId: 'player' as const,
        text: 'Não foi o tempo que apagou isto. Há algo bebendo as memórias do Igapó.',
      }),
    ]),
  })]),
  missions: Object.freeze([Object.freeze({
    id: IGAPO_DISCOVERY_MISSION_ID,
    title: 'Rastrear a água sem memória',
    description: 'Alcance o Vestígio Submerso e confirme a origem da degradação.',
    scope: 'stage' as const,
    start: 'stage-enter' as const,
    objectives: Object.freeze([Object.freeze({
      id: 'objective.aguas.igapo.reach-vestige',
      description: 'Encontre o Vestígio Submerso.',
      signal: 'npc.interacted' as const,
      target: 1,
      filter: Object.freeze({ field: 'npcId' as const, equals: ECO_DAS_AGUAS_NPC_ID }),
    })]),
  })]),
  events: Object.freeze([Object.freeze({
    id: ECO_DAS_AGUAS_EVENT_ID,
    once: true,
    when: 'stage.entered' as const,
    filter: Object.freeze({ field: 'stageId' as const, equals: IGAPO_DAS_MEMORIAS_STAGE_ID }),
    condition: Object.freeze({
      type: 'flag.equals' as const,
      flag: ECO_DAS_AGUAS_FLAG,
      value: false,
    }),
    commands: Object.freeze([
      Object.freeze({ type: 'mission.start' as const, missionId: IGAPO_DISCOVERY_MISSION_ID }),
      Object.freeze({ type: 'dialogue.start' as const, dialogueId: ECO_DAS_AGUAS_DIALOGUE_ID }),
      Object.freeze({ type: 'flag.set' as const, flag: ECO_DAS_AGUAS_FLAG, value: true }),
    ]),
  }), Object.freeze({
    id: 'event.aguas.igapo.corruption-discovered',
    once: true,
    when: 'mission.completed' as const,
    filter: Object.freeze({
      field: 'missionId' as const,
      equals: IGAPO_DISCOVERY_MISSION_ID,
    }),
    commands: Object.freeze([
      Object.freeze({
        type: 'flag.set' as const,
        flag: IGAPO_CORRUPTION_FOUND_FLAG,
        value: true,
      }),
      Object.freeze({ type: 'stage.complete' as const, exitId: IGAPO_RETURN_EXIT_ID }),
    ]),
  })]),
});
