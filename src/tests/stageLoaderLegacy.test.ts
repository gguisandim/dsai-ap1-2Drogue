import { CORRIDOR_LEVEL } from '../data/CorridorLevelData';
import { ALL_LEVELS, LevelDefinition } from '../data/LevelData';
import { VERSE_SECTIONS } from '../data/VerseLevelData';
import {
  ChapterManifest,
  StageLoader,
  StageModule,
  StageRegistry,
  registerLegacyStages,
} from '../stages';

const LEGACY_CATALOGUES: ReadonlyArray<readonly [string, readonly LevelDefinition[]]> = [
  ['legacy.verse', VERSE_SECTIONS],
  ['legacy.levels', ALL_LEVELS],
  ['legacy.corridor', [CORRIDOR_LEVEL]],
];

function registerSingle(registry: StageRegistry, module: StageModule): void {
  const chapter: ChapterManifest = {
    schemaVersion: 1,
    id: module.manifest.chapterId,
    revision: 1,
    title: 'Loader fixture',
    stageIds: [module.manifest.id],
    entryStageId: module.manifest.id,
  };
  registry.registerChapter(chapter, [module]);
}

describe('StageLoader legacy compatibility', () => {
  it('resolves all fourteen legacy stages with the same ids, order and LevelDefinition data', () => {
    const registry = new StageRegistry();
    registerLegacyStages(registry);
    const loader = new StageLoader(registry);
    let resolved = 0;

    LEGACY_CATALOGUES.forEach(([chapterId, levels]) => {
      const manifests = registry.listChapter(chapterId);
      expect(manifests.map(manifest => manifest.id)).toEqual(levels.map(level => level.id));
      levels.forEach((source, index) => {
        const result = loader.load({ stageId: source.id, runId: 'legacy-audit', runSeed: 'unused' });
        expect(result.ok).toBe(true);
        if (!result.ok) throw new Error(result.error.code);
        expect(result.value.manifest.order).toBe(index);
        expect(result.value.level).toEqual(source);
        expect(result.value.level).not.toBe(source);
        expect(result.value.level.tileMap).not.toBe(source.tileMap);
        resolved++;
      });
    });

    expect(resolved).toBe(14);
  });

  it('reports known legacy placement anomalies as diagnostics without changing their data', () => {
    const registry = new StageRegistry();
    registerLegacyStages(registry);
    const loader = new StageLoader(registry);
    const expectedWarnings: Record<string, string[]> = {
      level_02_nave: ['level.position.on-solid'],
      level_05_clocktower: ['level.position.on-solid'],
      level_06_inferno: ['level.position.on-hazard', 'level.position.on-hazard'],
      level_09_limbo: ['level.position.on-hazard'],
    };

    Object.entries(expectedWarnings).forEach(([stageId, warningCodes]) => {
      const result = loader.load({ stageId, runId: 'legacy-audit', runSeed: 0 });
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error(result.error.code);
      expect(result.value.diagnostics.map(diagnostic => diagnostic.code)).toEqual(warningCodes);
      expect(result.value.level).toEqual(ALL_LEVELS.find(level => level.id === stageId));
    });
  });

  it('returns independent defensive copies on repeated resolution', () => {
    const registry = new StageRegistry();
    registerLegacyStages(registry);
    const loader = new StageLoader(registry);
    const request = { stageId: 'verse_01_atrium', runId: 'copy-test', runSeed: 'unused' } as const;
    const first = loader.load(request);
    const second = loader.load(request);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) throw new Error('legacy stage did not resolve');

    first.value.level.tileMap[0][0] = 99;
    first.value.level.enemies.push({ type: 'mutation', x: 1, y: 1, level: 1 });

    expect(second.value.level).toEqual(VERSE_SECTIONS[0]);
    expect(second.value.level.tileMap).not.toBe(first.value.level.tileMap);
    expect(second.value.manifest).not.toBe(first.value.manifest);
  });

  it('returns typed failures for absent stages, legacy levels and exit references', () => {
    const emptyLoader = new StageLoader(new StageRegistry());
    const absent = emptyLoader.load({ stageId: 'missing.stage', runId: 'test', runSeed: 1 });
    expect(absent).toMatchObject({
      ok: false,
      error: { code: 'stage-not-found', stageId: 'missing.stage' },
    });

    const missingLevelRegistry = new StageRegistry();
    registerSingle(missingLevelRegistry, {
      manifest: {
        schemaVersion: 1,
        id: 'test.missing-level',
        revision: 1,
        chapterId: 'test.chapter',
        order: 0,
        title: 'Missing level',
        summary: 'References a legacy level that does not exist.',
        layout: { kind: 'legacy', levelId: 'missing.level' },
        exits: [{ id: 'main.exit', anchor: { kind: 'map-exit' }, targetStageId: 'campaign.complete' }],
      },
    });
    const missingLevel = new StageLoader(missingLevelRegistry).load({
      stageId: 'test.missing-level', runId: 'test', runSeed: 1,
    });
    expect(missingLevel).toMatchObject({
      ok: false,
      error: {
        code: 'invalid-reference',
        diagnostics: [expect.objectContaining({ code: 'stage.load.legacy-level-missing' })],
      },
    });

    const missingExitRegistry = new StageRegistry();
    registerSingle(missingExitRegistry, {
      manifest: {
        schemaVersion: 1,
        id: 'test.missing-exit-target',
        revision: 1,
        chapterId: 'test.chapter',
        order: 0,
        title: 'Missing target',
        summary: 'References a stage that is not registered.',
        layout: { kind: 'legacy', levelId: 'verse_01_atrium' },
        exits: [{ id: 'main.exit', anchor: { kind: 'map-exit' }, targetStageId: 'missing.target' }],
      },
    });
    const missingExit = new StageLoader(missingExitRegistry).load({
      stageId: 'test.missing-exit-target', runId: 'test', runSeed: 1,
    });
    expect(missingExit).toMatchObject({
      ok: false,
      error: {
        code: 'invalid-reference',
        diagnostics: [expect.objectContaining({ code: 'stage.load.exit-target-missing' })],
      },
    });
  });
});
