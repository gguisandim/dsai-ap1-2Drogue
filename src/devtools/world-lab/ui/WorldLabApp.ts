import type {
  WorldLabDiagnostic,
  WorldLabDocument,
  WorldLabSessionState,
  WorldLabStageMarker,
} from '../contracts';
import { WorldLabSession } from '../WorldLabSession';
import { renderCampaignGraph } from './CampaignGraphView';
import { renderStageInspector } from './StageInspectorView';

function appendField(container: HTMLElement, label: string, value: unknown): void {
  const term = document.createElement('dt');
  term.textContent = label;
  const detail = document.createElement('dd');
  detail.textContent = value === undefined ? 'unavailable' : String(value);
  container.append(term, detail);
}

function tileLabel(tile: number): string {
  return ['floor', 'wall', 'pillar', 'water / pit', 'lava / hazard', 'exit',
    'locked door', 'chest', 'spawn', 'boss'][tile] ?? `unknown (${tile})`;
}

function tileWalkable(tile: number): boolean {
  return tile === 0 || tile === 5 || tile === 6 || tile === 7 || tile === 8 || tile === 9;
}

function selectedStage(state: WorldLabSessionState) {
  return state.document?.stages.find(stage => stage.nodeId === state.selection.nodeId);
}

function tileMarkers(
  document: WorldLabDocument | undefined,
  nodeId: string | undefined,
  x: number,
  y: number,
): readonly WorldLabStageMarker[] {
  return document?.stages.find(stage => stage.nodeId === nodeId)?.markers
    .filter(marker => marker.x === x && marker.y === y) ?? [];
}

function renderInspector(container: HTMLElement, state: WorldLabSessionState): void {
  container.replaceChildren();
  const title = document.createElement('h3');
  title.textContent = 'Selection';
  container.append(title);
  const fields = document.createElement('dl');
  fields.className = 'wl-fields';
  const node = state.document?.nodes.find(candidate => candidate.id === state.selection.nodeId);
  const edge = state.document?.edges.find(candidate => candidate.id === state.selection.edgeId);
  if (edge) {
    appendField(fields, 'edgeId', edge.id);
    appendField(fields, 'origin', edge.sourceNodeId);
    appendField(fields, 'destination', edge.targetNodeId);
    appendField(fields, 'kind', edge.kind);
    appendField(fields, 'exitSlotId', edge.exitSlotId);
    appendField(fields, 'stageExitId', edge.stageExitId);
    appendField(fields, 'physicalExitId', edge.physicalExitId);
    appendField(fields, 'binding', edge.bindingStatus);
    appendField(fields, 'association', edge.association);
  } else if (node) {
    appendField(fields, 'nodeId', node.id);
    appendField(fields, 'type', node.kind);
    appendField(fields, 'stageId', node.stageId);
    appendField(fields, 'templateId', node.templateId);
    appendField(fields, 'act / depth', `${node.actId} / ${node.depth}`);
    appendField(fields, 'branch', node.branchId);
    appendField(fields, 'incoming / outgoing', `${node.incomingCount} / ${node.outgoingCount}`);
    appendField(fields, 'physical capacity', node.maximumPhysicalExits);
    appendField(fields, 'biome contract', node.biomeId);
    appendField(fields, 'presentation', node.presentation?.label);
  } else {
    appendField(fields, 'selection', 'none');
  }
  if (state.selection.tile) {
    const stage = selectedStage(state);
    const { x, y } = state.selection.tile;
    const tile = stage?.tiles[y]?.[x];
    const markers = tileMarkers(state.document, state.selection.nodeId, x, y);
    appendField(fields, 'tile', `${x}, ${y}`);
    appendField(fields, 'tile type', tile === undefined ? undefined : tileLabel(tile));
    appendField(fields, 'walkable', tile === undefined ? undefined : tileWalkable(tile));
    appendField(fields, 'entities', markers.map(marker => `${marker.kind}:${marker.label}`).join(', ') || 'none');
  }
  container.append(fields);
}

function renderDiagnostics(
  container: HTMLElement,
  diagnostics: readonly WorldLabDiagnostic[],
  select: (diagnostic: WorldLabDiagnostic) => void,
): void {
  container.replaceChildren();
  if (diagnostics.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'wl-empty-inline';
    empty.textContent = 'No diagnostics.';
    container.append(empty);
    return;
  }
  diagnostics.forEach(diagnostic => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `wl-diagnostic wl-diagnostic--${diagnostic.severity}`;
    button.dataset.diagnosticCode = diagnostic.code;
    const heading = document.createElement('span');
    heading.className = 'wl-diagnostic-code';
    heading.textContent = `${diagnostic.origin} · ${diagnostic.code}`;
    const message = document.createElement('span');
    message.textContent = diagnostic.message;
    const reference = document.createElement('span');
    reference.className = 'wl-diagnostic-ref';
    reference.textContent = [diagnostic.nodeId, diagnostic.edgeId, diagnostic.stageId]
      .filter(Boolean).join(' · ') || 'global';
    button.append(heading, message, reference);
    button.addEventListener('click', () => select(diagnostic));
    container.append(button);
  });
}

export class WorldLabApp {
  private readonly elements: {
    seed: HTMLInputElement;
    generate: HTMLButtonElement;
    regenerate: HTMLButtonElement;
    nodeSelect: HTMLSelectElement;
    grid: HTMLInputElement;
    overlays: HTMLInputElement;
    exportButton: HTMLButtonElement;
    importInput: HTMLInputElement;
    graph: HTMLElement;
    stage: HTMLElement;
    inspector: HTMLElement;
    diagnostics: HTMLElement;
    source: HTMLElement;
    stageTitle: HTMLElement;
  };

  public constructor(
    private readonly root: HTMLElement,
    private readonly session = new WorldLabSession(),
  ) {
    root.className = 'world-lab';
    root.innerHTML = `
      <header class="wl-header">
        <div class="wl-brand"><span class="wl-brand-mark">UT</span><div><strong>Umbra World Lab</strong><small>Campaign & Stage Visualizer</small></div></div>
        <div class="wl-controls">
          <label>Seed <input data-role="seed" spellcheck="false"></label>
          <button data-role="generate" class="is-primary">Generate</button>
          <button data-role="regenerate">Regenerate</button>
          <label>Node <select data-role="node-select"></select></label>
          <label class="wl-check"><input type="checkbox" data-role="grid"> Grid</label>
          <label class="wl-check"><input type="checkbox" data-role="overlays"> Overlays</label>
          <button data-role="export">Export snapshot</button>
          <label class="wl-file">Import snapshot<input type="file" accept="application/json,.json" data-role="import"></label>
        </div>
        <div class="wl-source" data-role="source"></div>
      </header>
      <main class="wl-layout">
        <section class="wl-panel wl-panel--graph"><div class="wl-panel-title"><span>Campaign Graph</span><small>Wheel to zoom · drag to pan</small></div><div class="wl-canvas" data-role="graph"></div></section>
        <section class="wl-panel wl-panel--stage"><div class="wl-panel-title"><span data-role="stage-title">Stage Inspector</span><small>Contract tiles + resolved overlays</small></div><div class="wl-canvas" data-role="stage"></div></section>
        <aside class="wl-panel wl-panel--inspector"><div class="wl-panel-title"><span>Inspector</span></div><div class="wl-scroll" data-role="inspector"></div></aside>
        <section class="wl-panel wl-panel--diagnostics"><div class="wl-panel-title"><span>Diagnostics</span><small>Typed pipeline output</small></div><div class="wl-diagnostics" data-role="diagnostics"></div></section>
      </main>`;
    const query = <T extends Element>(role: string): T => {
      const element = root.querySelector<T>(`[data-role="${role}"]`);
      if (!element) throw new Error(`World Lab element missing: ${role}`);
      return element;
    };
    this.elements = {
      seed: query('seed'), generate: query('generate'), regenerate: query('regenerate'),
      nodeSelect: query('node-select'), grid: query('grid'), overlays: query('overlays'),
      exportButton: query('export'), importInput: query('import'), graph: query('graph'),
      stage: query('stage'), inspector: query('inspector'), diagnostics: query('diagnostics'),
      source: query('source'), stageTitle: query('stage-title'),
    };
    this.bindControls();
    this.session.subscribe(state => this.render(state));
    this.render(this.session.state());
  }

  public start(): void {
    this.session.generate();
  }

  private bindControls(): void {
    this.elements.seed.addEventListener('input', () => this.session.setSeed(this.elements.seed.value));
    this.elements.generate.addEventListener('click', () => this.session.generate());
    this.elements.regenerate.addEventListener('click', () => this.session.regenerate());
    this.elements.nodeSelect.addEventListener('change', () => this.session.selectNode(this.elements.nodeSelect.value));
    this.elements.grid.addEventListener('change', () => this.session.setFilters({ showGrid: this.elements.grid.checked }));
    this.elements.overlays.addEventListener('change', () => this.session.setFilters({ showOverlays: this.elements.overlays.checked }));
    this.elements.exportButton.addEventListener('click', () => {
      const serialized = this.session.exportSnapshot();
      if (!serialized) return;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(new Blob([serialized], { type: 'application/json' }));
      link.download = `umbra-world-lab-${this.session.state().seed}.json`;
      link.click();
      URL.revokeObjectURL(link.href);
    });
    this.elements.importInput.addEventListener('change', () => {
      const file = this.elements.importInput.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.addEventListener('load', () => this.session.importSnapshot(String(reader.result ?? '')));
      reader.readAsText(file);
    });
  }

  private render(state: WorldLabSessionState): void {
    if (this.elements.seed.value !== state.seed) this.elements.seed.value = state.seed;
    this.elements.grid.checked = state.filters.showGrid;
    this.elements.overlays.checked = state.filters.showOverlays;
    this.elements.source.textContent = state.document
      ? `Fixture · real headless pipeline · generation ${state.generation}`
      : 'Awaiting generation';
    this.elements.nodeSelect.replaceChildren();
    state.document?.nodes.forEach(node => {
      const option = document.createElement('option');
      option.value = node.id;
      option.textContent = `D${node.depth} · ${node.presentation?.label ?? node.stageId} · ${node.branchId}`;
      option.selected = node.id === state.selection.nodeId;
      this.elements.nodeSelect.append(option);
    });
    if (state.document) {
      renderCampaignGraph(this.elements.graph, state.document, state.selection, {
        selectNode: nodeId => this.session.selectNode(nodeId),
        selectEdge: edgeId => this.session.selectEdge(edgeId),
      });
    } else {
      this.elements.graph.textContent = 'Generate a campaign to inspect its graph.';
      this.elements.graph.classList.add('wl-empty');
    }
    const stage = selectedStage(state);
    this.elements.stageTitle.textContent = stage ? `Stage Inspector · ${stage.title}` : 'Stage Inspector';
    renderStageInspector(
      this.elements.stage,
      stage,
      state.selection,
      state.filters.showGrid,
      state.filters.showOverlays,
      {
        selectTile: (x, y) => this.session.selectTile(x, y),
        selectPhysicalExit: physicalExitId => this.session.selectPhysicalExit(physicalExitId),
      },
    );
    renderInspector(this.elements.inspector, state);
    renderDiagnostics(this.elements.diagnostics, state.diagnostics,
      diagnostic => this.session.selectDiagnostic(diagnostic));
  }
}

