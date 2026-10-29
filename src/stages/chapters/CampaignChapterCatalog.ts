import type {
  CampaignMacroDefinition,
  CampaignRegionDefinition,
  ChapterManifest,
  StageModule,
} from '../contracts';
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

export function campaignRegionBindings(
  catalog: readonly CampaignChapterEntry[] = CAMPAIGN_CHAPTER_CATALOG,
): ReadonlyMap<string, CampaignRegionBinding> {
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
