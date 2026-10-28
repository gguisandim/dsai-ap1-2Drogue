import type {
  WorldLabDiagnostic,
  WorldLabDocument,
  WorldLabFilters,
  WorldLabGenerationResult,
  WorldLabSelection,
  WorldLabSessionState,
  WorldLabSnapshotResult,
} from './contracts';
import { WorldLabDataService } from './WorldLabDataService';
import { WorldLabSnapshotCodec } from './WorldLabSnapshot';

export interface WorldLabDataSource {
  generate(seed: string): WorldLabGenerationResult;
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
      filters: { showGrid: true, showOverlays: true },
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
    const firstNode = result.value.nodes.find(node => node.entry) ?? result.value.nodes[0];
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
        diagnosticCode: diagnostic.code,
      },
    });
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

