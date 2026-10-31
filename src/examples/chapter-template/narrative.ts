import type {
  DialogueDefinition,
  MissionDefinition,
  NarrativeDefinition,
  NpcDefinition,
  StageEventRule,
} from '../../narrative';
import type { ChapterTemplateIds } from './ids';
import { TEMPLATE_NPC_POSITION } from './level';

export interface TemplateNarrative {
  readonly definition: NarrativeDefinition;
  readonly npcs: readonly NpcDefinition[];
  readonly dialogues: readonly DialogueDefinition[];
  readonly missions: readonly MissionDefinition[];
  readonly events: readonly StageEventRule[];
}

/**
 * Only existing commands, signals and conditions are used:
 * dialogue.start, mission.start, flag.set, exit.unlock, reward.grant,
 * stage.complete, npc.interacted, encounter.completed, stage.entered and
 * stage.exit.requested.
 */
export function createTemplateNarrative(ids: ChapterTemplateIds): TemplateNarrative {
  return Object.freeze({
    definition: Object.freeze({
      flags: Object.freeze({
        [ids.flags.arrived]: false,
        [ids.flags.accepted]: false,
        [ids.flags.beaconLit]: false,
      }),
    }),
    npcs: Object.freeze([Object.freeze({
      id: ids.npcId,
      displayName: 'Guardião do Farol',
      role: 'quest' as const,
      presentationId: ids.visual.npcPresentationId,
      spawn: Object.freeze({ kind: 'tile' as const, ...TEMPLATE_NPC_POSITION }),
      interactionDialogueId: ids.dialogueId,
    })]),
    dialogues: Object.freeze([Object.freeze({
      id: ids.dialogueId,
      startNodeId: 'offer',
      nodes: Object.freeze([
        Object.freeze({
          id: 'offer',
          speakerId: ids.npcId,
          text: 'O farol de vidro guarda uma luz que se apaga. Você quer reacendê-la?',
          choices: Object.freeze([
            Object.freeze({
              id: 'accept',
              text: 'Aceitar e reacender o farol',
              nextNodeId: 'accepted',
              commands: Object.freeze([
                Object.freeze({
                  type: 'flag.set' as const,
                  flag: ids.flags.accepted,
                  value: true,
                }),
                Object.freeze({
                  type: 'mission.start' as const,
                  missionId: ids.missionId,
                }),
              ]),
            }),
            Object.freeze({
              id: 'observe',
              text: 'Observar antes de decidir',
              nextNodeId: 'observed',
            }),
          ]),
        }),
        Object.freeze({
          id: 'accepted',
          speakerId: 'narrator' as const,
          text: 'Enfrente as sombras que guardam o farol. A saída só responde à luz restaurada.',
        }),
        Object.freeze({
          id: 'observed',
          speakerId: 'player' as const,
          text: 'A luz pulsa, mas ainda espera. O guardião continua à minha frente.',
        }),
      ]),
    })]),
    missions: Object.freeze([Object.freeze({
      id: ids.missionId,
      title: 'Reacender o Farol de Vidro',
      description: 'Concluir o encontro que protege o farol.',
      scope: 'stage' as const,
      start: 'dialogue' as const,
      objectives: Object.freeze([Object.freeze({
        id: ids.objectiveId,
        description: 'Concluir o encontro do farol',
        signal: 'encounter.completed' as const,
        target: 1,
        filter: Object.freeze({ field: 'encounterId' as const, equals: ids.encounterId }),
      })]),
      rewards: Object.freeze([]),
    })]),
    events: Object.freeze([
      Object.freeze({
        id: ids.events.arrival,
        once: true,
        when: 'stage.entered' as const,
        filter: Object.freeze({ field: 'stageId' as const, equals: ids.stageId }),
        commands: Object.freeze([Object.freeze({
          type: 'flag.set' as const,
          flag: ids.flags.arrived,
          value: true,
        })]),
      }),
      Object.freeze({
        id: ids.events.warden,
        once: true,
        when: 'npc.interacted' as const,
        filter: Object.freeze({ field: 'npcId' as const, equals: ids.npcId }),
        commands: Object.freeze([Object.freeze({
          type: 'dialogue.start' as const,
          dialogueId: ids.dialogueId,
        })]),
      }),
      Object.freeze({
        id: ids.events.beaconLit,
        once: true,
        when: 'encounter.completed' as const,
        filter: Object.freeze({ field: 'encounterId' as const, equals: ids.encounterId }),
        condition: Object.freeze({
          type: 'mission.status' as const,
          missionId: ids.missionId,
          status: 'completed' as const,
        }),
        commands: Object.freeze([
          Object.freeze({
            type: 'flag.set' as const,
            flag: ids.flags.beaconLit,
            value: true,
          }),
          Object.freeze({
            type: 'exit.unlock' as const,
            exitId: ids.exitId,
          }),
          Object.freeze({
            type: 'reward.grant' as const,
            operationId: ids.rewardOperationId,
            reward: Object.freeze({
              type: 'progression.currency' as const,
              amount: 40,
            }),
          }),
        ]),
      }),
      Object.freeze({
        id: ids.events.depart,
        once: true,
        when: 'stage.exit.requested' as const,
        filter: Object.freeze({ field: 'exitId' as const, equals: ids.exitId }),
        condition: Object.freeze({
          type: 'flag.equals' as const,
          flag: ids.flags.beaconLit,
          value: true,
        }),
        commands: Object.freeze([Object.freeze({
          type: 'stage.complete' as const,
          exitId: ids.exitId,
        })]),
      }),
    ]),
  });
}
