import {
  CAMPAIGN_CHAPTER_CATALOG,
  StageRegistry,
  registerCampaignChapters,
  registerLegacyStages,
  type CampaignChapterEntry,
  type ChapterManifest,
  type StageModule,
} from '../../stages';

export function createTemplateChapterEntry(
  chapter: ChapterManifest,
  stage: StageModule,
): CampaignChapterEntry {
  return Object.freeze({
    chapter,
    stages: Object.freeze([stage]),
    regions: Object.freeze([]),
  });
}

/**
 * Registers the template chapter through the existing injectable catalog
 * boundary. It never edits the production catalog.
 */
export function registerChapterTemplate(
  registry: StageRegistry,
  entry: CampaignChapterEntry,
): void {
  registerCampaignChapters(registry, [entry]);
}

/**
 * Isolation helper for tests and tooling. Pass `includeProductionCatalog:
 * false` for a registry containing only legacy stages plus the template.
 */
export function createChapterTemplateRegistry(
  entry: CampaignChapterEntry,
  includeProductionCatalog = true,
): StageRegistry {
  const registry = new StageRegistry();
  registerLegacyStages(registry);
  if (includeProductionCatalog) registerCampaignChapters(registry);
  registerChapterTemplate(registry, entry);
  return registry;
}

export { CAMPAIGN_CHAPTER_CATALOG };
