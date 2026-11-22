import type { ChapterManifest } from '../../contracts';
import { PALACIO_VISUAL_RESOURCES } from './visuals';
import {
  PALACIO_DO_CREDOR_ARUA_DIALOGUE_ID,
  PALACIO_DO_CREDOR_CHAPTER_ID,
  PALACIO_DO_CREDOR_EPILOGUE_EVENT_IDS,
  PALACIO_DO_CREDOR_EXIT_EVENT_ID,
  PALACIO_DO_CREDOR_STAGE,
} from './palacioDoCredorStage';
import { PALACIO_DO_CREDOR_STAGE_ID } from './palacioDoCredorMap';

export * from './palacioDoCredorMap';
export * from './palacioDoCredorStage';
export * from './visuals';

export const PALACIO_DO_CREDOR_CHAPTER_MANIFEST: ChapterManifest = Object.freeze({
  schemaVersion: 1 as const,
  id: PALACIO_DO_CREDOR_CHAPTER_ID,
  revision: 1,
  title: 'Palácio do Credor',
  stageIds: Object.freeze([PALACIO_DO_CREDOR_STAGE_ID]),
  entryStageId: PALACIO_DO_CREDOR_STAGE_ID,
  visualResources: PALACIO_VISUAL_RESOURCES,
  tags: Object.freeze(['final', 'palacio-do-credor', 'amazon', 'authored']),
});

export const PALACIO_DO_CREDOR_CHAPTER_STAGES = Object.freeze([PALACIO_DO_CREDOR_STAGE]);

/**
 * The macro region `final.palacio-do-credor` still belongs to the canonical
 * campaign skeleton and keeps its milestone unlock. This entry deliberately has
 * no region binding yet: it is available for individual play and prepared for a
 * later campaign SPEC, without declaring unfinished milestones as complete.
 */
export const PALACIO_DO_CREDOR_CHAPTER_ENTRY = Object.freeze({
  chapter: PALACIO_DO_CREDOR_CHAPTER_MANIFEST,
  stages: PALACIO_DO_CREDOR_CHAPTER_STAGES,
  regions: Object.freeze([]),
});

export const PALACIO_DO_CREDOR_DIALOGUE_IDS = Object.freeze([
  PALACIO_DO_CREDOR_ARUA_DIALOGUE_ID,
]);

export const PALACIO_DO_CREDOR_EVENT_IDS = Object.freeze([
  ...PALACIO_DO_CREDOR_EPILOGUE_EVENT_IDS,
  PALACIO_DO_CREDOR_EXIT_EVENT_ID,
]);

/** Conventional authoring CLI export; points to the production catalog entry. */
export const CHAPTER_TEMPLATE_ENTRY = PALACIO_DO_CREDOR_CHAPTER_ENTRY;
