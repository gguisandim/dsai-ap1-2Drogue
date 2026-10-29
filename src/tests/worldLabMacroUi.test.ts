/** @jest-environment jsdom */

import {
  WorldLabDataService,
  WorldLabMacroDataService,
  WorldLabSession,
  type WorldLabGenerationResult,
  type WorldLabMacroRouteResult,
  type WorldLabMacroRouteView,
} from '../devtools/world-lab';
import { WorldLabApp } from '../devtools/world-lab/ui/WorldLabApp';

function macroView(result: WorldLabMacroRouteResult): WorldLabMacroRouteView {
  if (!result.ok) throw result.error;
  return result.value;
}

describe('Umbra World Lab macro campaign UI', () => {
  const macroService = new WorldLabMacroDataService();
  let procedural: Extract<WorldLabGenerationResult, { ok: true }>['value'];
  let macro: WorldLabMacroRouteView;

  beforeAll(() => {
    const generated = new WorldLabDataService().generate('world-lab-macro-ui');
    if (!generated.ok) throw generated.error;
    procedural = generated.value;
    macro = macroView(macroService.generate('world-lab-macro-ui'));
  });

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
  });

  function mount(source: { generate(seed: string): WorldLabMacroRouteResult } = macroService) {
    const proceduralResult: WorldLabGenerationResult = { ok: true, value: procedural };
    const session = new WorldLabSession({ generate: () => proceduralResult }, undefined, procedural.seed);
    const root = document.querySelector<HTMLElement>('#root') as HTMLElement;
    const app = new WorldLabApp(root, session, source);
    app.start();
    return { app, session, root };
  }

  function openMacro(): void {
    const button = document.querySelector<HTMLButtonElement>('[data-role="mode-macro"]');
    button?.click();
  }

  it('preserves the procedural visualizer and switches to the complete macro structure', () => {
    mount();
    expect(document.querySelectorAll('[data-node-id]')).toHaveLength(procedural.nodes.length);
    expect(document.querySelector('[data-role="mode-procedural"]')?.classList.contains('is-active')).toBe(true);

    openMacro();

    expect(document.querySelectorAll('[data-macro-node-id]')).toHaveLength(macro.nodes.length);
    expect(document.querySelectorAll('[data-macro-edge-id]')).toHaveLength(macro.edges.length);
    expect(document.body.textContent).toContain('Floresta das Raízes');
    expect(document.body.textContent).toContain('Rota das Águas');
    expect(document.body.textContent).toContain('REGIÕES CORROMPIDAS');
    expect(document.body.textContent).toContain('Palácio do Credor');
    expect(document.body.textContent).toContain('Fixture de inspeção');

    document.querySelector<HTMLButtonElement>('[data-role="mode-procedural"]')?.click();
    expect(document.querySelectorAll('[data-node-id]')).toHaveLength(procedural.nodes.length);
  });

  it('derives current, available, blocked, loadable and planned states from the projection', () => {
    mount();
    openMacro();

    expect(document.querySelector('[data-macro-node-id="hub.floresta-das-raizes"]')
      ?.getAttribute('data-progress-state')).toBe('current');
    expect(document.querySelector('[data-macro-node-id="region.aguas.igapo"]')
      ?.getAttribute('data-progress-state')).toBe('available');
    expect(document.querySelector('[data-macro-node-id="region.floresta.fungos"]')
      ?.getAttribute('data-content-state')).toBe('planned');
    expect(document.querySelector('[data-macro-node-id="region.aguas.mangues"]')
      ?.getAttribute('data-progress-state')).toBe('blocked');
    expect(macro.nodes.filter(node => node.kind === 'milestone')).toHaveLength(4);
  });

  it('selects Igapó, shows contract details and opens its real legacy map', () => {
    mount();
    openMacro();
    const igapo = document.querySelector<SVGGElement>('[data-macro-node-id="region.aguas.igapo"]');
    igapo?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(document.body.textContent).toContain('verse_02_galeria');
    expect(document.body.textContent).toContain('placeholder legado');
    expect(document.querySelectorAll('[data-tile]').length).toBeGreaterThan(0);
    expect(document.querySelector('[data-role="stage-title"]')?.textContent).toContain('Igapó');
  });

  it('never fabricates a map for planned regions and exposes their requirements', () => {
    mount();
    openMacro();
    const mangues = document.querySelector<SVGGElement>('[data-macro-node-id="region.aguas.mangues"]');
    mangues?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(document.querySelectorAll('[data-tile]')).toHaveLength(0);
    expect(document.body.textContent).toContain('Mapa ainda não implementado');
    expect(document.body.textContent).toContain('region.aguas.igapo');
  });

  it('regenerates the macro projection with the selected seed', () => {
    const generate = jest.fn((seed: string) => macroService.generate(seed));
    mount({ generate });
    openMacro();
    const input = document.querySelector<HTMLInputElement>('[data-role="seed"]') as HTMLInputElement;
    input.value = 'macro-seed-alternativa';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector<HTMLButtonElement>('[data-role="generate"]')?.click();

    expect(generate).toHaveBeenLastCalledWith('macro-seed-alternativa');
    expect(document.body.textContent).toContain('seed macro-seed-alternativa');
  });

  it('does not mutate the projected campaign while selecting nodes', () => {
    const source = { generate: jest.fn(() => ({ ok: true as const, value: macro })) };
    const before = JSON.stringify(macro);
    mount(source);
    openMacro();
    document.querySelector<SVGGElement>('[data-macro-node-id="region.terra.areias"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(JSON.stringify(macro)).toBe(before);
    expect(Object.isFrozen(macro)).toBe(true);
    expect(source.generate).toHaveBeenCalledTimes(1);
  });
});
