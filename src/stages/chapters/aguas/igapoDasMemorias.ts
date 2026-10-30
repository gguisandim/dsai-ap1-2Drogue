import type { StageModule } from '../../contracts';
import {
  IGAPO_AFFINITY_SPRITE_ID,
  IGAPO_APPLAUD_SPRITE_ID,
  IGAPO_AUDIO_PROFILE_ID,
  IGAPO_ENVIRONMENT_ID,
  IGAPO_NPC_SPRITE_ID,
  IGAPO_VISUAL_THEME_ID,
  IGAPO_VISUAL_TILESET_ID,
} from './igapoVisuals';

export const IGAPO_DAS_MEMORIAS_STAGE_ID = 'stage.aguas.igapo-das-memorias';
export const IGAPO_DAS_MEMORIAS_CHAPTER_ID = 'chapter.aguas';
export const IGAPO_RETURN_EXIT_ID = 'exit.aguas.igapo.return-hub';
export const ECO_DAS_AGUAS_EVENT_ID = 'event.aguas.igapo.eco-das-aguas';
export const ECO_DAS_AGUAS_DIALOGUE_ID = 'dialogue.aguas.igapo.eco-das-aguas';
export const ECO_DAS_AGUAS_NPC_ID = 'npc.aguas.igapo.memory-vestige';
export const ECO_DAS_AGUAS_FLAG = 'flag.aguas.igapo.eco-das-aguas-seen';
export const ECO_DAS_AGUAS_INTEREST = Object.freeze({ x: 27, y: 17 });
export const IGAPO_RETURN_ANCHOR = Object.freeze({ x: 36, y: 20 });

const WIDTH = 40;
const HEIGHT = 25;
const FLOOR = 0;
const WALL = 1;
const ROOT = 2;
const WATER = 3;
const EXIT = 5;
const CHEST = 7;
const SPAWN = 8;

/**
 * Dark water is the negative space. Dry islands, root bridges and two branches
 * are carved into it, keeping the authored topology legible beside the data.
 */
function createIgapoMap(): number[][] {
  const map: number[][] = Array.from({ length: HEIGHT }, (_, y) =>
    Array.from({ length: WIDTH }, (_, x) =>
      x === 0 || y === 0 || x === WIDTH - 1 || y === HEIGHT - 1 ? WALL : WATER));
  const fill = (x1: number, y1: number, x2: number, y2: number, tile = FLOOR): void => {
    for (let y = y1; y <= y2; y += 1) {
      for (let x = x1; x <= x2; x += 1) map[y][x] = tile;
    }
  };

  // Safe western island and the fork.
  fill(2, 17, 10, 22);
  fill(8, 18, 14, 20);

  // Northern root path into the first combat clearing.
  fill(12, 10, 14, 19);
  fill(10, 7, 20, 12);
  fill(19, 9, 27, 10);
  fill(26, 5, 37, 13);

  // Southern island path, memory island and the return bank.
  fill(13, 18, 17, 21);
  fill(16, 19, 26, 20);
  fill(24, 15, 32, 22);
  fill(29, 11, 31, 17);
  fill(31, 18, 37, 22);

  // Eastern connector closes the loop between both branches.
  fill(34, 12, 36, 19);

  // Emergent trees and exposed roots shape narrow passages without closing them.
  [
    [5, 18], [8, 21],
    [11, 8], [18, 8], [11, 11], [18, 11],
    [27, 6], [32, 6], [36, 7], [28, 12], [33, 11], [36, 12],
    [25, 16], [31, 16], [25, 21], [31, 21],
    [33, 19], [33, 22],
  ].forEach(([x, y]) => { map[y][x] = ROOT; });

  map[20][4] = SPAWN;
  map[ECO_DAS_AGUAS_INTEREST.y][ECO_DAS_AGUAS_INTEREST.x] = CHEST;
  map[IGAPO_RETURN_ANCHOR.y][IGAPO_RETURN_ANCHOR.x] = EXIT;
  return map;
}

export const IGAPO_DAS_MEMORIAS_STAGE: StageModule = Object.freeze({
  manifest: Object.freeze({
    schemaVersion: 1 as const,
    id: IGAPO_DAS_MEMORIAS_STAGE_ID,
    revision: 1,
    chapterId: IGAPO_DAS_MEMORIAS_CHAPTER_ID,
    order: 0,
    title: 'Igapó das Memórias',
    summary: 'Ilhas de terra e raízes atravessam águas escuras onde lembranças estão desaparecendo.',
    layout: Object.freeze({ kind: 'authored' as const }),
    presentation: Object.freeze({
      themeId: IGAPO_VISUAL_THEME_ID,
      tilesetId: IGAPO_VISUAL_TILESET_ID,
      npcSprites: Object.freeze({
        'environment.memory-vestige': IGAPO_NPC_SPRITE_ID,
      }),
      enemySprites: Object.freeze({
        affinity: IGAPO_AFFINITY_SPRITE_ID,
        applaud: IGAPO_APPLAUD_SPRITE_ID,
      }),
      audioProfileId: IGAPO_AUDIO_PROFILE_ID,
      environmentId: IGAPO_ENVIRONMENT_ID,
    }),
    exits: Object.freeze([Object.freeze({
      id: IGAPO_RETURN_EXIT_ID,
      anchor: Object.freeze({ kind: 'tile' as const, ...IGAPO_RETURN_ANCHOR }),
      targetStageId: 'verse_01_atrium',
    })]),
    entryDialogueId: ECO_DAS_AGUAS_DIALOGUE_ID,
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
        id: IGAPO_VISUAL_THEME_ID, category: 'theme' as const,
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
    tags: Object.freeze(['amazon', 'aguas', 'igapo', 'authored']),
  }),
  authoredLevel: Object.freeze({
    id: IGAPO_DAS_MEMORIAS_STAGE_ID,
    name: 'Igapó das Memórias',
    description: 'Uma floresta sazonalmente inundada, silenciosa e alterada por memórias ausentes.',
    theme: 'witches_crypt' as const,
    music: 'ost_vestibule',
    ambientColor: 0x173b35,
    fogColor: 0x071b1d,
    fogDensity: 0.48,
    lightIntensity: 0.48,
    tileMap: createIgapoMap(),
    enemies: [],
    items: [
      { type: 'health_herb', x: 7, y: 19, quantity: 1 },
      { type: 'key', x: 28, y: 17, quantity: 1 },
      { type: 'mana_shard', x: 35, y: 15, quantity: 1 },
    ],
    decorations: [
      { type: 'igapo_emergent_tree', x: 11, y: 8, scale: 1.2, tint: 0x315c42 },
      { type: 'igapo_fallen_trunk', x: 20, y: 10, rotation: 0.08, tint: 0x594735 },
      { type: 'igapo_memory_reeds', x: 27, y: 17, scale: 0.9, tint: 0x78b9a5 },
    ],
    waves: [
      {
        delay: 0,
        enemies: [
          {
            type: 'affinity', x: 29, y: 8, level: 2,
            patrol: [{ x: 29, y: 8 }, { x: 33, y: 8 }],
          },
          { type: 'applaud', x: 35, y: 10, level: 2 },
        ],
      },
      {
        delay: 1200,
        enemies: [
          { type: 'affinity', x: 16, y: 9, level: 3 },
          { type: 'affinity', x: 26, y: 19, level: 3 },
          { type: 'applaud', x: 30, y: 18, level: 3 },
        ],
      },
    ],
    parTime: 210,
    difficulty: 3,
  }),
  narrative: Object.freeze({
    flags: Object.freeze({ [ECO_DAS_AGUAS_FLAG]: false }),
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
      Object.freeze({ type: 'dialogue.start' as const, dialogueId: ECO_DAS_AGUAS_DIALOGUE_ID }),
      Object.freeze({ type: 'flag.set' as const, flag: ECO_DAS_AGUAS_FLAG, value: true }),
    ]),
  })]),
});

