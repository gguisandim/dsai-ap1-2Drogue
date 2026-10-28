import type {
  NarrativeContent,
  NarrativeDomainEvent,
  NarrativeEventProcessingResult,
  NarrativeOperationFailure,
  NarrativeProcessorOptions,
  NarrativeProgressionView,
  NarrativeRegistryFailure,
  NarrativeResult,
  NarrativeStateSnapshot,
} from '../contracts';
import { cloneFrozen, failure, success } from './data';
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
  private readonly progression: NarrativeProgressionView;

  private constructor(
    public readonly stageId: string,
    public readonly registry: NarrativeRegistry,
    public readonly state = new NarrativeState(),
    progression: NarrativeProgressionView = { level: 1, unlockedContent: [] },
    options: NarrativeProcessorOptions = {},
  ) {
    this.chapterId = registry.getChapterId(stageId)!;
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
    return success(new StageDirector(content.stageId, registry, new NarrativeState(initial), progression, options));
  }

  public process(event: NarrativeDomainEvent): NarrativeResult<NarrativeEventProcessingResult, NarrativeOperationFailure> {
    return this.events.process(event, this.state, this.progression);
  }

  public snapshot(): NarrativeStateSnapshot {
    return this.state.snapshot();
  }
}
