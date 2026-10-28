import { GameSceneStageAdapter } from '../application/stages';
import type { StageLoaderPort } from '../application/stages';
import { VERSE_SECTIONS } from '../data/VerseLevelData';
import type { LoadedStage, StageLoadFailure } from '../stages';

function loadedStage(level = VERSE_SECTIONS[0]): LoadedStage {
  return {
    manifest: {
      schemaVersion: 1,
      id: level.id,
      revision: 1,
      chapterId: 'legacy.verse',
      order: 0,
      title: level.name,
      summary: level.description,
      layout: { kind: 'legacy', levelId: level.id },
      exits: [{ id: 'legacy.next', anchor: { kind: 'map-exit' }, targetStageId: 'verse_02_galeria' }],
    },
    level,
    narrative: {},
    npcs: [],
    dialogues: [],
    missions: [],
    events: [],
    diagnostics: [],
  };
}

function loaderReturning(result: ReturnType<StageLoaderPort['load']>): StageLoaderPort & { load: jest.Mock } {
  return { load: jest.fn(() => result) };
}

describe('GameSceneStageAdapter', () => {
  it('uses the exact legacy object and never calls the loader while the flag is off', () => {
    const loader = loaderReturning({ ok: true, value: loadedStage() });
    const resolution = new GameSceneStageAdapter(loader).resolve({
      enabled: false,
      legacyLevel: VERSE_SECTIONS[0],
      runId: 'test.run',
      runSeed: 'seed',
    });
    expect(resolution).toEqual({ source: 'legacy', level: VERSE_SECTIONS[0] });
    expect(resolution.level).toBe(VERSE_SECTIONS[0]);
    expect(loader.load).not.toHaveBeenCalled();
  });

  it('does not migrate a second stage or a procedural-looking id', () => {
    const loader = loaderReturning({ ok: true, value: loadedStage() });
    const adapter = new GameSceneStageAdapter(loader);
    expect(adapter.resolve({
      enabled: true,
      legacyLevel: VERSE_SECTIONS[1],
      runId: 'test.run',
      runSeed: 'seed',
    })).toEqual({ source: 'legacy', level: VERSE_SECTIONS[1] });
    expect(loader.load).not.toHaveBeenCalled();
  });

  it('loads only the pilot stage and forwards run identity and seed unchanged', () => {
    const loaded = loadedStage({ ...VERSE_SECTIONS[0] });
    const loader = loaderReturning({ ok: true, value: loaded });
    const resolution = new GameSceneStageAdapter(loader).resolve({
      enabled: true,
      legacyLevel: VERSE_SECTIONS[0],
      runId: 'test.run-42',
      runSeed: 731,
    });
    expect(loader.load).toHaveBeenCalledWith({
      stageId: 'verse_01_atrium',
      runId: 'test.run-42',
      runSeed: 731,
    });
    expect(resolution).toMatchObject({ source: 'modular', level: loaded.level, loadedStage: loaded });
  });

  it('rolls back to the same legacy reference on typed failure', () => {
    const failure: StageLoadFailure = {
      code: 'invalid-level',
      stageId: 'verse_01_atrium',
      diagnostics: [],
    };
    const loader = loaderReturning({ ok: false, error: failure });
    const resolution = new GameSceneStageAdapter(loader).resolve({
      enabled: true,
      legacyLevel: VERSE_SECTIONS[0],
      runId: 'test.run',
      runSeed: 'seed',
    });
    expect(resolution).toEqual({ source: 'rollback', level: VERSE_SECTIONS[0], failure });
    expect(resolution.level).toBe(VERSE_SECTIONS[0]);
  });

  it('rolls back on thrown errors and mismatched loaded identities', () => {
    const throwing: StageLoaderPort = { load: () => { throw new Error('boom'); } };
    expect(new GameSceneStageAdapter(throwing).resolve({
      enabled: true,
      legacyLevel: VERSE_SECTIONS[0],
      runId: 'test.run',
      runSeed: 'seed',
    })).toMatchObject({ source: 'rollback', level: VERSE_SECTIONS[0], failure: { code: 'load-failed' } });

    const mismatched = loadedStage({ ...VERSE_SECTIONS[0], id: 'other.stage' });
    const loader = loaderReturning({ ok: true, value: mismatched });
    expect(new GameSceneStageAdapter(loader).resolve({
      enabled: true,
      legacyLevel: VERSE_SECTIONS[0],
      runId: 'test.run',
      runSeed: 'seed',
    })).toMatchObject({ source: 'rollback', level: VERSE_SECTIONS[0], failure: { code: 'invalid-reference' } });
  });
});
