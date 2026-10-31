/** @jest-environment jsdom */

import {
  createWorldLabCaptureDescriptor,
  createWorldLabPreviewUrl,
  renderPhaserPreview,
} from '../devtools/world-lab/ui/PhaserPreviewView';
import type { WorldLabStageView } from '../devtools/world-lab';

const stage: WorldLabStageView = Object.freeze({
  nodeId: 'node.preview',
  stageId: 'stage.aguas.igapo-das-memorias',
  title: 'Igapó das Memórias',
  theme: 'igapo',
  width: 40,
  height: 24,
  tiles: Object.freeze([]),
  markers: Object.freeze([]),
  physicalExitIds: Object.freeze([]),
  manifestRevision: 3,
  themeRevision: 2,
});

describe('World Lab Phaser preview', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="preview"></div>';
  });

  it('builds a same-origin development URL from the existing stage preview contract', () => {
    const value = new URL(createWorldLabPreviewUrl(
      'http://localhost:5173', stage.stageId, 'variant.aguas.igapo-sombrio',
    ));
    expect(value.origin).toBe('http://localhost:5173');
    expect(value.searchParams.get('stagePreview')).toBe(stage.stageId);
    expect(value.searchParams.get('presentationVariant')).toBe('variant.aguas.igapo-sombrio');
    expect(value.searchParams.get('worldLabEmbed')).toBe('1');
  });

  it('renders two sandboxed frames with equal viewport treatment and an optional inspection grid', () => {
    const root = document.querySelector<HTMLElement>('#preview') as HTMLElement;
    renderPhaserPreview(root, {
      stage,
      variantId: 'variant.aguas.igapo-ribeirinho',
      comparisonVariantId: 'variant.aguas.igapo-sombrio',
      mode: 'compare',
      zoom: 0.75,
      showGrid: true,
      enabled: true,
      origin: 'http://localhost:5173',
    });
    const frames = [...root.querySelectorAll<HTMLIFrameElement>('iframe')];
    expect(frames).toHaveLength(2);
    expect(frames.map(frame => frame.style.transform)).toEqual(['scale(0.75)', 'scale(0.75)']);
    expect(frames.every(frame => frame.getAttribute('sandbox') === 'allow-scripts allow-same-origin')).toBe(true);
    expect(root.querySelector('.wl-phaser-grid')).not.toBeNull();
  });

  it('creates a stable capture descriptor without save or runtime identity', () => {
    expect(createWorldLabCaptureDescriptor(stage, [
      'variant.aguas.igapo-ribeirinho', 'variant.aguas.igapo-sombrio',
    ], 1)).toEqual({
      schema: 'umbra-world-lab-capture/v1',
      stageId: stage.stageId,
      manifestRevision: 3,
      variants: ['variant.aguas.igapo-ribeirinho', 'variant.aguas.igapo-sombrio'],
      viewport: { width: 1280, height: 720 },
      zoom: 1,
      camera: { kind: 'initial', x: 0, y: 0 },
      themeRevision: 2,
    });
  });

  it('does not create an iframe when local preview is disabled', () => {
    const root = document.querySelector<HTMLElement>('#preview') as HTMLElement;
    renderPhaserPreview(root, {
      stage, mode: 'visual', zoom: 1, showGrid: false, enabled: false,
    });
    expect(root.querySelector('iframe')).toBeNull();
    expect(root.textContent).toContain('ambiente local de desenvolvimento');
  });
});
