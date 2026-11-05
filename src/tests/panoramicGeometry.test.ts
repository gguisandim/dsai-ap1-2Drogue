import fs from 'node:fs';
import path from 'node:path';
import {
  createTemplateStagePlan,
  runChapterCli,
  validateStagePlan,
  type StagePlan,
} from '../cli/chapter';
import {
  createChapterTemplate,
  TEMPLATE_EXIT_POSITION,
  TEMPLATE_MAP_HEIGHT,
  TEMPLATE_MAP_WIDTH,
  TEMPLATE_NPC_POSITION,
  TEMPLATE_SPAWN,
  type ChapterTemplate,
  type TemplateGeometryPoint,
} from '../examples/chapter-template';
import { StageLoader, StageRegistry } from '../stages';

const WALKABLE = new Set([0, 5, 6, 7, 8, 9]);

function reachable(
  map: readonly (readonly number[])[],
  start: TemplateGeometryPoint,
): ReadonlySet<string> {
  const width = map[0]?.length ?? 0;
  const height = map.length;
  const visited = new Set<string>([`${start.x},${start.y}`]);
  const queue: TemplateGeometryPoint[] = [start];
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const point = queue[cursor];
    ([[0, -1], [1, 0], [0, 1], [-1, 0]] as const).forEach(([dx, dy]) => {
      const next = { x: point.x + dx, y: point.y + dy };
      const key = `${next.x},${next.y}`;
      if (next.x < 0 || next.y < 0 || next.x >= width || next.y >= height) return;
      if (visited.has(key) || !WALKABLE.has(map[next.y][next.x])) return;
      visited.add(key);
      queue.push(next);
    });
  }
  return visited;
}

function loadTemplate(template: ChapterTemplate) {
  const registry = new StageRegistry();
  registry.registerChapter(template.chapter, [template.stage]);
  const loaded = new StageLoader(registry).load({
    stageId: template.stage.manifest.id,
    runId: `run.${template.namespace}.geometry`,
    runSeed: `seed.${template.namespace}.geometry`,
  });
  if (!loaded.ok) throw new Error(JSON.stringify(loaded.error));
  return loaded.value;
}

function runRaw(argv: readonly string[]): {
  readonly code: number;
  readonly output: string;
  readonly errors: string;
} {
  const output: string[] = [];
  const errors: string[] = [];
  const code = runChapterCli(argv, {
    repoRoot: process.cwd(),
    print: line => output.push(line),
    printError: line => errors.push(line),
  });
  return { code, output: output.join('\n'), errors: errors.join('\n') };
}

function planGraphHasCycle(plan: StagePlan): boolean {
  const adjacency = new Map<string, Set<string>>();
  plan.regions.forEach(region => adjacency.set(region.id, new Set()));
  plan.regions.forEach(region => region.connections.forEach(connection => {
    adjacency.get(region.id)?.add(connection);
    adjacency.get(connection)?.add(region.id);
  }));
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const visit = (node: string, parent?: string): boolean => {
    if (visiting.has(node)) return true;
    if (visited.has(node)) return false;
    visiting.add(node);
    for (const next of adjacency.get(node) ?? []) {
      if (next !== parent && visit(next, node)) return true;
    }
    visiting.delete(node);
    visited.add(node);
    return false;
  };
  return [...adjacency.keys()].some(id => visit(id));
}

describe('Etapa 9.11 panoramic geometry templates', () => {
  it('preserves the room template and its unchanged 19x11 map', () => {
    const template = createChapterTemplate('test.geometry.room');
    expect(template.geometry.template).toBe('room');
    expect(template.geometry.width).toBe(TEMPLATE_MAP_WIDTH);
    expect(template.geometry.height).toBe(TEMPLATE_MAP_HEIGHT);
    expect(template.geometry.tileMap).toHaveLength(TEMPLATE_MAP_HEIGHT);
    expect(template.geometry.tileMap.every(row => row.length === TEMPLATE_MAP_WIDTH)).toBe(true);
    expect(template.geometry.spawn).toEqual(TEMPLATE_SPAWN);
    expect(template.geometry.exit).toEqual(TEMPLATE_EXIT_POSITION);
    expect(template.geometry.npc).toEqual(TEMPLATE_NPC_POSITION);
    expect(template.geometry.tileMap[TEMPLATE_NPC_POSITION.y][TEMPLATE_NPC_POSITION.x]).toBe(0);
    expect(template.geometry.regions.map(region => region.role)).toEqual([
      'start', 'objective', 'exit',
    ]);
  });

  it('generates a deterministic continuous horizontal panorama', () => {
    const options = { template: 'horizontal' as const, seed: 42 };
    const first = createChapterTemplate('test.geometry.horizontal', options);
    const second = createChapterTemplate('test.geometry.horizontal', options);
    expect(first.geometry).toEqual(second.geometry);
    expect(first.geometry.tileMap).toHaveLength(30);
    expect(first.geometry.tileMap.every(row => row.length === 96)).toBe(true);
    expect(first.stage.manifest.tags).toContain('template.horizontal');
    expect(first.geometry.regions).toHaveLength(5);
    expect(new Set(first.geometry.routes.main.map(point => point.y)).size).toBeGreaterThan(3);

    const reachableTiles = reachable(first.geometry.tileMap, first.geometry.spawn);
    expect(reachableTiles.has(`${first.geometry.exit.x},${first.geometry.exit.y}`)).toBe(true);
    first.geometry.regions.forEach(region => {
      expect(reachableTiles.has(`${region.anchor.x},${region.anchor.y}`)).toBe(true);
      expect(WALKABLE.has(first.geometry.tileMap[region.anchor.y][region.anchor.x])).toBe(true);
    });
    first.geometry.routes.main.forEach(point => {
      expect(WALKABLE.has(first.geometry.tileMap[point.y][point.x])).toBe(true);
    });
    const loaded = loadTemplate(first);
    expect(loaded.level.tileMap).toEqual(first.geometry.tileMap);
    expect(loaded.manifest.exits[0].anchor).toMatchObject(first.geometry.exit);
  });

  it('generates a physical branch with a real region cycle', () => {
    const template = createChapterTemplate('test.geometry.branched', {
      template: 'branched', seed: 7,
    });
    expect(template.geometry.template).toBe('branched');
    expect(template.geometry.routes.branch).toBeDefined();
    const plan = createTemplateStagePlan(template);
    expect(plan.progression).toBe('branched');
    expect(plan.template).toBe('branched');
    expect(planGraphHasCycle(plan)).toBe(true);

    const reachableTiles = reachable(template.geometry.tileMap, template.geometry.spawn);
    template.geometry.routes.branch?.forEach(point => {
      expect(WALKABLE.has(template.geometry.tileMap[point.y][point.x])).toBe(true);
      expect(reachableTiles.has(`${point.x},${point.y}`)).toBe(true);
    });
    const split = template.geometry.regions.find(region => region.key === 'split');
    const branch = template.geometry.regions.find(region => region.key === 'branch');
    const rejoin = template.geometry.regions.find(region => region.key === 'rejoin');
    expect(split && branch && rejoin).toBeTruthy();
    if (!split || !branch || !rejoin) return;
    const mainAtMid = template.geometry.routes.main.find(point => point.x === branch.anchor.x);
    expect(mainAtMid).toBeDefined();
    expect(Math.abs((mainAtMid?.y ?? 0) - branch.anchor.y)).toBeGreaterThanOrEqual(2);
    expect(split.connections).toEqual(expect.arrayContaining(['rejoin', 'branch']));
    expect(branch.connections).toEqual(expect.arrayContaining(['split', 'rejoin']));
    expect(rejoin.connections).toEqual(expect.arrayContaining(['split', 'branch']));
    loadTemplate(template);
  });

  it('produces a plan that passes isolated and stage-correspondence validation', () => {
    for (const templateName of ['room', 'horizontal', 'branched'] as const) {
      const template = createChapterTemplate(`test.geometry.${templateName}.plan`, {
        template: templateName,
        ...(templateName === 'branched' ? { seed: 9 } : {}),
      });
      const plan = createTemplateStagePlan(template);
      expect(validateStagePlan(plan).ok).toBe(true);
      const withStage = validateStagePlan(plan, 'stage-plan.json', template.stage);
      expect(withStage.ok).toBe(true);
      expect(withStage.errors).toEqual([]);
      expect(plan.stageId).toBe(template.stage.manifest.id);
      expect(plan.chapterId).toBe(template.chapter.id);
      expect(plan.regions.every(region => region.anchor !== undefined)).toBe(true);
    }
  });

  it('reports plan/stage mismatches without demanding unimplemented narrative', () => {
    const template = createChapterTemplate('test.geometry.mismatch', {
      template: 'branched', seed: 11,
    });
    const plan = createTemplateStagePlan(template);
    const mutated = JSON.parse(JSON.stringify(plan)) as Record<string, any>;
    mutated.stageId = 'stage.test.geometry.other';
    mutated.regions[0].anchor = { x: 1, y: 1 };
    mutated.regions[1].anchor = { x: 999, y: 999 };
    const report = validateStagePlan(mutated, 'stage-plan.json', template.stage);
    expect(report.errors.map(item => item.code)).toEqual(expect.arrayContaining([
      'plan.stage-id.mismatch',
      'plan.region.anchor-not-walkable',
      'plan.region.anchor-out-of-bounds',
    ]));

    const withoutAnchors = {
      ...plan,
      regions: plan.regions.map(({ anchor: _anchor, ...region }) => region),
    };
    const pending = validateStagePlan(withoutAnchors, 'stage-plan.json', template.stage);
    expect(pending.ok).toBe(true);
    expect(pending.infos.map(item => item.code)).toContain('plan.region.anchor-pending');
  });

  describe('CLI', () => {
    const parentSlug = `panorama-tests-${process.pid}`;
    const parent = path.join(process.cwd(), 'src', 'examples', 'chapters', parentSlug);
    const chaptersArg = path.relative(process.cwd(), parent);
    fs.mkdirSync(parent, { recursive: true });

    afterAll(() => {
      fs.rmSync(parent, { recursive: true, force: true });
    });

    it('creates geometry and plan files for both panoramic templates', () => {
      const horizontal = runRaw([
        'create', 'h-a', '--template', 'horizontal', '--seed', '42',
        '--chapters-dir', chaptersArg,
      ]);
      expect(horizontal.code).toBe(0);
      const horizontalDir = path.join(parent, 'h-a');
      expect(fs.readdirSync(horizontalDir)).toEqual(expect.arrayContaining([
        'geometry.ts', 'stage-plan.json',
      ]));
      const plan = JSON.parse(
        fs.readFileSync(path.join(horizontalDir, 'stage-plan.json'), 'utf8'),
      ) as StagePlan;
      expect(plan).toMatchObject({ template: 'horizontal', progression: 'linear' });

      const branch = runRaw([
        'create', 'b-a', '--template', 'branched', '--seed', '42', '--width', '104',
        '--height', '32', '--regions', '6', '--chapters-dir', chaptersArg,
      ]);
      expect(branch.code).toBe(0);
      const branchPlan = JSON.parse(
        fs.readFileSync(path.join(parent, 'b-a', 'stage-plan.json'), 'utf8'),
      ) as StagePlan;
      expect(branchPlan).toMatchObject({ template: 'branched', progression: 'branched' });
      expect(branchPlan.regions).toHaveLength(6);

      for (const slug of ['h-a', 'b-a']) {
        const validated = runRaw(['plan', 'validate', slug, '--json', '--chapters-dir', chaptersArg]);
        expect(validated.code).toBe(0);
        expect(JSON.parse(validated.output)).toMatchObject({ ok: true });
        const chapter = runRaw(['validate', slug, '--chapters-dir', chaptersArg]);
        expect(chapter.code).toBe(0);
        expect(chapter.output).toContain('Result: OK');
      }
    });

    it('is deterministic across different slugs with the same seed', () => {
      const second = runRaw([
        'create', 'h-b', '--template', 'horizontal', '--seed', '42', '--chapters-dir', chaptersArg,
      ]);
      expect(second.code).toBe(0);
      const first = JSON.parse(
        fs.readFileSync(path.join(parent, 'h-a', 'stage-plan.json'), 'utf8'),
      ) as StagePlan;
      const duplicate = JSON.parse(
        fs.readFileSync(path.join(parent, 'h-b', 'stage-plan.json'), 'utf8'),
      ) as StagePlan;
      expect(first.regions.map(region => region.anchor)).toEqual(
        duplicate.regions.map(region => region.anchor),
      );
      const firstSource = fs.readFileSync(path.join(parent, 'h-a', 'geometry.ts'), 'utf8');
      const secondSource = fs.readFileSync(path.join(parent, 'h-b', 'geometry.ts'), 'utf8');
      expect(secondSource).toBe(firstSource);
    });

    it('creates a valid plan for the default room template without overwriting', () => {
      const created = runRaw(['create', 'room-a', '--chapters-dir', chaptersArg]);
      expect(created.code).toBe(0);
      const planFile = path.join(parent, 'room-a', 'stage-plan.json');
      const before = fs.readFileSync(planFile, 'utf8');
      const plan = JSON.parse(before) as StagePlan;
      expect(plan).toMatchObject({ template: 'room', progression: 'linear' });
      const validated = runRaw([
        'plan', 'validate', 'room-a', '--json', '--chapters-dir', chaptersArg,
      ]);
      expect(validated.code).toBe(0);
      expect(fs.readFileSync(planFile, 'utf8')).toBe(before);
    });

    it('rejects invalid geometry options with usage errors', () => {
      for (const argv of [
        ['create', 'bad-a', '--template', 'spiral', '--chapters-dir', chaptersArg],
        ['create', 'bad-b', '--template', 'horizontal', '--width', '10', '--chapters-dir', chaptersArg],
        ['create', 'bad-c', '--template', 'horizontal', '--regions', '2', '--chapters-dir', chaptersArg],
        ['create', 'bad-d', '--template', 'branched', '--regions', '4', '--chapters-dir', chaptersArg],
        ['create', 'bad-e', '--seed', '99999999999', '--chapters-dir', chaptersArg],
      ]) {
        const result = runRaw(argv);
        expect(result.code).toBe(2);
        expect(result.errors).toMatch(/usage\./);
        expect(fs.existsSync(path.join(parent, String(argv[1])))).toBe(false);
      }
    });
  });
});
