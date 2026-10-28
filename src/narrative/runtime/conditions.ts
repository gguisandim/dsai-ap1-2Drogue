import type { NarrativeProgressionView, NarrativeStateSnapshot, StageCondition, StageSignal } from '../contracts';

export function evaluateCondition(
  condition: StageCondition,
  state: NarrativeStateSnapshot,
  progression: NarrativeProgressionView,
): boolean {
  switch (condition.type) {
    case 'flag.equals':
      return state.flags[condition.flag] === condition.value;
    case 'mission.status':
      return state.missionStates[condition.missionId]?.status === condition.status;
    case 'progression.unlocked':
      return progression.unlockedContent.includes(condition.contentId);
    case 'all':
      return condition.conditions.every(child => evaluateCondition(child, state, progression));
    case 'any':
      return condition.conditions.some(child => evaluateCondition(child, state, progression));
    case 'not':
      return !evaluateCondition(condition.condition, state, progression);
  }
}

export function signalMatches(
  signal: StageSignal,
  filter: { readonly field: string; readonly equals: string } | undefined,
): boolean {
  if (!filter) return true;
  const value = (signal as unknown as Record<string, unknown>)[filter.field];
  return typeof value === 'string' && value === filter.equals;
}
