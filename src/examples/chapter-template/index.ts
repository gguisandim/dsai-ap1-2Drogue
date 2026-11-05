export * from './ids';
export * from './geometry';
export * from './level';
export * from './presentation';
export * from './encounter';
export * from './narrative';
export * from './stage';
export * from './chapter';
export * from './registration';
export * from './template';

import { createChapterTemplate } from './template';

/** Ready-to-use example chapter. Copy the folder or call the factory. */
export const CHAPTER_TEMPLATE = createChapterTemplate('example.beacon');
export const CHAPTER_TEMPLATE_ENTRY = CHAPTER_TEMPLATE.entry;
export const CHAPTER_TEMPLATE_CHAPTER_ID = CHAPTER_TEMPLATE.ids.chapterId;
export const CHAPTER_TEMPLATE_STAGE_ID = CHAPTER_TEMPLATE.ids.stageId;
export const CHAPTER_TEMPLATE_IDS = CHAPTER_TEMPLATE.ids;
