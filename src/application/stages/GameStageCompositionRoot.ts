import {
  CAMPAIGN_SAVE_STORAGE_KEY,
  CampaignSaveService,
  NarrativeState,
  StageDirector,
} from '../../narrative';
import type {
  CampaignSaveFailure,
  CampaignSaveIdentity,
  DialogueResult,
  DialogueSession,
  DialogueTurn,
  NarrativeOperationFailure,
  NarrativeProgressionView,
  NarrativeRegistryFailure,
  NarrativeResult,
  SaveStoragePort,
  StageCommand,
} from '../../narrative';
import {
  StageLoader,
  StageRegistry,
  registerCampaignChapters,
  registerLegacyStages,
} from '../../stages';
import type { LoadedStage } from '../../stages';
import {
  GameSceneStageAdapter,
  type GameSceneStageRequest,
  type GameSceneStageResolution,
  type StageLoaderPort,
} from './GameSceneStageAdapter';
import {
  BranchingCampaignPilotFactory,
  type BranchingCampaignPilotRequest,
  type BranchingCampaignPilotResult,
} from './BranchingCampaignPilot';
import {
  GameMacroCampaignAdapter,
  type GameCampaignNavigationFailure,
} from './GameMacroCampaignAdapter';
import {
  UMBRA_CAMPAIGN_ROUTE_SLICE,
  UmbraCampaignRouteSliceFactory,
  type UmbraCampaignRouteSliceFailure,
  type UmbraCampaignRouteSliceRequest,
} from './UmbraCampaignRouteSlice';
import type { CampaignGraph } from '../../stages';

export interface GameNarrativeIdentityInput {
  readonly campaignId: string;
  readonly runId: string;
  readonly runSeed: string | number;
  /** Campaign node occurrence; scopes narrative state per visit. */
  readonly stageInstanceId?: string;
}

/**
 * Additive per-stage narrative save key for campaign stages. The legacy
 * `umbra-trail-campaign-v1` key used by the modular pilot is untouched.
 */
export function campaignStageNarrativeSaveKey(
  runId: string,
  chapterId: string,
  stageId: string,
): string {
  return `${CAMPAIGN_SAVE_STORAGE_KEY}:${runId}:${chapterId}:${stageId}`;
}

export type GameNarrativeSessionFailure =
  | NarrativeOperationFailure
  | NarrativeRegistryFailure
  | CampaignSaveFailure;

export type GameNarrativeSessionResult =
  | { readonly ok: true; readonly persistence: 'saved' | 'skipped' }
  | { readonly ok: false; readonly error: GameNarrativeSessionFailure };

export class GameNarrativeSession {
  public constructor(
    public readonly identity: CampaignSaveIdentity,
    public readonly director: StageDirector,
    private readonly saves?: CampaignSaveService,
    public readonly initialPersistenceFailure?: CampaignSaveFailure,
  ) {}

  public enterStage(): GameNarrativeSessionResult {
    const processed = this.director.process({
      id: 'scene.stage-entered',
      signal: { type: 'stage.entered', stageId: this.identity.stageId },
    });
    if (!processed.ok) return processed;
    return this.save();
  }

  public requestExit(exitId: string): GameNarrativeSessionResult {
    const processed = this.director.process({
      id: `scene.exit-requested.${exitId}`,
      signal: { type: 'stage.exit.requested', exitId },
    });
    if (!processed.ok) return processed;
    return this.save();
  }

  /**
   * Emits `npc.interacted` through the existing runtime. The stable event id
   * keeps repeated interactions idempotent (a `once` rule never refires).
   */
  public interactNpc(npcId: string): GameNarrativeSessionResult {
    const processed = this.director.process({
      id: `scene.npc-interacted.${npcId}`,
      signal: { type: 'npc.interacted', npcId },
    });
    if (!processed.ok) return processed;
    return this.save();
  }

  /** Emits `dialogue.completed` once per dialogue so event rules stay idempotent. */
  public completeDialogue(dialogueId: string): GameNarrativeSessionResult {
    const processed = this.director.process({
      id: `scene.dialogue-completed.${dialogueId}`,
      signal: { type: 'dialogue.completed', dialogueId },
    });
    if (!processed.ok) return processed;
    return this.save();
  }

  /** Thin pass-through to the existing DialogueEngine via StageDirector. */
  public startDialogue(dialogueId: string): NarrativeResult<DialogueTurn, NarrativeOperationFailure> {
    return this.director.startDialogue(dialogueId);
  }

  public advanceDialogue(session: DialogueSession): NarrativeResult<DialogueResult, NarrativeOperationFailure> {
    return this.director.advanceDialogue(session);
  }

  public pendingRewardCommands(): readonly StageCommand[] {
    return this.director.pendingRewardCommands();
  }

  public confirmOperation(operationId: string): GameNarrativeSessionResult {
    const before = this.director.snapshot();
    const acknowledged = this.director.acknowledgeOperation(operationId);
    if (!acknowledged.ok) return acknowledged;
    const saved = this.save();
    if (!saved.ok) this.director.state.restore(before);
    return saved;
  }

  public save(): GameNarrativeSessionResult {
    if (!this.saves) return Object.freeze({ ok: true as const, persistence: 'skipped' as const });
    const saved = this.saves.save(this.identity, this.director.state);
    return saved.ok
      ? Object.freeze({ ok: true as const, persistence: 'saved' as const })
      : saved;
  }
}

export type GameNarrativeSessionCreation =
  | { readonly ok: true; readonly session: GameNarrativeSession }
  | { readonly ok: false; readonly error: NarrativeRegistryFailure };

export interface GameStageCompositionOptions {
  readonly registry?: StageRegistry;
  readonly loader?: StageLoaderPort;
  readonly campaignStorage?: SaveStoragePort;
}

export type GameMacroCampaignCreation =
  | {
      readonly ok: true;
      readonly value: {
        readonly adapter: GameMacroCampaignAdapter;
        readonly graph: CampaignGraph;
        readonly persistence: 'created' | 'restored' | 'volatile';
      };
    }
  | {
      readonly ok: false;
      readonly error: UmbraCampaignRouteSliceFailure | GameCampaignNavigationFailure;
    };

export class GameStageCompositionRoot {
  public readonly registry: StageRegistry;
  public readonly loader: StageLoaderPort;
  public readonly stageAdapter: GameSceneStageAdapter;
  private readonly campaignStorage?: SaveStoragePort;

  public constructor(options: GameStageCompositionOptions = {}) {
    this.registry = options.registry ?? new StageRegistry();
    if (!options.registry) {
      registerLegacyStages(this.registry);
      registerCampaignChapters(this.registry);
    }
    this.loader = options.loader ?? new StageLoader(this.registry);
    this.stageAdapter = new GameSceneStageAdapter(this.loader);
    this.campaignStorage = options.campaignStorage;
  }

  public resolveStage(request: GameSceneStageRequest): GameSceneStageResolution {
    return this.stageAdapter.resolve(request);
  }

  public createBranchingCampaign(
    request: BranchingCampaignPilotRequest,
  ): BranchingCampaignPilotResult {
    return new BranchingCampaignPilotFactory(this.loader, this.campaignStorage).create(request);
  }

  public createMacroCampaign(
    request: UmbraCampaignRouteSliceRequest,
  ): GameMacroCampaignCreation {
    const created = new UmbraCampaignRouteSliceFactory(
      this.loader,
      this.campaignStorage,
    ).create(request);
    if (!created.ok) return created;
    const adapter = new GameMacroCampaignAdapter(
      UMBRA_CAMPAIGN_ROUTE_SLICE,
      created.value.binder,
    );
    const inspected = adapter.inspect();
    if (!inspected.ok) return inspected;
    return Object.freeze({
      ok: true as const,
      value: Object.freeze({
        adapter,
        graph: created.value.graph,
        persistence: created.value.persistence,
      }),
    });
  }

  public createNarrativeSession(
    loadedStage: LoadedStage,
    identityInput: GameNarrativeIdentityInput,
    progression: NarrativeProgressionView,
    narrativeStorageKey?: string,
  ): GameNarrativeSessionCreation {
    const identity: CampaignSaveIdentity = Object.freeze({
      campaignId: identityInput.campaignId,
      runId: identityInput.runId,
      runSeed: String(identityInput.runSeed),
      chapterId: loadedStage.manifest.chapterId,
      stageId: loadedStage.manifest.id,
      manifestRevision: loadedStage.manifest.revision,
      ...(identityInput.stageInstanceId ? { stageInstanceId: identityInput.stageInstanceId } : {}),
    });
    const state = new NarrativeState();
    let saves: CampaignSaveService | undefined;
    let persistenceFailure: CampaignSaveFailure | undefined;
    if (this.campaignStorage) {
      saves = narrativeStorageKey
        ? new CampaignSaveService(this.campaignStorage, narrativeStorageKey)
        : new CampaignSaveService(this.campaignStorage);
      const restored = saves.loadAndRestore(identity, state);
      if (!restored.ok) persistenceFailure = restored.error;
    }
    const director = StageDirector.create({
      chapterId: loadedStage.manifest.chapterId,
      stageId: loadedStage.manifest.id,
      definition: loadedStage.narrative,
      npcs: loadedStage.npcs,
      dialogues: loadedStage.dialogues,
      missions: loadedStage.missions,
      events: loadedStage.events,
      exitIds: loadedStage.manifest.exits.map(exit => exit.id),
    }, state.snapshot(), progression, { identity });
    if (!director.ok) return director;
    return Object.freeze({
      ok: true as const,
      session: new GameNarrativeSession(identity, director.value, saves, persistenceFailure),
    });
  }
}
