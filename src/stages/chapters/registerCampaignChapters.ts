import {
  CAMPAIGN_CHAPTER_CATALOG,
  type CampaignChapterEntry,
} from './CampaignChapterCatalog';
import { StageRegistry } from '../runtime/StageRegistry';

/**
 * Registers every campaign chapter declared in the catalog. Adding a chapter
 * means adding a catalog entry, not editing this function. The catalog is
 * injectable so tests can prove an extra entry registers without touching
 * central files.
 */
export function registerCampaignChapters(
  registry: StageRegistry,
  catalog: readonly CampaignChapterEntry[] = CAMPAIGN_CHAPTER_CATALOG,
): void {
  for (const entry of catalog) {
    registry.registerChapter(entry.chapter, entry.stages);
  }
}
