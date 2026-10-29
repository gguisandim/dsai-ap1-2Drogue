import {
  UmbraCampaignRouteSliceFactory,
  UMBRA_CAMPAIGN_ROUTE_SLICE,
  UMBRA_ROUTE_SLICE_RUN_ID,
} from '../../application/stages';
import {
  StageLoader,
  StageRegistry,
  registerCampaignChapters,
  registerLegacyStages,
} from '../../stages';
import type {
  WorldLabDiagnostic,
  WorldLabMacroConnectionView,
  WorldLabMacroRouteResult,
} from './contracts';
import { WorldLabDataService } from './WorldLabDataService';
import { WorldLabMacroProjector } from './WorldLabMacroProjector';

function failure(code: string, message: string): WorldLabMacroRouteResult {
  const diagnostic: WorldLabDiagnostic = Object.freeze({
    code,
    severity: 'error',
    origin: 'integration',
    message,
  });
  return Object.freeze({
    ok: false as const,
    error: Object.freeze({ diagnostics: Object.freeze([diagnostic]) }),
  });
}

/** Public adapter for inspecting the same macro binding used by the headless runtime. */
export class WorldLabMacroDataService {
  public constructor(private readonly projector = new WorldLabMacroProjector()) {}

  public generate(seedInput: string): WorldLabMacroRouteResult {
    const seed = seedInput.trim();
    if (!seed) return failure('world-lab.macro.seed-required', 'A non-empty seed is required.');
    const registry = new StageRegistry();
    registerLegacyStages(registry);
    registerCampaignChapters(registry);
    const loader = new StageLoader(registry);
    const created = new UmbraCampaignRouteSliceFactory(loader).create({
      runId: UMBRA_ROUTE_SLICE_RUN_ID,
      runSeed: seed,
    });
    if (!created.ok) return failure(
      'world-lab.macro.slice-failed',
      `Macro route slice could not be created: ${created.error.code}.`,
    );
    const inspected = created.value.binder.inspect();
    if (!inspected.ok) return failure(
      'world-lab.macro.binding-failed',
      `Macro route binding could not be inspected: ${inspected.error.code}.`,
    );
    const projected = new WorldLabDataService({ registry, loader }).generateGraph(seed, created.value.graph);
    if (!projected.ok) return projected;
    const connections: readonly WorldLabMacroConnectionView[] = Object.freeze(
      inspected.value.choices.map(item => Object.freeze({
        connectionId: item.choice.connectionId,
        sourceKind: item.choice.source.kind,
        targetKind: item.choice.target.kind,
        contentKind: item.choice.content.kind,
        ...(item.choice.content.kind === 'stage' ? { stageId: item.choice.content.stageId } : {}),
        status: item.status,
        ...(item.edgeId ? { edgeId: item.edgeId } : {}),
        ...(item.physicalExitId ? { physicalExitId: item.physicalExitId } : {}),
        ...(item.blockedReason ? { blockedReason: item.blockedReason } : {}),
      })),
    );
    const progress = created.value.binder.state().macroProgress;
    if (!progress) return failure(
      'world-lab.macro.progress-missing',
      'Macro route slice did not expose campaign progress.',
    );
    const macro = this.projector.project({
      definition: UMBRA_CAMPAIGN_ROUTE_SLICE,
      inspection: inspected.value,
      progress,
      graph: projected.value,
      connections,
    });
    return Object.freeze({
      ok: true as const,
      value: Object.freeze({
        definitionId: inspected.value.macro.definitionId,
        definitionRevision: inspected.value.macro.definitionRevision,
        activeGraphContextId: inspected.value.activeGraphContextId,
        currentLocationKind: inspected.value.macro.currentLocation.kind,
        nodes: macro.nodes,
        edges: macro.edges,
        progress: macro.progress,
        connections,
        graph: projected.value,
      }),
    });
  }
}
