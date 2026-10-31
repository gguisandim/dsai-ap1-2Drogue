import type {
  WorldLabDiagnostic,
  WorldLabDocument,
  WorldLabMacroNodeView,
  WorldLabMacroRouteResult,
  WorldLabMacroRouteView,
  WorldLabSessionState,
  WorldLabStageMarker,
} from '../contracts';
import { WorldLabSession } from '../WorldLabSession';
import { WorldLabMacroDataService } from '../WorldLabMacroDataService';
import { renderCampaignGraph } from './CampaignGraphView';
import {
  renderMacroCampaignGraph,
  type MacroCampaignSelection,
} from './MacroCampaignGraphView';
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

function macroLayerLabel(node: WorldLabMacroNodeView): string {
  return ['Hub', 'Histórias independentes', 'Regiões corrompidas', 'Final'][node.layer] ??
    `Camada ${node.layer}`;
}

function renderMacroInspector(
  container: HTMLElement,
  view: WorldLabMacroRouteView,
  selection: MacroCampaignSelection,
): void {
  container.replaceChildren();
  const fixture = document.createElement('div');
  fixture.className = 'wl-fixture-notice';
  fixture.textContent = 'Fixture de inspeção · não representa um save real';
  container.append(fixture);

  const progressTitle = document.createElement('h3');
  progressTitle.textContent = 'Progresso macro';
  container.append(progressTitle);
  const progress = document.createElement('dl');
  progress.className = 'wl-fields';
  appendField(progress, 'local atual', view.progress.currentLocationId);
  view.progress.routes.forEach(route => appendField(progress, route.title, route.status));
  appendField(progress, 'camada corrompida', view.progress.corruptedStatus);
  appendField(progress, 'final', view.progress.finalStatus);
  appendField(progress, 'escolhas atuais', view.connections.length);
  container.append(progress);

  const catalogTitle = document.createElement('h3');
  catalogTitle.textContent = `Catálogo dinâmico (${view.catalog.entries.length})`;
  container.append(catalogTitle);
  const catalog = document.createElement('ul');
  catalog.className = 'wl-choice-list wl-stage-catalog';
  view.catalog.entries.forEach(entry => {
    const item = document.createElement('li');
    item.dataset.stageId = entry.stageId;
    item.dataset.eligibility = entry.eligibility;
    const label = document.createElement('strong');
    label.textContent = `${entry.title} · ${entry.stageId}`;
    const status = document.createElement('span');
    status.textContent = [
      `${entry.chapterId}@${entry.chapterRevision}`,
      `manifesto ${entry.manifestRevision}`,
      entry.loadability,
      entry.eligibility,
      `capabilities: ${entry.capabilityIds.join(', ') || 'nenhuma'}`,
      `dependências: ${entry.dependencyChapterIds.join(', ') || 'nenhuma'}`,
      `diagnósticos: ${entry.diagnosticCodes.join(', ') || 'nenhum'}`,
    ].join(' · ');
    item.append(label, status);
    catalog.append(item);
  });
  container.append(catalog);

  const title = document.createElement('h3');
  title.textContent = 'Seleção';
  container.append(title);
  const fields = document.createElement('dl');
  fields.className = 'wl-fields';
  const edge = view.edges.find(item => item.id === selection.edgeId);
  const node = view.nodes.find(item => item.id === selection.nodeId);
  if (edge) {
    appendField(fields, 'connectionId', edge.connectionId);
    appendField(fields, 'origem', edge.sourceNodeId);
    appendField(fields, 'destino', edge.targetNodeId);
    appendField(fields, 'tipo', edge.kind);
    appendField(fields, 'estado', edge.state);
    appendField(fields, 'navegação', edge.navigationStatus);
  } else if (node) {
    appendField(fields, 'id', node.id);
    appendField(fields, 'nome', node.title);
    appendField(fields, 'tipo', node.kind);
    appendField(fields, 'rota', node.routeTitle ?? 'campanha principal');
    appendField(fields, 'camada', macroLayerLabel(node));
    appendField(fields, 'progresso', node.progressState);
    appendField(fields, 'conteúdo', node.contentState);
    appendField(fields, 'navegação', node.navigationStatus);
    appendField(fields, 'stageId', node.stageId);
    appendField(fields, 'templateId', node.templateId);
    appendField(fields, 'placeholder legado', node.legacyPlaceholder ? 'sim' : 'não');
    appendField(fields, 'condições de acesso', node.accessRequirementIds.join(', ') || 'nenhuma');
    appendField(fields, 'entradas', node.incomingConnectionIds.join(', ') || 'nenhuma');
    appendField(fields, 'saídas', node.outgoingConnectionIds.join(', ') || 'nenhuma');
    if (node.mapMessage) appendField(fields, 'mapa', node.mapMessage);
  } else appendField(fields, 'seleção', 'nenhuma');
  container.append(fields);

  const choicesTitle = document.createElement('h3');
  choicesTitle.textContent = 'Escolhas fornecidas pelo runtime';
  container.append(choicesTitle);
  const choices = document.createElement('ul');
  choices.className = 'wl-choice-list';
  view.connections.forEach(connection => {
    const item = document.createElement('li');
    item.dataset.connectionStatus = connection.status;
    const label = document.createElement('strong');
    label.textContent = connection.connectionId;
    const status = document.createElement('span');
    status.textContent = `${connection.status}${connection.blockedReason ? ` · ${connection.blockedReason}` : ''}`;
    item.append(label, status);
    choices.append(item);
  });
  container.append(choices);
}

export class WorldLabApp {
  private mode: 'procedural' | 'macro' = 'procedural';
  private macroView?: WorldLabMacroRouteView;
  private macroDiagnostics: readonly WorldLabDiagnostic[] = Object.freeze([]);
  private macroSelection: MacroCampaignSelection = {};
  private macroTile?: { readonly x: number; readonly y: number };
  private macroGeneration = 0;

  private readonly elements: {
    proceduralMode: HTMLButtonElement;
    macroMode: HTMLButtonElement;
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
    graphTitle: HTMLElement;
    graphHelp: HTMLElement;
  };

  public constructor(
    private readonly root: HTMLElement,
    private readonly session = new WorldLabSession(),
    private readonly macroSource: { generate(seed: string): WorldLabMacroRouteResult } =
      new WorldLabMacroDataService(),
  ) {
    root.className = 'world-lab';
    root.innerHTML = `
      <header class="wl-header">
        <div class="wl-brand"><span class="wl-brand-mark">UT</span><div><strong>Umbra World Lab</strong><small>Campaign & Stage Visualizer</small></div></div>
        <div class="wl-controls">
          <div class="wl-mode-switch" role="tablist" aria-label="Visualização">
            <button type="button" data-role="mode-procedural" class="is-active" role="tab" aria-selected="true">Procedural</button>
            <button type="button" data-role="mode-macro" role="tab" aria-selected="false">Campanha</button>
          </div>
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
        <section class="wl-panel wl-panel--graph"><div class="wl-panel-title"><span data-role="graph-title">Campaign Graph</span><small data-role="graph-help">Wheel to zoom · drag to pan</small></div><div class="wl-canvas" data-role="graph"></div></section>
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
      proceduralMode: query('mode-procedural'), macroMode: query('mode-macro'),
      seed: query('seed'), generate: query('generate'), regenerate: query('regenerate'),
      nodeSelect: query('node-select'), grid: query('grid'), overlays: query('overlays'),
      exportButton: query('export'), importInput: query('import'), graph: query('graph'),
      stage: query('stage'), inspector: query('inspector'), diagnostics: query('diagnostics'),
      source: query('source'), stageTitle: query('stage-title'),
      graphTitle: query('graph-title'), graphHelp: query('graph-help'),
    };
    this.bindControls();
    this.session.subscribe(state => this.render(state));
    this.render(this.session.state());
  }

  public start(): void {
    this.session.generate();
  }

  private bindControls(): void {
    this.elements.proceduralMode.addEventListener('click', () => this.setMode('procedural'));
    this.elements.macroMode.addEventListener('click', () => this.setMode('macro'));
    this.elements.seed.addEventListener('input', () => this.session.setSeed(this.elements.seed.value));
    this.elements.generate.addEventListener('click', () => this.generateCurrent());
    this.elements.regenerate.addEventListener('click', () => this.generateCurrent());
    this.elements.nodeSelect.addEventListener('change', () => {
      if (this.mode === 'macro') this.selectMacroNode(this.elements.nodeSelect.value);
      else this.session.selectNode(this.elements.nodeSelect.value);
    });
    this.elements.grid.addEventListener('change', () => this.session.setFilters({ showGrid: this.elements.grid.checked }));
    this.elements.overlays.addEventListener('change', () => this.session.setFilters({ showOverlays: this.elements.overlays.checked }));
    this.elements.exportButton.addEventListener('click', () => {
      if (this.mode === 'macro') return;
      const serialized = this.session.exportSnapshot();
      if (!serialized) return;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(new Blob([serialized], { type: 'application/json' }));
      link.download = `umbra-world-lab-${this.session.state().seed}.json`;
      link.click();
      URL.revokeObjectURL(link.href);
    });
    this.elements.importInput.addEventListener('change', () => {
      if (this.mode === 'macro') return;
      const file = this.elements.importInput.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.addEventListener('load', () => this.session.importSnapshot(String(reader.result ?? '')));
      reader.readAsText(file);
    });
  }

  private setMode(mode: 'procedural' | 'macro'): void {
    if (this.mode === mode) return;
    this.mode = mode;
    if (mode === 'macro' && !this.macroView) this.generateMacro();
    else this.render(this.session.state());
  }

  private generateCurrent(): void {
    if (this.mode === 'macro') this.generateMacro();
    else this.session.generate();
  }

  private generateMacro(): void {
    const result = this.macroSource.generate(this.session.state().seed);
    this.macroGeneration += 1;
    if (!result.ok) {
      this.macroView = undefined;
      this.macroDiagnostics = result.error.diagnostics;
      this.macroSelection = {};
      this.render(this.session.state());
      return;
    }
    this.macroView = result.value;
    this.macroDiagnostics = result.value.graph.diagnostics;
    const current = result.value.nodes.find(node => node.id === result.value.progress.currentLocationId) ??
      result.value.nodes[0];
    this.macroSelection = current ? { nodeId: current.id } : {};
    this.macroTile = undefined;
    this.render(this.session.state());
  }

  private selectMacroNode(nodeId: string): boolean {
    if (!this.macroView?.nodes.some(node => node.id === nodeId)) return false;
    this.macroSelection = { nodeId };
    this.macroTile = undefined;
    this.render(this.session.state());
    return true;
  }

  private selectMacroEdge(edgeId: string): boolean {
    const edge = this.macroView?.edges.find(item => item.id === edgeId);
    if (!edge) return false;
    this.macroSelection = { nodeId: edge.sourceNodeId, edgeId };
    this.render(this.session.state());
    return true;
  }

  private render(state: WorldLabSessionState): void {
    this.elements.graph.classList.remove('wl-empty');
    if (this.elements.seed.value !== state.seed) this.elements.seed.value = state.seed;
    this.elements.grid.checked = state.filters.showGrid;
    this.elements.overlays.checked = state.filters.showOverlays;
    const procedural = this.mode === 'procedural';
    this.elements.proceduralMode.classList.toggle('is-active', procedural);
    this.elements.macroMode.classList.toggle('is-active', !procedural);
    this.elements.proceduralMode.setAttribute('aria-selected', String(procedural));
    this.elements.macroMode.setAttribute('aria-selected', String(!procedural));
    this.elements.exportButton.disabled = !procedural;
    this.elements.importInput.disabled = !procedural;
    if (!procedural) {
      this.renderMacro(state);
      return;
    }
    this.elements.graphTitle.textContent = 'Campaign Graph';
    this.elements.graphHelp.textContent = 'Wheel to zoom · drag to pan';
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

  private renderMacro(state: WorldLabSessionState): void {
    const view = this.macroView;
    this.elements.graphTitle.textContent = 'Campanha Macro';
    this.elements.graphHelp.textContent = 'Hub · rotas · marcos · unlocks';
    this.elements.source.textContent = view
      ? `Fixture macro · seed ${view.graph.seed} · geração ${this.macroGeneration}`
      : 'Campanha macro indisponível';
    this.elements.nodeSelect.replaceChildren();
    view?.nodes.forEach(node => {
      const option = document.createElement('option');
      option.value = node.id;
      option.textContent = `L${node.layer} · ${node.title} · ${node.progressState}`;
      option.selected = node.id === this.macroSelection.nodeId;
      this.elements.nodeSelect.append(option);
    });
    if (view) {
      renderMacroCampaignGraph(this.elements.graph, view, this.macroSelection, {
        selectNode: nodeId => { this.selectMacroNode(nodeId); },
        selectEdge: edgeId => { this.selectMacroEdge(edgeId); },
      });
    } else {
      this.elements.graph.replaceChildren();
      const empty = document.createElement('div');
      empty.className = 'wl-empty';
      empty.textContent = 'Não foi possível projetar a campanha macro.';
      this.elements.graph.append(empty);
    }
    const node = view?.nodes.find(item => item.id === this.macroSelection.nodeId);
    const stage = node?.stageNodeId
      ? view?.graph.stages.find(item => item.nodeId === node.stageNodeId)
      : undefined;
    this.elements.stageTitle.textContent = node
      ? `Stage Inspector · ${node.title}` : 'Stage Inspector';
    if (node?.contentState === 'planned') {
      this.elements.stage.replaceChildren();
      const empty = document.createElement('div');
      empty.className = 'wl-empty wl-planned-map';
      const title = document.createElement('strong');
      title.textContent = 'Mapa ainda não implementado';
      const detail = document.createElement('span');
      detail.textContent = `${node.title} mantém somente sua identidade e contratos declarativos.`;
      empty.append(title, detail);
      this.elements.stage.append(empty);
    } else {
      renderStageInspector(
        this.elements.stage,
        stage,
        {
          ...(node?.stageNodeId ? { nodeId: node.stageNodeId } : {}),
          ...(this.macroTile ? { tile: this.macroTile } : {}),
        },
        state.filters.showGrid,
        state.filters.showOverlays,
        {
          selectTile: (x, y) => {
            this.macroTile = { x, y };
            this.render(this.session.state());
          },
          selectPhysicalExit: physicalExitId => {
            const graphEdge = view?.graph.edges.find(item => item.physicalExitId === physicalExitId);
            const macroEdge = graphEdge
              ? view?.edges.find(item => item.connectionId &&
                  view.connections.find(connection => connection.connectionId === item.connectionId)
                    ?.edgeId === graphEdge.id)
              : undefined;
            if (macroEdge) this.selectMacroEdge(macroEdge.id);
          },
        },
      );
    }
    if (view) renderMacroInspector(this.elements.inspector, view, this.macroSelection);
    else {
      this.elements.inspector.replaceChildren();
      const empty = document.createElement('p');
      empty.className = 'wl-empty-inline';
      empty.textContent = 'Sem dados macro para inspecionar.';
      this.elements.inspector.append(empty);
    }
    renderDiagnostics(this.elements.diagnostics, this.macroDiagnostics, () => undefined);
  }
}

