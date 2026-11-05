import type {
  CampaignChapterEntry,
  ChapterManifest,
  StageModule,
} from '../../stages';
import { createTemplateChapter } from './chapter';
import {
  createTemplateGeometry,
  type TemplateGeometry,
  type TemplateGeometryOptions,
} from './geometry';
import { createChapterTemplateIds, type ChapterTemplateIds } from './ids';
import { createTemplateVisualResources } from './presentation';
import { createTemplateChapterEntry } from './registration';
import { createTemplateStage } from './stage';

export interface ChapterTemplateOptions extends TemplateGeometryOptions {
  readonly revision?: number;
  readonly title?: string;
  readonly stageTitle?: string;
  readonly summary?: string;
}

export interface ChapterTemplate {
  readonly namespace: string;
  readonly ids: ChapterTemplateIds;
  readonly chapter: ChapterManifest;
  readonly stage: StageModule;
  readonly entry: CampaignChapterEntry;
  readonly geometry: TemplateGeometry;
}

/**
 * Builds a complete chapter from one namespace and one deterministic geometry
 * configuration. Copying the template or deriving a second chapter is a data
 * operation: no central file changes.
 */
export function createChapterTemplate(
  namespace: string,
  options: ChapterTemplateOptions = {},
): ChapterTemplate {
  const ids = createChapterTemplateIds(namespace);
  const revision = options.revision ?? 1;
  const title = options.title ?? 'Farol de Vidro';
  const stageTitle = options.stageTitle ?? `${title} — Aproximação`;
  const summary = options.summary
    ?? 'Uma câmara autoral independente para demonstrar o ciclo completo de um capítulo.';
  const geometry = createTemplateGeometry({
    ...(options.template !== undefined ? { template: options.template } : {}),
    ...(options.seed !== undefined ? { seed: options.seed } : {}),
    ...(options.width !== undefined ? { width: options.width } : {}),
    ...(options.height !== undefined ? { height: options.height } : {}),
    ...(options.regionCount !== undefined ? { regionCount: options.regionCount } : {}),
  });
  const stage = createTemplateStage(ids, { revision, title: stageTitle, summary, geometry });
  const chapter = createTemplateChapter(ids, {
    revision,
    title,
    visualResources: createTemplateVisualResources(ids),
  });
  const entry = createTemplateChapterEntry(chapter, stage);
  return Object.freeze({
    namespace: ids.namespace,
    ids,
    chapter,
    stage,
    entry,
    geometry,
  });
}
