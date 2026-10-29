import type {
  CampaignContentReference,
  CampaignMacroDefinition,
  CampaignMacroDiagnostic,
  CampaignMacroLocation,
  CampaignMacroProgressState,
  CampaignRegionDefinition,
  CampaignRouteDefinition,
} from '../../stages';
import type {
  CampaignRunSaveFailure,
  CampaignRunSavePort,
  CampaignRunState,
} from './CampaignNavigation';
import {
  canonicalCampaignRunState,
  validateCampaignRunState,
} from './CampaignRunSaveService';
import {
  canonicalCampaignMacroProgress,
  createCampaignMacroProgress,
  isCampaignContentLoadable,
  validateCampaignMacroDefinition,
  validateCampaignMacroProgress,
} from './CampaignMacroState';

const STABLE_ID = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;

export type CampaignMacroCommand =
  | { readonly type: 'route.enter'; readonly operationId: string; readonly routeId: string }
  | {
      readonly type: 'route.region-entered';
      readonly operationId: string;
      readonly routeId: string;
      readonly regionId: string;
    }
  | {
      readonly type: 'route.region-completed';
      readonly operationId: string;
      readonly routeId: string;
      readonly regionId: string;
    }
  | { readonly type: 'hub.returned'; readonly operationId: string }
  | { readonly type: 'milestone.completed'; readonly operationId: string; readonly milestoneId: string }
  | { readonly type: 'corrupted.enter'; readonly operationId: string }
  | {
      readonly type: 'corrupted.region-entered';
      readonly operationId: string;
      readonly regionId: string;
    }
  | {
      readonly type: 'corrupted.region-completed';
      readonly operationId: string;
      readonly regionId: string;
    }
  | { readonly type: 'final.enter'; readonly operationId: string };

export type CampaignMacroFailureCode =
  | 'invalid-definition'
  | 'invalid-run'
  | 'invalid-progress'
  | 'invalid-operation'
  | 'invalid-transition'
  | 'route-not-found'
  | 'region-not-found'
  | 'region-out-of-order'
  | 'milestone-not-found'
  | 'milestone-not-ready'
  | 'layer-locked'
  | 'final-locked'
  | 'persistence-failed';

export interface CampaignMacroFailure {
  readonly code: CampaignMacroFailureCode;
  readonly message: string;
  readonly referenceId?: string;
  readonly diagnostics: readonly CampaignMacroDiagnostic[];
  readonly persistenceFailure?: CampaignRunSaveFailure;
  readonly recovery: 'unchanged' | 'rolled-back' | 'storage-state-unknown';
}

export interface CampaignMacroOperationReceipt {
  readonly status: 'applied' | 'duplicate';
  readonly operationId: string;
  readonly state: CampaignRunState;
  readonly macroProgress: CampaignMacroProgressState;
  readonly emittedOperationIds: readonly string[];
  readonly persistence: 'saved' | 'verified-after-error' | 'skipped';
}

export type CampaignMacroResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: CampaignMacroFailure };

export type CampaignMacroChoiceKind =
  | 'enter-route'
  | 'continue-route'
  | 'advance-route-region'
  | 'return-hub'
  | 'enter-corrupted'
  | 'advance-corrupted-region'
  | 'enter-final';

export interface CampaignMacroChoice {
  readonly connectionId: string;
  readonly kind: CampaignMacroChoiceKind;
  readonly source: CampaignMacroLocation;
  readonly target: CampaignMacroLocation;
  readonly content: CampaignContentReference;
  readonly unlocked: boolean;
  readonly requiresPhysicalExit: true;
  readonly exposePhysicalExit: boolean;
  readonly blockedReason?: 'progress-locked' | 'content-not-loadable';
}

export interface CampaignMacroInspection {
  readonly definitionId: string;
  readonly definitionRevision: number;
  readonly currentLocation: CampaignMacroLocation;
  readonly routes: CampaignMacroProgressState['routes'];
  readonly completedMilestoneIds: readonly string[];
  readonly corruptedStatus: CampaignMacroProgressState['corrupted']['status'];
  readonly finalStatus: CampaignMacroProgressState['finalStatus'];
  readonly choices: readonly CampaignMacroChoice[];
}

export type CampaignMacroCreationResult = CampaignMacroResult<CampaignMacroProgression>;

function compare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function uniqueAppend(values: readonly string[], value: string): readonly string[] {
  return values.includes(value) ? values : [...values, value];
}

export class CampaignMacroProgression {
  private constructor(
    private readonly definition: CampaignMacroDefinition,
    private stateValue: CampaignRunState,
    private readonly saves?: CampaignRunSavePort,
  ) {}

  public static create(
    definition: CampaignMacroDefinition,
    run: CampaignRunState,
    saves?: CampaignRunSavePort,
  ): CampaignMacroCreationResult {
    const definitionDiagnostics = validateCampaignMacroDefinition(definition);
    if (definitionDiagnostics.length > 0) return this.failureStatic(
      'invalid-definition', 'Macro campaign definition is invalid.', definitionDiagnostics,
    );
    const runDiagnostics = validateCampaignRunState(run);
    if (runDiagnostics.length > 0) return this.failureStatic(
      'invalid-run', 'Campaign run is invalid.', runDiagnostics,
    );
    const macro = run.macroProgress ?? createCampaignMacroProgress(definition);
    const macroDiagnostics = validateCampaignMacroProgress(macro, definition);
    if (macroDiagnostics.length > 0) return this.failureStatic(
      'invalid-progress', 'Macro campaign progress is incompatible.', macroDiagnostics,
    );
    const candidate = canonicalCampaignRunState({ ...run, macroProgress: macro });
    if (run.macroProgress || !saves) {
      return Object.freeze({
        ok: true as const,
        value: new CampaignMacroProgression(definition, candidate, saves),
      });
    }
    const persisted = saves.save(candidate, run);
    if (!persisted.ok) return this.persistenceFailureStatic(
      'Macro progress initialization was rolled back.', persisted.error,
    );
    return Object.freeze({
      ok: true as const,
      value: new CampaignMacroProgression(definition, candidate, saves),
    });
  }

  public state(): CampaignRunState {
    return this.stateValue;
  }

  public macroProgress(): CampaignMacroProgressState {
    return this.stateValue.macroProgress as CampaignMacroProgressState;
  }

  public inspect(): CampaignMacroInspection {
    const progress = this.macroProgress();
    return Object.freeze({
      definitionId: progress.definitionId,
      definitionRevision: progress.definitionRevision,
      currentLocation: progress.currentLocation,
      routes: progress.routes,
      completedMilestoneIds: progress.completedMilestoneIds,
      corruptedStatus: progress.corrupted.status,
      finalStatus: progress.finalStatus,
      choices: Object.freeze(this.choices(progress).sort((left, right) =>
        compare(left.connectionId, right.connectionId))),
    });
  }

  public process(command: CampaignMacroCommand): CampaignMacroResult<CampaignMacroOperationReceipt> {
    if (!STABLE_ID.test(command.operationId)) return this.failure(
      'invalid-operation', 'operationId must be a stable identifier.', command.operationId,
    );
    const current = this.macroProgress();
    if (current.processedOperationIds.includes(command.operationId)) return this.success(Object.freeze({
      status: 'duplicate' as const,
      operationId: command.operationId,
      state: this.stateValue,
      macroProgress: current,
      emittedOperationIds: Object.freeze([]),
      persistence: 'skipped' as const,
    }));
    if (command.type === 'milestone.completed' &&
      current.completedMilestoneIds.includes(command.milestoneId)) {
      return this.success(Object.freeze({
        status: 'duplicate' as const,
        operationId: command.operationId,
        state: this.stateValue,
        macroProgress: current,
        emittedOperationIds: Object.freeze([]),
        persistence: 'skipped' as const,
      }));
    }

    const changed = this.apply(current, command);
    if (!changed.ok) return changed;
    const nextMacro = canonicalCampaignMacroProgress({
      ...changed.value.progress,
      processedOperationIds: uniqueAppend(
        changed.value.progress.processedOperationIds,
        command.operationId,
      ),
    });
    const diagnostics = validateCampaignMacroProgress(nextMacro, this.definition);
    if (diagnostics.length > 0) return this.failure(
      'invalid-progress', 'Operation produced invalid macro progress.', command.operationId, diagnostics,
    );
    const candidate = canonicalCampaignRunState({ ...this.stateValue, macroProgress: nextMacro });
    let persistence: CampaignMacroOperationReceipt['persistence'] = 'skipped';
    if (this.saves) {
      const saved = this.saves.save(candidate, this.stateValue);
      if (!saved.ok) return this.persistenceFailure(
        'Macro progress operation was rolled back.', saved.error, command.operationId,
      );
      persistence = saved.value.persistence === 'verified-after-error'
        ? 'verified-after-error' : 'saved';
    }
    this.stateValue = candidate;
    return this.success(Object.freeze({
      status: 'applied' as const,
      operationId: command.operationId,
      state: candidate,
      macroProgress: nextMacro,
      emittedOperationIds: Object.freeze(changed.value.emittedOperationIds),
      persistence,
    }));
  }

  private apply(
    current: CampaignMacroProgressState,
    command: CampaignMacroCommand,
  ): CampaignMacroResult<{
    readonly progress: CampaignMacroProgressState;
    readonly emittedOperationIds: readonly string[];
  }> {
    switch (command.type) {
      case 'route.enter': return this.enterRoute(current, command.routeId);
      case 'route.region-entered': return this.enterRouteRegion(current, command.routeId, command.regionId);
      case 'route.region-completed': return this.completeRouteRegion(current, command.routeId, command.regionId);
      case 'hub.returned': return this.returnToHub(current);
      case 'milestone.completed': return this.completeMilestone(current, command.milestoneId);
      case 'corrupted.enter': return this.enterCorrupted(current);
      case 'corrupted.region-entered': return this.enterCorruptedRegion(current, command.regionId);
      case 'corrupted.region-completed': return this.completeCorruptedRegion(current, command.regionId);
      case 'final.enter': return this.enterFinal(current);
    }
  }

  private enterRoute(
    current: CampaignMacroProgressState,
    routeId: string,
  ): ReturnType<CampaignMacroProgression['change']> {
    if (current.currentLocation.kind !== 'hub') return this.transitionFailure(
      'Routes can only be entered from the hub.', routeId,
    );
    const route = this.route(routeId);
    if (!route) return this.failure('route-not-found', 'Route is not declared.', routeId);
    const progress = current.routes[routeId];
    if (progress.status === 'completed') return this.transitionFailure('Completed route is closed in this skeleton.', routeId);
    const region = route.regions[progress.completedRegionIds.length] ?? route.regions.at(-1);
    if (!region) return this.failure('region-not-found', 'Route has no region.', routeId);
    return this.change({
      ...current,
      currentLocation: { kind: 'route', routeId, regionId: region.id },
      routes: {
        ...current.routes,
        [routeId]: { ...progress, status: 'in-progress', currentRegionId: region.id },
      },
    });
  }

  private enterRouteRegion(
    current: CampaignMacroProgressState,
    routeId: string,
    regionId: string,
  ): ReturnType<CampaignMacroProgression['change']> {
    const route = this.route(routeId);
    if (!route) return this.failure('route-not-found', 'Route is not declared.', routeId);
    const progress = current.routes[routeId];
    const expected = route.regions[progress.completedRegionIds.length];
    if (!expected || expected.id !== regionId) return this.failure(
      'region-out-of-order', 'Only the next ordered region can be entered.', regionId,
    );
    if (current.currentLocation.kind !== 'route' || current.currentLocation.routeId !== routeId) {
      return this.transitionFailure('Route region transition requires the active route.', regionId);
    }
    return this.change({
      ...current,
      currentLocation: { kind: 'route', routeId, regionId },
      routes: { ...current.routes, [routeId]: { ...progress, currentRegionId: regionId } },
    });
  }

  private completeRouteRegion(
    current: CampaignMacroProgressState,
    routeId: string,
    regionId: string,
  ): ReturnType<CampaignMacroProgression['change']> {
    const route = this.route(routeId);
    if (!route) return this.failure('route-not-found', 'Route is not declared.', routeId);
    const progress = current.routes[routeId];
    const expected = route.regions[progress.completedRegionIds.length];
    if (!expected || expected.id !== regionId || progress.currentRegionId !== regionId ||
      current.currentLocation.kind !== 'route' || current.currentLocation.routeId !== routeId) {
      return this.failure('region-out-of-order', 'Region completion must follow route order.', regionId);
    }
    return this.change({
      ...current,
      routes: {
        ...current.routes,
        [routeId]: {
          ...progress,
          completedRegionIds: [...progress.completedRegionIds, regionId],
        },
      },
    });
  }

  private returnToHub(current: CampaignMacroProgressState): ReturnType<CampaignMacroProgression['change']> {
    let region: CampaignRegionDefinition | undefined;
    if (current.currentLocation.kind === 'route') {
      const location = current.currentLocation;
      region = this.route(location.routeId)?.regions
        .find(item => item.id === location.regionId);
    } else if (current.currentLocation.kind === 'corrupted') {
      const location = current.currentLocation;
      region = this.definition.corruptedLayer.regions
        .find(item => item.id === location.regionId);
    } else return this.transitionFailure('Current location cannot return to the hub.');
    if (!region?.allowsHubReturn) return this.transitionFailure('Current region does not allow hub return.', region?.id);
    return this.change({
      ...current,
      currentLocation: { kind: 'hub', hubId: this.definition.hub.id },
    });
  }

  private completeMilestone(
    current: CampaignMacroProgressState,
    milestoneId: string,
  ): ReturnType<CampaignMacroProgression['change']> {
    const milestone = this.definition.milestones.find(item => item.id === milestoneId);
    if (!milestone) return this.failure('milestone-not-found', 'Milestone is not declared.', milestoneId);
    if (current.completedMilestoneIds.includes(milestoneId)) return this.change(current, []);
    if (milestone.scope.kind === 'route') {
      const route = this.route(milestone.scope.routeId) as CampaignRouteDefinition;
      const routeProgress = current.routes[route.id];
      if (routeProgress.completedRegionIds.length !== route.regions.length) return this.failure(
        'milestone-not-ready', 'Every route region must be completed before its milestone.', milestoneId,
      );
      const routes = {
        ...current.routes,
        [route.id]: { ...routeProgress, status: 'completed' as const, currentRegionId: undefined },
      };
      const allCompleted = this.definition.routes.every(item => routes[item.id].status === 'completed');
      return this.change({
        ...current,
        routes,
        completedMilestoneIds: [...current.completedMilestoneIds, milestoneId],
        corrupted: allCompleted && current.corrupted.status === 'locked'
          ? { ...current.corrupted, status: 'available' as const }
          : current.corrupted,
        currentLocation: { kind: 'hub', hubId: this.definition.hub.id },
      }, [milestone.completionOperationId]);
    }
    if (current.corrupted.completedRegionIds.length !== this.definition.corruptedLayer.regions.length) {
      return this.failure('milestone-not-ready',
        'Every corrupted region must be completed before its milestone.', milestoneId);
    }
    return this.change({
      ...current,
      completedMilestoneIds: [...current.completedMilestoneIds, milestoneId],
      corrupted: { ...current.corrupted, status: 'milestone-completed', currentRegionId: undefined },
      finalStatus: 'available',
      currentLocation: { kind: 'hub', hubId: this.definition.hub.id },
    }, [milestone.completionOperationId]);
  }

  private enterCorrupted(current: CampaignMacroProgressState): ReturnType<CampaignMacroProgression['change']> {
    if (current.currentLocation.kind !== 'hub') return this.transitionFailure(
      'Corrupted layer can only be entered from the hub.', this.definition.corruptedLayer.id,
    );
    if (current.corrupted.status === 'locked') return this.failure(
      'layer-locked', 'Corrupted layer is still locked.', this.definition.corruptedLayer.id,
    );
    const region = this.definition.corruptedLayer.regions[current.corrupted.completedRegionIds.length] ??
      this.definition.corruptedLayer.regions.at(-1);
    if (!region) return this.failure('region-not-found', 'Corrupted layer has no region.');
    return this.change({
      ...current,
      currentLocation: { kind: 'corrupted', regionId: region.id },
      corrupted: { ...current.corrupted, status: 'in-progress', currentRegionId: region.id },
    });
  }

  private enterCorruptedRegion(
    current: CampaignMacroProgressState,
    regionId: string,
  ): ReturnType<CampaignMacroProgression['change']> {
    const expected = this.definition.corruptedLayer.regions[current.corrupted.completedRegionIds.length];
    if (!expected || expected.id !== regionId || current.currentLocation.kind !== 'corrupted') {
      return this.failure('region-out-of-order', 'Only the next corrupted region can be entered.', regionId);
    }
    return this.change({
      ...current,
      currentLocation: { kind: 'corrupted', regionId },
      corrupted: { ...current.corrupted, status: 'in-progress', currentRegionId: regionId },
    });
  }

  private completeCorruptedRegion(
    current: CampaignMacroProgressState,
    regionId: string,
  ): ReturnType<CampaignMacroProgression['change']> {
    const expected = this.definition.corruptedLayer.regions[current.corrupted.completedRegionIds.length];
    if (!expected || expected.id !== regionId || current.corrupted.currentRegionId !== regionId ||
      current.currentLocation.kind !== 'corrupted') return this.failure(
      'region-out-of-order', 'Corrupted region completion must follow order.', regionId,
    );
    return this.change({
      ...current,
      corrupted: {
        ...current.corrupted,
        completedRegionIds: [...current.corrupted.completedRegionIds, regionId],
      },
    });
  }

  private enterFinal(current: CampaignMacroProgressState): ReturnType<CampaignMacroProgression['change']> {
    if (current.currentLocation.kind !== 'hub') return this.transitionFailure(
      'Final can only be entered from the hub.', this.definition.final.id,
    );
    if (current.finalStatus === 'locked') return this.failure(
      'final-locked', 'Final is still locked.', this.definition.final.id,
    );
    return this.change({
      ...current,
      finalStatus: 'entered',
      currentLocation: { kind: 'final', finalId: this.definition.final.id },
    });
  }

  private choices(progress: CampaignMacroProgressState): CampaignMacroChoice[] {
    const result: CampaignMacroChoice[] = [];
    if (progress.currentLocation.kind === 'hub') {
      for (const route of this.definition.routes) {
        const state = progress.routes[route.id];
        const region = route.regions[state.completedRegionIds.length] ?? route.regions.at(-1);
        if (!region) continue;
        result.push(this.choice(
          `connection.${this.definition.hub.id}.${route.id}`,
          state.status === 'not-started' ? 'enter-route' : 'continue-route',
          progress.currentLocation,
          { kind: 'route', routeId: route.id, regionId: region.id },
          region.content,
          state.status !== 'completed',
        ));
      }
      const corruptedRegion = this.definition.corruptedLayer.regions[
        progress.corrupted.completedRegionIds.length
      ] ?? this.definition.corruptedLayer.regions.at(-1);
      if (corruptedRegion) result.push(this.choice(
        `connection.${this.definition.hub.id}.${this.definition.corruptedLayer.id}`,
        'enter-corrupted', progress.currentLocation,
        { kind: 'corrupted', regionId: corruptedRegion.id }, corruptedRegion.content,
        progress.corrupted.status !== 'locked' && progress.corrupted.status !== 'milestone-completed',
      ));
      result.push(this.choice(
        `connection.${this.definition.hub.id}.${this.definition.final.id}`,
        'enter-final', progress.currentLocation,
        { kind: 'final', finalId: this.definition.final.id }, this.definition.final.content,
        progress.finalStatus !== 'locked',
      ));
    } else if (progress.currentLocation.kind === 'route') {
      const location = progress.currentLocation;
      const route = this.route(location.routeId);
      const state = progress.routes[location.routeId];
      const currentRegion = route?.regions.find(item => item.id === location.regionId);
      const next = route?.regions[state.completedRegionIds.length];
      if (next && next.id !== location.regionId) result.push(this.choice(
        `connection.${currentRegion?.id}.${next.id}`,
        'advance-route-region', progress.currentLocation,
        { kind: 'route', routeId: route?.id as string, regionId: next.id }, next.content, true,
      ));
      if (currentRegion?.allowsHubReturn) result.push(this.choice(
        `connection.${currentRegion.id}.${this.definition.hub.id}`,
        'return-hub', progress.currentLocation,
        { kind: 'hub', hubId: this.definition.hub.id }, this.definition.hub.content, true,
      ));
    } else if (progress.currentLocation.kind === 'corrupted') {
      const location = progress.currentLocation;
      const currentRegion = this.definition.corruptedLayer.regions
        .find(item => item.id === location.regionId);
      const next = this.definition.corruptedLayer.regions[progress.corrupted.completedRegionIds.length];
      if (next && next.id !== location.regionId) result.push(this.choice(
        `connection.${currentRegion?.id}.${next.id}`,
        'advance-corrupted-region', progress.currentLocation,
        { kind: 'corrupted', regionId: next.id }, next.content, true,
      ));
      if (currentRegion?.allowsHubReturn) result.push(this.choice(
        `connection.${currentRegion.id}.${this.definition.hub.id}`,
        'return-hub', progress.currentLocation,
        { kind: 'hub', hubId: this.definition.hub.id }, this.definition.hub.content, true,
      ));
    }
    return result;
  }

  private choice(
    connectionId: string,
    kind: CampaignMacroChoiceKind,
    source: CampaignMacroLocation,
    target: CampaignMacroLocation,
    content: CampaignContentReference,
    unlocked: boolean,
  ): CampaignMacroChoice {
    const loadable = isCampaignContentLoadable(content);
    return Object.freeze({
      connectionId,
      kind,
      source,
      target: Object.freeze(target),
      content,
      unlocked,
      requiresPhysicalExit: true as const,
      exposePhysicalExit: unlocked && loadable,
      ...(!unlocked
        ? { blockedReason: 'progress-locked' as const }
        : !loadable ? { blockedReason: 'content-not-loadable' as const } : {}),
    });
  }

  private route(routeId: string): CampaignRouteDefinition | undefined {
    return this.definition.routes.find(route => route.id === routeId);
  }

  private change(
    progress: CampaignMacroProgressState,
    emittedOperationIds: readonly string[] = [],
  ): CampaignMacroResult<{
    readonly progress: CampaignMacroProgressState;
    readonly emittedOperationIds: readonly string[];
  }> {
    return this.success(Object.freeze({ progress, emittedOperationIds }));
  }

  private transitionFailure(message: string, referenceId?: string): ReturnType<CampaignMacroProgression['change']> {
    return this.failure('invalid-transition', message, referenceId);
  }

  private success<T>(value: T): CampaignMacroResult<T> {
    return Object.freeze({ ok: true as const, value });
  }

  private failure<T = never>(
    code: CampaignMacroFailureCode,
    message: string,
    referenceId?: string,
    diagnostics: readonly CampaignMacroDiagnostic[] = [],
  ): CampaignMacroResult<T> {
    return Object.freeze({
      ok: false as const,
      error: Object.freeze({
        code,
        message,
        diagnostics,
        recovery: 'unchanged' as const,
        ...(referenceId ? { referenceId } : {}),
      }),
    });
  }

  private persistenceFailure<T = never>(
    message: string,
    error: CampaignRunSaveFailure,
    referenceId?: string,
  ): CampaignMacroResult<T> {
    return Object.freeze({
      ok: false as const,
      error: Object.freeze({
        code: 'persistence-failed' as const,
        message,
        diagnostics: Object.freeze([]),
        recovery: error.recovery === 'storage-state-unknown'
          ? 'storage-state-unknown' as const : 'rolled-back' as const,
        persistenceFailure: error,
        ...(referenceId ? { referenceId } : {}),
      }),
    });
  }

  private static failureStatic<T = never>(
    code: CampaignMacroFailureCode,
    message: string,
    diagnostics: readonly CampaignMacroDiagnostic[],
  ): CampaignMacroResult<T> {
    return Object.freeze({
      ok: false as const,
      error: Object.freeze({ code, message, diagnostics, recovery: 'unchanged' as const }),
    });
  }

  private static persistenceFailureStatic<T = never>(
    message: string,
    error: CampaignRunSaveFailure,
  ): CampaignMacroResult<T> {
    return Object.freeze({
      ok: false as const,
      error: Object.freeze({
        code: 'persistence-failed' as const,
        message,
        diagnostics: Object.freeze([]),
        recovery: error.recovery === 'storage-state-unknown'
          ? 'storage-state-unknown' as const : 'rolled-back' as const,
        persistenceFailure: error,
      }),
    });
  }
}
