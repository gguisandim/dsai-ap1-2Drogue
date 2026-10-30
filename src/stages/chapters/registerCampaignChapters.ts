import {
  CAMPAIGN_CHAPTER_CATALOG,
  CampaignChapterCatalogError,
  type CampaignChapterEntry,
  validateCampaignChapterCatalog,
} from './CampaignChapterCatalog';
import { StageRegistry } from '../runtime/StageRegistry';
import { StageValidator } from '../runtime/StageValidator';

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
  const catalogDiagnostics = validateCampaignChapterCatalog(catalog);
  const compatibilityDiagnostics = new StageValidator().validate(
    [...registry.listChapters(), ...catalog.map(entry => entry.chapter)],
    [...registry.listModules(), ...catalog.flatMap(entry => entry.stages)],
  );
  const diagnostics = [
    ...catalogDiagnostics,
    ...compatibilityDiagnostics.map(item => ({
      code: item.code, severity: item.severity, message: item.message,
      path: item.path, ...(item.referenceId ? { referenceId: item.referenceId } : {}),
    })),
  ];
  if (diagnostics.some(item => item.severity === 'error')) {
    throw new CampaignChapterCatalogError(diagnostics);
  }
  for (const entry of catalog) {
    registry.registerChapter(entry.chapter, entry.stages);
  }
}
