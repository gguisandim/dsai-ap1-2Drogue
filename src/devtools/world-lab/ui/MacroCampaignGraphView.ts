import type {
  WorldLabMacroEdgeView,
  WorldLabMacroNodeView,
  WorldLabMacroRouteView,
} from '../contracts';
import { installSvgPanZoom, svgElement } from './svgInteraction';

export interface MacroCampaignSelection {
  readonly nodeId?: string;
  readonly edgeId?: string;
}

export interface MacroCampaignGraphCallbacks {
  readonly selectNode: (nodeId: string) => void;
  readonly selectEdge: (edgeId: string) => void;
}

interface Point { readonly x: number; readonly y: number }

const WIDTH = 150;
const HEIGHT = 68;

function routeOrder(nodes: readonly WorldLabMacroNodeView[]): readonly string[] {
  return [...new Set(nodes.filter(node => node.layer === 1 && node.routeId)
    .map(node => node.routeId as string))].sort();
}

function positions(view: WorldLabMacroRouteView): ReadonlyMap<string, Point> {
  const result = new Map<string, Point>();
  const hub = view.nodes.find(node => node.kind === 'hub');
  if (hub) result.set(hub.id, { x: 135, y: 320 });
  const routes = routeOrder(view.nodes);
  routes.forEach((routeId, routeIndex) => {
    const row = view.nodes.filter(node => node.routeId === routeId && node.layer === 1)
      .sort((left, right) => (left.order ?? 0) - (right.order ?? 0));
    row.forEach((node, index) => result.set(node.id, { x: 375 + index * 205, y: 105 + routeIndex * 215 }));
  });
  view.nodes.filter(node => node.layer === 2)
    .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
    .forEach((node, index) => result.set(node.id, { x: 300 + index * 205, y: 735 }));
  const final = view.nodes.find(node => node.kind === 'final');
  if (final) result.set(final.id, { x: 1300, y: 320 });
  return result;
}

function pathFor(edge: WorldLabMacroEdgeView, source: Point, target: Point): string {
  if (edge.kind === 'return') {
    const lift = source.y < target.y ? -70 : 70;
    return `M ${source.x} ${source.y + HEIGHT / 2} C ${source.x - 90} ${source.y + lift}, ${target.x + 120} ${target.y + lift}, ${target.x + WIDTH / 2} ${target.y}`;
  }
  return `M ${source.x + WIDTH / 2} ${source.y} C ${source.x + 120} ${source.y}, ${target.x - 120} ${target.y}, ${target.x - WIDTH / 2} ${target.y}`;
}

function nodeSubtitle(node: WorldLabMacroNodeView): string {
  if (node.contentState === 'planned') return 'MAPA PLANEJADO';
  if (node.kind === 'milestone') return 'MARCO NARRATIVO';
  if (node.legacyPlaceholder) return 'STAGE LEGADO · PLACEHOLDER';
  return node.stageId ? `STAGE · ${node.stageId}` : node.kind.toUpperCase();
}

function layerLabel(svg: SVGSVGElement, text: string, x: number, y: number): void {
  const label = svgElement('text', { x, y, class: 'wl-macro-layer-label' });
  label.textContent = text;
  svg.append(label);
}

export function renderMacroCampaignGraph(
  container: HTMLElement,
  view: WorldLabMacroRouteView,
  selection: MacroCampaignSelection,
  callbacks: MacroCampaignGraphCallbacks,
): void {
  container.replaceChildren();
  const svg = svgElement('svg', {
    class: 'wl-graph-svg wl-macro-svg', role: 'img',
    'aria-label': 'Campanha macro por rotas independentes',
  });
  const pointById = positions(view);
  layerLabel(svg, 'CAMADA 1 · HISTÓRIAS INDEPENDENTES', 300, 28);
  layerLabel(svg, 'CAMADA 0 · HUB', 60, 235);
  layerLabel(svg, 'CAMADA 3 · FINAL', 1220, 235);
  layerLabel(svg, 'CAMADA 2 · REGIÕES CORROMPIDAS', 260, 650);

  view.edges.forEach(edge => {
    const source = pointById.get(edge.sourceNodeId);
    const target = pointById.get(edge.targetNodeId);
    if (!source || !target) return;
    const selected = selection.edgeId === edge.id;
    const line = svgElement('path', {
      d: pathFor(edge, source, target),
      class: `wl-macro-edge wl-macro-edge--${edge.kind} wl-macro-edge--${edge.state}${selected ? ' is-selected' : ''}`,
      'data-macro-edge-id': edge.id,
      'data-selectable': 'true',
      tabindex: '0',
    });
    const title = svgElement('title');
    title.textContent = `${edge.sourceNodeId} → ${edge.targetNodeId}\n${edge.kind} · ${edge.state}`;
    line.append(title);
    const select = (): void => callbacks.selectEdge(edge.id);
    line.addEventListener('click', event => { event.stopPropagation(); select(); });
    line.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') select();
    });
    svg.append(line);
  });

  view.nodes.forEach(node => {
    const point = pointById.get(node.id);
    if (!point) return;
    const group = svgElement('g', {
      class: `wl-macro-node wl-macro-node--${node.kind} wl-macro-node--${node.progressState} wl-macro-node--content-${node.contentState}${selection.nodeId === node.id ? ' is-selected' : ''}`,
      transform: `translate(${point.x - WIDTH / 2} ${point.y - HEIGHT / 2})`,
      'data-macro-node-id': node.id,
      'data-progress-state': node.progressState,
      'data-content-state': node.contentState,
      'data-selectable': 'true',
      tabindex: '0',
    });
    group.append(svgElement('rect', { width: WIDTH, height: HEIGHT, rx: node.kind === 'milestone' ? 20 : 7 }));
    const status = svgElement('text', { x: 11, y: 17, class: 'wl-macro-node-status' });
    status.textContent = `${node.progressState.toUpperCase()} · L${node.layer}`;
    const title = svgElement('text', { x: 11, y: 38, class: 'wl-macro-node-title' });
    title.textContent = node.title;
    const subtitle = svgElement('text', { x: 11, y: 56, class: 'wl-macro-node-subtitle' });
    subtitle.textContent = nodeSubtitle(node);
    group.append(status, title, subtitle);
    const tooltip = svgElement('title');
    tooltip.textContent = `${node.title}\n${node.id}\n${node.progressState} · ${node.contentState}`;
    group.append(tooltip);
    const select = (): void => callbacks.selectNode(node.id);
    group.addEventListener('click', event => { event.stopPropagation(); select(); });
    group.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') select();
    });
    svg.append(group);
  });

  installSvgPanZoom(svg, { x: 0, y: 0, width: 1480, height: 830 });
  container.append(svg);
}
