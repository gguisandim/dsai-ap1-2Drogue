import type { DecorationPlacement, StageModule } from '../../contracts';
import {
  AGUAS_PRESENTATION_VARIANTS,
  AGUAS_RIBEIRINHO_PRESENTATION,
  IGAPO_LANDMARK_DECORATION_IDS,
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

/**
 * Land masses are ellipses with a deterministic edge wobble. The corridors
 * guarantee a west-to-east route and two reconnectable loops, while the
 * wobble keeps the banks from reading as rectangles.
 */
const IGAPO_MASSES: readonly (readonly [number, number, number, number])[] = Object.freeze([
  [10, 17, 9, 6.5], [25, 15, 12, 7], [43, 14, 13, 7.5],
  [62, 15, 13, 7.5], [82, 16, 13, 7],
  [34, 7, 9, 3.8], [38, 23, 10, 3.5], [64, 7, 10, 3.2], [70, 24, 11, 3.5],
  [17, 6, 5, 2], [56, 26, 7, 2], [92, 7, 5, 2],
]);

const IGAPO_CORRIDORS: readonly (readonly (readonly [number, number])[])[] = Object.freeze([
  [[4, 17], [10, 16], [16, 17], [22, 16], [28, 16], [34, 15], [41, 14],
    [47, 16], [55, 16], [62, 17], [69, 16], [76, 16], [83, 15], [91, 16]],
  [[28, 16], [27, 12], [30, 8], [35, 6], [41, 7], [43, 11], [47, 14]],
  [[28, 16], [29, 19], [32, 22], [38, 24], [43, 23], [46, 19]],
  [[76, 16], [80, 13], [85, 12], [91, 15]],
]);

const IGAPO_WATER_CHANNELS: readonly (readonly (readonly [number, number, number])[])[] = Object.freeze([
  [[1, 10, 1.5], [8, 9, 1.8], [15, 10, 1.6], [21, 12, 1.8], [27, 11, 1.4]],
  [[36, 11, 1.3], [41, 9, 1.6], [47, 10, 1.5], [53, 8, 1.6],
    [59, 9, 1.5], [65, 8, 1.6], [71, 10, 1.4]],
  [[52, 27, 1.4], [60, 25, 1.8], [68, 26, 1.5], [77, 23, 1.8], [87, 24, 1.5], [94, 26, 1.3]],
  [[87, 3, 1.4], [84, 7, 1.7], [86, 11, 1.5]],
]);

/** Deterministic obstacles verified to keep both loops traversable. */
const IGAPO_ROOTS: readonly (readonly [number, number])[] = Object.freeze([
  [51, 20], [35, 16], [40, 17], [24, 13], [61, 22], [45, 18], [29, 14], [66, 23],
  [55, 20], [49, 18], [38, 15], [59, 20], [43, 16], [27, 12], [64, 21], [32, 13],
  [69, 22], [53, 18], [47, 16], [57, 18], [41, 14], [62, 19], [30, 11], [67, 20],
  [72, 21], [45, 14], [50, 15], [60, 17], [28, 9], [65, 18], [33, 10], [70, 19],
  [54, 15], [75, 20], [43, 12], [48, 13], [37, 10], [58, 15], [63, 16], [84, 21],
  [31, 8], [68, 17], [52, 13], [73, 18], [41, 10], [78, 19], [46, 11], [88, 21],
  [35, 8], [56, 13], [82, 19], [66, 15], [71, 16], [39, 8], [76, 17], [60, 13],
  [44, 9], [86, 19], [33, 6], [91, 20],
]);

const TREE_PALETTE = Object.freeze([
  Object.freeze({ type: 'igapo_emergent_tree', tint: 0x9fbd94, scale: 4.4 }),
  Object.freeze({ type: 'igapo_emergent_tree_variant', tint: 0x93b18a, scale: 3.9 }),
  Object.freeze({ type: 'igapo_emergent_tree_dark', tint: 0x89aa84, scale: 4.1 }),
  Object.freeze({ type: 'igapo_round_tree', tint: 0xa8c69b, scale: 4.2 }),
  Object.freeze({ type: 'igapo_broad_tree', tint: 0xb4cfa0, scale: 3.9 }),
]);

const WET_TREE_PALETTE = Object.freeze([
  Object.freeze({ type: 'igapo_emergent_tree', tint: 0x96b48d, scale: 4 }),
  Object.freeze({ type: 'igapo_round_tree', tint: 0xa8c69b, scale: 3.8 }),
  Object.freeze({ type: 'igapo_broad_tree', tint: 0xafca9d, scale: 3.7 }),
  Object.freeze({ type: 'igapo_palm', tint: 0xacc79c, scale: 3.4 }),
]);

const VEGETATION_CLUSTERS: readonly (readonly [number, number, number, number])[] = Object.freeze([
  [12, 11, 5, 3], [20, 22, 5, 3], [33, 4, 5, 2.5], [35, 26, 5, 2.5],
  [53, 8, 5, 2.5], [62, 25, 5, 2.5], [72, 5, 5, 2.5], [76, 24, 5, 2.5],
  [87, 9, 6, 3], [89, 24, 5, 3],
]);

const PALM_GROVES: readonly (readonly [number, number])[] = Object.freeze([
  [20, 10], [36, 27], [73, 5], [87, 24],
]);

const TREE_GROVES: readonly (readonly (readonly [number, number])[])[] = Object.freeze([
  [[16, 16], [17, 18], [18, 20], [19, 17]],
  [[20, 14], [21, 16], [22, 18], [23, 14]],
  [[32, 6], [34, 7], [36, 6], [38, 8]],
  [[34, 23], [36, 24], [39, 22], [41, 24]],
  [[62, 5], [64, 5], [66, 5], [68, 5]],
  [[80, 13], [82, 12], [84, 13], [86, 12]],
  [[72, 23], [74, 24], [76, 23], [78, 24]],
]);

const LANDMARKS: readonly (readonly [string, number, number, number, number])[] = Object.freeze([
  [IGAPO_LANDMARK_DECORATION_IDS.drownedTree, 14, 10, 5, 0x9fbd94],
  [IGAPO_LANDMARK_DECORATION_IDS.oldArch, 38, 26, 4.5, 0x9bb7a0],
  [IGAPO_LANDMARK_DECORATION_IDS.palmIsland, 72, 5, 4.4, 0xa7c496],
  [IGAPO_LANDMARK_DECORATION_IDS.fallenTrunk, 31, 5, 2.5, 0xffffff],
  [IGAPO_LANDMARK_DECORATION_IDS.fallenTrunk, 52, 9, 2.5, 0xffffff],
  [IGAPO_LANDMARK_DECORATION_IDS.fallenTrunk, 64, 6, 3.2, 0xffffff],
  [IGAPO_LANDMARK_DECORATION_IDS.fallenTrunk, 86, 9, 2.5, 0xffffff],
  [IGAPO_LANDMARK_DECORATION_IDS.canoe, 18, 10, 1.3, 0xffffff],
]);

const POLLUTION_NODES: readonly (readonly [number, number])[] = Object.freeze([
  [52, 27], [60, 25], [77, 23], [87, 24],
]);

function noise(x: number, y: number, salt: string): number {
  const text = `${salt}|${x}|${y}`;
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 0xffffffff;
}

/** Decorrelation pass for scenery: the raw FNV hash produced visible columns. */
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
  return dx * dx + dy * dy <= 1 + (noise(x, y, 'edge') - 0.5) * 0.34;
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
    for (let index = 0; index + 1 < channel.length; index += 1) {
      const [fromX, fromY, radius] = channel[index];
      const [toX, toY] = channel[index + 1];
      const steps = Math.max(Math.abs(toX - fromX), Math.abs(toY - fromY));
      for (let step = 0; step <= steps; step += 1) {
        const ratio = steps === 0 ? 0 : step / steps;
        const centerX = fromX + (toX - fromX) * ratio;
        const centerY = fromY + (toY - fromY) * ratio;
        const nextRadius = radius + (channel[index + 1][2] - radius) * ratio;
        for (let offsetY = -2; offsetY <= 2; offsetY += 1) {
          for (let offsetX = -2; offsetX <= 2; offsetX += 1) {
            const x = Math.round(centerX + offsetX);
            const y = Math.round(centerY + offsetY);
            const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
            const edge = (noise(x, y, `channel-${channelIndex}`) - 0.5) * 0.55;
            if (x > 0 && y > 0 && x < IGAPO_MAP_WIDTH - 1 && y < IGAPO_MAP_HEIGHT - 1 &&
              distance <= nextRadius + edge) {
              map[y][x] = WATER;
            }
          }
        }
      }
    }
  });
  const stamp = (x: number, y: number): void => {
    for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
      for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
        const nextX = x + offsetX;
        const nextY = y + offsetY;
        if (nextX > 0 && nextY > 0 &&
          nextX < IGAPO_MAP_WIDTH - 1 && nextY < IGAPO_MAP_HEIGHT - 1) {
          map[nextY][nextX] = FLOOR;
        }
      }
    }
  };
  // Roots enrich the land masses, but the authored travel bands must be
  // stamped afterwards so a 42x58 player body keeps its full clearance.
  IGAPO_ROOTS.forEach(([x, y]) => { map[y][x] = ROOT; });
  IGAPO_CORRIDORS.forEach(points => {
    for (let index = 0; index + 1 < points.length; index += 1) {
      const [fromX, fromY] = points[index];
      const [toX, toY] = points[index + 1];
      const steps = Math.max(Math.abs(toX - fromX), Math.abs(toY - fromY));
      for (let step = 0; step <= steps; step += 1) {
        const ratio = steps === 0 ? 0 : step / steps;
        stamp(Math.round(fromX + (toX - fromX) * ratio), Math.round(fromY + (toY - fromY) * ratio));
      }
    }
  });
  map[17][4] = SPAWN;
  map[ECO_DAS_AGUAS_INTEREST.y][ECO_DAS_AGUAS_INTEREST.x] = CHEST;
  map[IGAPO_RETURN_ANCHOR.y][IGAPO_RETURN_ANCHOR.x] = EXIT;
  return map;
}

const ANCHOR_TILES: readonly (readonly [number, number])[] = Object.freeze([
  [4, 17], [28, 16], [91, 16], [10, 18], [59, 12], [83, 19],
  [49, 16], [58, 12], [69, 16], [82, 15], [88, 19], [56, 16],
]);

function nearAnchor(x: number, y: number, radius = 4): boolean {
  return ANCHOR_TILES.some(([anchorX, anchorY]) =>
    Math.abs(anchorX - x) <= radius && Math.abs(anchorY - y) <= radius);
}

function touchesWater(map: readonly (readonly number[])[], x: number, y: number): boolean {
  for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
      if (map[y + offsetY]?.[x + offsetX] === WATER) return true;
    }
  }
  return false;
}

function touchesLand(map: readonly (readonly number[])[], x: number, y: number): boolean {
  for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
      if (map[y + offsetY]?.[x + offsetX] === FLOOR) return true;
    }
  }
  return false;
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
    scale?: number,
    tint?: number,
    rotation?: number,
  ): void => {
    decorations.push({
      type, x, y,
      ...(scale !== undefined ? { scale } : {}),
      ...(tint !== undefined ? { tint } : {}),
      ...(rotation !== undefined ? { rotation } : {}),
    });
  };
  const addTree = (
    palette: readonly { readonly type: string; readonly tint: number; readonly scale: number }[],
    x: number,
    y: number,
  ): void => {
    const choice = palette[Math.floor(detailNoise(x, y, 'tree-kind') * palette.length)];
    if (detailNoise(x, y, 'shadow') < 0.42) {
      add('igapo_canopy_shadow', x, y, 3.2 + detailNoise(x, y, 'shadow-scale') * 1.2, 0x16352a,
        (detailNoise(x, y, 'shadow-angle') - 0.5) * 0.5);
    }
    add(choice.type, x, y, choice.scale * (0.9 + detailNoise(x, y, 'tree-scale') * 0.24), choice.tint,
      (detailNoise(x, y, 'tree-angle') - 0.5) * 0.16);
  };

  for (let y = 1; y < IGAPO_MAP_HEIGHT - 1; y += 1) {
    for (let x = 1; x < IGAPO_MAP_WIDTH - 1; x += 1) {
      if (nearAnchor(x, y)) continue;
      const tile = map[y][x];
      const roll = detailNoise(x, y, 'scenery');
      const density = clusterDensity(x, y);
      if (density < 0.12) continue;

      if (tile === WATER && touchesLand(map, x, y)) {
        if (roll < density * 0.07) {
          add('igapo_waterweed', x, y, 1.7 + detailNoise(x, y, 'waterweed') * 0.5, 0x526d54);
        } else if (roll < density * 0.2) {
          add('igapo_reeds', x, y, 1.8 + detailNoise(x, y, 'reed') * 0.7, 0x9fc4a2);
        } else if (roll < density * 0.29) {
          add('igapo_stone', x, y, 1.8 + detailNoise(x, y, 'stone') * 0.7, 0x8fa898);
        } else if (roll < density * 0.34) {
          addTree(WET_TREE_PALETTE, x, y);
        }
      } else if (tile === FLOOR) {
        const shoreline = touchesWater(map, x, y);
        if (shoreline && roll < density * 0.06) {
          add('igapo_waterweed', x, y, 1.8 + detailNoise(x, y, 'waterweed') * 0.6, 0x526d54);
        } else if (shoreline && roll < density * 0.19) {
          add('igapo_reeds', x, y, 2 + detailNoise(x, y, 'reed') * 0.8, 0xa8cba2);
        } else if (roll < density * (shoreline ? 0.31 : 0.12)) {
          add('igapo_shrub', x, y, 1.8 + detailNoise(x, y, 'shrub') * 0.6, 0xb0cfa0);
        } else if (shoreline && roll < density * 0.42) {
          add('igapo_stone', x, y, 1.8 + detailNoise(x, y, 'stone') * 0.9, 0x91a894);
        } else if (roll < density * (shoreline ? 0.49 : 0.2)) {
          addTree(TREE_PALETTE, x, y);
        } else if (!shoreline && roll < density * 0.25) {
          add('igapo_fruit_tree', x, y, 2.2 + detailNoise(x, y, 'fruit') * 0.5, 0xc8d9a8,
            (detailNoise(x, y, 'fruit-angle') - 0.5) * 0.2);
        } else if (shoreline && roll < density * 0.55) {
          add('igapo_mud', x, y, 1.4 + detailNoise(x, y, 'mud') * 0.8, 0x8b7c58,
            (detailNoise(x, y, 'mud-angle') - 0.5) * 0.4);
        }
      }
    }
  }

  PALM_GROVES.forEach(([centerX, centerY], groveIndex) => {
    [[-1, 0], [0, 0], [1, 1]].forEach(([offsetX, offsetY], palmIndex) => {
      const x = centerX + offsetX;
      const y = centerY + offsetY;
      if (nearAnchor(x, y)) return;
      const type = (groveIndex + palmIndex) % 2 === 0 ? 'igapo_palm' : 'igapo_coconut_palm';
      add(type, x, y, 3 + detailNoise(x, y, 'palm-scale') * 0.55, 0xa8c59a,
        (detailNoise(x, y, 'palm-angle') - 0.5) * 0.12);
    });
  });

  TREE_GROVES.forEach(grove => {
    grove.forEach(([x, y]) => {
      if (nearAnchor(x, y) || map[y]?.[x] !== FLOOR) return;
      addTree(TREE_PALETTE, x, y);
    });
  });

  LANDMARKS.forEach(([type, x, y, scale, tint]) => {
    add(type, x, y, scale, tint);
  });

  POLLUTION_NODES.forEach(([x, y]) => {
    if (map[y][x] !== WATER || nearAnchor(x, y)) return;
    add('igapo_waterweed', x, y, 3.1, 0x2a382a);
    add('igapo_pebble', x + 1, y, 1.5, 0xc4a36a);
  });

  const stoneGarden = [16, 24] as const;
  [[-1, 0], [0, -1], [0, 0], [1, 0], [0, 1]].forEach(([offsetX, offsetY]) => {
    add(
      IGAPO_LANDMARK_DECORATION_IDS.stoneGarden,
      stoneGarden[0] + offsetX,
      stoneGarden[1] + offsetY,
      1.2 + detailNoise(offsetX, offsetY, 'stone-garden') * 0.4,
      0x8fa898,
    );
  });

  for (let x = 4; x < IGAPO_MAP_WIDTH - 4; x += 8) {
    if (detailNoise(x, 2, 'canopy') < 0.62) {
      add('igapo_canopy_high', x, 2, 4.2 + detailNoise(x, 2, 'canopy-scale') * 0.8, 0x83ad8f);
    }
    if (detailNoise(x, IGAPO_MAP_HEIGHT - 3, 'canopy') < 0.62) {
      add('igapo_canopy_high', x, IGAPO_MAP_HEIGHT - 3,
        4.2 + detailNoise(x, 5, 'canopy-scale') * 0.8, 0x7fa78b);
    }
  }
  return decorations;
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
