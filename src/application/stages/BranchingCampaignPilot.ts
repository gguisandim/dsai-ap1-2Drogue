import type { SaveStoragePort } from '../../narrative';
import {
  CampaignExitBinder,
  CampaignGraphGenerator,
  PhysicalExitResolver,
} from '../../stages';
import type {
  CampaignGraphFailureCode,
  RegionTemplate,
  StageDiagnostic,
  StageLoadRequest,
  StageLoadResult,
} from '../../stages';
import { VERSE_SECTIONS } from '../../data/VerseLevelData';
import type {
  CampaignNavigationView,
  CampaignRouterFailure,
  CampaignRunSaveFailure,
} from './CampaignNavigation';
import { CampaignRouter, createCampaignRunState } from './CampaignRouter';
import { CampaignRunSaveService } from './CampaignRunSaveService';
import type { StageLoaderPort } from './GameSceneStageAdapter';

export const BRANCHING_CAMPAIGN_PILOT_ID = 'pilot.branching-verse';
export const BRANCHING_CAMPAIGN_DEFAULT_RUN_ID = 'pilot.branching-verse.default-run';
export const BRANCHING_CAMPAIGN_DEFAULT_SEED = 'pilot.branching-verse.default-seed';

const PILOT_TEMPLATES: readonly RegionTemplate[] = Object.freeze(
  VERSE_SECTIONS.map<RegionTemplate>((level, index) => Object.freeze({
    id: `pilot.branching-verse.region-${index + 1}`,
    revision: 1,
    stageId: level.id,
    allowedActIds: Object.freeze(['act-1', 'act-2', 'act-3']),
    allowedBiomeIds: ['crypt'] as const,
    difficulty: Object.freeze({ minimum: 1, maximum: 9 }),
    weight: 1,
    maximumPhysicalExits: 2 as const,
    tags: Object.freeze(['legacy', 'pilot']),
    providesBeatIds: Object.freeze(['beat.act-1', 'beat.act-2', 'beat.act-3']),
    revisit: 'repeatable' as const,
  })),
);

export interface BranchingCampaignPilotRequest {
  readonly runId: string;
  readonly runSeed: string | number;
}

export type BranchingCampaignPilotFailure =
  | {
      readonly code: 'graph-generation-failed';
      readonly graphCode: CampaignGraphFailureCode;
      readonly diagnostics: readonly StageDiagnostic[];
    }
  | {
      readonly code: 'run-persistence-failed';
      readonly error: CampaignRunSaveFailure;
    }
  | {
      readonly code: 'initial-navigation-failed';
      readonly error: CampaignRouterFailure;
    };

export interface BranchingCampaignPilotSession {
  readonly router: CampaignRouter;
  readonly initialNavigation: CampaignNavigationView;
  readonly persistence: 'created' | 'restored' | 'volatile';
}

export type BranchingCampaignPilotResult =
  | { readonly ok: true; readonly value: BranchingCampaignPilotSession }
  | { readonly ok: false; readonly error: BranchingCampaignPilotFailure };

/**
 * Legacy manifests point to their old linear successor. Campaign edges are the
 * authority in this pilot, so only the router-facing copy drops those targets.
 * The registered module and LevelDefinition remain untouched.
 */
class BranchingCampaignStageLoader implements StageLoaderPort {
  public constructor(private readonly delegate: StageLoaderPort) {}

  public load(request: StageLoadRequest): StageLoadResult {
    const loaded = this.delegate.load(request);
    if (!loaded.ok) return loaded;
    return Object.freeze({
      ok: true as const,
      value: Object.freeze({
        ...loaded.value,
        manifest: Object.freeze({
          ...loaded.value.manifest,
          exits: Object.freeze([]),
        }),
      }),
    });
  }
}

export class BranchingCampaignPilotFactory {
  public constructor(
    private readonly loader: StageLoaderPort,
    private readonly storage?: SaveStoragePort,
  ) {}

  public create(request: BranchingCampaignPilotRequest): BranchingCampaignPilotResult {
    const generated = new CampaignGraphGenerator().generate({
      campaignId: BRANCHING_CAMPAIGN_PILOT_ID,
      campaignRevision: 1,
      catalogRevision: 1,
      runId: request.runId,
      runSeed: request.runSeed,
      templates: PILOT_TEMPLATES,
      context: Object.freeze({ flags: {}, completedEventIds: [], revealedBeatIds: [] }),
    });
    if (!generated.ok) return Object.freeze({
      ok: false as const,
      error: Object.freeze({
        code: 'graph-generation-failed' as const,
        graphCode: generated.error.code,
        diagnostics: generated.error.diagnostics,
      }),
    });

    const saves = this.storage ? new CampaignRunSaveService({ storage: this.storage }) : undefined;
    let state = createCampaignRunState(generated.value);
    let persistence: BranchingCampaignPilotSession['persistence'] = 'volatile';
    let createInitialSave = false;
    if (saves) {
      const restored = saves.load({
        campaignId: generated.value.campaignId,
        campaignRevision: generated.value.campaignRevision,
        runId: generated.value.runId,
        runSeed: generated.value.runSeed,
        graphId: generated.value.id,
      });
      if (!restored.ok) return Object.freeze({
        ok: false as const,
        error: Object.freeze({ code: 'run-persistence-failed' as const, error: restored.error }),
      });
      if (restored.value.status === 'loaded') {
        state = restored.value.envelope.state;
        persistence = 'restored';
      } else {
        createInitialSave = true;
      }
    }

    const router = new CampaignRouter(state, {
      loader: new BranchingCampaignStageLoader(this.loader),
      resolver: new PhysicalExitResolver(),
      binder: new CampaignExitBinder(),
      ...(saves ? { saves } : {}),
    });
    const inspected = router.inspect();
    if (!inspected.ok) return Object.freeze({
      ok: false as const,
      error: Object.freeze({ code: 'initial-navigation-failed' as const, error: inspected.error }),
    });
    if (saves && createInitialSave) {
      const created = saves.save(state);
      if (!created.ok) return Object.freeze({
        ok: false as const,
        error: Object.freeze({ code: 'run-persistence-failed' as const, error: created.error }),
      });
      persistence = 'created';
    }
    return Object.freeze({
      ok: true as const,
      value: Object.freeze({ router, initialNavigation: inspected.value, persistence }),
    });
  }
}
