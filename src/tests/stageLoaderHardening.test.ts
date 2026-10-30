import { LevelDefinition } from '../data/LevelData';
import {
  ChapterManifest,
  ProceduralStageAdapter,
  StageLoader,
  StageModule,
  StageRegistry,
  StageResumeState,
} from '../stages';

function level(overrides: Partial<LevelDefinition> = {}): LevelDefinition {
  return {
    id: 'test.authored',
    name: 'Hardening fixture',
    description: 'Valid map for StageLoader boundary tests.',
    theme: 'gothic_cathedral',
    music: 'none',
    ambientColor: 0,
    fogColor: 0,
    fogDensity: 0,
    lightIntensity: 1,
    tileMap: [
      [1, 1, 1, 1, 1, 1, 1],
      [1, 8, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 5, 1],
      [1, 1, 1, 1, 1, 1, 1],
    ],
    enemies: [],
    items: [],
    decorations: [],
    parTime: 60,
    difficulty: 1,
    ...overrides,
  };
}

function moduleFor(
  layout: StageModule['manifest']['layout'] = { kind: 'authored' },
  authoredLevel?: LevelDefinition,
): StageModule {
  const resolvedAuthoredLevel = layout.kind === 'authored' ? authoredLevel ?? level() : authoredLevel;
  return {
    manifest: {
      schemaVersion: 1,
      id: layout.kind === 'procedural' ? 'test.procedural' : 'test.authored',
      revision: 3,
      chapterId: 'test.chapter',
      order: 0,
      title: 'Hardening fixture',
      summary: 'Exercises the public loading boundary.',
      layout,
      exits: [{ id: 'main.exit', anchor: { kind: 'map-exit' }, targetStageId: 'campaign.complete' }],
    },
    ...(resolvedAuthoredLevel ? { authoredLevel: resolvedAuthoredLevel } : {}),
  };
}

function loaderFor(module: StageModule, procedural?: ProceduralStageAdapter): StageLoader {
  const registry = new StageRegistry();
  const chapter: ChapterManifest = {
    schemaVersion: 1,
    id: module.manifest.chapterId,
    revision: 1,
    title: 'Hardening chapter',
    stageIds: [module.manifest.id],
    entryStageId: module.manifest.id,
  };
  registry.registerChapter(chapter, [module]);
  return new StageLoader(registry, procedural ? { procedural } : {});
}

function boundResume(overrides: Partial<StageResumeState> = {}): StageResumeState {
  return {
    stageId: 'test.authored',
    manifestRevision: 3,
    runId: 'run-1',
    runSeed: 731,
    flags: {},
    missionStates: {},
    collectedEntityIds: [],
    appliedOperationIds: [],
    ...overrides,
  };
}

describe('StageLoader hardened boundary', () => {
  it('validates resume binding before invoking procedural generation', () => {
    const create = jest.fn(() => level({ id: 'test.procedural' }));
    const procedural = new ProceduralStageAdapter({ create });
    const loader = loaderFor(
      moduleFor({ kind: 'procedural', preset: 'cathedral-intro', seed: 'run' }, undefined),
      procedural,
    );
    const result = loader.load({
      stageId: 'test.procedural',
      runId: 'run-1',
      runSeed: 731,
      resume: boundResume({ stageId: 'test.procedural', runSeed: 'different-seed' }),
    });

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: 'incompatible-save',
        diagnostics: [expect.objectContaining({ code: 'stage.load.resume-seed-mismatch' })],
      },
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('accepts a complete run binding and compares the effective seed representation', () => {
    const result = loaderFor(moduleFor()).load({
      stageId: 'test.authored',
      runId: 'run-1',
      runSeed: '731',
      resume: boundResume(),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.code);
    expect(result.value.diagnostics).toEqual([]);
  });

  it('rejects divergent run ids and incomplete bindings', () => {
    const loader = loaderFor(moduleFor());
    const mismatch = loader.load({
      stageId: 'test.authored',
      runId: 'run-2',
      runSeed: 731,
      resume: boundResume(),
    });
    const incomplete = loader.load({
      stageId: 'test.authored',
      runId: 'run-1',
      runSeed: 731,
      resume: boundResume({ runSeed: undefined }),
    });

    expect(mismatch).toMatchObject({
      ok: false,
      error: {
        code: 'incompatible-save',
        diagnostics: [expect.objectContaining({ code: 'stage.load.resume-run-id-mismatch' })],
      },
    });
    expect(incomplete).toMatchObject({
      ok: false,
      error: {
        code: 'incompatible-save',
        diagnostics: [expect.objectContaining({ code: 'stage.load.resume-binding-incomplete' })],
      },
    });
  });

  it('keeps pre-binding resume snapshots compatible and marks the migration debt', () => {
    const legacyResume = boundResume({ runId: undefined, runSeed: undefined });
    const result = loaderFor(moduleFor()).load({
      stageId: 'test.authored', runId: 'run-1', runSeed: 731, resume: legacyResume,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.code);
    expect(result.value.diagnostics.map(diagnostic => diagnostic.code)).toEqual([
      'stage.load.resume-binding-missing',
    ]);
    expect(Object.isFrozen(result.value.diagnostics)).toBe(true);
    expect(Object.isFrozen(result.value.diagnostics[0].path)).toBe(true);
  });

  it('rejects structurally invalid resume collections without throwing', () => {
    const malformed = {
      ...boundResume(),
      flags: [],
      missionStates: { mission: { status: 'unknown', objectives: null } },
      collectedEntityIds: ['duplicate', 'duplicate'],
      appliedOperationIds: 'not-an-array',
    } as unknown as StageResumeState;

    expect(() => loaderFor(moduleFor()).load({
      stageId: 'test.authored', runId: 'run-1', runSeed: 731, resume: malformed,
    })).not.toThrow();
    const result = loaderFor(moduleFor()).load({
      stageId: 'test.authored', runId: 'run-1', runSeed: 731, resume: malformed,
    });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('malformed resume unexpectedly loaded');
    expect(result.error.code).toBe('incompatible-save');
    expect(result.error.diagnostics.map(diagnostic => diagnostic.code)).toEqual(expect.arrayContaining([
      'stage.load.resume-flags-invalid',
      'stage.load.resume-mission-invalid',
      'stage.load.resume-list-duplicate',
      'stage.load.resume-list-invalid',
    ]));
    const nullResume = loaderFor(moduleFor()).load({
      stageId: 'test.authored', runId: 'run-1', runSeed: 731, resume: null,
    } as unknown as Parameters<StageLoader['load']>[0]);
    expect(nullResume).toMatchObject({
      ok: false,
      error: {
        code: 'incompatible-save',
        diagnostics: [expect.objectContaining({ code: 'stage.load.resume-invalid' })],
      },
    });
  });

  it('rejects malformed requests and never leaks an exception from the public boundary', () => {
    const loader = loaderFor(moduleFor());
    const absent = loader.load(null as unknown as Parameters<StageLoader['load']>[0]);
    const wrongSeedType = loader.load({
      stageId: 'test.authored', runId: 'run-1', runSeed: true,
    } as unknown as Parameters<StageLoader['load']>[0]);
    const throwingRegistry = {
      get: () => { throw new Error('registry boundary fixture'); },
    } as unknown as StageRegistry;
    const dependencyFailure = new StageLoader(throwingRegistry).load({
      stageId: 'test.authored', runId: 'run-1', runSeed: 731,
    });

    expect(absent).toMatchObject({ ok: false, error: { code: 'invalid-request' } });
    expect(wrongSeedType).toMatchObject({ ok: false, error: { code: 'invalid-request' } });
    expect(dependencyFailure).toMatchObject({
      ok: false,
      error: {
        code: 'load-failed',
        diagnostics: [expect.objectContaining({ code: 'stage.load.unexpected-error' })],
      },
    });
  });

  it('turns structurally invalid adapter output into invalid-level', () => {
    const create = jest.fn(() => ({
      ...level({ id: 'test.procedural' }),
      enemies: null,
      tileMap: [null],
    } as unknown as LevelDefinition));
    const loader = loaderFor(
      moduleFor({ kind: 'procedural', preset: 'cathedral-intro', seed: 'run' }, undefined),
      new ProceduralStageAdapter({ create }),
    );

    const result = loader.load({ stageId: 'test.procedural', runId: 'run-1', runSeed: 731 });
    expect(result).toMatchObject({
      ok: false,
      error: {
        code: 'invalid-level',
        diagnostics: [expect.objectContaining({ code: 'level.collection.invalid' })],
      },
    });
  });

  it('rejects a walkable explicit exit anchor isolated from spawn', () => {
    const isolated = level({
      tileMap: [
        [1, 1, 1, 1, 1, 1, 1],
        [1, 8, 0, 0, 5, 0, 1],
        [1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1],
      ],
    });
    const source = moduleFor({ kind: 'authored' }, isolated);
    const module: StageModule = {
      ...source,
      manifest: {
        ...source.manifest,
        exits: [{
          id: 'isolated.exit',
          anchor: { kind: 'tile', x: 1, y: 3 },
          targetStageId: 'campaign.complete',
        }],
      },
    };

    const result = loaderFor(module).load({ stageId: 'test.authored', runId: 'run-1', runSeed: 731 });
    expect(result).toMatchObject({
      ok: false,
      error: {
        code: 'invalid-level',
        diagnostics: [expect.objectContaining({ code: 'stage.exit.anchor-unreachable' })],
      },
    });
  });

  it('deep-copies nested level and stage content across repeated loads', () => {
    const sourceLevel = level({
      enemies: [{
        type: 'affinity', x: 2, y: 2, level: 1,
        patrol: [{ x: 2, y: 3 }],
        dropTable: [{ itemId: 'drop', chance: 1 }],
      }],
      waves: [{ delay: 1, enemies: [{ type: 'applaud', x: 3, y: 3, level: 1 }] }],
    });
    const source = moduleFor({ kind: 'authored' }, sourceLevel);
    const enriched: StageModule = {
      ...source,
      narrative: { flags: { nested: 'kept' } },
      npcs: [{ id: 'test.npc', displayName: 'NPC', role: 'story', presentationId: 'npc', spawn: { kind: 'tile', x: 2, y: 2 } }],
      dialogues: [{ id: 'test.dialogue', startNodeId: 'start', nodes: [{ id: 'start', speakerId: 'narrator', text: 'Text' }] }],
      missions: [{ id: 'test.mission', title: 'Mission', description: 'Test', scope: 'stage', start: 'stage-enter', objectives: [] }],
      events: [{ id: 'test.event', once: true, when: 'stage.entered', commands: [{ type: 'flag.set', flag: 'test.flag', value: true }] }],
    };
    const loader = loaderFor(enriched);
    const request = { stageId: 'test.authored', runId: 'run-1', runSeed: 731 } as const;
    const first = loader.load(request);
    const second = loader.load(request);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) throw new Error('copy fixture did not load');

    const mutable = first.value as any;
    mutable.level.enemies[0].patrol[0].x = 99;
    mutable.level.enemies[0].dropTable[0].itemId = 'changed';
    mutable.level.waves[0].enemies[0].type = 'changed';
    mutable.narrative.flags.nested = 'changed';
    mutable.npcs[0].spawn.x = 99;
    mutable.dialogues[0].nodes[0].text = 'changed';
    mutable.events[0].commands[0].value = false;

    expect(second.value.level).toEqual(sourceLevel);
    expect(second.value.narrative.flags?.nested).toBe('kept');
    expect(second.value.npcs[0].spawn).toEqual({ kind: 'tile', x: 2, y: 2 });
    expect(second.value.dialogues[0].nodes[0].text).toBe('Text');
    expect(second.value.events[0].commands[0]).toMatchObject({ value: true });
  });

  it('is deterministic across loader instances for numeric and equivalent string seeds', () => {
    const module = moduleFor({ kind: 'procedural', preset: 'cathedral-intro', seed: 'run' }, undefined);
    const numeric = loaderFor(module).load({ stageId: 'test.procedural', runId: 'run-a', runSeed: 731 });
    const textual = loaderFor(module).load({ stageId: 'test.procedural', runId: 'run-b', runSeed: '731' });

    expect(numeric.ok).toBe(true);
    expect(textual.ok).toBe(true);
    if (!numeric.ok || !textual.ok) throw new Error('procedural fixture did not load');
    expect(textual.value.level).toEqual(numeric.value.level);
    expect(textual.value.level.tileMap).not.toBe(numeric.value.level.tileMap);
  });
});
