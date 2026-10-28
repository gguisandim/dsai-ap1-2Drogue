import {
  ChapterManifest,
  StageModule,
  StageRegistry,
  StageRegistryError,
} from '../stages';

function stage(
  id: string,
  order: number,
  targetStageId: string = 'campaign.complete',
  chapterId = 'test.chapter',
): StageModule {
  return {
    manifest: {
      schemaVersion: 1,
      id,
      revision: 1,
      chapterId,
      order,
      title: id,
      summary: `Stage ${id}`,
      layout: { kind: 'legacy', levelId: id },
      exits: [{ id: 'main.exit', anchor: { kind: 'map-exit' }, targetStageId }],
    },
  };
}

function chapter(stageIds: readonly string[], entryStageId = stageIds[0]): ChapterManifest {
  return {
    schemaVersion: 1,
    id: 'test.chapter',
    revision: 1,
    title: 'Test Chapter',
    stageIds,
    entryStageId,
  };
}

describe('StageRegistry', () => {
  it('registers, queries, requires and lists a chapter in deterministic manifest order', () => {
    const registry = new StageRegistry();
    const first = stage('test.first', 0, 'test.second');
    const second = stage('test.second', 1);

    registry.registerChapter(chapter(['test.first', 'test.second']), [second, first]);

    expect(registry.get('test.first')?.manifest.title).toBe('test.first');
    expect(registry.require('test.second').manifest.id).toBe('test.second');
    expect(registry.get('missing')).toBeUndefined();
    expect(registry.getChapter('test.chapter')?.entryStageId).toBe('test.first');
    expect(registry.listChapter('test.chapter').map(manifest => manifest.id)).toEqual([
      'test.first',
      'test.second',
    ]);
    expect(registry.validate()).toEqual([]);
  });

  it('stores immutable manifest copies instead of caller-owned arrays and objects', () => {
    const registry = new StageRegistry();
    const mutableStage = stage('test.mutable', 0) as unknown as Record<string, any>;
    const mutableChapter = chapter(['test.mutable']) as unknown as Record<string, any>;
    registry.registerChapter(
      mutableChapter as unknown as ChapterManifest,
      [mutableStage as unknown as StageModule],
    );

    mutableStage.manifest.title = 'Changed outside registry';
    mutableStage.manifest.exits[0].targetStageId = 'missing.stage';
    mutableChapter.stageIds[0] = 'missing.stage';

    const stored = registry.require('test.mutable').manifest;
    expect(stored.title).toBe('test.mutable');
    expect(stored.exits[0].targetStageId).toBe('campaign.complete');
    expect(registry.getChapter('test.chapter')?.stageIds).toEqual(['test.mutable']);
    expect(Object.isFrozen(stored)).toBe(true);
    expect(Object.isFrozen(stored.exits)).toBe(true);
    expect(Object.isFrozen(registry.listChapter('test.chapter'))).toBe(true);
  });

  it('rejects duplicate stage and chapter ids with typed errors', () => {
    const registry = new StageRegistry();
    const module = stage('test.duplicate', 0);
    registry.registerChapter(chapter(['test.duplicate']), [module]);

    expect(() => registry.register(module)).toThrow(StageRegistryError);
    try {
      registry.register(module);
    } catch (error) {
      expect(error).toMatchObject({ code: 'duplicate-stage', referenceId: 'test.duplicate' });
    }
    expect(() => registry.registerChapter(chapter(['test.duplicate']), [module])).toThrow(
      expect.objectContaining({ code: 'duplicate-chapter', referenceId: 'test.chapter' }),
    );
  });

  it('rejects incompatible chapter registrations atomically', () => {
    const registry = new StageRegistry();
    const foreign = stage('foreign.stage', 0, 'campaign.complete', 'foreign.chapter');

    expect(() => registry.registerChapter(chapter(['foreign.stage']), [foreign])).toThrow(
      expect.objectContaining({ code: 'chapter-mismatch', referenceId: 'foreign.stage' }),
    );
    expect(registry.getChapter('test.chapter')).toBeUndefined();
    expect(registry.get('foreign.stage')).toBeUndefined();

    expect(() => registry.registerChapter(chapter(['test.declared']), [stage('test.supplied', 0)])).toThrow(
      expect.objectContaining({ code: 'chapter-stage-list-mismatch' }),
    );
    expect(registry.get('test.supplied')).toBeUndefined();
  });

  it('throws a typed missing-stage error from require', () => {
    expect(() => new StageRegistry().require('missing.stage')).toThrow(
      expect.objectContaining({ code: 'missing-stage', referenceId: 'missing.stage' }),
    );
  });

  it('diagnoses missing exit targets without resolving or loading a level', () => {
    const registry = new StageRegistry();
    registry.registerChapter(
      chapter(['test.entry']),
      [stage('test.entry', 0, 'missing.stage')],
    );

    expect(registry.validate().map(diagnostic => diagnostic.code)).toEqual([
      'chapter.graph.no-terminal-route',
      'stage.exit.target-missing',
    ]);
  });

  it('diagnoses unreachable stages and cycles with no terminal route', () => {
    const registry = new StageRegistry();
    registry.registerChapter(
      chapter(['test.a', 'test.b', 'test.c'], 'test.a'),
      [
        stage('test.a', 0, 'test.b'),
        stage('test.b', 1, 'test.a'),
        stage('test.c', 2, 'campaign.complete'),
      ],
    );

    const diagnostics = registry.validate();
    expect(diagnostics.filter(diagnostic => diagnostic.code === 'chapter.graph.no-terminal-route')
      .map(diagnostic => diagnostic.stageId)).toEqual(['test.a', 'test.b']);
    expect(diagnostics.filter(diagnostic => diagnostic.code === 'chapter.graph.unreachable')
      .map(diagnostic => diagnostic.stageId)).toEqual(['test.c']);
  });
});
