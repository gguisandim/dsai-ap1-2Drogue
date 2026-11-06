import type { DecorationPlacement, StageModule } from '../../contracts';
import { WORLD_ROOT_PRESENTATION } from './visuals';

export const WORLD_ROOT_CHAPTER_ID = 'chapter.raiz-do-mundo';
export const WORLD_ROOT_STAGE_ID = 'stage.raiz-do-mundo.santuario';
export const WORLD_ROOT_EXIT_ID = 'exit.raiz-do-mundo.to-igapo';
export const WORLD_ROOT_NPC_ID = 'npc.raiz-do-mundo.keeper';
export const WORLD_ROOT_DIALOGUE_ID = 'dialogue.raiz-do-mundo.keeper';
export const WORLD_ROOT_ENTRY_DIALOGUE_ID = 'dialogue.raiz-do-mundo.entry';
export const WORLD_ROOT_MISSION_ID = 'mission.raiz-do-mundo.ouvir-raizes';
export const WORLD_ROOT_INTERACTION_EVENT_ID = 'event.raiz-do-mundo.keeper-interacted';
export const WORLD_ROOT_PASSAGE_FLAG = 'flag.raiz-do-mundo.passagem-das-aguas-aberta';
export const WORLD_ROOT_INTRO_FLAG = 'flag.raiz-do-mundo.entrada-observada';

export const WORLD_ROOT_MAP_WIDTH = 116;
export const WORLD_ROOT_MAP_HEIGHT = 36;
export const WORLD_ROOT_SPAWN = Object.freeze({ x: 5, y: 18 });
export const WORLD_ROOT_NPC_ANCHOR = Object.freeze({ x: 54, y: 22 });
export const WORLD_ROOT_ALTAR = Object.freeze({ x: 80, y: 18 });
export const WORLD_ROOT_SANCTUARY = Object.freeze({ x: 80, y: 9 });
export const WORLD_ROOT_EXIT = Object.freeze({ x: 111, y: 18 });
export const WORLD_ROOT_MONOLITHS = Object.freeze([
  Object.freeze({ x: 73, y: 12 }), Object.freeze({ x: 87, y: 12 }),
  Object.freeze({ x: 74, y: 24 }), Object.freeze({ x: 86, y: 24 }),
]);
export const WORLD_ROOT_RUINS = Object.freeze([
  Object.freeze({ x: 27, y: 10 }), Object.freeze({ x: 33, y: 26 }),
  Object.freeze({ x: 61, y: 9 }), Object.freeze({ x: 99, y: 10 }),
]);

const FLOOR = 0;
const WALL = 1;
const PILLAR = 2;
const WATER = 3;
const EXIT = 5;
const CHEST = 7;
const SPAWN = 8;

const MAIN_TRAIL: readonly (readonly [number, number])[] = Object.freeze([
  [5, 18], [14, 17], [23, 19], [31, 16], [40, 18], [48, 17],
  [57, 20], [66, 18], [75, 19], [84, 17], [94, 20], [103, 17], [111, 18],
]);

const BRANCH_TRAILS = [
  [[22, 19], [24, 14], [27, 10], [31, 13], [34, 17]],
  [[31, 16], [31, 21], [33, 26], [39, 23], [43, 19]],
  [[47, 17], [49, 22], [54, 22], [58, 20]],
  [[92, 20], [96, 14], [99, 10], [104, 14], [106, 17]],
] as const;

const CLEARINGS: readonly (readonly [number, number, number, number])[] = Object.freeze([
  [7, 18, 7, 6], [28, 17, 10, 7], [42, 18, 8, 6], [54, 21, 9, 6],
  [66, 18, 8, 6], [80, 18, 15, 11], [101, 17, 10, 7], [110, 18, 5, 5],
  [27, 10, 6, 4], [33, 26, 7, 4], [99, 10, 7, 4],
]);

const WATERWAYS = [
  [[1, 6, 1.5], [11, 8, 1.2], [21, 5, 1.7], [33, 8, 1.3], [45, 6, 1.8], [58, 9, 1.4], [67, 7, 1.2]],
  [[1, 29, 1.4], [12, 26, 1.6], [23, 30, 1.2], [36, 27, 1.7], [49, 31, 1.3], [62, 28, 1.5], [72, 30, 1.2]],
  [[84, 30, 1.2], [94, 27, 1.6], [104, 31, 1.3], [114, 28, 1.6]],
] as const;

function noise(x: number, y: number, salt: string): number {
  const text = `${salt}|${x}|${y}`;
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x7feb352d);
  hash ^= hash >>> 15;
  return (hash >>> 0) / 0xffffffff;
}

function paintLine(
  map: number[][],
  points: readonly (readonly [number, number])[],
  radius: number,
  value: number,
): void {
  const stamp = (centerX: number, centerY: number): void => {
    for (let offsetY = -radius; offsetY <= radius; offsetY += 1) {
      for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
        const x = centerX + offsetX;
        const y = centerY + offsetY;
        if (x <= 0 || y <= 0 || x >= WORLD_ROOT_MAP_WIDTH - 1 || y >= WORLD_ROOT_MAP_HEIGHT - 1) continue;
        const wobble = (noise(x, y, `line-${value}`) - 0.5) * 0.8;
        if (Math.hypot(offsetX, offsetY) <= radius + wobble) map[y][x] = value;
      }
    }
  };
  for (let index = 0; index + 1 < points.length; index += 1) {
    const [fromX, fromY] = points[index];
    const [toX, toY] = points[index + 1];
    const steps = Math.max(Math.abs(toX - fromX), Math.abs(toY - fromY));
    for (let step = 0; step <= steps; step += 1) {
      const ratio = steps === 0 ? 0 : step / steps;
      stamp(Math.round(fromX + (toX - fromX) * ratio), Math.round(fromY + (toY - fromY) * ratio));
    }
  }
}

function paintWaterway(
  map: number[][],
  points: readonly (readonly [number, number, number])[],
  salt: string,
): void {
  for (let index = 0; index + 1 < points.length; index += 1) {
    const [fromX, fromY, fromRadius] = points[index];
    const [toX, toY, toRadius] = points[index + 1];
    const steps = Math.max(Math.abs(toX - fromX), Math.abs(toY - fromY));
    for (let step = 0; step <= steps; step += 1) {
      const ratio = steps === 0 ? 0 : step / steps;
      const centerX = fromX + (toX - fromX) * ratio;
      const centerY = fromY + (toY - fromY) * ratio;
      const radius = fromRadius + (toRadius - fromRadius) * ratio;
      for (let offsetY = -4; offsetY <= 4; offsetY += 1) {
        for (let offsetX = -4; offsetX <= 4; offsetX += 1) {
          const x = Math.round(centerX + offsetX);
          const y = Math.round(centerY + offsetY);
          const edge = (noise(x, y, salt) - 0.5) * 1.2;
          if (x > 0 && y > 0 && x < WORLD_ROOT_MAP_WIDTH - 1 && y < WORLD_ROOT_MAP_HEIGHT - 1 &&
            Math.hypot(offsetX, offsetY) <= radius + edge) map[y][x] = WATER;
        }
      }
    }
  }
}

export function createWorldRootMap(): number[][] {
  const map: number[][] = Array.from({ length: WORLD_ROOT_MAP_HEIGHT }, () =>
    Array.from({ length: WORLD_ROOT_MAP_WIDTH }, () => WALL));

  for (const [centerX, centerY, radiusX, radiusY] of CLEARINGS) {
    for (let y = Math.max(1, centerY - radiusY - 1); y <= Math.min(WORLD_ROOT_MAP_HEIGHT - 2, centerY + radiusY + 1); y += 1) {
      for (let x = Math.max(1, centerX - radiusX - 1); x <= Math.min(WORLD_ROOT_MAP_WIDTH - 2, centerX + radiusX + 1); x += 1) {
        const dx = (x - centerX) / radiusX;
        const dy = (y - centerY) / radiusY;
        if (dx * dx + dy * dy <= 1 + (noise(x, y, 'clearing') - 0.5) * 0.2) map[y][x] = FLOOR;
      }
    }
  }

  WATERWAYS.forEach((waterway, index) => paintWaterway(map, waterway, `water-${index}`));
  paintLine(map, MAIN_TRAIL, 3, FLOOR);
  BRANCH_TRAILS.forEach(points => paintLine(map, points, 2, FLOOR));

  WORLD_ROOT_MONOLITHS.forEach(({ x, y }) => { map[y][x] = PILLAR; });
  WORLD_ROOT_RUINS.forEach(({ x, y }) => { map[y][x] = PILLAR; });
  map[WORLD_ROOT_ALTAR.y][WORLD_ROOT_ALTAR.x] = CHEST;
  map[WORLD_ROOT_SPAWN.y][WORLD_ROOT_SPAWN.x] = SPAWN;
  map[WORLD_ROOT_EXIT.y][WORLD_ROOT_EXIT.x] = EXIT;
  return map;
}

export function createWorldRootDecorations(
  map: readonly (readonly number[])[] = createWorldRootMap(),
): DecorationPlacement[] {
  void map;
  return [
    // Continuous scene-scale ground compositions cover the whole walkable
    // corridor. Each placement overlaps its neighbour so no authored rectangle
    // edge or logical tile seam remains visible along the route.
    { type: 'raiz_do_mundo_entrance_composition', x: 9, y: 18, scale: 0.64, depth: -1.28 },
    { type: 'raiz_do_mundo_trail_composition', x: 31, y: 18, scale: 0.63, flipX: true, depth: -1.26 },
    { type: 'raiz_do_mundo_trail_composition', x: 54, y: 19, scale: 0.64, rotation: 0.012, depth: -1.27 },
    // The approach funnel and the monumental sanctuary stay as the visual apex.
    { type: 'raiz_do_mundo_sanctuary_approach', x: 79, y: 18, scale: 0.64, depth: 0.7 },
    { type: 'raiz_do_mundo_sanctuary', ...WORLD_ROOT_SANCTUARY, scale: 0.56, depth: 4 },
    // The exit composition already contains the root tunnel that leads to
    // Igapó; its right edge is aligned with the logical exit at tile 111.
    { type: 'raiz_do_mundo_passage_composition', x: 98, y: 18, scale: 0.64, depth: -1.24 },
    // Authored water follows the three logical channels but never participates
    // in physics; the logical tile map remains the collision source.
    ...createStreamPlacements(),
    // Large groves replace repeated tile walls. Upper groves sit behind actors
    // and lower groves frame the corridor; foreground groves add depth.
    ...createGrovePlacements(),
  ];
}

/**
 * The stream asset is a horizontal band. Placements tile it end to end along
 * each logical waterway, alternating the mirror so the same ripple pattern is
 * never read twice in sequence.
 */
function createStreamPlacements(): DecorationPlacement[] {
  const top = [7, 19, 31, 43, 55, 65];
  const bottomLeft = [7, 19, 31, 43, 55, 67];
  const bottomRight = [86, 98, 110];
  const placements: DecorationPlacement[] = [];
  top.forEach((x, index) => {
    placements.push({
      type: 'raiz_do_mundo_stream', x, y: 7,
      scale: 0.33 + (index % 3) * 0.01, rotation: index % 2 === 0 ? -0.02 : 0.018,
      flipX: index % 2 === 1, depth: 2.3,
    });
  });
  bottomLeft.forEach((x, index) => {
    placements.push({
      type: 'raiz_do_mundo_stream', x, y: 29,
      scale: 0.34 + (index % 2) * 0.01, rotation: index % 2 === 0 ? 0.02 : -0.018,
      flipX: index % 2 === 0, depth: 2.31,
    });
  });
  bottomRight.forEach((x, index) => {
    placements.push({
      type: 'raiz_do_mundo_stream', x, y: 30,
      scale: 0.35 + (index % 2) * 0.01, rotation: index % 2 === 0 ? -0.015 : 0.02,
      flipX: index % 2 === 1, depth: 2.32,
    });
  });
  return placements;
}

/**
 * Groves form two continuous vegetation masses around the corridor. The upper
 * mass hides the logical wall band; the lower one frames the route. Foreground
 * groves add a third depth plane without ever entering collision.
 */
function createGrovePlacements(): DecorationPlacement[] {
  const upper = [3, 17, 31, 45, 59, 73, 87, 101, 113];
  const lower = [3, 17, 31, 45, 59, 73, 87, 101, 113];
  // A second, offset row closes the organic gaps of the grove cutouts so the
  // logical floor never reads through the canopy line.
  const upperOffset = [10, 24, 38, 52, 66, 80, 94, 108];
  const lowerOffset = [10, 24, 38, 52, 66, 80, 94, 108];
  const foreground = [12, 45, 78, 110];
  const placements: DecorationPlacement[] = [];
  upper.forEach((x, index) => {
    // Bottom-anchored: the mass grows upward from the corridor's top edge and
    // covers the repeated logical wall band without crossing the trail.
    placements.push({
      type: 'raiz_do_mundo_grove', x, y: 11, originY: 1,
      scale: 0.42 + (index % 3) * 0.02, rotation: index % 2 === 0 ? -0.018 : 0.022,
      flipX: index % 2 === 1, depth: 2.15 + index * 0.005, layer: 'background',
    });
  });
  upperOffset.forEach((x, index) => {
    placements.push({
      type: 'raiz_do_mundo_grove', x, y: 11, originY: 1,
      scale: 0.34 + (index % 2) * 0.02, rotation: index % 2 === 0 ? 0.024 : -0.02,
      flipX: index % 2 === 0, depth: 2.12 + index * 0.004, layer: 'background',
    });
  });
  lower.forEach((x, index) => {
    // Top-anchored: the mass grows downward from the corridor's bottom edge.
    placements.push({
      type: 'raiz_do_mundo_grove', x, y: 25, originY: 0,
      scale: 0.42 + (index % 2) * 0.02, rotation: index % 2 === 0 ? 0.02 : -0.016,
      flipX: index % 2 === 0, depth: 2.2 + index * 0.005,
    });
  });
  lowerOffset.forEach((x, index) => {
    placements.push({
      type: 'raiz_do_mundo_grove', x, y: 23, originY: 0,
      scale: 0.32 + (index % 2) * 0.02, rotation: index % 2 === 0 ? -0.022 : 0.018,
      flipX: index % 2 === 1, depth: 2.18 + index * 0.004,
    });
  });
  foreground.forEach((x, index) => {
    placements.push({
      type: 'raiz_do_mundo_grove', x, y: 30, originY: 0,
      scale: 0.46 - (index % 2) * 0.02, rotation: index % 2 === 0 ? -0.02 : 0.018,
      flipX: index % 2 === 1, depth: 7.1 + index * 0.02, layer: 'foreground',
    });
  });
  return placements;
}

const WORLD_ROOT_LEVEL_MAP = createWorldRootMap();
const WORLD_ROOT_DECORATIONS = createWorldRootDecorations(WORLD_ROOT_LEVEL_MAP);

export const WORLD_ROOT_STAGE: StageModule = Object.freeze({
  manifest: Object.freeze({
    schemaVersion: 1 as const,
    id: WORLD_ROOT_STAGE_ID,
    revision: 2,
    chapterId: WORLD_ROOT_CHAPTER_ID,
    order: 0,
    title: 'Floresta das Raízes',
    summary: 'Uma travessia pela floresta ancestral conduz o viajante da primeira trilha à árvore que guarda a memória das águas.',
    layout: Object.freeze({ kind: 'authored' as const }),
    presentation: WORLD_ROOT_PRESENTATION,
    campaignCatalog: Object.freeze({
      availability: 'available' as const,
      participation: 'narrative-milestone' as const,
      role: 'milestone' as const,
      regionIds: Object.freeze(['hub.floresta-das-raizes']),
      biomeIds: Object.freeze(['garden']),
      difficulty: Object.freeze({ minimum: 1, maximum: 2 }),
      allowedActIds: Object.freeze(['act-1']),
      maximumPhysicalExits: 1 as const,
      revisit: 'checkpoint' as const,
      requiredEventIds: Object.freeze([]),
      requiredBeatIds: Object.freeze([]),
      providesBeatIds: Object.freeze(['beat.hub.floresta-das-raizes', 'beat.prologue.world-root']),
    }),
    exits: Object.freeze([Object.freeze({
      id: WORLD_ROOT_EXIT_ID,
      anchor: Object.freeze({ kind: 'tile' as const, ...WORLD_ROOT_EXIT }),
      targetStageId: 'stage.aguas.igapo-das-memorias',
      condition: Object.freeze({
        type: 'flag.equals' as const,
        flag: WORLD_ROOT_PASSAGE_FLAG,
        value: true,
      }),
    })]),
    entryDialogueId: WORLD_ROOT_ENTRY_DIALOGUE_ID,
    completionMissionId: WORLD_ROOT_MISSION_ID,
    capabilities: Object.freeze([
      Object.freeze({ id: 'navigation.authored-map', category: 'navigation' as const, minimumVersion: 1, requirement: 'required' as const }),
      Object.freeze({ id: 'navigation.physical-exit', category: 'navigation' as const, minimumVersion: 1, requirement: 'required' as const }),
      Object.freeze({ id: 'interaction.npc-dialogue', category: 'interaction' as const, minimumVersion: 1, requirement: 'required' as const }),
      Object.freeze({ id: 'narrative.dialogue', category: 'narrative' as const, minimumVersion: 1, requirement: 'required' as const }),
      Object.freeze({ id: 'narrative.mission', category: 'narrative' as const, minimumVersion: 1, requirement: 'required' as const }),
      Object.freeze({ id: 'narrative.event', category: 'narrative' as const, minimumVersion: 1, requirement: 'required' as const }),
      Object.freeze({ id: 'narrative.condition', category: 'narrative' as const, minimumVersion: 1, requirement: 'required' as const }),
      Object.freeze({ id: 'encounter.declarative', category: 'encounter' as const, minimumVersion: 1, requirement: 'required' as const }),
      Object.freeze({ id: 'effect.level-fog', category: 'effect' as const, minimumVersion: 1, requirement: 'required' as const }),
      Object.freeze({ id: 'effect.level-decoration', category: 'effect' as const, minimumVersion: 1, requirement: 'required' as const }),
      Object.freeze({ id: 'tile.custom-tileset', category: 'tile' as const, minimumVersion: 1, requirement: 'required' as const }),
      Object.freeze({ id: 'npc.custom-sprite', category: 'npc' as const, minimumVersion: 1, requirement: 'required' as const }),
      Object.freeze({ id: 'enemy.visual-variant', category: 'enemy' as const, minimumVersion: 1, requirement: 'required' as const }),
    ]),
    tags: Object.freeze(['prologue', 'amazon', 'forest', 'sanctuary', 'authored', 'campaign-entry']),
  }),
  authoredLevel: Object.freeze({
    id: WORLD_ROOT_STAGE_ID,
    name: 'Floresta das Raízes',
    description: 'Trilhas, igarapés e ruínas enraizadas conduzem à árvore ancestral que abre a Rota das Águas.',
    theme: 'paradiso_garden' as const,
    music: 'ost_vestibule',
    ambientColor: 0x173d32,
    fogColor: 0x12342e,
    fogDensity: 0.18,
    lightIntensity: 0.68,
    tileMap: WORLD_ROOT_LEVEL_MAP,
    enemies: [],
    items: [
      { type: 'health_herb', x: 28, y: 12, quantity: 1 },
      { type: 'mana_shard', x: 33, y: 27, quantity: 1 },
      { type: 'potion', x: 101, y: 14, quantity: 1 },
    ],
    decorations: WORLD_ROOT_DECORATIONS,
    parTime: 480,
    difficulty: 2,
  }),
  encounter: Object.freeze({
    schemaVersion: 1 as const,
    id: 'encounter.raiz-do-mundo.guardians',
    start: 'stage-ready' as const,
    completion: 'all-waves-defeated' as const,
    scaling: 'stage-difficulty-floor' as const,
    source: Object.freeze({
      kind: 'authored-waves' as const,
      waves: Object.freeze([
        Object.freeze({
          id: 'wave.raiz-do-mundo.first-warning',
          delayBeforeMs: 0,
          enemies: Object.freeze([
            Object.freeze({ type: 'affinity' as const, x: 39, y: 18, level: 1, patrol: Object.freeze([{ x: 38, y: 17 }, { x: 43, y: 19 }]) }),
          ]),
        }),
        Object.freeze({
          id: 'wave.raiz-do-mundo.sanctuary-guardians',
          delayBeforeMs: 5_000,
          enemies: Object.freeze([
            Object.freeze({ type: 'affinity' as const, x: 70, y: 20, level: 1, patrol: Object.freeze([{ x: 68, y: 19 }, { x: 73, y: 21 }]) }),
            Object.freeze({ type: 'applaud' as const, x: 75, y: 18, level: 2 }),
          ]),
        }),
      ]),
    }),
  }),
  narrative: Object.freeze({
    flags: Object.freeze({
      [WORLD_ROOT_INTRO_FLAG]: false,
      [WORLD_ROOT_PASSAGE_FLAG]: false,
    }),
  }),
  npcs: Object.freeze([Object.freeze({
    id: WORLD_ROOT_NPC_ID,
    displayName: 'Guardião da Seiva',
    role: 'quest' as const,
    presentationId: 'environment.world-root-keeper',
    spawn: Object.freeze({ kind: 'tile' as const, ...WORLD_ROOT_NPC_ANCHOR }),
    interactionDialogueId: WORLD_ROOT_DIALOGUE_ID,
  })]),
  dialogues: Object.freeze([
    Object.freeze({
      id: WORLD_ROOT_ENTRY_DIALOGUE_ID,
      startNodeId: 'forest-awakens',
      nodes: Object.freeze([Object.freeze({
        id: 'forest-awakens',
        speakerId: 'narrator' as const,
        text: 'A mata desperta antes do primeiro passo. Sob as folhas, raízes antigas apontam para o leste.',
      })]),
    }),
    Object.freeze({
      id: WORLD_ROOT_DIALOGUE_ID,
      startNodeId: 'keeper-greeting',
      nodes: Object.freeze([
        Object.freeze({
          id: 'keeper-greeting',
          speakerId: WORLD_ROOT_NPC_ID,
          text: 'Pise leve. A floresta reconhece quem chega, mas ainda não sabe o que você procura.',
          nextNodeId: 'player-question',
        }),
        Object.freeze({
          id: 'player-question',
          speakerId: 'player' as const,
          text: 'As pedras no caminho parecem apontar para uma árvore. É ali que a trilha termina?',
          nextNodeId: 'keeper-mission',
        }),
        Object.freeze({
          id: 'keeper-mission',
          speakerId: WORLD_ROOT_NPC_ID,
          text: 'Não termina. A grande raiz guarda a lembrança das águas. Acalme os brotos inquietos e ela mostrará a passagem.',
          nextNodeId: 'keeper-warning',
        }),
        Object.freeze({
          id: 'keeper-warning',
          speakerId: WORLD_ROOT_NPC_ID,
          text: 'Há um desequilíbrio adiante, pequeno ainda. Observe antes de atacar; nem todo movimento da mata é ameaça.',
        }),
      ]),
    }),
  ]),
  missions: Object.freeze([Object.freeze({
    id: WORLD_ROOT_MISSION_ID,
    title: 'Ouvir as raízes',
    description: 'Encontre o Guardião da Seiva e acalme as raízes inquietas antes de seguir as águas.',
    scope: 'stage' as const,
    start: 'stage-enter' as const,
    objectives: Object.freeze([
      Object.freeze({
        id: 'objective.raiz-do-mundo.ouvir-guardiao',
        description: 'Converse com o Guardião da Seiva.',
        signal: 'npc.interacted' as const,
        target: 1,
        filter: Object.freeze({ field: 'npcId' as const, equals: WORLD_ROOT_NPC_ID }),
      }),
      Object.freeze({
        id: 'objective.raiz-do-mundo.acalmar-raizes',
        description: 'Supere os dois encontros sem ferir o equilíbrio da floresta.',
        signal: 'encounter.completed' as const,
        target: 1,
        filter: Object.freeze({ field: 'encounterId' as const, equals: 'encounter.raiz-do-mundo.guardians' }),
      }),
    ]),
    rewards: Object.freeze([
      Object.freeze({ type: 'progression.currency' as const, amount: 75 }),
      Object.freeze({ type: 'progression.unlock' as const, contentId: 'route.aguas' }),
    ]),
  })]),
  events: Object.freeze([
    Object.freeze({
      id: 'event.raiz-do-mundo.stage-entered',
      once: true,
      when: 'stage.entered' as const,
      filter: Object.freeze({ field: 'stageId' as const, equals: WORLD_ROOT_STAGE_ID }),
      condition: Object.freeze({ type: 'flag.equals' as const, flag: WORLD_ROOT_INTRO_FLAG, value: false }),
      commands: Object.freeze([
        Object.freeze({ type: 'mission.start' as const, missionId: WORLD_ROOT_MISSION_ID }),
        Object.freeze({ type: 'dialogue.start' as const, dialogueId: WORLD_ROOT_ENTRY_DIALOGUE_ID }),
        Object.freeze({ type: 'flag.set' as const, flag: WORLD_ROOT_INTRO_FLAG, value: true }),
      ]),
    }),
    Object.freeze({
      id: WORLD_ROOT_INTERACTION_EVENT_ID,
      once: false,
      when: 'npc.interacted' as const,
      filter: Object.freeze({ field: 'npcId' as const, equals: WORLD_ROOT_NPC_ID }),
      commands: Object.freeze([Object.freeze({ type: 'dialogue.start' as const, dialogueId: WORLD_ROOT_DIALOGUE_ID })]),
    }),
    Object.freeze({
      id: 'event.raiz-do-mundo.passage-opened',
      once: true,
      when: 'mission.completed' as const,
      filter: Object.freeze({ field: 'missionId' as const, equals: WORLD_ROOT_MISSION_ID }),
      commands: Object.freeze([
        Object.freeze({ type: 'flag.set' as const, flag: WORLD_ROOT_PASSAGE_FLAG, value: true }),
        Object.freeze({ type: 'exit.unlock' as const, exitId: WORLD_ROOT_EXIT_ID }),
        Object.freeze({ type: 'stage.complete' as const, exitId: WORLD_ROOT_EXIT_ID }),
      ]),
    }),
  ]),
});
