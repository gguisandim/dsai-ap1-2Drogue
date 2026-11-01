import type { StageModule } from '../../contracts';
import {
  AGUAS_PRESENTATION_VARIANTS,
  AGUAS_RIBEIRINHO_PRESENTATION,
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
 * Water is the negative space. Islands and roots form a west-to-east route
 * with optional northern and southern loops that always reconnect.
 */
function createIgapoMap(): number[][] {
  const map: number[][] = Array.from({ length: IGAPO_MAP_HEIGHT }, (_, y) =>
    Array.from({ length: IGAPO_MAP_WIDTH }, (_, x) =>
      x === 0 || y === 0 || x === IGAPO_MAP_WIDTH - 1 || y === IGAPO_MAP_HEIGHT - 1
        ? WALL : WATER));
  const fill = (x1: number, y1: number, x2: number, y2: number, tile = FLOOR): void => {
    for (let y = y1; y <= y2; y += 1) {
      for (let x = x1; x <= x2; x += 1) map[y][x] = tile;
    }
  };

  // Introduction: a broad safe bank narrows into the first flooded passage.
  fill(2, 13, 16, 21);
  fill(14, 15, 30, 18);

  // Exploration: northern canopy and southern reed bed form optional loops.
  fill(26, 9, 30, 16);
  fill(24, 6, 44, 11);
  fill(42, 9, 47, 16);
  fill(31, 17, 35, 23);
  fill(32, 21, 48, 25);
  fill(46, 17, 51, 23);

  // The paths merge at the memory island and open into a corrupted estuary.
  fill(44, 13, 60, 20);
  fill(56, 8, 70, 17);
  fill(58, 17, 68, 22);
  fill(67, 14, 84, 18);

  // Transition: the final bank remains spacious while vegetation closes in.
  fill(80, 10, 93, 22);
  fill(76, 17, 83, 21);

  // Emergent trees and exposed roots shape narrow passages without closing them.
  [
    [7, 14], [11, 20], [18, 16], [22, 17],
    [25, 7], [31, 7], [38, 10], [43, 7], [28, 12], [43, 12],
    [33, 22], [39, 24], [47, 22], [49, 18],
    [52, 15], [58, 9], [64, 12], [68, 16], [61, 20],
    [73, 15], [78, 18], [82, 12], [86, 21], [90, 11],
  ].forEach(([x, y]) => { map[y][x] = ROOT; });

  map[17][4] = SPAWN;
  map[ECO_DAS_AGUAS_INTEREST.y][ECO_DAS_AGUAS_INTEREST.x] = CHEST;
  map[IGAPO_RETURN_ANCHOR.y][IGAPO_RETURN_ANCHOR.x] = EXIT;
  return map;
}

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
    tileMap: createIgapoMap(),
    enemies: [],
    items: [
      { type: 'health_herb', x: 10, y: 18, quantity: 1 },
      { type: 'key', x: 59, y: 12, quantity: 1 },
      { type: 'mana_shard', x: 83, y: 19, quantity: 1 },
    ],
    decorations: [
      { type: 'igapo_emergent_tree', x: 25, y: 7, scale: 1.2, tint: 0x315c42 },
      { type: 'igapo_fallen_trunk', x: 42, y: 10, rotation: 0.08, tint: 0x594735 },
      { type: 'igapo_memory_reeds', x: 28, y: 16, scale: 0.9, tint: 0x78b9a5 },
      { type: 'igapo_emergent_tree', x: 64, y: 12, scale: 1.25, tint: 0x315c42 },
      { type: 'igapo_fallen_trunk', x: 78, y: 18, rotation: -0.06, tint: 0x4f4033 },
      { type: 'igapo_memory_reeds', x: 86, y: 21, scale: 1, tint: 0x5e8f7f },
    ],
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

