import type { WorldLabDocument, WorldLabSelection } from '../contracts';
import { installSvgPanZoom, svgElement } from './svgInteraction';

export interface CampaignGraphCallbacks {
  readonly selectNode: (nodeId: string) => void;
  readonly selectEdge: (edgeId: string) => void;
}

interface Point { readonly x: number; readonly y: number }

function position(depth: number, branchId: string): Point {
  const row = branchId === 'route-a' ? 92 : branchId === 'route-b' ? 268 : 180;
  return { x: 76 + depth * 150, y: row };
}

function ancestorEdges(document: WorldLabDocument, nodeId?: string): ReadonlySet<string> {
  if (!nodeId) return new Set();
  const result = new Set<string>();
  const queue = [nodeId];
  const visited = new Set(queue);
  while (queue.length > 0) {
    const current = queue.shift() as string;
    document.edges.filter(edge => edge.targetNodeId === current).forEach(edge => {
      result.add(edge.id);
      if (!visited.has(edge.sourceNodeId)) {
        visited.add(edge.sourceNodeId);
        queue.push(edge.sourceNodeId);
      }
    });
  }
  return result;
}

export function renderCampaignGraph(
  container: HTMLElement,
  document: WorldLabDocument,
  selection: WorldLabSelection,
  callbacks: CampaignGraphCallbacks,
): void {
  container.replaceChildren();
  const svg = svgElement('svg', {
    class: 'wl-graph-svg', role: 'img', 'aria-label': 'Campaign graph',
  });
  const nodePositions = new Map(document.nodes.map(node => [node.id, position(node.depth, node.branchId)]));
  const complete = { x: 76 + 9 * 150, y: 180 };
  const path = ancestorEdges(document, selection.nodeId);

  document.edges.forEach(edge => {
    const source = nodePositions.get(edge.sourceNodeId);
    const target = edge.targetNodeId === 'campaign.complete'
      ? complete : nodePositions.get(edge.targetNodeId);
    if (!source || !target) return;
    const selected = selection.edgeId === edge.id;
    const line = svgElement('path', {
      d: `M ${source.x + 49} ${source.y} C ${source.x + 86} ${source.y}, ${target.x - 86} ${target.y}, ${target.x - 49} ${target.y}`,
      class: `wl-edge wl-edge--${edge.bindingStatus}${selected ? ' is-selected' : ''}${path.has(edge.id) ? ' is-path' : ''}`,
      'data-edge-id': edge.id,
      'data-selectable': 'true',
      tabindex: '0',
    });
    line.addEventListener('click', event => {
      event.stopPropagation();
      callbacks.selectEdge(edge.id);
    });
    line.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') callbacks.selectEdge(edge.id);
    });
    const title = svgElement('title');
    title.textContent = `${edge.id}\n${edge.sourceNodeId} → ${edge.targetNodeId}\n${edge.bindingStatus}`;
    line.append(title);
    svg.append(line);
  });

  document.nodes.forEach(node => {
    const point = nodePositions.get(node.id) as Point;
    const group = svgElement('g', {
      class: `wl-node${selection.nodeId === node.id ? ' is-selected' : ''}`,
      transform: `translate(${point.x - 49} ${point.y - 31})`,
      'data-node-id': node.id,
      'data-selectable': 'true',
      tabindex: '0',
    });
    const body = svgElement('rect', {
      width: 98, height: 62, rx: 7,
      style: node.presentation ? `--node-accent:${node.presentation.accent};--node-surface:${node.presentation.surface}` : '',
    });
    const depth = svgElement('text', { x: 10, y: 18, class: 'wl-node-depth' });
    depth.textContent = `D${node.depth} · ${node.actId.toUpperCase()}`;
    const label = svgElement('text', { x: 10, y: 37, class: 'wl-node-label' });
    label.textContent = node.presentation?.label ?? node.stageId;
    const id = svgElement('text', { x: 10, y: 53, class: 'wl-node-id' });
    id.textContent = node.branchId;
    group.append(body, depth, label, id);
    if (node.entry || node.kind === 'milestone') {
      const badge = svgElement('circle', {
        cx: 88, cy: 10, r: 5, class: node.entry ? 'wl-badge-entry' : 'wl-badge-milestone',
      });
      group.append(badge);
    }
    group.addEventListener('click', event => {
      event.stopPropagation();
      callbacks.selectNode(node.id);
    });
    group.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') callbacks.selectNode(node.id);
    });
    svg.append(group);
  });

  const completion = svgElement('g', { transform: `translate(${complete.x - 32} ${complete.y - 22})` });
  completion.append(svgElement('rect', { width: 64, height: 44, rx: 22, class: 'wl-completion' }));
  const completionLabel = svgElement('text', { x: 32, y: 27, 'text-anchor': 'middle', class: 'wl-completion-label' });
  completionLabel.textContent = 'END';
  completion.append(completionLabel);
  svg.append(completion);
  installSvgPanZoom(svg, { x: 0, y: 0, width: 1500, height: 360 });
  container.append(svg);
}

