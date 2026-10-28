import type { CampaignSaveIdentity, NarrativeContent } from '../narrative';

export function saveIdentity(overrides: Partial<CampaignSaveIdentity> = {}): CampaignSaveIdentity {
  return {
    campaignId: 'test.campaign',
    runId: 'test.run-1',
    runSeed: 'seed-731',
    chapterId: 'test.chapter',
    stageId: 'test.stage',
    manifestRevision: 3,
    ...overrides,
  };
}

export function narrativeContent(): NarrativeContent {
  return {
    chapterId: 'test.chapter',
    stageId: 'test.stage',
    definition: {
      entryDialogueId: 'test.welcome',
      flags: { 'test.ready': false },
    },
    exitIds: ['test.exit'],
    npcs: [{
      id: 'test.guide',
      displayName: 'Guide',
      role: 'story',
      presentationId: 'portrait.guide',
      spawn: { kind: 'player-spawn' },
      interactionDialogueId: 'test.welcome',
    }],
    dialogues: [{
      id: 'test.welcome',
      startNodeId: 'start',
      nodes: [
        {
          id: 'start',
          speakerId: 'test.guide',
          text: 'Choose a path.',
          onEnter: [{ type: 'flag.set', flag: 'test.seen', value: true }],
          choices: [
            { id: 'accept', text: 'Accept', nextNodeId: 'accepted', commands: [{ type: 'mission.start', missionId: 'test.talk' }] },
            {
              id: 'secret',
              text: 'Secret',
              condition: { type: 'flag.equals', flag: 'test.secret', value: true },
              nextNodeId: 'accepted',
            },
          ],
        },
        { id: 'accepted', speakerId: 'player', text: 'I accept.', nextNodeId: 'end' },
        { id: 'end', speakerId: 'narrator', text: 'The dialogue ends.' },
      ],
    }],
    missions: [
      {
        id: 'test.hunt',
        title: 'Hunt',
        description: 'Defeat two shades.',
        scope: 'stage',
        start: 'stage-enter',
        objectives: [{
          id: 'defeat.shades',
          description: 'Defeat shades.',
          signal: 'enemy.defeated',
          target: 2,
          filter: { field: 'archetype', equals: 'shade' },
        }, {
          id: 'find.relic',
          description: 'Optional relic.',
          signal: 'item.collected',
          target: 1,
          optional: true,
        }],
        rewards: [
          { type: 'progression.currency', amount: 10 },
          { type: 'stage.flag', flag: 'test.hunt-rewarded', value: true },
        ],
      },
      {
        id: 'test.chain',
        title: 'Chain',
        description: 'Observe the hunt completion.',
        scope: 'stage',
        start: 'event',
        objectives: [{
          id: 'observe.hunt',
          description: 'Observe completion.',
          signal: 'mission.completed',
          target: 1,
          filter: { field: 'missionId', equals: 'test.hunt' },
        }],
        rewards: [{ type: 'progression.unlock', contentId: 'test.chain-unlock' }],
      },
      {
        id: 'test.talk',
        title: 'Talk',
        description: 'Complete the welcome dialogue.',
        scope: 'stage',
        start: 'dialogue',
        objectives: [{
          id: 'complete.welcome',
          description: 'Complete the dialogue.',
          signal: 'dialogue.completed',
          target: 1,
          filter: { field: 'dialogueId', equals: 'test.welcome' },
        }],
      },
    ],
    events: [
      {
        id: 'test.start-chain',
        once: true,
        when: 'stage.entered',
        filter: { field: 'stageId', equals: 'test.stage' },
        commands: [{ type: 'mission.start', missionId: 'test.chain' }],
      },
      {
        id: 'test.guide-interaction',
        once: true,
        when: 'npc.interacted',
        filter: { field: 'npcId', equals: 'test.guide' },
        commands: [{ type: 'dialogue.start', dialogueId: 'test.welcome' }],
      },
      {
        id: 'test.hunt-complete',
        once: true,
        when: 'mission.completed',
        filter: { field: 'missionId', equals: 'test.hunt' },
        condition: { type: 'mission.status', missionId: 'test.hunt', status: 'completed' },
        commands: [{ type: 'exit.unlock', exitId: 'test.exit' }],
      },
      {
        id: 'test.relic-operation',
        once: false,
        when: 'item.collected',
        filter: { field: 'itemType', equals: 'relic' },
        commands: [{
          type: 'reward.grant',
          operationId: 'test.relic.reward',
          reward: { type: 'progression.currency', amount: 3 },
        }],
      },
    ],
  };
}

export const progression = Object.freeze({
  level: 1,
  unlockedContent: Object.freeze(['test.unlocked']),
});
