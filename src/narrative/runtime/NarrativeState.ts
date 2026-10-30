import type {
  MissionState,
  NarrativeStateSnapshot,
  PendingRewardOperation,
  StageCompletionRecord,
} from '../contracts';
import { cloneFrozen, compareStrings } from './data';

type Scalar = boolean | number | string;

export class NarrativeState {
  private flags: Record<string, Scalar> = {};
  private choices: Record<string, Record<string, string>> = {};
  private completedDialogueIds = new Set<string>();
  private missionStates: Record<string, MissionState> = {};
  private processedEventIds = new Set<string>();
  private firedRuleIds = new Set<string>();
  private appliedOperationIds = new Set<string>();
  private appliedCommandIds = new Set<string>();
  private pendingOperations = new Map<string, PendingRewardOperation>();
  private unlockedExitIds = new Set<string>();
  private completedStageOccurrences = new Map<string, StageCompletionRecord>();

  public constructor(initial?: Partial<NarrativeStateSnapshot>) {
    if (initial) this.restore(initial);
  }

  public static fromSnapshot(snapshot: NarrativeStateSnapshot): NarrativeState {
    return new NarrativeState(snapshot);
  }

  public clone(): NarrativeState {
    return NarrativeState.fromSnapshot(this.snapshot());
  }

  public restore(snapshot: Partial<NarrativeStateSnapshot>): void {
    this.flags = { ...(snapshot.flags ?? {}) };
    this.choices = Object.fromEntries(Object.entries(snapshot.choices ?? {})
      .map(([dialogueId, choices]) => [dialogueId, { ...choices }]));
    this.completedDialogueIds = new Set(snapshot.completedDialogueIds ?? []);
    this.missionStates = Object.fromEntries(Object.entries(snapshot.missionStates ?? {})
      .map(([missionId, state]) => [missionId, {
        status: state.status,
        objectives: { ...state.objectives },
      }]));
    this.processedEventIds = new Set(snapshot.processedEventIds ?? []);
    this.firedRuleIds = new Set(snapshot.firedRuleIds ?? []);
    this.appliedOperationIds = new Set(snapshot.appliedOperationIds ?? []);
    this.appliedCommandIds = new Set(snapshot.appliedCommandIds ?? []);
    this.pendingOperations = new Map((snapshot.pendingOperations ?? [])
      .map(operation => [operation.operationId, cloneFrozen(operation)]));
    this.unlockedExitIds = new Set(snapshot.unlockedExitIds ?? []);
    this.completedStageOccurrences = new Map((snapshot.completedStageOccurrences ?? [])
      .map(completion => [completion.occurrenceId, cloneFrozen(completion)]));
  }

  public getFlag(flag: string): Scalar | undefined {
    return this.flags[flag];
  }

  public setFlag(flag: string, value: Scalar): void {
    this.flags[flag] = value;
  }

  public recordChoice(dialogueId: string, nodeId: string, choiceId: string): void {
    (this.choices[dialogueId] ??= {})[nodeId] = choiceId;
  }

  public completeDialogue(dialogueId: string): boolean {
    const wasCompleted = this.completedDialogueIds.has(dialogueId);
    this.completedDialogueIds.add(dialogueId);
    return !wasCompleted;
  }

  public getMissionState(missionId: string): MissionState | undefined {
    const state = this.missionStates[missionId];
    return state ? cloneFrozen(state) : undefined;
  }

  public setMissionState(missionId: string, state: MissionState): void {
    this.missionStates[missionId] = {
      status: state.status,
      objectives: { ...state.objectives },
    };
  }

  public hasProcessedEvent(eventId: string): boolean {
    return this.processedEventIds.has(eventId);
  }

  public markEventProcessed(eventId: string): boolean {
    const fresh = !this.processedEventIds.has(eventId);
    this.processedEventIds.add(eventId);
    return fresh;
  }

  public hasFiredRule(ruleId: string): boolean {
    return this.firedRuleIds.has(ruleId);
  }

  public markRuleFired(ruleId: string): boolean {
    const fresh = !this.firedRuleIds.has(ruleId);
    this.firedRuleIds.add(ruleId);
    return fresh;
  }

  public hasAppliedOperation(operationId: string): boolean {
    return this.appliedOperationIds.has(operationId);
  }

  public markOperationApplied(operationId: string): boolean {
    const fresh = !this.appliedOperationIds.has(operationId);
    this.appliedOperationIds.add(operationId);
    return fresh;
  }

  public hasAppliedCommand(commandId: string): boolean {
    return this.appliedCommandIds.has(commandId);
  }

  public markCommandApplied(commandId: string): boolean {
    const fresh = !this.appliedCommandIds.has(commandId);
    this.appliedCommandIds.add(commandId);
    return fresh;
  }

  public queuePendingOperation(operation: PendingRewardOperation): boolean {
    if (this.pendingOperations.has(operation.operationId)) return false;
    this.pendingOperations.set(operation.operationId, cloneFrozen(operation));
    return true;
  }

  public acknowledgePendingOperation(operationId: string): boolean {
    return this.pendingOperations.delete(operationId);
  }

  public getPendingOperations(): readonly PendingRewardOperation[] {
    return cloneFrozen([...this.pendingOperations.values()]
      .sort((left, right) => compareStrings(left.operationId, right.operationId)));
  }

  public unlockExit(exitId: string): boolean {
    const fresh = !this.unlockedExitIds.has(exitId);
    this.unlockedExitIds.add(exitId);
    return fresh;
  }

  public completeStage(completion: StageCompletionRecord): boolean {
    if (this.completedStageOccurrences.has(completion.occurrenceId)) return false;
    this.completedStageOccurrences.set(completion.occurrenceId, cloneFrozen(completion));
    return true;
  }

  public getStageCompletions(): readonly StageCompletionRecord[] {
    return cloneFrozen([...this.completedStageOccurrences.values()]
      .sort((left, right) => compareStrings(left.occurrenceId, right.occurrenceId)));
  }

  public snapshot(): NarrativeStateSnapshot {
    const sortedRecord = <T>(record: Record<string, T>): Record<string, T> => Object.fromEntries(
      Object.entries(record).sort(([left], [right]) => compareStrings(left, right)),
    );
    const choices = sortedRecord(Object.fromEntries(Object.entries(this.choices)
      .map(([dialogueId, entries]) => [dialogueId, sortedRecord({ ...entries })])));
    const missionStates = sortedRecord(Object.fromEntries(Object.entries(this.missionStates)
      .map(([missionId, state]) => [missionId, {
        status: state.status,
        objectives: sortedRecord({ ...state.objectives }),
      }])));
    const sorted = (values: Set<string>): string[] => [...values].sort(compareStrings);
    return cloneFrozen({
      version: 1 as const,
      flags: sortedRecord({ ...this.flags }),
      choices,
      completedDialogueIds: sorted(this.completedDialogueIds),
      missionStates,
      processedEventIds: sorted(this.processedEventIds),
      firedRuleIds: sorted(this.firedRuleIds),
      appliedOperationIds: sorted(this.appliedOperationIds),
      appliedCommandIds: sorted(this.appliedCommandIds),
      pendingOperations: this.getPendingOperations(),
      unlockedExitIds: sorted(this.unlockedExitIds),
      completedStageOccurrences: this.getStageCompletions(),
    });
  }
}
