import type { StageModule } from '../../contracts';
import {
  createVeiledGardensLevelDefinition,
  VEILED_GARDENS_CLEARING,
  VEILED_GARDENS_EXIT,
  VEILED_GARDENS_FIRST_ENCOUNTER,
  VEILED_GARDENS_IARAI,
  VEILED_GARDENS_STAGE_ID,
  VEILED_GARDENS_TUCUM,
} from './veiledGardensMap';
import { VEILED_GARDENS_PRESENTATION } from './visuals';

export const VEILED_GARDENS_CHAPTER_ID = 'chapter.floresta.flores-veladas';
export const VEILED_GARDENS_EXIT_ID = 'exit.floresta.flores-veladas.complete';
export const VEILED_GARDENS_IARAI_ID = 'npc.floresta.flores-veladas.iarai';
export const VEILED_GARDENS_TUCUM_ID = 'npc.floresta.flores-veladas.tucum';
export const VEILED_GARDENS_IARAI_DIALOGUE_ID = 'dialogue.floresta.flores-veladas.iarai';
export const VEILED_GARDENS_TUCUM_DIALOGUE_ID = 'dialogue.floresta.flores-veladas.tucum';
export const VEILED_GARDENS_ENTRY_DIALOGUE_ID = 'dialogue.floresta.flores-veladas.entry';
export const VEILED_GARDENS_RESTORED_DIALOGUE_ID = 'dialogue.floresta.flores-veladas.restored';
export const VEILED_GARDENS_MISSION_ID = 'mission.floresta.flores-veladas.reacender-coro';
export const VEILED_GARDENS_ENCOUNTER_ID = 'encounter.floresta.flores-veladas.pollinators';
export const VEILED_GARDENS_RESTORED_FLAG = 'flag.floresta.flores-veladas.coro-restaurado';
export const VEILED_GARDENS_COMPLETION_EVENT_ID = 'event.floresta.flores-veladas.coro-restored';

export const VEILED_GARDENS_STAGE: StageModule = Object.freeze({
  manifest: Object.freeze({
    schemaVersion: 1 as const,
    id: VEILED_GARDENS_STAGE_ID,
    revision: 1,
    chapterId: VEILED_GARDENS_CHAPTER_ID,
    order: 0,
    title: 'Jardins das Flores Veladas',
    summary: 'Restaure o diálogo entre flores e polinizadores em uma travessia amazônica panorâmica.',
    layout: Object.freeze({ kind: 'authored' as const }),
    presentation: VEILED_GARDENS_PRESENTATION,
    exits: Object.freeze([Object.freeze({
      id: VEILED_GARDENS_EXIT_ID,
      anchor: Object.freeze({ kind: 'tile' as const, ...VEILED_GARDENS_EXIT }),
      targetStageId: 'campaign.complete' as const,
      condition: Object.freeze({ type: 'flag.equals' as const, flag: VEILED_GARDENS_RESTORED_FLAG, value: true }),
    })]),
    entryDialogueId: VEILED_GARDENS_ENTRY_DIALOGUE_ID,
    completionMissionId: VEILED_GARDENS_MISSION_ID,
    campaignCatalog: Object.freeze({
      availability: 'available' as const,
      participation: 'narrative-milestone' as const,
      role: 'milestone' as const,
      regionIds: Object.freeze(['region.floresta.flores']),
      biomeIds: Object.freeze(['garden']),
      difficulty: Object.freeze({ minimum: 3, maximum: 6 }),
      allowedActIds: Object.freeze(['act-2', 'act-3']),
      maximumPhysicalExits: 1 as const,
      revisit: 'checkpoint' as const,
      requiredEventIds: Object.freeze([]),
      requiredBeatIds: Object.freeze([]),
      providesBeatIds: Object.freeze(['beat.region.floresta.flores.restored']),
    }),
    capabilities: Object.freeze([
      Object.freeze({ id: 'navigation.authored-map', category: 'navigation' as const, minimumVersion: 1, requirement: 'required' as const }),
      Object.freeze({ id: 'navigation.physical-exit', category: 'navigation' as const, minimumVersion: 1, requirement: 'required' as const }),
      Object.freeze({ id: 'biome.garden', category: 'biome' as const, minimumVersion: 1, requirement: 'required' as const }),
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
    tags: Object.freeze(['amazon', 'forest', 'flowers', 'pollinators', 'authored', 'panoramic']),
  }),
  authoredLevel: Object.freeze(createVeiledGardensLevelDefinition()),
  encounter: Object.freeze({
    schemaVersion: 1 as const,
    id: VEILED_GARDENS_ENCOUNTER_ID,
    start: 'stage-ready' as const,
    completion: 'all-waves-defeated' as const,
    scaling: 'stage-difficulty-floor' as const,
    source: Object.freeze({
      kind: 'authored-waves' as const,
      waves: Object.freeze([
        Object.freeze({
          id: 'wave.floresta.flores-veladas.territorial-warning',
          delayBeforeMs: 0,
          enemies: Object.freeze([
            Object.freeze({ type: 'affinity' as const, x: VEILED_GARDENS_FIRST_ENCOUNTER.x - 2, y: VEILED_GARDENS_FIRST_ENCOUNTER.y, level: 2, patrol: Object.freeze([{ x: 62, y: 18 }, { x: 69, y: 20 }]) }),
            Object.freeze({ type: 'affinity' as const, x: VEILED_GARDENS_FIRST_ENCOUNTER.x + 2, y: VEILED_GARDENS_FIRST_ENCOUNTER.y + 1, level: 2 }),
          ]),
        }),
        Object.freeze({
          id: 'wave.floresta.flores-veladas.silent-clearing',
          delayBeforeMs: 0,
          enemies: Object.freeze([
            Object.freeze({ type: 'applaud' as const, x: VEILED_GARDENS_CLEARING.x, y: VEILED_GARDENS_CLEARING.y - 2, level: 3 }),
            Object.freeze({ type: 'affinity' as const, x: VEILED_GARDENS_CLEARING.x - 4, y: VEILED_GARDENS_CLEARING.y + 1, level: 2 }),
            Object.freeze({ type: 'affinity' as const, x: VEILED_GARDENS_CLEARING.x + 4, y: VEILED_GARDENS_CLEARING.y + 1, level: 3 }),
          ]),
        }),
      ]),
    }),
  }),
  narrative: Object.freeze({
    flags: Object.freeze({
      'flag.floresta.flores-veladas.entry-seen': false,
      [VEILED_GARDENS_RESTORED_FLAG]: false,
    }),
  }),
  npcs: Object.freeze([
    Object.freeze({ id: VEILED_GARDENS_IARAI_ID, displayName: 'Iaraí, Cantora das Flores', role: 'quest' as const, presentationId: 'environment.floresta.flores.iarai', spawn: Object.freeze({ kind: 'tile' as const, ...VEILED_GARDENS_IARAI }), interactionDialogueId: VEILED_GARDENS_IARAI_DIALOGUE_ID }),
    Object.freeze({ id: VEILED_GARDENS_TUCUM_ID, displayName: 'Tucum, Observador de Asas', role: 'ambient' as const, presentationId: 'environment.floresta.flores.tucum', spawn: Object.freeze({ kind: 'tile' as const, ...VEILED_GARDENS_TUCUM }), interactionDialogueId: VEILED_GARDENS_TUCUM_DIALOGUE_ID }),
  ]),
  dialogues: Object.freeze([
    Object.freeze({ id: VEILED_GARDENS_ENTRY_DIALOGUE_ID, startNodeId: 'perfume-still', nodes: Object.freeze([Object.freeze({ id: 'perfume-still', speakerId: 'narrator' as const, text: 'O perfume chega antes das flores. Adiante, folhas imóveis aguardam um som que não vem.' })]) }),
    Object.freeze({ id: VEILED_GARDENS_IARAI_DIALOGUE_ID, startNodeId: 'iarai-greeting', nodes: Object.freeze([
      Object.freeze({ id: 'iarai-greeting', speakerId: VEILED_GARDENS_IARAI_ID, text: 'Fale baixo. O jardim está escutando até o que esquecemos de dizer.', nextNodeId: 'player-asks-silence' }),
      Object.freeze({ id: 'player-asks-silence', speakerId: 'player' as const, text: 'As flores se fecharam por causa do silêncio?', nextNodeId: 'iarai-explains' }),
      Object.freeze({ id: 'iarai-explains', speakerId: VEILED_GARDENS_IARAI_ID, text: 'Elas florescem em resposta. Às asas, aos passos, ao chamado umas das outras. Quando os polinizadores se assustaram, cada espécie tentou cantar sozinha.', nextNodeId: 'iarai-mission' }),
      Object.freeze({ id: 'iarai-mission', speakerId: VEILED_GARDENS_IARAI_ID, text: 'Procure Tucum junto ao ninho. Observe antes de combater. Depois, leve o pulso de volta à clareira sem voz.' }),
    ]) }),
    Object.freeze({ id: VEILED_GARDENS_TUCUM_DIALOGUE_ID, startNodeId: 'tucum-listens', nodes: Object.freeze([
      Object.freeze({ id: 'tucum-listens', speakerId: VEILED_GARDENS_TUCUM_ID, text: 'Ouça entre um zumbido e outro: as flores estão respondendo fora de tempo.', nextNodeId: 'tucum-clue' }),
      Object.freeze({ id: 'tucum-clue', speakerId: VEILED_GARDENS_TUCUM_ID, text: 'Não persiga as criaturas. Abra espaço no caminho e o ninho retomará o ritmo. A clareira saberá que não está sozinha.' }),
    ]) }),
    Object.freeze({ id: VEILED_GARDENS_RESTORED_DIALOGUE_ID, startNodeId: 'garden-answers', nodes: Object.freeze([Object.freeze({ id: 'garden-answers', speakerId: 'narrator' as const, text: 'O primeiro acorde nasce sob os pés. Orquídeas se abrem em sequência, e a passagem do perfume reaparece entre as copas.' })]) }),
  ]),
  missions: Object.freeze([Object.freeze({
    id: VEILED_GARDENS_MISSION_ID,
    title: 'Reacender o coro',
    description: 'Reconecte flores e polinizadores para devolver o pulso à Clareira Sem Voz.',
    scope: 'stage' as const,
    start: 'stage-enter' as const,
    objectives: Object.freeze([
      Object.freeze({ id: 'objective.floresta.flores-veladas.ouvir-iarai', description: 'Converse com Iaraí.', signal: 'npc.interacted' as const, target: 1, filter: Object.freeze({ field: 'npcId' as const, equals: VEILED_GARDENS_IARAI_ID }) }),
      Object.freeze({ id: 'objective.floresta.flores-veladas.encontrar-tucum', description: 'Encontre Tucum junto ao ninho.', signal: 'npc.interacted' as const, target: 1, filter: Object.freeze({ field: 'npcId' as const, equals: VEILED_GARDENS_TUCUM_ID }), optional: true }),
      Object.freeze({ id: 'objective.floresta.flores-veladas.acalmar-jardim', description: 'Supere as defesas territoriais e restaure o ritmo do jardim.', signal: 'encounter.completed' as const, target: 1, filter: Object.freeze({ field: 'encounterId' as const, equals: VEILED_GARDENS_ENCOUNTER_ID }) }),
    ]),
    rewards: Object.freeze([
      Object.freeze({ type: 'progression.currency' as const, amount: 110 }),
      Object.freeze({ type: 'progression.unlock' as const, contentId: 'beat.region.floresta.flores.restored' }),
      Object.freeze({ type: 'stage.flag' as const, flag: VEILED_GARDENS_RESTORED_FLAG, value: true }),
    ]),
  })]),
  events: Object.freeze([
    Object.freeze({ id: 'event.floresta.flores-veladas.stage-entered', once: true, when: 'stage.entered' as const, filter: Object.freeze({ field: 'stageId' as const, equals: VEILED_GARDENS_STAGE_ID }), condition: Object.freeze({ type: 'flag.equals' as const, flag: 'flag.floresta.flores-veladas.entry-seen', value: false }), commands: Object.freeze([
      Object.freeze({ type: 'mission.start' as const, missionId: VEILED_GARDENS_MISSION_ID }),
      Object.freeze({ type: 'dialogue.start' as const, dialogueId: VEILED_GARDENS_ENTRY_DIALOGUE_ID }),
      Object.freeze({ type: 'flag.set' as const, flag: 'flag.floresta.flores-veladas.entry-seen', value: true }),
    ]) }),
    Object.freeze({ id: 'event.floresta.flores-veladas.iarai-interacted', once: false, when: 'npc.interacted' as const, filter: Object.freeze({ field: 'npcId' as const, equals: VEILED_GARDENS_IARAI_ID }), commands: Object.freeze([Object.freeze({ type: 'dialogue.start' as const, dialogueId: VEILED_GARDENS_IARAI_DIALOGUE_ID })]) }),
    Object.freeze({ id: 'event.floresta.flores-veladas.tucum-interacted', once: false, when: 'npc.interacted' as const, filter: Object.freeze({ field: 'npcId' as const, equals: VEILED_GARDENS_TUCUM_ID }), commands: Object.freeze([Object.freeze({ type: 'dialogue.start' as const, dialogueId: VEILED_GARDENS_TUCUM_DIALOGUE_ID })]) }),
    Object.freeze({ id: VEILED_GARDENS_COMPLETION_EVENT_ID, once: true, when: 'mission.completed' as const, filter: Object.freeze({ field: 'missionId' as const, equals: VEILED_GARDENS_MISSION_ID }), commands: Object.freeze([
      Object.freeze({ type: 'flag.set' as const, flag: VEILED_GARDENS_RESTORED_FLAG, value: true }),
      Object.freeze({ type: 'dialogue.start' as const, dialogueId: VEILED_GARDENS_RESTORED_DIALOGUE_ID }),
      Object.freeze({ type: 'exit.unlock' as const, exitId: VEILED_GARDENS_EXIT_ID }),
      Object.freeze({ type: 'stage.complete' as const, exitId: VEILED_GARDENS_EXIT_ID }),
      Object.freeze({ type: 'reward.grant' as const, reward: Object.freeze({ type: 'progression.unlock' as const, contentId: 'beat.region.floresta.flores.restored' }), operationId: 'operation.floresta.flores-veladas.restore.v1' }),
    ]) }),
  ]),
});
