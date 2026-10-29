import type {
  DialogueResult,
  DialogueSession,
  DialogueTurn,
  NarrativeContent,
  NarrativeDomainEvent,
  NarrativeEventProcessingResult,
  NarrativeOperationFailure,
  NarrativeProcessorOptions,
  NarrativeProgressionView,
  NarrativeRegistryFailure,
  NarrativeResult,
  NarrativeStateSnapshot,
  StageCommand,
} from '../contracts';
import { cloneFrozen, failure, isStableId, success } from './data';
import { DialogueEngine } from './DialogueEngine';
import { NarrativeEventProcessor } from './NarrativeEventProcessor';
import { NarrativeRegistry } from './NarrativeRegistry';
import { NarrativeState } from './NarrativeState';
import { QuestEngine } from './QuestEngine';

export class StageDirector {
  public readonly chapterId: string;
  public readonly dialogues: DialogueEngine;
  public readonly quests: QuestEngine;
  public readonly events: NarrativeEventProcessor;
  public readonly identity: NarrativeProcessorOptions['identity'];
  private readonly progression: NarrativeProgressionView;

  private constructor(
    public readonly stageId: string,
    public readonly registry: NarrativeRegistry,
    public readonly state = new NarrativeState(),
    progression: NarrativeProgressionView = { level: 1, unlockedContent: [] },
    options: NarrativeProcessorOptions = {},
  ) {
    this.chapterId = registry.getChapterId(stageId)!;
    this.identity = options.identity;
    this.progression = cloneFrozen(progression);
    const definition = registry.getDefinition(stageId);
    for (const [flag, value] of Object.entries(definition?.flags ?? {})) {
      if (state.getFlag(flag) === undefined) state.setFlag(flag, value);
    }
    this.dialogues = new DialogueEngine(registry);
    this.quests = new QuestEngine(registry, stageId);
    this.quests.initialize(state);
    this.events = new NarrativeEventProcessor(registry, this.quests, stageId, options);
  }

  public static create(
    content: NarrativeContent,
    initial?: Partial<NarrativeStateSnapshot>,
    progression?: NarrativeProgressionView,
    options?: NarrativeProcessorOptions,
  ): NarrativeResult<StageDirector, NarrativeRegistryFailure> {
    const registry = new NarrativeRegistry();
    const registration = registry.register(content);
    if (!registration.ok) return failure(registration.error);
    const identity = options?.identity;
    if (identity && (!isStableId(identity.runId) || identity.chapterId !== content.chapterId ||
      identity.stageId !== content.stageId || !Number.isSafeInteger(identity.manifestRevision) ||
      identity.manifestRevision < 1)) {
      return failure({
        code: 'invalid-content',
        diagnostics: [{
          code: 'narrative.identity.invalid',
          message: 'Runtime identity must match the registered chapter and stage.',
          path: ['options', 'identity'],
        }],
      });
    }
    return success(new StageDirector(content.stageId, registry, new NarrativeState(initial), progression, options));
  }

  public process(event: NarrativeDomainEvent): NarrativeResult<NarrativeEventProcessingResult, NarrativeOperationFailure> {
    return this.events.process(event, this.state, this.progression);
  }

  public get progressionView(): NarrativeProgressionView {
    return this.progression;
  }

  /** Thin reuse of the existing DialogueEngine; no parallel dialogue rules. */
  public startDialogue(dialogueId: string): NarrativeResult<DialogueTurn, NarrativeOperationFailure> {
    return this.dialogues.start(dialogueId, this.state, this.progression);
  }

  public advanceDialogue(session: DialogueSession): NarrativeResult<DialogueResult, NarrativeOperationFailure> {
    return this.dialogues.continue(session, this.state, this.progression);
  }

  public snapshot(): NarrativeStateSnapshot {
    return this.state.snapshot();
  }

  public pendingRewardCommands(): readonly StageCommand[] {
    return Object.freeze(this.state.getPendingOperations().map(operation => Object.freeze({
      type: 'reward.grant' as const,
      operationId: operation.operationId,
      reward: operation.reward,
    })));
  }

  public acknowledgeOperation(
    operationId: string,
  ): NarrativeResult<void, NarrativeOperationFailure> {
    if (!this.state.acknowledgePendingOperation(operationId)) {
      return failure({
        code: 'operation-not-pending',
        message: `Reward operation is not pending: ${operationId}.`,
        referenceId: operationId,
      });
    }
    return success(undefined);
  }
}
