import type {
  CampaignEdge,
  CampaignExitBinding,
  CampaignNode,
  LoadedStage,
  PhysicalExitResolution,
  StageDiagnostic,
  StageLoadRequest,
  StageLoadResult,
} from '../../stages';
import type {
  CampaignConfirmedTransition,
  CampaignNavigationResult,
  CampaignNavigationSnapshot,
  CampaignNavigationView,
  CampaignPreparedTransition,
  CampaignRewardClaim,
  CampaignRewardRecord,
  CampaignRouteAccess,
  CampaignRouteBlockedReason,
  CampaignRouteDestination,
  CampaignRouterDependencies,
  CampaignRouterFailure,
  CampaignRouterFailureCode,
  CampaignRunDiagnostic,
  CampaignRunState,
} from './CampaignNavigation';
import {
  canonicalCampaignRunState,
  validateCampaignRunState,
} from './CampaignRunSaveService';

interface InternalPreparation {
  readonly publicValue: CampaignPreparedTransition;
  readonly previous: CampaignRunState;
  readonly candidate: CampaignRunState;
}

const EMPTY_ACCESS: CampaignRouteAccess = Object.freeze({
  eligibleEdgeIds: Object.freeze([]),
  unlockedStageExitIds: Object.freeze([]),
});

function compare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function hash(value: string): string {
  let result = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 0x01000193);
  }
  return (result >>> 0).toString(16).padStart(8, '0');
}

function samePhysicalResolution(left: PhysicalExitResolution, right: PhysicalExitResolution): boolean {
  const normalize = (value: PhysicalExitResolution): string => JSON.stringify({
    ...value,
    exits: [...value.exits].sort((a, b) => compare(a.edgeId, b.edgeId)),
  });
  return normalize(left) === normalize(right);
}

function runDiagnostic(diagnostic: StageDiagnostic): CampaignRunDiagnostic {
  return Object.freeze({
    code: diagnostic.code,
    message: diagnostic.message,
    path: Object.freeze([...diagnostic.path]),
    ...(diagnostic.referenceId ? { referenceId: diagnostic.referenceId } : {}),
  });
}

function transitionCount(state: CampaignRunState, edgeId: string): number {
  return state.traversedEdgeIds.filter(id => id === edgeId).length;
}

function uniqueAppend(values: readonly string[], value: string): readonly string[] {
  return values.includes(value) ? values : [...values, value];
}

export function createCampaignRunState(graph: CampaignRunState['graph']): CampaignRunState {
  const revealed = graph.edges
    .filter(edge => edge.sourceNodeId === graph.entryNodeId)
    .map(edge => edge.id)
    .sort(compare);
  return canonicalCampaignRunState({
    version: 1,
    graph,
    status: 'active',
    currentNodeId: graph.entryNodeId,
    visitedNodeIds: [graph.entryNodeId],
    traversedEdgeIds: [],
    revealedEdgeIds: revealed,
    revisitCounts: { [graph.entryNodeId]: 1 },
    physicalExits: {},
    nodeResumes: {},
    confirmedTransitionIds: [],
    rewards: {},
  });
}

export class CampaignRouter {
  private stateValue: CampaignRunState;
  private preparation?: InternalPreparation;
  private busy = false;

  public constructor(
    initialState: CampaignRunState,
    private readonly dependencies: CampaignRouterDependencies,
    private access: CampaignRouteAccess = EMPTY_ACCESS,
  ) {
    this.stateValue = canonicalCampaignRunState(initialState);
  }

  public state(): CampaignRunState {
    return this.stateValue;
  }

  public setAccess(access: CampaignRouteAccess): void {
    this.access = Object.freeze({
      eligibleEdgeIds: Object.freeze([...access.eligibleEdgeIds]),
      unlockedStageExitIds: Object.freeze([...access.unlockedStageExitIds]),
    });
  }

  public inspect(): CampaignNavigationResult<CampaignNavigationView> {
    if (this.busy) return this.failure(
      'transition-in-progress', 'A transition is currently being confirmed.', undefined, 'unchanged',
    );
    return this.inspectInternal();
  }

  public prepare(physicalExitId: string): CampaignNavigationResult<CampaignPreparedTransition> {
    if (this.busy || this.preparation) return this.failure(
      'transition-in-progress', 'Another transition is already prepared or being confirmed.',
      physicalExitId, 'unchanged',
    );
    if (this.stateValue.status === 'completed') return this.failure(
      'run-completed', 'Completed campaign runs cannot navigate again.', physicalExitId, 'unchanged',
    );
    this.busy = true;
    try {
      const navigation = this.inspectInternal();
      if (!navigation.ok) return navigation;
      const destination = navigation.value.snapshot.destinations
        .find(item => item.physicalExitId === physicalExitId);
      if (!destination) return this.failure(
        'exit-not-found', 'Physical exit is not available on the current node.',
        physicalExitId, 'unchanged',
      );
      if (!destination.available) return this.failure(
        'exit-blocked', `Physical exit is blocked: ${destination.blockedReason}.`,
        physicalExitId, 'unchanged',
      );
      const edge = this.stateValue.graph.edges.find(item => item.id === destination.edgeId) as CampaignEdge;
      const occurrence = transitionCount(this.stateValue, edge.id) + 1;
      const transitionId = `transition.${hash([
        this.stateValue.graph.runId,
        edge.sourceNodeId,
        edge.id,
        edge.targetNodeId,
        occurrence,
      ].join('|'))}`;
      if (this.stateValue.confirmedTransitionIds.includes(transitionId)) return this.failure(
        'transition-already-confirmed', 'Transition was already confirmed.', transitionId, 'unchanged',
      );
      const preparationId = `prepare.${transitionId}`;
      let targetNode: CampaignNode | undefined;
      let destinationStage: LoadedStage | undefined;
      if (edge.targetNodeId !== 'campaign.complete') {
        targetNode = this.stateValue.graph.nodes.find(node => node.id === edge.targetNodeId);
        if (!targetNode) return this.failure(
          'target-node-invalid', 'Target node is not present in the graph.',
          edge.targetNodeId, 'unchanged',
        );
        const targetLoad = this.loadStage(targetNode);
        if (!targetLoad.ok) return this.failure(
          'target-stage-load-failed', 'Target stage could not be prepared.', targetNode.stageId,
          'unchanged', { stageLoadFailure: targetLoad.error },
        );
        destinationStage = targetLoad.value;
      }
      const candidate = this.candidateState(
        edge,
        transitionId,
        navigation.value.physicalExits,
        {
          stageId: navigation.value.currentNode.stageId,
          difficulty: navigation.value.loadedStage.level.difficulty,
          parSeconds: navigation.value.loadedStage.level.parTime,
        },
        targetNode,
      );
      if (targetNode) {
        // Preflight the target before persistence so a confirmed transition
        // can never strand the player in a stage without campaign exits.
        const targetInspection = this.inspectState(candidate);
        if (!targetInspection.ok) return this.failure(
          'target-navigation-failed',
          `Target stage navigation is invalid: ${targetInspection.error.code}.`,
          targetNode.id,
          'unchanged',
          {
            targetFailureCode: targetInspection.error.code,
            ...this.targetFailureDetail(targetInspection.error),
          },
        );
        if (targetInspection.value.snapshot.destinations.length === 0) return this.failure(
          'target-has-no-exits',
          'Target stage has no campaign exits to continue the run.',
          targetNode.id,
          'unchanged',
        );
      }
      const publicValue: CampaignPreparedTransition = Object.freeze({
        preparationId,
        transitionId,
        edgeId: edge.id,
        physicalExitId: destination.physicalExitId,
        stageExitId: destination.stageExitId,
        sourceNodeId: edge.sourceNodeId,
        targetNodeId: edge.targetNodeId,
        targetStageId: destination.targetStageId,
        identity: Object.freeze({
          campaignId: this.stateValue.graph.campaignId,
          runId: this.stateValue.graph.runId,
          runSeed: this.stateValue.graph.runSeed,
          stageInstanceId: targetNode?.id ?? this.stateValue.currentNodeId,
          stageId: targetNode?.stageId ?? navigation.value.currentNode.stageId,
          stageSeed: targetNode?.stageSeed ?? navigation.value.currentNode.stageSeed,
        }),
        ...(destinationStage ? { destinationStage } : {}),
        navigation: navigation.value.snapshot,
      });
      this.preparation = Object.freeze({
        publicValue,
        previous: this.stateValue,
        candidate,
      });
      return this.success(publicValue);
    } finally {
      this.busy = false;
    }
  }

  public confirm(preparationId: string): CampaignNavigationResult<CampaignConfirmedTransition> {
    if (this.busy) return this.failure(
      'transition-in-progress', 'A transition is currently being confirmed.', preparationId, 'unchanged',
    );
    if (!this.preparation || this.preparation.publicValue.preparationId !== preparationId) {
      const transitionId = preparationId.startsWith('prepare.')
        ? preparationId.slice('prepare.'.length) : '';
      if (transitionId && this.stateValue.confirmedTransitionIds.includes(transitionId)) {
        return this.failure('transition-already-confirmed', 'Transition was already confirmed.',
          transitionId, 'unchanged');
      }
      return this.failure('transition-not-prepared', 'Preparation does not match the pending transition.',
        preparationId, 'unchanged');
    }
    this.busy = true;
    const prepared = this.preparation;
    this.stateValue = prepared.candidate;
    try {
      if (!this.dependencies.saves) {
        this.preparation = undefined;
        return this.success(Object.freeze({
          status: 'confirmed' as const,
          transition: prepared.publicValue,
          state: this.stateValue,
          persistence: 'skipped' as const,
        }));
      }
      const saved = this.dependencies.saves.save(this.stateValue, prepared.previous);
      if (!saved.ok) {
        this.stateValue = prepared.previous;
        this.preparation = undefined;
        return this.failure(
          'persistence-failed', 'Transition was rolled back after run persistence failed.',
          prepared.publicValue.transitionId,
          saved.error.recovery === 'storage-state-unknown' ? 'storage-state-unknown' : 'rolled-back',
          { persistenceFailure: saved.error },
        );
      }
      this.preparation = undefined;
      return this.success(Object.freeze({
        status: 'confirmed' as const,
        transition: prepared.publicValue,
        state: this.stateValue,
        persistence: saved.value.persistence === 'verified-after-error'
          ? 'verified-after-error' as const : 'saved' as const,
      }));
    } finally {
      this.busy = false;
    }
  }

  public cancel(preparationId: string): boolean {
    if (this.busy || this.preparation?.publicValue.preparationId !== preparationId) return false;
    this.preparation = undefined;
    return true;
  }

  public rewards(): readonly CampaignRewardRecord[] {
    return Object.freeze(Object.values(this.stateValue.rewards)
      .sort((left, right) => compare(left.transitionId, right.transitionId)));
  }

  public pendingRewards(): readonly CampaignRewardRecord[] {
    return Object.freeze(this.rewards().filter(reward => reward.status === 'pending'));
  }

  public claimReward(transitionId: string): CampaignNavigationResult<CampaignRewardClaim> {
    if (this.busy || this.preparation) return this.failure(
      'transition-in-progress', 'A transition is currently prepared or being confirmed.',
      transitionId, 'unchanged',
    );
    const record = this.stateValue.rewards[transitionId];
    if (!record) return this.failure(
      'reward-not-found', 'Reward record does not exist for this transition.',
      transitionId, 'unchanged',
    );
    if (record.status === 'claimed') return this.failure(
      'reward-already-claimed', 'Reward was already claimed and must not be applied again.',
      transitionId, 'unchanged',
    );
    if (record.status === 'applied') return this.failure(
      'reward-already-applied', 'Reward was already applied.', transitionId, 'unchanged',
    );
    const candidate = canonicalCampaignRunState({
      ...this.stateValue,
      rewards: {
        ...this.stateValue.rewards,
        [transitionId]: { ...record, status: 'claimed' },
      },
    });
    const persisted = this.persist(
      candidate,
      this.stateValue,
      'Reward claim was rolled back after run persistence failed.',
      transitionId,
    );
    if (!persisted.ok) return Object.freeze({ ok: false as const, error: persisted.error });
    this.stateValue = candidate;
    return this.success(Object.freeze({
      reward: candidate.rewards[transitionId],
      persistence: persisted.persistence,
    }));
  }

  public acknowledgeReward(transitionId: string): CampaignNavigationResult<CampaignRewardClaim> {
    if (this.busy || this.preparation) return this.failure(
      'transition-in-progress', 'A transition is currently prepared or being confirmed.',
      transitionId, 'unchanged',
    );
    const record = this.stateValue.rewards[transitionId];
    if (!record) return this.failure(
      'reward-not-found', 'Reward record does not exist for this transition.',
      transitionId, 'unchanged',
    );
    if (record.status === 'applied') return this.success(Object.freeze({
      reward: record,
      persistence: 'skipped' as const,
    }));
    if (record.status === 'pending') return this.failure(
      'reward-not-claimable', 'Reward must be claimed before it is acknowledged.',
      transitionId, 'unchanged',
    );
    const candidate = canonicalCampaignRunState({
      ...this.stateValue,
      rewards: {
        ...this.stateValue.rewards,
        [transitionId]: { ...record, status: 'applied' },
      },
    });
    const persisted = this.persist(
      candidate,
      this.stateValue,
      'Reward acknowledgement was rolled back after run persistence failed.',
      transitionId,
    );
    if (!persisted.ok) return Object.freeze({ ok: false as const, error: persisted.error });
    this.stateValue = candidate;
    return this.success(Object.freeze({
      reward: candidate.rewards[transitionId],
      persistence: persisted.persistence,
    }));
  }

  private persist(
    candidate: CampaignRunState,
    previous: CampaignRunState,
    failureMessage: string,
    referenceId: string,
  ): { readonly ok: true; readonly persistence: CampaignRewardClaim['persistence'] } |
    { readonly ok: false; readonly error: CampaignRouterFailure } {
    if (!this.dependencies.saves) return { ok: true, persistence: 'skipped' };
    const saved = this.dependencies.saves.save(candidate, previous);
    if (!saved.ok) return {
      ok: false,
      error: Object.freeze({
        code: 'persistence-failed' as const,
        message: failureMessage,
        referenceId,
        recovery: saved.error.recovery === 'storage-state-unknown'
          ? 'storage-state-unknown' as const : 'rolled-back' as const,
        persistenceFailure: saved.error,
      }),
    };
    return {
      ok: true,
      persistence: saved.value.persistence === 'verified-after-error'
        ? 'verified-after-error' : 'saved',
    };
  }

  private targetFailureDetail(error: CampaignRouterFailure): Partial<CampaignRouterFailure> {
    return {
      ...(error.stageLoadFailure ? { stageLoadFailure: error.stageLoadFailure } : {}),
      ...(error.physicalExitFailure ? { physicalExitFailure: error.physicalExitFailure } : {}),
      ...(error.bindingFailure ? { bindingFailure: error.bindingFailure } : {}),
      ...(error.persistenceFailure ? { persistenceFailure: error.persistenceFailure } : {}),
    };
  }

  private inspectInternal(): CampaignNavigationResult<CampaignNavigationView> {
    return this.inspectState(this.stateValue);
  }

  private inspectState(state: CampaignRunState): CampaignNavigationResult<CampaignNavigationView> {
    const runDiagnostics = validateCampaignRunState(state);
    if (runDiagnostics.length > 0) return this.failure(
      'invalid-run', 'Campaign run state is invalid.', state.currentNodeId,
      'unchanged',
    );
    const currentNode = state.graph.nodes.find(node => node.id === state.currentNodeId);
    if (!currentNode) return this.failure(
      'invalid-run', 'Current campaign node is missing.', state.currentNodeId, 'unchanged',
    );
    const loaded = this.loadStage(currentNode, state);
    if (!loaded.ok) return this.failure(
      'current-stage-load-failed', 'Current stage could not be loaded.', currentNode.stageId,
      'unchanged', { stageLoadFailure: loaded.error },
    );
    const outgoing = state.graph.edges.filter(edge => edge.sourceNodeId === currentNode.id);
    let physical;
    try {
      physical = this.dependencies.resolver.resolve({ node: currentNode, edges: outgoing, stage: loaded.value });
    } catch (error) {
      return this.failure('physical-resolution-failed', `Physical exit resolver threw: ${this.message(error)}.`,
        currentNode.id, 'unchanged');
    }
    if (!physical.ok) return this.failure(
      'physical-resolution-failed', 'Physical exits could not be resolved.', currentNode.id,
      'unchanged', {
        physicalExitFailure: {
          code: physical.error.code,
          diagnostics: Object.freeze(physical.error.diagnostics.map(runDiagnostic)),
        },
      },
    );
    const persisted = state.physicalExits[currentNode.id];
    if (persisted && !samePhysicalResolution(persisted, physical.value)) return this.failure(
      'physical-resolution-failed', 'Persisted physical exits are incompatible with the loaded stage.',
      currentNode.id, 'unchanged', {
        physicalExitFailure: {
          code: 'saved-placement-incompatible',
          diagnostics: Object.freeze([{
            code: 'physical-exit.saved-placement-incompatible',
            message: 'Persisted resolution differs from deterministic regeneration.',
            path: Object.freeze(['physicalExits', currentNode.id]),
            referenceId: currentNode.id,
          }]),
        },
      },
    );
    let binding;
    try {
      binding = this.dependencies.binder.bind({
        graph: state.graph,
        sourceNodeId: currentNode.id,
        stage: loaded.value,
        physicalExitResult: physical,
      });
    } catch (error) {
      return this.failure('binding-failed', `Campaign exit binder threw: ${this.message(error)}.`,
        currentNode.id, 'unchanged');
    }
    if (!binding.ok) return this.failure(
      'binding-failed', 'Campaign exits could not be bound.', currentNode.id,
      'unchanged', { bindingFailure: binding.error },
    );
    const destinations = binding.value.bindings.map(item =>
      this.destination(item, currentNode, state)).sort((left, right) => compare(left.edgeId, right.edgeId));
    const snapshot: CampaignNavigationSnapshot = Object.freeze({
      runId: state.graph.runId,
      runSeed: state.graph.runSeed,
      graphId: state.graph.id,
      status: state.status,
      currentNodeId: currentNode.id,
      stageInstanceId: currentNode.id,
      currentStageId: currentNode.stageId,
      destinations: Object.freeze(destinations),
    });
    return this.success(Object.freeze({
      snapshot,
      currentNode,
      loadedStage: loaded.value,
      physicalExits: persisted ?? physical.value,
      bindings: binding.value.bindings,
    }));
  }

  private destination(
    binding: CampaignExitBinding,
    node: CampaignNode,
    state: CampaignRunState,
  ): CampaignRouteDestination {
    const edge = binding.edge;
    let blockedReason: CampaignRouteBlockedReason | undefined;
    if (!state.revealedEdgeIds.includes(edge.id)) blockedReason = 'edge-not-revealed';
    else if (transitionCount(state, edge.id) >= edge.traversalLimit) {
      blockedReason = 'traversal-limit-reached';
    } else if (edge.condition && !this.access.eligibleEdgeIds.includes(edge.id)) {
      blockedReason = 'edge-condition-unmet';
    } else if (binding.manifestExit?.condition &&
      !this.access.unlockedStageExitIds.includes(binding.stageExitId)) {
      blockedReason = 'stage-exit-locked';
    }
    if (state.status === 'completed') blockedReason = 'traversal-limit-reached';
    return Object.freeze({
      edgeId: edge.id,
      physicalExitId: binding.physicalExitId,
      stageExitId: binding.stageExitId,
      sourceNodeId: edge.sourceNodeId,
      sourceStageId: node.stageId,
      targetNodeId: edge.targetNodeId,
      targetStageId: binding.targetStageId,
      tile: Object.freeze({ ...binding.physicalExit.tile }),
      available: !blockedReason,
      ...(blockedReason ? { blockedReason } : {}),
    });
  }

  private candidateState(
    edge: CampaignEdge,
    transitionId: string,
    physical: PhysicalExitResolution,
    source: { readonly stageId: string; readonly difficulty: number; readonly parSeconds: number },
    targetNode?: CampaignNode,
  ): CampaignRunState {
    const targetId = targetNode?.id;
    const revealed = targetId
      ? this.stateValue.graph.edges.filter(item => item.sourceNodeId === targetId).map(item => item.id)
      : [];
    const nextCounts = { ...this.stateValue.revisitCounts };
    if (targetId) nextCounts[targetId] = (nextCounts[targetId] ?? 0) + 1;
    return canonicalCampaignRunState({
      ...this.stateValue,
      status: edge.targetNodeId === 'campaign.complete' ? 'completed' : 'active',
      currentNodeId: targetId ?? this.stateValue.currentNodeId,
      visitedNodeIds: targetId
        ? uniqueAppend(this.stateValue.visitedNodeIds, targetId) : this.stateValue.visitedNodeIds,
      traversedEdgeIds: [...this.stateValue.traversedEdgeIds, edge.id],
      revealedEdgeIds: [...new Set([...this.stateValue.revealedEdgeIds, ...revealed])],
      revisitCounts: nextCounts,
      physicalExits: { ...this.stateValue.physicalExits, [edge.sourceNodeId]: physical },
      confirmedTransitionIds: [...this.stateValue.confirmedTransitionIds, transitionId],
      rewards: {
        ...this.stateValue.rewards,
        [transitionId]: {
          transitionId,
          stageInstanceId: edge.sourceNodeId,
          stageId: source.stageId,
          difficulty: source.difficulty,
          parSeconds: source.parSeconds,
          status: 'pending',
        },
      },
    });
  }

  private loadStage(node: CampaignNode, state: CampaignRunState = this.stateValue): StageLoadResult {
    const request: StageLoadRequest = {
      stageId: node.stageId,
      runId: state.graph.runId,
      runSeed: node.stageSeed,
      ...(state.nodeResumes[node.id]
        ? { resume: state.nodeResumes[node.id] }
        : {}),
    };
    try {
      return this.dependencies.loader.load(request);
    } catch (error) {
      return Object.freeze({
        ok: false as const,
        error: Object.freeze({
          code: 'load-failed' as const,
          stageId: node.stageId,
          diagnostics: Object.freeze([Object.freeze({
            code: 'campaign.router.stage-load-threw',
            severity: 'error' as const,
            message: `Stage loader threw: ${this.message(error)}.`,
            path: Object.freeze(['stage', node.id]),
            stageId: node.stageId,
          })]),
        }),
      });
    }
  }

  private success<T>(value: T): CampaignNavigationResult<T> {
    return Object.freeze({ ok: true as const, value });
  }

  private failure<T = never>(
    code: CampaignRouterFailureCode,
    message: string,
    referenceId: string | undefined,
    recovery: CampaignRouterFailure['recovery'],
    detail: Partial<CampaignRouterFailure> = {},
  ): CampaignNavigationResult<T> {
    return Object.freeze({
      ok: false as const,
      error: Object.freeze({ code, message, recovery, ...(referenceId ? { referenceId } : {}), ...detail }),
    });
  }

  private message(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}

