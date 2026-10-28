import type {
  NarrativeDomainEvent,
  NarrativeEventProcessingResult,
  NarrativeOperationFailure,
  NarrativeProcessorOptions,
  NarrativeProgressionView,
  NarrativeResult,
  StageCommand,
  StageSignal,
} from '../contracts';
import { evaluateCondition, signalMatches } from './conditions';
import { cloneFrozen, failure, success } from './data';
import { NarrativeRegistry } from './NarrativeRegistry';
import { NarrativeState } from './NarrativeState';
import { scopeNarrativeId } from './NarrativeIdentity';
import { QuestEngine } from './QuestEngine';

const DEFAULT_MAXIMUM_EVENTS = 128;
const DEFAULT_MAXIMUM_COMMANDS = 1024;

interface QueuedEvent {
  readonly id: string;
  readonly signal: StageSignal;
}

export class NarrativeEventProcessor {
  private readonly maximumEvents: number;
  private readonly maximumCommands: number;
  private readonly identity: NarrativeProcessorOptions['identity'];

  public constructor(
    private readonly registry: NarrativeRegistry,
    private readonly questEngine: QuestEngine,
    private readonly stageId?: string,
    options: NarrativeProcessorOptions = {},
  ) {
    this.maximumEvents = options.maximumEvents ?? DEFAULT_MAXIMUM_EVENTS;
    this.maximumCommands = options.maximumCommands ?? DEFAULT_MAXIMUM_COMMANDS;
    this.identity = options.identity;
  }

  public process(
    event: NarrativeDomainEvent,
    state: NarrativeState,
    progression: NarrativeProgressionView,
  ): NarrativeResult<NarrativeEventProcessingResult, NarrativeOperationFailure> {
    if (typeof event.id !== 'string' || !/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/.test(event.id)) {
      return failure(this.error('invalid-event', 'Narrative event requires a non-empty stable occurrence id.'));
    }
    const rootEventId = scopeNarrativeId(this.identity, 'event', event.id);
    if (state.hasProcessedEvent(rootEventId)) {
      return success(cloneFrozen({
        status: 'duplicate' as const,
        eventId: rootEventId,
        commands: [] as StageCommand[],
        generatedSignals: [] as StageSignal[],
        snapshot: state.snapshot(),
      }));
    }

    const working = state.clone();
    const queue: QueuedEvent[] = [{ id: rootEventId, signal: event.signal }];
    const commands: StageCommand[] = [];
    const generatedSignals: StageSignal[] = [];
    let eventCount = 0;
    let commandCount = 0;

    const enqueueCompletion = (missionId: string, causeId: string): void => {
      const signal: StageSignal = { type: 'mission.completed', missionId };
      generatedSignals.push(signal);
      queue.push({ id: `${causeId}.mission.${missionId}`, signal });
    };

    const applyCommand = (
      command: StageCommand,
      causeId: string,
    ): NarrativeResult<void, NarrativeOperationFailure> => {
      commandCount += 1;
      if (commandCount > this.maximumCommands) {
        return failure(this.error('processing-limit', 'Narrative command limit reached.'));
      }
      if (command.type === 'reward.grant') {
        const operationId = scopeNarrativeId(this.identity, 'operation', command.operationId);
        if (!working.markOperationApplied(operationId)) return success(undefined);
        const scopedCommand: StageCommand = cloneFrozen({ ...command, operationId });
        if (command.reward.type === 'stage.flag') {
          working.setFlag(command.reward.flag, command.reward.value);
        } else {
          working.queuePendingOperation({ operationId, reward: command.reward });
        }
        commands.push(scopedCommand);
        return success(undefined);
      }
      commands.push(command);
      if (command.type === 'flag.set') {
        working.setFlag(command.flag, command.value);
      } else if (command.type === 'exit.unlock') {
        working.unlockExit(command.exitId);
      } else if (command.type === 'mission.start') {
        const started = this.questEngine.start(command.missionId, working);
        if (!started.ok) return started;
      } else if (command.type === 'mission.advance') {
        const advanced = this.questEngine.advance(command.missionId, command.objectiveId, command.amount, working);
        if (!advanced.ok) return advanced;
        for (const reward of advanced.value.commands) {
          const applied = applyCommand(reward, causeId);
          if (!applied.ok) return applied;
        }
        if (advanced.value.completed) enqueueCompletion(command.missionId, causeId);
      }
      return success(undefined);
    };

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (working.hasProcessedEvent(current.id)) continue;
      eventCount += 1;
      if (eventCount > this.maximumEvents) {
        return failure(this.error('processing-limit', 'Narrative derived-event limit reached.', current.id));
      }
      working.markEventProcessed(current.id);

      const questResult = this.questEngine.handleSignal(current.signal, working);
      if (!questResult.ok) return questResult;
      for (const command of questResult.value.commands) {
        const applied = applyCommand(command, current.id);
        if (!applied.ok) return applied;
      }
      for (const missionId of questResult.value.completedMissionIds) {
        enqueueCompletion(missionId, current.id);
      }

      for (const rule of this.registry.listEventRules(this.stageId)) {
        if (rule.when !== current.signal.type || !signalMatches(current.signal, rule.filter)) continue;
        const ruleId = scopeNarrativeId(this.identity, 'rule', rule.id);
        if (rule.once && working.hasFiredRule(ruleId)) continue;
        if (rule.condition && !evaluateCondition(rule.condition, working.snapshot(), progression)) continue;
        if (rule.once) working.markRuleFired(ruleId);
        for (const command of rule.commands) {
          const applied = applyCommand(command, current.id);
          if (!applied.ok) return applied;
        }
      }
    }

    state.restore(working.snapshot());
    return success(cloneFrozen({
      status: 'processed' as const,
      eventId: rootEventId,
      commands,
      generatedSignals,
      snapshot: state.snapshot(),
    }));
  }

  private error(code: NarrativeOperationFailure['code'], message: string, referenceId?: string): NarrativeOperationFailure {
    return cloneFrozen({ code, message, ...(referenceId ? { referenceId } : {}) });
  }
}
