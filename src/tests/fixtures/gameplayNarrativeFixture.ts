import {
  GameNarrativeSession,
  StageSignalAdapter,
} from '../../application/stages';
import {
  CampaignSaveService,
  MemorySaveStorage,
  NarrativeState,
  StageDirector,
} from '../../narrative';
import type { NarrativeContent, SaveStoragePort } from '../../narrative';

export const GAMEPLAY_STAGE_ID = 'stage.test.gameplay-narrative';
export const GAMEPLAY_CHAPTER_ID = 'chapter.test.gameplay-narrative';
export const GAMEPLAY_MISSION_ID = 'mission.test.track-echoes';
export const GAMEPLAY_DEFEAT_OBJECTIVE = 'objective.defeat-shades';
export const GAMEPLAY_COLLECT_OBJECTIVE = 'objective.collect-relic';
export const GAMEPLAY_DIALOGUE_ID = 'dialogue.test.gameplay-choice';
export const GAMEPLAY_FLAGS = Object.freeze({
  boss: 'test.gameplay.boss-defeated',
  wave: 'test.gameplay.wave-completed',
  encounter: 'test.gameplay.encounter-completed',
  exit: 'test.gameplay.exit-requested',
  dialogue: 'test.gameplay.dialogue-choice',
});

export const GAMEPLAY_IDENTITY = Object.freeze({
  campaignId: 'campaign.test.gameplay-narrative',
  runId: 'run.test.gameplay-narrative',
  runSeed: 'seed.test.gameplay-narrative',
  chapterId: GAMEPLAY_CHAPTER_ID,
  stageId: GAMEPLAY_STAGE_ID,
  manifestRevision: 1,
  stageInstanceId: 'node.test.gameplay-narrative',
});

export const GAMEPLAY_SAVE_KEY = 'test.gameplay-narrative.save';

export function gameplayNarrativeContent(): NarrativeContent {
  return {
    chapterId: GAMEPLAY_CHAPTER_ID,
    stageId: GAMEPLAY_STAGE_ID,
    definition: {
      flags: {
        [GAMEPLAY_FLAGS.boss]: false,
        [GAMEPLAY_FLAGS.wave]: false,
        [GAMEPLAY_FLAGS.encounter]: false,
        [GAMEPLAY_FLAGS.exit]: false,
        [GAMEPLAY_FLAGS.dialogue]: false,
      },
    },
    dialogues: [{
      id: GAMEPLAY_DIALOGUE_ID,
      startNodeId: 'start',
      nodes: [
        {
          id: 'start',
          speakerId: 'narrator',
          text: 'Qual eco seguir?',
          choices: [{
            id: 'follow',
            text: 'Seguir o eco.',
            nextNodeId: 'end',
            commands: [{ type: 'flag.set', flag: GAMEPLAY_FLAGS.dialogue, value: true }],
          }],
        },
        { id: 'end', speakerId: 'narrator', text: 'O eco responde.' },
      ],
    }],
    missions: [{
      id: GAMEPLAY_MISSION_ID,
      title: 'Rastrear ecos',
      description: 'Derrote sombras e recupere o vestígio.',
      scope: 'stage',
      start: 'stage-enter',
      objectives: [
        {
          id: GAMEPLAY_DEFEAT_OBJECTIVE,
          description: 'Derrote duas sombras.',
          signal: 'enemy.defeated',
          target: 2,
          filter: { field: 'archetype', equals: 'shade' },
        },
        {
          id: GAMEPLAY_COLLECT_OBJECTIVE,
          description: 'Colete um vestígio.',
          signal: 'item.collected',
          target: 1,
          filter: { field: 'itemType', equals: 'relic' },
        },
      ],
    }],
    events: [
      {
        id: 'event.test.gameplay-boss',
        once: true,
        when: 'enemy.defeated',
        filter: { field: 'archetype', equals: 'boss' },
        commands: [{ type: 'flag.set', flag: GAMEPLAY_FLAGS.boss, value: true }],
      },
      {
        id: 'event.test.gameplay-wave',
        once: true,
        when: 'encounter.completed',
        filter: { field: 'encounterId', equals: 'wave.1' },
        commands: [{ type: 'flag.set', flag: GAMEPLAY_FLAGS.wave, value: true }],
      },
      {
        id: 'event.test.gameplay-encounter',
        once: true,
        when: 'encounter.completed',
        filter: { field: 'encounterId', equals: 'encounter.stage.test' },
        commands: [{ type: 'flag.set', flag: GAMEPLAY_FLAGS.encounter, value: true }],
      },
      {
        id: 'event.test.gameplay-exit',
        once: true,
        when: 'stage.exit.requested',
        filter: { field: 'exitId', equals: 'exit.test.return' },
        commands: [{ type: 'flag.set', flag: GAMEPLAY_FLAGS.exit, value: true }],
      },
    ],
    exitIds: ['exit.test.return'],
  };
}

export function createGameplayNarrativeFixture(storage: SaveStoragePort = new MemorySaveStorage()): {
  readonly session: GameNarrativeSession;
  readonly adapter: StageSignalAdapter;
  readonly storage: SaveStoragePort;
} {
  const state = new NarrativeState();
  const saves = new CampaignSaveService(storage, GAMEPLAY_SAVE_KEY);
  const restored = saves.loadAndRestore(GAMEPLAY_IDENTITY, state);
  if (!restored.ok) throw restored.error;
  const director = StageDirector.create(
    gameplayNarrativeContent(),
    state.snapshot(),
    { level: 1, unlockedContent: [] },
    { identity: GAMEPLAY_IDENTITY },
  );
  if (!director.ok) throw director.error;
  const session = new GameNarrativeSession(GAMEPLAY_IDENTITY, director.value, saves);
  return { session, adapter: new StageSignalAdapter(session), storage };
}
