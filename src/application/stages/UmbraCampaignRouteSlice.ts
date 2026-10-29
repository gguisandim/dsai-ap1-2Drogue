import type { SaveStoragePort } from '../../narrative';
import {
  CampaignExitBinder,
  CampaignGraphGenerator,
  CampaignGraphValidator,
  PhysicalExitResolver,
} from '../../stages';
import type {
  CampaignContentReference,
  CampaignGraph,
  CampaignMacroDefinition,
  CampaignMacroProgressState,
  RegionTemplate,
  StageLoadRequest,
  StageLoadResult,
} from '../../stages';
import { createCampaignRunState } from './CampaignRouter';
import { CampaignRunSaveService } from './CampaignRunSaveService';
import {
  CampaignMacroRouteBinder,
  type CampaignMacroRouteBinding,
  type CampaignMacroRouteBindingFailure,
} from './CampaignMacroRouteBinder';
import type { CampaignRunSaveFailure, CampaignRunState } from './CampaignNavigation';
import { UMBRA_CAMPAIGN_SKELETON } from './UmbraCampaignSkeleton';

interface StageLoaderPort {
  load(request: StageLoadRequest): StageLoadResult;
}

export const UMBRA_ROUTE_SLICE_HUB_CONTEXT = 'context.hub.floresta-das-raizes';
export const UMBRA_ROUTE_SLICE_WATERS_CONTEXT = 'context.route.aguas';
export const UMBRA_ROUTE_SLICE_RUN_ID = 'campaign.umbra-trail.route-slice.default-run';
export const UMBRA_ROUTE_SLICE_SEED = 'campaign.umbra-trail.route-slice.default-seed';

const legacyPlaceholder = (stageId: string, reason: string): CampaignContentReference => Object.freeze({
  kind: 'stage' as const,
  stageId,
  minimumManifestRevision: 1,
  placeholder: Object.freeze({ kind: 'legacy-map' as const, reason }),
});

export const UMBRA_CAMPAIGN_ROUTE_SLICE: CampaignMacroDefinition = Object.freeze({
  ...UMBRA_CAMPAIGN_SKELETON,
  revision: 2,
  hub: Object.freeze({
    ...UMBRA_CAMPAIGN_SKELETON.hub,
    content: legacyPlaceholder(
      'verse_01_atrium',
      'Placeholder temporário para Floresta das Raízes; não representa o mapa final.',
    ),
  }),
  routes: Object.freeze(UMBRA_CAMPAIGN_SKELETON.routes.map(route => Object.freeze({
    ...route,
    regions: Object.freeze(route.regions.map(region => region.id === 'region.aguas.igapo'
      ? Object.freeze({
          ...region,
          content: legacyPlaceholder(
            'verse_02_galeria',
            'Placeholder temporário para Igapó; não representa o bioma final.',
          ),
        })
      : region)),
  }))),
});

const STAGE_IDS = Object.freeze([
  'verse_01_atrium',
  'verse_02_galeria',
  'verse_03_santuario',
  'verse_01_atrium',
  'verse_02_galeria',
  'verse_03_santuario',
  'verse_01_atrium',
  'verse_02_galeria',
  'verse_03_santuario',
]);

const SLICE_TEMPLATES: readonly RegionTemplate[] = Object.freeze(STAGE_IDS.map((stageId, depth) => {
  const actId = depth <= 2 ? 'act-1' : depth <= 5 ? 'act-2' : 'act-3';
  return Object.freeze({
    id: `route-slice.depth-${depth}`,
    revision: 1,
    stageId,
    allowedActIds: Object.freeze([actId]),
    allowedBiomeIds: Object.freeze(['crypt'] as const),
    difficulty: Object.freeze({ minimum: depth + 1, maximum: depth + 1 }),
    weight: 1,
    maximumPhysicalExits: 2 as const,
    tags: Object.freeze(['legacy-placeholder', 'route-slice']),
    providesBeatIds: Object.freeze([`beat.${actId}`]),
    revisit: 'checkpoint' as const,
  });
}));

export type UmbraCampaignRouteSliceGraphResult =
  | { readonly ok: true; readonly value: CampaignGraph; readonly bindings: readonly CampaignMacroRouteBinding[] }
  | { readonly ok: false; readonly error: { readonly code: 'graph-generation-failed' | 'graph-invalid'; readonly diagnostics: readonly unknown[] } };

export function createUmbraCampaignRouteSliceGraph(
  runId: string,
  runSeed: string | number,
): UmbraCampaignRouteSliceGraphResult {
  const generated = new CampaignGraphGenerator().generate({
    campaignId: UMBRA_CAMPAIGN_ROUTE_SLICE.id,
    campaignRevision: UMBRA_CAMPAIGN_ROUTE_SLICE.revision,
    catalogRevision: 1,
    runId,
    runSeed,
    templates: SLICE_TEMPLATES,
    context: Object.freeze({ flags: {}, completedEventIds: [], revealedBeatIds: [] }),
  });
  if (!generated.ok) return Object.freeze({
    ok: false as const,
    error: Object.freeze({
      code: 'graph-generation-failed' as const,
      diagnostics: generated.error.diagnostics,
    }),
  });
  const hub = generated.value.nodes.find(node => node.depth === 0);
  const igapo = generated.value.nodes.find(node => node.depth === 1);
  const hubEdge = generated.value.edges.find(edge =>
    edge.sourceNodeId === hub?.id && edge.targetNodeId === igapo?.id);
  if (!hub || !igapo || !hubEdge) return Object.freeze({
    ok: false as const,
    error: Object.freeze({ code: 'graph-invalid' as const, diagnostics: Object.freeze([]) }),
  });
  const returnEdge = Object.freeze({
    id: `edge.${igapo.id}.${hub.id}.return`,
    sourceNodeId: igapo.id,
    targetNodeId: hub.id,
    exitSlotId: `exit.${hub.id}.return`,
    physicalExitId: `physical.${igapo.id}.${hub.id}.return`,
    kind: 'return' as const,
    traversalLimit: 2 as const,
  });
  const graph: CampaignGraph = Object.freeze({
    ...generated.value,
    edges: Object.freeze([
      ...generated.value.edges.map(edge => edge.id === hubEdge.id
        ? Object.freeze({ ...edge, traversalLimit: 2 as const })
        : edge),
      returnEdge,
    ]),
  });
  const diagnostics = new CampaignGraphValidator().validate(graph);
  if (diagnostics.length > 0) return Object.freeze({
    ok: false as const,
    error: Object.freeze({ code: 'graph-invalid' as const, diagnostics }),
  });
  return Object.freeze({
    ok: true as const,
    value: graph,
    bindings: Object.freeze([
      Object.freeze({
        connectionId: 'connection.hub.floresta-das-raizes.route.aguas',
        sourceContextId: UMBRA_ROUTE_SLICE_HUB_CONTEXT,
        targetContextId: UMBRA_ROUTE_SLICE_WATERS_CONTEXT,
        edgeId: hubEdge.id,
      }),
      Object.freeze({
        connectionId: 'connection.region.aguas.igapo.hub.floresta-das-raizes',
        sourceContextId: UMBRA_ROUTE_SLICE_WATERS_CONTEXT,
        targetContextId: UMBRA_ROUTE_SLICE_HUB_CONTEXT,
        edgeId: returnEdge.id,
      }),
    ]),
  });
}

class RouteSliceStageLoader implements StageLoaderPort {
  public constructor(private readonly delegate: StageLoaderPort) {}

  public load(request: StageLoadRequest): StageLoadResult {
    const loaded = this.delegate.load(request);
    if (!loaded.ok) return loaded;
    return Object.freeze({
      ok: true as const,
      value: Object.freeze({
        ...loaded.value,
        manifest: Object.freeze({ ...loaded.value.manifest, exits: Object.freeze([]) }),
      }),
    });
  }
}

export interface UmbraCampaignRouteSliceRequest {
  readonly runId: string;
  readonly runSeed: string | number;
}

export type UmbraCampaignRouteSliceFailure =
  | { readonly code: 'graph-failed'; readonly diagnostics: readonly unknown[] }
  | { readonly code: 'save-failed'; readonly error: CampaignRunSaveFailure }
  | { readonly code: 'binding-failed'; readonly error: CampaignMacroRouteBindingFailure };

export type UmbraCampaignRouteSliceResult =
  | {
      readonly ok: true;
      readonly value: {
        readonly binder: CampaignMacroRouteBinder;
        readonly graph: CampaignGraph;
        readonly persistence: 'created' | 'restored' | 'volatile';
      };
    }
  | { readonly ok: false; readonly error: UmbraCampaignRouteSliceFailure };

function migrateMacroRevision(state: CampaignRunState): CampaignRunState {
  const macro = state.macroProgress;
  if (!macro || macro.definitionId !== UMBRA_CAMPAIGN_ROUTE_SLICE.id || macro.definitionRevision !== 1) {
    return state;
  }
  return Object.freeze({
    ...state,
    macroProgress: Object.freeze({
      ...macro,
      definitionRevision: 2,
    } as CampaignMacroProgressState),
  });
}

export class UmbraCampaignRouteSliceFactory {
  public constructor(
    private readonly loader: StageLoaderPort,
    private readonly storage?: SaveStoragePort,
  ) {}

  public create(request: UmbraCampaignRouteSliceRequest): UmbraCampaignRouteSliceResult {
    const generated = createUmbraCampaignRouteSliceGraph(request.runId, request.runSeed);
    if (!generated.ok) return Object.freeze({
      ok: false as const,
      error: Object.freeze({ code: 'graph-failed' as const, diagnostics: generated.error.diagnostics }),
    });
    const saves = this.storage ? new CampaignRunSaveService({ storage: this.storage }) : undefined;
    let state = createCampaignRunState(generated.value);
    let persistence: 'created' | 'restored' | 'volatile' = 'volatile';
    if (saves) {
      const loaded = saves.load({
        campaignId: generated.value.campaignId,
        campaignRevision: generated.value.campaignRevision,
        runId: generated.value.runId,
        runSeed: generated.value.runSeed,
        graphId: generated.value.id,
      });
      if (!loaded.ok) return Object.freeze({
        ok: false as const,
        error: Object.freeze({ code: 'save-failed' as const, error: loaded.error }),
      });
      if (loaded.value.status === 'loaded') {
        state = migrateMacroRevision(loaded.value.envelope.state);
        persistence = 'restored';
      } else persistence = 'created';
    }
    const bound = CampaignMacroRouteBinder.create(
      UMBRA_CAMPAIGN_ROUTE_SLICE,
      generated.bindings,
      state,
      {
        loader: new RouteSliceStageLoader(this.loader),
        resolver: new PhysicalExitResolver(),
        binder: new CampaignExitBinder(),
        ...(saves ? { saves } : {}),
      },
      UMBRA_ROUTE_SLICE_HUB_CONTEXT,
    );
    if (!bound.ok) return Object.freeze({
      ok: false as const,
      error: Object.freeze({ code: 'binding-failed' as const, error: bound.error }),
    });
    return Object.freeze({
      ok: true as const,
      value: Object.freeze({ binder: bound.value, graph: generated.value, persistence }),
    });
  }
}
