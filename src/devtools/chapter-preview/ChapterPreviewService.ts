import {
  CAMPAIGN_CHAPTER_CATALOG,
  StageRegistry,
  registerCampaignChapters,
  registerLegacyStages,
  type CampaignChapterEntry,
  type StageDiagnostic,
} from '../../stages';
import {
  GameSessionService,
  type GameIndividualSession,
} from '../../application/stages';

export interface ChapterPreviewModule {
  readonly CHAPTER_TEMPLATE?: { readonly entry: CampaignChapterEntry };
  readonly CHAPTER_TEMPLATE_ENTRY?: CampaignChapterEntry;
}

export type ChapterPreviewResult =
  | {
      readonly ok: true;
      readonly entry: CampaignChapterEntry;
      readonly registry: StageRegistry;
      readonly session: GameIndividualSession;
    }
  | {
      readonly ok: false;
      readonly code: 'module-invalid' | 'session-failed';
      readonly message: string;
      readonly diagnostics: readonly StageDiagnostic[];
    };

export function entryFromPreviewModule(module: ChapterPreviewModule): CampaignChapterEntry | undefined {
  return module.CHAPTER_TEMPLATE?.entry ?? module.CHAPTER_TEMPLATE_ENTRY;
}

/**
 * Registers a generated chapter through the public injectable catalog. The
 * production list is copied, never mutated.
 */
export function createAuthoringChapterRegistry(
  entry: CampaignChapterEntry,
  includeProductionCatalog = true,
): StageRegistry {
  const registry = new StageRegistry();
  registerLegacyStages(registry);
  registerCampaignChapters(registry, includeProductionCatalog
    ? [...CAMPAIGN_CHAPTER_CATALOG, entry]
    : [entry]);
  return registry;
}

export function startAuthoringChapterPreview(
  entry: CampaignChapterEntry,
  options: { readonly stageId?: string; readonly presentationVariantId?: string } = {},
): ChapterPreviewResult {
  const stageId = options.stageId ?? entry.chapter.entryStageId ?? entry.stages[0]?.manifest.id;
  if (!stageId) {
    return Object.freeze({
      ok: false as const,
      code: 'module-invalid' as const,
      message: 'Generated chapter has no stage to preview.',
      diagnostics: Object.freeze([]),
    });
  }
  try {
    const registry = createAuthoringChapterRegistry(entry);
    const service = new GameSessionService({ registry });
    const started = service.startIndividualStage(stageId, {
      ...(options.presentationVariantId !== undefined
        ? { presentationVariantId: options.presentationVariantId }
        : {}),
    });
    if (!started.ok) {
      return Object.freeze({
        ok: false as const,
        code: 'session-failed' as const,
        message: `${started.error.code}: ${started.error.message}`,
        diagnostics: Object.freeze(started.error.stage?.diagnostics ?? []),
      });
    }
    return Object.freeze({ ok: true as const, entry, registry, session: started.value });
  } catch (error) {
    return Object.freeze({
      ok: false as const,
      code: 'session-failed' as const,
      message: error instanceof Error ? error.message : String(error),
      diagnostics: Object.freeze([]),
    });
  }
}

export interface ProductionStagePreview {
  readonly registry: StageRegistry;
  readonly session: GameIndividualSession;
}

/**
 * Development-only convenience for the Igapó presentations. It uses the same
 * production catalog and individual session path as the normal menu.
 */
export function startProductionStagePreview(
  stageId: string,
  presentationVariantId?: string,
): ProductionStagePreview | undefined {
  const registry = new StageRegistry();
  registerLegacyStages(registry);
  registerCampaignChapters(registry);
  const service = new GameSessionService({ registry });
  const started = service.startIndividualStage(stageId, {
    ...(presentationVariantId !== undefined ? { presentationVariantId } : {}),
  });
  if (!started.ok) return undefined;
  return Object.freeze({ registry, session: started.value });
}
