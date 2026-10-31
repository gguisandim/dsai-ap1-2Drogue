import type { WorldLabStageView } from '../contracts';

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
  readonly enabled: boolean;
  readonly origin?: string;
}

export function createWorldLabPreviewUrl(
  origin: string,
  stageId: string,
  variantId?: string,
): string {
  const base = new URL('/', origin);
  if (base.origin !== new URL(origin).origin) throw new Error('World Lab preview must use the current origin.');
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

function previewFrame(stageId: string, variantId: string | undefined, zoom: number, origin: string) {
  const shell = document.createElement('div');
  shell.className = 'wl-phaser-frame-shell';
  shell.dataset.variant = variantId ?? 'default';
  const frame = document.createElement('iframe');
  frame.className = 'wl-phaser-frame';
  frame.title = `${stageId} · ${variantId ?? 'default'}`;
  frame.src = createWorldLabPreviewUrl(origin, stageId, variantId);
  frame.setAttribute('sandbox', 'allow-scripts allow-same-origin');
  frame.referrerPolicy = 'no-referrer';
  frame.style.transform = `scale(${zoom})`;
  const label = document.createElement('span');
  label.className = 'wl-phaser-label';
  label.textContent = variantId ?? 'default';
  shell.append(frame, label);
  return shell;
}

export function renderPhaserPreview(container: HTMLElement, options: PhaserPreviewOptions): void {
  container.replaceChildren();
  if (!options.enabled) {
    const message = document.createElement('div');
    message.className = 'wl-empty';
    message.textContent = 'A prévia Phaser incorporada está disponível apenas no ambiente local de desenvolvimento.';
    container.append(message);
    return;
  }
  const origin = options.origin ?? globalThis.location.origin;
  const preview = document.createElement('div');
  preview.className = `wl-phaser-preview wl-phaser-preview--${options.mode}`;
  preview.dataset.stageId = options.stage.stageId;
  preview.dataset.zoom = String(options.zoom);
  preview.append(previewFrame(options.stage.stageId, options.variantId, options.zoom, origin));
  if (options.mode === 'compare') {
    preview.append(previewFrame(
      options.stage.stageId,
      options.comparisonVariantId,
      options.zoom,
      origin,
    ));
  }
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
