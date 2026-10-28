import { CORRIDOR_LEVEL } from '../data/CorridorLevelData';
import { ALL_LEVELS, LevelDefinition } from '../data/LevelData';
import { VERSE_SECTIONS } from '../data/VerseLevelData';
import {
  StageRegistry,
  createLegacyStageModule,
  registerLegacyStages,
} from '../stages';

function expectLegacyChapter(
  registry: StageRegistry,
  chapterId: string,
  levels: readonly LevelDefinition[],
): void {
  const chapter = registry.getChapter(chapterId);
  const manifests = registry.listChapter(chapterId);
  const expectedIds = levels.map(level => level.id);

  expect(chapter?.stageIds).toEqual(expectedIds);
  expect(chapter?.entryStageId).toBe(expectedIds[0]);
  expect(manifests.map(manifest => manifest.id)).toEqual(expectedIds);
  manifests.forEach((manifest, index) => {
    expect(manifest.order).toBe(index);
    expect(manifest.layout).toEqual({ kind: 'legacy', levelId: levels[index].id });
    expect(manifest.title).toBe(levels[index].name);
    expect(manifest.summary).toBe(levels[index].description);
    expect(manifest.exits).toEqual([{
      id: 'legacy.next',
      anchor: { kind: 'map-exit' },
      targetStageId: expectedIds[index + 1] ?? 'campaign.complete',
    }]);
  });
}

describe('legacy stage registration compatibility', () => {
  it('adapts one LevelDefinition without changing its stable id or source reference', () => {
    const source = VERSE_SECTIONS[0];
    const module = createLegacyStageModule(source, 'legacy.test', 4, 'campaign.complete');

    expect(module.manifest.id).toBe(source.id);
    expect(module.manifest.layout).toEqual({ kind: 'legacy', levelId: source.id });
    expect(module.manifest.order).toBe(4);
    expect(module.authoredLevel).toBeUndefined();
    expect(source.id).toBe('verse_01_atrium');
  });

  it('registers verse, authored catalogue and corridor in their existing order', () => {
    const registry = new StageRegistry();
    registerLegacyStages(registry);

    expectLegacyChapter(registry, 'legacy.verse', VERSE_SECTIONS);
    expectLegacyChapter(registry, 'legacy.levels', ALL_LEVELS);
    expectLegacyChapter(registry, 'legacy.corridor', [CORRIDOR_LEVEL]);
  });

  it('keeps all fourteen legacy ids unique and validates the complete registry', () => {
    const registry = new StageRegistry();
    registerLegacyStages(registry);
    const ids = [
      ...registry.listChapter('legacy.verse'),
      ...registry.listChapter('legacy.levels'),
      ...registry.listChapter('legacy.corridor'),
    ].map(manifest => manifest.id);

    expect(ids).toHaveLength(14);
    expect(new Set(ids).size).toBe(14);
    expect(registry.validate()).toEqual([]);
  });
});
