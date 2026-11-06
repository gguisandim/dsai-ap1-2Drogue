import type { ChapterTemplate } from '../../examples/chapter-template';
import type {
  CampaignChapterEntry,
  PlaytestPlanView,
  PlaytestRoutesView,
} from '../../stages';
import { createTemplateStagePlan } from '../../cli/chapter/planGenerator';
import type {
  WorldLabPlanSource,
  WorldLabValidationSource,
} from './contracts';

/**
 * Browser-only discovery of authoring chapters and stage plans. The Vite glob is
 * static: newly created chapters appear after the development server restarts.
 */
const PLAN_MODULES = import.meta.glob<Record<string, unknown>>(
  '../../examples/chapters/*/stage-plan.json',
  { eager: true, import: 'default' },
);
const CHAPTER_MODULES = import.meta.glob<Record<string, unknown>>(
  '../../examples/chapters/*/index.ts',
  { eager: true },
);

function planStageId(value: Record<string, unknown>): string | undefined {
  return typeof value.stageId === 'string' ? value.stageId : undefined;
}

function templateStageId(value: Record<string, unknown>): string | undefined {
  const template = value.CHAPTER_TEMPLATE as ChapterTemplate | undefined;
  return template?.stage?.manifest?.id;
}

/** Authoring chapters discovered by the same static Vite glob as the preview. */
export function authoringChapters(): readonly CampaignChapterEntry[] {
  const entries = new Map<string, CampaignChapterEntry>();
  Object.values(CHAPTER_MODULES).forEach(value => {
    if (!value || typeof value !== 'object') return;
    const template = value.CHAPTER_TEMPLATE as ChapterTemplate | undefined;
    const entry = template?.entry ?? value.CHAPTER_TEMPLATE_ENTRY as CampaignChapterEntry | undefined;
    if (entry?.chapter?.id) entries.set(entry.chapter.id, entry);
  });
  return Object.freeze([...entries.values()]);
}

export function createAuthoringValidationSource(): WorldLabValidationSource {
  const plans = new Map<string, PlaytestPlanView>();
  Object.values(PLAN_MODULES).forEach(value => {
    if (!value || typeof value !== 'object') return;
    const stageId = planStageId(value);
    if (stageId) plans.set(stageId, value as unknown as PlaytestPlanView);
  });
  const templates = new Map<string, ChapterTemplate>();
  Object.values(CHAPTER_MODULES).forEach(value => {
    if (!value || typeof value !== 'object') return;
    const stageId = templateStageId(value);
    const template = value.CHAPTER_TEMPLATE as ChapterTemplate | undefined;
    if (stageId && template) templates.set(stageId, template);
  });
  return Object.freeze({
    planForStage(stageId: string): WorldLabPlanSource | undefined {
      const template = templates.get(stageId);
      if (template?.geometry) {
        return Object.freeze({
          plan: createTemplateStagePlan(template),
          source: 'generated' as const,
        });
      }
      const plan = plans.get(stageId);
      return plan ? Object.freeze({ plan, source: 'file' as const }) : undefined;
    },
    routesForStage(stageId: string): PlaytestRoutesView | undefined {
      const template = templates.get(stageId);
      const routes = template?.geometry?.routes;
      if (!routes?.main) return undefined;
      return Object.freeze({
        main: Object.freeze(routes.main.map(point => Object.freeze({ ...point }))),
        ...(routes.branch
          ? { branch: Object.freeze(routes.branch.map(point => Object.freeze({ ...point }))) }
          : {}),
      });
    },
    seedForStage(stageId: string): number | null {
      return templates.get(stageId)?.geometry?.seed ?? null;
    },
  });
}
