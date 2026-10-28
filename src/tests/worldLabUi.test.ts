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
    expect(session.state().filters).toEqual({ showGrid: false, showOverlays: false });
    expect(document.querySelectorAll('.wl-marker')).toHaveLength(0);
  });
});

