import { CORRIDOR_LEVEL } from '../../data/CorridorLevelData';
import { ALL_LEVELS, LevelDefinition } from '../../data/LevelData';
import { VERSE_SECTIONS } from '../../data/VerseLevelData';
import type { ChapterId, ChapterManifest, StageId, StageModule } from '../contracts';
import { StageRegistry } from '../runtime/StageRegistry';

interface LegacyChapterRegistration {
  readonly chapter: ChapterManifest;
  readonly stages: readonly StageModule[];
}

interface LegacyChapterDefinition {
  readonly id: ChapterId;
  readonly title: string;
  readonly levels: readonly LevelDefinition[];
}

const LEGACY_CHAPTER_DEFINITIONS: readonly LegacyChapterDefinition[] = [
  { id: 'legacy.verse', title: 'Legacy Verse Sections', levels: VERSE_SECTIONS },
  { id: 'legacy.levels', title: 'Legacy Authored Levels', levels: ALL_LEVELS },
  { id: 'legacy.corridor', title: 'Legacy Forgotten Passage', levels: [CORRIDOR_LEVEL] },
];

export function createLegacyStageModule(
  level: LevelDefinition,
  chapterId: ChapterId,
  order: number,
  targetStageId: StageId | 'campaign.complete',
): StageModule {
  return {
    manifest: {
      schemaVersion: 1,
      id: level.id,
      revision: 1,
      chapterId,
      order,
      title: level.name,
      summary: level.description,
      layout: { kind: 'legacy', levelId: level.id },
      exits: [{
        id: 'legacy.next',
        anchor: { kind: 'map-exit' },
        targetStageId,
      }],
      tags: ['legacy'],
    },
  };
}

function createLegacyChapterRegistration(definition: LegacyChapterDefinition): LegacyChapterRegistration {
  const stageIds = definition.levels.map(level => level.id);
  const stages = definition.levels.map((level, index) => createLegacyStageModule(
    level,
    definition.id,
    index,
    stageIds[index + 1] ?? 'campaign.complete',
  ));
  return {
    chapter: {
      schemaVersion: 1,
      id: definition.id,
      revision: 1,
      title: definition.title,
      stageIds,
      entryStageId: stageIds[0],
      tags: ['legacy'],
    },
    stages,
  };
}

export function registerLegacyStages(registry: StageRegistry): void {
  LEGACY_CHAPTER_DEFINITIONS
    .map(createLegacyChapterRegistration)
    .forEach(({ chapter, stages }) => registry.registerChapter(chapter, stages));
}
