import type {
  ChapterManifest,
  StageCampaignCatalogMetadata,
  StageCatalogCandidate,
  StageCatalogDiagnostic,
  StageCatalogEligibility,
  StageCatalogEntry,
  StageCatalogQuery,
  StageDiagnostic,
  StageModule,
  StageRuntimeCapabilityProfile,
} from '../contracts';
import { DEFAULT_STAGE_RUNTIME_CAPABILITIES } from './StageRuntimeCapabilities';
import { StageValidator } from './StageValidator';

export interface StageCatalogSource {
  listChapters(): readonly ChapterManifest[];
  listModules(): readonly StageModule[];
}

export interface StageCatalogFailure {
  readonly code: 'invalid-catalog';
  readonly diagnostics: readonly StageCatalogDiagnostic[];
}

export type StageCatalogResult =
  | { readonly ok: true; readonly value: StageCatalogService }
  | { readonly ok: false; readonly error: StageCatalogFailure };

const compare = (left: string, right: string): number => left < right ? -1 : left > right ? 1 : 0;

function diagnosticKey(value: StageCatalogDiagnostic): string {
  return `${value.path.map(String).join('.')}|${value.code}|${value.stageId ?? ''}|${value.referenceId ?? ''}`;
}

function freezeDiagnostics(values: readonly StageCatalogDiagnostic[]): readonly StageCatalogDiagnostic[] {
  return Object.freeze([...values]
    .sort((left, right) => compare(diagnosticKey(left), diagnosticKey(right)))
    .map(value => Object.freeze({ ...value, path: Object.freeze([...value.path]) })));
}

function convertDiagnostic(value: StageDiagnostic, chapterId?: string): StageCatalogDiagnostic {
  return Object.freeze({
    code: value.code,
    severity: value.severity,
    message: value.message,
    path: Object.freeze([...value.path]),
    ...(value.stageId ? { stageId: value.stageId } : {}),
    ...(chapterId ? { chapterId } : {}),
    ...(value.referenceId ? { referenceId: value.referenceId } : {}),
  });
}

function isCapabilityDiagnostic(value: StageCatalogDiagnostic): boolean {
  return value.code.startsWith('capability.');
}

function isCapabilityExclusion(value: StageCatalogDiagnostic): boolean {
  return value.code === 'capability.unknown' ||
    value.code === 'capability.unavailable' ||
    value.code === 'capability.version.unsupported';
}

function isDependencyDiagnostic(value: StageCatalogDiagnostic): boolean {
  return value.code.startsWith('chapter.dependency.') ||
    value.code.startsWith('stage.exit.chapter-dependency');
}

function isDependencyExclusion(value: StageCatalogDiagnostic): boolean {
  return value.code === 'chapter.dependency.missing' ||
    value.code === 'chapter.dependency.revision.unsupported' ||
    value.code.startsWith('stage.exit.chapter-dependency');
}

function sortedUnique(values: readonly string[] | undefined): readonly string[] {
  return Object.freeze([...new Set(values ?? [])].sort(compare));
}

function defaultMetadata(): StageCampaignCatalogMetadata {
  return Object.freeze({
    availability: 'available' as const,
    participation: 'individual-only' as const,
    role: 'standard' as const,
  });
}

function exclusion(
  stageId: string,
  chapterId: string,
  eligibility: StageCatalogEligibility,
): StageCatalogDiagnostic | undefined {
  const descriptions: Partial<Record<StageCatalogEligibility, string>> = {
    'individual-only': 'Stage is available only for individual execution.',
    'narrative-reserved': 'Stage is reserved for a narrative milestone or special position.',
    planned: 'Stage is planned and has no playable campaign availability.',
  };
  const message = descriptions[eligibility];
  if (!message) return undefined;
  return Object.freeze({
    code: `stage-catalog.excluded.${eligibility}`,
    severity: 'warning' as const,
    message,
    path: Object.freeze(['stages', stageId, 'campaignCatalog']),
    stageId,
    chapterId,
    referenceId: stageId,
  });
}

function mergeCapabilities(
  chapter: ChapterManifest,
  module: StageModule,
): StageCatalogEntry['capabilityRequirements'] {
  const merged = new Map<string, StageCatalogEntry['capabilityRequirements'][number]>();
  for (const requirement of [...(chapter.capabilities ?? []), ...(module.manifest.capabilities ?? [])]) {
    const previous = merged.get(requirement.id);
    merged.set(requirement.id, Object.freeze({
      ...requirement,
      minimumVersion: Math.max(previous?.minimumVersion ?? 0, requirement.minimumVersion),
      requirement: previous?.requirement === 'required' || requirement.requirement === 'required'
        ? 'required' : 'optional',
    }));
  }
  for (const biomeId of module.manifest.campaignCatalog?.biomeIds ?? []) {
    const id = `biome.${biomeId}`;
    const previous = merged.get(id);
    merged.set(id, Object.freeze({
      id,
      category: 'biome' as const,
      minimumVersion: Math.max(previous?.minimumVersion ?? 0, 1),
      requirement: 'required' as const,
    }));
  }
  return Object.freeze([...merged.values()].sort((left, right) => compare(left.id, right.id)));
}

function relevantDiagnostics(
  diagnostics: readonly StageCatalogDiagnostic[],
  stageId: string,
  chapterId: string,
): readonly StageCatalogDiagnostic[] {
  return freezeDiagnostics(diagnostics.filter(value =>
    value.stageId === stageId ||
    value.path.some(part => part === stageId) ||
    ((isCapabilityDiagnostic(value) || isDependencyDiagnostic(value)) &&
      (value.chapterId === chapterId || value.path.some(part => part === chapterId))),
  ));
}

function catalogEntry(
  module: StageModule,
  chapter: ChapterManifest,
  diagnostics: readonly StageCatalogDiagnostic[],
): StageCatalogEntry {
  const manifest = module.manifest;
  const metadata = manifest.campaignCatalog ?? defaultMetadata();
  const relevant = relevantDiagnostics(diagnostics, manifest.id, chapter.id);
  const capabilityErrors = relevant.filter(value =>
    value.severity === 'error' && isCapabilityExclusion(value));
  const dependencyErrors = relevant.filter(value =>
    value.severity === 'error' && isDependencyExclusion(value));
  const loadability = metadata.availability === 'planned'
    ? 'planned' as const
    : capabilityErrors.length > 0
      ? 'capability-incompatible' as const
      : dependencyErrors.length > 0
        ? 'dependency-blocked' as const
        : 'loadable' as const;
  const eligibility: StageCatalogEligibility = loadability === 'planned'
    ? 'planned'
    : loadability === 'capability-incompatible'
      ? 'capability-incompatible'
      : loadability === 'dependency-blocked'
        ? 'dependency-blocked'
        : metadata.participation === 'candidate'
          ? 'campaign-eligible'
          : metadata.participation === 'narrative-milestone'
            ? 'narrative-reserved'
            : 'individual-only';
  const explicitExclusion = exclusion(manifest.id, chapter.id, eligibility);
  const exclusionDiagnostics = freezeDiagnostics([
    ...relevant.filter(value => value.severity === 'error').map(value => ({
      ...value,
      stageId: manifest.id,
      chapterId: chapter.id,
    })),
    ...(explicitExclusion ? [explicitExclusion] : []),
  ]);
  const exitCapacity = metadata.maximumPhysicalExits ??
    Math.max(1, Math.min(3, manifest.exits.length)) as 1 | 2 | 3;
  return Object.freeze({
    stageId: manifest.id,
    chapterId: chapter.id,
    manifestRevision: manifest.revision,
    chapterRevision: chapter.revision,
    title: manifest.title,
    summary: manifest.summary,
    layoutKind: manifest.layout.kind,
    availability: metadata.availability,
    participation: metadata.participation,
    role: metadata.role,
    regionIds: sortedUnique(metadata.regionIds),
    biomeIds: sortedUnique(metadata.biomeIds),
    ...(metadata.difficulty ? { difficulty: Object.freeze({ ...metadata.difficulty }) } : {}),
    allowedActIds: sortedUnique(metadata.allowedActIds),
    maximumPhysicalExits: exitCapacity,
    revisit: metadata.revisit ?? 'checkpoint',
    requiredEventIds: sortedUnique(metadata.requiredEventIds),
    requiredBeatIds: sortedUnique(metadata.requiredBeatIds),
    providesBeatIds: sortedUnique(metadata.providesBeatIds),
    capabilityRequirements: mergeCapabilities(chapter, module),
    chapterDependencies: Object.freeze([...(chapter.dependencies ?? [])]
      .sort((left, right) => compare(left.chapterId, right.chapterId))
      .map(value => Object.freeze({ ...value }))),
    ...(manifest.entryDialogueId ? { entryDialogueId: manifest.entryDialogueId } : {}),
    ...(manifest.completionMissionId ? { completionMissionId: manifest.completionMissionId } : {}),
    exitIds: sortedUnique(manifest.exits.map(value => value.id)),
    targetStageIds: sortedUnique(manifest.exits.map(value => value.targetStageId)),
    loadability,
    eligibility,
    exclusionDiagnostics,
  });
}

function duplicateDiagnostics(
  chapters: readonly ChapterManifest[],
  modules: readonly StageModule[],
): readonly StageCatalogDiagnostic[] {
  const diagnostics: StageCatalogDiagnostic[] = [];
  const addDuplicates = (
    values: readonly string[],
    kind: 'chapter' | 'stage',
  ): void => {
    const seen = new Set<string>();
    values.forEach((id, index) => {
      if (seen.has(id)) diagnostics.push({
        code: `stage-catalog.${kind}-id.duplicate`, severity: 'error',
        message: `${kind === 'stage' ? 'Stage' : 'Chapter'} ID is duplicated: ${id}.`,
        path: [kind === 'stage' ? 'stages' : 'chapters', index, 'id'],
        ...(kind === 'stage' ? { stageId: id } : { chapterId: id }), referenceId: id,
      });
      seen.add(id);
    });
  };
  addDuplicates(chapters.map(value => value.id), 'chapter');
  addDuplicates(modules.map(value => value.manifest.id), 'stage');
  return freezeDiagnostics(diagnostics);
}

/** Immutable, headless projection of definitions already owned by StageRegistry. */
export class StageCatalogService {
  private readonly byId: ReadonlyMap<string, StageCatalogEntry>;

  private constructor(
    private readonly entries: readonly StageCatalogEntry[],
    private readonly diagnosticValues: readonly StageCatalogDiagnostic[],
  ) {
    this.byId = new Map(entries.map(entry => [entry.stageId, entry]));
  }

  public static create(
    source: StageCatalogSource,
    capabilityProfile: StageRuntimeCapabilityProfile = DEFAULT_STAGE_RUNTIME_CAPABILITIES,
  ): StageCatalogResult {
    const chapters = [...source.listChapters()].sort((left, right) => compare(left.id, right.id));
    const modules = [...source.listModules()].sort((left, right) => compare(left.manifest.id, right.manifest.id));
    const chapterById = new Map(chapters.map(chapter => [chapter.id, chapter]));
    const stageChapterById = new Map(modules.map(module => [
      module.manifest.id, module.manifest.chapterId,
    ]));
    const duplicates = duplicateDiagnostics(chapters, modules);
    const validated = new StageValidator(capabilityProfile).validate(chapters, modules)
      .map(value => convertDiagnostic(
        value,
        value.path[0] === 'chapters' && typeof value.path[1] === 'string'
          ? value.path[1] : value.stageId ? stageChapterById.get(value.stageId) : undefined,
      ));
    const diagnostics = freezeDiagnostics([...duplicates, ...validated]);
    const fatal = diagnostics.filter(value => value.severity === 'error' &&
      !isCapabilityExclusion(value) && !isDependencyExclusion(value));
    if (fatal.length > 0) return Object.freeze({
      ok: false as const,
      error: Object.freeze({ code: 'invalid-catalog' as const, diagnostics }),
    });
    const entries = Object.freeze(modules.map(module =>
      catalogEntry(module, chapterById.get(module.manifest.chapterId) as ChapterManifest, diagnostics)));
    const exclusions = entries.flatMap(entry => entry.exclusionDiagnostics);
    const value = new StageCatalogService(
      entries,
      freezeDiagnostics([...diagnostics, ...exclusions]),
    );
    Object.freeze(value);
    return Object.freeze({
      ok: true as const,
      value,
    });
  }

  public list(): readonly StageCatalogEntry[] {
    return this.entries;
  }

  public get(stageId: string): StageCatalogEntry | undefined {
    return this.byId.get(stageId);
  }

  public listByChapter(chapterId: string): readonly StageCatalogEntry[] {
    return Object.freeze(this.entries.filter(entry => entry.chapterId === chapterId));
  }

  public query(filter: StageCatalogQuery = {}): readonly StageCatalogEntry[] {
    return Object.freeze(this.entries.filter(entry =>
      (filter.chapterId === undefined || entry.chapterId === filter.chapterId) &&
      (filter.regionId === undefined || entry.regionIds.includes(filter.regionId)) &&
      (filter.biomeId === undefined || entry.biomeIds.includes(filter.biomeId)) &&
      (filter.role === undefined || entry.role === filter.role) &&
      (filter.difficulty === undefined || !!entry.difficulty &&
        entry.difficulty.minimum <= filter.difficulty && entry.difficulty.maximum >= filter.difficulty) &&
      (filter.loadability === undefined || entry.loadability === filter.loadability) &&
      (filter.eligibility === undefined || entry.eligibility === filter.eligibility)));
  }

  public eligible(): readonly StageCatalogEntry[] {
    return this.query({ eligibility: 'campaign-eligible' });
  }

  public incompatible(): readonly StageCatalogEntry[] {
    return Object.freeze(this.entries.filter(entry =>
      entry.eligibility === 'capability-incompatible' || entry.eligibility === 'dependency-blocked'));
  }

  public diagnostics(stageId?: string): readonly StageCatalogDiagnostic[] {
    return stageId === undefined
      ? this.diagnosticValues
      : Object.freeze(this.diagnosticValues.filter(value => value.stageId === stageId));
  }

  public candidates(): readonly StageCatalogCandidate[] {
    return Object.freeze(this.eligible().map(entry => Object.freeze({
      stageId: entry.stageId,
      chapterId: entry.chapterId,
      manifestRevision: entry.manifestRevision,
      chapterRevision: entry.chapterRevision,
      role: entry.role,
      regionIds: entry.regionIds,
      biomeIds: entry.biomeIds,
      ...(entry.difficulty ? { difficulty: entry.difficulty } : {}),
      allowedActIds: entry.allowedActIds,
      maximumPhysicalExits: entry.maximumPhysicalExits,
      revisit: entry.revisit,
      requiredEventIds: entry.requiredEventIds,
      requiredBeatIds: entry.requiredBeatIds,
      providesBeatIds: entry.providesBeatIds,
    })));
  }
}
