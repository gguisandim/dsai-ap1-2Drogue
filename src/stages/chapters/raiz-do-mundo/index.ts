import type { ChapterManifest } from '../../contracts';
import { WORLD_ROOT_STAGE, WORLD_ROOT_CHAPTER_ID, WORLD_ROOT_STAGE_ID } from './worldRootSanctuary';
import { WORLD_ROOT_VISUAL_RESOURCES } from './visuals';

export * from './visuals';
export * from './worldRootSanctuary';

export const WORLD_ROOT_CHAPTER_MANIFEST: ChapterManifest = Object.freeze({
  schemaVersion: 1 as const,
  id: WORLD_ROOT_CHAPTER_ID,
  revision: 2,
  title: 'Prólogo — Floresta das Raízes',
  stageIds: Object.freeze([WORLD_ROOT_STAGE_ID]),
  entryStageId: WORLD_ROOT_STAGE_ID,
  dependencies: Object.freeze([
    Object.freeze({ chapterId: 'chapter.aguas', minimumRevision: 1 }),
  ]),
  visualResources: WORLD_ROOT_VISUAL_RESOURCES,
  capabilities: Object.freeze([
    Object.freeze({ id: 'navigation.physical-exit', category: 'navigation' as const, minimumVersion: 1, requirement: 'required' as const }),
    Object.freeze({ id: 'effect.level-decoration', category: 'effect' as const, minimumVersion: 1, requirement: 'required' as const }),
  ]),
  tags: Object.freeze(['prologue', 'amazon', 'forest', 'sanctuary', 'campaign-entry']),
});

export const WORLD_ROOT_CHAPTER_STAGES = Object.freeze([WORLD_ROOT_STAGE]);

/** Production chapter entry exposed to the authoring CLI through --chapters-dir. */
export const CHAPTER_TEMPLATE_ENTRY = Object.freeze({
  chapter: WORLD_ROOT_CHAPTER_MANIFEST,
  stages: WORLD_ROOT_CHAPTER_STAGES,
  regions: Object.freeze([]),
});

