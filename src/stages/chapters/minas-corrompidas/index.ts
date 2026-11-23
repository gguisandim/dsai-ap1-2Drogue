import type { ChapterManifest } from '../../contracts';
import { MINAS_VISUAL_RESOURCES } from './visuals';
import {
  MINAS_CORROMPIDAS_CHAPTER_ID,
  MINAS_CORROMPIDAS_COMPLETION_EVENT_ID,
  MINAS_CORROMPIDAS_MAIRA_DIALOGUE_ID,
  MINAS_CORROMPIDAS_STAGE,
} from './minasCorrompidasStage';
import { MINAS_CORROMPIDAS_STAGE_ID } from './minasCorrompidasMap';

export * from './minasCorrompidasMap';
export * from './minasCorrompidasStage';
export * from './visuals';

export const MINAS_CORROMPIDAS_CHAPTER_MANIFEST: ChapterManifest = Object.freeze({
  schemaVersion: 1 as const,
  id: MINAS_CORROMPIDAS_CHAPTER_ID,
  revision: 1,
  title: 'Minas Corrompidas — O Subsolo da Dívida',
  stageIds: Object.freeze([MINAS_CORROMPIDAS_STAGE_ID]),
  entryStageId: MINAS_CORROMPIDAS_STAGE_ID,
  visualResources: MINAS_VISUAL_RESOURCES,
  tags: Object.freeze(['region.corrupted.minas', 'amazon', 'authored', 'individual-only']),
});

export const MINAS_CORROMPIDAS_CHAPTER_STAGES = Object.freeze([MINAS_CORROMPIDAS_STAGE]);

export const MINAS_CORROMPIDAS_CHAPTER_ENTRY = Object.freeze({
  chapter: MINAS_CORROMPIDAS_CHAPTER_MANIFEST,
  stages: MINAS_CORROMPIDAS_CHAPTER_STAGES,
  regions: Object.freeze([]),
});

export const MINAS_CORROMPIDAS_DIALOGUE_IDS = Object.freeze([MINAS_CORROMPIDAS_MAIRA_DIALOGUE_ID]);
export const MINAS_CORROMPIDAS_EVENT_IDS = Object.freeze([MINAS_CORROMPIDAS_COMPLETION_EVENT_ID]);
export const CHAPTER_TEMPLATE_ENTRY = MINAS_CORROMPIDAS_CHAPTER_ENTRY;

