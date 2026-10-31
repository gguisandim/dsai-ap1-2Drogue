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
  type WorldLabProjectionInput,
  type WorldLabStageProjectionInput,
} from './WorldLabProjector';

export type WorldLabGraphInspection = Pick<WorldLabProjectionInput,
  'topologyPolicyId' | 'currentNodeId' | 'stageInstanceIdsByNodeId' |
  'revisitCounts' | 'edgeTraversalCounts'>;

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
  readonly presentationVariantId?: string;
  /** Development-only focus: projects this stage in one graph node. */
  readonly focusStageId?: string;
}

export interface WorldLabStageOption {
  readonly id: string;
  readonly title: string;
  readonly manifestRevision: number;
  readonly presentationVariantIds: readonly string[];
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
  private readonly registry: StageRegistry;
  private currentFocusStageId?: string;
  private currentPresentationVariantId?: string;
  private lastFocusNodeId?: string;

  public constructor(options: WorldLabDataServiceOptions = {}) {
    this.templates = options.templates ?? WORLD_LAB_FIXTURE_CATALOG;
    const registry = options.registry ?? new StageRegistry();
    if (!options.registry) {
      registerLegacyStages(registry);
      registerCampaignChapters(registry);
    }
    this.registry = registry;
    this.currentFocusStageId = options.focusStageId;
    this.currentPresentationVariantId = options.presentationVariantId;
    this.loader = options.loader ?? new StageLoader(registry);
    this.generator = options.generator ?? new CampaignGraphGenerator();
    this.resolver = options.resolver ?? new PhysicalExitResolver();
    this.binder = options.binder ?? new CampaignExitBinder();
    this.projector = options.projector ?? new WorldLabProjector();
  }

  public presentationVariants(): readonly string[] {
    const modules = this.currentFocusStageId
      ? this.registry.listModules().filter(module => module.manifest.id === this.currentFocusStageId)
      : this.registry.listModules();
    return Object.freeze([...new Set(modules
      .flatMap(module => Object.keys(module.manifest.presentationVariants ?? {})))].sort());
  }

  public stageOptions(): readonly WorldLabStageOption[] {
    return Object.freeze(this.registry.listModules().map(module => Object.freeze({
      id: module.manifest.id,
      title: module.manifest.title,
      manifestRevision: module.manifest.revision,
      presentationVariantIds: Object.freeze(Object.keys(module.manifest.presentationVariants ?? {}).sort()),
    })).sort((left, right) => left.id < right.id ? -1 : left.id > right.id ? 1 : 0));
  }

  public focusStageId(): string | undefined {
    return this.currentFocusStageId;
  }

  public setFocusStageId(id?: string): void {
    this.currentFocusStageId = id?.trim() || undefined;
    if (this.currentPresentationVariantId &&
      !this.presentationVariants().includes(this.currentPresentationVariantId)) {
      this.currentPresentationVariantId = undefined;
    }
  }

  public presentationVariantId(): string | undefined {
    return this.currentPresentationVariantId;
  }

  public setPresentationVariant(id?: string): void {
    this.currentPresentationVariantId = id?.trim() || undefined;
  }

  private presentationVariantIdForStage(): string | undefined {
    return this.currentPresentationVariantId;
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

    this.lastFocusNodeId = undefined;
    let graph = generated.value;
    if (this.currentFocusStageId) {
      if (!this.registry.get(this.currentFocusStageId)) {
        return this.failure([{
          code: 'world-lab.focus-stage.unknown',
          severity: 'error',
          origin: 'integration',
          message: `Focus stage is not registered: ${this.currentFocusStageId}.`,
          stageId: this.currentFocusStageId,
        }]);
      }
      const target = [...graph.nodes].sort((left, right) =>
        right.depth - left.depth || (left.id < right.id ? -1 : 1))[0];
      this.lastFocusNodeId = target.id;
      graph = Object.freeze({
        ...graph,
        nodes: Object.freeze(graph.nodes.map(node => node.id === target.id
          ? Object.freeze({ ...node, stageId: this.currentFocusStageId as string })
          : node)),
      });
    }
    return this.generateGraph(seed, graph);
  }

  public focusNodeId(): string | undefined {
    return this.lastFocusNodeId;
  }

  /** Projects an already-generated public campaign graph through the same real headless pipeline. */
  public generateGraph(
    seedInput: string,
    graph: CampaignGraph,
    inspection: WorldLabGraphInspection = {},
  ): WorldLabGenerationResult {
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

    const variantId = this.presentationVariantIdForStage();
    for (const node of nodes) {
      const variantForNode = this.registry.get(node.stageId)?.manifest.presentationVariants?.[variantId ?? '']
        ? variantId
        : undefined;
      const loaded = this.loader.load({
        stageId: node.stageId,
        runId: graph.runId,
        runSeed: node.stageSeed,
        ...(variantForNode ? { presentationVariantId: variantForNode } : {}),
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
        ...inspection,
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

