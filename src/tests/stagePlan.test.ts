import fs from 'node:fs';
import path from 'node:path';
import {
  ChapterCliError,
  parseChapterCliArguments,
  runChapterCli,
  validateStagePlan,
  validateStagePlanFile,
  STAGE_PLAN_FILENAME,
  type StagePlan,
  type StagePlanValidationReport,
} from '../cli/chapter';
import { nodeChapterFileSystem } from '../cli/chapter/fs';

const repoRoot = process.cwd();
const chaptersParent = path.join(repoRoot, 'src', 'examples', 'chapters');
const examplePlanPath = path.join(chaptersParent, 'igapo-das-memorias', STAGE_PLAN_FILENAME);

function clonePlan(): Record<string, any> {
  return JSON.parse(JSON.stringify(validPlan()));
}

function validPlan(): StagePlan {
  return {
    schemaVersion: 1,
    kind: 'umbra.stage-plan',
    id: 'plan.test.farol',
    stageId: 'stage.test.farol',
    title: 'Farol de teste',
    summary: 'Plano mínimo para os testes.',
    progression: 'linear',
    visualDirection: 'Pedra clara e luz fria.',
    startRegionId: 'region.test.entry',
    exitRegionIds: ['region.test.exit'],
    regions: [
      { id: 'region.test.entry', title: 'Entrada', role: 'start', connections: ['region.test.exit'] },
      { id: 'region.test.exit', title: 'Saída', role: 'exit', connections: ['region.test.entry'] },
    ],
    objectives: [{
      id: 'objective.test.light',
      title: 'Acender o farol',
      regionId: 'region.test.entry',
      unlocksExitIds: ['exit.test.depart'],
    }],
    encounters: [],
    interactions: [],
    exitConditions: [{
      exitId: 'exit.test.depart',
      regionId: 'region.test.exit',
      requiresObjectiveIds: ['objective.test.light'],
    }],
    capabilities: [{
      id: 'navigation.authored-map',
      category: 'navigation',
      minimumVersion: 1,
      requirement: 'required',
    }],
  };
}

function codes(plan: unknown): readonly string[] {
  return validateStagePlan(plan).diagnostics.map(item => item.code);
}

function runRaw(argv: readonly string[]): {
  readonly code: number;
  readonly output: string;
  readonly errors: string;
} {
  const output: string[] = [];
  const errors: string[] = [];
  const code = runChapterCli(argv, {
    repoRoot,
    print: line => output.push(line),
    printError: line => errors.push(line),
  });
  return { code, output: output.join('\n'), errors: errors.join('\n') };
}

describe('Etapa 9.10 structured stage plans', () => {
  it('accepts a valid plan and the real Igapó example', () => {
    const report = validateStagePlan(validPlan(), 'stage-plan.json');
    expect(report.ok).toBe(true);
    expect(report.errors).toEqual([]);
    expect(report.summary).toMatchObject({
      planId: 'plan.test.farol',
      regions: 2,
      objectives: 1,
      exitConditions: 1,
    });

    const example = validateStagePlanFile(examplePlanPath, nodeChapterFileSystem);
    expect(example.ok).toBe(true);
    expect(example.errors).toEqual([]);
    expect(example.summary).toMatchObject({
      planId: 'plan.aguas.igapo-das-memorias',
      stageId: 'stage.aguas.igapo-das-memorias',
      progression: 'linear',
      regions: 5,
      objectives: 2,
      encounters: 1,
      interactions: 3,
      exitConditions: 1,
    });
    expect(example.infos.map(item => item.code)).toContain('plan.references.chapter-local');
  });

  it('uses real Igapó identifiers in the example without touching the chapter', () => {
    const plan = JSON.parse(fs.readFileSync(examplePlanPath, 'utf8')) as StagePlan;
    expect(plan.stageId).toBe('stage.aguas.igapo-das-memorias');
    expect(plan.objectives.map(item => item.id)).toEqual([
      'objective.aguas.igapo.reach-vestige',
      'objective.aguas.igapo.confirm-corruption',
    ]);
    expect(plan.interactions?.map(item => item.referenceId)).toEqual(expect.arrayContaining([
      'npc.aguas.igapo.memory-vestige',
      'dialogue.aguas.igapo.eco-das-aguas',
      'health_herb',
    ]));
    expect(plan.encounters?.[0].archetypes).toEqual(['affinity', 'applaud']);
    expect(plan.themeCapabilityId).toBe('theme.aguas.igapo');
  });

  it('rejects unknown connections and disconnected regions', () => {
    const unknown = clonePlan();
    unknown.regions[0].connections.push('region.test.ghost');
    expect(codes(unknown)).toContain('plan.region.connection.missing');

    const disconnected = clonePlan();
    disconnected.regions.push({
      id: 'region.test.island', title: 'Ilha', role: 'exploration', connections: [],
    });
    const disconnectedCodes = codes(disconnected);
    expect(disconnectedCodes).toContain('plan.region.unreachable');
  });

  it('rejects missing and circular objective dependencies', () => {
    const missing = clonePlan();
    missing.objectives[0].dependsOn = ['objective.test.missing'];
    expect(codes(missing)).toContain('plan.objective.dependency.missing');

    const circular = clonePlan();
    circular.objectives.push({
      id: 'objective.test.confirm',
      title: 'Confirmar',
      regionId: 'region.test.entry',
      dependsOn: ['objective.test.light'],
      unlocksExitIds: ['exit.test.depart'],
    });
    circular.objectives[0].dependsOn = ['objective.test.confirm'];
    circular.exitConditions[0].requiresObjectiveIds.push('objective.test.confirm');
    expect(codes(circular)).toContain('plan.objective.cycle');
  });

  it('rejects invalid start and exit declarations', () => {
    const missingStart = clonePlan();
    missingStart.startRegionId = 'region.test.ghost';
    expect(codes(missingStart)).toContain('plan.start.missing');

    const missingExit = clonePlan();
    missingExit.exitRegionIds = [];
    expect(codes(missingExit)).toContain('plan.exit.empty');

    const wrongRole = clonePlan();
    wrongRole.regions[1].role = 'objective';
    expect(codes(wrongRole)).toContain('plan.exit.role-invalid');
  });

  it('rejects exit conditions inconsistent with objectives', () => {
    const missingObjective = clonePlan();
    missingObjective.exitConditions[0].requiresObjectiveIds.push('objective.test.missing');
    expect(codes(missingObjective)).toContain('plan.exit-condition.objective-missing');

    const missingCondition = clonePlan();
    missingCondition.exitConditions = [];
    expect(codes(missingCondition)).toContain('plan.exit.condition-missing');

    const notRequired = clonePlan();
    notRequired.objectives.push({
      id: 'objective.test.extra',
      title: 'Extra',
      regionId: 'region.test.entry',
      unlocksExitIds: ['exit.test.depart'],
    });
    expect(codes(notRequired)).toContain('plan.exit-condition.objective-not-required');
  });

  it('rejects unknown, unavailable and mismatched capabilities', () => {
    const unknown = clonePlan();
    unknown.capabilities = [{
      id: 'theme.authoring.unknown', category: 'theme', minimumVersion: 1, requirement: 'required',
    }];
    expect(codes(unknown)).toContain('capability.unknown');

    const planned = clonePlan();
    planned.capabilities = [{
      id: 'theme.gothic-cathedral', category: 'theme', minimumVersion: 1, requirement: 'required',
    }];
    const plannedReport = validateStagePlan(planned);
    expect(plannedReport.ok).toBe(false);
    expect(plannedReport.errors.map(item => item.code)).toContain('capability.unavailable');

    const mismatch = clonePlan();
    mismatch.capabilities = [{
      id: 'navigation.authored-map', category: 'theme', minimumVersion: 1, requirement: 'required',
    }];
    expect(codes(mismatch)).toContain('capability.category.mismatch');
  });

  it('warns about dynamic themes and does not fail local references', () => {
    const dynamic = clonePlan();
    dynamic.themeCapabilityId = 'theme.authoring.chapter-local';
    const report = validateStagePlan(dynamic);
    expect(report.ok).toBe(true);
    expect(report.warnings.map(item => item.code)).toContain('plan.theme.dynamic');

    const planned = clonePlan();
    planned.themeCapabilityId = 'theme.gothic-cathedral';
    expect(validateStagePlan(planned).warnings.map(item => item.code))
      .toContain('plan.theme.unavailable');

    const local = clonePlan();
    local.interactions = [{
      id: 'interaction.test.npc', regionId: 'region.test.entry', kind: 'npc',
      referenceId: 'npc.test.warden',
    }];
    const localReport = validateStagePlan(local);
    expect(localReport.ok).toBe(true);
    expect(localReport.infos.map(item => item.code)).toContain('plan.references.chapter-local');
  });

  it('rejects unknown encounter archetypes and regions', () => {
    const unknownArchetype = clonePlan();
    unknownArchetype.encounters = [{
      id: 'encounter.test.wave', regionId: 'region.test.entry', archetypes: ['dragon'],
    }];
    expect(codes(unknownArchetype)).toContain('plan.encounter.archetype.unknown');

    const unknownRegion = clonePlan();
    unknownRegion.encounters = [{
      id: 'encounter.test.wave', regionId: 'region.test.ghost', archetypes: ['affinity'],
    }];
    expect(codes(unknownRegion)).toContain('plan.encounter.region-missing');
  });

  it('reports missing and malformed plan files with typed diagnostics', () => {
    const missing = validateStagePlanFile(
      path.join(chaptersParent, 'does-not-exist', STAGE_PLAN_FILENAME),
      nodeChapterFileSystem,
    );
    expect(missing.ok).toBe(false);
    expect(missing.diagnostics.map(item => item.code)).toEqual(['plan.missing']);

    const malformed = validateStagePlanFile(
      path.join(__dirname, '..', '..', 'package.json'),
      { ...nodeChapterFileSystem, readFile: () => '{not-json' },
      'package.json',
    );
    expect(malformed.ok).toBe(false);
    expect(malformed.diagnostics.map(item => item.code)).toEqual(['plan.json-invalid']);
  });

  describe('CLI', () => {
    const slug = `plan-test-cli-${process.pid}`;
    const tempRoot = path.join(chaptersParent, slug);
    fs.mkdirSync(tempRoot, { recursive: true });
    const chaptersArg = path.relative(repoRoot, chaptersParent);

    afterAll(() => {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    });

    it('parses plan validate usage', () => {
      expect(parseChapterCliArguments(['plan', 'validate', 'minha-fase'])).toMatchObject({
        command: 'plan', planAction: 'validate', slug: 'minha-fase', json: false,
      });
      expect(parseChapterCliArguments(['plan', 'validate', 'minha-fase', '--json'])).toMatchObject({
        command: 'plan', planAction: 'validate', json: true,
      });
      for (const argv of [
        ['plan'],
        ['plan', 'unknown', 'x'],
        ['plan', 'validate'],
        ['plan', 'validate', 'x', '--visual'],
      ]) {
        expect(() => parseChapterCliArguments(argv)).toThrow(ChapterCliError);
      }
    });

    it('validates the example plan through the CLI with deterministic JSON', () => {
      const first = runRaw(['plan', 'validate', 'igapo-das-memorias', '--json']);
      const second = runRaw(['plan', 'validate', 'igapo-das-memorias', '--json']);
      expect(first.code).toBe(0);
      expect(first.errors).toBe('');
      expect(first.output.startsWith('{')).toBe(true);
      expect(second.output).toBe(first.output);
      const report = JSON.parse(first.output) as StagePlanValidationReport;
      expect(report).toMatchObject({
        kind: 'umbra.stage-plan.validation',
        ok: true,
        planPath: 'src/examples/chapters/igapo-das-memorias/stage-plan.json',
      });
      expect(report.summary.regions).toBe(5);

      const text = runRaw(['plan', 'validate', 'igapo-das-memorias']);
      expect(text.code).toBe(0);
      expect(text.output).toContain('Plan: plan.aguas.igapo-das-memorias');
      expect(text.output).toContain('Result: OK');
      expect(text.output).toContain('Phaser assets: not executed');
    });

    it('returns code 1 for a missing plan and for malformed JSON', () => {
      const missing = runRaw(['plan', 'validate', slug, '--chapters-dir', chaptersArg]);
      expect(missing.code).toBe(1);
      expect(missing.output).toContain('plan.missing');

      const brokenRoot = path.join(chaptersParent, `plan-broken-${process.pid}`);
      fs.mkdirSync(brokenRoot, { recursive: true });
      try {
        fs.writeFileSync(path.join(brokenRoot, STAGE_PLAN_FILENAME), '{broken', 'utf8');
        const broken = runRaw([
          'plan', 'validate', path.basename(brokenRoot), '--chapters-dir', chaptersArg,
        ]);
        expect(broken.code).toBe(1);
        expect(broken.output).toContain('plan.json-invalid');
      } finally {
        fs.rmSync(brokenRoot, { recursive: true, force: true });
      }
    });

    it('keeps the Etapa 9.9 capabilities command working', () => {
      const capabilities = runRaw(['capabilities', '--json']);
      expect(capabilities.code).toBe(0);
      expect(JSON.parse(capabilities.output)).toMatchObject({
        schemaVersion: 1,
        kind: 'umbra.stage-authoring.capabilities',
      });
      expect(JSON.parse(capabilities.output).runtimeProfile.counts.total).toBeGreaterThan(0);
    });
  });
});
