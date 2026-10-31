import fs from 'node:fs';
import path from 'node:path';
import type { CampaignChapterEntry } from '../../stages';
import { ChapterCliError } from './errors';
import type { LoadedChapterModule } from './types';

/** Loads a generated chapter through its local index.ts. */
export function loadChapterModule(chapterDir: string): LoadedChapterModule {
  if (!fs.existsSync(chapterDir) || !fs.statSync(chapterDir).isDirectory()) {
    throw new ChapterCliError('chapter-not-found', `Chapter directory is missing: ${chapterDir}.`);
  }
  const indexPath = path.join(chapterDir, 'index.ts');
  if (!fs.existsSync(indexPath)) {
    throw new ChapterCliError('chapter-module-missing', `Chapter index.ts is missing: ${indexPath}.`);
  }
  try {
    const resolved = require.resolve(indexPath);
    delete require.cache[resolved];
    return require(indexPath) as LoadedChapterModule;
  } catch (error) {
    throw new ChapterCliError(
      'chapter-load-failed',
      `Chapter module could not be loaded: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export function entryFromModule(module: LoadedChapterModule): CampaignChapterEntry {
  const entry = module.CHAPTER_TEMPLATE?.entry ?? module.CHAPTER_TEMPLATE_ENTRY;
  if (!entry) {
    throw new ChapterCliError(
      'chapter-module-invalid',
      'Generated chapter must export CHAPTER_TEMPLATE or CHAPTER_TEMPLATE_ENTRY.',
    );
  }
  return entry;
}
