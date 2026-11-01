import type { WorldLabSelection, WorldLabStageMarker, WorldLabStageView } from '../contracts';
import { installSvgPanZoom, svgElement } from './svgInteraction';
import {
  WORLD_LAB_PT_BR,
  localizeArtWarning,
  localizeMarker,
  localizeStatus,
} from './WorldLabPtBr';

export interface StageInspectorCallbacks {
  readonly selectTile: (x: number, y: number) => void;
  readonly selectPhysicalExit: (physicalExitId: string) => void;
}

export interface StageInspectorLayers {
  readonly entities?: boolean;
  readonly decorations?: boolean;
  readonly exits?: boolean;
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
  layers: StageInspectorLayers = {},
): void {
  container.replaceChildren();
  if (!stage) {
    const empty = document.createElement('div');
    empty.className = 'wl-empty';
    empty.textContent = WORLD_LAB_PT_BR.empty.stage;
    container.append(empty);
    return;
  }
  const size = 22;
  if (stage.visualPresentation) {
    const visual = document.createElement('div');
    visual.className = 'wl-stage-visual-meta';
    const tiles = stage.visualPresentation.tiles ?? [];
    const spritesheets = stage.visualPresentation.spritesheets ?? [];
    const origins = stage.visualPresentation.assetOrigins ?? [];
    const decorations = stage.visualPresentation.decorations ?? [];
    const artAssets = stage.visualPresentation.artAssets ?? [];
    visual.textContent = [
      `Tema: ${stage.visualPresentation.themeId}`,
      `Variante: ${stage.visualPresentation.variantId ?? WORLD_LAB_PT_BR.labels.defaultVariant}`,
      `Tileset: ${stage.visualPresentation.tilesetId}`,
      `Recursos: ${stage.visualPresentation.textureKeys.join(', ') || 'nenhum'}`,
      `Tiles lógicos: ${tiles.map(tile => `${tile.logicalId}→${tile.textureKey}`
        + `${tile.frame !== undefined ? `#${tile.frame}` : ''}`).join(', ') || 'nenhum'}`,
      `Folhas de sprites: ${spritesheets.map(sheet => `${sheet.textureKey}`
        + `${sheet.frameWidth && sheet.frameHeight ? ` ${sheet.frameWidth}x${sheet.frameHeight}` : ''}`
        + `${sheet.frameCount !== undefined ? ` (${sheet.frameCount} frames)` : ''}`).join(', ') || 'nenhum'}`,
      `Decorações: ${decorations.map(decoration => `${decoration.id}→${decoration.textureKey}`
        + `${decoration.frame !== undefined ? `#${decoration.frame}` : ''}`).join(', ') || 'nenhuma'}`,
      `Substituições: ${Object.entries(stage.visualPresentation.decorationOverrides ?? {})
        .map(([from, to]) => `${from}→${to}`).join(', ') || 'nenhum'}`,
      `Origem: ${origins.map(origin => `${origin.assetId} (${origin.pack}, ${origin.license})`).join(', ') || 'legado'}`,
      `Escala artística: ${artAssets.map(asset => {
        const source = asset.sourceDimensions ? `${asset.sourceDimensions.width}×${asset.sourceDimensions.height}` : '?';
        const frame = asset.frameDimensions ? `${asset.frameDimensions.width}×${asset.frameDimensions.height}` : '?';
        const rendered = asset.renderedDimensions
          ? `${Math.round(asset.renderedDimensions.width)}×${Math.round(asset.renderedDimensions.height)}` : '?';
        const anchor = asset.anchor ? `${asset.anchor.x},${asset.anchor.y}` : WORLD_LAB_PT_BR.labels.defaultVariant;
        return `${WORLD_LAB_PT_BR.categories[asset.category]}:${asset.id} ${asset.textureKey}${asset.frame !== undefined ? `#${asset.frame}` : ''}`
          + ` fonte ${source} frame ${frame} mundo ${rendered} escala ${asset.scale} âncora ${anchor}`
          + ` camada ${asset.layer} [${localizeStatus(asset.compatibility)}]${asset.warnings.length ? ` ⚠ ${asset.warnings.map(localizeArtWarning).join(',')}` : ''}`;
      }).join(' · ') || 'metadados indisponíveis'}`,
      `Ausentes: ${stage.visualPresentation.missingResourceIds.join(', ') || 'nenhum'}`,
      `Diagnósticos: ${stage.visualPresentation.diagnostics.join(', ') || 'nenhum'}`,
      `NPCs: ${stage.visualPresentation.npcSprites?.map(item => `${item.logicalId}→${item.spriteId}`
        + `${item.frame !== undefined ? `#${item.frame}` : ''}`).join(', ') || WORLD_LAB_PT_BR.labels.fallback}`,
      `Inimigos: ${stage.visualPresentation.enemySprites?.map(item => `${item.logicalId}→${item.spriteId}`
        + `${item.frame !== undefined ? `#${item.frame}` : ''}`).join(', ') || WORLD_LAB_PT_BR.labels.fallback}`,
      `Animações NPC/inimigos: ${[
        ...(stage.visualPresentation.npcSprites ?? []),
        ...(stage.visualPresentation.enemySprites ?? []),
      ].flatMap(item => item.animations).join(', ') || 'nenhuma'}`,
      `VFX: ${stage.visualPresentation.effects?.map(effect => `${effect.kind}:${effect.id}`
        + `${effect.count !== undefined ? `×${effect.count}` : ''}`).join(', ') || 'nenhum'}`,
      `Áudio: ${stage.visualPresentation.audio?.profileId ?? 'silêncio legado'}`,
      `Ambiente: ${stage.visualPresentation.environment
        ? `${stage.visualPresentation.environment.id}, luz ${stage.visualPresentation.environment.lightIntensity}, névoa ${stage.visualPresentation.environment.fog?.opacity ?? 0}`
        : 'legado'}`,
    ].join(' · ');
    container.append(visual);
  }
  const svg = svgElement('svg', {
    class: 'wl-stage-svg', role: 'img', 'aria-label': `Mapa da fase ${stage.stageId}`,
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
  const markerVisible = (marker: WorldLabStageMarker): boolean => {
    if (marker.kind === 'decoration') return layers.decorations ?? true;
    if (['anchor', 'section-exit', 'physical-exit'].includes(marker.kind)) return layers.exits ?? true;
    return layers.entities ?? true;
  };
  if (showOverlays) stage.markers.filter(markerVisible).forEach(marker => {
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
    title.textContent = `${localizeMarker(marker.kind)}: ${marker.label} (${marker.x}, ${marker.y})`;
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

