import path from 'node:path';
import {
  PLAYTEST_CHARACTER,
  StagePlaytestValidator,
  type PlaytestCameraResult,
  type PlaytestPlanView,
  type PlaytestRoutesView,
  type PlaytestStatus,
  type StagePlaytestSeedReport,
} from '../../stages';
import type {
  ChapterTemplate,
  TemplateGeometry,
} from '../../examples/chapter-template';
import { entryFromModule } from './loader';
import {
  STAGE_PLAN_FILENAME,
  validateStagePlan,
  validateStagePlanFile,
  type StagePlan,
} from './plan';
import { createTemplateStagePlan } from './planGenerator';
import type {
  ChapterFileSystem,
  ChapterValidationReport,
  CliDiagnostic,
  LoadedChapterModule,
} from './types';
import { validateChapterEntry } from './validation';

export const PLAYTEST_REPORT_KIND = 'umbra.stage-playtest.report' as const;
export const PLAYTEST_REPORT_SCHEMA_VERSION = 1 as const;

export interface PlaytestPlanReport {
  readonly source: 'file' | 'generated' | 'none';
  readonly planId: string | null;
  readonly diagnostics: readonly CliDiagnostic[];
}

export interface PlaytestSeedEntry extends StagePlaytestSeedReport {
  readonly plan: PlaytestPlanReport;
  readonly validation: {
    readonly errors: number;
    readonly warnings: number;
  };
}

export interface PlaytestChapterReport {
  readonly schemaVersion: typeof PLAYTEST_REPORT_SCHEMA_VERSION;
  readonly kind: typeof PLAYTEST_REPORT_KIND;
  readonly chapterId: string;
  readonly stageId: string;
  readonly title: string;
  readonly template: string | null;
  readonly result: PlaytestStatus;
  readonly summary: {
    readonly seeds: number;
    readonly passed: number;
    readonly failed: number;
    readonly unknown: number;
    readonly checks: number;
    readonly failedChecks: number;
    readonly unknownChecks: number;
  };
  readonly validation: {
    readonly errors: number;
    readonly warnings: number;
    readonly diagnostics: readonly CliDiagnostic[];
  };
  readonly seeds: readonly PlaytestSeedEntry[];
  readonly runtime: {
    readonly phaser: 'not-executed';
    readonly liveExecution: 'UNKNOWN';
  };
}

export interface PlaytestChapterRequest {
  readonly module: LoadedChapterModule;
  readonly chapterDir: string;
  readonly planDisplayPath: string;
  readonly fileSystem: ChapterFileSystem;
  readonly seed?: number;
  readonly seeds?: number;
}

interface SeedRequest {
  readonly seed: number | null;
  readonly source: 'authored' | 'explicit' | 'variant';
}

interface SeedResolution {
  readonly stage: ChapterTemplate['stage'];
  readonly chapterStageIds: readonly string[];
  readonly validation: ChapterValidationReport;
  readonly plan: PlaytestPlanReport;
  readonly planView: PlaytestPlanView | undefined;
  readonly routes: PlaytestRoutesView | undefined;
}

function planViewFrom(plan: unknown): PlaytestPlanView | undefined {
  if (!plan || typeof plan !== 'object' || Array.isArray(plan)) return undefined;
  const candidate = plan as Partial<StagePlan>;
  if (typeof candidate.id !== 'string' || !Array.isArray(candidate.regions) ||
    !Array.isArray(candidate.objectives) || !Array.isArray(candidate.exitConditions)) {
    return undefined;
  }
  return plan as PlaytestPlanView;
}

function routesFrom(geometry: TemplateGeometry | undefined): PlaytestRoutesView | undefined {
  if (!geometry?.routes?.main) return undefined;
  return Object.freeze({
    main: Object.freeze(geometry.routes.main.map(point => Object.freeze({ ...point }))),
    ...(geometry.routes.branch
      ? { branch: Object.freeze(geometry.routes.branch.map(point => Object.freeze({ ...point }))) }
      : {}),
  });
}

function createSeedVariant(
  module: LoadedChapterModule,
  base: ChapterTemplate,
  seed: number,
): ChapterTemplate | undefined {
  const factory = module.createChapterTemplate;
  const geometry = base.geometry;
  if (typeof factory !== 'function' || !geometry || !geometry.template) return undefined;
  try {
    const variant = factory(base.namespace, {
      revision: base.chapter.revision,
      title: base.chapter.title,
      stageTitle: base.stage.manifest.title,
      summary: base.stage.manifest.summary,
      template: geometry.template,
      seed,
      width: geometry.width,
      height: geometry.height,
      regionCount: geometry.regionCount,
    });
    if (!variant?.geometry || variant.geometry.seed !== seed ||
      variant.geometry.template !== geometry.template) return undefined;
    return variant;
  } catch {
    return undefined;
  }
}

function unsupportedSeedReport(seed: number | null, message: string): StagePlaytestSeedReport {
  const camera: PlaytestCameraResult = Object.freeze({
    status: 'UNKNOWN' as const,
    worldWidth: null,
    worldHeight: null,
    viewportWidth: 1280,
    viewportHeight: 720,
    message,
  });
  const check = Object.freeze({
    id: 'playtest.seed',
    code: 'PLAYTEST_SEED_UNSUPPORTED',
    status: 'UNKNOWN' as const,
    required: true,
    message,
    suggestion: 'Expose createChapterTemplate with geometry options, or use a generated panoramic template chapter.',
  });
  return Object.freeze({
    seed,
    source: 'variant' as const,
    result: 'UNKNOWN' as const,
    character: PLAYTEST_CHARACTER,
    checks: Object.freeze([check]),
    diagnostics: Object.freeze([Object.freeze({
      code: check.code,
      severity: 'warning' as const,
      message: check.message,
      path: Object.freeze(['checks', check.id]),
      suggestion: check.suggestion,
    })]),
    regions: Object.freeze([]),
    camera,
    liveExecution: 'not-executed' as const,
  });
}

function resolveAuthored(
  entry: ReturnType<typeof entryFromModule>,
  template: ChapterTemplate | undefined,
  fileSystem: ChapterFileSystem,
  planFile: string,
  planDisplayPath: string,
): SeedResolution {
  const stage = template?.stage ?? entry.stages[0];
  const validation = validateChapterEntry(entry);
  let plan: PlaytestPlanReport = Object.freeze({
    source: 'none' as const, planId: null, diagnostics: Object.freeze([]),
  });
  let planView: PlaytestPlanView | undefined;
  if (fileSystem.exists(planFile)) {
    const report = validateStagePlanFile(planFile, fileSystem, planDisplayPath, stage);
    let parsed: unknown;
    try {
      parsed = JSON.parse(fileSystem.readFile(planFile));
    } catch {
      parsed = undefined;
    }
    planView = planViewFrom(parsed);
    plan = Object.freeze({
      source: 'file' as const,
      planId: planView?.id ?? null,
      diagnostics: report.diagnostics,
    });
  }
  return {
    stage,
    chapterStageIds: entry.chapter.stageIds,
    validation,
    plan,
    planView,
    routes: routesFrom(template?.geometry),
  };
}

function resolveVariant(
  variant: ChapterTemplate,
  planDisplayPath: string,
): SeedResolution {
  const validation = validateChapterEntry(variant.entry);
  const generated = createTemplateStagePlan(variant);
  const report = validateStagePlan(generated, planDisplayPath, variant.stage);
  return {
    stage: variant.stage,
    chapterStageIds: variant.entry.chapter.stageIds,
    validation,
    plan: Object.freeze({
      source: 'generated' as const,
      planId: generated.id,
      diagnostics: report.diagnostics,
    }),
    planView: planViewFrom(generated),
    routes: routesFrom(variant.geometry),
  };
}

function requestedSeeds(
  request: PlaytestChapterRequest,
  baseSeed: number | null,
): readonly SeedRequest[] {
  if (request.seed !== undefined) return Object.freeze([{ seed: request.seed, source: 'explicit' as const }]);
  if (request.seeds !== undefined) {
    if (baseSeed === null) return Object.freeze([{ seed: null, source: 'variant' as const }]);
    return Object.freeze(Array.from({ length: request.seeds }, (_, index) => ({
      seed: baseSeed + index,
      source: index === 0 ? 'authored' as const : 'variant' as const,
    })));
  }
  return Object.freeze([{ seed: baseSeed, source: 'authored' as const }]);
}

export function playtestChapter(request: PlaytestChapterRequest): PlaytestChapterReport {
  const template = request.module.CHAPTER_TEMPLATE;
  const entry = entryFromModule(request.module);
  const stage = template?.stage ?? entry.stages[0];
  const baseSeed = template?.geometry?.seed ?? null;
  const planFile = path.join(request.chapterDir, STAGE_PLAN_FILENAME);
  const validator = new StagePlaytestValidator();
  const authored = resolveAuthored(
    entry, template, request.fileSystem, planFile, request.planDisplayPath,
  );
  const seeds: PlaytestSeedEntry[] = [];

  for (const requested of requestedSeeds(request, baseSeed)) {
    let resolution: SeedResolution;
    if (requested.source === 'authored' ||
      (baseSeed !== null && requested.seed === baseSeed)) {
      resolution = authored;
    } else if (!template || requested.seed === null) {
      seeds.push(Object.freeze({
        ...unsupportedSeedReport(
          requested.seed,
          `Chapter ${entry.chapter.id} does not expose a deterministic seed factory.`,
        ),
        plan: Object.freeze({ source: 'none' as const, planId: null, diagnostics: Object.freeze([]) }),
        validation: Object.freeze({ errors: 0, warnings: 0 }),
      }));
      continue;
    } else {
      const variant = createSeedVariant(request.module, template, requested.seed);
      if (!variant) {
        seeds.push(Object.freeze({
          ...unsupportedSeedReport(
            requested.seed,
            `Chapter ${entry.chapter.id} cannot regenerate geometry for seed ${requested.seed}.`,
          ),
          plan: Object.freeze({ source: 'none' as const, planId: null, diagnostics: Object.freeze([]) }),
          validation: Object.freeze({ errors: 0, warnings: 0 }),
        }));
        continue;
      }
      resolution = resolveVariant(variant, request.planDisplayPath);
    }

    const loaded = resolution.validation.loadedStages.find(item =>
      item.manifest.id === resolution.stage.manifest.id);
    const result = validator.validate({
      stage: resolution.stage,
      ...(loaded ? { level: loaded.level, encounter: loaded.encounter } : {}),
      ...(resolution.planView ? { plan: resolution.planView } : {}),
      ...(resolution.routes ? { routes: resolution.routes } : {}),
      chapterStageIds: resolution.chapterStageIds,
      seed: requested.seed ?? undefined,
      seedSource: requested.source,
    });
    const blockingValidation = resolution.validation.errors.length > 0;
    const blockingPlan = resolution.plan.diagnostics.some(item => item.severity === 'error');
    const effectiveResult: PlaytestStatus = blockingValidation || blockingPlan ? 'FAIL' : result.result;
    seeds.push(Object.freeze({
      ...result,
      result: effectiveResult,
      plan: resolution.plan,
      validation: Object.freeze({
        errors: resolution.validation.errors.length,
        warnings: resolution.validation.warnings.length,
      }),
    }));
  }

  const failed = seeds.filter(seed => seed.result === 'FAIL').length;
  const unknown = seeds.filter(seed => seed.result === 'UNKNOWN').length;
  const passed = seeds.filter(seed => seed.result === 'PASS').length;
  const checks = seeds.reduce((total, seed) => total + seed.checks.length, 0);
  const failedChecks = seeds.reduce((total, seed) =>
    total + seed.checks.filter(check => check.status === 'FAIL').length, 0);
  const unknownChecks = seeds.reduce((total, seed) =>
    total + seed.checks.filter(check => check.status === 'UNKNOWN').length, 0);
  const result: PlaytestStatus = failed > 0 ? 'FAIL' : unknown > 0 ? 'UNKNOWN' : 'PASS';
  return Object.freeze({
    schemaVersion: PLAYTEST_REPORT_SCHEMA_VERSION,
    kind: PLAYTEST_REPORT_KIND,
    chapterId: entry.chapter.id,
    stageId: stage.manifest.id,
    title: entry.chapter.title,
    template: template?.geometry?.template ?? null,
    result,
    summary: Object.freeze({ seeds: seeds.length, passed, failed, unknown, checks, failedChecks, unknownChecks }),
    validation: Object.freeze({
      errors: authored.validation.errors.length,
      warnings: authored.validation.warnings.length,
      diagnostics: authored.validation.diagnostics,
    }),
    seeds: Object.freeze(seeds),
    runtime: Object.freeze({ phaser: 'not-executed' as const, liveExecution: 'UNKNOWN' as const }),
  });
}

export function playtestExitCode(report: PlaytestChapterReport): number {
  return report.result === 'PASS' ? 0 : 1;
}
