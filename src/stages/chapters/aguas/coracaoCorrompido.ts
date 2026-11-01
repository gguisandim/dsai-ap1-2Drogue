import type { StageModule } from '../../contracts';
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
 * A broken estuary with two asymmetric exploration loops and a broad eastern
 * confrontation clearing. It deliberately does not mirror the natural map.
 */
function createCorruptedHeartMap(): number[][] {
  const map: number[][] = Array.from({ length: CORACAO_CORROMPIDO_MAP_HEIGHT }, (_, y) =>
    Array.from({ length: CORACAO_CORROMPIDO_MAP_WIDTH }, (_, x) =>
      x === 0 || y === 0 || x === CORACAO_CORROMPIDO_MAP_WIDTH - 1 ||
        y === CORACAO_CORROMPIDO_MAP_HEIGHT - 1 ? WALL : WATER));
  const fill = (x1: number, y1: number, x2: number, y2: number, tile = FLOOR): void => {
    for (let y = y1; y <= y2; y += 1) {
      for (let x = x1; x <= x2; x += 1) map[y][x] = tile;
    }
  };

  // A damaged western bank leads into two uneven causeways.
  fill(2, 12, 17, 20);
  fill(15, 11, 22, 16);
  fill(20, 6, 38, 12);
  fill(35, 10, 42, 16);
  fill(20, 18, 27, 24);
  fill(25, 22, 43, 26);
  fill(40, 16, 47, 23);

  // Both paths converge around a contaminated basin before splitting again.
  fill(39, 12, 56, 20);
  fill(52, 7, 67, 13);
  fill(55, 18, 70, 23);
  fill(54, 11, 60, 19);

  // The final clearing is connected by two narrow approaches.
  fill(64, 10, 72, 16);
  fill(67, 17, 74, 21);
  fill(71, 8, 85, 23);

  [
    [8, 13], [13, 19], [18, 13],
    [23, 7], [30, 11], [36, 7], [39, 13],
    [23, 23], [31, 25], [39, 23], [45, 19],
    [48, 13], [53, 18], [58, 9], [64, 12], [58, 21], [68, 20],
    [73, 10], [79, 9], [82, 13], [74, 22], [83, 21],
  ].forEach(([x, y]) => { map[y][x] = ROOT; });

  map[16][4] = SPAWN;
  map[9][61] = CHEST;
  map[CORACAO_CORROMPIDO_SOURCE.y][CORACAO_CORROMPIDO_SOURCE.x] = BOSS;
  map[CORACAO_CORROMPIDO_EXIT_ANCHOR.y][CORACAO_CORROMPIDO_EXIT_ANCHOR.x] = EXIT;
  map[CORACAO_CORROMPIDO_RETURN_ANCHOR.y][CORACAO_CORROMPIDO_RETURN_ANCHOR.x] = EXIT;
  return map;
}

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
      }),
      Object.freeze({
        id: CORACAO_CORROMPIDO_RETURN_EXIT_ID,
        anchor: Object.freeze({ kind: 'tile' as const, ...CORACAO_CORROMPIDO_RETURN_ANCHOR }),
        targetStageId: 'stage.aguas.igapo-das-memorias',
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
    tileMap: createCorruptedHeartMap(),
    enemies: [],
    items: [
      { type: 'health_herb', x: 13, y: 15, quantity: 1 },
      { type: 'mana_shard', x: 61, y: 9, quantity: 1 },
      { type: 'key', x: 80, y: 19, quantity: 1 },
    ],
    decorations: [
      { type: 'igapo_emergent_tree', x: 23, y: 7, scale: 1.25, tint: 0x35463d },
      { type: 'igapo_fallen_trunk', x: 39, y: 23, rotation: -0.12, tint: 0x3b312b },
      { type: 'igapo_memory_reeds', x: 53, y: 18, scale: 1, tint: 0x4d756d },
      { type: 'igapo_emergent_tree', x: 64, y: 12, scale: 1.3, tint: 0x2f403a },
      { type: 'igapo_fallen_trunk', x: 73, y: 10, rotation: 0.09, tint: 0x362b28 },
      { type: 'igapo_memory_reeds', x: 82, y: 13, scale: 1.1, tint: 0x486b65 },
    ],
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
    flags: Object.freeze({ 'flag.aguas.coracao-corrompido.cleansed': false }),
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
      flag: 'flag.aguas.coracao-corrompido.cleansed',
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
