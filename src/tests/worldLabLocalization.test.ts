/** @jest-environment jsdom */

import { WorldLabDataService, WorldLabSession, type WorldLabGenerationResult } from '../devtools/world-lab';
import { WorldLabApp } from '../devtools/world-lab/ui/WorldLabApp';
import { WORLD_LAB_PT_BR, localizeDiagnosticMessage, localizeStatus } from '../devtools/world-lab/ui/WorldLabPtBr';

describe('localização pt-BR do World Lab', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    window.history.replaceState({}, '', '/');
  });

  it('centraliza rótulos, estados e mensagens conhecidas', () => {
    expect(WORLD_LAB_PT_BR.workspaces).toEqual({ campaign: 'Campanha', stages: 'Fases', comparison: 'Comparação' });
    expect(localizeStatus('blocked')).toBe('bloqueado');
    expect(localizeDiagnosticMessage({
      code: 'world-lab.seed-required', severity: 'error', origin: 'integration', message: 'Seed required.',
    })).toBe('Informe uma seed para gerar a visualização.');
  });

  it('não expõe os rótulos ingleses da barra e dos painéis da 9.7D', () => {
    const generated = new WorldLabDataService().generate('world-lab-localization');
    if (!generated.ok) throw generated.error;
    const result: WorldLabGenerationResult = { ok: true, value: generated.value };
    const session = new WorldLabSession({ generate: () => result }, undefined, generated.value.seed);
    new WorldLabApp(document.querySelector('#root') as HTMLElement, session).start();
    const chrome = [
      document.querySelector('.wl-topbar')?.textContent,
      document.querySelector('.wl-contextbar')?.textContent,
      ...[...document.querySelectorAll('.wl-panel-title')].map(item => item.textContent),
    ].join(' ');
    expect(chrome).toContain('Campanha');
    expect(chrome).toContain('Gerar');
    expect(chrome).not.toMatch(/Generate|Regenerate|Campaign Graph|Stage Inspector|Diagnostics/);
  });

  it('mostra contadores e detalhes técnicos expansíveis nos diagnósticos', () => {
    const generated = new WorldLabDataService().generate('world-lab-diagnostics');
    if (!generated.ok) throw generated.error;
    const result: WorldLabGenerationResult = { ok: true, value: generated.value };
    const session = new WorldLabSession({ generate: () => result }, undefined, generated.value.seed);
    new WorldLabApp(document.querySelector('#root') as HTMLElement, session).start();
    expect(document.querySelector('[data-role="diagnostics-summary"]')?.textContent).toMatch(/erros · \d+ avisos/);
    const diagnostic = document.querySelector<HTMLDetailsElement>('[data-diagnostic-code]');
    expect(diagnostic).not.toBeNull();
    diagnostic!.open = true;
    expect(diagnostic!.textContent).toContain('Mensagem original');
    document.querySelector<HTMLButtonElement>('[data-role="filter-warning"]')?.click();
    expect(document.querySelector('[data-role="filter-warning"]')?.classList.contains('is-active')).toBe(false);
  });
});
