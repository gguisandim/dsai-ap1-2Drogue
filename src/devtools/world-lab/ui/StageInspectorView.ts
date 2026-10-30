import type { WorldLabSelection, WorldLabStageMarker, WorldLabStageView } from '../contracts';
import { installSvgPanZoom, svgElement } from './svgInteraction';

export interface StageInspectorCallbacks {
  readonly selectTile: (x: number, y: number) => void;
  readonly selectPhysicalExit: (physicalExitId: string) => void;
}

const TILE_COLORS: Readonly<Record<number, string>> = Object.freeze({
  0: '#263849', 1: '#0c1520', 2: '#44515f', 3: '#174f68', 4: '#8f2e1f',
  5: '#1f9d74', 6: '#80662b', 7: '#8a5a24', 8: '#1e8f63', 9: '#7e2b4d',
});

const MARKER_LABEL: Readonly<Record<WorldLabStageMarker['kind'], string>> = Object.freeze({
  spawn: 'S', enemy: 'E', boss: 'B', item: 'I', npc: 'N', anchor: 'A',
  'section-exit': '↗', 'physical-exit': 'X', decoration: 'D',
});

function markerClass(marker: WorldLabStageMarker): string {
  return `wl-marker wl-marker--${marker.kind}`;
}

export function renderStageInspector(
  container: HTMLElement,
  stage: WorldLabStageView | undefined,
  selection: WorldLabSelection,
  showGrid: boolean,
  showOverlays: boolean,
  callbacks: StageInspectorCallbacks,
): void {
  container.replaceChildren();
  if (!stage) {
    const empty = document.createElement('div');
    empty.className = 'wl-empty';
    empty.textContent = 'Stage data unavailable for the selected node.';
    container.append(empty);
    return;
  }
  const size = 22;
  if (stage.visualPresentation) {
    const visual = document.createElement('div');
    visual.className = 'wl-stage-visual-meta';
    visual.textContent = [
      `Tema: ${stage.visualPresentation.themeId}`,
      `Tileset: ${stage.visualPresentation.tilesetId}`,
      `Recursos: ${stage.visualPresentation.textureKeys.join(', ') || 'nenhum'}`,
      `Decorações: ${stage.visualPresentation.decorationIds.join(', ') || 'nenhuma'}`,
      `Ausentes: ${stage.visualPresentation.missingResourceIds.join(', ') || 'nenhum'}`,
      `Diagnósticos: ${stage.visualPresentation.diagnostics.join(', ') || 'nenhum'}`,
      `NPCs: ${stage.visualPresentation.npcSprites?.map(item => `${item.logicalId}→${item.spriteId}`).join(', ') || 'fallback'}`,
      `Inimigos: ${stage.visualPresentation.enemySprites?.map(item => `${item.logicalId}→${item.spriteId}`).join(', ') || 'fallback'}`,
      `Áudio: ${stage.visualPresentation.audio?.profileId ?? 'silêncio legado'}`,
      `Ambiente: ${stage.visualPresentation.environment
        ? `${stage.visualPresentation.environment.id}, luz ${stage.visualPresentation.environment.lightIntensity}, névoa ${stage.visualPresentation.environment.fog?.opacity ?? 0}`
        : 'legado'}`,
    ].join(' · ');
    container.append(visual);
  }
  const svg = svgElement('svg', {
    class: 'wl-stage-svg', role: 'img', 'aria-label': `Stage map ${stage.stageId}`,
  });
  stage.tiles.forEach((row, y) => row.forEach((tile, x) => {
    const rect = svgElement('rect', {
      x: x * size,
      y: y * size,
      width: size,
      height: size,
      fill: TILE_COLORS[tile] ?? '#5b2434',
      class: `wl-tile${showGrid ? ' has-grid' : ''}${selection.tile?.x === x && selection.tile.y === y ? ' is-selected' : ''}`,
      'data-tile': `${x},${y}`,
      'data-selectable': 'true',
    });
    const title = svgElement('title');
    title.textContent = `(${x}, ${y}) · tile ${tile}`;
    rect.append(title);
    rect.addEventListener('click', event => {
      event.stopPropagation();
      callbacks.selectTile(x, y);
    });
    svg.append(rect);
  }));
  if (showOverlays) stage.markers.forEach(marker => {
    const group = svgElement('g', {
      transform: `translate(${marker.x * size + size / 2} ${marker.y * size + size / 2})`,
      class: markerClass(marker),
      'data-marker-id': marker.id,
      'data-selectable': marker.physicalExitId ? 'true' : 'false',
    });
    group.append(svgElement('circle', { r: marker.kind === 'physical-exit' ? 9 : 7 }));
    const label = svgElement('text', { 'text-anchor': 'middle', y: 3.5 });
    label.textContent = MARKER_LABEL[marker.kind];
    const title = svgElement('title');
    title.textContent = `${marker.kind}: ${marker.label} (${marker.x}, ${marker.y})`;
    group.append(label, title);
    if (marker.physicalExitId) {
      group.setAttribute('tabindex', '0');
      const select = (): void => callbacks.selectPhysicalExit(marker.physicalExitId as string);
      group.addEventListener('click', event => { event.stopPropagation(); select(); });
      group.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') select();
      });
    }
    svg.append(group);
  });
  installSvgPanZoom(svg, {
    x: 0, y: 0, width: stage.width * size, height: stage.height * size,
  });
  container.append(svg);
}

