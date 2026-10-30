import type {
  DialogueChoiceOrigin,
  DialogueCompletion,
  DialogueEngineOptions,
  DialogueResult,
  DialogueSession,
  DialogueTurn,
  NarrativeOperationFailure,
  NarrativeProgressionView,
  NarrativeResult,
  StageCommand,
} from '../contracts';
import { cloneFrozen, failure, success } from './data';
import { evaluateCondition } from './conditions';
import { NarrativeRegistry } from './NarrativeRegistry';
import { NarrativeState } from './NarrativeState';

const DEFAULT_MAXIMUM_TRANSITIONS = 1024;

export class DialogueEngine {
  private readonly maximumTransitions: number;

  public constructor(
    private readonly registry: NarrativeRegistry,
    options: DialogueEngineOptions = {},
  ) {
    this.maximumTransitions = options.maximumTransitions ?? DEFAULT_MAXIMUM_TRANSITIONS;
  }

  public start(
    dialogueId: string,
    state: NarrativeState,
    progression: NarrativeProgressionView,
  ): NarrativeResult<DialogueTurn, NarrativeOperationFailure> {
    const dialogue = this.registry.getDialogue(dialogueId);
    if (!dialogue) return failure(this.error('dialogue-not-found', `Dialogue is not registered: ${dialogueId}.`, dialogueId));
    return success(this.enter(dialogue.id, dialogue.startNodeId, 0, state, progression, []));
  }

  public continue(
    session: DialogueSession,
    state: NarrativeState,
    progression: NarrativeProgressionView,
  ): NarrativeResult<DialogueResult, NarrativeOperationFailure> {
    const resolved = this.resolveSession(session);
    if (!resolved.ok) return resolved;
    const { dialogue, node } = resolved.value;
    if (node.choices && node.choices.length > 0) {
      return failure(this.error('invalid-transition', 'A dialogue choice is required.', node.id));
    }
    if (!node.nextNodeId) {
      const completion: DialogueCompletion = cloneFrozen({
        status: 'completed' as const,
        dialogueId: dialogue.id,
        newlyCompleted: state.completeDialogue(dialogue.id),
        commands: [] as StageCommand[],
      });
      return success(completion);
    }
    if (session.transitions >= this.maximumTransitions) {
      return failure(this.error('transition-limit', 'Dialogue transition limit reached.', dialogue.id));
    }
    return success(this.enter(dialogue.id, node.nextNodeId, session.transitions + 1, state, progression, []));
  }

  public choose(
    session: DialogueSession,
    choiceId: string,
    state: NarrativeState,
    progression: NarrativeProgressionView,
  ): NarrativeResult<DialogueTurn, NarrativeOperationFailure> {
    const resolved = this.resolveSession(session);
    if (!resolved.ok) return resolved;
    const { dialogue, node } = resolved.value;
    const choice = node.choices?.find(candidate => candidate.id === choiceId);
    if (!choice) return failure(this.error('choice-not-found', `Choice is not available on node ${node.id}: ${choiceId}.`, choiceId));
    if (choice.condition && !evaluateCondition(choice.condition, state.snapshot(), progression)) {
      return failure(this.error('choice-unavailable', `Choice condition is not satisfied: ${choiceId}.`, choiceId));
    }
    if (session.transitions >= this.maximumTransitions) {
      return failure(this.error('transition-limit', 'Dialogue transition limit reached.', dialogue.id));
    }
    state.recordChoice(dialogue.id, node.id, choice.id);
    return success(this.enter(
      dialogue.id,
      choice.nextNodeId,
      session.transitions + 1,
      state,
      progression,
      choice.commands ?? [],
      { nodeId: node.id, choiceId: choice.id },
    ));
  }

  private enter(
    dialogueId: string,
    nodeId: string,
    transitions: number,
    state: NarrativeState,
    progression: NarrativeProgressionView,
    precedingCommands: readonly StageCommand[],
    fromChoice?: DialogueChoiceOrigin,
  ): DialogueTurn {
    const dialogue = this.registry.getDialogue(dialogueId)!;
    const node = dialogue.nodes.find(candidate => candidate.id === nodeId)!;
    const snapshot = state.snapshot();
    const choices = (node.choices ?? [])
      .filter(choice => !choice.condition || evaluateCondition(choice.condition, snapshot, progression))
      .map(choice => ({ id: choice.id, text: choice.text }));
    return cloneFrozen({
      status: 'active' as const,
      session: { dialogueId, nodeId, transitions },
      node,
      choices,
      commands: [...precedingCommands, ...(node.onEnter ?? [])],
      choiceCommands: [...precedingCommands],
      nodeCommands: [...(node.onEnter ?? [])],
      ...(fromChoice ? { fromChoice } : {}),
    });
  }

  private resolveSession(session: DialogueSession): NarrativeResult<{
    readonly dialogue: NonNullable<ReturnType<NarrativeRegistry['getDialogue']>>;
    readonly node: NonNullable<ReturnType<NarrativeRegistry['getDialogue']>>['nodes'][number];
  }, NarrativeOperationFailure> {
    const dialogue = this.registry.getDialogue(session.dialogueId);
    const node = dialogue?.nodes.find(candidate => candidate.id === session.nodeId);
    if (!dialogue || !node || !Number.isSafeInteger(session.transitions) || session.transitions < 0) {
      return failure(this.error('dialogue-session-invalid', 'Dialogue session does not match registered content.', session.dialogueId));
    }
    return success({ dialogue, node });
  }

  private error(code: NarrativeOperationFailure['code'], message: string, referenceId?: string): NarrativeOperationFailure {
    return cloneFrozen({ code, message, ...(referenceId ? { referenceId } : {}) });
  }
}
