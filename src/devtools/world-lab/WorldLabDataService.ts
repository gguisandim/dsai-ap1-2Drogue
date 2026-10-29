import {
  CampaignExitBinder,
  CampaignGraphGenerator,
  PhysicalExitResolver,
  StageLoader,
  StageRegistry,
  registerCampaignChapters,
  registerLegacyStages,
} from '../../stages';
import type {
  CampaignExitBindingResult,
  CampaignGraph,
  CampaignGraphResult,
  LoadedStage,
  PhysicalExitResult,
  RegionTemplate,
  StageDiagnostic,
  StageLoadRequest,
  StageLoadResult,
} from '../../stages';
import type {
  WorldLabDiagnostic,
  WorldLabDiagnosticOrigin,
  WorldLabGenerationResult,
} from './contracts';
import { WORLD_LAB_FIXTURE_CATALOG } from './fixtures/fixtureCatalog';
import {
  WorldLabProjector,
  type WorldLabStageProjectionInput,
} from './WorldLabProjector';

export interface WorldLabStageLoaderPort {
  load(request: StageLoadRequest): StageLoadResult;
}

export interface WorldLabDataServiceOptions {
  readonly templates?: readonly RegionTemplate[];
  readonly registry?: StageRegistry;
  readonly loader?: WorldLabStageLoaderPort;
  readonly generator?: CampaignGraphGenerator;
  readonly resolver?: PhysicalExitResolver;
  readonly binder?: CampaignExitBinder;
  readonly projector?: WorldLabProjector;
}

function diagnosticFromStage(
  diagnostic: StageDiagnostic,
  origin: WorldLabDiagnosticOrigin,
  context: { readonly nodeId?: string; readonly edgeId?: string; readonly stageId?: string } = {},
): WorldLabDiagnostic {
  return Object.freeze({
    code: diagnostic.code,
    severity: diagnostic.severity,
    origin,
    message: diagnostic.message,
    ...context,
    path: Object.freeze([...diagnostic.path]),
  });
}

function diagnosticsFromGraphFailure(result: Extract<CampaignGraphResult, { ok: false }>): readonly WorldLabDiagnostic[] {
  return Object.freeze(result.error.diagnostics.map(diagnostic =>
    diagnosticFromStage(diagnostic, 'campaign-generator')));
}

function fixtureStage(stage: LoadedStage): LoadedStage {
  if (stage.manifest.layout.kind === 'authored') return stage;
  return Object.freeze({
    ...stage,
    manifest: Object.freeze({
      ...stage.manifest,
      exits: Object.freeze([]),
    }),
  });
}

export class WorldLabDataService {
  private readonly templates: readonly RegionTemplate[];
  private readonly loader: WorldLabStageLoaderPort;
  private readonly generator: CampaignGraphGenerator;
  private readonly resolver: PhysicalExitResolver;
  private readonly binder: CampaignExitBinder;
  private readonly projector: WorldLabProjector;

  public constructor(options: WorldLabDataServiceOptions = {}) {
    this.templates = options.templates ?? WORLD_LAB_FIXTURE_CATALOG;
    const registry = options.registry ?? new StageRegistry();
    if (!options.registry) {
      registerLegacyStages(registry);
      registerCampaignChapters(registry);
    }
    this.loader = options.loader ?? new StageLoader(registry);
    this.generator = options.generator ?? new CampaignGraphGenerator();
    this.resolver = options.resolver ?? new PhysicalExitResolver();
    this.binder = options.binder ?? new CampaignExitBinder();
    this.projector = options.projector ?? new WorldLabProjector();
  }

  public generate(seedInput: string): WorldLabGenerationResult {
    const seed = seedInput.trim();
    if (!seed) {
      return this.failure([{
        code: 'world-lab.seed-required',
        severity: 'error',
        origin: 'integration',
        message: 'A non-empty seed is required.',
      }]);
    }

    const generated = this.generator.generate({
      campaignId: 'fixture.world-lab',
      campaignRevision: 1,
      catalogRevision: 1,
      runId: 'world-lab.run',
      runSeed: seed,
      templates: this.templates,
      context: { flags: {}, completedEventIds: [], revealedBeatIds: [] },
    });
    if (!generated.ok) return this.failure(diagnosticsFromGraphFailure(generated));

    return this.generateGraph(seed, generated.value);
  }

  /** Projects an already-generated public campaign graph through the same real headless pipeline. */
  public generateGraph(seedInput: string, graph: CampaignGraph): WorldLabGenerationResult {
    const seed = seedInput.trim();
    if (!seed) {
      return this.failure([{
        code: 'world-lab.seed-required',
        severity: 'error',
        origin: 'integration',
        message: 'A non-empty seed is required.',
      }]);
    }

    const diagnostics: WorldLabDiagnostic[] = [{
      code: 'world-lab.fixture-manifest-overlay',
      severity: 'warning',
      origin: 'integration',
      message: 'Fixture mode overlays empty manifests only on legacy maps; authored exits remain explicit and other campaign edges use synthetic slots.',
    }];
    const stageInputs: WorldLabStageProjectionInput[] = [];
    const nodes = [...graph.nodes].sort((left, right) =>
      left.id < right.id ? -1 : left.id > right.id ? 1 : 0);

    for (const node of nodes) {
      const loaded = this.loader.load({
        stageId: node.stageId,
        runId: graph.runId,
        runSeed: node.stageSeed,
      });
      if (!loaded.ok) {
        diagnostics.push(...loaded.error.diagnostics.map(diagnostic => diagnosticFromStage(
          diagnostic,
          'stage-loader',
          { nodeId: node.id, stageId: node.stageId },
        )));
        continue;
      }
      diagnostics.push(...loaded.value.diagnostics.map(diagnostic => diagnosticFromStage(
        diagnostic,
        'stage-loader',
        { nodeId: node.id, stageId: node.stageId },
      )));

      const campaignStage = fixtureStage(loaded.value);
      const outgoing = graph.edges.filter(edge => edge.sourceNodeId === node.id);
      const physicalExitResult = this.resolver.resolve({
        node,
        edges: outgoing,
        stage: campaignStage,
      });
      let bindingResult: CampaignExitBindingResult | undefined;
      if (!physicalExitResult.ok) {
        diagnostics.push(...physicalExitResult.error.diagnostics.map(diagnostic => diagnosticFromStage(
          diagnostic,
          'physical-exit-resolver',
          { nodeId: node.id, stageId: node.stageId },
        )));
        diagnostics.push({
          code: 'world-lab.binding-unavailable',
          severity: 'warning',
          origin: 'integration',
          message: `Binding is unavailable because physical exit resolution failed for ${node.id}.`,
          nodeId: node.id,
          stageId: node.stageId,
        });
      } else {
        bindingResult = this.binder.bind({
          graph,
          sourceNodeId: node.id,
          stage: campaignStage,
          physicalExitResult,
        });
        if (!bindingResult.ok) {
          diagnostics.push(...bindingResult.error.diagnostics.map(diagnostic => diagnosticFromStage(
            diagnostic,
            'campaign-exit-binder',
            { nodeId: node.id, stageId: node.stageId },
          )));
        }
      }
      stageInputs.push(Object.freeze({
        node,
        displayStage: loaded.value,
        physicalExitResult,
        ...(bindingResult ? { bindingResult } : {}),
      }));
    }

    return Object.freeze({
      ok: true as const,
      value: this.projector.project({
        seed,
        graph,
        stages: stageInputs,
        diagnostics,
      }),
    });
  }

  private failure(diagnostics: readonly WorldLabDiagnostic[]): WorldLabGenerationResult {
    return Object.freeze({
      ok: false as const,
      error: Object.freeze({ diagnostics: Object.freeze([...diagnostics]) }),
    });
  }
}

