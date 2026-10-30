import type {
  CampaignMacroDefinition,
  CampaignRegionDefinition,
  ChapterManifest,
  StageModule,
} from '../contracts';
import { StageValidator } from '../runtime/StageValidator';
import {
  AGUAS_CHAPTER_MANIFEST,
  AGUAS_CHAPTER_STAGES,
  ECO_DAS_AGUAS_DIALOGUE_ID,
  ECO_DAS_AGUAS_EVENT_ID,
  IGAPO_DAS_MEMORIAS_STAGE_ID,
} from './aguas';

/**
 * Declarative link between a campaign chapter and the macro region it fills.
 * Adding a region is data, not a branch in the central route-slice definition.
 */
export interface CampaignRegionBinding {
  readonly regionId: string;
  readonly stageId: string;
  readonly minimumManifestRevision: number;
  readonly title?: string;
  readonly dialogueIds: readonly string[];
  readonly eventIds: readonly string[];
}

/** One chapter plus its stages and the macro regions it provides content for. */
export interface CampaignChapterEntry {
  readonly chapter: ChapterManifest;
  readonly stages: readonly StageModule[];
  readonly regions: readonly CampaignRegionBinding[];
}

export interface CampaignChapterCatalogDiagnostic {
  readonly code: string;
  readonly severity: 'warning' | 'error';
  readonly message: string;
  readonly path: readonly (string | number)[];
  readonly referenceId?: string;
}

export class CampaignChapterCatalogError extends Error {
  public constructor(public readonly diagnostics: readonly CampaignChapterCatalogDiagnostic[]) {
    super('Campaign chapter catalog is incompatible with the current runtime.');
    this.name = 'CampaignChapterCatalogError';
  }
}

export const CAMPAIGN_CHAPTER_CATALOG: readonly CampaignChapterEntry[] = Object.freeze([
  Object.freeze({
    chapter: AGUAS_CHAPTER_MANIFEST,
    stages: AGUAS_CHAPTER_STAGES,
    regions: Object.freeze([
      Object.freeze({
        regionId: 'region.aguas.igapo',
        stageId: IGAPO_DAS_MEMORIAS_STAGE_ID,
        minimumManifestRevision: 1,
        title: 'Igapó das Memórias',
        dialogueIds: Object.freeze([ECO_DAS_AGUAS_DIALOGUE_ID]),
        eventIds: Object.freeze([ECO_DAS_AGUAS_EVENT_ID]),
      }),
    ]),
  }),
]);

function finish(
  diagnostics: CampaignChapterCatalogDiagnostic[],
): readonly CampaignChapterCatalogDiagnostic[] {
  diagnostics.sort((left, right) => {
    const leftKey = `${left.path.join('.')}|${left.code}|${left.referenceId ?? ''}`;
    const rightKey = `${right.path.join('.')}|${right.code}|${right.referenceId ?? ''}`;
    return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
  });
  return Object.freeze(diagnostics.map(item => Object.freeze({
    ...item,
    path: Object.freeze([...item.path]),
  })));
}

export function validateCampaignChapterCatalog(
  catalog: readonly CampaignChapterEntry[] = CAMPAIGN_CHAPTER_CATALOG,
  definition?: CampaignMacroDefinition,
): readonly CampaignChapterCatalogDiagnostic[] {
  const diagnostics: CampaignChapterCatalogDiagnostic[] = [];
  const chapters = new Set<string>();
  const regionOwners = new Map<string, number>();
  const macroRegionIds = definition
    ? new Set([
        ...definition.routes.flatMap(route => route.regions.map(region => region.id)),
        ...definition.corruptedLayer.regions.map(region => region.id),
      ])
    : undefined;
  const validator = new StageValidator();

  catalog.forEach((entry, entryIndex) => {
    if (chapters.has(entry.chapter.id)) diagnostics.push({
      code: 'catalog.chapter.duplicate', severity: 'error',
      message: `Catalog chapter is duplicated: ${entry.chapter.id}.`,
      path: ['catalog', entryIndex, 'chapter', 'id'], referenceId: entry.chapter.id,
    });
    chapters.add(entry.chapter.id);
    const modules = new Map(entry.stages.map(module => [module.manifest.id, module]));
    if (modules.size !== entry.stages.length) diagnostics.push({
      code: 'catalog.stage.duplicate', severity: 'error',
      message: 'Catalog entry contains duplicate stage IDs.', path: ['catalog', entryIndex, 'stages'],
      referenceId: entry.chapter.id,
    });
    entry.chapter.stageIds.forEach((stageId, stageIndex) => {
      if (!modules.has(stageId)) diagnostics.push({
        code: 'catalog.chapter.stage-missing', severity: 'error',
        message: `Chapter stage is absent from its catalog entry: ${stageId}.`,
        path: ['catalog', entryIndex, 'chapter', 'stageIds', stageIndex], referenceId: stageId,
      });
    });
    entry.stages.forEach((module, moduleIndex) => {
      if (!entry.chapter.stageIds.includes(module.manifest.id) ||
        module.manifest.chapterId !== entry.chapter.id) diagnostics.push({
        code: 'catalog.stage.chapter-mismatch', severity: 'error',
        message: 'Catalog stage does not belong to the declared chapter.',
        path: ['catalog', entryIndex, 'stages', moduleIndex, 'manifest', 'chapterId'],
        referenceId: module.manifest.id,
      });
      validator.validateModule(module).forEach(item => diagnostics.push({
        code: item.code, severity: item.severity, message: item.message,
        path: ['catalog', entryIndex, 'stages', moduleIndex, ...item.path],
        ...(item.referenceId ? { referenceId: item.referenceId } : {}),
      }));
    });

    entry.regions.forEach((binding, bindingIndex) => {
      const path = ['catalog', entryIndex, 'regions', bindingIndex] as const;
      const previous = regionOwners.get(binding.regionId);
      if (previous !== undefined) diagnostics.push({
        code: 'catalog.region-binding.duplicate', severity: 'error',
        message: `Region binding is duplicated: ${binding.regionId}.`,
        path: [...path, 'regionId'], referenceId: binding.regionId,
      });
      else regionOwners.set(binding.regionId, entryIndex);
      if (macroRegionIds && !macroRegionIds.has(binding.regionId)) diagnostics.push({
        code: 'catalog.region-binding.region-missing', severity: 'error',
        message: `Binding references a region absent from the macro definition: ${binding.regionId}.`,
        path: [...path, 'regionId'], referenceId: binding.regionId,
      });
      const stage = modules.get(binding.stageId);
      if (!stage) diagnostics.push({
        code: 'catalog.region-binding.stage-missing', severity: 'error',
        message: `Binding references a stage outside its chapter entry: ${binding.stageId}.`,
        path: [...path, 'stageId'], referenceId: binding.stageId,
      });
      else {
        if (!Number.isInteger(binding.minimumManifestRevision) || binding.minimumManifestRevision < 1 ||
          stage.manifest.revision < binding.minimumManifestRevision) diagnostics.push({
          code: 'catalog.region-binding.revision-incompatible', severity: 'error',
          message: 'Binding minimumManifestRevision is invalid or unavailable.',
          path: [...path, 'minimumManifestRevision'], referenceId: binding.stageId,
        });
        const dialogues = new Set((stage.dialogues ?? []).map(item => item.id));
        binding.dialogueIds.forEach((id, index) => {
          if (!dialogues.has(id)) diagnostics.push({
            code: 'catalog.region-binding.dialogue-missing', severity: 'error',
            message: `Binding dialogue is not declared by its stage: ${id}.`,
            path: [...path, 'dialogueIds', index], referenceId: id,
          });
        });
        const events = new Set((stage.events ?? []).map(item => item.id));
        binding.eventIds.forEach((id, index) => {
          if (!events.has(id)) diagnostics.push({
            code: 'catalog.region-binding.event-missing', severity: 'error',
            message: `Binding event is not declared by its stage: ${id}.`,
            path: [...path, 'eventIds', index], referenceId: id,
          });
        });
      }
    });
  });
  return finish(diagnostics);
}

function assertValidCatalog(
  catalog: readonly CampaignChapterEntry[],
  definition?: CampaignMacroDefinition,
): void {
  const diagnostics = validateCampaignChapterCatalog(catalog, definition);
  if (diagnostics.some(item => item.severity === 'error')) throw new CampaignChapterCatalogError(diagnostics);
}

export function campaignRegionBindings(
  catalog: readonly CampaignChapterEntry[] = CAMPAIGN_CHAPTER_CATALOG,
): ReadonlyMap<string, CampaignRegionBinding> {
  assertValidCatalog(catalog);
  const bindings = new Map<string, CampaignRegionBinding>();
  for (const entry of catalog) {
    for (const binding of entry.regions) {
      if (!bindings.has(binding.regionId)) bindings.set(binding.regionId, binding);
    }
  }
  return bindings;
}

function applyRegion(
  region: CampaignRegionDefinition,
  bindings: ReadonlyMap<string, CampaignRegionBinding>,
): CampaignRegionDefinition {
  const binding = bindings.get(region.id);
  if (!binding) return region;
  return Object.freeze({
    ...region,
    title: binding.title ?? region.title,
    content: Object.freeze({
      kind: 'stage' as const,
      stageId: binding.stageId,
      minimumManifestRevision: binding.minimumManifestRevision,
    }),
    narrative: Object.freeze({
      ...(region.narrative ?? {}),
      dialogueIds: Object.freeze([...binding.dialogueIds]),
      eventIds: Object.freeze([...binding.eventIds]),
    }),
  });
}

/**
 * Projects the declarative catalog onto a macro definition. Regions without a
 * binding keep whatever content they already had (normally `planned`), so they
 * never gain a loadable stage or a portal.
 */
export function applyCampaignRegionBindings(
  definition: CampaignMacroDefinition,
  catalog: readonly CampaignChapterEntry[] = CAMPAIGN_CHAPTER_CATALOG,
): CampaignMacroDefinition {
  assertValidCatalog(catalog, definition);
  const bindings = campaignRegionBindings(catalog);
  if (bindings.size === 0) return definition;
  return Object.freeze({
    ...definition,
    routes: Object.freeze(definition.routes.map(route => Object.freeze({
      ...route,
      regions: Object.freeze(route.regions.map(region => applyRegion(region, bindings))),
    }))),
    corruptedLayer: Object.freeze({
      ...definition.corruptedLayer,
      regions: Object.freeze(definition.corruptedLayer.regions.map(region => applyRegion(region, bindings))),
    }),
  });
}
