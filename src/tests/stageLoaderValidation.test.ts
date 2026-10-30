import { LevelDefinition } from '../data/LevelData';
import {
  ChapterManifest,
  StageLoader,
  StageModule,
  StageRegistry,
} from '../stages';

function level(overrides: Partial<LevelDefinition> = {}): LevelDefinition {
  return {
    id: 'fixture.level',
    name: 'Fixture Level',
    description: 'Authored loader validation fixture.',
    theme: 'gothic_cathedral',
    music: 'none',
    ambientColor: 0,
    fogColor: 0,
    fogDensity: 0,
    lightIntensity: 1,
    tileMap: [
      [1, 1, 1, 1, 1],
      [1, 8, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 5, 1],
      [1, 1, 1, 1, 1],
    ],
    enemies: [],
    items: [],
    decorations: [],
    parTime: 60,
    difficulty: 1,
    ...overrides,
  };
}

function authoredModule(authoredLevel: LevelDefinition, anchor: StageModule['manifest']['exits'][number]['anchor'] = { kind: 'map-exit' }): StageModule {
  return {
    manifest: {
      schemaVersion: 1,
      id: 'test.authored',
      revision: 3,
      chapterId: 'test.authored-chapter',
      order: 0,
      title: 'Authored Test',
      summary: 'Validates resolved authored maps.',
      layout: { kind: 'authored' },
      exits: [{ id: 'main.exit', anchor, targetStageId: 'campaign.complete' }],
    },
    authoredLevel,
  };
}

function loaderFor(module: StageModule): StageLoader {
  const registry = new StageRegistry();
  const chapter: ChapterManifest = {
    schemaVersion: 1,
    id: module.manifest.chapterId,
    revision: 1,
    title: 'Authored Test Chapter',
    stageIds: [module.manifest.id],
    entryStageId: module.manifest.id,
  };
  registry.registerChapter(chapter, [module]);
  return new StageLoader(registry);
}

describe('StageLoader resolved level validation', () => {
  it('loads a valid authored level and supplies empty narrative collections', () => {
    const result = loaderFor(authoredModule(level())).load({
      stageId: 'test.authored', runId: 'run', runSeed: 'unused',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.code);
    expect(result.value.level).toEqual(level());
    expect(result.value.narrative).toEqual({});
    expect(result.value.npcs).toEqual([]);
    expect(result.value.dialogues).toEqual([]);
    expect(result.value.missions).toEqual([]);
    expect(result.value.events).toEqual([]);
  });

  it('rejects disconnected authored maps', () => {
    const disconnected = level({
      tileMap: [
        [1, 1, 1, 1, 1],
        [1, 8, 0, 1, 1],
        [1, 1, 1, 1, 1],
        [1, 0, 0, 5, 1],
        [1, 1, 1, 1, 1],
      ],
    });
    const result = loaderFor(authoredModule(disconnected)).load({
      stageId: 'test.authored', runId: 'run', runSeed: 'unused',
    });

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: 'invalid-level',
        diagnostics: [expect.objectContaining({ code: 'level.connectivity.unreachable-destination' })],
      },
    });
  });

  it('rejects unsupported tile values before returning a partial level', () => {
    const invalidTiles = level({
      tileMap: [
        [1, 1, 1, 1, 1],
        [1, 8, 99, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 5, 1],
        [1, 1, 1, 1, 1],
      ],
    });
    const result = loaderFor(authoredModule(invalidTiles)).load({
      stageId: 'test.authored', runId: 'run', runSeed: 'unused',
    });

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: 'invalid-manifest',
        diagnostics: [expect.objectContaining({ code: 'stage.content.tile.unsupported' })],
      },
    });
    expect('value' in result).toBe(false);
  });

  it('rejects solid gameplay positions, out-of-bounds positions and non-walkable anchors', () => {
    const invalid = level({
      enemies: [{ type: 'affinity', x: 0, y: 0, level: 1 }],
      items: [{ type: 'key', x: 99, y: 99 }],
      decorations: [{ type: 'outside-decoration', x: -1, y: 2 }],
    });
    const result = loaderFor(authoredModule(invalid, { kind: 'tile', x: 0, y: 0 })).load({
      stageId: 'test.authored', runId: 'run', runSeed: 'unused',
    });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('invalid level unexpectedly loaded');

    expect(result.error.code).toBe('invalid-level');
    expect(result.error.diagnostics.map(diagnostic => diagnostic.code)).toEqual(expect.arrayContaining([
      'level.position.on-solid',
      'level.position.out-of-bounds',
      'stage.exit.anchor-not-walkable',
    ]));
  });

  it('rejects resume data for another stage or manifest revision without mutating it', () => {
    const resume = {
      stageId: 'other.stage',
      manifestRevision: 2,
      flags: { kept: true },
      missionStates: {},
      collectedEntityIds: ['kept.entity'],
      appliedOperationIds: ['kept.operation'],
    } as const;
    const before = JSON.stringify(resume);
    const result = loaderFor(authoredModule(level())).load({
      stageId: 'test.authored', runId: 'run', runSeed: 'unused', resume,
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('incompatible resume unexpectedly loaded');
    expect(result.error.code).toBe('incompatible-save');
    expect(result.error.diagnostics.map(diagnostic => diagnostic.code)).toEqual([
      'stage.load.resume-revision-mismatch',
      'stage.load.resume-stage-mismatch',
    ]);
    expect(JSON.stringify(resume)).toBe(before);
  });
});
