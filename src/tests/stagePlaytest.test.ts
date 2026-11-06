import fs from 'node:fs';
import path from 'node:path';
import {
  PLAYTEST_MAXIMUM_SEEDS,
  createTemplateStagePlan,
  nodeChapterFileSystem,
  parseChapterCliArguments,
  playtestChapter,
  runChapterCli,
  ChapterCliError,
  type PlaytestChapterReport,
  type StagePlan,
} from '../cli/chapter';
import {
  createChapterTemplate,
  type ChapterTemplate,
} from '../examples/chapter-template';
import {
  CORACAO_CORROMPIDO_STAGE_ID,
  IGAPO_DAS_MEMORIAS_STAGE,
  PLAYTEST_CHARACTER,
  StageLoader,
  StagePlaytestValidator,
  StageRegistry,
  type StageModule,
  type StagePlaytestSeedReport,
} from '../stages';

jest.setTimeout(180_000);

const repoRoot = process.cwd();
const chaptersParent = path.join(repoRoot, 'src', 'examples', 'chapters');
const tempRoot = path.join(chaptersParent, `.tmp-playtest-${process.pid}`);
const chaptersArg = path.relative(repoRoot, tempRoot);

const WALL = 1;
const WATER = 3;
const FLOOR = 0;
const SPAWN = 8;
const EXIT = 5;

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

function run(argv: readonly string[]) {
  return runRaw([...argv, '--chapters-dir', chaptersArg]);
}

function loadTemplate(template: ChapterTemplate) {
  const registry = new StageRegistry();
  registry.registerChapter(template.chapter, [template.stage]);
  const loaded = new StageLoader(registry).load({
    stageId: template.stage.manifest.id,
    runId: `run.${template.namespace}.playtest`,
    runSeed: `seed.${template.namespace}.playtest`,
  });
  if (!loaded.ok) throw new Error(JSON.stringify(loaded.error));
  return loaded.value;
}

function playtest(
  template: ChapterTemplate,
  options: {
    readonly stage?: StageModule;
    readonly plan?: StagePlan;
    readonly routes?: ChapterTemplate['geometry']['routes'];
  } = {},
): StagePlaytestSeedReport {
  const loaded = loadTemplate(template);
  return new StagePlaytestValidator().validate({
    stage: options.stage ?? template.stage,
    level: options.stage?.authoredLevel ?? loaded.level,
    encounter: loaded.encounter,
    plan: options.plan ?? createTemplateStagePlan(template),
    routes: options.routes ?? template.geometry.routes,
  });
}

function codes(report: StagePlaytestSeedReport): readonly string[] {
  return report.checks.filter(check => check.status !== 'PASS').map(check => check.code);
}

function cloneMap(stage: StageModule): number[][] {
  const level = stage.authoredLevel;
  if (!level) throw new Error('Fixture requires an authored level.');
  return level.tileMap.map(row => [...row]);
}

function withMap(stage: StageModule, tileMap: number[][]): StageModule {
  const level = stage.authoredLevel;
  if (!level) throw new Error('Fixture requires an authored level.');
  return Object.freeze({
    ...stage,
    authoredLevel: Object.freeze({ ...level, tileMap }),
  });
}

function ring(map: number[][], center: { readonly x: number; readonly y: number }, radius: number): void {
  for (let y = center.y - radius; y <= center.y + radius; y += 1) {
    for (let x = center.x - radius; x <= center.x + radius; x += 1) {
      if (Math.max(Math.abs(x - center.x), Math.abs(y - center.y)) !== radius) continue;
      if (y <= 0 || x <= 0 || y >= map.length - 1 || x >= map[0].length - 1) continue;
      map[y][x] = WALL;
    }
  }
}

function findWaterBlock(map: readonly (readonly number[])[], size = 4): { x: number; y: number } | undefined {
  for (let y = 1; y + size < map.length - 1; y += 1) {
    for (let x = 1; x + size < map[0].length - 1; x += 1) {
      let water = true;
      for (let dy = 0; dy < size && water; dy += 1) {
        for (let dx = 0; dx < size; dx += 1) {
          if (map[y + dy][x + dx] !== WATER) {
            water = false;
            break;
          }
        }
      }
      if (water) return { x, y };
    }
  }
  return undefined;
}

function withExitCondition(stage: StageModule, flag: string): StageModule {
  return Object.freeze({
    ...stage,
    manifest: Object.freeze({
      ...stage.manifest,
      exits: stage.manifest.exits.map((exit, index) => index === 0
        ? Object.freeze({
            ...exit,
            condition: Object.freeze({ type: 'flag.equals' as const, flag, value: true }),
          })
        : exit),
    }),
    narrative: Object.freeze({
      ...stage.narrative,
      flags: Object.freeze({ ...(stage.narrative?.flags ?? {}), [flag]: false }),
    }),
  });
}

function withoutMissionStart(stage: StageModule): StageModule {
  return Object.freeze({
    ...stage,
    dialogues: Object.freeze((stage.dialogues ?? []).map(dialogue => Object.freeze({
      ...dialogue,
      nodes: Object.freeze(dialogue.nodes.map(node => Object.freeze({
        ...node,
        ...(node.onEnter
          ? { onEnter: Object.freeze(node.onEnter.filter(command => command.type !== 'mission.start')) }
          : {}),
        ...(node.choices
          ? {
              choices: Object.freeze(node.choices.map(choice => Object.freeze({
                ...choice,
                ...(choice.commands
                  ? {
                      commands: Object.freeze(
                        choice.commands.filter(command => command.type !== 'mission.start'),
                      ),
                    }
                  : {}),
              }))),
            }
          : {}),
      }))),
    }))),
  });
}

function narrowStage(): StageModule {
  const base = createChapterTemplate('test.playtest.narrow').stage;
  const level = base.authoredLevel;
  if (!level) throw new Error('Fixture requires an authored level.');
  const tileMap = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, SPAWN, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, EXIT, FLOOR, 1],
    [1, FLOOR, FLOOR, FLOOR, WALL, WALL, WALL, FLOOR, FLOOR, 1],
    [1, FLOOR, FLOOR, FLOOR, WALL, WALL, WALL, FLOOR, FLOOR, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ];
  const exitId = 'exit.test.playtest.narrow';
  return Object.freeze({
    manifest: Object.freeze({
      schemaVersion: 1 as const,
      id: 'stage.test.playtest.narrow',
      revision: 1,
      chapterId: 'chapter.test.playtest.narrow',
      order: 0,
      title: 'Corredor estreito',
      summary: 'Fixture de passagem estreita para o playtest.',
      layout: Object.freeze({ kind: 'authored' as const }),
      exits: Object.freeze([Object.freeze({
        id: exitId,
        anchor: Object.freeze({ kind: 'tile' as const, x: 7, y: 1 }),
        targetStageId: 'campaign.complete' as const,
      })]),
    }),
    authoredLevel: Object.freeze({
      ...level,
      id: 'stage.test.playtest.narrow',
      tileMap,
      enemies: [],
      items: [],
      decorations: [],
    }),
    events: Object.freeze([Object.freeze({
      id: 'event.test.playtest.narrow.depart',
      once: true,
      when: 'stage.exit.requested' as const,
      filter: Object.freeze({ field: 'exitId' as const, equals: exitId }),
      commands: Object.freeze([Object.freeze({
        type: 'stage.complete' as const,
        exitId,
      })]),
    })]),
  });
}

describe('Etapa 9.12 automated gameplay validation', () => {
  beforeAll(() => {
    fs.mkdirSync(tempRoot, { recursive: true });
    const horizontal = run(['create', 'pt-horizontal', '--template', 'horizontal', '--seed', '42']);
    if (horizontal.code !== 0) throw new Error(horizontal.errors);
    const branched = run(['create', 'pt-branched', '--template', 'branched', '--seed', '7']);
    if (branched.code !== 0) throw new Error(branched.errors);
  });

  afterAll(() => {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  it('exposes the real scaled player body used by the validator', () => {
    expect(PLAYTEST_CHARACTER).toMatchObject({
      tileSize: 32,
      sourceBodyWidth: 42,
      sourceBodyHeight: 58,
      bodyWidth: 29,
      bodyHeight: 39,
      sampleStep: 8,
    });
  });

  it('passes a continuous horizontal panorama', () => {
    const template = createChapterTemplate('test.playtest.horizontal', {
      template: 'horizontal', seed: 42,
    });
    const report = playtest(template);
    expect(report.result).toBe('PASS');
    expect(report.checks.find(check => check.code === 'NAVIGATION_PATH_CLEAR')?.status).toBe('PASS');
    expect(report.checks.find(check => check.code === 'EXIT_REACHABLE')?.status).toBe('PASS');
    expect(report.checks.find(check => check.code === 'CAMERA_BOUNDS_VALID')?.status).toBe('PASS');
    expect(report.checks.find(check => check.code === 'PROGRESSION_CONDITION_MET')?.status).toBe('PASS');
    expect(report.regions).toHaveLength(5);
    expect(report.regions.every(region => region.status === 'PASS')).toBe(true);
    expect(report.regions.every(region => region.distance !== null)).toBe(true);
    expect(report.checks.find(check => check.code === 'PLAYTEST_LIVE_EXECUTION_UNVERIFIED'))
      .toMatchObject({ status: 'UNKNOWN', required: false });
    expect(report.liveExecution).toBe('not-executed');
  });

  it('verifies both physical paths of the branched panorama', () => {
    const template = createChapterTemplate('test.playtest.branched', {
      template: 'branched', seed: 7,
    });
    const report = playtest(template);
    expect(report.result).toBe('PASS');
    const present = new Set(report.checks.map(check => check.code));
    expect(present.has('BRANCH_GRAPH_PRESENT')).toBe(true);
    expect(present.has('BRANCH_PATH_CLEAR')).toBe(true);
    expect(present.has('BRANCH_MAIN_PATH_CLEAR')).toBe(true);
    expect(present.has('BRANCH_RETURN_CLEAR')).toBe(true);
    expect(report.regions.map(region => region.id)).toEqual(expect.arrayContaining([
      expect.stringMatching(/\.split$/),
      expect.stringMatching(/\.branch$/),
      expect.stringMatching(/\.rejoin$/),
    ]));
  });

  it('is deterministic for the same input', () => {
    const template = createChapterTemplate('test.playtest.deterministic', {
      template: 'branched', seed: 11,
    });
    const first = playtest(template);
    const second = playtest(template);
    expect(JSON.stringify(second)).toBe(JSON.stringify(first));
  });

  it('detects a temporary obstruction and passes again after restoration', () => {
    const template = createChapterTemplate('test.playtest.blocked', {
      template: 'horizontal', seed: 42,
    });
    const before = playtest(template);
    expect(before.result).toBe('PASS');

    const map = cloneMap(template.stage);
    const column = Math.floor(map[0].length / 2);
    for (let y = 1; y < map.length - 1; y += 1) map[y][column] = WALL;
    const blocked = playtest(template, {
      stage: withMap(template.stage, map),
    });
    expect(blocked.result).toBe('FAIL');
    expect(codes(blocked)).toContain('EXIT_UNREACHABLE');
    expect(blocked.diagnostics.some(item => item.severity === 'error')).toBe(true);

    const restored = playtest(template);
    expect(restored.result).toBe('PASS');
  });

  it('detects a passage too narrow for the real body', () => {
    const report = new StagePlaytestValidator().validate({ stage: narrowStage() });
    expect(report.result).toBe('FAIL');
    expect(codes(report)).toContain('PASSAGE_TOO_NARROW');
    const narrow = report.checks.find(check => check.code === 'PASSAGE_TOO_NARROW');
    expect(narrow?.status).toBe('FAIL');
    expect(narrow?.location).toBeDefined();
  });

  it('detects a sealed objective region and a sealed exit', () => {
    const template = createChapterTemplate('test.playtest.pocket', {
      template: 'horizontal', seed: 42,
    });
    const plan = createTemplateStagePlan(template);
    const map = cloneMap(template.stage);
    const block = findWaterBlock(map);
    if (!block) throw new Error('Fixture has no water block for the sealed pocket.');
    map[block.y + 1][block.x + 1] = FLOOR;
    map[block.y + 1][block.x + 2] = FLOOR;
    map[block.y + 2][block.x + 1] = FLOOR;
    map[block.y + 2][block.x + 2] = FLOOR;
    const pocketPlan: StagePlan = {
      ...plan,
      regions: [...plan.regions, {
        id: 'region.test.playtest.pocket',
        title: 'Bolso selado',
        role: 'objective',
        anchor: { x: block.x + 1, y: block.y + 1 },
        connections: [],
      }],
      objectives: [...plan.objectives, {
        id: 'objective.test.playtest.pocket',
        title: 'Alcançar o bolso selado',
        regionId: 'region.test.playtest.pocket',
      }],
    };
    const pocket = playtest(template, {
      stage: withMap(template.stage, map),
      plan: pocketPlan,
    });
    expect(pocket.result).toBe('FAIL');
    expect(codes(pocket)).toContain('OBJECTIVE_UNREACHABLE');

    const exitMap = cloneMap(template.stage);
    ring(exitMap, template.geometry.exit, 4);
    const sealedExit = playtest(template, {
      stage: withMap(template.stage, exitMap),
    });
    expect(sealedExit.result).toBe('FAIL');
    expect(codes(sealedExit)).toContain('EXIT_UNREACHABLE');
  });

  it('detects a blocked secondary route without breaking the main path', () => {
    const template = createChapterTemplate('test.playtest.branch-blocked', {
      template: 'branched', seed: 7,
    });
    const branchRoute = template.geometry.routes.branch;
    if (!branchRoute || branchRoute.length === 0) throw new Error('Fixture has no branch route.');
    const midpoint = branchRoute[Math.floor(branchRoute.length / 2)];
    const map = cloneMap(template.stage);
    for (let y = midpoint.y - 3; y <= midpoint.y + 3; y += 1) {
      if (y > 0 && y < map.length - 1) map[y][midpoint.x] = WALL;
    }
    const report = playtest(template, { stage: withMap(template.stage, map) });
    expect(report.result).toBe('FAIL');
    expect(codes(report)).toContain('BRANCH_PATH_BLOCKED');
    expect(report.checks.find(check => check.code === 'EXIT_REACHABLE')?.status).toBe('PASS');
    expect(playtest(template).result).toBe('PASS');
  });

  it('detects impossible exit conditions and unstartable missions', () => {
    const template = createChapterTemplate('test.playtest.progression', {
      template: 'horizontal', seed: 42,
    });
    const impossible = playtest(template, {
      stage: withExitCondition(template.stage, 'flag.test.playtest.never'),
    });
    expect(impossible.result).toBe('FAIL');
    expect(codes(impossible)).toContain('PROGRESSION_CONDITION_UNMET');

    const unstartable = playtest(template, {
      stage: withoutMissionStart(template.stage),
    });
    expect(unstartable.result).toBe('FAIL');
    expect(codes(unstartable)).toContain('PROGRESSION_OBJECTIVE_UNSTARTABLE');
    expect(codes(unstartable)).toContain('PROGRESSION_CONDITION_UNMET');
  });

  it('validates the real Igapó stage without regressing it', () => {
    const report = new StagePlaytestValidator().validate({
      stage: IGAPO_DAS_MEMORIAS_STAGE,
      chapterStageIds: [
        IGAPO_DAS_MEMORIAS_STAGE.manifest.id,
        CORACAO_CORROMPIDO_STAGE_ID,
      ],
    });
    expect(report.result).toBe('PASS');
    expect(report.checks.find(check => check.code === 'EXIT_REACHABLE')?.status).toBe('PASS');
    expect(report.camera.status).toBe('PASS');
  });

  describe('CLI', () => {
    it('evaluates a reproducible seed range and reproduces one seed', () => {
      const multi = run(['playtest', 'pt-horizontal', '--seeds', '5', '--json']);
      expect(multi.code).toBe(0);
      const report = JSON.parse(multi.output) as PlaytestChapterReport;
      expect(report.schemaVersion).toBe(1);
      expect(report.kind).toBe('umbra.stage-playtest.report');
      expect(report.result).toBe('PASS');
      expect(report.seeds.map(seed => seed.seed)).toEqual([42, 43, 44, 45, 46]);
      expect(report.seeds.every(seed => seed.result === 'PASS')).toBe(true);
      expect(report.summary).toMatchObject({ seeds: 5, passed: 5, failed: 0, unknown: 0 });
      expect(report.runtime).toEqual({ phaser: 'not-executed', liveExecution: 'UNKNOWN' });
      expect(report.seeds[0].character).toEqual(PLAYTEST_CHARACTER);
      expect(report.seeds[0].plan.source).toBe('file');
      expect(report.seeds[1].plan.source).toBe('generated');
      expect(report.seeds[0].regions).toHaveLength(5);
      expect(report.seeds[0].checks.some(check => check.code === 'EXIT_REACHABLE')).toBe(true);

      const single = run(['playtest', 'pt-horizontal', '--seed', '44', '--json']);
      expect(single.code).toBe(0);
      const singleReport = JSON.parse(single.output) as PlaytestChapterReport;
      expect(singleReport.seeds).toHaveLength(1);
      expect(singleReport.seeds[0].seed).toBe(44);
      expect(singleReport.seeds[0].source).toBe('explicit');
      expect(singleReport.seeds[0].checks).toEqual(report.seeds[2].checks);
      expect(singleReport.result).toBe('PASS');
    });

    it('is deterministic across identical CLI invocations and does not modify the chapter', () => {
      const indexPath = path.join(tempRoot, 'pt-branched', 'index.ts');
      const before = fs.readFileSync(indexPath, 'utf8');
      const first = run(['playtest', 'pt-branched', '--seeds', '4', '--json']);
      const second = run(['playtest', 'pt-branched', '--seeds', '4', '--json']);
      expect(first.code).toBe(0);
      expect(second.output).toBe(first.output);
      expect(fs.readFileSync(indexPath, 'utf8')).toBe(before);
      const report = JSON.parse(first.output) as PlaytestChapterReport;
      expect(report.seeds.map(seed => seed.seed)).toEqual([7, 8, 9, 10]);
      expect(report.seeds.every(seed => seed.result === 'PASS')).toBe(true);
    });

    it('keeps existing validation, plan and preview commands working', () => {
      expect(run(['validate', 'pt-horizontal']).code).toBe(0);
      expect(run(['plan', 'validate', 'pt-horizontal', '--json']).code).toBe(0);
      expect(run(['preview', 'pt-horizontal']).code).toBe(0);
      expect(run(['inspect', 'pt-horizontal', '--json']).code).toBe(0);
    });

    it('reports usage errors and missing chapters', () => {
      expect(run(['playtest', 'pt-horizontal', '--seeds', '0']).code).toBe(2);
      expect(run(['playtest', 'pt-horizontal', '--seeds', `${PLAYTEST_MAXIMUM_SEEDS + 1}`]).code).toBe(2);
      expect(run(['playtest', 'pt-horizontal', '--seed', '1', '--seeds', '2']).code).toBe(2);
      expect(run(['playtest']).code).toBe(2);
      expect(run(['validate', 'pt-horizontal', '--json']).code).toBe(2);
      const missing = run(['playtest', 'does-not-exist']);
      expect(missing.code).toBe(1);
      expect(missing.errors).toContain('chapter-not-found');
    });

    it('parses playtest seeds and keeps them isolated from other commands', () => {
      expect(parseChapterCliArguments(['playtest', 'x', '--seeds', '5'])).toMatchObject({
        command: 'playtest',
        slug: 'x',
        seeds: 5,
      });
      expect(parseChapterCliArguments(['playtest', 'x', '--seed', '42'])).toMatchObject({
        command: 'playtest',
        seed: 42,
      });
      try {
        parseChapterCliArguments(['validate', 'x', '--seed', '1']);
        throw new Error('Expected a usage error.');
      } catch (error) {
        expect(error).toBeInstanceOf(ChapterCliError);
        expect((error as ChapterCliError).code).toBe('usage.unknown-option');
      }
    });

    it('identifies the failing configuration in a seed range', () => {
      const base = createChapterTemplate('test.playtest.seed-failure', {
        template: 'horizontal', seed: 42,
      });
      const factory = (namespace: string, options?: Parameters<typeof createChapterTemplate>[1]) => {
        const variant = createChapterTemplate(namespace, options);
        if (options?.seed !== 43) return variant;
        const level = variant.stage.authoredLevel;
        if (!level) return variant;
        const tileMap = level.tileMap.map(row => [...row]);
        const column = Math.floor(tileMap[0].length / 2);
        for (let y = 1; y < tileMap.length - 1; y += 1) tileMap[y][column] = WALL;
        const stage: StageModule = {
          ...variant.stage,
          authoredLevel: { ...level, tileMap },
        };
        return {
          ...variant,
          stage,
          entry: { ...variant.entry, stages: [stage] },
        };
      };
      const report = playtestChapter({
        module: { CHAPTER_TEMPLATE: base, createChapterTemplate: factory },
        chapterDir: path.join(tempRoot, 'does-not-exist'),
        planDisplayPath: 'stage-plan.json',
        fileSystem: { ...nodeChapterFileSystem, exists: () => false },
        seeds: 3,
      });
      expect(report.result).toBe('FAIL');
      expect(report.seeds.map(seed => seed.result)).toEqual(['PASS', 'FAIL', 'PASS']);
      expect(report.summary).toMatchObject({ seeds: 3, passed: 2, failed: 1 });
      const failed = report.seeds[1];
      expect(failed.seed).toBe(43);
      expect(failed.diagnostics.map(item => item.code)).toEqual(expect.arrayContaining([
        'EXIT_UNREACHABLE',
      ]));
      expect(failed.regions.some(region => region.status === 'FAIL')).toBe(true);
    });

    it('parses browser homologation targets', () => {
      expect(parseChapterCliArguments(['homologate', 'minha-fase', '--json'])).toMatchObject({
        command: 'homologate',
        slug: 'minha-fase',
        json: true,
      });
      expect(parseChapterCliArguments([
        'homologate', '--stage', 'stage.aguas.igapo-das-memorias',
        '--variant', 'variant.aguas.igapo-sombrio', '--json',
      ])).toMatchObject({
        command: 'homologate',
        stageId: 'stage.aguas.igapo-das-memorias',
        variantId: 'variant.aguas.igapo-sombrio',
        json: true,
      });
      expect(() => parseChapterCliArguments([
        'homologate', 'minha-fase', '--stage', 'stage.aguas.igapo-das-memorias',
      ])).toThrow(ChapterCliError);
      expect(() => parseChapterCliArguments(['homologate'])).toThrow(ChapterCliError);
      expect(parseChapterCliArguments([
        'homologate', '--campaign', '--macro-run', 'run.test', '--macro-seed', 'seed.test', '--json',
      ])).toMatchObject({
        command: 'homologate',
        campaign: true,
        macroRunId: 'run.test',
        macroRunSeed: 'seed.test',
        json: true,
      });
      expect(() => parseChapterCliArguments(['homologate', '--campaign', 'minha-fase']))
        .toThrow(ChapterCliError);
    });

    it('declares multi-seed UNKNOWN when the chapter has no seed factory', () => {
      const template = createChapterTemplate('test.playtest.unsupported', {
        template: 'horizontal', seed: 42,
      });
      const report = playtestChapter({
        module: { CHAPTER_TEMPLATE: template },
        chapterDir: path.join(tempRoot, 'does-not-exist'),
        planDisplayPath: 'stage-plan.json',
        fileSystem: { ...nodeChapterFileSystem, exists: () => false },
        seeds: 2,
      });
      expect(report.result).toBe('UNKNOWN');
      expect(report.seeds[0].result).toBe('PASS');
      expect(report.seeds[1].result).toBe('UNKNOWN');
      expect(report.seeds[1].checks.map(check => check.code)).toContain('PLAYTEST_SEED_UNSUPPORTED');
    });
  });
});
