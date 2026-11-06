import type {
  WorldLabDiagnostic,
  WorldLabDocument,
  WorldLabFilters,
  WorldLabGenerationResult,
  WorldLabRuntimeValidation,
  WorldLabSelection,
  WorldLabSessionState,
  WorldLabSnapshotResult,
  WorldLabValidationCheck,
} from './contracts';
import { WorldLabDataService } from './WorldLabDataService';
import type { WorldLabStageOption } from './WorldLabDataService';
import { WorldLabSnapshotCodec } from './WorldLabSnapshot';
import { parseRuntimeValidation, type RuntimeValidationParseResult } from './WorldLabValidation';

export interface WorldLabDataSource {
  generate(seed: string): WorldLabGenerationResult;
  presentationVariants?(): readonly string[];
  presentationVariantId?(): string | undefined;
  setPresentationVariant?(id?: string): void;
  focusNodeId?(): string | undefined;
  stageOptions?(): readonly WorldLabStageOption[];
  focusStageId?(): string | undefined;
  setFocusStageId?(id?: string): void;
}

type Listener = (state: WorldLabSessionState) => void;

function freezeSelection(selection: WorldLabSelection): WorldLabSelection {
  return Object.freeze({
    ...selection,
    ...(selection.tile ? { tile: Object.freeze({ ...selection.tile }) } : {}),
  });
}

function freezeState(state: WorldLabSessionState): WorldLabSessionState {
  return Object.freeze({
    ...state,
    diagnostics: Object.freeze([...state.diagnostics]),
    selection: freezeSelection(state.selection),
    filters: Object.freeze({ ...state.filters }),
    runtimeValidations: Object.freeze({ ...(state.runtimeValidations ?? {}) }),
  });
}

export class WorldLabSession {
  private stateValue: WorldLabSessionState;
  private readonly listeners = new Set<Listener>();

  public constructor(
    private readonly dataSource: WorldLabDataSource = new WorldLabDataService(),
    private readonly snapshots = new WorldLabSnapshotCodec(),
    initialSeed = 'umbra-lab-2026',
  ) {
    this.stateValue = freezeState({
      seed: initialSeed,
      generation: 0,
      diagnostics: [],
      selection: {},
      runtimeValidations: {},
      filters: {
        showGrid: true,
        showOverlays: true,
        showEntities: true,
        showDecorations: true,
        showExits: true,
      },
    });
  }

  public state(): WorldLabSessionState {
    return this.stateValue;
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public setSeed(seed: string): void {
    this.replace({ ...this.stateValue, seed });
  }

  public presentationVariants(): readonly string[] {
    return this.dataSource.presentationVariants?.() ?? Object.freeze([]);
  }

  public presentationVariantId(): string | undefined {
    return this.dataSource.presentationVariantId?.();
  }

  public setPresentationVariant(id?: string): WorldLabGenerationResult | undefined {
    if (!this.dataSource.setPresentationVariant) return undefined;
    this.dataSource.setPresentationVariant(id);
    return this.generate();
  }

  public stageOptions(): readonly WorldLabStageOption[] {
    return this.dataSource.stageOptions?.() ?? Object.freeze([]);
  }

  public focusStageId(): string | undefined {
    return this.dataSource.focusStageId?.();
  }

  public setFocusStageId(id?: string): WorldLabGenerationResult | undefined {
    if (!this.dataSource.setFocusStageId) return undefined;
    this.dataSource.setFocusStageId(id);
    return this.generate();
  }

  public generate(): WorldLabGenerationResult {
    const result = this.dataSource.generate(this.stateValue.seed);
    if (!result.ok) {
      this.replace({
        ...this.stateValue,
        generation: this.stateValue.generation + 1,
        diagnostics: result.error.diagnostics,
        selection: {},
      });
      return result;
    }
    const focusNodeId = this.dataSource.focusNodeId?.();
    const firstNode = result.value.nodes.find(node => node.id === focusNodeId) ??
      result.value.nodes.find(node => node.entry) ?? result.value.nodes[0];
    this.replace({
      ...this.stateValue,
      seed: result.value.seed,
      generation: this.stateValue.generation + 1,
      document: result.value,
      diagnostics: result.value.diagnostics,
      selection: firstNode ? { nodeId: firstNode.id } : {},
    });
    return result;
  }

  public regenerate(): WorldLabGenerationResult {
    return this.generate();
  }

  public selectNode(nodeId: string): boolean {
    if (!this.stateValue.document?.nodes.some(node => node.id === nodeId)) return false;
    this.replace({ ...this.stateValue, selection: { nodeId } });
    return true;
  }

  public selectEdge(edgeId: string): boolean {
    const edge = this.stateValue.document?.edges.find(candidate => candidate.id === edgeId);
    if (!edge) return false;
    this.replace({
      ...this.stateValue,
      selection: {
        nodeId: edge.sourceNodeId,
        edgeId: edge.id,
        ...(edge.tile ? { tile: edge.tile } : {}),
      },
    });
    return true;
  }

  public selectPhysicalExit(physicalExitId: string): boolean {
    const edge = this.stateValue.document?.edges.find(candidate =>
      candidate.physicalExitId === physicalExitId);
    if (!edge) return false;
    return this.selectEdge(edge.id);
  }

  public selectTile(x: number, y: number): boolean {
    const nodeId = this.stateValue.selection.nodeId;
    const stage = this.stateValue.document?.stages.find(candidate => candidate.nodeId === nodeId);
    if (!stage || x < 0 || y < 0 || x >= stage.width || y >= stage.height) return false;
    this.replace({
      ...this.stateValue,
      selection: { ...this.stateValue.selection, tile: { x, y } },
    });
    return true;
  }

  public selectDiagnostic(diagnostic: WorldLabDiagnostic): void {
    const edge = diagnostic.edgeId
      ? this.stateValue.document?.edges.find(candidate => candidate.id === diagnostic.edgeId)
      : undefined;
    this.replace({
      ...this.stateValue,
      selection: {
        ...(diagnostic.nodeId || edge ? { nodeId: diagnostic.nodeId ?? edge?.sourceNodeId } : {}),
        ...(diagnostic.edgeId ? { edgeId: diagnostic.edgeId } : {}),
        ...(diagnostic.location ? { tile: { ...diagnostic.location } } : {}),
        ...(diagnostic.regionId ? { regionId: diagnostic.regionId } : {}),
        ...(diagnostic.checkId ? { validationCheckId: diagnostic.checkId } : {}),
        diagnosticCode: diagnostic.code,
      },
    });
  }

  public runtimeValidation(stageId: string): WorldLabRuntimeValidation | undefined {
    return this.stateValue.runtimeValidations?.[stageId];
  }

  public validationChecks(stageId: string): readonly WorldLabValidationCheck[] {
    const stage = this.stateValue.document?.stages.find(candidate => candidate.stageId === stageId);
    return Object.freeze([
      ...(stage?.validation?.checks ?? []),
      ...(this.stateValue.runtimeValidations?.[stageId]?.checks ?? []),
    ]);
  }

  /**
   * Selects a static or runtime check and moves the stage map to its location.
   * It never mutates the document or the game state.
   */
  public selectValidationCheck(checkId: string): boolean {
    const selectedStage = this.stateValue.document?.stages.find(stage =>
      stage.nodeId === this.stateValue.selection.nodeId) ??
      this.stateValue.document?.stages.find(stage =>
        [...(stage.validation?.checks ?? []),
          ...(this.stateValue.runtimeValidations?.[stage.stageId]?.checks ?? [])]
          .some(check => check.id === checkId));
    if (!selectedStage) return false;
    const check = this.validationChecks(selectedStage.stageId).find(item => item.id === checkId);
    if (!check) return false;
    this.replace({
      ...this.stateValue,
      selection: {
        ...this.stateValue.selection,
        nodeId: selectedStage.nodeId,
        ...(check.location ? { tile: { ...check.location } } : {}),
        ...(check.regionId ? { regionId: check.regionId } : {}),
        validationCheckId: check.id,
        diagnosticCode: check.code,
      },
    });
    return true;
  }

  public importRuntimeValidation(serialized: string): RuntimeValidationParseResult {
    const parsed = parseRuntimeValidation(serialized);
    if (!parsed.ok) {
      this.replace({
        ...this.stateValue,
        diagnostics: Object.freeze([...this.stateValue.diagnostics, ...parsed.diagnostics]),
      });
      return parsed;
    }
    const stageExists = this.stateValue.document?.stages.some(stage =>
      stage.stageId === parsed.value.stageId);
    if (!stageExists) {
      const diagnostic: WorldLabDiagnostic = Object.freeze({
        code: 'world-lab.runtime-report.unknown-stage',
        severity: 'error' as const,
        origin: 'playtest-runtime' as const,
        message: `O relatório de homologação referencia uma fase ausente do documento: ${parsed.value.stageId}.`,
        stageId: parsed.value.stageId,
        path: Object.freeze(['runtime-report', 'stageId']),
      });
      this.replace({
        ...this.stateValue,
        diagnostics: Object.freeze([...this.stateValue.diagnostics, diagnostic]),
      });
      return Object.freeze({ ok: false as const, diagnostics: Object.freeze([diagnostic]) });
    }
    const stage = this.stateValue.document?.stages.find(candidate =>
      candidate.stageId === parsed.value.stageId);
    this.replace({
      ...this.stateValue,
      runtimeValidations: Object.freeze({
        ...(this.stateValue.runtimeValidations ?? {}),
        [parsed.value.stageId]: parsed.value,
      }),
      ...(stage ? { selection: { ...this.stateValue.selection, nodeId: stage.nodeId } } : {}),
    });
    return parsed;
  }

  public setFilters(filters: Partial<WorldLabFilters>): void {
    this.replace({
      ...this.stateValue,
      filters: { ...this.stateValue.filters, ...filters },
    });
  }

  public exportSnapshot(): string | undefined {
    return this.stateValue.document ? this.snapshots.export(this.stateValue.document) : undefined;
  }

  public importSnapshot(serialized: string): WorldLabSnapshotResult {
    const result = this.snapshots.import(serialized);
    if (!result.ok) {
      this.replace({ ...this.stateValue, diagnostics: result.error.diagnostics });
      return result;
    }
    const firstNode = result.value.document.nodes.find(node => node.entry) ??
      result.value.document.nodes[0];
    this.replace({
      ...this.stateValue,
      seed: result.value.document.seed,
      generation: this.stateValue.generation + 1,
      document: result.value.document,
      diagnostics: result.value.document.diagnostics,
      selection: firstNode ? { nodeId: firstNode.id } : {},
    });
    return result;
  }

  private replace(state: WorldLabSessionState): void {
    this.stateValue = freezeState(state);
    this.listeners.forEach(listener => listener(this.stateValue));
  }
}

