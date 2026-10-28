import {
  CampaignSaveService,
  NarrativeState,
  StageDirector,
} from '../../narrative';
import type {
  CampaignSaveFailure,
  CampaignSaveIdentity,
  NarrativeOperationFailure,
  NarrativeProgressionView,
  NarrativeRegistryFailure,
  SaveStoragePort,
  StageCommand,
} from '../../narrative';
import {
  StageLoader,
  StageRegistry,
  registerLegacyStages,
} from '../../stages';
import type { LoadedStage } from '../../stages';
import {
  GameSceneStageAdapter,
  type GameSceneStageRequest,
  type GameSceneStageResolution,
  type StageLoaderPort,
} from './GameSceneStageAdapter';

export interface GameNarrativeIdentityInput {
  readonly campaignId: string;
  readonly runId: string;
  readonly runSeed: string | number;
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

export class GameStageCompositionRoot {
  public readonly registry: StageRegistry;
  public readonly loader: StageLoaderPort;
  public readonly stageAdapter: GameSceneStageAdapter;
  private readonly campaignStorage?: SaveStoragePort;

  public constructor(options: GameStageCompositionOptions = {}) {
    this.registry = options.registry ?? new StageRegistry();
    if (!options.registry) registerLegacyStages(this.registry);
    this.loader = options.loader ?? new StageLoader(this.registry);
    this.stageAdapter = new GameSceneStageAdapter(this.loader);
    this.campaignStorage = options.campaignStorage;
  }

  public resolveStage(request: GameSceneStageRequest): GameSceneStageResolution {
    return this.stageAdapter.resolve(request);
  }

  public createNarrativeSession(
    loadedStage: LoadedStage,
    identityInput: GameNarrativeIdentityInput,
    progression: NarrativeProgressionView,
  ): GameNarrativeSessionCreation {
    const identity: CampaignSaveIdentity = Object.freeze({
      campaignId: identityInput.campaignId,
      runId: identityInput.runId,
      runSeed: String(identityInput.runSeed),
      chapterId: loadedStage.manifest.chapterId,
      stageId: loadedStage.manifest.id,
      manifestRevision: loadedStage.manifest.revision,
    });
    const state = new NarrativeState();
    let saves: CampaignSaveService | undefined;
    let persistenceFailure: CampaignSaveFailure | undefined;
    if (this.campaignStorage) {
      saves = new CampaignSaveService(this.campaignStorage);
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
