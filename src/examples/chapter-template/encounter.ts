import type { StageEncounterDefinition } from '../../stages';
import type { ChapterTemplateIds } from './ids';
import { TEMPLATE_ENEMY_POSITIONS } from './level';

/**
 * Declarative encounter: two existing archetypes in one authored wave. Wave
 * execution stays owned by gameplay; the template only declares data.
 */
export function createTemplateEncounter(ids: ChapterTemplateIds): StageEncounterDefinition {
  const [affinity, ranged] = TEMPLATE_ENEMY_POSITIONS;
  return Object.freeze({
    schemaVersion: 1 as const,
    id: ids.encounterId,
    start: 'stage-ready' as const,
    completion: 'all-waves-defeated' as const,
    scaling: 'stage-difficulty-floor' as const,
    source: Object.freeze({
      kind: 'authored-waves' as const,
      waves: Object.freeze([
        Object.freeze({
          id: 'wave.1',
          delayBeforeMs: 0,
          enemies: Object.freeze([
            Object.freeze({
              type: 'affinity' as const,
              x: affinity.x,
              y: affinity.y,
              level: 1,
              patrol: Object.freeze([
                Object.freeze({ x: affinity.x, y: affinity.y }),
                Object.freeze({ x: affinity.x + 1, y: affinity.y }),
              ]),
            }),
            Object.freeze({
              type: 'ranged' as const,
              x: ranged.x,
              y: ranged.y,
              level: 1,
            }),
          ]),
        }),
      ]),
    }),
  });
}
