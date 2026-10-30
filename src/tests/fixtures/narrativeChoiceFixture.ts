import {
  StageRegistry,
  StageLoader,
  registerLegacyStages,
} from '../../stages';
import type {
  ChapterManifest,
  LoadedStage,
  StageModule,
} from '../../stages';
import type { LevelDefinition } from '../../data/LevelData';
import {
  GameStageCompositionRoot,
  campaignStageNarrativeSaveKey,
} from '../../application/stages';
import type { GameNarrativeSession } from '../../application/stages';
import {
  MemorySaveStorage,
  type SaveStoragePort,
} from '../../narrative';

export const FIXTURE_CHAPTER_ID = 'chapter.test.narrative';
export const FIXTURE_STAGE_ID = 'stage.test.narrative-choices';
export const FIXTURE_NPC_ID = 'npc.test.gate';
export const FIXTURE_DIALOGUE_ID = 'dialogue.test.gate';
export const FIXTURE_QUIET_DIALOGUE_ID = 'dialogue.test.quiet';
export const FIXTURE_MISSION_ID = 'mission.test.trail';
export const FIXTURE_MISSION_OBJECTIVE = 'steps';
export const FIXTURE_RUN_ID = 'run.test.narrative-choices';
export const FIXTURE_SEED = 'seed.test.narrative-choices';
export const FIXTURE_STAGE_INSTANCE = 'node.test.narrative-choices.main';
export const FIXTURE_EXIT_ID = 'exit.test.narrative-choices.return';

export const FIXTURE_FLAGS = Object.freeze({
  entered: 'flag.test.narrative.entered',
  left: 'flag.test.narrative.left',
  right: 'flag.test.narrative.right',
  leftNode: 'flag.test.narrative.left-node',
  rightNode: 'flag.test.narrative.right-node',
  completed: 'flag.test.narrative.completed',
});

const FIXTURE_LEVEL: LevelDefinition = {
  id: FIXTURE_STAGE_ID,
  name: 'Fixture narrativa',
  description: 'Fixture dedicada aos testes de comandos e escolhas.',
  theme: 'witches_crypt',
  music: 'ost_vestibule',
  ambientColor: 0x173b35,
  fogColor: 0x071b1d,
  fogDensity: 0.4,
  lightIntensity: 0.5,
  tileMap: [
    [1, 1, 1, 1, 1, 1],
    [1, 8, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1],
    [1, 0, 0, 5, 0, 1],
    [1, 1, 1, 1, 1, 1],
  ],
  enemies: [],
  items: [],
  decorations: [],
  waves: [],
  parTime: 10,
  difficulty: 1,
};

export const FIXTURE_STAGE: StageModule = Object.freeze({
  manifest: Object.freeze({
    schemaVersion: 1 as const,
    id: FIXTURE_STAGE_ID,
    revision: 1,
    chapterId: FIXTURE_CHAPTER_ID,
    order: 0,
    title: 'Fixture narrativa',
    summary: 'Estágio mínimo para exercitar comandos de diálogo e escolhas.',
    layout: Object.freeze({ kind: 'authored' as const }),
    exits: Object.freeze([Object.freeze({
      id: FIXTURE_EXIT_ID,
      anchor: Object.freeze({ kind: 'tile' as const, x: 3, y: 4 }),
      targetStageId: 'campaign.complete',
    })]),
  }),
  authoredLevel: FIXTURE_LEVEL,
  narrative: Object.freeze({
    flags: Object.freeze({
      [FIXTURE_FLAGS.entered]: false,
      [FIXTURE_FLAGS.left]: false,
      [FIXTURE_FLAGS.right]: false,
      [FIXTURE_FLAGS.leftNode]: false,
      [FIXTURE_FLAGS.rightNode]: false,
      [FIXTURE_FLAGS.completed]: false,
    }),
  }),
  npcs: Object.freeze([Object.freeze({
    id: FIXTURE_NPC_ID,
    displayName: 'Portão de Teste',
    role: 'ambient' as const,
    presentationId: 'environment.test-gate',
    spawn: Object.freeze({ kind: 'tile' as const, x: 2, y: 2 }),
    interactionDialogueId: FIXTURE_DIALOGUE_ID,
  })]),
  dialogues: Object.freeze([Object.freeze({
    id: FIXTURE_DIALOGUE_ID,
    startNodeId: 'start',
    nodes: Object.freeze([
      Object.freeze({
        id: 'start',
        speakerId: 'narrator' as const,
        text: 'Duas passagens se abrem. Uma escolha será lembrada.',
        onEnter: Object.freeze([
          Object.freeze({ type: 'flag.set' as const, flag: FIXTURE_FLAGS.entered, value: true }),
        ]),
        choices: Object.freeze([
          Object.freeze({
            id: 'left',
            text: 'Seguir pela margem',
            nextNodeId: 'left.node',
            commands: Object.freeze([
              Object.freeze({ type: 'flag.set' as const, flag: FIXTURE_FLAGS.left, value: true }),
            ]),
          }),
          Object.freeze({
            id: 'right',
            text: 'Atravessar a corrente',
            nextNodeId: 'right.node',
            commands: Object.freeze([
              Object.freeze({ type: 'flag.set' as const, flag: FIXTURE_FLAGS.right, value: true }),
            ]),
          }),
          Object.freeze({
            id: 'blocked',
            text: 'Abrir a passagem selada',
            condition: Object.freeze({
              type: 'flag.equals' as const,
              flag: FIXTURE_FLAGS.entered,
              value: 'never',
            }),
            nextNodeId: 'right.node',
            commands: Object.freeze([
              Object.freeze({ type: 'flag.set' as const, flag: FIXTURE_FLAGS.right, value: true }),
            ]),
          }),
        ]),
      }),
      Object.freeze({
        id: 'left.node',
        speakerId: 'player' as const,
        text: 'A margem guarda o caminho mais silencioso.',
        onEnter: Object.freeze([
          Object.freeze({ type: 'mission.start' as const, missionId: FIXTURE_MISSION_ID }),
          Object.freeze({
            type: 'mission.advance' as const,
            missionId: FIXTURE_MISSION_ID,
            objectiveId: FIXTURE_MISSION_OBJECTIVE,
            amount: 1,
          }),
          Object.freeze({ type: 'flag.set' as const, flag: FIXTURE_FLAGS.leftNode, value: true }),
        ]),
      }),
      Object.freeze({
        id: 'right.node',
        speakerId: 'player' as const,
        text: 'A corrente resiste, mas cede.',
        onEnter: Object.freeze([
          Object.freeze({ type: 'flag.set' as const, flag: FIXTURE_FLAGS.rightNode, value: true }),
        ]),
      }),
    ]),
  }),
  Object.freeze({
    id: FIXTURE_QUIET_DIALOGUE_ID,
    startNodeId: 'only',
    nodes: Object.freeze([
      Object.freeze({
        id: 'only',
        speakerId: 'narrator' as const,
        text: 'Nada muda aqui.',
      }),
    ]),
  })]),
  missions: Object.freeze([Object.freeze({
    id: FIXTURE_MISSION_ID,
    title: 'Trilha de teste',
    description: 'Missão de fixture para provar idempotência de mission.advance.',
    scope: 'stage' as const,
    start: 'dialogue' as const,
    objectives: Object.freeze([Object.freeze({
      id: FIXTURE_MISSION_OBJECTIVE,
      description: 'Avançar um passo',
      signal: 'npc.interacted' as const,
      target: 5,
    })]),
  })]),
  events: Object.freeze([Object.freeze({
    id: 'event.test.narrative.completed',
    once: true,
    when: 'dialogue.completed' as const,
    filter: Object.freeze({ field: 'dialogueId' as const, equals: FIXTURE_DIALOGUE_ID }),
    commands: Object.freeze([
      Object.freeze({ type: 'flag.set' as const, flag: FIXTURE_FLAGS.completed, value: true }),
    ]),
  })]),
});

export const FIXTURE_CHAPTER: ChapterManifest = Object.freeze({
  schemaVersion: 1 as const,
  id: FIXTURE_CHAPTER_ID,
  revision: 1,
  title: 'Capítulo de fixture narrativa',
  stageIds: Object.freeze([FIXTURE_STAGE_ID]),
  entryStageId: FIXTURE_STAGE_ID,
});

export interface ChoiceFixtureSession {
  readonly composition: GameStageCompositionRoot;
  readonly loaded: LoadedStage;
  readonly identity: {
    readonly campaignId: string;
    readonly runId: string;
    readonly runSeed: string;
    readonly stageInstanceId: string;
  };
  readonly key: string;
  readonly session: GameNarrativeSession;
}

export function createChoiceFixtureSession(
  storage: SaveStoragePort = new MemorySaveStorage(),
): ChoiceFixtureSession {
  const registry = new StageRegistry();
  registerLegacyStages(registry);
  registry.registerChapter(FIXTURE_CHAPTER, [FIXTURE_STAGE]);
  const composition = new GameStageCompositionRoot({ registry, campaignStorage: storage });
  const loaded = composition.loader.load({
    stageId: FIXTURE_STAGE_ID,
    runId: FIXTURE_RUN_ID,
    runSeed: FIXTURE_SEED,
  });
  if (!loaded.ok) throw loaded.error;
  const identity = {
    campaignId: 'campaign.test',
    runId: FIXTURE_RUN_ID,
    runSeed: FIXTURE_SEED,
    stageInstanceId: FIXTURE_STAGE_INSTANCE,
  };
  const key = campaignStageNarrativeSaveKey(
    FIXTURE_RUN_ID,
    loaded.value.manifest.chapterId,
    loaded.value.manifest.id,
  );
  const created = composition.createNarrativeSession(
    loaded.value,
    identity,
    { level: 1, unlockedContent: [] },
    key,
  );
  if (!created.ok) throw created.error;
  return { composition, loaded: loaded.value, identity, key, session: created.session };
}
