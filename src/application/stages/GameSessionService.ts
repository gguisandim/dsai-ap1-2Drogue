import type { SaveStoragePort } from '../../narrative';
import {
  CampaignCompositionService,
  CampaignExitBinder,
  PhysicalExitResolver,
  StageCatalogService,
  StageLoader,
  StageRegistry,
  createFixedNineCompositionRequest,
  registerCampaignChapters,
  registerLegacyStages,
} from '../../stages';
import type {
  CampaignCompositionDiagnostic,
  CampaignCompositionFailureCode,
  CampaignCompositionRequest,
  CampaignCompositionSlotSelection,
  CampaignCompositionSnapshot,
  CampaignGraph,
  LoadedStage,
  StageCatalogDiagnostic,
  StageCatalogEntry,
  StageLoadFailure,
} from '../../stages';
import type {
  CampaignNavigationView,
  CampaignRouterFailure,
  CampaignRunSaveFailure,
  CampaignRunState,
} from './CampaignNavigation';
import { CampaignRouter, createCampaignRunState } from './CampaignRouter';
import { CampaignRunSaveService } from './CampaignRunSaveService';
import { GameStageCompositionRoot } from './GameStageCompositionRoot';

export const COMPOSED_CAMPAIGN_ID = 'campaign.umbra-trail.composed';
export const COMPOSED_CAMPAIGN_REVISION = 1;
export const COMPOSED_CAMPAIGN_RUN_STORAGE_KEY = 'umbra-trail-composed-run-v1';
export const COMPOSED_CAMPAIGN_REQUIRED_STAGE_COUNT = 9;

export type GameModeId =
  | 'campaign-random'
  | 'campaign-custom'
  | 'campaign-classic'
  | 'stage-individual';

export interface GameModeAvailability {
  readonly mode: GameModeId;
  readonly enabled: boolean;
  readonly reason?: string;
}

export interface GameIndividualStageView {
  readonly stageId: string;
  readonly chapterId: string;
  readonly title: string;
  readonly biomeIds: readonly string[];
  readonly regionIds: readonly string[];
  readonly role: StageCatalogEntry['role'];
  readonly eligibility: StageCatalogEntry['eligibility'];
  readonly difficulty?: { readonly minimum: number; readonly maximum: number };
  readonly enabled: boolean;
  readonly reason?: string;
}

export interface GameSavedCampaignView {
  readonly seed: string;
  readonly runId: string;
  readonly compositionId: string;
  readonly currentNodeId: string;
  readonly currentStageId: string;
  readonly status: 'active' | 'completed';
  readonly assignments: readonly CampaignCompositionSlotSelection[];
}

export interface GameSessionMenuState {
  readonly catalogReady: boolean;
  readonly catalogDiagnostics: readonly StageCatalogDiagnostic[];
  readonly eligibleStageCount: number;
  readonly candidateStageCount: number;
  readonly requiredStageCount: number;
  readonly modes: readonly GameModeAvailability[];
  readonly compositionDiagnostics: readonly CampaignCompositionDiagnostic[];
  readonly randomCampaignAvailable: boolean;
  readonly individualStages: readonly GameIndividualStageView[];
  readonly savedCampaign?: GameSavedCampaignView;
  readonly savedCampaignError?: string;
}

export interface GameComposedSession {
  readonly campaignId: string;
  readonly runId: string;
  readonly runSeed: string;
  readonly graph: CampaignGraph;
  readonly snapshot: CampaignCompositionSnapshot;
  readonly router: CampaignRouter;
  readonly navigation: CampaignNavigationView;
  readonly composition: GameStageCompositionRoot;
  readonly persistence: 'created' | 'restored' | 'volatile';
}

export interface GameIndividualSession {
  readonly stageId: string;
  readonly loadedStage: LoadedStage;
  readonly composition: GameStageCompositionRoot;
}

export type GameSessionFailureCode =
  | 'catalog-invalid'
  | 'invalid-seed'
  | 'composition-failed'
  | 'save-failed'
  | 'navigation-failed'
  | 'restore-failed'
  | 'run-completed'
  | 'stage-not-found'
  | 'stage-incompatible'
  | 'stage-load-failed';

export interface GameSessionFailure {
  readonly code: GameSessionFailureCode;
  readonly message: string;
  readonly composition?: {
    readonly code: CampaignCompositionFailureCode;
    readonly diagnostics: readonly CampaignCompositionDiagnostic[];
  };
  readonly save?: CampaignRunSaveFailure;
  readonly stage?: StageLoadFailure;
  readonly router?: CampaignRouterFailure;
}

export type GameSessionResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: GameSessionFailure };

export interface GameSessionServiceOptions {
  readonly registry?: StageRegistry;
  readonly storage?: SaveStoragePort;
  readonly storageKey?: string;
}

interface ComposedRequestInput {
  readonly seed: string;
  readonly selections?: readonly CampaignCompositionSlotSelection[];
}

function compare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function hashHex(...parts: readonly string[]): string {
  const text = parts.map(part => `${part.length}:${part}`).join('|');
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/** Two independent 32-bit accumulators widen the persisted run identity to 64 bits. */
function hashHex64(...parts: readonly string[]): string {
  const text = parts.map(part => `${part.length}:${part}`).join('|');
  let fnv = 2166136261;
  let djb = 5381;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    fnv = Math.imul(fnv ^ code, 16777619) >>> 0;
    djb = (Math.imul(djb, 33) + code) >>> 0;
  }
  return `${fnv.toString(16).padStart(8, '0')}${djb.toString(16).padStart(8, '0')}`;
}

function canonicalSelections(
  selections: readonly CampaignCompositionSlotSelection[],
): readonly CampaignCompositionSlotSelection[] {
  return Object.freeze([...selections]
    .map(selection => Object.freeze({ slotId: selection.slotId, stageId: selection.stageId }))
    .sort((left, right) => compare(left.slotId, right.slotId)));
}

/** Stable run identity: same seed and manual selection resume the same run. */
export function composedCampaignRunId(
  seed: string,
  selections?: readonly CampaignCompositionSlotSelection[],
): string {
  const material = selectionMaterial(selections);
  return `run.composed.${hashHex64('composed', seed, material)}`;
}

/**
 * Pre-9.6D identity kept only so existing composed saves remain resumable.
 * New runs always use the 64-bit `composedCampaignRunId`.
 */
export function legacyComposedCampaignRunId(
  seed: string,
  selections?: readonly CampaignCompositionSlotSelection[],
): string {
  return `run.composed.${hashHex('composed', seed, selectionMaterial(selections))}`;
}

function selectionMaterial(selections?: readonly CampaignCompositionSlotSelection[]): string {
  return selections
    ? canonicalSelections(selections).map(item => `${item.slotId}=${item.stageId}`).join('|')
    : 'random';
}

function graphMatchesSnapshot(graph: CampaignGraph, snapshot: CampaignCompositionSnapshot): boolean {
  if (snapshot.assignments.length !== graph.nodes.length) return false;
  return snapshot.assignments.every(assignment => graph.nodes.some(node =>
    node.slotId === assignment.slotId &&
    node.stageId === assignment.stageId &&
    node.actId === assignment.actId &&
    node.depth === assignment.depth));
}

function success<T>(value: T): GameSessionResult<T> {
  return Object.freeze({ ok: true as const, value });
}

function failure<T = never>(
  code: GameSessionFailureCode,
  message: string,
  detail: Omit<GameSessionFailure, 'code' | 'message'> = {},
): GameSessionResult<T> {
  return Object.freeze({ ok: false as const, error: Object.freeze({ code, message, ...detail }) });
}

function createRegistry(): StageRegistry {
  const registry = new StageRegistry();
  registerLegacyStages(registry);
  registerCampaignChapters(registry);
  return registry;
}

/**
 * Headless orchestration for the four game modes. It composes or restores a
 * run, persists the snapshot before play, and exposes an individual-stage
 * session. No Phaser, scene, DOM or engine-internal dependency lives here.
 */
export class GameSessionService {
  public readonly registry: StageRegistry;
  public readonly catalog?: StageCatalogService;
  public readonly catalogDiagnostics: readonly StageCatalogDiagnostic[];
  private readonly loader: StageLoader;
  private readonly campaignStorage?: SaveStoragePort;
  private readonly saves?: CampaignRunSaveService;

  public constructor(options: GameSessionServiceOptions = {}) {
    this.registry = options.registry ?? createRegistry();
    this.loader = new StageLoader(this.registry);
    this.campaignStorage = options.storage;
    const created = StageCatalogService.create(this.registry);
    if (created.ok) {
      this.catalog = created.value;
      this.catalogDiagnostics = created.value.diagnostics();
    } else {
      this.catalog = undefined;
      this.catalogDiagnostics = created.error.diagnostics;
    }
    this.saves = options.storage
      ? new CampaignRunSaveService({
          storage: options.storage,
          storageKey: options.storageKey ?? COMPOSED_CAMPAIGN_RUN_STORAGE_KEY,
        })
      : undefined;
  }

  public menuState(): GameSessionMenuState {
    const eligible = this.catalog ? [...this.catalog.eligible()] : [];
    const candidateCount = this.catalog ? this.catalog.list().filter(entry =>
      entry.eligibility === 'campaign-eligible' || entry.eligibility === 'narrative-reserved').length : 0;
    const preview = this.previewRandomCampaign('menu.preview.seed');
    const compositionDiagnostics = preview.ok
      ? preview.value.diagnostics
      : preview.error.composition?.diagnostics ?? [];
    const randomAvailable = preview.ok && preview.value.snapshot.assignments.length ===
      COMPOSED_CAMPAIGN_REQUIRED_STAGE_COUNT;
    const reason = randomAvailable ? undefined
      : compositionDiagnostics[0]?.message ?? 'Catálogo insuficiente para nove fases.';
    const individualStages = this.individualStages();
    const saved = this.savedCampaign();
    return Object.freeze({
      catalogReady: this.catalog !== undefined,
      catalogDiagnostics: Object.freeze([...this.catalogDiagnostics]),
      eligibleStageCount: eligible.length,
      candidateStageCount: candidateCount,
      requiredStageCount: COMPOSED_CAMPAIGN_REQUIRED_STAGE_COUNT,
      modes: Object.freeze([
        Object.freeze({
          mode: 'campaign-random' as const,
          enabled: randomAvailable,
          ...(reason ? { reason } : {}),
        }),
        Object.freeze({
          mode: 'campaign-custom' as const,
          enabled: randomAvailable,
          ...(reason ? { reason } : {}),
        }),
        Object.freeze({ mode: 'campaign-classic' as const, enabled: true }),
        Object.freeze({
          mode: 'stage-individual' as const,
          enabled: individualStages.some(item => item.enabled),
          ...(individualStages.some(item => item.enabled)
            ? {} : { reason: 'Nenhuma fase carregável disponível.' }),
        }),
      ]),
      compositionDiagnostics: Object.freeze([...compositionDiagnostics]),
      randomCampaignAvailable: randomAvailable,
      individualStages,
      ...(saved.view ? { savedCampaign: saved.view } : {}),
      ...(saved.error ? { savedCampaignError: saved.error } : {}),
    });
  }

  public individualStages(): readonly GameIndividualStageView[] {
    if (!this.catalog) return Object.freeze([]);
    return Object.freeze(this.catalog.list().map(entry => this.individualView(entry)));
  }

  public previewRandomCampaign(seed: string): GameSessionResult<{
    readonly snapshot: CampaignCompositionSnapshot;
    readonly graph: CampaignGraph;
    readonly diagnostics: readonly CampaignCompositionDiagnostic[];
  }> {
    return this.previewComposition({ seed });
  }

  public previewCustomCampaign(
    selections: readonly CampaignCompositionSlotSelection[],
    seed: string,
  ): GameSessionResult<{
    readonly snapshot: CampaignCompositionSnapshot;
    readonly graph: CampaignGraph;
    readonly diagnostics: readonly CampaignCompositionDiagnostic[];
  }> {
    return this.previewComposition({ seed, selections });
  }

  public startRandomCampaign(seed: string): GameSessionResult<GameComposedSession> {
    return this.startComposedCampaign({ seed });
  }

  public startCustomCampaign(
    selections: readonly CampaignCompositionSlotSelection[],
    seed: string,
  ): GameSessionResult<GameComposedSession> {
    return this.startComposedCampaign({ seed, selections });
  }

  public startIndividualStage(stageId: string): GameSessionResult<GameIndividualSession> {
    if (!this.catalog) return failure('catalog-invalid', 'Stage catalog is invalid.');
    const entry = this.catalog.get(stageId);
    if (!entry) return failure('stage-not-found', `Unknown stage: ${stageId}.`);
    const view = this.individualView(entry);
    if (!view.enabled) return failure('stage-incompatible',
      view.reason ?? `Stage is not individually playable: ${stageId}.`);
    const loaded = this.loader.load({
      stageId,
      runId: `individual.${stageId}`,
      runSeed: `individual.${stageId}`,
    });
    if (!loaded.ok) return failure('stage-load-failed',
      `Stage could not be loaded: ${stageId}.`, { stage: loaded.error });
    return success(Object.freeze({
      stageId,
      loadedStage: loaded.value,
      composition: new GameStageCompositionRoot({
        registry: this.registry,
        loader: this.loader,
      }),
    }));
  }

  private individualView(entry: StageCatalogEntry): GameIndividualStageView {
    // The catalog already classifies unsatisfied dependencies/capabilities as
    // non-loadable, so only loadability decides individual availability.
    const enabled = entry.loadability === 'loadable';
    const reason = enabled ? undefined : `Fase indisponível: ${entry.loadability}.`;
    return Object.freeze({
      stageId: entry.stageId,
      chapterId: entry.chapterId,
      title: entry.title,
      biomeIds: entry.biomeIds,
      regionIds: entry.regionIds,
      role: entry.role,
      eligibility: entry.eligibility,
      ...(entry.difficulty ? { difficulty: entry.difficulty } : {}),
      enabled,
      ...(reason ? { reason } : {}),
    });
  }

  private buildRequest(input: ComposedRequestInput): GameSessionResult<CampaignCompositionRequest> {
    const seed = input.seed.trim();
    if (seed.length === 0) return failure('invalid-seed', 'A seed não pode ser vazia.');
    const selections = input.selections ? canonicalSelections(input.selections) : undefined;
    return success(createFixedNineCompositionRequest({
      campaignId: COMPOSED_CAMPAIGN_ID,
      campaignRevision: COMPOSED_CAMPAIGN_REVISION,
      runId: composedCampaignRunId(seed, selections),
      seed,
      ...(selections ? { manualAssignments: selections } : {}),
    }));
  }

  private previewComposition(input: ComposedRequestInput): GameSessionResult<{
    readonly snapshot: CampaignCompositionSnapshot;
    readonly graph: CampaignGraph;
    readonly diagnostics: readonly CampaignCompositionDiagnostic[];
  }> {
    if (!this.catalog) return failure('catalog-invalid', 'Stage catalog is invalid.');
    const request = this.buildRequest(input);
    if (!request.ok) return request;
    const composed = new CampaignCompositionService(this.catalog).compose(request.value);
    if (!composed.ok) return failure('composition-failed',
      composed.error.diagnostics[0]?.message ?? 'Composition failed.', {
        composition: composed.error,
      });
    return success(Object.freeze({
      snapshot: composed.value.snapshot,
      graph: composed.value.graph,
      diagnostics: composed.value.diagnostics,
    }));
  }

  private startComposedCampaign(input: ComposedRequestInput): GameSessionResult<GameComposedSession> {
    if (!this.catalog) return failure('catalog-invalid', 'Stage catalog is invalid.');
    const request = this.buildRequest(input);
    if (!request.ok) return request;
    const requestValue = request.value;
    const composition = new CampaignCompositionService(this.catalog);

    let stored: CampaignRunState | undefined;
    if (this.saves) {
      const loaded = this.saves.load();
      if (!loaded.ok) return failure('save-failed', loaded.error.message, { save: loaded.error });
      if (loaded.value.status === 'loaded') {
        stored = loaded.value.envelope.state;
        const persisted = stored.composition;
        const legacyRunId = legacyComposedCampaignRunId(
          String(requestValue.seed),
          input.selections ? canonicalSelections(input.selections) : undefined,
        );
        if (persisted && (stored.graph.runId === requestValue.runId ||
          stored.graph.runId === legacyRunId) &&
          persisted.campaignId === COMPOSED_CAMPAIGN_ID &&
          persisted.seed === String(requestValue.seed)) {
          if (stored.status === 'completed') return failure(
            'run-completed',
            'A campanha composta já foi concluída. Gere uma nova seed para iniciar outra run.',
          );
          return this.restoreComposed(stored, composition);
        }
      }
    }

    const composed = composition.compose(requestValue);
    if (!composed.ok) return failure('composition-failed',
      composed.error.diagnostics[0]?.message ?? 'Composition failed.', {
        composition: composed.error,
      });
    const state = createCampaignRunState(composed.value.graph, composed.value.snapshot);
    const router = this.router(state);
    const navigation = router.inspect();
    if (!navigation.ok) return failure('navigation-failed',
      `Navigation inspection failed: ${navigation.error.code}.`, { router: navigation.error });
    let persistence: GameComposedSession['persistence'] = 'volatile';
    if (this.saves) {
      const saved = this.saves.save(state, stored);
      if (!saved.ok) return failure('save-failed', saved.error.message, { save: saved.error });
      persistence = 'created';
    }
    return success(Object.freeze({
      campaignId: COMPOSED_CAMPAIGN_ID,
      runId: requestValue.runId,
      runSeed: String(requestValue.seed),
      graph: composed.value.graph,
      snapshot: composed.value.snapshot,
      router,
      navigation: navigation.value,
      composition: this.compositionRoot(),
      persistence,
    }));
  }

  private restoreComposed(
    state: CampaignRunState,
    composition: CampaignCompositionService,
  ): GameSessionResult<GameComposedSession> {
    const snapshot = state.composition as CampaignCompositionSnapshot;
    const restored = composition.restore(snapshot);
    if (!restored.ok) return failure('composition-failed',
      restored.error.diagnostics[0]?.message ?? 'Persisted composition is invalid.', {
        composition: restored.error,
      });
    if (!graphMatchesSnapshot(state.graph, restored.value.snapshot)) return failure(
      'restore-failed', 'Persisted graph does not match its composition snapshot.');
    const router = this.router(state);
    const navigation = router.inspect();
    if (!navigation.ok) return failure('navigation-failed',
      `Navigation inspection failed: ${navigation.error.code}.`, { router: navigation.error });
    return success(Object.freeze({
      campaignId: COMPOSED_CAMPAIGN_ID,
      runId: state.graph.runId,
      runSeed: String(snapshot.seed),
      graph: state.graph,
      snapshot: restored.value.snapshot,
      router,
      navigation: navigation.value,
      composition: this.compositionRoot(),
      persistence: 'restored' as const,
    }));
  }

  private router(state: CampaignRunState): CampaignRouter {
    return new CampaignRouter(state, {
      loader: this.loader,
      resolver: new PhysicalExitResolver(),
      binder: new CampaignExitBinder(),
      ...(this.saves ? { saves: this.saves } : {}),
    });
  }

  private compositionRoot(): GameStageCompositionRoot {
    return new GameStageCompositionRoot({
      registry: this.registry,
      loader: this.loader,
      ...(this.campaignStorage ? { campaignStorage: this.campaignStorage } : {}),
    });
  }

  private savedCampaign(): { view?: GameSavedCampaignView; error?: string } {
    if (!this.saves) return {};
    const loaded = this.saves.load();
    if (!loaded.ok) return { error: `${loaded.error.code}: ${loaded.error.message}` };
    if (loaded.value.status !== 'loaded') return {};
    const state = loaded.value.envelope.state;
    const snapshot = state.composition;
    if (!snapshot) return {};
    const node = state.graph.nodes.find(item => item.id === state.currentNodeId);
    return {
      view: Object.freeze({
        seed: snapshot.seed,
        runId: state.graph.runId,
        compositionId: snapshot.compositionId,
        currentNodeId: state.currentNodeId,
        currentStageId: node?.stageId ?? state.currentNodeId,
        status: state.status,
        assignments: Object.freeze(snapshot.assignments.map(assignment => Object.freeze({
          slotId: assignment.slotId,
          stageId: assignment.stageId,
        }))),
      }),
    };
  }
}
