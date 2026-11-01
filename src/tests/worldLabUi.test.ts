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
    window.history.replaceState({}, '', '/');
  });

  function mount(): WorldLabSession {
    const result: WorldLabGenerationResult = { ok: true, value: documentModel };
    const session = new WorldLabSession({ generate: () => result }, undefined, documentModel.seed);
    const root = document.querySelector<HTMLElement>('#root') as HTMLElement;
    new WorldLabApp(root, session).start();
    return session;
  }

  it('renders the campaign graph as the initial workspace without a permanent stage preview', () => {
    const session = mount();
    const state = session.state();

    expect(document.querySelectorAll('[data-node-id]')).toHaveLength(documentModel.nodes.length);
    expect(document.querySelectorAll('[data-tile]')).toHaveLength(0);
    expect(document.querySelectorAll('[data-diagnostic-code]').length).toBeGreaterThan(0);
    expect(document.body.textContent).toContain(state.document?.nodes[0].stageId);
    expect(document.body.textContent).toContain('Fixture · pipeline real');
    expect(document.querySelector('[data-role="workspace-campaign"]')?.classList.contains('is-active')).toBe(true);
    expect(document.querySelector<HTMLElement>('[data-role="toggle-explorer"]')?.hidden).toBe(true);
  });

  it('synchronizes physical exit clicks with graph selection and inspector', () => {
    const session = mount();
    document.querySelector<HTMLButtonElement>('[data-role="workspace-stages"]')?.click();
    const mode = document.querySelector<HTMLSelectElement>('[data-role="stage-mode"]') as HTMLSelectElement;
    mode.value = 'structural';
    mode.dispatchEvent(new Event('change', { bubbles: true }));
    const marker = document.querySelector<SVGGElement>('[data-marker-id][data-selectable="true"]');
    expect(marker).not.toBeNull();
    expect(document.querySelector('[data-role="stage-help"]')?.textContent).toContain('estrutural');

    marker?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const edgeId = session.state().selection.edgeId;
    expect(edgeId).toBeDefined();
    document.querySelector<HTMLButtonElement>('[data-role="workspace-campaign"]')?.click();
    expect(document.querySelector(`[data-edge-id="${edgeId}"]`)?.classList.contains('is-selected')).toBe(true);
    expect(document.body.textContent).toContain('physicalExitId');
  });

  it('toggles grid and overlays without changing the generated document', () => {
    const session = mount();
    document.querySelector<HTMLButtonElement>('[data-role="workspace-stages"]')?.click();
    const mode = document.querySelector<HTMLSelectElement>('[data-role="stage-mode"]') as HTMLSelectElement;
    mode.value = 'structural';
    mode.dispatchEvent(new Event('change', { bubbles: true }));
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

  it('switches between campaign, stage and comparison workspaces while preserving state', () => {
    const session = mount();
    const selectedNode = session.state().selection.nodeId;
    document.querySelector<HTMLButtonElement>('[data-role="workspace-stages"]')?.click();
    expect(document.querySelectorAll('iframe.wl-phaser-frame')).toHaveLength(1);
    expect(document.querySelector<HTMLElement>('[data-role="toggle-explorer"]')?.hidden).toBe(false);
    expect(document.querySelector('iframe')?.getAttribute('sandbox')).toBe('allow-scripts allow-same-origin');
    expect(document.querySelectorAll('[data-node-id]')).toHaveLength(0);

    document.querySelector<HTMLButtonElement>('[data-role="workspace-comparison"]')?.click();
    expect(document.querySelector('[data-role="stage-help"]')?.textContent).toContain('Mesmo enquadramento');
    const frames = [...document.querySelectorAll<HTMLIFrameElement>('iframe.wl-phaser-frame')];
    expect(frames).toHaveLength(2);
    expect(frames[0].style.transform).toBe(frames[1].style.transform);
    expect(new URL(frames[0].src).searchParams.get('stagePreview')).toBe(
      documentModel.stages.find(stage => stage.nodeId === documentModel.nodes[0].id)?.stageId,
    );
    expect(session.state().selection.nodeId).toBe(selectedNode);

    document.querySelector<HTMLButtonElement>('[data-role="workspace-campaign"]')?.click();
    expect(document.querySelectorAll('iframe.wl-phaser-frame')).toHaveLength(0);
    expect(document.querySelectorAll('[data-node-id]')).toHaveLength(documentModel.nodes.length);
  });

  it('maximizes the stage preview without losing its selection', () => {
    const session = mount();
    document.querySelector<HTMLButtonElement>('[data-role="workspace-stages"]')?.click();
    const selected = session.state().selection.nodeId;
    document.querySelector<HTMLButtonElement>('[data-role="maximize"]')?.click();
    expect(document.querySelector<HTMLElement>('[data-role="explorer-panel"]')?.hidden).toBe(true);
    expect(document.querySelector<HTMLElement>('[data-role="inspector-panel"]')?.hidden).toBe(true);
    expect(session.state().selection.nodeId).toBe(selected);
    expect(document.querySelectorAll('iframe.wl-phaser-frame')).toHaveLength(1);
  });

  it('keeps the 9.7D comparison URL compatible', () => {
    window.history.replaceState({}, '', '?view=compare&zoom=0.75&comparisonVariant=variant.test.b');
    mount();
    expect(document.querySelector('[data-role="workspace-comparison"]')?.classList.contains('is-active')).toBe(true);
    expect(document.querySelectorAll('iframe.wl-phaser-frame')).toHaveLength(2);
    expect(document.querySelector<HTMLSelectElement>('[data-role="zoom"]')?.value).toBe('0.75');
  });

  it('opens the stages workspace and focus stage from 9.7D URLs', () => {
    const stageId = new WorldLabDataService().stageOptions()[0].id;
    window.history.replaceState({}, '', `?view=visual&stage=${stageId}`);
    const session = new WorldLabSession(
      new WorldLabDataService({ focusStageId: stageId }),
      undefined,
      documentModel.seed,
    );
    const root = document.querySelector<HTMLElement>('#root') as HTMLElement;
    new WorldLabApp(root, session).start();
    expect(document.querySelector('[data-role="workspace-stages"]')?.classList.contains('is-active')).toBe(true);
    expect(document.querySelector<HTMLSelectElement>('[data-role="stage-select"]')?.value).toBe(stageId);
    const frame = document.querySelector<HTMLIFrameElement>('iframe.wl-phaser-frame');
    expect(new URL(frame!.src).searchParams.get('stagePreview')).toBe(stageId);
  });
});

