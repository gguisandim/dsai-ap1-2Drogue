import type { CampaignMacroDefinition } from '../../stages';
import type {
  CampaignGraphContextState,
  CampaignNavigationResult,
  CampaignNavigationView,
  CampaignPreparedTransition,
  CampaignRewardClaim,
  CampaignRewardRecord,
  CampaignRouterDependencies,
  CampaignRouterFailure,
  CampaignRunSaveFailure,
  CampaignRunSavePort,
  CampaignRunState,
} from './CampaignNavigation';
import {
  CampaignMacroProgression,
  type CampaignMacroChoice,
  type CampaignMacroCommand,
  type CampaignMacroFailure,
  type CampaignMacroInspection,
} from './CampaignMacroProgression';
import { CampaignRouter } from './CampaignRouter';
import { canonicalCampaignRunState } from './CampaignRunSaveService';

export interface CampaignMacroRouteBinding {
  readonly connectionId: string;
  readonly sourceContextId: string;
  readonly targetContextId: string;
  readonly edgeId: string;
}

export type CampaignMacroBoundChoiceStatus = 'bound' | 'blocked' | 'unavailable';

export interface CampaignMacroBoundChoice {
  readonly choice: CampaignMacroChoice;
  readonly status: CampaignMacroBoundChoiceStatus;
  readonly edgeId?: string;
  readonly physicalExitId?: string;
  readonly blockedReason?: string;
}

export interface CampaignMacroRouteInspection {
  readonly macro: CampaignMacroInspection;
  readonly navigation: CampaignNavigationView;
  readonly activeGraphContextId: string;
  readonly choices: readonly CampaignMacroBoundChoice[];
}

export interface CampaignMacroPreparedNavigation {
  readonly preparation: CampaignPreparedTransition;
  readonly connectionId: string;
  readonly sourceContextId: string;
  readonly targetContextId: string;
}

export interface CampaignMacroConfirmedNavigation {
  readonly state: CampaignRunState;
  readonly connectionId: string;
  readonly transitionId: string;
  readonly persistence: 'saved' | 'verified-after-error' | 'skipped';
}

export type CampaignMacroRouteBindingFailureCode =
  | 'invalid-session'
  | 'choice-not-found'
  | 'choice-blocked'
  | 'binding-not-found'
  | 'context-mismatch'
  | 'transition-in-progress'
  | 'transition-not-prepared'
  | 'router-failed'
  | 'macro-failed'
  | 'persistence-failed';

export interface CampaignMacroRouteBindingFailure {
  readonly code: CampaignMacroRouteBindingFailureCode;
  readonly message: string;
  readonly referenceId?: string;
  readonly routerFailure?: CampaignRouterFailure;
  readonly macroFailure?: CampaignMacroFailure;
  readonly persistenceFailure?: CampaignRunSaveFailure;
  readonly recovery: 'unchanged' | 'rolled-back' | 'storage-state-unknown';
}

export type CampaignMacroRouteBindingResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: CampaignMacroRouteBindingFailure };

export interface CampaignMacroRouteBinderDependencies
  extends Omit<CampaignRouterDependencies, 'saves'> {
  readonly saves?: CampaignRunSavePort;
}

interface PendingNavigation {
  readonly router: CampaignRouter;
  readonly binding: CampaignMacroRouteBinding;
  readonly choice: CampaignMacroChoice;
  readonly prepared: CampaignPreparedTransition;
}

function compare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function unique<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...new Set(values)]);
}

function graphContext(state: CampaignRunState): CampaignGraphContextState {
  return Object.freeze({
    graph: state.graph,
    status: state.status,
    currentNodeId: state.currentNodeId,
    visitedNodeIds: state.visitedNodeIds,
    traversedEdgeIds: state.traversedEdgeIds,
    revealedEdgeIds: state.revealedEdgeIds,
    revisitCounts: state.revisitCounts,
    physicalExits: state.physicalExits,
    nodeResumes: state.nodeResumes,
    confirmedTransitionIds: state.confirmedTransitionIds,
    rewards: state.rewards,
  });
}

function mergeCounts(
  left: Readonly<Record<string, number>>,
  right: Readonly<Record<string, number>>,
): Readonly<Record<string, number>> {
  const result = { ...left };
  Object.entries(right).forEach(([id, count]) => { result[id] = Math.max(result[id] ?? 0, count); });
  return result;
}

function activateContext(
  parked: CampaignGraphContextState,
  journal: CampaignRunState,
): CampaignRunState {
  return canonicalCampaignRunState({
    ...journal,
    ...parked,
    visitedNodeIds: unique([...parked.visitedNodeIds, ...journal.visitedNodeIds]),
    traversedEdgeIds: journal.traversedEdgeIds,
    revealedEdgeIds: unique([...parked.revealedEdgeIds, ...journal.revealedEdgeIds]),
    revisitCounts: mergeCounts(parked.revisitCounts, journal.revisitCounts),
    physicalExits: parked.physicalExits,
    nodeResumes: parked.nodeResumes,
    confirmedTransitionIds: unique([
      ...parked.confirmedTransitionIds,
      ...journal.confirmedTransitionIds,
    ]),
    rewards: { ...parked.rewards, ...journal.rewards },
    macroProgress: journal.macroProgress,
    activeGraphContextId: journal.activeGraphContextId,
    parkedGraphContexts: journal.parkedGraphContexts,
  });
}

/**
 * Binds macro choices to the existing router. It owns orchestration only: stage
 * loading, exit resolution, transition validation and persistence stay in the
 * services supplied through the public contracts.
 */
export class CampaignMacroRouteBinder {
  private pending?: PendingNavigation;

  private constructor(
    private readonly definition: CampaignMacroDefinition,
    private readonly bindings: readonly CampaignMacroRouteBinding[],
    private stateValue: CampaignRunState,
    private readonly dependencies: CampaignMacroRouteBinderDependencies,
  ) {}

  public static create(
    definition: CampaignMacroDefinition,
    bindings: readonly CampaignMacroRouteBinding[],
    run: CampaignRunState,
    dependencies: CampaignMacroRouteBinderDependencies,
    initialContextId: string,
  ): CampaignMacroRouteBindingResult<CampaignMacroRouteBinder> {
    const macro = CampaignMacroProgression.create(definition, run);
    if (!macro.ok) return this.failureStatic(
      'invalid-session', 'Macro campaign session is invalid.', undefined,
      { macroFailure: macro.error },
    );
    const progressed = macro.value.state();
    const candidate = canonicalCampaignRunState({
      ...progressed,
      activeGraphContextId: progressed.activeGraphContextId ?? initialContextId,
      parkedGraphContexts: progressed.parkedGraphContexts ?? {},
    });
    if (dependencies.saves && JSON.stringify(candidate) !== JSON.stringify(run)) {
      const saved = dependencies.saves.save(candidate, run);
      if (!saved.ok) return this.failureStatic(
        'persistence-failed', 'Macro route binding initialization was rolled back.', undefined,
        {
          persistenceFailure: saved.error,
          recovery: saved.error.recovery === 'storage-state-unknown'
            ? 'storage-state-unknown' : 'rolled-back',
        },
      );
    }
    return Object.freeze({
      ok: true as const,
      value: new CampaignMacroRouteBinder(definition, Object.freeze([...bindings]), candidate, dependencies),
    });
  }

  public state(): CampaignRunState {
    return this.stateValue;
  }

  public rewards(): readonly CampaignRewardRecord[] {
    return this.journalRouter().rewards();
  }

  public unsettledRewards(): readonly CampaignRewardRecord[] {
    return this.journalRouter().unsettledRewards();
  }

  public reward(transitionId: string): CampaignRewardRecord | undefined {
    return this.stateValue.rewards[transitionId];
  }

  public claimReward(transitionId: string): CampaignNavigationResult<CampaignRewardClaim> {
    const router = this.journalRouter();
    const claimed = router.claimReward(transitionId);
    if (claimed.ok) this.stateValue = router.state();
    return claimed;
  }

  public acknowledgeReward(transitionId: string): CampaignNavigationResult<CampaignRewardClaim> {
    const router = this.journalRouter();
    const acknowledged = router.acknowledgeReward(transitionId);
    if (acknowledged.ok) this.stateValue = router.state();
    return acknowledged;
  }

  public inspect(): CampaignMacroRouteBindingResult<CampaignMacroRouteInspection> {
    if (this.pending) return this.failure(
      'transition-in-progress', 'A macro transition is already prepared.',
      this.pending.prepared.preparationId,
    );
    const macro = CampaignMacroProgression.create(this.definition, this.stateValue);
    if (!macro.ok) return this.failure('macro-failed', 'Macro inspection failed.', undefined, {
      macroFailure: macro.error,
    });
    const router = this.router();
    const navigation = router.inspect();
    if (!navigation.ok) return this.failure('router-failed', 'Route inspection failed.', undefined, {
      routerFailure: navigation.error,
    });
    const choices = macro.value.inspect().choices.map(choice => {
      const binding = this.bindings.find(item => item.connectionId === choice.connectionId &&
        item.sourceContextId === this.stateValue.activeGraphContextId);
      if (!choice.exposePhysicalExit) return Object.freeze({
        choice,
        status: 'blocked' as const,
        blockedReason: choice.blockedReason ?? 'progress-locked',
      });
      if (!binding) return Object.freeze({
        choice,
        status: 'unavailable' as const,
        blockedReason: 'binding-not-found',
      });
      const destination = navigation.value.snapshot.destinations.find(item => item.edgeId === binding.edgeId);
      if (!destination) return Object.freeze({
        choice,
        status: 'unavailable' as const,
        edgeId: binding.edgeId,
        blockedReason: 'physical-exit-unavailable',
      });
      return Object.freeze({
        choice,
        status: destination.available ? 'bound' as const : 'blocked' as const,
        edgeId: binding.edgeId,
        physicalExitId: destination.physicalExitId,
        ...(!destination.available
          ? { blockedReason: destination.blockedReason ?? 'router-blocked' }
          : {}),
      });
    }).sort((left, right) => compare(left.choice.connectionId, right.choice.connectionId));
    return Object.freeze({
      ok: true as const,
      value: Object.freeze({
        macro: macro.value.inspect(),
        navigation: navigation.value,
        activeGraphContextId: this.stateValue.activeGraphContextId as string,
        choices: Object.freeze(choices),
      }),
    });
  }

  public prepare(connectionId: string): CampaignMacroRouteBindingResult<CampaignMacroPreparedNavigation> {
    if (this.pending) return this.failure(
      'transition-in-progress', 'Another macro transition is already prepared.', connectionId,
    );
    const inspection = this.inspect();
    if (!inspection.ok) return inspection;
    const bound = inspection.value.choices.find(item => item.choice.connectionId === connectionId);
    if (!bound) return this.failure('choice-not-found', 'Macro choice was not found.', connectionId);
    if (bound.status !== 'bound' || !bound.physicalExitId) return this.failure(
      bound.status === 'blocked' ? 'choice-blocked' : 'binding-not-found',
      `Macro choice cannot navigate: ${bound.blockedReason ?? bound.status}.`, connectionId,
    );
    const binding = this.bindings.find(item => item.connectionId === connectionId &&
      item.sourceContextId === this.stateValue.activeGraphContextId);
    if (!binding) return this.failure('binding-not-found', 'Macro route binding is missing.', connectionId);
    const router = this.router();
    const prepared = router.prepare(bound.physicalExitId);
    if (!prepared.ok) return this.failure('router-failed', 'Campaign router preparation failed.', connectionId, {
      routerFailure: prepared.error,
    });
    this.pending = Object.freeze({ router, binding, choice: bound.choice, prepared: prepared.value });
    return Object.freeze({
      ok: true as const,
      value: Object.freeze({
        preparation: prepared.value,
        connectionId,
        sourceContextId: binding.sourceContextId,
        targetContextId: binding.targetContextId,
      }),
    });
  }

  public confirm(preparationId: string): CampaignMacroRouteBindingResult<CampaignMacroConfirmedNavigation> {
    const pending = this.pending;
    if (!pending || pending.prepared.preparationId !== preparationId) return this.failure(
      'transition-not-prepared', 'Preparation does not match the pending macro transition.', preparationId,
    );
    if (this.stateValue.activeGraphContextId !== pending.binding.sourceContextId) return this.failure(
      'context-mismatch', 'Active graph context changed before confirmation.', pending.binding.sourceContextId,
    );
    const previous = this.stateValue;
    const confirmed = pending.router.confirm(preparationId);
    this.pending = undefined;
    if (!confirmed.ok) return this.failure('router-failed', 'Campaign router confirmation failed.', preparationId, {
      routerFailure: confirmed.error,
    });
    let candidate = this.switchContext(previous, confirmed.value.state, pending.binding);
    const macro = CampaignMacroProgression.create(this.definition, candidate);
    if (!macro.ok) return this.failure('macro-failed', 'Macro progression could not be restored.', preparationId, {
      macroFailure: macro.error,
    });
    const command = this.command(pending.choice, confirmed.value.transition.transitionId);
    if (!command) return this.failure(
      'choice-blocked', 'This macro choice is not implemented by the vertical slice.',
      pending.choice.connectionId,
    );
    const progressed = macro.value.process(command);
    if (!progressed.ok) return this.failure('macro-failed', 'Macro navigation command failed.', preparationId, {
      macroFailure: progressed.error,
    });
    candidate = progressed.value.state;
    let persistence: CampaignMacroConfirmedNavigation['persistence'] = 'skipped';
    if (this.dependencies.saves) {
      const saved = this.dependencies.saves.save(candidate, previous);
      if (!saved.ok) return this.failure(
        'persistence-failed', 'Macro navigation was rolled back after persistence failed.',
        confirmed.value.transition.transitionId,
        {
          persistenceFailure: saved.error,
          recovery: saved.error.recovery === 'storage-state-unknown'
            ? 'storage-state-unknown' : 'rolled-back',
        },
      );
      persistence = saved.value.persistence === 'verified-after-error'
        ? 'verified-after-error' : 'saved';
    }
    this.stateValue = candidate;
    return Object.freeze({
      ok: true as const,
      value: Object.freeze({
        state: candidate,
        connectionId: pending.choice.connectionId,
        transitionId: confirmed.value.transition.transitionId,
        persistence,
      }),
    });
  }

  public cancel(preparationId: string): boolean {
    if (this.pending?.prepared.preparationId !== preparationId) return false;
    const cancelled = this.pending.router.cancel(preparationId);
    if (cancelled) this.pending = undefined;
    return cancelled;
  }

  private switchContext(
    previous: CampaignRunState,
    navigated: CampaignRunState,
    binding: CampaignMacroRouteBinding,
  ): CampaignRunState {
    if (binding.sourceContextId === binding.targetContextId) return navigated;
    const parked = { ...(previous.parkedGraphContexts ?? {}) };
    parked[binding.sourceContextId] = graphContext(previous);
    const restored = parked[binding.targetContextId];
    delete parked[binding.targetContextId];
    const targetPhysical = navigated.physicalExits[navigated.currentNodeId];
    const targetResume = navigated.nodeResumes[navigated.currentNodeId];
    const contextual = canonicalCampaignRunState({
      ...navigated,
      physicalExits: targetPhysical ? { [navigated.currentNodeId]: targetPhysical } : {},
      nodeResumes: targetResume ? { [navigated.currentNodeId]: targetResume } : {},
      activeGraphContextId: binding.targetContextId,
      parkedGraphContexts: parked,
    });
    return restored ? activateContext(restored, contextual) : contextual;
  }

  private command(choice: CampaignMacroChoice, transitionId: string): CampaignMacroCommand | undefined {
    const operationId = `macro.navigation.${transitionId}`;
    if (choice.kind === 'enter-route' || choice.kind === 'continue-route') {
      return choice.target.kind === 'route'
        ? { type: 'route.enter', operationId, routeId: choice.target.routeId }
        : undefined;
    }
    if (choice.kind === 'return-hub') return { type: 'hub.returned', operationId };
    return undefined;
  }

  private router(): CampaignRouter {
    return new CampaignRouter(this.stateValue, {
      loader: this.dependencies.loader,
      resolver: this.dependencies.resolver,
      binder: this.dependencies.binder,
    });
  }

  private journalRouter(): CampaignRouter {
    return new CampaignRouter(this.stateValue, {
      loader: this.dependencies.loader,
      resolver: this.dependencies.resolver,
      binder: this.dependencies.binder,
      ...(this.dependencies.saves ? { saves: this.dependencies.saves } : {}),
    });
  }

  private failure<T = never>(
    code: CampaignMacroRouteBindingFailureCode,
    message: string,
    referenceId?: string,
    detail: Partial<CampaignMacroRouteBindingFailure> = {},
  ): CampaignMacroRouteBindingResult<T> {
    return CampaignMacroRouteBinder.failureStatic(code, message, referenceId, detail);
  }

  private static failureStatic<T = never>(
    code: CampaignMacroRouteBindingFailureCode,
    message: string,
    referenceId?: string,
    detail: Partial<CampaignMacroRouteBindingFailure> = {},
  ): CampaignMacroRouteBindingResult<T> {
    return Object.freeze({
      ok: false as const,
      error: Object.freeze({
        code,
        message,
        recovery: detail.recovery ?? 'unchanged',
        ...(referenceId ? { referenceId } : {}),
        ...detail,
      }),
    });
  }
}
