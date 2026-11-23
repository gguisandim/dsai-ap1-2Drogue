import type { StageModule } from '../../contracts';
import {
  createMinasCorrompidasLevelDefinition,
  MINAS_CORROMPIDAS_AQUIFER,
  MINAS_CORROMPIDAS_BOSS,
  MINAS_CORROMPIDAS_EXIT,
  MINAS_CORROMPIDAS_LEDGER,
  MINAS_CORROMPIDAS_MAIRA,
  MINAS_CORROMPIDAS_NILO,
  MINAS_CORROMPIDAS_STAGE_ID,
} from './minasCorrompidasMap';
import { MINAS_PRESENTATION, MINAS_PRESENTATION_VARIANTS } from './visuals';

export const MINAS_CORROMPIDAS_CHAPTER_ID = 'chapter.corrupted.minas';
export const MINAS_CORROMPIDAS_REGION_ID = 'region.corrupted.minas';
export const MINAS_CORROMPIDAS_EXIT_ID = 'exit.corrupted.minas.to-surface';
export const MINAS_CORROMPIDAS_MISSION_ID = 'mission.corrupted.minas.subsolo-da-divida';
export const MINAS_CORROMPIDAS_ENCOUNTER_ID = 'encounter.corrupted.minas.core';
export const MINAS_CORROMPIDAS_ENTRY_DIALOGUE_ID = 'dialogue.corrupted.minas.descent';
export const MINAS_CORROMPIDAS_MAIRA_ID = 'npc.corrupted.minas.maira';
export const MINAS_CORROMPIDAS_NILO_ID = 'npc.corrupted.minas.nilo-vestige';
export const MINAS_CORROMPIDAS_AQUIFER_ID = 'npc.corrupted.minas.aquifer-evidence';
export const MINAS_CORROMPIDAS_LEDGER_ID = 'npc.corrupted.minas.creditor-ledger';
export const MINAS_CORROMPIDAS_MAIRA_DIALOGUE_ID = 'dialogue.corrupted.minas.maira';
export const MINAS_CORROMPIDAS_NILO_DIALOGUE_ID = 'dialogue.corrupted.minas.nilo';
export const MINAS_CORROMPIDAS_AQUIFER_DIALOGUE_ID = 'dialogue.corrupted.minas.aquifer';
export const MINAS_CORROMPIDAS_LEDGER_DIALOGUE_ID = 'dialogue.corrupted.minas.ledger';
export const MINAS_CORROMPIDAS_ENTERED_FLAG = 'flag.corrupted.minas.descent-seen';
export const MINAS_CORROMPIDAS_CORE_FLAG = 'flag.corrupted.minas.core-stilled';
export const MINAS_CORROMPIDAS_DISCOVERY_BEAT = 'beat.corrupted.minas.creditor-ledger';
export const MINAS_CORROMPIDAS_COMPLETION_EVENT_ID = 'event.corrupted.minas.core-stilled';
export const MINAS_CORROMPIDAS_EXIT_EVENT_ID = 'event.corrupted.minas.exit';

const anchor = (point: Readonly<{ x: number; y: number }>) =>
  Object.freeze({ kind: 'tile' as const, x: point.x, y: point.y });

export const MINAS_CORROMPIDAS_STAGE: StageModule = Object.freeze({
  manifest: Object.freeze({
    schemaVersion: 1 as const,
    id: MINAS_CORROMPIDAS_STAGE_ID,
    revision: 1,
    chapterId: MINAS_CORROMPIDAS_CHAPTER_ID,
    order: 0,
    title: 'Minas Corrompidas',
    summary: 'Investigue a Mina Açu, interrompa o Coração de Lastro e recupere a prova que conduz ao Credor.',
    layout: Object.freeze({ kind: 'authored' as const }),
    presentation: MINAS_PRESENTATION,
    presentationVariants: MINAS_PRESENTATION_VARIANTS,
    exits: Object.freeze([Object.freeze({
      id: MINAS_CORROMPIDAS_EXIT_ID,
      anchor: anchor(MINAS_CORROMPIDAS_EXIT),
      targetStageId: 'campaign.complete' as const,
      condition: Object.freeze({ type: 'flag.equals' as const, flag: MINAS_CORROMPIDAS_CORE_FLAG, value: true }),
    })]),
    entryDialogueId: MINAS_CORROMPIDAS_ENTRY_DIALOGUE_ID,
    completionMissionId: MINAS_CORROMPIDAS_MISSION_ID,
    campaignCatalog: Object.freeze({
      availability: 'available' as const,
      participation: 'individual-only' as const,
      role: 'standard' as const,
      regionIds: Object.freeze([MINAS_CORROMPIDAS_REGION_ID]),
      biomeIds: Object.freeze(['crypt']),
      difficulty: Object.freeze({ minimum: 6, maximum: 9 }),
      allowedActIds: Object.freeze(['act-3']),
      maximumPhysicalExits: 1 as const,
      revisit: 'checkpoint' as const,
      requiredEventIds: Object.freeze([]),
      requiredBeatIds: Object.freeze([]),
      providesBeatIds: Object.freeze([MINAS_CORROMPIDAS_DISCOVERY_BEAT]),
    }),
    capabilities: Object.freeze([
      Object.freeze({ id: 'navigation.authored-map', category: 'navigation' as const, minimumVersion: 1, requirement: 'required' as const }),
      Object.freeze({ id: 'navigation.physical-exit', category: 'navigation' as const, minimumVersion: 1, requirement: 'required' as const }),
      Object.freeze({ id: 'biome.crypt', category: 'biome' as const, minimumVersion: 1, requirement: 'required' as const }),
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
    tags: Object.freeze(['amazon', 'mine', 'corrupted', 'authored', 'panoramic', 'investigation']),
  }),
  authoredLevel: Object.freeze(createMinasCorrompidasLevelDefinition()),
  encounter: Object.freeze({
    schemaVersion: 1 as const,
    id: MINAS_CORROMPIDAS_ENCOUNTER_ID,
    start: 'stage-ready' as const,
    completion: 'all-waves-defeated' as const,
    scaling: 'stage-difficulty-floor' as const,
    source: Object.freeze({
      kind: 'authored-waves' as const,
      waves: Object.freeze([
        Object.freeze({ id: 'wave.corrupted.minas.territorial', delayBeforeMs: 0, enemies: Object.freeze([
          Object.freeze({ type: 'affinity' as const, x: 47, y: 24, level: 4, patrol: Object.freeze([{ x: 44, y: 23 }, { x: 52, y: 24 }]) }),
        ]) }),
        Object.freeze({ id: 'wave.corrupted.minas.mineralized', delayBeforeMs: 0, enemies: Object.freeze([
          Object.freeze({ type: 'applaud' as const, x: 91, y: 31, level: 5 }),
          Object.freeze({ type: 'ranged' as const, x: 101, y: 32, level: 5 }),
        ]) }),
        Object.freeze({ id: 'wave.corrupted.minas.guardian', delayBeforeMs: 0, enemies: Object.freeze([
          Object.freeze({ type: 'miniboss' as const, x: 116, y: 31, level: 6, hp: 340 }),
        ]) }),
        Object.freeze({ id: 'wave.corrupted.minas.core', delayBeforeMs: 0, enemies: Object.freeze([
          Object.freeze({ type: 'boss' as const, x: MINAS_CORROMPIDAS_BOSS.x, y: MINAS_CORROMPIDAS_BOSS.y, level: 7, hp: 680 }),
        ]) }),
      ]),
    }),
  }),
  narrative: Object.freeze({ flags: Object.freeze({
    [MINAS_CORROMPIDAS_ENTERED_FLAG]: false,
    [MINAS_CORROMPIDAS_CORE_FLAG]: false,
  }) }),
  npcs: Object.freeze([
    Object.freeze({ id: MINAS_CORROMPIDAS_MAIRA_ID, displayName: 'Maíra, Guardiã das Galerias', role: 'quest' as const, presentationId: 'environment.corrupted.minas.maira', spawn: anchor(MINAS_CORROMPIDAS_MAIRA), interactionDialogueId: MINAS_CORROMPIDAS_MAIRA_DIALOGUE_ID }),
    Object.freeze({ id: MINAS_CORROMPIDAS_NILO_ID, displayName: 'Vestígio de Nilo', role: 'story' as const, presentationId: 'environment.corrupted.minas.nilo', spawn: anchor(MINAS_CORROMPIDAS_NILO), interactionDialogueId: MINAS_CORROMPIDAS_NILO_DIALOGUE_ID }),
    Object.freeze({ id: MINAS_CORROMPIDAS_AQUIFER_ID, displayName: 'Memória do Aquífero', role: 'ambient' as const, presentationId: 'environment.corrupted.minas.aquifer', spawn: anchor(MINAS_CORROMPIDAS_AQUIFER), interactionDialogueId: MINAS_CORROMPIDAS_AQUIFER_DIALOGUE_ID }),
    Object.freeze({ id: MINAS_CORROMPIDAS_LEDGER_ID, displayName: 'Lâmina do Livro-Caixa', role: 'story' as const, presentationId: 'environment.corrupted.minas.ledger', spawn: anchor(MINAS_CORROMPIDAS_LEDGER), interactionDialogueId: MINAS_CORROMPIDAS_LEDGER_DIALOGUE_ID }),
  ]),
  dialogues: Object.freeze([
    Object.freeze({ id: MINAS_CORROMPIDAS_ENTRY_DIALOGUE_ID, startNodeId: 'descida', nodes: Object.freeze([
      Object.freeze({ id: 'descida', speakerId: 'narrator' as const, text: 'Sob a copa, trilhos desaparecem na pedra. A água traz gosto de metal, e as raízes descem como quem procura uma dívida antiga.' }),
    ]) }),
    Object.freeze({ id: MINAS_CORROMPIDAS_MAIRA_DIALOGUE_ID, startNodeId: 'maira-limite', nodes: Object.freeze([
      Object.freeze({ id: 'maira-limite', speakerId: MINAS_CORROMPIDAS_MAIRA_ID, text: 'Antes, cada cesto de arumã tinha um limite. Parte da energia voltava ao solo, e ninguém abria galeria perto da água.', nextNodeId: 'maira-metas' }),
      Object.freeze({ id: 'maira-metas', speakerId: MINAS_CORROMPIDAS_MAIRA_ID, text: 'O Credor chamou limite de desperdício. Trocou devolução por meta e pôs o aquífero como garantia.', nextNodeId: 'maira-missao' }),
      Object.freeze({ id: 'maira-missao', speakerId: MINAS_CORROMPIDAS_MAIRA_ID, text: 'Procure Nilo, escute a água e pare o bombeamento no núcleo. Não confunda silêncio com cura.' }),
    ]) }),
    Object.freeze({ id: MINAS_CORROMPIDAS_NILO_DIALOGUE_ID, startNodeId: 'nilo-trabalho', nodes: Object.freeze([
      Object.freeze({ id: 'nilo-trabalho', speakerId: MINAS_CORROMPIDAS_NILO_ID, text: 'A mina também foi sustento. Fizemos escola, posto e canoa com o primeiro arumã. Não começamos querendo ferir o chão.', nextNodeId: 'nilo-adiantamento' }),
      Object.freeze({ id: 'nilo-adiantamento', speakerId: MINAS_CORROMPIDAS_NILO_ID, text: 'Depois vieram os adiantamentos. Para pagar máquina, cavávamos mais fundo; quanto mais fundo, maior a dívida da máquina.', nextNodeId: 'nilo-residuo' }),
      Object.freeze({ id: 'nilo-residuo', speakerId: MINAS_CORROMPIDAS_NILO_ID, text: 'Quando a pedra começou a respirar, mandaram registrar como ganho de produtividade.' }),
    ]) }),
    Object.freeze({ id: MINAS_CORROMPIDAS_AQUIFER_DIALOGUE_ID, startNodeId: 'agua-memoria', nodes: Object.freeze([
      Object.freeze({ id: 'agua-memoria', speakerId: 'narrator' as const, text: 'Na lâmina d’água, larvas carregam placas minerais. A corrente foi desviada três vezes; cada desvio coincide com uma marca de penhora.', nextNodeId: 'agua-consequencia' }),
      Object.freeze({ id: 'agua-consequencia', speakerId: 'narrator' as const, text: 'Não são invasoras. São habitantes da mina, transformados pelo resíduo que a produção declarou inexistente.' }),
    ]) }),
    Object.freeze({ id: MINAS_CORROMPIDAS_LEDGER_DIALOGUE_ID, startNodeId: 'livro-garantia', nodes: Object.freeze([
      Object.freeze({ id: 'livro-garantia', speakerId: 'narrator' as const, text: 'A lâmina do livro-caixa nomeia água, raiz e memória como garantias transferidas ao Palácio do Credor.', nextNodeId: 'livro-rota' }),
      Object.freeze({ id: 'livro-rota', speakerId: MINAS_CORROMPIDAS_MAIRA_ID, text: 'Então o núcleo não era o destino. Era a cobrança. Leve essa prova ao Palácio — e lembre que desligar a máquina não devolve sozinho o que ela tomou.' }),
    ]) }),
  ]),
  missions: Object.freeze([Object.freeze({
    id: MINAS_CORROMPIDAS_MISSION_ID,
    title: 'O Subsolo da Dívida',
    description: 'Reconstrua a história da Mina Açu, investigue sua transformação e interrompa o Coração de Lastro.',
    scope: 'stage' as const,
    start: 'stage-enter' as const,
    objectives: Object.freeze([
      // The mandatory NPC witness is declared first so a single-NPC runtime
      // driver (homologation) exercises the objective that gates completion.
      Object.freeze({ id: 'objective.corrupted.minas.hear-maira', description: 'Conheça o pacto original com Maíra.', signal: 'npc.interacted' as const, target: 1, filter: Object.freeze({ field: 'npcId' as const, equals: MINAS_CORROMPIDAS_MAIRA_ID }) }),
      Object.freeze({ id: 'objective.corrupted.minas.still-core', description: 'Interrompa o Coração de Lastro.', signal: 'encounter.completed' as const, target: 1, filter: Object.freeze({ field: 'encounterId' as const, equals: MINAS_CORROMPIDAS_ENCOUNTER_ID }) }),
      Object.freeze({ id: 'objective.corrupted.minas.find-nilo', description: 'Encontre o vestígio de Nilo nas galerias.', optional: true, signal: 'npc.interacted' as const, target: 1, filter: Object.freeze({ field: 'npcId' as const, equals: MINAS_CORROMPIDAS_NILO_ID }) }),
      Object.freeze({ id: 'objective.corrupted.minas.read-aquifer', description: 'Examine a evidência no aquífero.', optional: true, signal: 'npc.interacted' as const, target: 1, filter: Object.freeze({ field: 'npcId' as const, equals: MINAS_CORROMPIDAS_AQUIFER_ID }) }),
      Object.freeze({ id: 'objective.corrupted.minas.read-ledger', description: 'Registre a prova que liga a mina ao Credor.', optional: true, signal: 'npc.interacted' as const, target: 1, filter: Object.freeze({ field: 'npcId' as const, equals: MINAS_CORROMPIDAS_LEDGER_ID }) }),
    ]),
    rewards: Object.freeze([
      Object.freeze({ type: 'progression.currency' as const, amount: 450 }),
      Object.freeze({ type: 'stage.flag' as const, flag: MINAS_CORROMPIDAS_CORE_FLAG, value: true }),
    ]),
  })]),
  events: Object.freeze([
    Object.freeze({ id: 'event.corrupted.minas.entered', once: true, when: 'stage.entered' as const, filter: Object.freeze({ field: 'stageId' as const, equals: MINAS_CORROMPIDAS_STAGE_ID }), condition: Object.freeze({ type: 'flag.equals' as const, flag: MINAS_CORROMPIDAS_ENTERED_FLAG, value: false }), commands: Object.freeze([
      Object.freeze({ type: 'mission.start' as const, missionId: MINAS_CORROMPIDAS_MISSION_ID }),
      Object.freeze({ type: 'dialogue.start' as const, dialogueId: MINAS_CORROMPIDAS_ENTRY_DIALOGUE_ID }),
      Object.freeze({ type: 'flag.set' as const, flag: MINAS_CORROMPIDAS_ENTERED_FLAG, value: true }),
    ]) }),
    // The revelation is delivered by the ledger NPC interaction (optional
    // discovery). Completion must not open a blocking dialogue: the runtime
    // pauses physics while a dialogue is open, which would strand the player
    // away from the now-unlocked exit.
    Object.freeze({ id: MINAS_CORROMPIDAS_COMPLETION_EVENT_ID, once: true, when: 'mission.completed' as const, filter: Object.freeze({ field: 'missionId' as const, equals: MINAS_CORROMPIDAS_MISSION_ID }), commands: Object.freeze([
      Object.freeze({ type: 'flag.set' as const, flag: MINAS_CORROMPIDAS_CORE_FLAG, value: true }),
      Object.freeze({ type: 'exit.unlock' as const, exitId: MINAS_CORROMPIDAS_EXIT_ID }),
      Object.freeze({ type: 'reward.grant' as const, reward: Object.freeze({ type: 'progression.unlock' as const, contentId: MINAS_CORROMPIDAS_DISCOVERY_BEAT }), operationId: 'operation.corrupted.minas.creditor-ledger.v1' }),
    ]) }),
    Object.freeze({ id: MINAS_CORROMPIDAS_EXIT_EVENT_ID, once: true, when: 'stage.exit.requested' as const, filter: Object.freeze({ field: 'exitId' as const, equals: MINAS_CORROMPIDAS_EXIT_ID }), condition: Object.freeze({ type: 'flag.equals' as const, flag: MINAS_CORROMPIDAS_CORE_FLAG, value: true }), commands: Object.freeze([
      Object.freeze({ type: 'stage.complete' as const, exitId: MINAS_CORROMPIDAS_EXIT_ID }),
    ]) }),
  ]),
});

