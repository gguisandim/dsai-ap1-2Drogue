import type { WorldLabStageView } from '../contracts';
import type { WorldLabPreviewBridge, WorldLabPreviewCommand } from '../WorldLabPreviewBridge';
import { WORLD_LAB_PT_BR, localizeMarker } from './WorldLabPtBr';

export type WorldLabStageMode = 'structural' | 'visual' | 'compare';

export interface WorldLabCaptureDescriptor {
  readonly schema: 'umbra-world-lab-capture/v1';
  readonly stageId: string;
  readonly manifestRevision?: number;
  readonly variants: readonly string[];
  readonly viewport: { readonly width: number; readonly height: number };
  readonly zoom: number;
  readonly camera: { readonly kind: 'initial'; readonly x: 0; readonly y: 0 };
  readonly themeRevision?: number;
}

export interface PhaserPreviewOptions {
  readonly stage: WorldLabStageView;
  readonly variantId?: string;
  readonly comparisonVariantId?: string;
  readonly mode: Exclude<WorldLabStageMode, 'structural'>;
  readonly zoom: number;
  readonly showGrid: boolean;
  readonly showHud: boolean;
  readonly enabled: boolean;
  readonly origin?: string;
}

export function createWorldLabPreviewUrl(
  origin: string,
  stageId: string,
  variantId?: string,
): string {
  const base = new URL('/', origin);
  if (base.origin !== new URL(origin).origin) throw new Error('A prévia do World Lab deve usar a origem atual.');
  base.searchParams.set('stagePreview', stageId);
  if (variantId) base.searchParams.set('presentationVariant', variantId);
  base.searchParams.set('worldLabEmbed', '1');
  return base.toString();
}

export function createWorldLabCaptureDescriptor(
  stage: WorldLabStageView,
  variants: readonly (string | undefined)[],
  zoom: number,
  viewport = { width: 1280, height: 720 },
): WorldLabCaptureDescriptor {
  return Object.freeze({
    schema: 'umbra-world-lab-capture/v1' as const,
    stageId: stage.stageId,
    ...(stage.manifestRevision !== undefined ? { manifestRevision: stage.manifestRevision } : {}),
    variants: Object.freeze(variants.map(variant => variant ?? 'default')),
    viewport: Object.freeze({ ...viewport }),
    zoom,
    camera: Object.freeze({ kind: 'initial' as const, x: 0 as const, y: 0 as const }),
    ...(stage.themeRevision !== undefined ? { themeRevision: stage.themeRevision } : {}),
  });
}

type PreviewWindow = Window & { __UMBRA_WORLD_LAB_PREVIEW__?: WorldLabPreviewBridge };

function previewFrame(
  stageId: string,
  variantId: string | undefined,
  zoom: number,
  showHud: boolean,
  origin: string,
) {
  const shell = document.createElement('div');
  shell.className = 'wl-phaser-frame-shell';
  shell.dataset.variant = variantId ?? 'default';
  const frame = document.createElement('iframe');
  frame.className = 'wl-phaser-frame';
  frame.title = `${stageId} · ${variantId ?? WORLD_LAB_PT_BR.labels.defaultVariant}`;
  frame.src = createWorldLabPreviewUrl(origin, stageId, variantId);
  frame.setAttribute('sandbox', 'allow-scripts allow-same-origin');
  frame.referrerPolicy = 'no-referrer';
  frame.addEventListener('load', () => {
    let attempts = 0;
    const applyWhenReady = (): void => {
      try {
        const bridge = (frame.contentWindow as PreviewWindow | null)?.__UMBRA_WORLD_LAB_PREVIEW__;
        const applied = bridge?.apply({ type: 'gameplay', zoom, hud: showHud });
        if (applied) return;
      } catch {
        // Same-origin access is intentionally best-effort until the preview bridge loads.
      }
      attempts += 1;
      if (attempts < 50 && frame.isConnected) globalThis.setTimeout(applyWhenReady, 100);
    };
    applyWhenReady();
  });
  const label = document.createElement('span');
  label.className = 'wl-phaser-label';
  label.textContent = variantId ?? WORLD_LAB_PT_BR.labels.defaultVariant;
  label.title = label.textContent;
  shell.append(frame, label);
  return shell;
}

function applyCommand(container: HTMLElement, command: WorldLabPreviewCommand): boolean {
  let applied = false;
  container.querySelectorAll<HTMLIFrameElement>('iframe.wl-phaser-frame').forEach(frame => {
    try {
      const bridge = (frame.contentWindow as PreviewWindow | null)?.__UMBRA_WORLD_LAB_PREVIEW__;
      applied = bridge?.apply(command) === true || applied;
    } catch {
      // Sandboxed previews without same-origin access remain visible but uncontrollable.
    }
  });
  return applied;
}

function previewControls(
  container: HTMLElement,
  options: PhaserPreviewOptions,
): HTMLElement {
  const controls = document.createElement('div');
  controls.className = 'wl-phaser-controls';
  const button = (label: string, command: WorldLabPreviewCommand, role: string): HTMLButtonElement => {
    const value = document.createElement('button');
    value.type = 'button';
    value.textContent = label;
    value.dataset.previewCommand = role;
    value.addEventListener('click', () => applyCommand(container, command));
    return value;
  };
  controls.append(
    button('Ajustar mapa', { type: 'fit-map', hud: options.showHud }, 'fit-map'),
    button('Jogador', {
      type: 'gameplay', zoom: options.zoom, hud: options.showHud,
    }, 'gameplay'),
    button('←', { type: 'pan', x: -192, y: 0, hud: options.showHud }, 'pan-left'),
    button('→', { type: 'pan', x: 192, y: 0, hud: options.showHud }, 'pan-right'),
    button('↑', { type: 'pan', x: 0, y: -144, hud: options.showHud }, 'pan-up'),
    button('↓', { type: 'pan', x: 0, y: 144, hud: options.showHud }, 'pan-down'),
  );

  const focus = document.createElement('select');
  focus.dataset.previewFocus = 'marker';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Centralizar em…';
  focus.append(placeholder);
  options.stage.markers
    .filter(marker => ['spawn', 'npc', 'anchor', 'physical-exit', 'section-exit'].includes(marker.kind))
    .forEach(marker => {
      const item = document.createElement('option');
      item.value = marker.id;
      item.textContent = `${localizeMarker(marker.kind)} · ${marker.label}`;
      item.dataset.x = String(marker.x);
      item.dataset.y = String(marker.y);
      focus.append(item);
    });
  focus.addEventListener('change', () => {
    const selected = focus.selectedOptions[0];
    if (!selected?.value) return;
    applyCommand(container, {
      type: 'focus-tile',
      x: Number(selected.dataset.x),
      y: Number(selected.dataset.y),
      zoom: options.zoom,
      hud: options.showHud,
    });
  });
  controls.append(focus);
  return controls;
}

export function renderPhaserPreview(container: HTMLElement, options: PhaserPreviewOptions): void {
  container.replaceChildren();
  if (!options.enabled) {
    const message = document.createElement('div');
    message.className = 'wl-empty';
    message.textContent = WORLD_LAB_PT_BR.empty.previewLocal;
    container.append(message);
    return;
  }
  const origin = options.origin ?? globalThis.location.origin;
  const preview = document.createElement('div');
  preview.className = `wl-phaser-preview wl-phaser-preview--${options.mode}`;
  preview.dataset.stageId = options.stage.stageId;
  preview.dataset.zoom = String(options.zoom);
  preview.append(previewFrame(
    options.stage.stageId, options.variantId, options.zoom, options.showHud, origin,
  ));
  if (options.mode === 'compare') {
    preview.append(previewFrame(
      options.stage.stageId,
      options.comparisonVariantId,
      options.zoom,
      options.showHud,
      origin,
    ));
  }
  preview.append(previewControls(preview, options));
  if (options.showGrid) {
    const grid = document.createElement('div');
    grid.className = 'wl-phaser-grid';
    grid.setAttribute('aria-hidden', 'true');
    preview.append(grid);
  }
  container.append(preview);
}

function download(name: string, href: string): void {
  const link = document.createElement('a');
  link.download = name;
  link.href = href;
  link.click();
}

/** Downloads real iframe canvases plus the descriptor. Returns false until every preview has loaded. */
export function downloadWorldLabCapture(
  container: HTMLElement,
  descriptor: WorldLabCaptureDescriptor,
): boolean {
  const frames = [...container.querySelectorAll<HTMLIFrameElement>('iframe.wl-phaser-frame')];
  const canvases = frames.map(frame => frame.contentDocument?.querySelector<HTMLCanvasElement>('canvas'));
  if (frames.length === 0 || canvases.some(canvas => !canvas)) return false;
  canvases.forEach((canvas, index) => {
    download(`${descriptor.stageId}-${descriptor.variants[index]}.png`, (canvas as HTMLCanvasElement).toDataURL('image/png'));
  });
  const json = JSON.stringify(descriptor, null, 2);
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  download(`${descriptor.stageId}-capture.json`, url);
  URL.revokeObjectURL(url);
  return true;
}
