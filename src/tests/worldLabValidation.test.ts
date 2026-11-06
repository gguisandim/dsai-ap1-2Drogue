/** @jest-environment jsdom */

import fs from 'node:fs';
import path from 'node:path';
import { createTemplateStagePlan } from '../cli/chapter';
import {
  createChapterTemplate,
  type ChapterTemplate,
} from '../examples/chapter-template';
import {
  CAMPAIGN_CHAPTER_CATALOG,
  StageRegistry,
  registerCampaignChapters,
  registerLegacyStages,
} from '../stages';
import {
  WorldLabDataService,
  WorldLabSession,
  WorldLabSnapshotCodec,
  type WorldLabDocument,
  type WorldLabGenerationResult,
  type WorldLabPlanSource,
  type WorldLabRuntimeValidation,
  type WorldLabValidationSource,
} from '../devtools/world-lab';
import { WorldLabApp } from '../devtools/world-lab/ui/WorldLabApp';

const repoRoot = process.cwd();
const igapoPlanPath = path.join(
  repoRoot, 'src', 'examples', 'chapters', 'igapo-das-memorias', 'stage-plan.json',
);

function expectDocument(result: WorldLabGenerationResult): WorldLabDocument {
  if (!result.ok) throw new Error(JSON.stringify(result.error));
  return result.value;
}

function waterBlock(map: readonly (readonly number[])[], size = 4): { x: number; y: number } | undefined {
  for (let y = 1; y + size < map.length - 1; y += 1) {
    for (let x = 1; x + size < map[0].length - 1; x += 1) {
      let water = true;
      for (let dy = 0; dy < size && water; dy += 1) {
        for (let dx = 0; dx < size; dx += 1) {
          if (map[y + dy][x + dx] !== 3) { water = false; break; }
        }
      }
      if (water) return { x, y };
    }
  }
  return undefined;
}

function sealedPocketTemplate(): {
  readonly template: ChapterTemplate;
  readonly plan: ReturnType<typeof createTemplateStagePlan>;
  readonly stageId: string;
} {
  const template = createChapterTemplate('test.worldlab.validation', {
    template: 'horizontal', seed: 42,
  });
  const level = template.stage.authoredLevel;
  if (!level) throw new Error('Fixture requires an authored level.');
  const tileMap = level.tileMap.map(row => [...row]);
  const block = waterBlock(tileMap);
  if (!block) throw new Error('Fixture has no water block.');
  tileMap[block.y + 1][block.x + 1] = 0;
  tileMap[block.y + 1][block.x + 2] = 0;
  tileMap[block.y + 2][block.x + 1] = 0;
  tileMap[block.y + 2][block.x + 2] = 0;
  const plan = createTemplateStagePlan(template);
  const pocketPlan = {
    ...plan,
    regions: [...plan.regions, {
      id: 'region.test.worldlab.pocket',
      title: 'Bolso selado',
      role: 'objective' as const,
      anchor: { x: block.x + 1, y: block.y + 1 },
      connections: [],
    }],
    objectives: [...plan.objectives, {
      id: 'objective.test.worldlab.pocket',
      title: 'Alcançar o bolso selado',
      regionId: 'region.test.worldlab.pocket',
    }],
  };
  const mutated = {
    ...template,
    stage: {
      ...template.stage,
      authoredLevel: { ...level, tileMap },
    },
    entry: {
      ...template.entry,
      stages: [{ ...template.stage, authoredLevel: { ...level, tileMap } }],
    },
  };
  return {
    template: mutated,
    plan: pocketPlan,
    stageId: mutated.stage.manifest.id,
  };
}

function validationRegistry(entry: ChapterTemplate['entry']): StageRegistry {
  const registry = new StageRegistry();
  registerLegacyStages(registry);
  registerCampaignChapters(registry);
  registerCampaignChapters(registry, [entry]);
  return registry;
}

function igapoValidationSource(): WorldLabValidationSource {
  const plan = JSON.parse(fs.readFileSync(igapoPlanPath, 'utf8')) as WorldLabPlanSource['plan'];
  return Object.freeze({
    planForStage: (stageId: string) => stageId === 'stage.aguas.igapo-das-memorias'
      ? Object.freeze({ plan, source: 'file' as const })
      : undefined,
  });
}

function runtimeReport(stageId: string): WorldLabRuntimeValidation {
  return Object.freeze({
    schemaVersion: 1 as const,
    kind: 'umbra.stage-homologation.report' as const,
    stageId,
    result: 'FAIL' as const,
    checks: Object.freeze([
      Object.freeze({
        id: 'runtime.load', code: 'RUNTIME_STAGE_LOADED', status: 'PASS' as const,
        required: true, message: 'Fase carregada.', evidence: 'phaser-runtime' as const,
      }),
      Object.freeze({
        id: 'runtime.exit.triggered', code: 'RUNTIME_EXIT_NOT_TRIGGERED', status: 'FAIL' as const,
        required: true, message: 'A saída não acionou a conclusão.',
        suggestion: 'Verifique a condição de desbloqueio.', location: { x: 12, y: 8 },
        evidence: 'phaser-runtime' as const,
      }),
    ]),
    evidence: Object.freeze({
      browser: 'Edge headless', screenshots: Object.freeze(['exit.png']), durationMs: 1234,
    }),
  });
}

describe('Etapa 9.13 World Lab validation integration', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    window.history.replaceState({}, '', '/');
  });

  it('projects the real 9.12 static validation with plan regions', () => {
    const labDocument = expectDocument(new WorldLabDataService({
      focusStageId: 'stage.aguas.igapo-das-memorias',
      validationSource: igapoValidationSource(),
    }).generate('world-lab-validation-seed'));
    const stage = labDocument.stages.find(item => item.stageId === 'stage.aguas.igapo-das-memorias');
    expect(stage?.validation).toBeDefined();
    expect(stage?.validation).toMatchObject({
      stageId: 'stage.aguas.igapo-das-memorias',
      result: 'PASS',
      evidence: 'static-analysis',
      plan: { source: 'file', planId: 'plan.aguas.igapo-das-memorias' },
    });
    expect(stage?.validation?.regions).toHaveLength(5);
    expect(stage?.validation?.regions.every(region => region.status === 'PASS')).toBe(true);
    expect(stage?.validation?.checks.some(check => check.code === 'EXIT_REACHABLE')).toBe(true);
    expect(stage?.validation?.checks.every(check => check.evidence === 'static-analysis')).toBe(true);
    expect(labDocument.diagnostics.some(item => item.origin === 'playtest-static')).toBe(true);
  });

  it('maps an unreachable objective to a spatial FAIL diagnostic', () => {
    const fixture = sealedPocketTemplate();
    const labDocument = expectDocument(new WorldLabDataService({
      registry: validationRegistry(fixture.template.entry),
      focusStageId: fixture.stageId,
      validationSource: {
        planForStage: (stageId: string) => stageId === fixture.stageId
          ? { plan: fixture.plan, source: 'generated' as const }
          : undefined,
        routesForStage: (stageId: string) => stageId === fixture.stageId
          ? fixture.template.geometry.routes
          : undefined,
        seedForStage: () => 42,
      },
    }).generate('world-lab-failure-seed'));
    const stage = labDocument.stages.find(item => item.stageId === fixture.stageId);
    expect(stage?.validation?.result).toBe('FAIL');
    const failed = stage?.validation?.checks.find(check => check.status === 'FAIL');
    expect(failed?.code).toBe('OBJECTIVE_UNREACHABLE');
    expect(failed?.location).toEqual({ x: expect.any(Number), y: expect.any(Number) });
    expect(failed?.suggestion).toBeTruthy();
    const diagnostic = labDocument.diagnostics.find(item =>
      item.origin === 'playtest-static' && item.status === 'FAIL');
    expect(diagnostic).toMatchObject({
      code: 'OBJECTIVE_UNREACHABLE',
      evidence: 'static-analysis',
      location: failed?.location,
      checkId: failed?.id,
      stageId: fixture.stageId,
    });
    expect(labDocument.diagnostics.some(item => item.status === 'FAIL' && item.location)).toBe(true);

    // Restoring the authored map/plan returns the same stable stage to PASS.
    const restored = createChapterTemplate('test.worldlab.validation', {
      template: 'horizontal', seed: 42,
    });
    const restoredDocument = expectDocument(new WorldLabDataService({
      registry: validationRegistry(restored.entry),
      focusStageId: restored.stage.manifest.id,
      validationSource: {
        planForStage: (stageId: string) => stageId === restored.stage.manifest.id
          ? { plan: createTemplateStagePlan(restored), source: 'generated' as const }
          : undefined,
        routesForStage: (stageId: string) => stageId === restored.stage.manifest.id
          ? restored.geometry.routes
          : undefined,
        seedForStage: () => 42,
      },
    }).generate('world-lab-failure-seed'));
    const restoredStage = restoredDocument.stages.find(item =>
      item.stageId === restored.stage.manifest.id);
    expect(restoredStage?.validation?.result).toBe('PASS');
  });

  it('round-trips validation through the versioned snapshot without breaking v1', () => {
    const labDocument = expectDocument(new WorldLabDataService({
      focusStageId: 'stage.aguas.igapo-das-memorias',
      validationSource: igapoValidationSource(),
    }).generate('world-lab-validation-seed'));
    const codec = new WorldLabSnapshotCodec();
    const serialized = codec.export(labDocument);
    const parsed = JSON.parse(serialized) as { document: WorldLabDocument };
    expect(parsed.document.stages.some(stage => stage.validation)).toBe(true);
    const imported = codec.import(serialized);
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(codec.export(imported.value.document)).toBe(serialized);

    const withoutValidation = JSON.parse(serialized) as {
      document: { stages: Array<Record<string, unknown>> };
    };
    withoutValidation.document.stages.forEach(stage => { delete stage.validation; });
    const legacy = codec.import(JSON.stringify(withoutValidation));
    expect(legacy.ok).toBe(true);
  });

  it('imports a runtime report and merges its checks with the static projection', () => {
    const labDocument = expectDocument(new WorldLabDataService({
      focusStageId: 'stage.aguas.igapo-das-memorias',
      validationSource: igapoValidationSource(),
    }).generate('world-lab-validation-seed'));
    const stage = labDocument.stages.find(item => item.stageId === 'stage.aguas.igapo-das-memorias');
    if (!stage) throw new Error('Igapó stage is missing.');
    const session = new WorldLabSession(
      { generate: (): WorldLabGenerationResult => ({ ok: true, value: labDocument }) },
      new WorldLabSnapshotCodec(),
      labDocument.seed,
    );
    session.generate();
    const imported = session.importRuntimeValidation(JSON.stringify(runtimeReport(stage.stageId)));
    expect(imported.ok).toBe(true);
    expect(session.runtimeValidation(stage.stageId)?.result).toBe('FAIL');
    const checks = session.validationChecks(stage.stageId);
    expect(checks.some(check => check.evidence === 'static-analysis')).toBe(true);
    expect(checks.some(check => check.evidence === 'phaser-runtime')).toBe(true);
    expect(session.selectValidationCheck('runtime.exit.triggered')).toBe(true);
    expect(session.state().selection).toMatchObject({
      nodeId: stage.nodeId,
      validationCheckId: 'runtime.exit.triggered',
      tile: { x: 12, y: 8 },
    });
    const snapshot = JSON.parse(session.exportSnapshot() ?? '{}') as {
      document: { stages: Array<{ validation?: unknown }> };
    };
    expect(snapshot.document.stages.some(item => item.validation)).toBe(true);
    expect(session.state().runtimeValidations?.[stage.stageId]).toBeDefined();
  });

  it('rejects an invalid or unknown-stage runtime report without mutating the document', () => {
    const labDocument = expectDocument(new WorldLabDataService({
      focusStageId: 'stage.aguas.igapo-das-memorias',
      validationSource: igapoValidationSource(),
    }).generate('world-lab-validation-seed'));
    const session = new WorldLabSession(
      { generate: (): WorldLabGenerationResult => ({ ok: true, value: labDocument }) },
      new WorldLabSnapshotCodec(),
      labDocument.seed,
    );
    session.generate();
    const before = session.state().document;
    const invalid = session.importRuntimeValidation('{');
    expect(invalid.ok).toBe(false);
    expect(session.state().diagnostics.some(item =>
      item.code === 'world-lab.runtime-report.invalid')).toBe(true);
    const unknown = session.importRuntimeValidation(JSON.stringify(runtimeReport('stage.unknown')));
    expect(unknown.ok).toBe(false);
    expect(session.state().diagnostics.some(item =>
      item.code === 'world-lab.runtime-report.unknown-stage')).toBe(true);
    expect(session.state().document).toBe(before);
  });

  it('renders the validation panel, selects checks and highlights the map', () => {
    const fixture = sealedPocketTemplate();
    const labDocument = expectDocument(new WorldLabDataService({
      registry: validationRegistry(fixture.template.entry),
      focusStageId: fixture.stageId,
      validationSource: {
        planForStage: (stageId: string) => stageId === fixture.stageId
          ? { plan: fixture.plan, source: 'generated' as const }
          : undefined,
        routesForStage: (stageId: string) => stageId === fixture.stageId
          ? fixture.template.geometry.routes
          : undefined,
        seedForStage: () => 42,
      },
    }).generate('world-lab-failure-seed'));
    const result: WorldLabGenerationResult = { ok: true, value: labDocument };
    const session = new WorldLabSession({ generate: () => result }, undefined, labDocument.seed);
    const root = document.querySelector<HTMLElement>('#root') as HTMLElement;
    new WorldLabApp(root, session).start();
    const focusNode = labDocument.nodes.find(node => node.stageId === fixture.stageId);
    if (focusNode) session.selectNode(focusNode.id);
    document.querySelector<HTMLButtonElement>('[data-role="workspace-stages"]')?.click();
    const mode = document.querySelector<HTMLSelectElement>('[data-role="stage-mode"]') as HTMLSelectElement;
    mode.value = 'structural';
    mode.dispatchEvent(new Event('change', { bubbles: true }));

    const list = document.querySelector<HTMLElement>('[data-role="validation-list"]');
    expect(list).not.toBeNull();
    const rows = [...document.querySelectorAll<HTMLButtonElement>('[data-validation-check]')];
    const row = rows.find(item => item.dataset.validationStatus === 'FAIL');
    expect(row).toBeDefined();
    expect(list?.textContent).toContain('OBJECTIVE_UNREACHABLE');
    expect(list?.textContent).toContain('Sugestão');
    expect(document.querySelector('[data-validation-region]')).not.toBeNull();

    row?.click();
    const selection = session.state().selection;
    expect(selection.validationCheckId).toBeDefined();
    expect(selection.tile).toBeDefined();
    expect(document.querySelector(`[data-validation-check="${selection.validationCheckId}"]`)
      ?.classList.contains('is-selected')).toBe(true);
    expect(document.querySelector('[data-role="import-runtime"]')).not.toBeNull();
  });

  it('shows static and runtime evidence in the diagnostics drawer', () => {
    const labDocument = expectDocument(new WorldLabDataService({
      focusStageId: 'stage.aguas.igapo-das-memorias',
      validationSource: igapoValidationSource(),
    }).generate('world-lab-validation-seed'));
    const stage = labDocument.stages.find(item => item.stageId === 'stage.aguas.igapo-das-memorias');
    if (!stage) throw new Error('Igapó stage is missing.');
    const result: WorldLabGenerationResult = { ok: true, value: labDocument };
    const session = new WorldLabSession({ generate: () => result }, undefined, labDocument.seed);
    const root = document.querySelector<HTMLElement>('#root') as HTMLElement;
    new WorldLabApp(root, session).start();
    document.querySelector<HTMLButtonElement>('[data-role="workspace-stages"]')?.click();
    session.importRuntimeValidation(JSON.stringify(runtimeReport(stage.stageId)));
    const toggle = document.querySelector<HTMLButtonElement>('[data-role="toggle-diagnostics"]');
    toggle?.click();
    const text = document.body.textContent ?? '';
    expect(text).toContain('análise estática');
    expect(text).toContain('execução Phaser');
    expect(document.querySelector('[data-diagnostic-code="RUNTIME_EXIT_NOT_TRIGGERED"]')).not.toBeNull();
    expect(document.querySelector('[data-diagnostic-code="OBJECTIVE_UNREACHABLE"]')).toBeNull();
  });

  it('keeps validation compatible with presentation variants', () => {
    const labDocument = expectDocument(new WorldLabDataService({
      focusStageId: 'stage.aguas.igapo-das-memorias',
      presentationVariantId: 'variant.aguas.igapo-sombrio',
      validationSource: igapoValidationSource(),
    }).generate('world-lab-variant-seed'));
    const stage = labDocument.stages.find(item => item.stageId === 'stage.aguas.igapo-das-memorias');
    expect(stage?.visualPresentation?.variantId).toBe('variant.aguas.igapo-sombrio');
    expect(stage?.validation?.result).toBe('PASS');
    expect(stage?.validation?.regions).toHaveLength(5);
  });

  it('keeps the production catalog available to the authoring validation source', () => {
    expect(CAMPAIGN_CHAPTER_CATALOG.some(entry =>
      entry.stages.some(stage => stage.manifest.id === 'stage.aguas.igapo-das-memorias'))).toBe(true);
  });
});
