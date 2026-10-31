import type { StageModule } from '../../contracts';
import { WORLD_ROOT_PRESENTATION } from './visuals';

export const WORLD_ROOT_CHAPTER_ID = 'chapter.raiz-do-mundo';
export const WORLD_ROOT_STAGE_ID = 'stage.raiz-do-mundo.santuario';
export const WORLD_ROOT_EXIT_ID = 'exit.raiz-do-mundo.return-menu';
export const WORLD_ROOT_NPC_ID = 'npc.raiz-do-mundo.keeper';
export const WORLD_ROOT_DIALOGUE_ID = 'dialogue.raiz-do-mundo.keeper';
export const WORLD_ROOT_INTERACTION_EVENT_ID = 'event.raiz-do-mundo.keeper-interacted';
export const WORLD_ROOT_ALTAR = Object.freeze({ x: 20, y: 15 });
export const WORLD_ROOT_SPAWN = Object.freeze({ x: 20, y: 21 });
export const WORLD_ROOT_EXIT = Object.freeze({ x: 20, y: 23 });
export const WORLD_ROOT_MONOLITHS = Object.freeze([
  Object.freeze({ x: 13, y: 13 }), Object.freeze({ x: 26, y: 13 }),
  Object.freeze({ x: 14, y: 18 }), Object.freeze({ x: 25, y: 18 }),
]);

const WIDTH = 40;
const HEIGHT = 25;
const FLOOR = 0;
const WALL = 1;
const PILLAR = 2;
const WATER = 3;
const EXIT = 5;
const CHEST = 7;
const SPAWN = 8;

export function createWorldRootMap(): number[][] {
  const map: number[][] = Array.from({ length: HEIGHT }, (_, y) => Array.from({ length: WIDTH }, (_, x) =>
    x === 0 || y === 0 || x === WIDTH - 1 || y === HEIGHT - 1 ? WALL : FLOOR));
  const fill = (x1: number, y1: number, x2: number, y2: number, value: number): void => {
    for (let y = y1; y <= y2; y += 1) for (let x = x1; x <= x2; x += 1) map[y][x] = value;
  };

  // Shallow pools form irregular negative space while preserving a broad central clearing.
  fill(2, 5, 8, 15, WATER);
  fill(31, 5, 37, 15, WATER);
  [[9, 7], [9, 8], [9, 12], [8, 16], [30, 7], [30, 11], [31, 16], [6, 4], [34, 4]]
    .forEach(([x, y]) => { map[y][x] = WATER; });

  // The upper trunk and buttress roots are solid; the altar clearing below remains open.
  fill(16, 2, 23, 7, WALL);
  fill(14, 5, 25, 9, WALL);
  [[13, 7], [26, 7], [12, 9], [27, 9], [15, 10], [24, 10],
    ...WORLD_ROOT_MONOLITHS.map(point => [point.x, point.y] as [number, number])]
    .forEach(([x, y]) => { map[y][x] = PILLAR; });

  map[WORLD_ROOT_ALTAR.y][WORLD_ROOT_ALTAR.x] = CHEST;
  map[WORLD_ROOT_SPAWN.y][WORLD_ROOT_SPAWN.x] = SPAWN;
  map[WORLD_ROOT_EXIT.y][WORLD_ROOT_EXIT.x] = EXIT;
  return map;
}

const edgeCanopy = [
  [2, 2], [6, 2], [10, 2], [29, 2], [33, 2], [37, 2],
  [2, 20], [6, 22], [33, 22], [37, 20], [2, 10], [37, 10],
];
const undergrowth = [
  [4, 18], [8, 20], [11, 22], [29, 22], [32, 19], [35, 18],
  [10, 5], [29, 5], [10, 14], [29, 14],
];

export const WORLD_ROOT_STAGE: StageModule = Object.freeze({
  manifest: Object.freeze({
    schemaVersion: 1 as const,
    id: WORLD_ROOT_STAGE_ID,
    revision: 1,
    chapterId: WORLD_ROOT_CHAPTER_ID,
    order: 0,
    title: 'Raiz do Mundo',
    summary: 'Um santuário ancestral cresce entre águas rasas, monólitos e raízes vivas.',
    layout: Object.freeze({ kind: 'authored' as const }),
    presentation: WORLD_ROOT_PRESENTATION,
    campaignCatalog: Object.freeze({
      availability: 'available' as const,
      participation: 'individual-only' as const,
      role: 'milestone' as const,
      regionIds: Object.freeze(['region.prologue.world-root']),
      biomeIds: Object.freeze(['garden']),
      difficulty: Object.freeze({ minimum: 1, maximum: 2 }),
      allowedActIds: Object.freeze([]),
      maximumPhysicalExits: 1 as const,
      revisit: 'repeatable' as const,
      requiredEventIds: Object.freeze([]), requiredBeatIds: Object.freeze([]),
      providesBeatIds: Object.freeze(['beat.prologue.world-root']),
    }),
    exits: Object.freeze([Object.freeze({
      id: WORLD_ROOT_EXIT_ID,
      anchor: Object.freeze({ kind: 'tile' as const, ...WORLD_ROOT_EXIT }),
      targetStageId: 'campaign.complete' as const,
    })]),
    capabilities: Object.freeze([
      Object.freeze({ id: 'navigation.authored-map', category: 'navigation' as const, minimumVersion: 1, requirement: 'required' as const }),
      Object.freeze({ id: 'interaction.npc-dialogue', category: 'interaction' as const, minimumVersion: 1, requirement: 'required' as const }),
      Object.freeze({ id: 'encounter.declarative', category: 'encounter' as const, minimumVersion: 1, requirement: 'required' as const }),
      Object.freeze({ id: 'effect.level-fog', category: 'effect' as const, minimumVersion: 1, requirement: 'required' as const }),
      Object.freeze({ id: 'effect.level-decoration', category: 'effect' as const, minimumVersion: 1, requirement: 'required' as const }),
      Object.freeze({ id: 'tile.custom-tileset', category: 'tile' as const, minimumVersion: 1, requirement: 'required' as const }),
      Object.freeze({ id: 'npc.custom-sprite', category: 'npc' as const, minimumVersion: 1, requirement: 'required' as const }),
      Object.freeze({ id: 'enemy.visual-variant', category: 'enemy' as const, minimumVersion: 1, requirement: 'required' as const }),
    ]),
    tags: Object.freeze(['prologue', 'amazon', 'sanctuary', 'authored', 'individual']),
  }),
  authoredLevel: Object.freeze({
    id: WORLD_ROOT_STAGE_ID,
    name: 'Raiz do Mundo',
    description: 'Clareira ritual amazônica sob uma árvore colossal enraizada em ruínas ancestrais.',
    theme: 'paradiso_garden' as const,
    music: 'ost_vestibule',
    ambientColor: 0x173d32, fogColor: 0x12342e, fogDensity: 0.24, lightIntensity: 0.66,
    tileMap: createWorldRootMap(),
    enemies: [],
    items: [
      { type: 'health_herb', x: 11, y: 19, quantity: 1 },
      { type: 'mana_shard', x: 28, y: 19, quantity: 1 },
    ],
    decorations: [
      { type: 'raiz_do_mundo_sanctuary', x: 20, y: 8, scale: 0.56, depth: 4 },
      ...WORLD_ROOT_MONOLITHS.map(point => ({ type: 'raiz_do_mundo_monolith', ...point, scale: 2.7, tint: 0x72b9a4, depth: 4.2 })),
      ...edgeCanopy.map(([x, y], index) => ({ type: 'raiz_do_mundo_canopy', x, y, scale: 3.8 + (index % 3) * 0.35, tint: index % 2 ? 0x315d42 : 0x3d6f4c })),
      { type: 'raiz_do_mundo_roots', x: 12, y: 10, rotation: -0.25, tint: 0x6b5840 },
      { type: 'raiz_do_mundo_roots', x: 27, y: 10, rotation: 0.25, tint: 0x6b5840 },
      ...undergrowth.map(([x, y], index) => ({ type: index % 3 === 0 ? 'raiz_do_mundo_vines' : 'raiz_do_mundo_undergrowth', x, y, scale: 1.9 + (index % 2) * 0.3, tint: 0x4e8a5e })),
      { type: 'raiz_do_mundo_biolume', x: 11, y: 15, tint: 0x79f1d7, scale: 1.8 },
      { type: 'raiz_do_mundo_biolume', x: 28, y: 15, tint: 0x79f1d7, scale: 1.8 },
      { type: 'raiz_do_mundo_biolume', x: 17, y: 19, tint: 0xffcf75, scale: 1.45 },
      { type: 'raiz_do_mundo_biolume', x: 22, y: 19, tint: 0xffcf75, scale: 1.45 },
    ],
    parTime: 150,
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
      waves: Object.freeze([Object.freeze({
        id: 'wave.sanctuary-guardians', delayBeforeMs: 0,
        enemies: Object.freeze([
          Object.freeze({ type: 'affinity' as const, x: 12, y: 18, level: 1, patrol: Object.freeze([{ x: 12, y: 18 }, { x: 16, y: 18 }]) }),
          Object.freeze({ type: 'affinity' as const, x: 27, y: 18, level: 1, patrol: Object.freeze([{ x: 27, y: 18 }, { x: 23, y: 18 }]) }),
          Object.freeze({ type: 'applaud' as const, x: 20, y: 12, level: 2 }),
        ]),
      })]),
    }),
  }),
  narrative: Object.freeze({ flags: Object.freeze({}) }),
  npcs: Object.freeze([Object.freeze({
    id: WORLD_ROOT_NPC_ID,
    displayName: 'Guardião da Seiva',
    role: 'ambient' as const,
    presentationId: 'environment.world-root-keeper',
    spawn: Object.freeze({ kind: 'tile' as const, ...WORLD_ROOT_ALTAR }),
    interactionDialogueId: WORLD_ROOT_DIALOGUE_ID,
  })]),
  dialogues: Object.freeze([Object.freeze({
    id: WORLD_ROOT_DIALOGUE_ID,
    startNodeId: 'sanctuary-breathes',
    nodes: Object.freeze([Object.freeze({
      id: 'sanctuary-breathes', speakerId: 'narrator' as const,
      text: 'A árvore respira sob a pedra. A clareira responde com luz, água e folhas em movimento.',
    })]),
  })]),
  events: Object.freeze([Object.freeze({
    id: WORLD_ROOT_INTERACTION_EVENT_ID,
    once: false,
    when: 'npc.interacted' as const,
    filter: Object.freeze({ field: 'npcId' as const, equals: WORLD_ROOT_NPC_ID }),
    commands: Object.freeze([Object.freeze({ type: 'dialogue.start' as const, dialogueId: WORLD_ROOT_DIALOGUE_ID })]),
  })]),
});

