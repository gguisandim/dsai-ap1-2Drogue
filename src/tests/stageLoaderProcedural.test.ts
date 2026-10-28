import { LevelDefinition } from '../data/LevelData';
import { ProceduralLevelFactory } from '../procedural';
import {
  ChapterManifest,
  ProceduralStageAdapter,
  StageLoader,
  StageModule,
  StageRegistry,
} from '../stages';

function proceduralModule(): StageModule {
  return {
    manifest: {
      schemaVersion: 1,
      id: 'test.procedural',
      revision: 1,
      chapterId: 'test.procedural-chapter',
      order: 0,
      title: 'Procedural Test',
      summary: 'Deterministic procedural fixture.',
      layout: { kind: 'procedural', preset: 'cathedral-intro', seed: 'run' },
      exits: [{ id: 'main.exit', anchor: { kind: 'map-exit' }, targetStageId: 'campaign.complete' }],
    },
  };
}

function registryWith(module = proceduralModule()): StageRegistry {
  const registry = new StageRegistry();
  const chapter: ChapterManifest = {
    schemaVersion: 1,
    id: module.manifest.chapterId,
    revision: 1,
    title: 'Procedural Test Chapter',
    stageIds: [module.manifest.id],
    entryStageId: module.manifest.id,
  };
  registry.registerChapter(chapter, [module]);
  return registry;
}

function disconnectedLevel(): LevelDefinition {
  return {
    id: 'test.procedural',
    name: 'Disconnected',
    description: 'Generator output with no spawn-to-exit route.',
    theme: 'gothic_cathedral',
    music: 'none',
    ambientColor: 0,
    fogColor: 0,
    fogDensity: 0,
    lightIntensity: 1,
    tileMap: [
      [1, 1, 1, 1, 1],
      [1, 8, 0, 1, 1],
      [1, 1, 1, 1, 1],
      [1, 0, 0, 5, 1],
      [1, 1, 1, 1, 1],
    ],
    enemies: [],
    items: [],
    decorations: [],
    parTime: 60,
    difficulty: 1,
  };
}

describe('StageLoader procedural resolution', () => {
  it('combines run seed with stage id and resolves the same definition repeatedly', () => {
    const loader = new StageLoader(registryWith());
    const request = { stageId: 'test.procedural', runId: 'run-1', runSeed: 'seed-42' } as const;
    const first = loader.load(request);
    const second = loader.load(request);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) throw new Error('procedural stage did not resolve');
    expect(second.value.level).toEqual(first.value.level);
    expect(first.value.level.id).toBe('test.procedural');
    expect(second.value.level.tileMap).not.toBe(first.value.level.tileMap);
  });

  it('passes the run seed combined with the stable stage id to the procedural factory', () => {
    const create = jest.fn(() => disconnectedLevel());
    const adapter = new ProceduralStageAdapter({ create });

    adapter.resolve(proceduralModule().manifest, 'seed-42');

    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      seed: 'seed-42:stage:test.procedural',
      preset: 'cathedral-intro',
      level: expect.objectContaining({ id: 'test.procedural' }),
    }));
  });

  it('matches the existing ProceduralLevelFactory output for the effective seed and preset', () => {
    const result = new StageLoader(registryWith()).load({
      stageId: 'test.procedural', runId: 'run-1', runSeed: 731,
    });
    const expected = new ProceduralLevelFactory().create({
      seed: '731:stage:test.procedural',
      preset: 'cathedral-intro',
      level: {
        id: 'test.procedural',
        name: 'Procedural Test',
        description: 'Deterministic procedural fixture.',
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.code);
    expect(result.value.level).toEqual(expected);
  });

  it.each(['', '   ', Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid procedural seed %p with a typed failure',
    runSeed => {
      const result = new StageLoader(registryWith()).load({
        stageId: 'test.procedural', runId: 'run-1', runSeed,
      });

      expect(result).toMatchObject({
        ok: false,
        error: {
          code: 'generation-failed',
          diagnostics: [expect.objectContaining({ code: 'stage.load.seed-invalid' })],
        },
      });
    },
  );

  it('converts generator exceptions into generation-failed without a partial stage', () => {
    const procedural = new ProceduralStageAdapter({
      create: () => { throw new Error('fixture generator failure'); },
    });
    const result = new StageLoader(registryWith(), { procedural }).load({
      stageId: 'test.procedural', runId: 'run-1', runSeed: 'valid',
    });

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: 'generation-failed',
        diagnostics: [expect.objectContaining({
          code: 'stage.load.generation-failed',
          message: expect.stringContaining('fixture generator failure'),
        })],
      },
    });
    expect('value' in result).toBe(false);
  });

  it('rejects disconnected output after the procedural adapter returns', () => {
    const procedural = new ProceduralStageAdapter({ create: () => disconnectedLevel() });
    const result = new StageLoader(registryWith(), { procedural }).load({
      stageId: 'test.procedural', runId: 'run-1', runSeed: 'valid',
    });

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: 'invalid-level',
        diagnostics: [expect.objectContaining({ code: 'level.connectivity.unreachable-destination' })],
      },
    });
  });
});
