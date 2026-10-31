import {
  CampaignChapterCatalogError,
  StageCatalogService,
  StageLoader,
  StageRegistry,
  StageRegistryError,
  registerCampaignChapters,
  type CampaignChapterEntry,
  type LoadedStage,
  type StageCatalogDiagnostic,
  type StageCatalogEntry,
  type StageDiagnostic,
} from '../../stages';
import {
  StageDirector,
  type NarrativeDiagnostic,
  type NarrativeContent,
} from '../../narrative';
import type {
  ChapterValidationReport,
  CliDiagnostic,
  CliDiagnosticOrigin,
  CliDiagnosticSeverity,
} from './types';

const SEVERITY_RANK: Readonly<Record<CliDiagnosticSeverity, number>> = Object.freeze({
  error: 3,
  warning: 2,
  info: 1,
});

function componentFor(origin: CliDiagnosticOrigin): string {
  switch (origin) {
    case 'registration': return 'stages/registration';
    case 'validator': return 'stages/validator';
    case 'catalog': return 'stages/catalog';
    case 'loader': return 'stages/loader';
    case 'narrative': return 'narrative';
    case 'template': return 'examples/chapter-template';
    case 'filesystem': return 'filesystem';
    case 'runtime': return 'runtime';
    default: return 'cli';
  }
}

function diagnostic(input: {
  readonly code: string;
  readonly severity: CliDiagnosticSeverity;
  readonly message: string;
  readonly path: readonly (string | number)[];
  readonly origin: CliDiagnosticOrigin;
  readonly stageId?: string;
  readonly chapterId?: string;
  readonly referenceId?: string;
}): CliDiagnostic {
  return Object.freeze({
    code: input.code,
    severity: input.severity,
    message: input.message,
    path: Object.freeze([...input.path]),
    origin: input.origin,
    component: componentFor(input.origin),
    ...(input.stageId ? { stageId: input.stageId } : {}),
    ...(input.chapterId ? { chapterId: input.chapterId } : {}),
    ...(input.referenceId ? { referenceId: input.referenceId } : {}),
  });
}

function fromStageDiagnostic(
  value: StageDiagnostic,
  origin: CliDiagnosticOrigin,
): CliDiagnostic {
  return diagnostic({
    code: value.code,
    severity: value.severity,
    message: value.message,
    path: value.path,
    origin,
    ...(value.stageId ? { stageId: value.stageId } : {}),
    ...(value.referenceId ? { referenceId: value.referenceId } : {}),
  });
}

function fromCatalogDiagnostic(
  value: StageCatalogDiagnostic,
  origin: CliDiagnosticOrigin,
): CliDiagnostic {
  return diagnostic({
    code: value.code,
    severity: value.severity,
    message: value.message,
    path: value.path,
    origin,
    ...(value.stageId ? { stageId: value.stageId } : {}),
    ...(value.chapterId ? { chapterId: value.chapterId } : {}),
    ...(value.referenceId ? { referenceId: value.referenceId } : {}),
  });
}

function fromNarrativeDiagnostic(value: NarrativeDiagnostic): CliDiagnostic {
  return diagnostic({
    code: value.code,
    severity: 'error',
    message: value.message,
    path: value.path,
    origin: 'narrative',
    ...(value.referenceId ? { referenceId: value.referenceId } : {}),
  });
}

function dedupe(values: readonly CliDiagnostic[]): readonly CliDiagnostic[] {
  const byKey = new Map<string, CliDiagnostic>();
  for (const value of values) {
    const key = [
      value.code,
      value.path.map(String).join('.'),
      value.stageId ?? '',
      value.referenceId ?? '',
      value.message,
    ].join('|');
    const previous = byKey.get(key);
    if (!previous || SEVERITY_RANK[value.severity] > SEVERITY_RANK[previous.severity]) {
      byKey.set(key, value);
    }
  }
  return Object.freeze([...byKey.values()].sort((left, right) => {
    const severity = SEVERITY_RANK[right.severity] - SEVERITY_RANK[left.severity];
    if (severity !== 0) return severity;
    const leftKey = `${left.code}|${left.path.map(String).join('.')}|${left.referenceId ?? ''}`;
    const rightKey = `${right.code}|${right.path.map(String).join('.')}|${right.referenceId ?? ''}`;
    return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
  }));
}

function narrativeContent(loaded: LoadedStage): NarrativeContent {
  return Object.freeze({
    chapterId: loaded.manifest.chapterId,
    stageId: loaded.manifest.id,
    definition: loaded.narrative,
    npcs: loaded.npcs,
    dialogues: loaded.dialogues,
    missions: loaded.missions,
    events: loaded.events,
    exitIds: Object.freeze(loaded.manifest.exits.map(exit => exit.id)),
  });
}

/**
 * Runs the real registry, catalog, loader and narrative validators. This is the
 * single validation path used by create, validate, inspect and preview.
 */
export function validateChapterEntry(entry: CampaignChapterEntry): ChapterValidationReport {
  const diagnostics: CliDiagnostic[] = [];
  const catalogEntries: StageCatalogEntry[] = [];
  const loadedStages: LoadedStage[] = [];

  let registry: StageRegistry | undefined;
  try {
    registry = new StageRegistry();
    registerCampaignChapters(registry, [entry]);
  } catch (error) {
    if (error instanceof CampaignChapterCatalogError) {
      error.diagnostics.forEach(item => diagnostics.push(fromCatalogDiagnostic(item, 'registration')));
    } else if (error instanceof StageRegistryError) {
      diagnostics.push(diagnostic({
        code: `registration.${error.code}`,
        severity: 'error',
        message: error.message,
        path: [],
        origin: 'registration',
        referenceId: error.referenceId,
      }));
    } else {
      diagnostics.push(diagnostic({
        code: 'registration.failed',
        severity: 'error',
        message: error instanceof Error ? error.message : String(error),
        path: [],
        origin: 'registration',
      }));
    }
    diagnostics.push(diagnostic({
      code: 'registration.failed',
      severity: 'error',
      message: 'Chapter could not be registered through the existing catalog boundary.',
      path: [],
      origin: 'registration',
      referenceId: entry.chapter.id,
    }));
    return finalize(entry, diagnostics, catalogEntries, loadedStages, false, false, undefined, undefined);
  }

  registry.validate().forEach(item => diagnostics.push(fromStageDiagnostic(item, 'validator')));

  let catalog: StageCatalogService | undefined;
  const createdCatalog = StageCatalogService.create(registry);
  if (createdCatalog.ok) {
    catalog = createdCatalog.value;
    catalog.diagnostics().forEach(item => diagnostics.push(fromCatalogDiagnostic(item, 'catalog')));
  } else {
    createdCatalog.error.diagnostics.forEach(item =>
      diagnostics.push(fromCatalogDiagnostic(item, 'catalog')));
  }

  const loader = new StageLoader(registry);
  for (const stage of entry.stages) {
    const loaded = loader.load({
      stageId: stage.manifest.id,
      runId: 'chapter-cli.validate.run',
      runSeed: 'chapter-cli.validate.seed',
    });
    if (!loaded.ok) {
      loaded.error.diagnostics.forEach(item => diagnostics.push(fromStageDiagnostic(item, 'loader')));
      continue;
    }
    loadedStages.push(loaded.value);
    loaded.value.diagnostics.forEach(item => diagnostics.push(fromStageDiagnostic(item, 'loader')));
    const directed = StageDirector.create(narrativeContent(loaded.value));
    if (!directed.ok) {
      directed.error.diagnostics.forEach(item => diagnostics.push(fromNarrativeDiagnostic(item)));
    }
  }

  if (catalog) {
    for (const stage of entry.stages) {
      const catalogEntry = catalog.get(stage.manifest.id);
      if (catalogEntry) catalogEntries.push(catalogEntry);
    }
  }

  const campaignCandidate = catalogEntries.some(item =>
    item.eligibility === 'campaign-eligible' || item.eligibility === 'narrative-reserved');
  const individualAvailable = catalogEntries.length === entry.stages.length &&
    catalogEntries.every(item => item.loadability === 'loadable');
  const first = catalogEntries[0];
  return finalize(
    entry,
    diagnostics,
    catalogEntries,
    loadedStages,
    campaignCandidate,
    individualAvailable,
    first?.eligibility,
    first?.loadability,
  );
}

function finalize(
  entry: CampaignChapterEntry,
  values: readonly CliDiagnostic[],
  catalogEntries: readonly StageCatalogEntry[],
  loadedStages: readonly LoadedStage[],
  campaignCandidate: boolean,
  individualAvailable: boolean,
  eligibility: ChapterValidationReport['eligibility'],
  loadability: ChapterValidationReport['loadability'],
): ChapterValidationReport {
  const diagnostics = dedupe(values);
  return Object.freeze({
    entry,
    diagnostics,
    errors: Object.freeze(diagnostics.filter(item => item.severity === 'error')),
    warnings: Object.freeze(diagnostics.filter(item => item.severity === 'warning')),
    catalogEntries: Object.freeze([...catalogEntries]),
    loadedStages: Object.freeze([...loadedStages]),
    chapter: entry.chapter,
    campaignCandidate,
    individualAvailable,
    ...(eligibility ? { eligibility } : {}),
    ...(loadability ? { loadability } : {}),
    phaserAssets: 'not-executed' as const,
  });
}
