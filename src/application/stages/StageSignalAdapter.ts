import type { NarrativeDomainEvent, StageSignal } from '../../narrative';
import type {
  GameNarrativeSession,
  GameNarrativeSessionResult,
} from './GameStageCompositionRoot';

const STABLE_LOCAL_ID = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;

export type GameplayNarrativeOccurrence =
  | {
      readonly type: 'enemy.defeated';
      readonly occurrenceId: string;
      readonly enemyId: string;
      readonly archetype: string;
    }
  | {
      readonly type: 'item.collected';
      readonly occurrenceId: string;
      readonly itemId: string;
      readonly itemType: string;
    }
  | {
      readonly type: 'encounter.completed';
      readonly occurrenceId: string;
      readonly encounterId: string;
    }
  | {
      readonly type: 'stage.exit.requested';
      readonly occurrenceId: string;
      readonly exitId: string;
    };

/**
 * Thin application adapter from confirmed gameplay facts to the existing
 * narrative runtime. It owns no quest rules, event bus or persistence state.
 */
export class StageSignalAdapter {
  public constructor(private readonly narrative: GameNarrativeSession) {}

  public dispatch(occurrence: GameplayNarrativeOccurrence): GameNarrativeSessionResult {
    const fields = this.fields(occurrence);
    if (fields.some(value => !STABLE_LOCAL_ID.test(value))) {
      return Object.freeze({
        ok: false as const,
        error: Object.freeze({
          code: 'invalid-event' as const,
          message: 'Gameplay narrative occurrences require stable non-empty ids.',
          referenceId: occurrence.occurrenceId,
        }),
      });
    }
    const event: NarrativeDomainEvent = Object.freeze({
      id: `gameplay.${occurrence.type.replaceAll('.', '-')}.${occurrence.occurrenceId}`,
      signal: this.signal(occurrence),
    });
    return this.narrative.processGameplayEvent(event);
  }

  private fields(occurrence: GameplayNarrativeOccurrence): readonly string[] {
    if (occurrence.type === 'enemy.defeated') {
      return [occurrence.occurrenceId, occurrence.enemyId, occurrence.archetype];
    }
    if (occurrence.type === 'item.collected') {
      return [occurrence.occurrenceId, occurrence.itemId, occurrence.itemType];
    }
    if (occurrence.type === 'encounter.completed') {
      return [occurrence.occurrenceId, occurrence.encounterId];
    }
    return [occurrence.occurrenceId, occurrence.exitId];
  }

  private signal(occurrence: GameplayNarrativeOccurrence): StageSignal {
    if (occurrence.type === 'enemy.defeated') return Object.freeze({
      type: occurrence.type,
      enemyId: occurrence.enemyId,
      archetype: occurrence.archetype,
    });
    if (occurrence.type === 'item.collected') return Object.freeze({
      type: occurrence.type,
      itemId: occurrence.itemId,
      itemType: occurrence.itemType,
    });
    if (occurrence.type === 'encounter.completed') return Object.freeze({
      type: occurrence.type,
      encounterId: occurrence.encounterId,
    });
    return Object.freeze({ type: occurrence.type, exitId: occurrence.exitId });
  }
}
