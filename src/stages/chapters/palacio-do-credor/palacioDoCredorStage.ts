import type { StageModule } from '../../contracts';
import {
  createPalacioDoCredorLevelDefinition,
  PALACIO_DO_CREDOR_ARUA,
  PALACIO_DO_CREDOR_BOSS,
  PALACIO_DO_CREDOR_ECO,
  PALACIO_DO_CREDOR_EXIT,
  PALACIO_DO_CREDOR_SENTINELA,
  PALACIO_DO_CREDOR_STAGE_ID,
} from './palacioDoCredorMap';
import {
  PALACIO_PRESENTATION,
  PALACIO_PRESENTATION_VARIANTS,
} from './visuals';

export const PALACIO_DO_CREDOR_CHAPTER_ID = 'chapter.final.palacio-do-credor';
export const PALACIO_DO_CREDOR_EXIT_ID = 'exit.final.palacio-do-credor.complete';
export const PALACIO_DO_CREDOR_ARUA_ID = 'npc.final.palacio.arua';
export const PALACIO_DO_CREDOR_ECO_ID = 'npc.final.palacio.eco';
export const PALACIO_DO_CREDOR_SENTINELA_ID = 'npc.final.palacio.sentinela';
export const PALACIO_DO_CREDOR_ARUA_DIALOGUE_ID = 'dialogue.final.palacio.arua';
export const PALACIO_DO_CREDOR_ECO_DIALOGUE_ID = 'dialogue.final.palacio.eco';
export const PALACIO_DO_CREDOR_SENTINELA_DIALOGUE_ID = 'dialogue.final.palacio.sentinela';
export const PALACIO_DO_CREDOR_ENTRY_DIALOGUE_ID = 'dialogue.final.palacio.aproximacao';
export const PALACIO_DO_CREDOR_EPILOGUE_REFUSED_DIALOGUE_ID = 'dialogue.final.palacio.epilogo-recusa';
export const PALACIO_DO_CREDOR_EPILOGUE_ACCEPTED_DIALOGUE_ID = 'dialogue.final.palacio.epilogo-aceite';
export const PALACIO_DO_CREDOR_EPILOGUE_NEUTRAL_DIALOGUE_ID = 'dialogue.final.palacio.epilogo-neutro';
export const PALACIO_DO_CREDOR_MISSION_ID = 'mission.final.palacio.ultimo-pacto';
export const PALACIO_DO_CREDOR_ENCOUNTER_ID = 'encounter.final.palacio.credor';
export const PALACIO_DO_CREDOR_ENTRY_FLAG = 'flag.final.palacio.aproximacao-vista';
export const PALACIO_DO_CREDOR_DEFEATED_FLAG = 'flag.final.palacio.credor-derrotado';
export const PALACIO_DO_CREDOR_REFUSED_FLAG = 'flag.final.palacio.pacto-recusado';
export const PALACIO_DO_CREDOR_ACCEPTED_FLAG = 'flag.final.palacio.pacto-aceito';
export const PALACIO_DO_CREDOR_REFUSED_EVENT_ID = 'event.final.palacio.epilogo-recusa';
export const PALACIO_DO_CREDOR_ACCEPTED_EVENT_ID = 'event.final.palacio.epilogo-aceite';
export const PALACIO_DO_CREDOR_NEUTRAL_EVENT_ID = 'event.final.palacio.epilogo-neutro';
export const PALACIO_DO_CREDOR_EXIT_EVENT_ID = 'event.final.palacio.saida';
export const PALACIO_DO_CREDOR_EPILOGUE_EVENT_IDS = Object.freeze([
  PALACIO_DO_CREDOR_REFUSED_EVENT_ID,
  PALACIO_DO_CREDOR_ACCEPTED_EVENT_ID,
  PALACIO_DO_CREDOR_NEUTRAL_EVENT_ID,
]);

const tileAnchor = (point: Readonly<{ x: number; y: number }>) =>
  Object.freeze({ kind: 'tile' as const, x: point.x, y: point.y });

const completionCommands = (dialogueId: string) => Object.freeze([
  Object.freeze({ type: 'flag.set' as const, flag: PALACIO_DO_CREDOR_DEFEATED_FLAG, value: true }),
  Object.freeze({ type: 'dialogue.start' as const, dialogueId }),
  Object.freeze({ type: 'exit.unlock' as const, exitId: PALACIO_DO_CREDOR_EXIT_ID }),
  Object.freeze({
    type: 'reward.grant' as const,
    reward: Object.freeze({ type: 'progression.unlock' as const, contentId: 'beat.final.palacio-do-credor' }),
    operationId: 'operation.final.palacio-do-credor.epilogue.v1',
  }),
]);

export const PALACIO_DO_CREDOR_STAGE: StageModule = Object.freeze({
  manifest: Object.freeze({
    schemaVersion: 1 as const,
    id: PALACIO_DO_CREDOR_STAGE_ID,
    revision: 1,
    chapterId: PALACIO_DO_CREDOR_CHAPTER_ID,
    order: 0,
    title: 'Palácio do Credor',
    summary: 'Atravesse a casa que transformou a floresta em dívida e decida o que fica no livro do Credor.',
    layout: Object.freeze({ kind: 'authored' as const }),
    presentation: PALACIO_PRESENTATION,
    presentationVariants: PALACIO_PRESENTATION_VARIANTS,
    exits: Object.freeze([Object.freeze({
      id: PALACIO_DO_CREDOR_EXIT_ID,
      anchor: Object.freeze({ kind: 'tile' as const, ...PALACIO_DO_CREDOR_EXIT }),
      targetStageId: 'campaign.complete' as const,
      condition: Object.freeze({
        type: 'flag.equals' as const,
        flag: PALACIO_DO_CREDOR_DEFEATED_FLAG,
        value: true,
      }),
    })]),
    entryDialogueId: PALACIO_DO_CREDOR_ENTRY_DIALOGUE_ID,
    completionMissionId: PALACIO_DO_CREDOR_MISSION_ID,
    campaignCatalog: Object.freeze({
      availability: 'available' as const,
      participation: 'individual-only' as const,
      role: 'special' as const,
      regionIds: Object.freeze(['final.palacio-do-credor']),
      biomeIds: Object.freeze(['cathedral']),
      difficulty: Object.freeze({ minimum: 7, maximum: 10 }),
      allowedActIds: Object.freeze(['act-3']),
      maximumPhysicalExits: 1 as const,
      revisit: 'forbidden' as const,
      requiredEventIds: Object.freeze([]),
      requiredBeatIds: Object.freeze([]),
      providesBeatIds: Object.freeze(['beat.final.palacio-do-credor']),
    }),
    capabilities: Object.freeze([
      Object.freeze({ id: 'navigation.authored-map', category: 'navigation' as const, minimumVersion: 1, requirement: 'required' as const }),
      Object.freeze({ id: 'navigation.physical-exit', category: 'navigation' as const, minimumVersion: 1, requirement: 'required' as const }),
      Object.freeze({ id: 'biome.cathedral', category: 'biome' as const, minimumVersion: 1, requirement: 'required' as const }),
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
    tags: Object.freeze(['amazon', 'palace', 'final', 'creditor', 'authored', 'panoramic']),
  }),
  authoredLevel: Object.freeze(createPalacioDoCredorLevelDefinition()),
  encounter: Object.freeze({
    schemaVersion: 1 as const,
    id: PALACIO_DO_CREDOR_ENCOUNTER_ID,
    start: 'stage-ready' as const,
    completion: 'all-waves-defeated' as const,
    scaling: 'stage-difficulty-floor' as const,
    source: Object.freeze({
      kind: 'authored-waves' as const,
      waves: Object.freeze([
        Object.freeze({
          id: 'wave.final.palacio.aproximacao',
          delayBeforeMs: 0,
          enemies: Object.freeze([
            Object.freeze({ type: 'affinity' as const, x: 30, y: 24, level: 4, patrol: Object.freeze([{ x: 32, y: 22 }, { x: 28, y: 25 }]) }),
          ]),
        }),
        Object.freeze({
          id: 'wave.final.palacio.jardins',
          delayBeforeMs: 0,
          enemies: Object.freeze([
            Object.freeze({ type: 'applaud' as const, x: 52, y: 24, level: 5 }),
            Object.freeze({ type: 'affinity' as const, x: 58, y: 26, level: 5 }),
          ]),
        }),
        Object.freeze({
          id: 'wave.final.palacio.galerias',
          delayBeforeMs: 0,
          enemies: Object.freeze([
            Object.freeze({ type: 'miniboss' as const, x: 84, y: 20, level: 6, hp: 350 }),
          ]),
        }),
        Object.freeze({
          id: 'wave.final.palacio.arena',
          delayBeforeMs: 0,
          enemies: Object.freeze([
            Object.freeze({ type: 'boss' as const, x: PALACIO_DO_CREDOR_BOSS.x, y: PALACIO_DO_CREDOR_BOSS.y - 1, level: 8, hp: 700 }),
          ]),
        }),
      ]),
    }),
  }),
  narrative: Object.freeze({
    flags: Object.freeze({
      [PALACIO_DO_CREDOR_ENTRY_FLAG]: false,
      [PALACIO_DO_CREDOR_DEFEATED_FLAG]: false,
      [PALACIO_DO_CREDOR_REFUSED_FLAG]: false,
      [PALACIO_DO_CREDOR_ACCEPTED_FLAG]: false,
    }),
  }),
  npcs: Object.freeze([
    Object.freeze({
      id: PALACIO_DO_CREDOR_ARUA_ID,
      displayName: 'Aruã, Escriba do Último Livro',
      role: 'story' as const,
      presentationId: 'environment.final.palacio.arua',
      spawn: tileAnchor(PALACIO_DO_CREDOR_ARUA),
      interactionDialogueId: PALACIO_DO_CREDOR_ARUA_DIALOGUE_ID,
    }),
    Object.freeze({
      id: PALACIO_DO_CREDOR_ECO_ID,
      displayName: 'Eco do Último Pacto',
      role: 'ambient' as const,
      presentationId: 'environment.final.palacio.eco',
      spawn: tileAnchor(PALACIO_DO_CREDOR_ECO),
      interactionDialogueId: PALACIO_DO_CREDOR_ECO_DIALOGUE_ID,
    }),
    Object.freeze({
      id: PALACIO_DO_CREDOR_SENTINELA_ID,
      displayName: 'Sentinela do Último Selo',
      role: 'ambient' as const,
      presentationId: 'environment.final.palacio.sentinela',
      spawn: tileAnchor(PALACIO_DO_CREDOR_SENTINELA),
      interactionDialogueId: PALACIO_DO_CREDOR_SENTINELA_DIALOGUE_ID,
    }),
  ]),
  dialogues: Object.freeze([
    Object.freeze({
      id: PALACIO_DO_CREDOR_ENTRY_DIALOGUE_ID,
      startNodeId: 'aproximacao',
      nodes: Object.freeze([Object.freeze({
        id: 'aproximacao',
        speakerId: 'narrator' as const,
        text: 'A floresta termina antes do portão. O chão vira laje, e cada rachadura parece uma soma antiga. Alguém contou tudo o que vivia aqui — e cobrou.',
      })]),
    }),
    Object.freeze({
      id: PALACIO_DO_CREDOR_ECO_DIALOGUE_ID,
      startNodeId: 'eco-divida',
      nodes: Object.freeze([
        Object.freeze({ id: 'eco-divida', speakerId: PALACIO_DO_CREDOR_ECO_ID, text: 'Dívida não é o que se deve. É o que se acredita que se deve.', nextNodeId: 'eco-palacio' }),
        Object.freeze({ id: 'eco-palacio', speakerId: PALACIO_DO_CREDOR_ECO_ID, text: 'O Palácio não foi construído contra a floresta. Foi construído para administrá-la.', nextNodeId: 'eco-credor' }),
        Object.freeze({ id: 'eco-credor', speakerId: PALACIO_DO_CREDOR_ECO_ID, text: 'O Credor ainda escuta. Cada passo seu vira lançamento no livro.' }),
      ]),
    }),
    Object.freeze({
      id: PALACIO_DO_CREDOR_SENTINELA_DIALOGUE_ID,
      startNodeId: 'sentinela-selo',
      nodes: Object.freeze([
        Object.freeze({ id: 'sentinela-selo', speakerId: PALACIO_DO_CREDOR_SENTINELA_ID, text: 'O selo mede o que você carrega, não o que você promete.', nextNodeId: 'sentinela-porta' }),
        Object.freeze({ id: 'sentinela-porta', speakerId: PALACIO_DO_CREDOR_SENTINELA_ID, text: 'Além desta porta, o Credor não pergunta se você pode pagar. Ele decide quanto você vale.', nextNodeId: 'sentinela-aviso' }),
        Object.freeze({ id: 'sentinela-aviso', speakerId: PALACIO_DO_CREDOR_SENTINELA_ID, text: 'Leve apenas o que pretende defender.' }),
      ]),
    }),
    Object.freeze({
      id: PALACIO_DO_CREDOR_ARUA_DIALOGUE_ID,
      startNodeId: 'arua-chegada',
      nodes: Object.freeze([
        Object.freeze({ id: 'arua-chegada', speakerId: PALACIO_DO_CREDOR_ARUA_ID, text: 'Você chegou antes do vencimento. Isso é raro.', nextNodeId: 'arua-quem' }),
        Object.freeze({ id: 'arua-quem', speakerId: 'player' as const, text: 'Quem é o Credor?', nextNodeId: 'arua-origem' }),
        Object.freeze({ id: 'arua-origem', speakerId: PALACIO_DO_CREDOR_ARUA_ID, text: 'Foi o primeiro escriba. Prometeu registrar cada troca para que ninguém fosse esquecido. Depois, passou a cobrar até o esquecimento.', nextNodeId: 'arua-palacio' }),
        Object.freeze({ id: 'arua-palacio', speakerId: PALACIO_DO_CREDOR_ARUA_ID, text: 'As raízes, os rios, os nomes. Tudo entrou no livro como garantia. O Palácio é o cofre, não a casa.', nextNodeId: 'arua-motivo' }),
        Object.freeze({ id: 'arua-motivo', speakerId: PALACIO_DO_CREDOR_ARUA_ID, text: 'Ele não quer destruir a floresta. Quer que ela continue produzindo, para sempre, sem nunca quitar.', nextNodeId: 'arua-pergunta' }),
        Object.freeze({ id: 'arua-pergunta', speakerId: 'player' as const, text: 'Como se quebra um pacto assim?', nextNodeId: 'arua-escolha' }),
        Object.freeze({
          id: 'arua-escolha',
          speakerId: PALACIO_DO_CREDOR_ARUA_ID,
          text: 'Não se quebra. Escolhe-se o que fica no livro. Recusar devolve a memória ao território. Aceitar dá ao Credor um nome novo — o seu. Nenhuma escolha é gratuita.',
          choices: Object.freeze([
            Object.freeze({
              id: 'choice.final.palacio.recusar',
              text: 'Recusar o pacto',
              nextNodeId: 'arua-recusa',
              commands: Object.freeze([
                Object.freeze({ type: 'flag.set' as const, flag: PALACIO_DO_CREDOR_REFUSED_FLAG, value: true }),
                Object.freeze({ type: 'flag.set' as const, flag: PALACIO_DO_CREDOR_ACCEPTED_FLAG, value: false }),
              ]),
            }),
            Object.freeze({
              id: 'choice.final.palacio.aceitar',
              text: 'Aceitar o nome',
              nextNodeId: 'arua-aceite',
              commands: Object.freeze([
                Object.freeze({ type: 'flag.set' as const, flag: PALACIO_DO_CREDOR_ACCEPTED_FLAG, value: true }),
                Object.freeze({ type: 'flag.set' as const, flag: PALACIO_DO_CREDOR_REFUSED_FLAG, value: false }),
              ]),
            }),
          ]),
        }),
        Object.freeze({ id: 'arua-recusa', speakerId: PALACIO_DO_CREDOR_ARUA_ID, text: 'Então ele vai cobrar em combate. Não dê o último passo; dê o primeiro que não é dele.' }),
        Object.freeze({ id: 'arua-aceite', speakerId: PALACIO_DO_CREDOR_ARUA_ID, text: 'Então ele vai testar se você sabe carregar o que assina. Não confunda culpa com dívida.' }),
      ]),
    }),
    Object.freeze({
      id: PALACIO_DO_CREDOR_EPILOGUE_REFUSED_DIALOGUE_ID,
      startNodeId: 'epilogo-recusa',
      nodes: Object.freeze([Object.freeze({
        id: 'epilogo-recusa',
        speakerId: 'narrator' as const,
        text: 'O Credor cai, e o livro se abre sozinho. As linhas somem como raízes queimadas. A floresta não recebe uma promessa nova; recebe de volta o direito de não prometer. O portão se fecha atrás de você, sem chave.',
      })]),
    }),
    Object.freeze({
      id: PALACIO_DO_CREDOR_EPILOGUE_ACCEPTED_DIALOGUE_ID,
      startNodeId: 'epilogo-aceite',
      nodes: Object.freeze([Object.freeze({
        id: 'epilogo-aceite',
        speakerId: 'narrator' as const,
        text: 'O Credor cai, e o livro aceita seu nome. A dívida não desaparece: muda de dono. Quando você atravessa o portão, cada árvore parece reconhecer o peso. A floresta vive — e espera.',
      })]),
    }),
    Object.freeze({
      id: PALACIO_DO_CREDOR_EPILOGUE_NEUTRAL_DIALOGUE_ID,
      startNodeId: 'epilogo-neutro',
      nodes: Object.freeze([Object.freeze({
        id: 'epilogo-neutro',
        speakerId: 'narrator' as const,
        text: 'O Credor cai. O livro se fecha sem assinatura. A floresta respira, mas não sabe por quanto tempo.',
      })]),
    }),
  ]),
  missions: Object.freeze([Object.freeze({
    id: PALACIO_DO_CREDOR_MISSION_ID,
    title: 'O Último Pacto',
    description: 'Descubra a origem do Credor, atravesse o Palácio e decida o que fica no livro.',
    scope: 'stage' as const,
    start: 'stage-enter' as const,
    objectives: Object.freeze([
      Object.freeze({ id: 'objective.final.palacio.encontrar-arua', description: 'Converse com Aruã na Câmara de Revelação.', signal: 'npc.interacted' as const, target: 1, filter: Object.freeze({ field: 'npcId' as const, equals: PALACIO_DO_CREDOR_ARUA_ID }) }),
      Object.freeze({ id: 'objective.final.palacio.ouvir-eco', description: 'Escute o Eco do Último Pacto.', signal: 'npc.interacted' as const, target: 1, filter: Object.freeze({ field: 'npcId' as const, equals: PALACIO_DO_CREDOR_ECO_ID }), optional: true }),
      Object.freeze({ id: 'objective.final.palacio.ouvir-sentinela', description: 'Escute a Sentinela do Último Selo.', signal: 'npc.interacted' as const, target: 1, filter: Object.freeze({ field: 'npcId' as const, equals: PALACIO_DO_CREDOR_SENTINELA_ID }), optional: true }),
      Object.freeze({ id: 'objective.final.palacio.derrotar-credor', description: 'Derrote o Credor na arena.', signal: 'encounter.completed' as const, target: 1, filter: Object.freeze({ field: 'encounterId' as const, equals: PALACIO_DO_CREDOR_ENCOUNTER_ID }) }),
    ]),
    rewards: Object.freeze([
      Object.freeze({ type: 'progression.currency' as const, amount: 600 }),
      Object.freeze({ type: 'progression.unlock' as const, contentId: 'beat.final.palacio-do-credor' }),
      Object.freeze({ type: 'stage.flag' as const, flag: PALACIO_DO_CREDOR_DEFEATED_FLAG, value: true }),
    ]),
  })]),
  events: Object.freeze([
    Object.freeze({
      id: 'event.final.palacio.aproximacao',
      once: true,
      when: 'stage.entered' as const,
      filter: Object.freeze({ field: 'stageId' as const, equals: PALACIO_DO_CREDOR_STAGE_ID }),
      condition: Object.freeze({ type: 'flag.equals' as const, flag: PALACIO_DO_CREDOR_ENTRY_FLAG, value: false }),
      commands: Object.freeze([
        Object.freeze({ type: 'mission.start' as const, missionId: PALACIO_DO_CREDOR_MISSION_ID }),
        Object.freeze({ type: 'dialogue.start' as const, dialogueId: PALACIO_DO_CREDOR_ENTRY_DIALOGUE_ID }),
        Object.freeze({ type: 'flag.set' as const, flag: PALACIO_DO_CREDOR_ENTRY_FLAG, value: true }),
      ]),
    }),
    Object.freeze({
      id: 'event.final.palacio.arua-interagida',
      once: false,
      when: 'npc.interacted' as const,
      filter: Object.freeze({ field: 'npcId' as const, equals: PALACIO_DO_CREDOR_ARUA_ID }),
      commands: Object.freeze([Object.freeze({ type: 'dialogue.start' as const, dialogueId: PALACIO_DO_CREDOR_ARUA_DIALOGUE_ID })]),
    }),
    Object.freeze({
      id: 'event.final.palacio.eco-interagido',
      once: false,
      when: 'npc.interacted' as const,
      filter: Object.freeze({ field: 'npcId' as const, equals: PALACIO_DO_CREDOR_ECO_ID }),
      commands: Object.freeze([Object.freeze({ type: 'dialogue.start' as const, dialogueId: PALACIO_DO_CREDOR_ECO_DIALOGUE_ID })]),
    }),
    Object.freeze({
      id: 'event.final.palacio.sentinela-interagida',
      once: false,
      when: 'npc.interacted' as const,
      filter: Object.freeze({ field: 'npcId' as const, equals: PALACIO_DO_CREDOR_SENTINELA_ID }),
      commands: Object.freeze([Object.freeze({ type: 'dialogue.start' as const, dialogueId: PALACIO_DO_CREDOR_SENTINELA_DIALOGUE_ID })]),
    }),
    Object.freeze({
      id: PALACIO_DO_CREDOR_REFUSED_EVENT_ID,
      once: true,
      when: 'mission.completed' as const,
      filter: Object.freeze({ field: 'missionId' as const, equals: PALACIO_DO_CREDOR_MISSION_ID }),
      condition: Object.freeze({
        type: 'all' as const,
        conditions: Object.freeze([
          Object.freeze({ type: 'flag.equals' as const, flag: PALACIO_DO_CREDOR_REFUSED_FLAG, value: true }),
          Object.freeze({ type: 'flag.equals' as const, flag: PALACIO_DO_CREDOR_ACCEPTED_FLAG, value: false }),
        ]),
      }),
      commands: completionCommands(PALACIO_DO_CREDOR_EPILOGUE_REFUSED_DIALOGUE_ID),
    }),
    Object.freeze({
      id: PALACIO_DO_CREDOR_ACCEPTED_EVENT_ID,
      once: true,
      when: 'mission.completed' as const,
      filter: Object.freeze({ field: 'missionId' as const, equals: PALACIO_DO_CREDOR_MISSION_ID }),
      condition: Object.freeze({
        type: 'all' as const,
        conditions: Object.freeze([
          Object.freeze({ type: 'flag.equals' as const, flag: PALACIO_DO_CREDOR_ACCEPTED_FLAG, value: true }),
          Object.freeze({ type: 'flag.equals' as const, flag: PALACIO_DO_CREDOR_REFUSED_FLAG, value: false }),
        ]),
      }),
      commands: completionCommands(PALACIO_DO_CREDOR_EPILOGUE_ACCEPTED_DIALOGUE_ID),
    }),
    Object.freeze({
      id: PALACIO_DO_CREDOR_NEUTRAL_EVENT_ID,
      once: true,
      when: 'mission.completed' as const,
      filter: Object.freeze({ field: 'missionId' as const, equals: PALACIO_DO_CREDOR_MISSION_ID }),
      condition: Object.freeze({
        type: 'not' as const,
        condition: Object.freeze({
          type: 'any' as const,
          conditions: Object.freeze([
            Object.freeze({ type: 'flag.equals' as const, flag: PALACIO_DO_CREDOR_REFUSED_FLAG, value: true }),
            Object.freeze({ type: 'flag.equals' as const, flag: PALACIO_DO_CREDOR_ACCEPTED_FLAG, value: true }),
          ]),
        }),
      }),
      commands: completionCommands(PALACIO_DO_CREDOR_EPILOGUE_NEUTRAL_DIALOGUE_ID),
    }),
    Object.freeze({
      id: PALACIO_DO_CREDOR_EXIT_EVENT_ID,
      once: true,
      when: 'stage.exit.requested' as const,
      filter: Object.freeze({ field: 'exitId' as const, equals: PALACIO_DO_CREDOR_EXIT_ID }),
      condition: Object.freeze({
        type: 'flag.equals' as const,
        flag: PALACIO_DO_CREDOR_DEFEATED_FLAG,
        value: true,
      }),
      commands: Object.freeze([
        Object.freeze({ type: 'stage.complete' as const, exitId: PALACIO_DO_CREDOR_EXIT_ID }),
      ]),
    }),
  ]),
});
