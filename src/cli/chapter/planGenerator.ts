import type { ChapterTemplate } from '../../examples/chapter-template';
import type { StageEnemyArchetype } from '../../stages';
import type {
  StagePlan,
  StagePlanRegion,
  StagePlanTemplate,
} from './plan';

/**
 * Projects template geometry into the 9.10 authoring plan. The plan never
 * becomes runtime content; it describes the structure the generated chapter
 * already implements.
 */
export function createTemplateStagePlan(template: ChapterTemplate): StagePlan {
  const ids = template.ids;
  const geometry = template.geometry;
  const regionId = (key: string): string => `region.${ids.namespace}.${key}`;
  const regions: readonly StagePlanRegion[] = geometry.regions.map(region => Object.freeze({
    id: regionId(region.key),
    title: region.title,
    role: region.role,
    anchor: Object.freeze({ x: region.anchor.x, y: region.anchor.y }),
    connections: Object.freeze(region.connections.map(regionId)),
  }));
  const start = regions.find(region => region.role === 'start') ?? regions[0];
  const exits = regions.filter(region => region.role === 'exit');
  const objective = regions.find(region => region.role === 'objective') ??
    regions[regions.length - 2] ?? regions[0];
  const explore = regions.find(region => region.role === 'exploration') ?? objective;
  const combat = regions.find(region => region.role === 'combat') ?? objective;
  const objectiveId = `objective.${ids.namespace}.main`;
  const encounter = template.stage.encounter;
  const archetypes: readonly StageEnemyArchetype[] = encounter?.source.kind === 'authored-waves'
    ? [...new Set(encounter.source.waves.flatMap(wave => wave.enemies.map(enemy => enemy.type)))]
    : ['affinity', 'ranged'];
  return Object.freeze({
    schemaVersion: 1 as const,
    kind: 'umbra.stage-plan' as const,
    id: `plan.${ids.namespace}`,
    chapterId: ids.chapterId,
    stageId: ids.stageId,
    title: template.stage.manifest.title,
    summary: template.stage.manifest.summary,
    progression: geometry.template === 'branched' ? 'branched' as const : 'linear' as const,
    template: geometry.template as StagePlanTemplate,
    visualDirection: `Território contínuo do template ${geometry.template}; a paleta e a ambientação ficam em presentation.ts.`,
    startRegionId: start.id,
    exitRegionIds: Object.freeze(exits.map(region => region.id)),
    regions: Object.freeze(regions),
    objectives: Object.freeze([Object.freeze({
      id: objectiveId,
      title: 'Concluir o objetivo principal da travessia',
      missionId: ids.missionId,
      regionId: objective.id,
      unlocksExitIds: Object.freeze([ids.exitId]),
    })]),
    encounters: Object.freeze([Object.freeze({
      id: ids.encounterId,
      regionId: combat.id,
      archetypes: Object.freeze(archetypes),
      waveCount: encounter?.source.kind === 'authored-waves'
        ? encounter.source.waves.length
        : 1,
    })]),
    interactions: Object.freeze([
      Object.freeze({
        id: `interaction.${ids.namespace}.npc`,
        regionId: objective.id,
        kind: 'npc' as const,
        referenceId: ids.npcId,
      }),
      Object.freeze({
        id: `interaction.${ids.namespace}.dialogue`,
        regionId: objective.id,
        kind: 'dialogue' as const,
        referenceId: ids.dialogueId,
      }),
      Object.freeze({
        id: `interaction.${ids.namespace}.item`,
        regionId: explore.id,
        kind: 'item' as const,
        referenceId: 'health_herb',
      }),
    ]),
    exitConditions: Object.freeze(exits.map(region => Object.freeze({
      exitId: ids.exitId,
      regionId: region.id,
      requiresObjectiveIds: Object.freeze([objectiveId]),
    }))),
    capabilities: Object.freeze((template.stage.manifest.capabilities ?? []).map(capability =>
      Object.freeze({ ...capability }))),
  });
}
