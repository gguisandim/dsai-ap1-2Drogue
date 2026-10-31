import {
  UmbraCampaignRouteSliceFactory,
  UMBRA_CAMPAIGN_ROUTE_SLICE,
  UMBRA_ROUTE_SLICE_RUN_ID,
} from '../../application/stages';
import {
  StageLoader,
  CampaignCompositionService,
  StageCatalogService,
  StageRegistry,
  registerCampaignChapters,
  registerLegacyStages,
  type StageCatalogDiagnostic,
  createFixedNineCompositionRequest,
} from '../../stages';
import type {
  WorldLabDiagnostic,
  WorldLabMacroConnectionView,
  WorldLabMacroRouteResult,
  WorldLabCampaignCompositionView,
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

function catalogFailure(
  diagnostics: readonly StageCatalogDiagnostic[],
): WorldLabMacroRouteResult {
  return Object.freeze({
    ok: false as const,
    error: Object.freeze({
      diagnostics: Object.freeze(diagnostics.map(item => Object.freeze({
        code: item.code,
        severity: item.severity,
        origin: 'stage-catalog' as const,
        message: item.message,
        ...(item.stageId ? { stageId: item.stageId } : {}),
        path: item.path,
      }))),
    }),
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
    const discovered = StageCatalogService.create(registry);
    if (!discovered.ok) return catalogFailure(discovered.error.diagnostics);
    const catalogDiagnostics: readonly WorldLabDiagnostic[] = Object.freeze(
      discovered.value.diagnostics().map(item => Object.freeze({
        code: item.code,
        severity: item.severity,
        origin: 'stage-catalog' as const,
        message: item.message,
        ...(item.stageId ? { stageId: item.stageId } : {}),
        path: item.path,
      })),
    );
    const catalog = Object.freeze({
      entries: Object.freeze(discovered.value.list().map(item => Object.freeze({
        stageId: item.stageId,
        chapterId: item.chapterId,
        manifestRevision: item.manifestRevision,
        chapterRevision: item.chapterRevision,
        title: item.title,
        role: item.role,
        regionIds: item.regionIds,
        biomeIds: item.biomeIds,
        loadability: item.loadability,
        eligibility: item.eligibility,
        capabilityIds: Object.freeze(item.capabilityRequirements.map(value => value.id)),
        dependencyChapterIds: Object.freeze(item.chapterDependencies.map(value => value.chapterId)),
        diagnosticCodes: Object.freeze(item.exclusionDiagnostics.map(value => value.code)),
      }))),
      eligibleStageIds: Object.freeze(discovered.value.eligible().map(item => item.stageId)),
      incompatibleStageIds: Object.freeze(discovered.value.incompatible().map(item => item.stageId)),
      diagnostics: catalogDiagnostics,
    });
    const compositionRequest = createFixedNineCompositionRequest({
      campaignId: UMBRA_CAMPAIGN_ROUTE_SLICE.id,
      campaignRevision: UMBRA_CAMPAIGN_ROUTE_SLICE.revision,
      runId: `${UMBRA_ROUTE_SLICE_RUN_ID}.composition`,
      seed,
    });
    const composed = new CampaignCompositionService(discovered.value).compose(compositionRequest);
    const compositionDiagnostics: readonly WorldLabDiagnostic[] = Object.freeze(
      (composed.ok ? composed.value.diagnostics : composed.error.diagnostics).map(item => Object.freeze({
        code: item.code,
        severity: item.severity,
        origin: 'campaign-composer' as const,
        message: item.message,
        ...(item.stageId ? { stageId: item.stageId } : {}),
        path: item.path,
      })),
    );
    const composition: WorldLabCampaignCompositionView = Object.freeze({
      status: composed.ok ? 'composed' as const : 'failed' as const,
      seed,
      policyId: compositionRequest.policyId,
      requestedStageCount: compositionRequest.desiredStageCount,
      selectedStageCount: composed.ok ? composed.value.snapshot.assignments.length : 0,
      availableStageIds: Object.freeze(discovered.value.list()
        .filter(item => item.eligibility === 'campaign-eligible' || item.eligibility === 'narrative-reserved')
        .map(item => item.stageId)),
      requiredMilestoneSlotIds: Object.freeze(compositionRequest.mandatoryMilestones.map(item => item.slotId)),
      restrictionLabels: Object.freeze([
        `repetition:${compositionRequest.repetitionPolicy}`,
        'topology:fixed-nine',
        'acts:3x3',
      ]),
      ...(composed.ok ? {
        compositionId: composed.value.snapshot.compositionId,
        graphId: composed.value.graph.id,
        assignments: Object.freeze(composed.value.snapshot.assignments.map(item => Object.freeze({
          slotId: item.slotId,
          actId: item.actId,
          depth: item.depth,
          kind: item.kind,
          stageId: item.stageId,
          stageInstanceId: item.stageInstanceId,
          chapterId: item.chapterId,
          manifestRevision: item.manifestRevision,
          chapterRevision: item.chapterRevision,
          regionId: item.regionId,
          biomeId: item.biomeId,
          maximumPhysicalExits: item.maximumPhysicalExits,
        }))),
        connections: Object.freeze(composed.value.graph.edges.map(edge => Object.freeze({
          edgeId: edge.id,
          sourceNodeId: edge.sourceNodeId,
          targetNodeId: edge.targetNodeId,
        }))),
      } : { assignments: Object.freeze([]), connections: Object.freeze([]) }),
      diagnostics: compositionDiagnostics,
    });
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
        catalog,
        composition,
        graph: projected.value,
      }),
    });
  }
}
