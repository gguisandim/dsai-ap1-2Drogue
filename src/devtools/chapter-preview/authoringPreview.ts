import type { CampaignChapterEntry } from '../../stages';
import type { GameIndividualSession } from '../../application/stages';
import {
  entryFromPreviewModule,
  startAuthoringChapterPreview,
  startProductionStagePreview,
  type ChapterPreviewModule,
} from './ChapterPreviewService';

const AUTHORING_MODULES = import.meta.glob<ChapterPreviewModule>(
  '../../examples/chapters/*/index.ts',
);
const SLUG = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

export interface VisualPreviewStart {
  readonly kind: 'chapter' | 'stage';
  readonly label: string;
  readonly stageId: string;
  readonly chapterId: string;
  readonly presentationVariantId?: string;
  readonly session: GameIndividualSession;
}

export interface VisualPreviewFailure {
  readonly code: string;
  readonly message: string;
  readonly diagnostics?: readonly unknown[];
}

export interface VisualPreviewUnavailable {
  readonly code: 'not-development' | 'no-preview-parameter';
  readonly message: string;
}

function slugFromModulePath(modulePath: string): string | undefined {
  const match = /\/chapters\/([^/]+)\/index\.ts$/.exec(modulePath);
  return match?.[1];
}

export function authoringChapterSlugs(): readonly string[] {
  return Object.freeze(Object.keys(AUTHORING_MODULES)
    .map(slugFromModulePath)
    .filter((slug): slug is string => slug !== undefined)
    .sort());
}

async function loadAuthoringEntry(slug: string): Promise<CampaignChapterEntry | undefined> {
  if (!SLUG.test(slug)) return undefined;
  const moduleKey = Object.keys(AUTHORING_MODULES).find(path => slugFromModulePath(path) === slug);
  if (!moduleKey) return undefined;
  const loaded = await AUTHORING_MODULES[moduleKey]();
  return entryFromPreviewModule(loaded);
}

/**
 * Resolves a development-only visual preview from explicit query parameters.
 * Slugs are restricted to the statically discovered authoring directory; no
 * arbitrary path, URL or remote module is accepted.
 */
export async function startVisualPreviewFromQuery(
  search: string,
): Promise<VisualPreviewStart | VisualPreviewFailure | VisualPreviewUnavailable> {
  if (!import.meta.env.DEV) {
    return Object.freeze({
      code: 'not-development' as const,
      message: 'Visual chapter preview is only available in the Vite development server.',
    });
  }
  const query = new URLSearchParams(search);
  const chapterSlug = query.get('chapterPreview')?.trim();
  const stagePreview = query.get('stagePreview')?.trim();
  const presentationVariantId = query.get('presentationVariant')?.trim() || undefined;
  if (!chapterSlug && !stagePreview) {
    return Object.freeze({
      code: 'no-preview-parameter' as const,
      message: 'No chapterPreview or stagePreview query parameter was provided.',
    });
  }

  if (chapterSlug) {
    if (!SLUG.test(chapterSlug)) {
      return Object.freeze({
        code: 'chapter-preview.invalid-slug' as const,
        message: `Invalid authoring chapter slug: ${chapterSlug}.`,
      });
    }
    const entry = await loadAuthoringEntry(chapterSlug);
    if (!entry) {
      return Object.freeze({
        code: 'chapter-preview.not-found' as const,
        message: `Authoring chapter is not statically discoverable: ${chapterSlug}.`,
      });
    }
    const requestedStageId = query.get('stageId')?.trim() || undefined;
    const started = startAuthoringChapterPreview(entry, {
      ...(requestedStageId ? { stageId: requestedStageId } : {}),
      ...(presentationVariantId ? { presentationVariantId } : {}),
    });
    if (!started.ok) return Object.freeze({
      code: started.code,
      message: started.message,
      diagnostics: started.diagnostics,
    });
    return Object.freeze({
      kind: 'chapter' as const,
      label: entry.chapter.title,
      stageId: started.session.stageId,
      chapterId: entry.chapter.id,
      ...(presentationVariantId ? { presentationVariantId } : {}),
      session: started.session,
    });
  }

  if (!stagePreview) {
    return Object.freeze({
      code: 'chapter-preview.not-found' as const,
      message: 'No stage was provided for preview.',
    });
  }
  const started = startProductionStagePreview(stagePreview, presentationVariantId);
  if (!started) {
    return Object.freeze({
      code: 'stage-preview.failed' as const,
      message: `Production stage is not individually loadable: ${stagePreview}.`,
    });
  }
  return Object.freeze({
    kind: 'stage' as const,
    label: started.session.loadedStage.manifest.title,
    stageId: started.session.stageId,
    chapterId: started.session.loadedStage.manifest.chapterId,
    ...(presentationVariantId ? { presentationVariantId } : {}),
    session: started.session,
  });
}
