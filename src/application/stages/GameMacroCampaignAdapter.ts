import type { CampaignMacroDefinition, CampaignMacroLocation } from '../../stages';
import type {
  CampaignConfirmedTransition,
  CampaignNavigationView,
  CampaignPreparedTransition,
  CampaignRewardClaim,
  CampaignRewardRecord,
  CampaignRunState,
} from './CampaignNavigation';
import type {
  CampaignMacroRouteBindingFailure,
  CampaignMacroRouteInspection,
} from './CampaignMacroRouteBinder';
import { CampaignMacroRouteBinder } from './CampaignMacroRouteBinder';

export interface GameCampaignNavigationFailure {
  readonly code: string;
  readonly message: string;
  readonly recovery: 'unchanged' | 'rolled-back' | 'storage-state-unknown';
}

export type GameCampaignNavigationResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: GameCampaignNavigationFailure };

/** Minimum navigation surface consumed by GameScene for either campaign mode. */
export interface GameCampaignNavigationPort {
  state(): CampaignRunState;
  inspect(): GameCampaignNavigationResult<CampaignNavigationView>;
  prepare(physicalExitId: string): GameCampaignNavigationResult<CampaignPreparedTransition>;
  cancel(preparationId: string): boolean;
  confirm(preparationId: string): GameCampaignNavigationResult<CampaignConfirmedTransition>;
  rewards(): readonly CampaignRewardRecord[];
  unsettledRewards(): readonly CampaignRewardRecord[];
  reward(transitionId: string): CampaignRewardRecord | undefined;
  claimReward(transitionId: string): GameCampaignNavigationResult<CampaignRewardClaim>;
  acknowledgeReward(transitionId: string): GameCampaignNavigationResult<CampaignRewardClaim>;
}

export interface GameMacroCampaignLocationView {
  readonly location: CampaignMacroLocation;
  readonly regionName: string;
  readonly routeName?: string;
  readonly isHub: boolean;
}

interface PreparedMacroTransition {
  readonly connectionId: string;
  readonly transition: CampaignPreparedTransition;
}

/**
 * Phaser-facing projection of the headless macro binder. It filters out every
 * planned/unbound choice and delegates all mutations to the existing binder.
 */
export class GameMacroCampaignAdapter implements GameCampaignNavigationPort {
  private prepared?: PreparedMacroTransition;

  public constructor(
    private readonly definition: CampaignMacroDefinition,
    private readonly binder: CampaignMacroRouteBinder,
  ) {}

  public state(): CampaignRunState {
    return this.binder.state();
  }

  public campaignId(): string {
    return this.definition.id;
  }

  public inspect(): GameCampaignNavigationResult<CampaignNavigationView> {
    const inspected = this.binder.inspect();
    if (!inspected.ok) return this.binderFailure(inspected.error);
    return this.success(this.navigationView(inspected.value));
  }

  public prepare(physicalExitId: string): GameCampaignNavigationResult<CampaignPreparedTransition> {
    if (this.prepared) return this.failure(
      'transition-in-progress',
      'A macro transition is already prepared.',
      'unchanged',
    );
    const inspected = this.binder.inspect();
    if (!inspected.ok) return this.binderFailure(inspected.error);
    const choice = inspected.value.choices.find(item => item.physicalExitId === physicalExitId);
    if (!choice) return this.failure(
      'exit-not-found', 'Physical exit is not bound to a macro choice.', 'unchanged',
    );
    if (choice.status !== 'bound') return this.failure(
      'exit-blocked', `Physical exit is blocked: ${choice.blockedReason ?? choice.status}.`, 'unchanged',
    );
    const prepared = this.binder.prepare(choice.choice.connectionId);
    if (!prepared.ok) return this.binderFailure(prepared.error);
    this.prepared = Object.freeze({
      connectionId: choice.choice.connectionId,
      transition: prepared.value.preparation,
    });
    return this.success(prepared.value.preparation);
  }

  public confirm(preparationId: string): GameCampaignNavigationResult<CampaignConfirmedTransition> {
    const pending = this.prepared;
    if (!pending || pending.transition.preparationId !== preparationId) return this.failure(
      'transition-not-prepared', 'Preparation does not match the macro transition.', 'unchanged',
    );
    const confirmed = this.binder.confirm(preparationId);
    this.prepared = undefined;
    if (!confirmed.ok) {
      this.binder.cancel(preparationId);
      return this.binderFailure(confirmed.error);
    }
    return this.success(Object.freeze({
      status: 'confirmed' as const,
      transition: pending.transition,
      state: confirmed.value.state,
      persistence: confirmed.value.persistence,
    }));
  }

  public cancel(preparationId: string): boolean {
    const pending = this.prepared;
    if (!pending || pending.transition.preparationId !== preparationId) return false;
    const cancelled = this.binder.cancel(preparationId);
    if (cancelled) this.prepared = undefined;
    return cancelled;
  }

  public rewards(): readonly CampaignRewardRecord[] {
    return this.binder.rewards();
  }

  public unsettledRewards(): readonly CampaignRewardRecord[] {
    return this.binder.unsettledRewards();
  }

  public reward(transitionId: string): CampaignRewardRecord | undefined {
    return this.binder.reward(transitionId);
  }

  public claimReward(transitionId: string): GameCampaignNavigationResult<CampaignRewardClaim> {
    return this.binder.claimReward(transitionId);
  }

  public acknowledgeReward(transitionId: string): GameCampaignNavigationResult<CampaignRewardClaim> {
    return this.binder.acknowledgeReward(transitionId);
  }

  public location(): GameMacroCampaignLocationView {
    const progress = this.binder.state().macroProgress;
    const location = progress?.currentLocation ?? {
      kind: 'hub' as const,
      hubId: this.definition.hub.id,
    };
    if (location.kind === 'hub') return Object.freeze({
      location,
      regionName: this.definition.hub.title,
      isHub: true,
    });
    if (location.kind === 'route') {
      const route = this.definition.routes.find(item => item.id === location.routeId);
      const region = route?.regions.find(item => item.id === location.regionId);
      return Object.freeze({
        location,
        regionName: region?.title ?? location.regionId,
        routeName: route?.title ?? location.routeId,
        isHub: false,
      });
    }
    if (location.kind === 'corrupted') {
      const region = this.definition.corruptedLayer.regions.find(item => item.id === location.regionId);
      return Object.freeze({
        location,
        regionName: region?.title ?? location.regionId,
        routeName: this.definition.corruptedLayer.title,
        isHub: false,
      });
    }
    return Object.freeze({
      location,
      regionName: this.definition.final.title,
      isHub: false,
    });
  }

  private navigationView(inspection: CampaignMacroRouteInspection): CampaignNavigationView {
    const exposedIds = new Set(inspection.choices
      .filter(choice => choice.physicalExitId !== undefined)
      .map(choice => choice.physicalExitId as string));
    const navigation = inspection.navigation;
    return Object.freeze({
      ...navigation,
      snapshot: Object.freeze({
        ...navigation.snapshot,
        destinations: Object.freeze(navigation.snapshot.destinations
          .filter(destination => exposedIds.has(destination.physicalExitId))),
      }),
      physicalExits: Object.freeze({
        ...navigation.physicalExits,
        exits: Object.freeze(navigation.physicalExits.exits
          .filter(exit => exposedIds.has(exit.id))),
      }),
      bindings: Object.freeze(navigation.bindings
        .filter(binding => exposedIds.has(binding.physicalExitId))),
    });
  }

  private binderFailure<T>(error: CampaignMacroRouteBindingFailure): GameCampaignNavigationResult<T> {
    return this.failure(error.code, error.message, error.recovery);
  }

  private success<T>(value: T): GameCampaignNavigationResult<T> {
    return Object.freeze({ ok: true as const, value });
  }

  private failure<T>(
    code: string,
    message: string,
    recovery: GameCampaignNavigationFailure['recovery'],
  ): GameCampaignNavigationResult<T> {
    return Object.freeze({
      ok: false as const,
      error: Object.freeze({ code, message, recovery }),
    });
  }
}
