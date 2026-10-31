import type { ChapterManifest } from '../../contracts';
import { WORLD_ROOT_STAGE, WORLD_ROOT_CHAPTER_ID, WORLD_ROOT_STAGE_ID } from './worldRootSanctuary';
import { WORLD_ROOT_VISUAL_RESOURCES } from './visuals';

export * from './visuals';
export * from './worldRootSanctuary';

export const WORLD_ROOT_CHAPTER_MANIFEST: ChapterManifest = Object.freeze({
  schemaVersion: 1 as const,
  id: WORLD_ROOT_CHAPTER_ID,
  revision: 1,
  title: 'Prólogo — Raiz do Mundo',
  stageIds: Object.freeze([WORLD_ROOT_STAGE_ID]),
  entryStageId: WORLD_ROOT_STAGE_ID,
  visualResources: WORLD_ROOT_VISUAL_RESOURCES,
  capabilities: Object.freeze([
    Object.freeze({ id: 'navigation.physical-exit', category: 'navigation' as const, minimumVersion: 1, requirement: 'required' as const }),
    Object.freeze({ id: 'effect.level-decoration', category: 'effect' as const, minimumVersion: 1, requirement: 'required' as const }),
  ]),
  tags: Object.freeze(['prologue', 'amazon', 'sanctuary']),
});

export const WORLD_ROOT_CHAPTER_STAGES = Object.freeze([WORLD_ROOT_STAGE]);

