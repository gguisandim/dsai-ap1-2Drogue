import type { DecorationPlacement, StageModule } from '../../contracts';
import {
  CORACAO_CORROMPIDO_STAGE_ID,
  IGAPO_DAS_MEMORIAS_CHAPTER_ID,
} from './igapoDasMemorias';
import {
  AGUAS_SOMBRIO_PRESENTATION,
  IGAPO_SOMBRIO_THEME_ID,
} from './igapoVisuals';

export { CORACAO_CORROMPIDO_STAGE_ID } from './igapoDasMemorias';

export const CORACAO_CORROMPIDO_MAP_WIDTH = 88;
export const CORACAO_CORROMPIDO_MAP_HEIGHT = 30;
export const CORACAO_CORROMPIDO_ENCOUNTER_ID =
  'encounter.stage.aguas.coracao-corrompido';
export const CORACAO_CORROMPIDO_MISSION_ID =
  'mission.aguas.coracao-corrompido.break-the-source';
export const CORACAO_CORROMPIDO_ENTRY_DIALOGUE_ID =
  'dialogue.aguas.coracao-corrompido.entry';
export const CORACAO_CORROMPIDO_CONCLUSION_DIALOGUE_ID =
  'dialogue.aguas.coracao-corrompido.conclusion';
export const CORACAO_CORROMPIDO_EXIT_ID =
  'exit.aguas.coracao-corrompido.conclude';
export const CORACAO_CORROMPIDO_RETURN_EXIT_ID =
  'exit.aguas.coracao-corrompido.a-return-waters';
export const CORACAO_CORROMPIDO_CLEANSED_FLAG =
  'flag.aguas.coracao-corrompido.cleansed';
export const CORACAO_CORROMPIDO_EXIT_ANCHOR = Object.freeze({ x: 84, y: 16 });
export const CORACAO_CORROMPIDO_RETURN_ANCHOR = Object.freeze({ x: 84, y: 20 });
export const CORACAO_CORROMPIDO_SOURCE = Object.freeze({ x: 76, y: 16 });

const FLOOR = 0;
const WALL = 1;
const ROOT = 2;
const WATER = 3;
const EXIT = 5;
const CHEST = 7;
const SPAWN = 8;
const BOSS = 9;

/**
 * The corrupted phase keeps the same top-down vocabulary but its own
 * silhouette: a broken western bank, two uneven causeways, a contaminated
 * basin and an asymmetric eastern clearing.
 */
const CORRUPTED_MASSES: readonly (readonly [number, number, number, number])[] = Object.freeze([
  [10, 16, 8, 4.5], [20, 14, 5, 3], [27, 9, 8, 2.8],
  [31, 23, 9, 2.8], [45, 16, 8, 6], [60, 11, 7, 3],
  [63, 23, 7, 3], [77, 16, 8, 5.5], [69, 15, 4, 3],
  [68, 7, 5, 2], [52, 24, 5, 2],
]);

const CORRUPTED_CORRIDORS: readonly (readonly (readonly [number, number])[])[] = Object.freeze([
  [[4, 16], [20, 15], [30, 15], [45, 16], [60, 16], [70, 16], [84, 16]],
  [[30, 15], [30, 9], [38, 8], [48, 9], [52, 13]],
  [[31, 17], [32, 22], [40, 23], [48, 21], [52, 18]],
  [[70, 16], [76, 12], [82, 11], [84, 15]],
  [[70, 17], [76, 20], [82, 20], [84, 20]],
]);

const CORRUPTED_ROOTS: readonly (readonly [number, number])[] = Object.freeze([
  [45, 16], [74, 21], [29, 8], [66, 17], [58, 13], [50, 9], [5, 18], [34, 23],
  [18, 15], [55, 24], [47, 20], [39, 16], [31, 12], [68, 21], [23, 8], [60, 17],
  [52, 13], [44, 9], [81, 18], [73, 14], [28, 23], [65, 10], [12, 15], [49, 24],
  [41, 20], [33, 16], [62, 21], [54, 17], [46, 13], [38, 9], [75, 18], [67, 14],
  [59, 10], [14, 19], [6, 15], [43, 24], [80, 11], [72, 7], [27, 16], [64, 25],
  [19, 12], [48, 17], [40, 13], [32, 9], [69, 18], [53, 10], [8, 19], [82, 15],
  [37, 24], [66, 7], [21, 16], [13, 12], [50, 21], [42, 17], [26, 9],
]);

const DRY_TREE_PALETTE = Object.freeze([
  Object.freeze({ type: 'igapo_sombrio_dead_tree', tint: 0x6d877a, scale: 4.1 }),
  Object.freeze({ type: 'igapo_sombrio_dead_tree_variant', tint: 0x627b72, scale: 3.7 }),
  Object.freeze({ type: 'igapo_sombrio_round_tree', tint: 0x748c80, scale: 3.9 }),
  Object.freeze({ type: 'igapo_sombrio_broad_tree', tint: 0x768e7e, scale: 3.6 }),
  Object.freeze({ type: 'igapo_sombrio_palm', tint: 0x6a8475, scale: 3.3 }),
  Object.freeze({ type: 'igapo_sombrio_coconut_palm', tint: 0x657e71, scale: 3.1 }),
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
  return dx * dx + dy * dy <= 1 + (noise(x, y, 'corrupted-edge') - 0.5) * 0.4;
}

function createCorruptedHeartMap(): number[][] {
  const map: number[][] = Array.from({ length: CORACAO_CORROMPIDO_MAP_HEIGHT }, (_, y) =>
    Array.from({ length: CORACAO_CORROMPIDO_MAP_WIDTH }, (_, x) =>
      x === 0 || y === 0 || x === CORACAO_CORROMPIDO_MAP_WIDTH - 1 ||
        y === CORACAO_CORROMPIDO_MAP_HEIGHT - 1 ? WALL : WATER));
  for (let y = 1; y < CORACAO_CORROMPIDO_MAP_HEIGHT - 1; y += 1) {
    for (let x = 1; x < CORACAO_CORROMPIDO_MAP_WIDTH - 1; x += 1) {
      if (CORRUPTED_MASSES.some(([cx, cy, rx, ry]) => insideMass(cx, cy, rx, ry, x, y))) {
        map[y][x] = FLOOR;
      }
    }
  }
  const stamp = (x: number, y: number): void => {
    for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
      for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
        const nextX = x + offsetX;
        const nextY = y + offsetY;
        if (nextX > 0 && nextY > 0 &&
          nextX < CORACAO_CORROMPIDO_MAP_WIDTH - 1 && nextY < CORACAO_CORROMPIDO_MAP_HEIGHT - 1) {
          map[nextY][nextX] = FLOOR;
        }
      }
    }
  };
  // Preserve root obstacles on the islands while guaranteeing that the
  // authored causeways remain wide enough for the production player body.
  CORRUPTED_ROOTS.forEach(([x, y]) => { map[y][x] = ROOT; });
  CORRUPTED_CORRIDORS.forEach(points => {
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
  map[16][4] = SPAWN;
  map[9][61] = CHEST;
  map[CORACAO_CORROMPIDO_SOURCE.y][CORACAO_CORROMPIDO_SOURCE.x] = BOSS;
  map[CORACAO_CORROMPIDO_EXIT_ANCHOR.y][CORACAO_CORROMPIDO_EXIT_ANCHOR.x] = EXIT;
  map[CORACAO_CORROMPIDO_RETURN_ANCHOR.y][CORACAO_CORROMPIDO_RETURN_ANCHOR.x] = EXIT;
  return map;
}

const ANCHOR_TILES: readonly (readonly [number, number])[] = Object.freeze([
  [4, 16], [61, 9], [76, 16], [84, 16], [84, 20],
  [42, 14], [55, 12], [74, 14], [78, 19], [82, 11], [74, 14], [80, 14],
]);

function nearAnchor(x: number, y: number, radius = 2): boolean {
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

function createCorruptedDecorations(map: readonly (readonly number[])[]): DecorationPlacement[] {
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
  const addTree = (x: number, y: number): void => {
    const choice = DRY_TREE_PALETTE[Math.floor(detailNoise(x, y, 'dry-kind') * DRY_TREE_PALETTE.length)];
    if (detailNoise(x, y, 'dry-shadow') < 0.65) {
      add('igapo_sombrio_canopy_shadow', x, y, 3 + detailNoise(x, y, 'dry-shadow-scale') * 1.2,
        0x071614, (detailNoise(x, y, 'dry-shadow-angle') - 0.5) * 0.5);
    }
    add(choice.type, x, y, choice.scale * (0.9 + detailNoise(x, y, 'dry-scale') * 0.26), choice.tint,
      (detailNoise(x, y, 'dry-angle') - 0.5) * 0.18);
  };

  for (let y = 1; y < CORACAO_CORROMPIDO_MAP_HEIGHT - 1; y += 1) {
    for (let x = 1; x < CORACAO_CORROMPIDO_MAP_WIDTH - 1; x += 1) {
      if (nearAnchor(x, y)) continue;
      const tile = map[y][x];
      const roll = detailNoise(x, y, 'corrupted-scenery');
      if (tile === WATER) {
        if (roll < 0.075) add('igapo_sombrio_algae', x, y, 2 + detailNoise(x, y, 'algae') * 1.1, 0x4f6f64,
          (detailNoise(x, y, 'algae-angle') - 0.5) * 0.8);
        else if (roll < 0.115) add('igapo_sombrio_reeds', x, y, 1.8 + detailNoise(x, y, 'reed') * 0.6, 0x6d8b7d);
        else if (roll < 0.14) add('igapo_sombrio_stone', x, y, 1.9 + detailNoise(x, y, 'stone') * 0.7, 0x5f756b);
        else if (roll < 0.17) addTree(x, y);
      } else if (tile === FLOOR) {
        if (touchesWater(map, x, y)) {
          if (roll < 0.1) add('igapo_sombrio_reeds', x, y, 2 + detailNoise(x, y, 'reed') * 0.8, 0x769183);
          else if (roll < 0.17) add('igapo_sombrio_shrub', x, y, 1.8 + detailNoise(x, y, 'shrub') * 0.6, 0x7b9486);
          else if (roll < 0.23) add('igapo_sombrio_stone', x, y, 1.9 + detailNoise(x, y, 'stone') * 0.8, 0x647b70);
          else if (roll < 0.26) add('igapo_sombrio_pebble', x, y, 1 + detailNoise(x, y, 'pebble') * 0.5, 0x6a7b70);
          else if (roll < 0.35) addTree(x, y);
          else if (roll < 0.38) add('igapo_sombrio_mud', x, y, 1.4 + detailNoise(x, y, 'mud') * 0.7, 0x5f5a4c,
            (detailNoise(x, y, 'mud-angle') - 0.5) * 0.5);
        } else if (roll < 0.09) addTree(x, y);
        else if (roll < 0.115) add('igapo_sombrio_shrub', x, y, 1.8 + detailNoise(x, y, 'shrub') * 0.5, 0x789184);
        else if (roll < 0.14) add('igapo_sombrio_mud', x, y, 1.4 + detailNoise(x, y, 'mud') * 0.8, 0x5b5648,
          (detailNoise(x, y, 'mud-angle') - 0.5) * 0.5);
      }
    }
  }

  for (let x = 2; x < CORACAO_CORROMPIDO_MAP_WIDTH - 2; x += 1) {
    if (detailNoise(x, 2, 'broken-canopy') < 0.05) {
      add('igapo_sombrio_canopy_high', x, 2, 4.2 + detailNoise(x, 2, 'broken-scale') * 1.1, 0x63796f);
    }
    if (detailNoise(x, CORACAO_CORROMPIDO_MAP_HEIGHT - 3, 'broken-canopy') < 0.05) {
      add('igapo_sombrio_canopy_high', x, CORACAO_CORROMPIDO_MAP_HEIGHT - 3,
        4.2 + detailNoise(x, 5, 'broken-scale') * 1.1, 0x5f756b);
    }
  }
  return decorations;
}

const CORRUPTED_LEVEL_MAP = createCorruptedHeartMap();
const CORRUPTED_LEVEL_DECORATIONS = createCorruptedDecorations(CORRUPTED_LEVEL_MAP);

export const CORACAO_CORROMPIDO_STAGE: StageModule = Object.freeze({
  manifest: Object.freeze({
    schemaVersion: 1 as const,
    id: CORACAO_CORROMPIDO_STAGE_ID,
    revision: 1,
    chapterId: IGAPO_DAS_MEMORIAS_CHAPTER_ID,
    order: 1,
    title: 'Coração Corrompido',
    summary: 'A corrente escurecida converge em uma clareira onde a corrupção cria raízes.',
    layout: Object.freeze({ kind: 'authored' as const }),
    presentation: AGUAS_SOMBRIO_PRESENTATION,
    campaignCatalog: Object.freeze({
      availability: 'available' as const,
      participation: 'narrative-milestone' as const,
      role: 'milestone' as const,
      regionIds: Object.freeze(['region.aguas.igapo']),
      biomeIds: Object.freeze(['crypt']),
      difficulty: Object.freeze({ minimum: 2, maximum: 4 }),
      allowedActIds: Object.freeze(['act-1']),
      maximumPhysicalExits: 2 as const,
      revisit: 'checkpoint' as const,
      requiredEventIds: Object.freeze(['event.aguas.igapo.corruption-discovered']),
      requiredBeatIds: Object.freeze(['beat.region.aguas.igapo']),
      providesBeatIds: Object.freeze(['beat.region.aguas.corrupted-heart']),
    }),
    exits: Object.freeze([
      Object.freeze({
        id: CORACAO_CORROMPIDO_EXIT_ID,
        anchor: Object.freeze({ kind: 'tile' as const, ...CORACAO_CORROMPIDO_EXIT_ANCHOR }),
        targetStageId: 'verse_01_atrium',
        condition: Object.freeze({
          type: 'flag.equals' as const,
          flag: CORACAO_CORROMPIDO_CLEANSED_FLAG,
          value: true,
        }),
      }),
      Object.freeze({
        id: CORACAO_CORROMPIDO_RETURN_EXIT_ID,
        anchor: Object.freeze({ kind: 'tile' as const, ...CORACAO_CORROMPIDO_RETURN_ANCHOR }),
        targetStageId: 'stage.aguas.igapo-das-memorias',
        condition: Object.freeze({
          type: 'flag.equals' as const,
          flag: CORACAO_CORROMPIDO_CLEANSED_FLAG,
          value: true,
        }),
      }),
    ]),
    entryDialogueId: CORACAO_CORROMPIDO_ENTRY_DIALOGUE_ID,
    completionMissionId: CORACAO_CORROMPIDO_MISSION_ID,
    capabilities: Object.freeze([
      Object.freeze({
        id: 'navigation.authored-map', category: 'navigation' as const,
        minimumVersion: 1, requirement: 'required' as const,
      }),
      Object.freeze({
        id: 'encounter.declarative', category: 'encounter' as const,
        minimumVersion: 1, requirement: 'required' as const,
      }),
      Object.freeze({
        id: IGAPO_SOMBRIO_THEME_ID, category: 'theme' as const,
        minimumVersion: 1, requirement: 'required' as const,
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
    tags: Object.freeze(['amazon', 'aguas', 'corrupted', 'authored', 'narrative']),
  }),
  authoredLevel: Object.freeze({
    id: CORACAO_CORROMPIDO_STAGE_ID,
    name: 'Coração Corrompido',
    description: 'Água contaminada e vegetação quebrada cercam a origem da degradação.',
    theme: 'witches_crypt' as const,
    music: 'ost_vestibule',
    ambientColor: 0x102f34,
    fogColor: 0x07191d,
    fogDensity: 0.56,
    lightIntensity: 0.42,
    tileMap: CORRUPTED_LEVEL_MAP,
    enemies: [],
    items: [
      { type: 'health_herb', x: 13, y: 15, quantity: 1 },
      { type: 'mana_shard', x: 61, y: 9, quantity: 1 },
      { type: 'key', x: 80, y: 19, quantity: 1 },
    ],
    decorations: CORRUPTED_LEVEL_DECORATIONS,
    parTime: 390,
    difficulty: 4,
  }),
  encounter: Object.freeze({
    schemaVersion: 1 as const,
    id: CORACAO_CORROMPIDO_ENCOUNTER_ID,
    start: 'stage-ready' as const,
    completion: 'all-waves-defeated' as const,
    scaling: 'stage-difficulty-floor' as const,
    source: Object.freeze({
      kind: 'authored-waves' as const,
      waves: Object.freeze([
        Object.freeze({
          id: 'wave.corrupted-approach',
          delayBeforeMs: 0,
          enemies: Object.freeze([
            Object.freeze({ type: 'affinity' as const, x: 42, y: 14, level: 4 }),
            Object.freeze({ type: 'applaud' as const, x: 55, y: 12, level: 4 }),
          ]),
        }),
        Object.freeze({
          id: 'wave.corrupted-heart',
          delayBeforeMs: 1200,
          enemies: Object.freeze([
            Object.freeze({
              type: 'affinity' as const, x: 74, y: 14, level: 5,
              patrol: Object.freeze([{ x: 74, y: 14 }, { x: 80, y: 14 }]),
            }),
            Object.freeze({ type: 'affinity' as const, x: 78, y: 19, level: 5 }),
            Object.freeze({ type: 'applaud' as const, x: 82, y: 11, level: 5 }),
          ]),
        }),
      ]),
    }),
  }),
  narrative: Object.freeze({
    flags: Object.freeze({ [CORACAO_CORROMPIDO_CLEANSED_FLAG]: false }),
  }),
  dialogues: Object.freeze([
    Object.freeze({
      id: CORACAO_CORROMPIDO_ENTRY_DIALOGUE_ID,
      startNodeId: 'water-stops',
      nodes: Object.freeze([Object.freeze({
        id: 'water-stops',
        speakerId: 'narrator' as const,
        text: 'A corrente quase não se move. Raízes partidas apontam para uma pulsação sob a água.',
        nextNodeId: 'face-the-source',
      }), Object.freeze({
        id: 'face-the-source',
        speakerId: 'player' as const,
        text: 'A origem está adiante. Se ela cair, o Igapó poderá lembrar outra vez.',
      })]),
    }),
    Object.freeze({
      id: CORACAO_CORROMPIDO_CONCLUSION_DIALOGUE_ID,
      startNodeId: 'current-returns',
      nodes: Object.freeze([Object.freeze({
        id: 'current-returns',
        speakerId: 'narrator' as const,
        text: 'A pulsação cessa. Sob a película escura, a corrente volta a refletir o céu.',
      })]),
    }),
  ]),
  missions: Object.freeze([Object.freeze({
    id: CORACAO_CORROMPIDO_MISSION_ID,
    title: 'Silenciar o coração',
    description: 'Atravesse a água contaminada e conclua o confronto na nascente corrompida.',
    scope: 'stage' as const,
    start: 'stage-enter' as const,
    objectives: Object.freeze([Object.freeze({
      id: 'objective.aguas.coracao-corrompido.clear-encounter',
      description: 'Supere o confronto no coração da região.',
      signal: 'encounter.completed' as const,
      target: 1,
      filter: Object.freeze({
        field: 'encounterId' as const,
        equals: CORACAO_CORROMPIDO_ENCOUNTER_ID,
      }),
    })]),
    rewards: Object.freeze([Object.freeze({
      type: 'stage.flag' as const,
      flag: CORACAO_CORROMPIDO_CLEANSED_FLAG,
      value: true,
    })]),
  })]),
  events: Object.freeze([
    Object.freeze({
      id: 'event.aguas.coracao-corrompido.entered',
      once: true,
      when: 'stage.entered' as const,
      filter: Object.freeze({ field: 'stageId' as const, equals: CORACAO_CORROMPIDO_STAGE_ID }),
      commands: Object.freeze([
        Object.freeze({
          type: 'mission.start' as const,
          missionId: CORACAO_CORROMPIDO_MISSION_ID,
        }),
        Object.freeze({
          type: 'dialogue.start' as const,
          dialogueId: CORACAO_CORROMPIDO_ENTRY_DIALOGUE_ID,
        }),
      ]),
    }),
    Object.freeze({
      id: 'event.aguas.coracao-corrompido.cleansed',
      once: true,
      when: 'mission.completed' as const,
      filter: Object.freeze({
        field: 'missionId' as const,
        equals: CORACAO_CORROMPIDO_MISSION_ID,
      }),
      commands: Object.freeze([
        Object.freeze({
          type: 'dialogue.start' as const,
          dialogueId: CORACAO_CORROMPIDO_CONCLUSION_DIALOGUE_ID,
        }),
        Object.freeze({
          type: 'exit.unlock' as const,
          exitId: CORACAO_CORROMPIDO_RETURN_EXIT_ID,
        }),
        Object.freeze({ type: 'stage.complete' as const, exitId: CORACAO_CORROMPIDO_EXIT_ID }),
      ]),
    }),
  ]),
});
