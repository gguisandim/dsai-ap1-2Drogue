import type {
  StageCapabilityRequirement,
  StageModule,
} from '../../stages';
import type { ChapterTemplateIds } from './ids';
import { createTemplateEncounter } from './encounter';
import { createTemplateLevel, TEMPLATE_EXIT_POSITION } from './level';
import { createTemplateNarrative } from './narrative';
import { createTemplatePresentation } from './presentation';

const capability = (
  id: string,
  category: StageCapabilityRequirement['category'],
): StageCapabilityRequirement => Object.freeze({
  id,
  category,
  minimumVersion: 1,
  requirement: 'required' as const,
});

const STAGE_CAPABILITIES: readonly StageCapabilityRequirement[] = Object.freeze([
  capability('encounter.declarative', 'encounter'),
  capability('npc.authored', 'npc'),
  capability('npc.custom-sprite', 'npc'),
  capability('enemy.visual-variant', 'enemy'),
  capability('enemy.affinity', 'enemy'),
  capability('enemy.ranged', 'enemy'),
  capability('audio.level-music', 'audio'),
  capability('audio.level-ambience', 'audio'),
  capability('audio.stage-event-sfx', 'audio'),
  capability('lighting.level-ambience', 'lighting'),
  capability('effect.level-decoration', 'effect'),
  capability('effect.level-fog', 'effect'),
  capability('tile.custom-tileset', 'tile'),
]);

export interface TemplateStageOptions {
  readonly revision: number;
  readonly title: string;
  readonly summary: string;
}

export function createTemplateStage(
  ids: ChapterTemplateIds,
  options: TemplateStageOptions,
): StageModule {
  const narrative = createTemplateNarrative(ids);
  return Object.freeze({
    manifest: Object.freeze({
      schemaVersion: 1 as const,
      id: ids.stageId,
      revision: options.revision,
      chapterId: ids.chapterId,
      order: 0,
      title: options.title,
      summary: options.summary,
      layout: Object.freeze({ kind: 'authored' as const }),
      exits: Object.freeze([Object.freeze({
        id: ids.exitId,
        anchor: Object.freeze({ kind: 'tile' as const, ...TEMPLATE_EXIT_POSITION }),
        targetStageId: 'campaign.complete' as const,
        condition: Object.freeze({
          type: 'flag.equals' as const,
          flag: ids.flags.beaconLit,
          value: true,
        }),
      })]),
      completionMissionId: ids.missionId,
      capabilities: STAGE_CAPABILITIES,
      presentation: createTemplatePresentation(ids),
      campaignCatalog: Object.freeze({
        availability: 'available' as const,
        participation: 'individual-only' as const,
        role: 'standard' as const,
        regionIds: Object.freeze([ids.regionId]),
        biomeIds: Object.freeze(['crypt']),
        difficulty: Object.freeze({ minimum: 1, maximum: 1 }),
        revisit: 'checkpoint' as const,
      }),
      tags: Object.freeze(['example', 'template', 'authored', 'isolated']),
    }),
    authoredLevel: createTemplateLevel({
      stageId: ids.stageId,
      name: options.title,
      description: options.summary,
      ids,
    }),
    encounter: createTemplateEncounter(ids),
    narrative: narrative.definition,
    npcs: narrative.npcs,
    dialogues: narrative.dialogues,
    missions: narrative.missions,
    events: narrative.events,
  });
}
