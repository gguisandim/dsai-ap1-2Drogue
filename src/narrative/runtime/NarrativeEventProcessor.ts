import type {
  NarrativeCommandBatch,
  NarrativeCommandExecutionResult,
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
const STABLE_LOCAL_ID = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;

/** Commands accepted by the contracts but executed by later stages (9.4B/9.4C). */
const DEFERRED_COMMAND_TYPES: ReadonlySet<StageCommand['type']> = new Set([
  'dialogue.start',
  'stage.complete',
]);

const KNOWN_COMMAND_TYPES: ReadonlySet<string> = new Set<StageCommand['type']>([
  'dialogue.start',
  'mission.start',
  'mission.advance',
  'flag.set',
  'exit.unlock',
  'stage.complete',
  'reward.grant',
]);

interface QueuedEvent {
  readonly id: string;
  readonly signal: StageSignal;
}

interface ExecutionContext {
  readonly working: NarrativeState;
  readonly progression: NarrativeProgressionView;
  readonly commands: StageCommand[];
  readonly deferredCommands: StageCommand[];
  readonly generatedSignals: StageSignal[];
  readonly queue: QueuedEvent[];
  commandCount: number;
  eventCount: number;
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
    if (typeof event.id !== 'string' || !STABLE_LOCAL_ID.test(event.id)) {
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
    const context: ExecutionContext = {
      working,
      progression,
      commands: [],
      deferredCommands: [],
      generatedSignals: [],
      queue: [{ id: rootEventId, signal: event.signal }],
      commandCount: 0,
      eventCount: 0,
    };
    const ran = this.runSignalQueue(context);
    if (!ran.ok) return ran;

    state.restore(working.snapshot());
    return success(cloneFrozen({
      status: 'processed' as const,
      eventId: rootEventId,
      commands: context.commands,
      generatedSignals: context.generatedSignals,
      snapshot: state.snapshot(),
    }));
  }

  /**
   * Applies dialogue commands atomically with durable per-occurrence
   * deduplication. Mirrors `process` command semantics without turning the
   * commands into fabricated domain events.
   */
  public executeCommands(
    batches: readonly NarrativeCommandBatch[],
    state: NarrativeState,
    progression: NarrativeProgressionView,
  ): NarrativeResult<NarrativeCommandExecutionResult, NarrativeOperationFailure> {
    for (const batch of batches) {
      if (typeof batch.occurrenceKey !== 'string' || !STABLE_LOCAL_ID.test(batch.occurrenceKey) ||
        typeof batch.causeId !== 'string' || !STABLE_LOCAL_ID.test(batch.causeId)) {
        return failure(this.error(
          'invalid-command',
          'Command batch requires a stable occurrenceKey and causeId.',
        ));
      }
    }

    const working = state.clone();
    const context: ExecutionContext = {
      working,
      progression,
      commands: [],
      deferredCommands: [],
      generatedSignals: [],
      queue: [],
      commandCount: 0,
      eventCount: 0,
    };
    const appliedCommandIds: string[] = [];
    const skippedCommandIds: string[] = [];

    for (const batch of batches) {
      const causeEventId = scopeNarrativeId(this.identity, 'event', batch.causeId);
      for (let index = 0; index < batch.commands.length; index += 1) {
        const command = batch.commands[index];
        if (!KNOWN_COMMAND_TYPES.has((command as { type: string }).type)) {
          return failure(this.error(
            'invalid-command',
            `Command type is not part of the narrative contracts: ${(command as { type: string }).type}.`,
            (command as { type: string }).type,
          ));
        }
        const commandId = scopeNarrativeId(
          this.identity,
          'command',
          `${batch.occurrenceKey}.${index}`,
        );
        if (working.hasAppliedCommand(commandId)) {
          skippedCommandIds.push(commandId);
          continue;
        }
        if (DEFERRED_COMMAND_TYPES.has(command.type)) {
          context.deferredCommands.push(command);
          continue;
        }
        working.markCommandApplied(commandId);
        const applied = this.applyCommand(context, command, causeEventId);
        if (!applied.ok) return applied;
        appliedCommandIds.push(commandId);
      }
    }

    const ran = this.runSignalQueue(context);
    if (!ran.ok) return ran;

    state.restore(working.snapshot());
    return success(cloneFrozen({
      status: appliedCommandIds.length > 0 ? 'applied' as const : 'duplicate' as const,
      appliedCommandIds,
      skippedCommandIds,
      deferredCommands: context.deferredCommands,
      commands: context.commands,
      generatedSignals: context.generatedSignals,
      snapshot: state.snapshot(),
    }));
  }

  private runSignalQueue(
    context: ExecutionContext,
  ): NarrativeResult<void, NarrativeOperationFailure> {
    while (context.queue.length > 0) {
      const current = context.queue.shift()!;
      if (context.working.hasProcessedEvent(current.id)) continue;
      context.eventCount += 1;
      if (context.eventCount > this.maximumEvents) {
        return failure(this.error('processing-limit', 'Narrative derived-event limit reached.', current.id));
      }
      context.working.markEventProcessed(current.id);

      const questResult = this.questEngine.handleSignal(current.signal, context.working);
      if (!questResult.ok) return questResult;
      for (const command of questResult.value.commands) {
        const applied = this.applyCommand(context, command, current.id);
        if (!applied.ok) return applied;
      }
      for (const missionId of questResult.value.completedMissionIds) {
        this.enqueueCompletion(context, missionId, current.id);
      }

      for (const rule of this.registry.listEventRules(this.stageId)) {
        if (rule.when !== current.signal.type || !signalMatches(current.signal, rule.filter)) continue;
        const ruleId = scopeNarrativeId(this.identity, 'rule', rule.id);
        if (rule.once && context.working.hasFiredRule(ruleId)) continue;
        if (rule.condition && !evaluateCondition(rule.condition, context.working.snapshot(), context.progression)) continue;
        if (rule.once) context.working.markRuleFired(ruleId);
        for (const command of rule.commands) {
          const applied = this.applyCommand(context, command, current.id);
          if (!applied.ok) return applied;
        }
      }
    }
    return success(undefined);
  }

  private enqueueCompletion(context: ExecutionContext, missionId: string, causeId: string): void {
    const signal: StageSignal = { type: 'mission.completed', missionId };
    context.generatedSignals.push(signal);
    context.queue.push({ id: `${causeId}.mission.${missionId}`, signal });
  }

  private applyCommand(
    context: ExecutionContext,
    command: StageCommand,
    causeId: string,
  ): NarrativeResult<void, NarrativeOperationFailure> {
    context.commandCount += 1;
    if (context.commandCount > this.maximumCommands) {
      return failure(this.error('processing-limit', 'Narrative command limit reached.'));
    }
    if (command.type === 'reward.grant') {
      const operationId = scopeNarrativeId(this.identity, 'operation', command.operationId);
      if (!context.working.markOperationApplied(operationId)) return success(undefined);
      const scopedCommand: StageCommand = cloneFrozen({ ...command, operationId });
      if (command.reward.type === 'stage.flag') {
        context.working.setFlag(command.reward.flag, command.reward.value);
      } else {
        context.working.queuePendingOperation({ operationId, reward: command.reward });
      }
      context.commands.push(scopedCommand);
      return success(undefined);
    }
    context.commands.push(command);
    if (command.type === 'flag.set') {
      context.working.setFlag(command.flag, command.value);
    } else if (command.type === 'exit.unlock') {
      context.working.unlockExit(command.exitId);
    } else if (command.type === 'mission.start') {
      const started = this.questEngine.start(command.missionId, context.working);
      if (!started.ok) return started;
    } else if (command.type === 'mission.advance') {
      const advanced = this.questEngine.advance(
        command.missionId,
        command.objectiveId,
        command.amount,
        context.working,
      );
      if (!advanced.ok) return advanced;
      for (const reward of advanced.value.commands) {
        const applied = this.applyCommand(context, reward, causeId);
        if (!applied.ok) return applied;
      }
      if (advanced.value.completed) this.enqueueCompletion(context, command.missionId, causeId);
    } else if (DEFERRED_COMMAND_TYPES.has(command.type)) {
      context.deferredCommands.push(command);
    }
    return success(undefined);
  }

  private error(code: NarrativeOperationFailure['code'], message: string, referenceId?: string): NarrativeOperationFailure {
    return cloneFrozen({ code, message, ...(referenceId ? { referenceId } : {}) });
  }
}
