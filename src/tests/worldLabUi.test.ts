/** @jest-environment jsdom */

import {
  WorldLabDataService,
  WorldLabSession,
  type WorldLabDocument,
  type WorldLabGenerationResult,
} from '../devtools/world-lab';
import { WorldLabApp } from '../devtools/world-lab/ui/WorldLabApp';

describe('Umbra World Lab UI', () => {
  let documentModel: WorldLabDocument;

  beforeAll(() => {
    const generated = new WorldLabDataService().generate('world-lab-ui-seed');
    if (!generated.ok) throw generated.error;
    documentModel = generated.value;
  });

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
  });

  function mount(): WorldLabSession {
    const result: WorldLabGenerationResult = { ok: true, value: documentModel };
    const session = new WorldLabSession({ generate: () => result }, undefined, documentModel.seed);
    const root = document.querySelector<HTMLElement>('#root') as HTMLElement;
    new WorldLabApp(root, session).start();
    return session;
  }

  it('renders graph nodes, real stage tiles, diagnostics and inspector metadata', () => {
    const session = mount();
    const state = session.state();

    expect(document.querySelectorAll('[data-node-id]')).toHaveLength(documentModel.nodes.length);
    expect(document.querySelectorAll('[data-tile]').length).toBeGreaterThan(0);
    expect(document.querySelectorAll('[data-diagnostic-code]').length).toBeGreaterThan(0);
    expect(document.body.textContent).toContain(state.document?.nodes[0].stageId);
    expect(document.body.textContent).toContain('Fixture · real headless pipeline');
  });

  it('synchronizes physical exit clicks with graph selection and inspector', () => {
    const session = mount();
    const marker = document.querySelector<SVGGElement>('[data-marker-id][data-selectable="true"]');
    expect(marker).not.toBeNull();

    marker?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const edgeId = session.state().selection.edgeId;
    expect(edgeId).toBeDefined();
    expect(document.querySelector(`[data-edge-id="${edgeId}"]`)?.classList.contains('is-selected')).toBe(true);
    expect(document.body.textContent).toContain('physicalExitId');
  });

  it('toggles grid and overlays without changing the generated document', () => {
    const session = mount();
    const before = session.state().document;
    const grid = document.querySelector<HTMLInputElement>('[data-role="grid"]') as HTMLInputElement;
    const overlays = document.querySelector<HTMLInputElement>('[data-role="overlays"]') as HTMLInputElement;

    grid.click();
    overlays.click();

    expect(session.state().document).toBe(before);
    expect(session.state().filters).toEqual({
      showGrid: false,
      showOverlays: false,
      showEntities: true,
      showDecorations: true,
      showExits: true,
    });
    expect(document.querySelectorAll('.wl-marker')).toHaveLength(0);
  });

  it('switches between structural, Phaser visual and equivalent comparison previews', () => {
    mount();
    const mode = document.querySelector<HTMLSelectElement>('[data-role="stage-mode"]') as HTMLSelectElement;
    mode.value = 'visual';
    mode.dispatchEvent(new Event('change', { bubbles: true }));
    expect(document.querySelectorAll('iframe.wl-phaser-frame')).toHaveLength(1);
    expect(document.querySelector('iframe')?.getAttribute('sandbox')).toBe('allow-scripts allow-same-origin');

    mode.value = 'compare';
    mode.dispatchEvent(new Event('change', { bubbles: true }));
    const frames = [...document.querySelectorAll<HTMLIFrameElement>('iframe.wl-phaser-frame')];
    expect(frames).toHaveLength(2);
    expect(frames[0].style.transform).toBe(frames[1].style.transform);
    expect(new URL(frames[0].src).searchParams.get('stagePreview')).toBe(
      documentModel.stages.find(stage => stage.nodeId === documentModel.nodes[0].id)?.stageId,
    );
  });
});

