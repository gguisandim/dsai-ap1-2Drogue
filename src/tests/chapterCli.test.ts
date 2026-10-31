import fs from 'node:fs';
import path from 'node:path';
import {
  CHAPTER_CLI_HELP,
  ChapterCliError,
  createChapter,
  loadChapterModule,
  nodeChapterFileSystem,
  parseChapterCliArguments,
  runChapterCli,
  validateChapterEntry,
  type ChapterFileSystem,
  type LoadedChapterModule,
} from '../cli/chapter';
import {
  CAMPAIGN_CHAPTER_CATALOG,
  StageCatalogService,
  StageLoader,
  StageRegistry,
  registerCampaignChapters,
  type CampaignChapterEntry,
  type StageModule,
} from '../stages';
import {
  GameStageCompositionRoot,
  StageSignalAdapter,
} from '../application/stages';
import { MemorySaveStorage } from '../narrative';

const repoRoot = process.cwd();
const chaptersParent = path.join(repoRoot, 'src', 'examples', 'chapters');
fs.mkdirSync(chaptersParent, { recursive: true });
const tempRoot = fs.mkdtempSync(path.join(chaptersParent, '.tmp-cli-test-'));
const chaptersArg = path.relative(repoRoot, tempRoot);
const templateDir = path.join(repoRoot, 'src', 'examples', 'chapter-template');

type GeneratedTemplate = NonNullable<LoadedChapterModule['CHAPTER_TEMPLATE']>;

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

function run(argv: readonly string[]): {
  readonly code: number;
  readonly output: string;
  readonly errors: string;
} {
  return runRaw([...argv, '--chapters-dir', chaptersArg]);
}

function generatedTemplate(slug: string): GeneratedTemplate {
  const module = loadChapterModule(path.join(tempRoot, slug));
  if (!module.CHAPTER_TEMPLATE) throw new Error(`Generated module has no CHAPTER_TEMPLATE: ${slug}`);
  return module.CHAPTER_TEMPLATE;
}

function generatedEntry(slug: string): CampaignChapterEntry {
  return generatedTemplate(slug).entry;
}

function cloneLevelWithSecondSpawn(stage: StageModule): StageModule {
  const level = stage.authoredLevel;
  if (!level) throw new Error('Fixtures require an authored level.');
  const tileMap = level.tileMap.map(row => [...row]);
  let changed = false;
  for (let y = 1; y < tileMap.length - 1 && !changed; y += 1) {
    for (let x = 1; x < tileMap[y].length - 1; x += 1) {
      if (tileMap[y][x] === 0) {
        tileMap[y][x] = 8;
        changed = true;
        break;
      }
    }
  }
  if (!changed) throw new Error('No floor tile available for the second spawn.');
  return Object.freeze({
    ...stage,
    authoredLevel: Object.freeze({ ...level, tileMap }),
  });
}

function runNarrativeFlow(template: GeneratedTemplate) {
  const entry = template.entry;
  const stage = entry.stages[0];
  const npc = stage.npcs?.[0];
  const dialogue = stage.dialogues?.[0];
  const mission = stage.missions?.[0];
  const encounter = stage.encounter;
  const exit = stage.manifest.exits[0];
  if (!npc || !dialogue || !mission || !encounter || !exit) {
    throw new Error('Generated chapter is missing its narrative fixture.');
  }
  const beaconFlag = exit.condition?.type === 'flag.equals' ? exit.condition.flag : undefined;
  const registry = new StageRegistry();
  registerCampaignChapters(registry, [entry]);
  const composition = new GameStageCompositionRoot({
    registry,
    campaignStorage: new MemorySaveStorage(),
  });
  const loaded = composition.loader.load({
    stageId: stage.manifest.id,
    runId: `run.${template.namespace}.flow`,
    runSeed: `seed.${template.namespace}.flow`,
  });
  if (!loaded.ok) throw new Error(JSON.stringify(loaded.error));
  const created = composition.createNarrativeSession(
    loaded.value,
    {
      campaignId: `campaign.${template.namespace}.flow`,
      runId: `run.${template.namespace}.flow`,
      runSeed: `seed.${template.namespace}.flow`,
      stageInstanceId: `node.${template.namespace}.flow.1`,
    },
    { level: 1, unlockedContent: [] },
    `test.${template.namespace}.flow`,
  );
  if (!created.ok) throw new Error(JSON.stringify(created.error));
  const session = created.session;

  expect(session.enterStage().ok).toBe(true);
  expect(session.interactNpc(npc.id).ok).toBe(true);
  const started = session.startDialogue(dialogue.id);
  if (!started.ok || started.value.status !== 'active') throw new Error('Dialogue did not start.');
  const chosen = session.chooseDialogue(started.value.session, 'accept');
  if (!chosen.ok) throw new Error(JSON.stringify(chosen.error));
  expect(session.applyDialogueTurn(chosen.value).ok).toBe(true);
  expect(session.director.snapshot().missionStates[mission.id].status).toBe('active');

  const signals = new StageSignalAdapter(session);
  expect(signals.dispatch({
    type: 'encounter.completed',
    occurrenceId: 'flow.encounter',
    encounterId: encounter.id,
  }).ok).toBe(true);
  expect(session.director.snapshot().missionStates[mission.id].status).toBe('completed');
  expect(session.pendingRewardCommands()).toHaveLength(1);
  if (beaconFlag) expect(session.director.snapshot().flags[beaconFlag]).toBe(true);
  expect(session.director.snapshot().unlockedExitIds).toContain(exit.id);

  expect(session.requestExit(exit.id).ok).toBe(true);
  expect(session.stageCompletions()).toHaveLength(1);
  const [reward] = session.pendingRewardCommands();
  if (!reward || reward.type !== 'reward.grant') throw new Error('Missing pending reward.');
  expect(session.confirmOperation(reward.operationId).ok).toBe(true);
  expect(session.pendingRewardCommands()).toHaveLength(0);
  return { session, snapshot: session.director.snapshot(), reward };
}

describe('chapter authoring CLI', () => {
  beforeAll(() => {
    const alpha = run(['create', 'cli-alpha', '--title', 'CLI Alpha']);
    if (alpha.code !== 0) throw new Error(alpha.errors);
    const negative = run(['create', 'cli-negative', '--title', 'CLI Negative']);
    if (negative.code !== 0) throw new Error(negative.errors);
  });

  afterAll(() => {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  it('parses help, create options and inspect json', () => {
    expect(parseChapterCliArguments([]).command).toBe('help');
    expect(parseChapterCliArguments(['--help']).command).toBe('help');
    expect(parseChapterCliArguments([
      'create', 'floresta', '--title', 'Floresta', '--namespace', 'example.floresta', '--revision', '2',
    ])).toMatchObject({
      command: 'create',
      slug: 'floresta',
      title: 'Floresta',
      namespace: 'example.floresta',
      revision: 2,
      json: false,
    });
    expect(parseChapterCliArguments(['inspect', 'floresta', '--json'])).toMatchObject({
      command: 'inspect',
      json: true,
    });
    expect(CHAPTER_CLI_HELP).toContain('npm run chapter -- create');
  });

  it('rejects invalid usage', () => {
    expect(() => parseChapterCliArguments(['create'])).toThrow(ChapterCliError);
    expect(() => parseChapterCliArguments(['validate', 'x', '--json'])).toThrow(ChapterCliError);
    expect(() => parseChapterCliArguments(['unknown'])).toThrow(ChapterCliError);
  });

  it('creates, validates, inspects and previews a chapter', () => {
    const created = generatedTemplate('cli-alpha');
    expect(created.chapter.id).toBe('chapter.authoring.cli.alpha');
    expect(created.stage.manifest.id).toBe('stage.authoring.cli.alpha.approach');
    expect(created.chapter.title).toBe('CLI Alpha');

    const directory = path.join(tempRoot, 'cli-alpha');
    const files = fs.readdirSync(directory).sort();
    expect(files).toEqual(expect.arrayContaining([
      'AUTHORING.md', 'README.md', 'chapter.ts', 'encounter.ts', 'ids.ts', 'index.ts',
      'level.ts', 'narrative.ts', 'presentation.ts', 'registration.ts', 'stage.ts', 'template.ts',
    ]));
    const indexSource = fs.readFileSync(path.join(directory, 'index.ts'), 'utf8');
    expect(indexSource).toContain('createChapterTemplate("authoring.cli.alpha"');
    expect(indexSource).toContain('title: "CLI Alpha"');
    for (const file of files.filter(name => name.endsWith('.ts'))) {
      expect(fs.readFileSync(path.join(directory, file), 'utf8')).not.toContain('example.beacon');
    }

    const entry = created.entry;
    const report = validateChapterEntry(entry);
    expect(report.errors).toEqual([]);
    expect(report.individualAvailable).toBe(true);
    expect(report.campaignCandidate).toBe(false);
    expect(report.phaserAssets).toBe('not-executed');

    const registry = new StageRegistry();
    registerCampaignChapters(registry, [entry]);
    const catalog = StageCatalogService.create(registry);
    expect(catalog.ok).toBe(true);
    if (catalog.ok) {
      expect(catalog.value.get(created.ids.stageId)).toMatchObject({
        chapterId: created.ids.chapterId,
        eligibility: 'individual-only',
        loadability: 'loadable',
      });
      expect(catalog.value.eligible().some(item => item.stageId === created.ids.stageId)).toBe(false);
    }
    const loaded = new StageLoader(registry).load({
      stageId: created.ids.stageId,
      runId: 'run.cli-alpha.load',
      runSeed: 'seed.cli-alpha.load',
    });
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.value.level.id).toBe(created.ids.stageId);
    expect(loaded.value.encounter?.waves[0].enemies.map(enemy => enemy.type))
      .toEqual(['affinity', 'ranged']);
    expect(loaded.value.presentation?.themeId).toBe(created.ids.visual.themeId);

    const validated = run(['validate', 'cli-alpha']);
    expect(validated.code).toBe(0);
    expect(validated.output).toContain('Result: OK');
    expect(validated.output).toContain('Phaser assets: not executed');

    const inspected = run(['inspect', 'cli-alpha', '--json']);
    expect(inspected.code).toBe(0);
    const inspection = JSON.parse(inspected.output) as {
      chapter: { id: string; revision: number };
      stages: Array<{
        id: string;
        encounter: { enemyTypes: string[] } | null;
        presentation: { themeId: string; enemyArchetypes: string[] } | null;
        eligibility: string;
        loadability: string;
      }>;
      campaignCandidate: boolean;
      individualAvailable: boolean;
      diagnostics: Array<{ code: string; severity: string }>;
      runtime: { phaserAssets: string };
    };
    expect(inspection.chapter.id).toBe(created.ids.chapterId);
    expect(inspection.chapter.revision).toBe(1);
    expect(inspection.stages[0].id).toBe(created.ids.stageId);
    expect(inspection.stages[0].encounter?.enemyTypes).toEqual(['affinity', 'ranged']);
    expect(inspection.stages[0].presentation?.themeId).toBe(created.ids.visual.themeId);
    expect(inspection.stages[0].presentation?.enemyArchetypes).toEqual(['affinity', 'ranged']);
    expect(inspection.campaignCandidate).toBe(false);
    expect(inspection.individualAvailable).toBe(true);
    expect(inspection.runtime.phaserAssets).toBe('not-executed');

    const previewed = run(['preview', 'cli-alpha']);
    expect(previewed.code).toBe(0);
    expect(previewed.output).toContain('Preview: headless');
    expect(previewed.output).toContain(`Individual ${created.ids.stageId}: ready`);
    expect(previewed.output).toContain('World Lab: projected');
    expect(previewed.output).toContain('Phaser rendering: not executed');

    const flow = runNarrativeFlow(created);
    const mission = created.entry.stages[0].missions?.[0];
    if (!mission) throw new Error('Missing mission.');
    expect(flow.snapshot.missionStates[mission.id].status).toBe('completed');
    expect(flow.reward.reward).toEqual({ type: 'progression.currency', amount: 40 });

    expect(CAMPAIGN_CHAPTER_CATALOG.some(item => item.chapter.id === created.ids.chapterId)).toBe(false);
    expect(CAMPAIGN_CHAPTER_CATALOG.some(item =>
      item.stages.some(stage => stage.manifest.id === created.ids.stageId))).toBe(false);
  });

  it('creates a second independent chapter and both coexist', () => {
    const created = run([
      'create', 'cli-beta', '--title', 'CLI Beta', '--namespace', 'authoring.cli.beta', '--revision', '2',
    ]);
    expect(created.code).toBe(0);

    const alpha = generatedTemplate('cli-alpha');
    const beta = generatedTemplate('cli-beta');
    expect(alpha.entry.chapter.id).not.toBe(beta.entry.chapter.id);
    expect(alpha.entry.stages[0].manifest.id).not.toBe(beta.entry.stages[0].manifest.id);
    expect(beta.entry.chapter.revision).toBe(2);
    expect(beta.entry.stages[0].manifest.revision).toBe(2);

    const registry = new StageRegistry();
    registerCampaignChapters(registry, [alpha.entry, beta.entry]);
    const catalog = StageCatalogService.create(registry);
    expect(catalog.ok).toBe(true);
    if (catalog.ok) {
      expect(catalog.value.get(alpha.ids.stageId)?.manifestRevision).toBe(1);
      expect(catalog.value.get(beta.ids.stageId)?.manifestRevision).toBe(2);
    }

    const loader = new StageLoader(registry);
    for (const template of [alpha, beta]) {
      const loaded = loader.load({
        stageId: template.ids.stageId,
        runId: `run.${template.namespace}.coexist`,
        runSeed: `seed.${template.namespace}.coexist`,
      });
      expect(loaded.ok).toBe(true);
    }

    const flow = runNarrativeFlow(beta);
    const mission = beta.entry.stages[0].missions?.[0];
    if (!mission) throw new Error('Missing beta mission.');
    expect(flow.snapshot.missionStates[mission.id].status).toBe('completed');
  });

  it('rejects traversal, invalid names and unauthorized output roots', () => {
    for (const slug of ['../evil', 'a/../../b', 'Bad Name', '.hidden', '-leading']) {
      const result = run(['create', slug]);
      expect(result.code).toBe(2);
      expect(result.errors).toMatch(/usage\./);
    }
    expect(fs.existsSync(path.join(tempRoot, '..', 'evil'))).toBe(false);
    expect(run(['create', 'cli-bad-namespace', '--namespace', '../evil']).code).toBe(2);

    const outside = path.join(repoRoot, 'examples-outside');
    const result = runRaw(['create', 'cli-outside', '--chapters-dir', outside]);
    expect(result.code).toBe(2);
    expect(result.errors).toContain('usage.chapters-dir-outside-src');
    expect(fs.existsSync(path.join(outside, 'cli-outside'))).toBe(false);
  });

  it('refuses existing directories, reserved namespaces and invalid revisions', () => {
    const existing = path.join(tempRoot, 'cli-negative');
    const before = fs.readFileSync(path.join(existing, 'index.ts'), 'utf8');
    const again = run(['create', 'cli-negative', '--title', 'Again']);
    expect(again.code).toBe(1);
    expect(again.errors).toContain('chapter-exists');
    expect(fs.readFileSync(path.join(existing, 'index.ts'), 'utf8')).toBe(before);

    const reserved = run(['create', 'cli-reserved', '--namespace', 'example.beacon']);
    expect(reserved.code).toBe(1);
    expect(reserved.errors).toContain('identity-collision');
    expect(fs.existsSync(path.join(tempRoot, 'cli-reserved'))).toBe(false);

    const duplicateNamespace = run([
      'create', 'cli-gamma', '--namespace', 'authoring.cli.alpha',
    ]);
    expect(duplicateNamespace.code).toBe(1);
    expect(duplicateNamespace.errors).toContain('identity-collision');
    expect(fs.existsSync(path.join(tempRoot, 'cli-gamma'))).toBe(false);

    for (const revision of ['0', '-1', 'abc']) {
      const result = run(['create', 'cli-bad-revision', '--revision', revision]);
      expect(result.code).toBe(2);
      expect(fs.existsSync(path.join(tempRoot, 'cli-bad-revision'))).toBe(false);
    }
  });

  it('reports missing and malformed chapters with non-zero exit codes', () => {
    const missing = run(['validate', 'cli-missing']);
    expect(missing.code).toBe(1);
    expect(missing.errors).toContain('chapter-not-found');

    const brokenDir = path.join(tempRoot, 'cli-broken');
    fs.mkdirSync(brokenDir, { recursive: true });
    fs.writeFileSync(path.join(brokenDir, 'index.ts'), 'export const = ;\n', 'utf8');
    const broken = run(['validate', 'cli-broken']);
    expect(broken.code).toBe(1);
    expect(broken.errors).toContain('chapter-load-failed');
  });

  it('cleans up a partial creation when a write fails', () => {
    let writes = 0;
    const failing: ChapterFileSystem = {
      ...nodeChapterFileSystem,
      writeFile(target, content) {
        writes += 1;
        if (writes === 2) throw new Error('simulated write failure');
        nodeChapterFileSystem.writeFile(target, content);
      },
    };
    expect(() => createChapter({
      repoRoot,
      chaptersRoot: tempRoot,
      templateDir,
      slug: 'cli-partial',
      namespace: 'authoring.cli.partial',
      title: 'CLI Partial',
      stageTitle: 'CLI Partial — Aproximação',
      summary: 'Partial creation failure fixture.',
      revision: 1,
      fileSystem: failing,
    })).toThrow('simulated write failure');
    expect(fs.existsSync(path.join(tempRoot, 'cli-partial'))).toBe(false);
    expect(fs.readdirSync(tempRoot).some(name => name.startsWith('.tmp-cli-partial-'))).toBe(false);
  });

  it('returns typed diagnostics for mutated chapter data', () => {
    const entry = generatedEntry('cli-negative');
    const stage = entry.stages[0];
    const codes = (mutated: CampaignChapterEntry): readonly string[] =>
      validateChapterEntry(mutated).errors.map(item => item.code);

    const unsupported = {
      ...entry,
      stages: [{
        ...stage,
        manifest: {
          ...stage.manifest,
          capabilities: [
            ...(stage.manifest.capabilities ?? []),
            {
              id: 'theme.gothic-cathedral',
              category: 'theme' as const,
              minimumVersion: 1,
              requirement: 'required' as const,
            },
          ],
        },
      }],
    };
    expect(codes(unsupported)).toContain('capability.unavailable');

    const missingDependency = {
      ...entry,
      chapter: {
        ...entry.chapter,
        dependencies: [{ chapterId: 'chapter.missing', minimumRevision: 1 }],
      },
    };
    expect(codes(missingDependency)).toContain('chapter.dependency.missing');

    const emptyEncounter = {
      ...entry,
      stages: [{
        ...stage,
        encounter: {
          ...stage.encounter!,
          source: { kind: 'authored-waves' as const, waves: [] },
        },
      }],
    };
    expect(codes(emptyEncounter)).toContain('stage.encounter.waves.empty');

    const invalidRevision = {
      ...entry,
      stages: [{ ...stage, manifest: { ...stage.manifest, revision: 0 } }],
    };
    expect(codes(invalidRevision)).toContain('stage.revision.invalid');

    const missingTheme = {
      ...entry,
      stages: [{
        ...stage,
        manifest: {
          ...stage.manifest,
          presentation: { ...stage.manifest.presentation!, themeId: 'theme.missing' },
        },
      }],
    };
    expect(codes(missingTheme)).toContain('stage.visual.theme.unknown');

    const incompatibleExit = {
      ...entry,
      stages: [{
        ...stage,
        manifest: {
          ...stage.manifest,
          exits: [{
            ...stage.manifest.exits[0],
            anchor: { kind: 'tile' as const, x: 0, y: 0 },
          }],
        },
      }],
    };
    expect(codes(incompatibleExit)).toContain('stage.exit.anchor-not-walkable');

    const invalidNarrative = {
      ...entry,
      stages: [{
        ...stage,
        npcs: (stage.npcs ?? []).map((npc, index) => index === 0
          ? { ...npc, interactionDialogueId: 'dialogue.missing' }
          : npc),
      }],
    };
    expect(codes(invalidNarrative)).toContain('narrative.npc.dialogue.missing');

    const duplicate = {
      ...entry,
      chapter: {
        ...entry.chapter,
        stageIds: [stage.manifest.id, stage.manifest.id],
      },
      stages: [stage, stage],
    };
    const duplicateCodes = codes(duplicate);
    expect(duplicateCodes).toContain('registration.failed');
    expect(duplicateCodes.some(code => code.includes('duplicate'))).toBe(true);
  });

  it('keeps warnings non-blocking', () => {
    const entry = generatedEntry('cli-negative');
    const stage = entry.stages[0];
    const mutated = {
      ...entry,
      stages: [cloneLevelWithSecondSpawn(stage)],
    };
    const report = validateChapterEntry(mutated);
    expect(report.errors).toEqual([]);
    expect(report.warnings.map(item => item.code)).toEqual(expect.arrayContaining([
      'level.spawn.multiple',
    ]));
  });
});
