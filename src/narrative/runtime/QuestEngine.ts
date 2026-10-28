import type {
  MissionDefinition,
  MissionState,
  NarrativeOperationFailure,
  NarrativeResult,
  QuestSignalResult,
  QuestTransition,
  StageCommand,
  StageSignal,
} from '../contracts';
import { signalMatches } from './conditions';
import { cloneFrozen, failure, success } from './data';
import { NarrativeRegistry } from './NarrativeRegistry';
import { NarrativeState } from './NarrativeState';

export class QuestEngine {
  public constructor(
    private readonly registry: NarrativeRegistry,
    private readonly stageId?: string,
  ) {}

  public initialize(state: NarrativeState): void {
    for (const mission of this.registry.listMissions(this.stageId)) {
      if (state.getMissionState(mission.id)) continue;
      state.setMissionState(mission.id, {
        status: mission.start === 'stage-enter' ? 'available' : 'locked',
        objectives: Object.fromEntries(mission.objectives.map(objective => [objective.id, 0])),
      });
    }
  }

  public start(missionId: string, state: NarrativeState): NarrativeResult<QuestTransition, NarrativeOperationFailure> {
    const mission = this.registry.getMission(missionId);
    if (!mission) return failure(this.error('mission-not-found', `Mission is not registered: ${missionId}.`, missionId));
    this.initialize(state);
    const current = state.getMissionState(missionId)!;
    if (current.status === 'active' || current.status === 'completed') {
      return success(this.transition(missionId, current.status, current.status, false, false, []));
    }
    if (current.status === 'failed') {
      return failure(this.error('invalid-transition', `Failed mission cannot be started: ${missionId}.`, missionId));
    }
    state.setMissionState(missionId, { ...current, status: 'active' });
    return success(this.transition(missionId, current.status, 'active', true, false, []));
  }

  public advance(
    missionId: string,
    objectiveId: string,
    amount: number,
    state: NarrativeState,
  ): NarrativeResult<QuestTransition, NarrativeOperationFailure> {
    const mission = this.registry.getMission(missionId);
    if (!mission) return failure(this.error('mission-not-found', `Mission is not registered: ${missionId}.`, missionId));
    const objective = mission.objectives.find(candidate => candidate.id === objectiveId);
    if (!objective) return failure(this.error('objective-not-found', `Objective is not registered: ${objectiveId}.`, objectiveId));
    if (!Number.isSafeInteger(amount) || amount <= 0) return failure(this.error('invalid-amount', 'Objective amount must be a positive safe integer.', objectiveId));
    this.initialize(state);
    const current = state.getMissionState(missionId)!;
    if (current.status === 'completed' || current.status === 'failed') {
      return success(this.transition(missionId, current.status, current.status, false, false, []));
    }
    if (current.status !== 'active') return failure(this.error('invalid-transition', `Mission is not active: ${missionId}.`, missionId));
    const previous = current.objectives[objectiveId] ?? 0;
    const next = Math.min(objective.target, previous + amount);
    if (next === previous) return success(this.transition(missionId, current.status, current.status, false, false, []));
    const objectives = { ...current.objectives, [objectiveId]: next };
    const completed = this.isCompleted(mission, objectives);
    const status: MissionState['status'] = completed ? 'completed' : 'active';
    state.setMissionState(missionId, { status, objectives });
    const commands = completed ? this.rewardCommands(mission) : [];
    return success(this.transition(missionId, current.status, status, true, completed, commands));
  }

  public fail(missionId: string, state: NarrativeState): NarrativeResult<QuestTransition, NarrativeOperationFailure> {
    const mission = this.registry.getMission(missionId);
    if (!mission) return failure(this.error('mission-not-found', `Mission is not registered: ${missionId}.`, missionId));
    this.initialize(state);
    const current = state.getMissionState(missionId)!;
    if (current.status === 'failed') return success(this.transition(missionId, 'failed', 'failed', false, false, []));
    if (current.status === 'completed') return failure(this.error('invalid-transition', `Completed mission cannot fail: ${missionId}.`, missionId));
    state.setMissionState(missionId, { ...current, status: 'failed' });
    return success(this.transition(missionId, current.status, 'failed', true, false, []));
  }

  public handleSignal(signal: StageSignal, state: NarrativeState): NarrativeResult<QuestSignalResult, NarrativeOperationFailure> {
    this.initialize(state);
    const transitions: QuestTransition[] = [];
    const commands: StageCommand[] = [];
    const completedMissionIds: string[] = [];
    if (signal.type === 'stage.entered') {
      for (const mission of this.registry.listMissions(this.stageId).filter(item => item.start === 'stage-enter')) {
        const result = this.start(mission.id, state);
        if (!result.ok) return result;
        if (result.value.changed) transitions.push(result.value);
      }
    }
    for (const mission of this.registry.listMissions(this.stageId)) {
      if (state.getMissionState(mission.id)?.status !== 'active') continue;
      for (const objective of mission.objectives) {
        if (objective.signal !== signal.type || !signalMatches(signal, objective.filter)) continue;
        const result = this.advance(mission.id, objective.id, 1, state);
        if (!result.ok) return result;
        if (result.value.changed) transitions.push(result.value);
        commands.push(...result.value.commands);
        if (result.value.completed) {
          completedMissionIds.push(mission.id);
          break;
        }
      }
    }
    return success(cloneFrozen({ transitions, commands, completedMissionIds }));
  }

  private isCompleted(mission: MissionDefinition, objectives: Readonly<Record<string, number>>): boolean {
    return mission.objectives.filter(objective => !objective.optional)
      .every(objective => (objectives[objective.id] ?? 0) >= objective.target);
  }

  private rewardCommands(mission: MissionDefinition): readonly StageCommand[] {
    return cloneFrozen((mission.rewards ?? []).map((reward, index) => ({
      type: 'reward.grant' as const,
      reward,
      operationId: `mission.${mission.id}.reward.${index}`,
    })));
  }

  private transition(
    missionId: string,
    previousStatus: MissionState['status'],
    status: MissionState['status'],
    changed: boolean,
    completed: boolean,
    commands: readonly StageCommand[],
  ): QuestTransition {
    return cloneFrozen({ missionId, previousStatus, status, changed, completed, commands });
  }

  private error(code: NarrativeOperationFailure['code'], message: string, referenceId?: string): NarrativeOperationFailure {
    return cloneFrozen({ code, message, ...(referenceId ? { referenceId } : {}) });
  }
}
