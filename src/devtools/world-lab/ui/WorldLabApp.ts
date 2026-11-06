import type {
  WorldLabArtAssetPresentation,
  WorldLabDiagnostic,
  WorldLabDocument,
  WorldLabCampaignRuntimeValidation,
  WorldLabMacroRouteResult,
  WorldLabMacroRouteView,
  WorldLabReportLoader,
  WorldLabRuntimeValidation,
  WorldLabSessionState,
  WorldLabStageMarker,
  WorldLabStageValidation,
  WorldLabStageView,
  WorldLabValidationCheck,
} from '../contracts';
import { WorldLabSession } from '../WorldLabSession';
import { WorldLabMacroDataService } from '../WorldLabMacroDataService';
import {
  campaignValidationDiagnostics,
  runtimeValidationDiagnostics,
} from '../WorldLabValidation';
import { renderCampaignGraph } from './CampaignGraphView';
import { renderMacroCampaignGraph, type MacroCampaignSelection } from './MacroCampaignGraphView';
import { renderStageInspector } from './StageInspectorView';
import {
  createWorldLabCaptureDescriptor,
  downloadWorldLabCapture,
  renderPhaserPreview,
  type WorldLabStageMode,
} from './PhaserPreviewView';
import {
  WORLD_LAB_PT_BR as T,
  localizeDiagnosticMessage,
  localizeDiagnosticOrigin,
  localizeEvidence,
  localizeMarker,
  localizeStatus,
  localizeValidationStatus,
} from './WorldLabPtBr';

type Workspace = 'campaign' | 'stages' | 'comparison';
type CampaignMode = 'procedural' | 'macro';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function appendField(container: HTMLElement, label: string, value: unknown): void {
  const term = document.createElement('dt');
  term.textContent = label;
  const detail = document.createElement('dd');
  detail.textContent = value === undefined || value === '' ? T.labels.unavailable : String(value);
  container.append(term, detail);
}

function detailsSection(
  container: HTMLElement,
  title: string,
  render: (content: HTMLElement) => void,
  open = false,
): void {
  const details = document.createElement('details');
  details.className = 'wl-inspector-section';
  details.open = open;
  const summary = document.createElement('summary');
  summary.textContent = title;
  const content = document.createElement('div');
  content.className = 'wl-inspector-section-content';
  render(content);
  details.append(summary, content);
  container.append(details);
}

function fieldsSection(container: HTMLElement, values: readonly (readonly [string, unknown])[]): void {
  const fields = document.createElement('dl');
  fields.className = 'wl-fields';
  values.forEach(([label, value]) => appendField(fields, label, value));
  container.append(fields);
}

function tileLabel(tile: number): string {
  return ['piso', 'parede', 'pilar', 'água / abismo', 'lava / perigo', 'saída',
    'porta trancada', 'baú', 'spawn', 'chefe'][tile] ?? `desconhecido (${tile})`;
}

function tileWalkable(tile: number): boolean {
  return [0, 5, 6, 7, 8, 9].includes(tile);
}

function selectedStage(state: WorldLabSessionState): WorldLabStageView | undefined {
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

function dimensions(value?: { readonly width: number; readonly height: number }): string | undefined {
  return value ? `${Math.round(value.width)}×${Math.round(value.height)}` : undefined;
}

function renderCampaignInspector(container: HTMLElement, state: WorldLabSessionState): void {
  container.replaceChildren();
  const node = state.document?.nodes.find(candidate => candidate.id === state.selection.nodeId);
  const edge = state.document?.edges.find(candidate => candidate.id === state.selection.edgeId);
  detailsSection(container, T.sections.general, content => {
    if (edge) fieldsSection(content, [
      ['edgeId', edge.id], [T.fields.origin, edge.sourceNodeId], [T.fields.destination, edge.targetNodeId],
      [T.fields.kind, edge.kind], ['exitSlotId', edge.exitSlotId], ['stageExitId', edge.stageExitId],
      ['physicalExitId', edge.physicalExitId], [T.fields.binding, localizeStatus(edge.bindingStatus)],
      [T.fields.association, edge.association],
    ]);
    else if (node) fieldsSection(content, [
      ['nodeId', node.id], [T.fields.type, node.kind], [T.fields.stage, node.stageId],
      [T.fields.template, node.templateId], [T.fields.actDepth, `${node.actId} / ${node.depth}`],
      [T.fields.branch, node.branchId], [T.fields.connections, `${node.incomingCount} / ${node.outgoingCount}`],
      [T.fields.capacity, node.maximumPhysicalExits], [T.fields.biome, node.biomeId],
    ]);
    else fieldsSection(content, [[T.labels.selection, T.labels.noSelection]]);
  }, true);
  if (state.selection.tile) {
    const stage = selectedStage(state);
    const { x, y } = state.selection.tile;
    const tile = stage?.tiles[y]?.[x];
    const markers = tileMarkers(state.document, state.selection.nodeId, x, y);
    detailsSection(container, T.sections.visual, content => fieldsSection(content, [
      [T.fields.tile, `${x}, ${y}`],
      [T.fields.tileType, tile === undefined ? undefined : tileLabel(tile)],
      [T.fields.walkable, tile === undefined ? undefined : tileWalkable(tile) ? T.labels.yes : T.labels.no],
      [T.fields.entities, markers.map(marker => `${localizeMarker(marker.kind)}:${marker.label}`).join(', ') || T.labels.none],
    ]), true);
  }
}

function renderAssetInspector(
  container: HTMLElement,
  stage: WorldLabStageView | undefined,
  asset: WorldLabArtAssetPresentation | undefined,
  marker: WorldLabStageMarker | undefined,
  variantId: string | undefined,
  diagnosticCode: string | undefined,
  validationPanel?: (content: HTMLElement) => void,
): void {
  container.replaceChildren();
  if (validationPanel) detailsSection(container, T.sections.validation, validationPanel, true);
  detailsSection(container, T.sections.general, content => fieldsSection(content, [
    [T.labels.viewedStage, stage ? `${stage.title} · ${stage.stageId}` : undefined],
    [T.labels.activeVariant, variantId || T.labels.defaultVariant],
    [T.labels.inspectedItem, asset ? `${asset.category}:${asset.id}` : marker ? `${localizeMarker(marker.kind)}:${marker.id}` : T.labels.noSelection],
    ...(asset ? [[T.fields.type, T.categories[asset.category]], [T.fields.id, asset.id]] as const : []),
    ...(marker ? [[T.fields.type, localizeMarker(marker.kind)], [T.fields.id, marker.id]] as const : []),
  ]), true);
  detailsSection(container, T.sections.visual, content => fieldsSection(content, asset ? [
    [T.fields.texture, asset.textureKey], [T.fields.frame, asset.frame],
    [T.fields.sourceSize, dimensions(asset.sourceDimensions)], [T.fields.frameSize, dimensions(asset.frameDimensions)],
    [T.fields.visibleSize, dimensions(asset.visibleDimensions)], [T.fields.worldSize, dimensions(asset.renderedDimensions)],
    [T.fields.layer, asset.layer], [T.fields.compatibility, localizeStatus(asset.compatibility)],
  ] : [[T.fields.layer, marker ? localizeMarker(marker.kind) : undefined]]), Boolean(asset));
  detailsSection(container, T.sections.transformation, content => fieldsSection(content, [
    [T.fields.scale, asset?.scale],
    [T.fields.anchor, asset?.anchor ? `${asset.anchor.x}, ${asset.anchor.y}` : undefined],
    ['Classe de escala', asset?.scaleClass],
  ]));
  detailsSection(container, T.sections.collision, content => fieldsSection(content, [
    [T.fields.collision, asset?.collision
      ? `${asset.collision.width}×${asset.collision.height} @ ${asset.collision.offsetX},${asset.collision.offsetY}`
      : 'Metadado indisponível; a física permanece no runtime.'],
  ]));
  const origin = asset && stage?.visualPresentation?.assetOrigins?.find(item => item.textureKey === asset.textureKey);
  detailsSection(container, T.sections.origin, content => fieldsSection(content, [
    ['originId', asset?.originId], [T.fields.package, origin?.pack], [T.fields.author, origin?.author],
    [T.fields.license, origin?.license], ['URL', origin?.sourceUrl],
  ]));
  detailsSection(container, T.sections.diagnostics, content => fieldsSection(content, [
    [T.fields.warnings, asset?.warnings.join(', ') || T.labels.none],
    ['Código selecionado', diagnosticCode],
  ]), Boolean(asset?.warnings.length || diagnosticCode));
}

function renderMacroInspector(
  container: HTMLElement,
  view: WorldLabMacroRouteView,
  selection: MacroCampaignSelection,
): void {
  container.replaceChildren();
  const fixture = document.createElement('div');
  fixture.className = 'wl-fixture-notice';
  fixture.textContent = T.help.fixture;
  container.append(fixture);
  const edge = view.edges.find(item => item.id === selection.edgeId);
  const node = view.nodes.find(item => item.id === selection.nodeId);
  detailsSection(container, T.sections.general, content => fieldsSection(content, edge ? [
    ['connectionId', edge.connectionId], [T.fields.origin, edge.sourceNodeId],
    [T.fields.destination, edge.targetNodeId], [T.fields.type, edge.kind],
    [T.fields.status, localizeStatus(edge.state)], ['Navegação', localizeStatus(edge.navigationStatus)],
  ] : node ? [
    [T.fields.id, node.id], ['Nome', node.title], [T.fields.type, node.kind],
    [T.fields.branch, node.routeTitle ?? 'campanha principal'], [T.fields.layer, `Camada ${node.layer}`],
    ['Progresso', localizeStatus(node.progressState)], ['Conteúdo', localizeStatus(node.contentState)],
    [T.fields.stage, node.stageId], [T.fields.template, node.templateId],
    ['Placeholder legado', node.legacyPlaceholder ? T.labels.yes : T.labels.no],
    ['Condições de acesso', node.accessRequirementIds.join(', ') || T.labels.none],
    ['Mapa', node.mapMessage],
  ] : [[T.labels.selection, T.labels.none]]), true);
  detailsSection(container, T.sections.progress, content => fieldsSection(content, [
    [T.fields.currentLocation, view.progress.currentLocationId],
    ...view.progress.routes.map(route => [route.title, localizeStatus(route.status)] as const),
    ['Camada corrompida', localizeStatus(view.progress.corruptedStatus)],
    ['Final', localizeStatus(view.progress.finalStatus)],
  ]));
  detailsSection(container, `${T.sections.catalog} (${view.catalog.entries.length})`, content => {
    const list = document.createElement('ul');
    list.className = 'wl-choice-list wl-stage-catalog';
    view.catalog.entries.forEach(entry => {
      const item = document.createElement('li');
      item.dataset.stageId = entry.stageId;
      item.dataset.eligibility = entry.eligibility;
      const label = document.createElement('strong');
      label.textContent = `${entry.title} · ${entry.stageId}`;
      const status = document.createElement('span');
      status.textContent = `${entry.chapterId}@${entry.chapterRevision} · manifesto ${entry.manifestRevision} · ${localizeStatus(entry.loadability)} · ${localizeStatus(entry.eligibility)}`;
      item.append(label, status);
      list.append(item);
    });
    content.append(list);
  });
  detailsSection(container, T.sections.composition, content => {
    fieldsSection(content, [
      [T.fields.status, localizeStatus(view.composition.status)], [T.labels.seed, view.composition.seed],
      ['Política', view.composition.policyId], ['Solicitadas', view.composition.requestedStageCount],
      ['Selecionadas', view.composition.selectedStageCount],
    ]);
    const list = document.createElement('ul');
    list.className = 'wl-choice-list wl-composition-assignments';
    view.composition.assignments.forEach(assignment => {
      const item = document.createElement('li');
      item.dataset.compositionSlot = assignment.slotId;
      item.dataset.stageId = assignment.stageId;
      item.textContent = `${assignment.actId} · ${assignment.slotId} · ${assignment.stageId}`;
      list.append(item);
    });
    content.append(list);
  });
}

export class WorldLabApp {
  private workspace: Workspace = 'campaign';
  private campaignMode: CampaignMode = 'procedural';
  private macroView?: WorldLabMacroRouteView;
  private macroDiagnostics: readonly WorldLabDiagnostic[] = Object.freeze([]);
  private macroSelection: MacroCampaignSelection = {};
  private macroGeneration = 0;
  private stageMode: Exclude<WorldLabStageMode, 'compare'> = 'visual';
  private previewZoom = 1;
  private previewHud = true;
  private comparisonVariantId?: string;
  private explorerOpen = true;
  private inspectorOpen = true;
  private diagnosticsOpen = false;
  private maximized = false;
  private inspectedAssetId?: string;
  private inspectedMarkerId?: string;
  private localReportStatus?: {
    readonly loadedAt: string;
    readonly generatedAt?: string;
    readonly count: number;
    readonly skipped: number;
    readonly error?: string;
  };
  private manualReportAt?: string;
  private readonly diagnosticFilters = new Set<WorldLabDiagnostic['severity']>(['error', 'warning', 'info']);

  private readonly elements: Record<string, HTMLElement> & {
    seed: HTMLInputElement; nodeSelect: HTMLSelectElement; stageSelect: HTMLSelectElement;
    variant: HTMLSelectElement; comparisonVariant: HTMLSelectElement; stageMode: HTMLSelectElement;
    zoom: HTMLSelectElement; grid: HTMLInputElement; hud: HTMLInputElement; overlays: HTMLInputElement;
    entities: HTMLInputElement; decorations: HTMLInputElement; exits: HTMLInputElement;
    importInput: HTMLInputElement;
  };

  public constructor(
    private readonly root: HTMLElement,
    private readonly session = new WorldLabSession(),
    private readonly macroSource: { generate(seed: string): WorldLabMacroRouteResult } = new WorldLabMacroDataService(),
    private readonly previewEnabled = ['localhost', '127.0.0.1', '0.0.0.0', '[::1]']
      .includes(globalThis.location?.hostname ?? ''),
    private readonly reportLoader?: WorldLabReportLoader,
  ) {
    const queryParameters = new URLSearchParams(globalThis.location?.search ?? '');
    const requestedView = queryParameters.get('view');
    if (requestedView === 'visual') this.workspace = 'stages';
    if (requestedView === 'compare') this.workspace = 'comparison';
    const requestedZoom = Number(queryParameters.get('zoom'));
    if ([0.5, 0.75, 1, 1.25].includes(requestedZoom)) this.previewZoom = requestedZoom;
    const requestedStage = queryParameters.get('stage')?.trim();
    if (requestedStage) this.session.setFocusStageId(requestedStage);
    const requestedVariant = queryParameters.get('variant')?.trim();
    if (requestedVariant) this.session.setPresentationVariant(requestedVariant);
    this.comparisonVariantId = queryParameters.get('comparisonVariant')?.trim() || undefined;
    root.className = 'world-lab';
    root.innerHTML = this.template();
    const element = <E extends HTMLElement>(role: string): E => {
      const value = root.querySelector<E>(`[data-role="${role}"]`);
      if (!value) throw new Error(`Elemento do World Lab ausente: ${role}`);
      return value;
    };
    this.elements = {
      workspaceCampaign: element('workspace-campaign'), workspaceStages: element('workspace-stages'),
      workspaceComparison: element('workspace-comparison'), proceduralMode: element('mode-procedural'),
      macroMode: element('mode-macro'), seed: element('seed'), generate: element('generate'),
      regenerate: element('regenerate'), nodeSelect: element('node-select'), stageSelect: element('stage-select'),
      variant: element('variant'), comparisonVariant: element('comparison-variant'), stageMode: element('stage-mode'),
      zoom: element('zoom'), grid: element('grid'), hud: element('hud'), overlays: element('overlays'), entities: element('entities'),
      decorations: element('decorations'), exits: element('exits'), capture: element('capture'),
      exportButton: element('export'), importInput: element('import'), campaignTools: element('campaign-tools'),
      stageTools: element('stage-tools'), graphPanel: element('graph-panel'), graph: element('graph'),
      stagePanel: element('stage-panel'), stage: element('stage'), explorerPanel: element('explorer-panel'),
      inspectorPanel: element('inspector-panel'), inspector: element('inspector'),
      diagnosticsPanel: element('diagnostics-panel'), diagnosticsSummary: element('diagnostics-summary'),
      stageHelp: element('stage-help'),
      diagnostics: element('diagnostics'), source: element('source'), primaryTitle: element('primary-title'),
      primaryHelp: element('primary-help'), toggleExplorer: element('toggle-explorer'),
      toggleInspector: element('toggle-inspector'), maximize: element('maximize'),
      toggleDiagnostics: element('toggle-diagnostics'), fit: element('fit'), explorer: element('explorer'),
      filterError: element('filter-error'), filterWarning: element('filter-warning'), filterInfo: element('filter-info'),
    };
    this.bindControls();
    this.session.subscribe(state => this.render(state));
    this.render(this.session.state());
  }

  public start(): void {
    this.session.generate();
    void this.loadLocalReports();
  }

  /** Loads the local report index produced by the homologation harness. */
  private async loadLocalReports(): Promise<void> {
    if (!this.reportLoader) return;
    try {
      const result = await this.reportLoader();
      const documentStages = new Set(
        (this.session.state().document?.stages ?? []).map(stage => stage.stageId),
      );
      let count = 0;
      let skipped = 0;
      result.reports.forEach(report => {
        const compatible = report.kind === 'umbra.campaign-homologation.report'
          ? documentStages.has(report.originStageId) || documentStages.has(report.destinationStageId)
          : documentStages.has(report.stageId);
        if (!compatible) { skipped += 1; return; }
        const parsed = report.kind === 'umbra.campaign-homologation.report'
          ? this.session.importCampaignValidation(JSON.stringify(report))
          : this.session.importRuntimeValidation(JSON.stringify(report));
        if (parsed.ok) count += 1;
        else skipped += 1;
      });
      this.localReportStatus = {
        loadedAt: new Date().toISOString(),
        count,
        skipped,
        ...(result.generatedAt ? { generatedAt: result.generatedAt } : {}),
        ...(result.error ? { error: result.error } : {}),
      };
    } catch (error) {
      this.localReportStatus = {
        loadedAt: new Date().toISOString(),
        count: 0,
        skipped: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
    this.render(this.session.state());
  }

  private template(): string {
    return `
      <header class="wl-topbar">
        <div class="wl-brand"><span class="wl-brand-mark">UT</span><div><strong>${T.product}</strong><small>${T.productSubtitle}</small></div></div>
        <nav class="wl-workspace-nav" aria-label="Áreas de trabalho">
          <button type="button" data-role="workspace-campaign">${T.workspaces.campaign}</button>
          <button type="button" data-role="workspace-stages">${T.workspaces.stages}</button>
          <button type="button" data-role="workspace-comparison">${T.workspaces.comparison}</button>
        </nav>
        <div class="wl-source" data-role="source"></div>
      </header>
      <section class="wl-contextbar">
        <div class="wl-toolgroup" data-role="campaign-tools">
          <div class="wl-mode-switch" role="tablist" aria-label="Tipo de campanha">
            <button type="button" data-role="mode-procedural">${T.campaignModes.procedural}</button>
            <button type="button" data-role="mode-macro">${T.campaignModes.macro}</button>
          </div>
          <label>${T.labels.seed}<input data-role="seed" spellcheck="false"></label>
          <button data-role="generate" class="is-primary">${T.actions.generate}</button>
          <button data-role="regenerate">${T.actions.regenerate}</button>
          <label>${T.labels.node}<select data-role="node-select"></select></label>
          <button data-role="fit">${T.actions.fit}</button>
          <button data-role="export">${T.actions.export}</button>
          <label class="wl-file">${T.actions.import}<input type="file" accept="application/json,.json" data-role="import"></label>
        </div>
        <div class="wl-toolgroup" data-role="stage-tools">
          <label>${T.labels.stage}<select data-role="stage-select"></select></label>
          <label>${T.labels.variant}<select data-role="variant"></select></label>
          <label>${T.labels.view}<select data-role="stage-mode"><option value="structural">${T.labels.structural}</option><option value="visual">${T.labels.visual}</option></select></label>
          <label>${T.labels.compareWith}<select data-role="comparison-variant"></select></label>
          <label>${T.labels.zoom}<select data-role="zoom"><option value="0.5">50%</option><option value="0.75">75%</option><option value="1">100%</option><option value="1.25">125%</option></select></label>
          <button data-role="capture">${T.actions.capture}</button>
        </div>
        <div class="wl-view-actions">
          <button data-role="toggle-explorer"></button><button data-role="toggle-inspector"></button><button data-role="maximize"></button>
        </div>
      </section>
      <main class="wl-workspace">
        <aside class="wl-panel wl-panel--explorer" data-role="explorer-panel">
          <div class="wl-panel-title">${T.panels.explorer}</div><div class="wl-scroll" data-role="explorer">
            <section class="wl-layer-list"><h3>${T.sections.layers}</h3>
              <label><input type="checkbox" data-role="grid">${T.labels.grid}</label>
              <label><input type="checkbox" data-role="hud" checked>${T.labels.hud}</label>
              <label><input type="checkbox" data-role="overlays">${T.labels.overlays}</label>
              <label><input type="checkbox" data-role="entities">${T.labels.entities}</label>
              <label><input type="checkbox" data-role="decorations">${T.labels.decorations}</label>
              <label><input type="checkbox" data-role="exits">${T.labels.exits}</label>
            </section><div data-role="explorer-content"></div>
          </div>
        </aside>
        <section class="wl-panel wl-panel--primary" data-role="graph-panel">
          <div class="wl-panel-title"><span data-role="primary-title"></span><small data-role="primary-help"></small></div><div class="wl-canvas" data-role="graph"></div>
        </section>
        <section class="wl-panel wl-panel--primary" data-role="stage-panel">
          <div class="wl-panel-title"><span>${T.panels.stage}</span><small data-role="stage-help">${T.help.stage}</small></div><div class="wl-canvas" data-role="stage"></div>
        </section>
        <aside class="wl-panel wl-panel--inspector" data-role="inspector-panel">
          <div class="wl-panel-title">${T.panels.inspector}</div><div class="wl-scroll" data-role="inspector"></div>
        </aside>
      </main>
      <section class="wl-diagnostics-drawer" data-role="diagnostics-panel">
        <header><button data-role="toggle-diagnostics"><strong>${T.panels.diagnostics}</strong><span data-role="diagnostics-summary"></span></button>
          <div class="wl-diagnostic-filters"><button data-role="filter-error"></button><button data-role="filter-warning"></button><button data-role="filter-info"></button></div>
        </header><div class="wl-diagnostics" data-role="diagnostics"></div>
      </section>`;
  }

  private bindControls(): void {
    this.elements.workspaceCampaign.addEventListener('click', () => this.setWorkspace('campaign'));
    this.elements.workspaceStages.addEventListener('click', () => this.setWorkspace('stages'));
    this.elements.workspaceComparison.addEventListener('click', () => this.setWorkspace('comparison'));
    this.elements.proceduralMode.addEventListener('click', () => this.setCampaignMode('procedural'));
    this.elements.macroMode.addEventListener('click', () => this.setCampaignMode('macro'));
    this.elements.seed.addEventListener('input', () => this.session.setSeed(this.elements.seed.value));
    this.elements.generate.addEventListener('click', () => this.generateCurrent());
    this.elements.regenerate.addEventListener('click', () => this.generateCurrent());
    this.elements.fit.addEventListener('click', () => this.render(this.session.state()));
    this.elements.nodeSelect.addEventListener('change', () => {
      if (this.campaignMode === 'macro') this.selectMacroNode(this.elements.nodeSelect.value);
      else this.session.selectNode(this.elements.nodeSelect.value);
    });
    this.elements.stageSelect.addEventListener('change', () => {
      this.inspectedAssetId = undefined; this.inspectedMarkerId = undefined; this.comparisonVariantId = undefined;
      this.session.setFocusStageId(this.elements.stageSelect.value || undefined);
    });
    this.elements.variant.addEventListener('change', () => this.session.setPresentationVariant(this.elements.variant.value || undefined));
    this.elements.stageMode.addEventListener('change', () => { this.stageMode = this.elements.stageMode.value as Exclude<WorldLabStageMode, 'compare'>; this.render(this.session.state()); });
    this.elements.zoom.addEventListener('change', () => { this.previewZoom = Number(this.elements.zoom.value); this.render(this.session.state()); });
    this.elements.comparisonVariant.addEventListener('change', () => { this.comparisonVariantId = this.elements.comparisonVariant.value || undefined; this.render(this.session.state()); });
    this.elements.grid.addEventListener('change', () => this.session.setFilters({ showGrid: this.elements.grid.checked }));
    this.elements.hud.addEventListener('change', () => { this.previewHud = this.elements.hud.checked; this.render(this.session.state()); });
    this.elements.overlays.addEventListener('change', () => this.session.setFilters({ showOverlays: this.elements.overlays.checked }));
    this.elements.entities.addEventListener('change', () => this.session.setFilters({ showEntities: this.elements.entities.checked }));
    this.elements.decorations.addEventListener('change', () => this.session.setFilters({ showDecorations: this.elements.decorations.checked }));
    this.elements.exits.addEventListener('change', () => this.session.setFilters({ showExits: this.elements.exits.checked }));
    this.elements.toggleExplorer.addEventListener('click', () => { this.explorerOpen = !this.explorerOpen; this.render(this.session.state()); });
    this.elements.toggleInspector.addEventListener('click', () => { this.inspectorOpen = !this.inspectorOpen; this.render(this.session.state()); });
    this.elements.maximize.addEventListener('click', () => { this.maximized = !this.maximized; this.render(this.session.state()); });
    this.elements.toggleDiagnostics.addEventListener('click', () => { this.diagnosticsOpen = !this.diagnosticsOpen; this.render(this.session.state()); });
    (['error', 'warning', 'info'] as const).forEach(severity => {
      this.elements[`filter${severity[0].toUpperCase()}${severity.slice(1)}`].addEventListener('click', () => {
        if (this.diagnosticFilters.has(severity)) this.diagnosticFilters.delete(severity); else this.diagnosticFilters.add(severity);
        this.render(this.session.state());
      });
    });
    this.elements.capture.addEventListener('click', () => this.capture());
    this.elements.exportButton.addEventListener('click', () => this.exportSnapshot());
    this.elements.importInput.addEventListener('change', () => this.importSnapshot());
  }

  private setSource(text: string): void {
    this.elements.source.textContent = text;
    this.elements.source.title = text;
  }

  private setWorkspace(workspace: Workspace): void { this.workspace = workspace; this.maximized = false; this.render(this.session.state()); }
  private setCampaignMode(mode: CampaignMode): void {
    this.campaignMode = mode;
    if (mode === 'macro' && !this.macroView) this.generateMacro(); else this.render(this.session.state());
  }
  private generateCurrent(): void { if (this.campaignMode === 'macro') this.generateMacro(); else this.session.generate(); }

  private generateMacro(): void {
    const result = this.macroSource.generate(this.session.state().seed);
    this.macroGeneration += 1;
    if (!result.ok) {
      this.macroView = undefined; this.macroDiagnostics = result.error.diagnostics; this.macroSelection = {};
      this.render(this.session.state()); return;
    }
    this.macroView = result.value;
    this.macroDiagnostics = Object.freeze([...result.value.graph.diagnostics, ...result.value.composition.diagnostics]);
    const current = result.value.nodes.find(node => node.id === result.value.progress.currentLocationId) ?? result.value.nodes[0];
    this.macroSelection = current ? { nodeId: current.id } : {};
    this.render(this.session.state());
  }

  private selectMacroNode(nodeId: string): boolean {
    if (!this.macroView?.nodes.some(node => node.id === nodeId)) return false;
    this.macroSelection = { nodeId }; this.render(this.session.state()); return true;
  }
  private selectMacroEdge(edgeId: string): boolean {
    const edge = this.macroView?.edges.find(item => item.id === edgeId);
    if (!edge) return false;
    this.macroSelection = { nodeId: edge.sourceNodeId, edgeId }; this.render(this.session.state()); return true;
  }

  private capture(): void {
    const stage = selectedStage(this.session.state());
    if (!stage || (this.workspace === 'stages' && this.stageMode === 'structural')) return;
    const primary = this.session.presentationVariantId();
    const variants = this.workspace === 'comparison' ? [primary, this.comparisonVariantId] : [primary];
    if (!downloadWorldLabCapture(this.elements.stage, createWorldLabCaptureDescriptor(stage, variants, this.previewZoom))) {
      this.setSource(T.empty.previewLoading);
    }
  }

  private exportSnapshot(): void {
    if (this.campaignMode === 'macro') return;
    const serialized = this.session.exportSnapshot();
    if (!serialized) return;
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([serialized], { type: 'application/json' }));
    link.download = `umbra-world-lab-${this.session.state().seed}.json`; link.click(); URL.revokeObjectURL(link.href);
  }
  private importSnapshot(): void {
    if (this.campaignMode === 'macro') return;
    const file = this.elements.importInput.files?.[0]; if (!file) return;
    const reader = new FileReader(); reader.addEventListener('load', () => this.session.importSnapshot(String(reader.result ?? ''))); reader.readAsText(file);
  }

  private syncControls(state: WorldLabSessionState): readonly string[] {
    if (this.elements.seed.value !== state.seed) this.elements.seed.value = state.seed;
    const variants = this.session.presentationVariants();
    this.elements.variant.replaceChildren();
    const defaultOption = document.createElement('option'); defaultOption.value = ''; defaultOption.textContent = T.labels.defaultVariant; this.elements.variant.append(defaultOption);
    variants.forEach(id => { const option = document.createElement('option'); option.value = id; option.textContent = id; this.elements.variant.append(option); });
    const selectedVariant = this.session.presentationVariantId() ?? '';
    this.elements.variant.value = selectedVariant; this.elements.variant.disabled = variants.length === 0;
    this.elements.comparisonVariant.replaceChildren();
    variants.forEach(id => { const option = document.createElement('option'); option.value = id; option.textContent = id; this.elements.comparisonVariant.append(option); });
    const primary = selectedVariant || variants[0];
    if (!this.comparisonVariantId || !variants.includes(this.comparisonVariantId)) this.comparisonVariantId = variants.find(id => id !== primary) ?? variants[0];
    this.elements.comparisonVariant.value = this.comparisonVariantId ?? '';
    this.elements.stageSelect.replaceChildren();
    const campaign = document.createElement('option'); campaign.value = ''; campaign.textContent = T.labels.campaignNode; this.elements.stageSelect.append(campaign);
    this.session.stageOptions().forEach(stage => { const option = document.createElement('option'); option.value = stage.id; option.textContent = `${stage.title} · ${stage.id}`; this.elements.stageSelect.append(option); });
    this.elements.stageSelect.value = this.session.focusStageId() ?? '';
    this.elements.stageMode.value = this.stageMode; this.elements.zoom.value = String(this.previewZoom);
    this.elements.grid.checked = state.filters.showGrid; this.elements.hud.checked = this.previewHud; this.elements.overlays.checked = state.filters.showOverlays;
    this.elements.entities.checked = state.filters.showEntities; this.elements.decorations.checked = state.filters.showDecorations; this.elements.exits.checked = state.filters.showExits;
    return variants;
  }

  private render(state: WorldLabSessionState): void {
    const variants = this.syncControls(state);
    this.root.dataset.workspace = this.workspace;
    this.root.classList.toggle('is-maximized', this.maximized);
    this.root.classList.toggle('is-explorer-collapsed', !this.explorerOpen);
    this.root.classList.toggle('is-inspector-collapsed', !this.inspectorOpen);
    this.root.classList.toggle('is-diagnostics-open', this.diagnosticsOpen);
    (['campaign', 'stages', 'comparison'] as const).forEach(workspace => {
      const button = this.elements[`workspace${workspace[0].toUpperCase()}${workspace.slice(1)}`];
      button.classList.toggle('is-active', this.workspace === workspace);
      button.setAttribute('aria-current', this.workspace === workspace ? 'page' : 'false');
    });
    const campaign = this.workspace === 'campaign';
    this.elements.campaignTools.hidden = !campaign; this.elements.stageTools.hidden = campaign;
    this.elements.graphPanel.hidden = !campaign; this.elements.stagePanel.hidden = campaign;
    this.elements.stageHelp.textContent = this.workspace === 'comparison'
      ? T.help.comparison
      : this.stageMode === 'structural' ? T.help.structural : T.help.stage;
    this.elements.explorerPanel.hidden = campaign || !this.explorerOpen || this.maximized;
    this.elements.inspectorPanel.hidden = !this.inspectorOpen || this.maximized;
    this.elements.diagnosticsPanel.classList.toggle('is-open', this.diagnosticsOpen);
    this.elements.toggleExplorer.hidden = campaign;
    this.elements.toggleExplorer.textContent = this.explorerOpen ? T.actions.hideExplorer : T.actions.showExplorer;
    this.elements.toggleInspector.textContent = this.inspectorOpen ? T.actions.hideInspector : T.actions.showInspector;
    this.elements.maximize.textContent = this.maximized ? T.actions.restore : T.actions.maximize;
    this.elements.comparisonVariant.parentElement!.hidden = this.workspace !== 'comparison';
    this.elements.stageMode.parentElement!.hidden = this.workspace === 'comparison';
    this.elements.capture.toggleAttribute('disabled', this.workspace === 'stages' && this.stageMode === 'structural');
    const procedural = this.campaignMode === 'procedural';
    this.elements.proceduralMode.classList.toggle('is-active', procedural); this.elements.macroMode.classList.toggle('is-active', !procedural);
    if (campaign) {
      this.elements.stage.replaceChildren();
      if (procedural) this.renderProceduralCampaign(state); else this.renderMacroCampaign(state);
    } else {
      this.elements.graph.replaceChildren(); this.renderStageWorkspace(state, variants);
    }
    const runtimeDiagnostics = Object.values(state.runtimeValidations ?? {})
      .flatMap(runtimeValidationDiagnostics);
    const campaignDiagnostics = Object.values(state.campaignValidations ?? {})
      .flatMap(campaignValidationDiagnostics);
    const diagnostics = campaign && !procedural
      ? this.macroDiagnostics
      : [...state.diagnostics, ...runtimeDiagnostics, ...campaignDiagnostics];
    this.renderDiagnostics(diagnostics, diagnostic => {
      if (procedural) this.session.selectDiagnostic(diagnostic);
      this.diagnosticsOpen = true;
    });
  }

  private renderProceduralCampaign(state: WorldLabSessionState): void {
    this.elements.primaryTitle.textContent = T.panels.graph; this.elements.primaryHelp.textContent = T.help.graph;
    this.setSource(state.document ? `Fixture · pipeline real · geração ${state.generation}` : 'Aguardando geração');
    this.elements.nodeSelect.replaceChildren();
    state.document?.nodes.forEach(node => {
      const option = document.createElement('option'); option.value = node.id;
      option.textContent = `D${node.depth} · ${node.presentation?.label ?? node.stageId} · ${node.branchId}`;
      option.selected = node.id === state.selection.nodeId; this.elements.nodeSelect.append(option);
    });
    if (state.document) renderCampaignGraph(this.elements.graph, state.document, state.selection, { selectNode: id => this.session.selectNode(id), selectEdge: id => this.session.selectEdge(id) });
    else { this.elements.graph.textContent = T.empty.graph; this.elements.graph.classList.add('wl-empty'); }
    renderCampaignInspector(this.elements.inspector, state);
  }

  private renderMacroCampaign(state: WorldLabSessionState): void {
    const view = this.macroView;
    this.elements.primaryTitle.textContent = 'Campanha completa'; this.elements.primaryHelp.textContent = 'Hub · rotas · marcos · desbloqueios';
    this.setSource(view ? `Fixture macro · seed ${view.graph.seed} · geração ${this.macroGeneration}` : 'Campanha completa indisponível');
    this.elements.nodeSelect.replaceChildren();
    view?.nodes.forEach(node => { const option = document.createElement('option'); option.value = node.id; option.textContent = `L${node.layer} · ${node.title} · ${localizeStatus(node.progressState)}`; option.selected = node.id === this.macroSelection.nodeId; this.elements.nodeSelect.append(option); });
    if (view) {
      renderMacroCampaignGraph(this.elements.graph, view, this.macroSelection, { selectNode: id => { this.selectMacroNode(id); }, selectEdge: id => { this.selectMacroEdge(id); } });
      renderMacroInspector(this.elements.inspector, view, this.macroSelection);
    } else {
      this.elements.graph.replaceChildren(); const empty = document.createElement('div'); empty.className = 'wl-empty'; empty.textContent = T.empty.macro; this.elements.graph.append(empty);
      this.elements.inspector.textContent = T.empty.inspector;
    }
    void state;
  }

  private renderStageWorkspace(state: WorldLabSessionState, variants: readonly string[]): void {
    const stage = selectedStage(state); const selectedVariant = this.session.presentationVariantId();
    const runtimeValidation = stage
      ? this.session.runtimeValidation(stage.stageId, selectedVariant) : undefined;
    const campaignValidations = stage
      ? this.session.campaignValidationsFor(stage.stageId) : [];
    const runtimeChecks = [
      ...(runtimeValidation?.checks ?? []),
      ...campaignValidations.flatMap(report => report.checks),
    ];
    this.setSource(stage ? `${T.help.registered} · ${stage.stageId}` : T.empty.stage);
    this.renderExplorer(stage, state);
    if (this.workspace === 'comparison' && stage) renderPhaserPreview(this.elements.stage, {
      stage, variantId: selectedVariant, comparisonVariantId: this.comparisonVariantId,
      mode: 'compare', zoom: this.previewZoom, showGrid: state.filters.showGrid, showHud: this.previewHud, enabled: this.previewEnabled,
    });
    else if (this.stageMode === 'structural') renderStageInspector(this.elements.stage, stage, state.selection, state.filters.showGrid, state.filters.showOverlays, {
      selectTile: (x, y) => this.session.selectTile(x, y), selectPhysicalExit: id => this.session.selectPhysicalExit(id),
      selectValidationCheck: id => this.session.selectValidationCheck(id),
    }, { entities: state.filters.showEntities, decorations: state.filters.showDecorations, exits: state.filters.showExits }, {
      ...(stage?.validation ? { static: stage.validation } : {}),
      ...(runtimeChecks.length > 0 ? { runtimeChecks } : {}),
      ...(state.selection.validationCheckId ? { selectedCheckId: state.selection.validationCheckId } : {}),
    });
    else if (stage) renderPhaserPreview(this.elements.stage, {
      stage, variantId: selectedVariant, mode: 'visual', zoom: this.previewZoom, showGrid: state.filters.showGrid, showHud: this.previewHud, enabled: this.previewEnabled,
    });
    else renderStageInspector(this.elements.stage, undefined, state.selection, true, true, { selectTile: () => undefined, selectPhysicalExit: () => undefined });
    const asset = stage?.visualPresentation?.artAssets?.find(item => item.id === this.inspectedAssetId);
    const marker = stage?.markers.find(item => item.id === this.inspectedMarkerId);
    renderAssetInspector(
      this.elements.inspector, stage, asset, marker, selectedVariant, state.selection.diagnosticCode,
      content => this.renderValidationPanel(
        content, stage, runtimeValidation, campaignValidations, selectedVariant,
      ),
    );
    this.elements.comparisonVariant.disabled = this.workspace !== 'comparison' || variants.length === 0;
  }

  private renderValidationPanel(
    content: HTMLElement,
    stage: WorldLabStageView | undefined,
    runtime: WorldLabRuntimeValidation | undefined,
    campaigns: readonly WorldLabCampaignRuntimeValidation[],
    variantId: string | undefined,
  ): void {
    content.replaceChildren();
    if (!stage) { content.textContent = T.empty.stage; return; }
    const validation: WorldLabStageValidation | undefined = stage.validation;
    const checks: WorldLabValidationCheck[] = [...this.session.validationChecks(stage.stageId, variantId)];
    const statusRank: Readonly<Record<WorldLabValidationCheck['status'], number>> = Object.freeze({
      FAIL: 0, UNKNOWN: 1, PASS: 2,
    });
    checks.sort((left, right) => statusRank[left.status] - statusRank[right.status] ||
      (left.id < right.id ? -1 : left.id > right.id ? 1 : 0));
    const passed = checks.filter(check => check.status === 'PASS').length;
    const failed = checks.filter(check => check.status === 'FAIL').length;
    const unknown = checks.filter(check => check.status === 'UNKNOWN').length;
    const fields = document.createElement('dl');
    fields.className = 'wl-fields';
    appendField(fields, T.labels.result, validation
      ? localizeValidationStatus(validation.result)
      : 'indisponível (fase sem validação estática)');
    if (runtime) appendField(fields, 'Homologação Phaser', localizeValidationStatus(runtime.result));
    if (campaigns.length > 0) {
      appendField(fields, 'Homologação de campanha',
        campaigns.map(report => localizeValidationStatus(report.result)).join(' · '));
    }
    appendField(fields, T.labels.seed,
      validation?.seed ?? runtime?.seed ?? campaigns[0]?.runSeed ?? 'autoral');
    appendField(fields, T.labels.validationChecks,
      `${passed} PASS · ${failed} FAIL · ${unknown} UNKNOWN`);
    appendField(fields, T.labels.evidence, [...new Set(checks.map(check => check.evidence))]
      .map(localizeEvidence).join(' · ') || 'nenhuma');
    if (validation) {
      appendField(fields, 'Plano', `${validation.plan.source}${validation.plan.planId ? ` · ${validation.plan.planId}` : ''}`);
      appendField(fields, 'Rotas', validation.routes ? 'principal e secundária' : 'não fornecidas');
    }
    const reportGeneratedAt = runtime?.generatedAt ?? runtime?.evidence?.generatedAt ??
      campaigns[0]?.generatedAt;
    if (reportGeneratedAt) appendField(fields, 'Execução', reportGeneratedAt);
    if (runtime?.manifestRevision !== undefined) {
      appendField(fields, 'Revisão do relatório', runtime.manifestRevision);
      if (stage.manifestRevision !== undefined &&
        runtime.manifestRevision !== stage.manifestRevision) {
        appendField(fields, 'Situação do relatório',
          `desatualizado (fase revisão ${stage.manifestRevision})`);
      }
    } else if (runtime) {
      appendField(fields, 'Revisão do relatório', 'não informada (relatório anterior à 9.14)');
    }
    if (runtime?.scenario) appendField(fields, 'Cenário', runtime.scenario);
    if (runtime?.evidence?.browser) appendField(fields, 'Navegador', runtime.evidence.browser);
    if (runtime?.evidence?.screenshots?.length) {
      appendField(fields, 'Capturas', runtime.evidence.screenshots.join(', '));
    }
    if (this.localReportStatus) {
      appendField(fields, 'Relatórios locais', this.localReportStatus.error
        ? `indisponíveis (${this.localReportStatus.error})`
        : `${this.localReportStatus.count} carregado(s)`
          + `${this.localReportStatus.skipped > 0 ? ` · ${this.localReportStatus.skipped} ignorado(s)` : ''}`
          + ` · ${this.localReportStatus.generatedAt ?? this.localReportStatus.loadedAt}`);
    }
    if (this.manualReportAt) appendField(fields, 'Importação manual', this.manualReportAt);
    content.append(fields);

    if (campaigns.length > 0) {
      const campaignBlock = document.createElement('div');
      campaignBlock.className = 'wl-campaign-reports';
      campaignBlock.dataset.role = 'campaign-reports';
      campaigns.forEach(report => {
        const block = document.createElement('div');
        block.className = 'wl-campaign-report';
        block.dataset.campaignReport = report.runId ?? 'run';
        const title = document.createElement('strong');
        title.textContent = `Campanha: ${report.originStageId} → ${report.destinationStageId}`;
        const role = report.originStageId === stage.stageId ? 'origem' : 'destino';
        const persistence = report.persistence as Record<string, unknown> | undefined;
        const preserved = persistence?.preserved === true ? 'preservado'
          : persistence?.preserved === false ? 'incompleto' : 'não verificado';
        const isolated = persistence?.isolated === true ? 'isolado'
          : persistence?.isolated === false ? 'contaminado' : 'não verificado';
        const resources = isRecord(persistence?.resources) && persistence.resources.preserved === true
          ? 'preservados' : 'não verificados';
        const transition = report.transitions.find(item => item.role === 'primary') ?? report.transitions[0];
        const expectedRevision = report.originStageId === stage.stageId
          ? report.manifestRevision : report.destinationManifestRevision;
        const revision = expectedRevision === undefined
          ? 'não informada'
          : stage.manifestRevision !== undefined && expectedRevision !== stage.manifestRevision
            ? `desatualizada (${expectedRevision} ≠ ${stage.manifestRevision})`
            : String(expectedRevision);
        const detail = document.createElement('small');
        detail.textContent = [
          `papel: ${role}`,
          `resultado: ${localizeValidationStatus(report.result)}`,
          transition?.stageExitId ? `saída: ${transition.stageExitId}` : '',
          transition?.edgeId ? `rota: ${transition.edgeId}` : '',
          transition?.destinationStageId ? `destino: ${transition.destinationStageId}` : '',
          `persistência: ${preserved}`,
          `isolamento: ${isolated}`,
          `recursos: ${resources}`,
          `revisão: ${revision}`,
          report.generatedAt ? `execução: ${report.generatedAt}` : '',
        ].filter(Boolean).join(' · ');
        block.append(title, detail);
        campaignBlock.append(block);
      });
      content.append(campaignBlock);
    }

    if (!validation && !runtime && campaigns.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'wl-validation-empty';
      empty.textContent = 'A validação estática está disponível para fases autorais. Importe um relatório de homologação para adicionar evidência de runtime.';
      content.append(empty);
    } else if (checks.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'wl-validation-empty';
      empty.textContent = 'Nenhuma verificação registrada.';
      content.append(empty);
    } else {
      const list = document.createElement('div');
      list.className = 'wl-validation-list';
      list.dataset.role = 'validation-list';
      checks.forEach(check => {
        const row = document.createElement('button');
        row.type = 'button';
        row.className = `wl-validation-row wl-validation-row--${check.status.toLowerCase()}`;
        row.dataset.validationCheck = check.id;
        row.dataset.validationStatus = check.status;
        if (check.location) row.dataset.validationLocation = `${check.location.x},${check.location.y}`;
        row.classList.toggle('is-selected', check.id === this.session.state().selection.validationCheckId);
        const head = document.createElement('span');
        head.className = 'wl-validation-row-head';
        const status = document.createElement('strong');
        status.textContent = localizeValidationStatus(check.status);
        const code = document.createElement('code');
        code.textContent = check.code;
        head.append(status, code);
        const meta = document.createElement('small');
        meta.textContent = [
          check.regionId ? `${T.labels.region}: ${check.regionId}` : '',
          check.location ? `${check.location.x}, ${check.location.y}` : '',
          localizeEvidence(check.evidence),
          check.status === 'FAIL' ? 'severidade: erro'
            : check.status === 'UNKNOWN' ? 'severidade: aviso' : 'severidade: informação',
          check.required ? '' : 'não bloqueante',
        ].filter(Boolean).join(' · ');
        const message = document.createElement('span');
        message.className = 'wl-validation-row-message';
        message.textContent = check.message;
        row.append(head, meta, message);
        if (check.suggestion) {
          const suggestion = document.createElement('small');
          suggestion.className = 'wl-validation-row-suggestion';
          suggestion.textContent = `${T.labels.suggestion}: ${check.suggestion}`;
          row.append(suggestion);
        }
        row.addEventListener('click', () => {
          this.session.selectValidationCheck(check.id);
          this.render(this.session.state());
        });
        list.append(row);
      });
      content.append(list);
    }
    if (this.stageMode === 'visual' && this.workspace !== 'comparison') {
      const note = document.createElement('p');
      note.className = 'wl-validation-note';
      note.textContent = T.help.validationStructural;
      content.append(note);
    }
    if (this.reportLoader) {
      const refresh = document.createElement('button');
      refresh.type = 'button';
      refresh.className = 'wl-validation-refresh';
      refresh.dataset.role = 'reload-reports';
      refresh.textContent = 'Recarregar relatórios locais';
      refresh.addEventListener('click', () => { void this.loadLocalReports(); });
      content.append(refresh);
    }
    const importLabel = document.createElement('label');
    importLabel.className = 'wl-validation-import';
    importLabel.textContent = T.labels.importRuntime;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.dataset.role = 'import-runtime';
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        const text = String(reader.result ?? '');
        let kind: string | undefined;
        try {
          kind = (JSON.parse(text) as { kind?: string } | null)?.kind;
        } catch {
          kind = undefined;
        }
        const result = kind === 'umbra.campaign-homologation.report'
          ? this.session.importCampaignValidation(text)
          : this.session.importRuntimeValidation(text);
        this.manualReportAt = new Date().toISOString();
        if (!result.ok) this.diagnosticsOpen = true;
        this.render(this.session.state());
      });
      reader.readAsText(file);
    });
    importLabel.append(input);
    content.append(importLabel);
  }

  private renderExplorer(stage: WorldLabStageView | undefined, state: WorldLabSessionState): void {
    const content = this.root.querySelector<HTMLElement>('[data-role="explorer-content"]') as HTMLElement;
    content.replaceChildren();
    if (!stage) { content.textContent = T.empty.stage; return; }
    const entityTitle = document.createElement('h3'); entityTitle.textContent = T.sections.entities;
    const entities = document.createElement('div'); entities.className = 'wl-explorer-list';
    stage.markers.forEach(marker => {
      const button = document.createElement('button'); button.type = 'button'; button.dataset.inspectorMarker = marker.id;
      button.classList.toggle('is-selected', marker.id === this.inspectedMarkerId); button.textContent = `${localizeMarker(marker.kind)} · ${marker.label}`; button.title = button.textContent;
      button.addEventListener('click', () => { this.inspectedMarkerId = marker.id; this.inspectedAssetId = undefined; this.session.selectTile(marker.x, marker.y); }); entities.append(button);
    });
    const assetTitle = document.createElement('h3'); assetTitle.textContent = T.sections.assets;
    const assets = document.createElement('div'); assets.className = 'wl-explorer-list';
    stage.visualPresentation?.artAssets?.forEach(asset => {
      const button = document.createElement('button'); button.type = 'button'; button.dataset.inspectorAsset = asset.id;
      button.classList.toggle('is-selected', asset.id === this.inspectedAssetId); button.textContent = `${T.categories[asset.category]} · ${asset.id}`; button.title = button.textContent;
      button.addEventListener('click', () => { this.inspectedAssetId = asset.id; this.inspectedMarkerId = undefined; this.render(state); }); assets.append(button);
    });
    content.append(entityTitle, entities, assetTitle, assets);
  }

  private renderDiagnostics(diagnostics: readonly WorldLabDiagnostic[], select: (diagnostic: WorldLabDiagnostic) => void): void {
    const counts = { error: 0, warning: 0, info: 0 };
    diagnostics.forEach(item => { counts[item.severity] += 1; });
    this.elements.diagnosticsSummary.textContent = `${counts.error} erros · ${counts.warning} avisos · ${counts.info} informações`;
    (['error', 'warning', 'info'] as const).forEach(severity => {
      const button = this.elements[`filter${severity[0].toUpperCase()}${severity.slice(1)}`];
      button.textContent = `${T.severities[severity]} ${counts[severity]}`; button.classList.toggle('is-active', this.diagnosticFilters.has(severity));
    });
    this.elements.diagnostics.replaceChildren();
    const filtered = diagnostics.filter(item => this.diagnosticFilters.has(item.severity));
    if (filtered.length === 0) { this.elements.diagnostics.textContent = T.empty.diagnostics; return; }
    filtered.forEach(diagnostic => {
      const details = document.createElement('details'); details.className = `wl-diagnostic wl-diagnostic--${diagnostic.severity}`; details.dataset.diagnosticCode = diagnostic.code;
      const summary = document.createElement('summary');
      const message = document.createElement('span'); message.textContent = localizeDiagnosticMessage(diagnostic);
      const context = document.createElement('small');
      context.textContent = diagnostic.evidence
        ? localizeEvidence(diagnostic.evidence)
        : diagnostic.code.startsWith('world-lab.fixture')
          ? T.help.fixture
          : diagnostic.origin === 'stage-catalog' ? T.help.registered : T.help.runtime;
      summary.append(message, context);
      const technical = document.createElement('dl'); technical.className = 'wl-fields';
      appendField(technical, 'Código', diagnostic.code); appendField(technical, 'Origem', localizeDiagnosticOrigin(diagnostic.origin));
      appendField(technical, 'Status', diagnostic.status ? localizeValidationStatus(diagnostic.status) : undefined);
      appendField(technical, 'Evidência', diagnostic.evidence ? localizeEvidence(diagnostic.evidence) : undefined);
      appendField(technical, 'Região', diagnostic.regionId);
      appendField(technical, 'Coordenadas', diagnostic.location ? `${diagnostic.location.x}, ${diagnostic.location.y}` : undefined);
      appendField(technical, 'Check', diagnostic.checkId);
      appendField(technical, 'Mensagem original', diagnostic.message);
      appendField(technical, 'Sugestão', diagnostic.suggestion);
      appendField(technical, 'Referências', [diagnostic.nodeId, diagnostic.edgeId, diagnostic.stageId].filter(Boolean).join(' · '));
      appendField(technical, 'Caminho', diagnostic.path?.join('.'));
      summary.addEventListener('click', () => select(diagnostic));
      details.append(summary, technical); this.elements.diagnostics.append(details);
    });
  }
}
