import type { ChapterManifest } from '../../contracts';
import { VEILED_GARDENS_VISUAL_RESOURCES } from './visuals';
import {
  VEILED_GARDENS_CHAPTER_ID,
  VEILED_GARDENS_COMPLETION_EVENT_ID,
  VEILED_GARDENS_IARAI_DIALOGUE_ID,
  VEILED_GARDENS_STAGE,
} from './veiledGardensStage';
import { VEILED_GARDENS_STAGE_ID } from './veiledGardensMap';

export * from './veiledGardensMap';
export * from './veiledGardensStage';
export * from './visuals';

export const VEILED_GARDENS_CHAPTER_MANIFEST: ChapterManifest = Object.freeze({
  schemaVersion: 1 as const,
  id: VEILED_GARDENS_CHAPTER_ID,
  revision: 2,
  title: 'Rota da Floresta — Jardins das Flores Veladas',
  stageIds: Object.freeze([VEILED_GARDENS_STAGE_ID]),
  entryStageId: VEILED_GARDENS_STAGE_ID,
  visualResources: VEILED_GARDENS_VISUAL_RESOURCES,
  tags: Object.freeze(['route.floresta', 'region.floresta.flores', 'amazon', 'authored']),
});

export const VEILED_GARDENS_CHAPTER_STAGES = Object.freeze([VEILED_GARDENS_STAGE]);

export const VEILED_GARDENS_CHAPTER_ENTRY = Object.freeze({
  chapter: VEILED_GARDENS_CHAPTER_MANIFEST,
  stages: VEILED_GARDENS_CHAPTER_STAGES,
  regions: Object.freeze([Object.freeze({
    regionId: 'region.floresta.flores',
    stageId: VEILED_GARDENS_STAGE_ID,
    minimumManifestRevision: 2,
    title: 'Jardins das Flores Veladas',
    dialogueIds: Object.freeze([VEILED_GARDENS_IARAI_DIALOGUE_ID]),
    eventIds: Object.freeze([VEILED_GARDENS_COMPLETION_EVENT_ID]),
  })]),
});

/** Conventional authoring CLI export; points to the production catalog entry. */
export const CHAPTER_TEMPLATE_ENTRY = VEILED_GARDENS_CHAPTER_ENTRY;
